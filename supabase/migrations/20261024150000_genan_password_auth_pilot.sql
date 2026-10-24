-- Genan: temporary phone + password registration pilot, no OTP.
-- Never store raw customer passwords in public tables: Supabase Auth owns password hashes.

create table if not exists private.genan_signup_rate_limits (
  key_hash text primary key,
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0,
  updated_at timestamptz not null default now()
);
alter table private.genan_signup_rate_limits enable row level security;

-- Called by the SERVICE ROLE exclusively from the registration Edge Function.
create or replace function public.genan_signup_allowed(p_key_hash text, p_max_attempts integer)
returns boolean
language plpgsql security definer
set search_path = ''
as $$
declare
  v_attempts integer;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role'
     or p_key_hash is null or p_key_hash !~ '^[0-9a-f]{64}$'
     or p_max_attempts not between 1 and 30 then
    return false;
  end if;

  insert into private.genan_signup_rate_limits as limits (key_hash, window_started_at, attempt_count, updated_at)
  values (p_key_hash, now(), 1, now())
  on conflict (key_hash) do update
  set attempt_count = case
    when limits.window_started_at < now() - interval '1 hour' then 1
    else limits.attempt_count + 1 end,
      window_started_at = case
    when limits.window_started_at < now() - interval '1 hour' then now()
    else limits.window_started_at end,
      updated_at = now()
  returning attempt_count into v_attempts;

  return v_attempts <= p_max_attempts;
end;
$$;
revoke all on function public.genan_signup_allowed(text, integer) from public, anon, authenticated;
grant execute on function public.genan_signup_allowed(text, integer) to service_role;

-- Password + an explicit admin role is sufficient for this temporary pilot.
-- Never grant the admin role from a public registration endpoint.
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _user_id and ur.role = _role
  );
$$;

-- IMPORTANT: refuse non-admin users. The old gate accidentally returned TRUE
-- for non-admin users; this is a privilege-escalation flaw, not a feature.
create or replace function private.admin_permission_gate(p_permissions text[])
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select
    (select auth.uid()) is not null
    and exists (
      select 1 from public.user_roles ur
      where ur.user_id = (select auth.uid())
        and ur.role = 'admin'::public.app_role
    )
    and exists (
      select 1
      from unnest(coalesce(p_permissions, '{}'::text[])) as requested(permission)
      where coalesce((
        select aup.granted
        from public.admin_user_permissions aup
        where aup.user_id = (select auth.uid())
          and aup.permission = requested.permission
      ), true)
    );
$$;

create or replace function private.require_admin_permission(p_permission text)
returns void
language plpgsql security definer
set search_path = ''
as $$
declare
  v_actor uuid := auth.uid();
  v_role text := coalesce(current_setting('request.jwt.claims', true)::jsonb ->> 'role', '');
  v_granted boolean;
begin
  if v_role = 'service_role' then return; end if;
  if v_actor is null or not exists (
    select 1 from public.user_roles ur
    where ur.user_id = v_actor
      and ur.role = 'admin'::public.app_role
  ) then
    raise exception 'admin access required' using errcode = '42501';
  end if;

  select coalesce((
    select aup.granted
    from public.admin_user_permissions aup
    where aup.user_id = v_actor and aup.permission = p_permission
  ), true) into v_granted;
  if not v_granted then
    raise exception 'admin permission % required', p_permission using errcode = '42501';
  end if;
end;
$$;

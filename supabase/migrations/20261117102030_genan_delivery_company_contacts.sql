create table public.delivery_company_contacts (
  delivery_company_id uuid primary key references public.delivery_companies(id) on delete cascade,
  phone text not null check (phone ~ '^[+][1-9][0-9]{6,14}$')
);

alter table public.delivery_company_contacts enable row level security;
revoke all on public.delivery_company_contacts from public, anon, authenticated;
grant select, insert, update, delete on public.delivery_company_contacts to authenticated;

create policy "Admins manage delivery company contacts"
on public.delivery_company_contacts
for all to authenticated
using ((select public.has_role(auth.uid(), 'admin'::public.app_role)))
with check ((select public.has_role(auth.uid(), 'admin'::public.app_role)));

create function public.admin_save_delivery_company(
  p_company_id uuid,
  p_name text,
  p_country text,
  p_base_fee numeric,
  p_delivery_days text,
  p_service_scope text,
  p_is_active boolean,
  p_phone text
) returns uuid
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  saved_id uuid;
begin
  if p_company_id is null then
    insert into public.delivery_companies (name, country, base_fee, delivery_days, service_scope, is_active)
    values (p_name, p_country, p_base_fee, p_delivery_days, p_service_scope, p_is_active)
    returning id into saved_id;
  else
    update public.delivery_companies
    set name = p_name,
        country = p_country,
        base_fee = p_base_fee,
        delivery_days = p_delivery_days,
        service_scope = p_service_scope,
        is_active = p_is_active
    where id = p_company_id
    returning id into saved_id;

    if saved_id is null then
      raise exception 'تعذر تحديث شركة التوصيل' using errcode = '42501';
    end if;
  end if;

  if p_phone is null then
    delete from public.delivery_company_contacts where delivery_company_id = saved_id;
  else
    insert into public.delivery_company_contacts (delivery_company_id, phone)
    values (saved_id, p_phone)
    on conflict (delivery_company_id) do update set phone = excluded.phone;
  end if;

  return saved_id;
end;
$function$;

revoke execute on function public.admin_save_delivery_company(uuid, text, text, numeric, text, text, boolean, text)
from public, anon;
grant execute on function public.admin_save_delivery_company(uuid, text, text, numeric, text, text, boolean, text)
to authenticated;

do $grant_guard$ begin if to_regprocedure('public.customer_register(text,text,text,text,text)') is not null then execute 'revoke execute on function public.customer_register(text,text,text,text,text) from public, anon, authenticated;'; end if; end $grant_guard$;

do $grant_guard$ begin if to_regprocedure('public.customer_self(uuid,text)') is not null then execute 'revoke execute on function public.customer_self(uuid,text) from public, anon;'; end if; end $grant_guard$;
do $grant_guard$ begin if to_regprocedure('public.customer_self(uuid,text)') is not null then execute 'grant execute on function public.customer_self(uuid,text) to authenticated;'; end if; end $grant_guard$;

do $grant_guard$ begin if to_regprocedure('public.customer_update_self(uuid,text,text,text,text)') is not null then execute 'revoke execute on function public.customer_update_self(uuid,text,text,text,text) from public, anon;'; end if; end $grant_guard$;
do $grant_guard$ begin if to_regprocedure('public.customer_update_self(uuid,text,text,text,text)') is not null then execute 'grant execute on function public.customer_update_self(uuid,text,text,text,text) to authenticated;'; end if; end $grant_guard$;

do $grant_guard$ begin if to_regprocedure('public.normalize_customer_address_owner()') is not null then execute 'revoke execute on function public.normalize_customer_address_owner() from public, anon, authenticated;'; end if; end $grant_guard$;

do $grant_guard$ begin if to_regprocedure('public.get_order_by_tracking(text,text)') is not null then execute 'revoke execute on function public.get_order_by_tracking(text,text) from public, anon, authenticated;'; end if; end $grant_guard$;

do $grant_guard$ begin if to_regprocedure('public.customer_login(text,text)') is not null then execute 'revoke execute on function public.customer_login(text,text) from public;'; end if; end $grant_guard$;
do $grant_guard$ begin if to_regprocedure('public.customer_login(text,text)') is not null then execute 'grant execute on function public.customer_login(text,text) to anon, authenticated, service_role;'; end if; end $grant_guard$;

do $grant_guard$ begin if to_regprocedure('public.create_secure_order(uuid,text,text,text,text,text,text,text,jsonb,numeric,numeric,numeric,text,text,text,numeric,numeric,text,numeric)') is not null then execute 'revoke execute on function public.create_secure_order(uuid,text,text,text,text,text,text,text,jsonb,numeric,numeric,numeric,text,text,text,numeric,numeric,text,numeric) from public;'; end if; end $grant_guard$;
do $grant_guard$ begin if to_regprocedure('public.create_secure_order(uuid,text,text,text,text,text,text,text,jsonb,numeric,numeric,numeric,text,text,text,numeric,numeric,text,numeric)') is not null then execute 'grant execute on function public.create_secure_order(uuid,text,text,text,text,text,text,text,jsonb,numeric,numeric,numeric,text,text,text,numeric,numeric,text,numeric) to anon, authenticated, service_role;'; end if; end $grant_guard$;

do $grant_guard$ begin if to_regprocedure('public.get_order_tracking(text,text)') is not null then execute 'revoke execute on function public.get_order_tracking(text,text) from public;'; end if; end $grant_guard$;
do $grant_guard$ begin if to_regprocedure('public.get_order_tracking(text,text)') is not null then execute 'grant execute on function public.get_order_tracking(text,text) to anon, authenticated, service_role;'; end if; end $grant_guard$;

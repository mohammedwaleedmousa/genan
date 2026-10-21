do $func_guard$ begin if to_regprocedure('public.mark_stale_customer_carts()') is not null then execute 'revoke execute on function public.mark_stale_customer_carts() from public, anon, authenticated;'; end if; end $func_guard$;
do $func_guard$ begin if to_regprocedure('public.mark_stale_customer_carts()') is not null then execute 'grant execute on function public.mark_stale_customer_carts() to service_role;'; end if; end $func_guard$;

do $func_guard$ begin if to_regprocedure('public.bind_product_review_identity()') is not null then execute 'revoke execute on function public.bind_product_review_identity() from public, anon, authenticated;'; end if; end $func_guard$;
do $func_guard$ begin if to_regprocedure('public.bind_product_review_identity()') is not null then execute 'grant execute on function public.bind_product_review_identity() to service_role;'; end if; end $func_guard$;

do $func_guard$ begin if to_regprocedure('public.current_customer_id()') is not null then execute 'revoke execute on function public.current_customer_id() from anon;'; end if; end $func_guard$;

-- Performance-only stabilization. No UI or business behavior changes.
-- Cache auth.uid() once per statement for hot-path RLS policies.

alter policy "Admins can manage products" on public.products
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

alter policy "Admins can manage orders" on public.orders
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

alter policy "customers view own orders" on public.orders
  using (
    owner_user_id = (select auth.uid())
    or exists (
      select 1
      from public.customers c
      where c.user_id = (select auth.uid())
        and (orders.customer_id = c.id or orders.customer_phone = c.phone)
    )
  );

DO $guard$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customer_carts' AND policyname='customer_carts_select_own') THEN
    EXECUTE $policy_sql$alter policy "customer_carts_select_own" on public.customer_carts
  using ((select auth.uid()) = user_id);$policy_sql$;
  END IF;
END $guard$;

DO $guard$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customer_carts' AND policyname='customer_carts_insert_own') THEN
    EXECUTE $policy_sql$alter policy "customer_carts_insert_own" on public.customer_carts
  with check ((select auth.uid()) = user_id);$policy_sql$;
  END IF;
END $guard$;

DO $guard$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='customer_carts' AND policyname='customer_carts_update_own') THEN
    EXECUTE $policy_sql$alter policy "customer_carts_update_own" on public.customer_carts
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);$policy_sql$;
  END IF;
END $guard$;

DO $guard$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='inventory_skus' AND policyname='Admins manage inventory skus') THEN
    EXECUTE $policy_sql$alter policy "Admins manage inventory skus" on public.inventory_skus
  using (public.has_role((select auth.uid()), 'admin'::public.app_role))
  with check (public.has_role((select auth.uid()), 'admin'::public.app_role));$policy_sql$;
  END IF;
END $guard$;

alter policy "Admins can read events" on public.analytics_events
  using (public.has_role((select auth.uid()), 'admin'::public.app_role));

-- Cover the orders -> currencies foreign key used by reporting/filtering paths.
create index if not exists orders_currency_code_idx on public.orders(currency_code);

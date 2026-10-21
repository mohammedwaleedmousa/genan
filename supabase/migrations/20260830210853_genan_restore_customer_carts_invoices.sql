-- Rebuild prerequisites omitted from the original Git-tracked schema.
CREATE TABLE IF NOT EXISTS public.customer_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  item_count integer NOT NULL DEFAULT 0 CHECK (item_count >= 0),
  cart_value numeric NOT NULL DEFAULT 0 CHECK (cart_value >= 0),
  currency text NOT NULL DEFAULT 'SAR',
  status text NOT NULL DEFAULT 'active',
  converted_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  abandoned_at timestamptz,
  last_activity_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customer_carts_user_idx ON public.customer_carts(user_id,last_activity_at DESC);
ALTER TABLE public.customer_carts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "customer carts owner select" ON public.customer_carts FOR SELECT TO authenticated USING ((select auth.uid())=user_id OR public.has_role((select auth.uid()), 'admin'::public.app_role));
CREATE POLICY "customer carts owner insert" ON public.customer_carts FOR INSERT TO authenticated WITH CHECK ((select auth.uid())=user_id);
CREATE POLICY "customer carts owner update" ON public.customer_carts FOR UPDATE TO authenticated USING ((select auth.uid())=user_id) WITH CHECK ((select auth.uid())=user_id);
CREATE POLICY "customer carts owner delete" ON public.customer_carts FOR DELETE TO authenticated USING ((select auth.uid())=user_id);
GRANT SELECT,INSERT,UPDATE,DELETE ON public.customer_carts TO authenticated;

CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  order_number text NOT NULL,
  file_name text NOT NULL,
  file_url text NOT NULL,
  customer_name text,
  customer_phone text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "genan admins view invoices" ON public.invoices FOR SELECT TO authenticated USING (public.has_role((select auth.uid()),'admin'::public.app_role));
CREATE POLICY "genan admins manage invoices" ON public.invoices FOR ALL TO authenticated USING (public.has_role((select auth.uid()),'admin'::public.app_role)) WITH CHECK (public.has_role((select auth.uid()),'admin'::public.app_role));
GRANT SELECT,INSERT,UPDATE,DELETE ON public.invoices TO authenticated;

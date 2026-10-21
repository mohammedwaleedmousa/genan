-- Restore structures present in generated Genan types but absent from legacy SQL history.
-- These tables start empty. Never seed unverified products, prices, or customer data.
CREATE TABLE IF NOT EXISTS public.brand_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_id uuid NOT NULL UNIQUE REFERENCES public.brands(id) ON DELETE CASCADE,
  title text, description text, hero_image text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.brand_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_page_id uuid NOT NULL REFERENCES public.brand_pages(id) ON DELETE CASCADE,
  image_url text NOT NULL, title text, subtitle text, link text,
  sort_order integer DEFAULT 0, is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.brand_section_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id uuid REFERENCES public.brand_sections(id) ON DELETE CASCADE,
  slug text, title text, description text, banner_url text,
  is_active boolean DEFAULT true, created_at timestamptz DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.product_brand_filters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  filter_id uuid NOT NULL REFERENCES public.brand_filters(id) ON DELETE CASCADE,
  UNIQUE(product_id, filter_id)
);
CREATE TABLE IF NOT EXISTS public.customer_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.brand_sections
  ADD COLUMN IF NOT EXISTS brand_page_id uuid REFERENCES public.brand_pages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_name text;
ALTER TABLE public.brand_filters
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.brand_sections(id) ON DELETE CASCADE;
ALTER TABLE public.campaign_pages
  ADD COLUMN IF NOT EXISTS badge_text text,
  ADD COLUMN IF NOT EXISTS cta_url text,
  ADD COLUMN IF NOT EXISTS ends_at timestamptz,
  ADD COLUMN IF NOT EXISTS mobile_image_url text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS starts_at timestamptz;
ALTER TABLE public.customer_notifications
  ADD COLUMN IF NOT EXISTS message text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS related_order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS avatar_url text,
  ADD COLUMN IF NOT EXISTS password_hash text,
  ADD COLUMN IF NOT EXISTS region text;
ALTER TABLE public.financial_transactions
  ADD COLUMN IF NOT EXISTS amount_base numeric,
  ADD COLUMN IF NOT EXISTS currency_code text;
ALTER TABLE public.inventory_adjustments
  ADD COLUMN IF NOT EXISTS inventory_sku_id uuid REFERENCES public.inventory_skus(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS product_quantity_after integer,
  ADD COLUMN IF NOT EXISTS product_quantity_before integer,
  ADD COLUMN IF NOT EXISTS variant_label text;
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS apply_to_all boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS badge_text text,
  ADD COLUMN IF NOT EXISTS cta_label text,
  ADD COLUMN IF NOT EXISTS cta_url text,
  ADD COLUMN IF NOT EXISTS mobile_image_url text,
  ADD COLUMN IF NOT EXISTS offer_type text NOT NULL DEFAULT 'standard';
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS invoice_review_note text;
ALTER TABLE public.product_reviews
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.refunds
  ADD COLUMN IF NOT EXISTS admin_notes text,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS refund_type text;

-- Secure new tables; only active catalog material is readable anonymously.
ALTER TABLE public.brand_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.brand_section_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_brand_filters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public active brand pages" ON public.brand_pages FOR SELECT TO anon, authenticated USING (is_active = true);
CREATE POLICY "admin manage brand pages" ON public.brand_pages FOR ALL TO authenticated USING (public.has_role((select auth.uid()),'admin'::public.app_role)) WITH CHECK (public.has_role((select auth.uid()),'admin'::public.app_role));
CREATE POLICY "public active brand banners" ON public.brand_banners FOR SELECT TO anon, authenticated USING (
  is_active = true AND EXISTS(SELECT 1 FROM public.brand_pages bp WHERE bp.id = brand_page_id AND bp.is_active = true)
);
CREATE POLICY "admin manage brand banners" ON public.brand_banners FOR ALL TO authenticated USING (public.has_role((select auth.uid()),'admin'::public.app_role)) WITH CHECK (public.has_role((select auth.uid()),'admin'::public.app_role));
CREATE POLICY "public active brand section pages" ON public.brand_section_pages FOR SELECT TO anon, authenticated USING (
  is_active = true AND EXISTS(SELECT 1 FROM public.brand_sections bs WHERE bs.id = section_id AND bs.is_active = true)
);
CREATE POLICY "admin manage brand section pages" ON public.brand_section_pages FOR ALL TO authenticated USING (public.has_role((select auth.uid()),'admin'::public.app_role)) WITH CHECK (public.has_role((select auth.uid()),'admin'::public.app_role));
CREATE POLICY "admin manage product brand filters" ON public.product_brand_filters FOR ALL TO authenticated USING (public.has_role((select auth.uid()),'admin'::public.app_role)) WITH CHECK (public.has_role((select auth.uid()),'admin'::public.app_role));
CREATE POLICY "public active product filter mappings" ON public.product_brand_filters FOR SELECT TO anon,authenticated USING (
  EXISTS(SELECT 1 FROM public.products p WHERE p.id=product_id AND p.is_active=true)
);

GRANT SELECT ON public.brand_pages, public.brand_banners, public.brand_section_pages, public.product_brand_filters TO anon;
GRANT SELECT,INSERT,UPDATE,DELETE ON public.brand_pages, public.brand_banners, public.brand_section_pages, public.product_brand_filters TO authenticated;
REVOKE ALL ON TABLE public.customer_sessions FROM PUBLIC, anon, authenticated;

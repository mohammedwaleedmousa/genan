-- Recover storefront/editorial banner metadata missing from original SQL migrations.
ALTER TABLE public.banners
 ADD COLUMN IF NOT EXISTS page_slug text,
 ADD COLUMN IF NOT EXISTS page_title_ar text,
 ADD COLUMN IF NOT EXISTS page_content text,
 ADD COLUMN IF NOT EXISTS page_content_ar text;

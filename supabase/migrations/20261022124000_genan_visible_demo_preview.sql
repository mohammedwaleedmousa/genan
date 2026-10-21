-- Visible demo preview for GENAN. These rows are MOCK examples only.
-- Products remain out of stock, checkout unavailable and actual customer orders prohibited.
-- Only the specifically prefixed test catalog is affected.
ALTER TABLE public.products DROP CONSTRAINT IF EXISTS genan_demo_20261022_non_sale;
ALTER TABLE public.products ADD CONSTRAINT genan_demo_20261022_non_sale
  CHECK (
    slug NOT LIKE 'genan-demo-20261022-%'
    OR (in_stock IS FALSE AND stock_quantity = 0)
  );

UPDATE public.products
SET is_active = true
WHERE slug LIKE 'genan-demo-20261022-%'
  AND in_stock IS FALSE
  AND stock_quantity = 0
  AND is_active IS NOT TRUE;

-- The original category rows have no covers after the deleted-project recovery.
-- Point only empty covers at illustrations stored in this GitHub repository.
UPDATE public.categories SET image_url = '/demo/launch-belt-ivory.svg'
WHERE slug='belts' AND (image_url IS NULL OR btrim(image_url)='');
UPDATE public.categories SET image_url = '/demo/launch-cap-ivory.svg'
WHERE slug='caps' AND (image_url IS NULL OR btrim(image_url)='');
UPDATE public.categories SET image_url = '/demo/launch-socks-ivory.svg'
WHERE slug='socks' AND (image_url IS NULL OR btrim(image_url)='');
UPDATE public.categories SET image_url = '/demo/launch-home-ivory.svg'
WHERE slug='home' AND (image_url IS NULL OR btrim(image_url)='');

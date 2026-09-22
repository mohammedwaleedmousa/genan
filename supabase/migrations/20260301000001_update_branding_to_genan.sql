-- Genan storefront branding.
-- Keep the existing contact/payment configuration and only normalize visible brand fields.

UPDATE public.site_settings
SET value = jsonb_set(COALESCE(value::jsonb, '{}'::jsonb), '{name}', '"Genan"'::jsonb, true)
WHERE key = 'store_info';

UPDATE public.site_content
SET content = 'Genan',
    content_ar = 'جنان'
WHERE key = 'about_title';

UPDATE public.site_content
SET content = 'Genan is a curated destination for fashion, accessories, and selected lifestyle pieces.',
    content_ar = 'جنان وجهة منتقاة للأزياء والإكسسوارات والقطع المختارة بعناية.'
WHERE key = 'about_description';

UPDATE public.site_content
SET content = '© 2026 Genan. All rights reserved.',
    content_ar = '© 2026 جنان. جميع الحقوق محفوظة.'
WHERE key = 'footer_copyright';

UPDATE public.site_content
SET content = 'Welcome to Genan',
    content_ar = 'مرحباً بكم في جنان'
WHERE key = 'about_hero_title';

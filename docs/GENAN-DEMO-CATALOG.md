# GENAN test catalog — 2026-10-22

## Demo inventory (not for sale)

This one-time QA seed added 24 example products to the Genan Prod Supabase project (`ydpvfsemhbrkhtjjjwqs`) with existing, active category relations:
- Belts — 6
- Caps — 6
- Socks — 6
- Home — 6

All products:
- Slug prefix: `genan-demo-20261022-`
- `is_active = true` — public **preview only**, never genuine stock.
- `in_stock = false`
- `stock_quantity = 0`
- No actual brand is claimed or assigned.
- Mock prices only, denominated in SAR; these are **not approved sale prices**.
- Description explicitly says the listing is a demo and not for sale.
- Two sample colors per item and 84 SKU rows, all zero inventory.
- Two branded SVG illustrations per category (8 total), committed under `public/demo/launch-*.svg`.

## Validation completed

- 24 products with the demo prefix
- 24 demo products active and visible to the anonymous storefront
- 0 demo products in stock
- 0 demo products with missing images
- 84 SKU records, 0 nonzero stock
- Anonymous database role sees all 24 demo products (verified)

## Source and cleanup

Manual seed SQL: `scripts/seeds/genan_demo_drafts_20261022.sql`.

If a fresh environment needs the same samples for QA, run the SQL **explicitly** on that environment; it is deliberately not stored under `supabase/migrations` to avoid automatic production seeding.

Once testing is complete, delete **only** the rows carrying the exact demo prefix:

```sql
BEGIN;
DELETE FROM public.products
WHERE slug LIKE 'genan-demo-20261022-%';
COMMIT;
```

Related inventory SKU rows are removed by cascade on product deletion.

Products are visible for display, but they MUST remain unavailable for sale. The database CHECK constraint `genan_demo_20261022_non_sale` prevents turning `in_stock` on or giving these demo products nonzero product stock. An actual test confirmed a sellable update is rejected. Never use mock prices for real checkout or represent illustrations as supplier-provided merchandise. Real catalog launch requires authentic prices, accurate stock, and licensed photographs.

## Limitations

QA proof covers database records, anonymous data-visibility checks, and the protection against mistakenly making demo products saleable. Home page now has a dedicated, labelled demo showcase; all 24 display on `/products` when Cloudflare uses the correct Supabase project. Cloudflare deployment and a rendered-browser test have not been directly verified. After a new deploy, confirm site and images on both mobile and desktop.

## Why the previews were initially invisible and the fix

The initial seed wrote `is_active=false`, while all customer-facing product queries require `is_active=true`. On 2026-10-22, demo rows were explicitly activated **without enabling sales**. Category covers were assigned to local demo SVG artwork, product cards show `عرض تجريبي`, and the home page has a clearly labelled preview rail. The change is recorded in `supabase/migrations/20261022124000_genan_visible_demo_preview.sql` (the seed itself is separate and opt-in).

If users still see no products, first verify the Cloudflare build's `VITE_SUPABASE_URL` and publishable key refer to `ydpvfsemhbrkhtjjjwqs`; an old environment variable overrides the committed client fallback. Then use `/api/store-health`, inspect the browser's network requests for `products`, and perform a hard refresh.

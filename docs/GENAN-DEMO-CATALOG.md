# GENAN test catalog — 2026-10-22

## Demo inventory (not for sale)

This one-time QA seed added 24 example products to the Genan Prod Supabase project (`ydpvfsemhbrkhtjjjwqs`) with existing, active category relations:
- Belts — 6
- Caps — 6
- Socks — 6
- Home — 6

All products:
- Slug prefix: `genan-demo-20261022-`
- `is_active = false`
- `in_stock = false`
- `stock_quantity = 0`
- No actual brand is claimed or assigned.
- Mock prices only, denominated in SAR; these are **not approved sale prices**.
- Description explicitly says the listing is a demo and not for sale.
- Two sample colors per item and 84 SKU rows, all zero inventory.
- Two branded SVG illustrations per category (8 total), committed under `public/demo/launch-*.svg`.

## Validation completed

- 24 products with the demo prefix
- 0 demo products active
- 0 demo products in stock
- 0 demo products with missing images
- 84 SKU records, 0 nonzero stock
- Anonymous database role cannot see the demo products (0 results)

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

Never activate these products, use the demo prices for real checkout, or represent their visual illustrations as supplier-provided merchandise. Real catalog launch requires authentic prices, accurate stock, and licensed photographs.

## Limitations

QA proof covers database records and anonymous data-visibility checks, not a rendered browser session or successful Cloudflare deployment. To test detail pages publicly, use a **staging environment** with separately seeded, published staging-only products rather than activating production drafts.

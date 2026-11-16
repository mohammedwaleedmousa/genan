# Genan purchase journey verification — 2026-11-17

## Verified result
33 database integration checks passed after applying the fix. Tests executed the actual product-save and checkout RPCs, using authenticated-admin and anonymous-guest roles. All fixtures were rolled back in an exception subtransaction. Business counts remain 24 products, 84 SKUs, 4 categories, 4 brands, zero orders and zero refunds; inventory aggregate mismatches are zero.

## Reproduced failures
- The actual frontend sends `cod`, while the active stored payment method uses `cash`. Checkout failed with `invalid_payment_method`.
- Buying three of four size-M units failed with `insufficient_size_stock`, because checkout deducted stock before its INSERT validation trigger ran.
- Buying one unit left three, confirming reduced that to two, and cancelling restored only one: new GN orders lacked `stock_reserved_at`.
- Frontend currency modes YER_SOUTH/YER_NORTH did not match currency-table codes YER_S/YER_N.
- Loose variant selection could choose an arbitrary SKU; duplicate basket lines were not reserved together before deduction.
- The frontend queried nonexistent `get_launch_discount_status`. Removed that nonfunctional automatic-discount fallback; supported coupon validation remains.

## Fix
Checkout now validates and accumulates reservations while locking inventory, inserts the order against the unchanged stock, records its reservation marker, then applies each reserved quantity exactly once. It accepts the configured cash/COD alias, resolves unambiguous variants, rejects null quantities and invalid accessories, derives size pricing on the server, and maps currency modes to stored codes. Existing RPC ACLs and auth boundaries are preserved. Delivery notifications now use Genan branding.

## Coverage
- create category, brand and atomic color/size product: PASS
- guest catalog visibility: PASS
- missing variant rejected: PASS
- negative quantity rejected: PASS
- null quantity rejected: PASS
- invalid color rejected: PASS
- stock excess rejected: PASS
- duplicate lines cannot exceed SKU stock: PASS
- unknown accessory rejected: PASS
- buy final units; server price and shipping: PASS
- idempotent checkout retry: PASS
- idempotency key rejects altered basket: PASS
- private order tracking: PASS
- checkout reserves exact SKU once: PASS
- invoice data and review saved: PASS
- confirmation does not debit again: PASS
- cancellation restores exact color and size: PASS
- repeated cancellation cannot restore twice: PASS
- cancelled order cannot be reopened: PASS
- active coupon creation: PASS
- checkout coupon totals: PASS
- order processing and delivery preserves reservation: PASS
- partial refund returns one unit: PASS
- completed refund cannot be replayed: PASS
- over-refund quantity rejected: PASS
- remaining refund restores original inventory: PASS
- currency SAR: PASS
- currency YER_SOUTH: PASS
- currency YER_NORTH: PASS
- anonymous admin write is denied: PASS
- inventory remains synchronized: PASS
- manual invoice confirmation and cancellation do not change stock: PASS
- size price adjustment comes from server rule: PASS

## Reproduction
Run `supabase/tests/purchase_journey_regression.sql` through a trusted administrative database connection. The script uses one temporary pg_temp function; all business fixtures roll back.

## Browser limitation
The browser connector could not access its originating browser context. No live button-click, cart UI, image-upload, PDF-export, or Safari/mobile pass was completed. Invoice coverage here verifies stored order/review/archive data and manual-invoice stock behavior, not PDF rendering. Complete the UI pass in a connected signed-in browser before treating this as full end-to-end acceptance.

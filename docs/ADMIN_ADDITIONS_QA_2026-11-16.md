# Genan admin additions verification — 2026-11-16

## Result

127 authenticated database operations passed. Every audit fixture was rolled back.
The production database has 26 products, 86 SKU rows, no product missing SKU inventory,
and no disagreement between aggregate product stock and SKU stock. Two products left
partially saved by earlier frontend attempts were repaired from their stored variant
quantities; their quantities and images were preserved.

## Fixes

- Product creation/editing now calls `admin_save_product` to save the product, cost,
  and SKU inventory in a single transaction under caller RLS. A stable draft UUID
  prevents duplicate products when retrying the same submission.
- Coupon writes retain admin RLS and marketing permissions; their missing table
  write grants and usage/deletion functions were restored.
- Delivery creation sends a supported country code and preserves existing SA entries.
- Settlements omit the generated `difference` field on creation and reconciliation.
- Missing admin ledger, reversal, currency usage/deletion, refund deletion, and
  inventory product deletion RPCs were restored as SECURITY INVOKER functions.
- Manual invoice lines are accepted only for an authenticated admin. Those lines
  never reserve or restore physical stock. New invoices offer SKU selection.
- Refund submissions use the required `refund_quantity` field. Refund matching also
  supports original manual invoice line identifiers.
- Inventory adjustments and completed refunds use DEFAULT for generated `total_cost`.
- Invoice branding and obsolete support defaults were corrected to Genan. Existing
  critical checks were updated for the current registration and hero implementations.
- Fixed the color-name sort comparison reported by TypeScript.

## Coverage

| Area | Verified operations |
| --- | --- |
| Categories | Parent and child creation, reading, editing |
| Brands | Create/edit, category mapping, pages, sections, filters, product assignment |
| Products | Complete form fields, accessories, specifications, quality variants, cost, SKU save |
| Atomic product saving | Create, same-ID retry, edit, rollback on failed create/edit |
| Merchandising | Homepage sections, banners, offers, campaigns, coupons |
| Delivery and settings | Carriers, COD regions, countries, currencies, site content, settings, certification image metadata |
| Finance | Payment method read/update, settlement create/edit, expenses, balanced journals, reversals |
| Inventory | Increase, decrease, damage, recount, generated cost, safe fixture deletion |
| Invoices and refunds | Catalog/manual invoice creation, confirmation/cancellation, refund creation and completion |
| Other | Sales agents, reviews, notification/delivery records without sending |
| Authorization | Non-admin product/coupon writes rejected, anonymous helper execution denied |

Five cases also executed the real frontend `buildInventoryPayload` implementation.
The earlier SKU regression suite covers color/size synchronization and image preservation.
An unauthenticated HTTP probe confirmed the new product RPC is in the REST schema and
rejects anonymous execution with PostgreSQL code 42501.

## Reproduction

Generate the rollback-only audit SQL:

```sh
python scripts/build-admin-additions-audit.py /tmp/genan-admin-additions-audit.sql
```

Run that SQL through a trusted administrative database connection. The harness performs
its operations as the existing authenticated admin and rolls back its fixtures in an
exception subtransaction, returning one result per operation. It does not send messages
or commit financial entries.

## Browser verification still pending

The local browser connection was unavailable. The cloud browser reached Genan's real
login form, but an authenticated admin page was not established. No claim is made that
every UI button, image upload, PDF export, or Safari interaction has been verified.
Complete the live UI pass after the user signs in to that browser.

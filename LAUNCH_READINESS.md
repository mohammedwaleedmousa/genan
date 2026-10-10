# GENAN launch readiness

Last reviewed: 2026-10-10

## Release status

**Not approved for public launch yet.** Checkout/database hardening has now been applied to the production Supabase project, but the storefront changes are still in an open PR and are not deployed to production.

## Work prepared in this branch

- [x] Checkout uses a per-submission request ID and reuses it for retries with the same checkout payload.
- [x] Added a server RPC migration for idempotent checkout responses and a limit of five successful new orders per normalized phone in one hour.
- [x] Added server-side validation of optional product accessories against `products.accessories`; the server derives accessory names and prices from the catalog rather than trusting browser prices.
- [x] Extended static critical-flow checks to cover these controls.
- [ ] Confirm GitHub Actions production build and critical-flow verification pass.
- [x] Applied the analytics, checkout idempotency/rate-limit, and server-validated accessory-pricing migrations to the intended Supabase project. The repository migration filenames were aligned with the versions recorded by Supabase.
- [ ] Verify the new RPC exists and run a safe test checkout in a controlled test setup.
- [ ] After the storefront is deployed and confirmed to call `create_secure_order_v4`, revoke direct `anon`/`authenticated` execution of the legacy `create_secure_order_v3` RPC in a separate follow-up migration. Do not revoke it before the new storefront is deployed, or older clients may fail at checkout.

## Production facts checked

- Supabase project URL: `https://mwwyvmyeqlgccsnztvkm.supabase.co`.
- Current database contains 8 active products, 2 active payment methods, 2 active delivery companies, and 1 existing order. Do not delete, replace, or treat these records as demo data without owner verification.
- No active product currently has a configured accessory array or size-price rule, so those product-option paths still need a controlled test when real catalog options are configured.
- The purchase-analytics function and the two checkout hardening migrations are now recorded in production migration history. Runtime behavior still needs a controlled test before it is considered verified.
- Security advisors report public execution of several `SECURITY DEFINER` RPCs. Some are needed for guest checkout/tracking; review each function's behavior and grants individually rather than revoking broadly.
- The current Supabase migration history does not match the repository migration set. Reconcile the schema/history before bulk-applying migrations.

## Business setup that must be verified with the store owner

- [ ] Confirm the official production domain and verify the latest `main` deployment is live over HTTPS.
- [ ] Confirm all eight active product records are real launch catalog items, with correct images, descriptions, price, currency, and stock.
- [ ] Test both active payment methods end-to-end, including the actual payment instructions/recipient details and how payment is confirmed.
- [ ] Test both active delivery companies: service areas, delivery fees, expected delivery times, and contact/escalation process.
- [ ] Publish and verify accurate store contact details, privacy notice, terms of sale, shipping policy, and return/refund policy. These details must reflect the actual business; do not invent them.
- [ ] Verify order notifications reach the person who fulfills orders and that the admin account can manage orders securely.
- [ ] Complete a full test purchase, including order creation, stock decrement, confirmation-page refresh, order tracking, admin visibility, and a cancellation/refund path if supported.

## Safe rollout order

1. Review the SQL migrations and run CI.
2. Completed: applied the analytics migration, checkout idempotency/rate-limit migration, and server-side accessory-pricing migration; the applied versions are reflected in the repository migration filenames.
3. Verify the new RPC definitions, then execute controlled checkout tests in a safe test setup.
4. Deploy the storefront that calls `create_secure_order_v4` and confirm it is live.
5. Revoke direct execution of `create_secure_order_v3` in a separate migration after confirming no deployed clients still rely on it.
6. Complete the business setup checklist and only then approve public launch.

Do not run a real customer purchase as a test unless the store owner has agreed how to cancel/refund it.

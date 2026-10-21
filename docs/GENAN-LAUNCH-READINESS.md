# GENAN — Launch Readiness and Recovery Status

Last verified: 2026-10-22 (Aden local time)

## Status: DATABASE STRUCTURE REBUILT; PUBLIC LAUNCH NOT YET APPROVED

### Source control
- Canonical repository: `mohammedwaleedmousa/genan`, branch `main`.
- Supabase config and frontend fallback URL/key now point to `ydpvfsemhbrkhtjjjwqs` (Genan Prod).
- Cloudflare Pages environment settings may override the new frontend fallback. The real Cloudflare deployment/environment has **not** been verified by this audit.

### New production database
- Supabase project: `ydpvfsemhbrkhtjjjwqs`.
- 163 migration history entries verified on the connected production project at the latest check; legacy migration defects were repaired or supplemented on main.
- 67 public base tables verified; **all** have RLS enabled. All 65 tables declared in the generated TypeScript schema now exist with their declared columns.
- `create_secure_order_v4` exists and allows the anonymous storefront, and the deprecated v3 endpoint is no longer available to anonymous clients.
- Anonymous access to sensitive admin inventory RPCs revoked.
- Two Supabase Edge Functions deployed active, with JWT verification: `customer-registration-finalize` (version 2) and `invoice-access` (version 4), with AAL2 required for privileged invoice operations.
- Edge Functions include `https://genan.pages.dev` and local development origins in their default CORS allowlist. Set `ALLOWED_ORIGINS` to the exact final custom domain(s) when applicable.
- A security advisor still flags 4 anonymously callable `SECURITY DEFINER` endpoints, plus an extension in public and authenticated definer functions. These require a security review before launch.

### IMPORTANT: Deleted previous Supabase project
The deleted project `mwwyvmyeqlgccsnztvkm` was inaccessible. Schema was reconstructed from the repo, **not** its live data.
Verified new database totals: **0 products, 0 customer/auth users, 0 orders, 0 admins**, 4 brands, 4 categories, 2 storage buckets. These are not proof of old data recovery. Do not represent seed/demo catalog or prices as real stock.

### Outstanding production launch blockers
1. Populate verified owned GENAN catalog (supplier-authorized media, confirmed actual prices, current stock and variants) or recover a genuine backup. The old database content is missing.
2. Register/verify the first actual GENAN admin and assign the role safely, then test an MFA AAL2 session and admin permissions.
3. Verify and set current exchange rates; migrated seed values may be stale and should not drive customer charges.
4. Configure Cloudflare Pages Production + Preview variables: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`; remove all deleted-project values.
5. Configure Pages R2 binding `PRODUCT_MEDIA`; confirm image persistence. Validate any external image permission.
6. Configure Supabase Edge Function `ALLOWED_ORIGINS` after choosing the domain; set Supabase Auth URL configuration and allowed redirects to that domain.
7. Run clean `npm ci`, `npm run lint`, `npx tsc -p tsconfig.app.json --noEmit`, `npm run verify:critical-flows`, and `npm run build`. GitHub Actions checks did not successfully execute during this audit; do not claim test success.
8. Run real browser end-to-end cases: browse/search/filter, PDP, favorites, auth, cart, checkout idempotency/stock, payment method restrictions, order tracking, admin invoices and permission-denial paths.
9. Obtain and connect final domain, HTTPS, sitemap, robots, canonical/meta tags, monitoring, backups and rollback. Only enable live checkout after these checks.

### Safety notes
- Do not deploy fake demo products or fake orders to the customer-facing database.
- Do not use an anonymous or secret/service-role API key inside Vite client bundles.
- Keep a separate database/schema backup and protect real customer data.
- Do not declare completion based on a successful SQL migration alone.

## Work completed 2026-10-22
- Reconstructed five formerly absent entity tables and missing columns, including brand pages, banners, product filter mappings, and editorial fields. Compared the full generated TypeScript table/column list with the new database: **zero missing tables/columns**.
- Corrected anonymous RLS policy errors preventing the brand sections/campaign/offer pages from reading. SQL-level anonymous smoke checks now pass for catalog, product detail, categories, hero banners, brands, brand sections, filters, campaigns, offers, delivery and public configuration.
- Verified `create_secure_order_v4` rejects a null idempotency request ID under the anonymous role; test transaction committed no order.
- Updated `src/lib/currency.ts` to remove legacy unverified currency conversion fallbacks and reset previously persisted invalid currency modes to SAR.
- Updated `index.html` to stop preconnecting to the deleted database.
- Fixed a release script that expected the deleted Supabase project ID. Read-only validation of all 15 static source assertions passed; this **does not** replace running the actual Node.js script or TypeScript/build tests.
- Added `/api/store-health` for Cloudflare Pages to identify whether runtime `SUPABASE_URL` and `SUPABASE_PUBLISHABLE_KEY` connect to the expected project and whether any active catalog rows exist. The result is a connectivity signal, **not** clearance to accept orders.
- Improved the home and product listing empty/failure UI without displaying fake products.

## Final deployment verification
1. In Cloudflare Pages, verify the Production and Preview variables point to project `ydpvfsemhbrkhtjjjwqs` and use its active **publishable** key, then redeploy `main`.
2. Visit `https://genan.pages.dev/api/store-health` (or the final custom domain equivalent). It should respond `ok:true` and `supabase_connected:true`. With the empty catalog, `catalog_has_active_products` will be `false`. A wrong-project response means Cloudflare runtime variables still override the corrected GitHub fallback.
3. If using a custom domain, add its exact HTTPS origin to Supabase Edge Function `ALLOWED_ORIGINS` and Auth redirect allowlist.
4. GitHub Actions have shown failed launch/build runs without verifiable successful execution. Run and pass clean build, lint, TypeScript and actual browser tests when the GitHub workflow runner is operational.
5. Obtain real inventory (product, pricing in base SAR, brand, authorized photos, stock by variant). Bulk-import drafts, verify before making them active. No unrelated third-party store products should be presented as Genan stock.
6. Register an actual owner/admin account via Supabase Auth, grant `admin` only after verifying the owner identity, configure TOTP AAL2, and test every administrative operation.
7. Approve live currency rates, delivery coverage, payment methods and backups before checkout is enabled for customers.

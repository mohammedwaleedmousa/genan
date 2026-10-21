# GENAN — Launch Readiness and Recovery Status

Last verified: 2026-10-22 (Aden local time)

## Status: DATABASE STRUCTURE REBUILT; PUBLIC LAUNCH NOT YET APPROVED

### Source control
- Canonical repository: `mohammedwaleedmousa/genan`, branch `main`.
- Supabase config and frontend fallback URL/key now point to `ydpvfsemhbrkhtjjjwqs` (Genan Prod).
- Cloudflare Pages environment settings may override the new frontend fallback. The real Cloudflare deployment/environment has **not** been verified by this audit.

### New production database
- Supabase project: `ydpvfsemhbrkhtjjjwqs`.
- At least 159 migration history entries verified during the recovery; migration scripts repaired or supplemented on main.
- 62 public tables verified; all public base tables have RLS enabled.
- `create_secure_order_v4` exists and allows the anonymous storefront, and the deprecated v3 endpoint is no longer available to anonymous clients.
- Anonymous access to sensitive admin inventory RPCs revoked.
- Two Supabase Edge Functions deployed active, with JWT verification: `customer-registration-finalize` and `invoice-access`.
- Edge Functions have localhost-only default CORS. Set `ALLOWED_ORIGINS` to the exact final GENAN hostname(s) before using them from production.
- A security advisor still flags some intentionally public `SECURITY DEFINER` endpoints plus an extension in public; each requires security review before launch.

### IMPORTANT: Deleted previous Supabase project
The deleted project `mwwyvmyeqlgccsnztvkm` was inaccessible. Schema was reconstructed from the repo, **not** its live data.
Verified new database totals: **0 products, 0 customer/auth users, 0 orders**, 4 brands, 4 categories, 2 storage buckets. These are not proof of old data recovery. Do not represent seed/demo catalog or prices as real stock.

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

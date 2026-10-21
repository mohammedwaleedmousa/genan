# GENAN Launch Readiness — 2026-10-21

## Current release status: BLOCKED — do not publish to production

This release branch contains reviewed, small fixes:
- Pagination for dynamic sitemap catalog entries beyond 1,000 rows per type.
- Removal of incorrect Flamingo domain references from robots.txt; block Genan admin URL crawling.
- MFA AAL2 requirement when opening admin routes, including restored sessions.

## Confirmed critical integration issue

The storefront points to Supabase project `mwwyvmyeqlgccsnztvkm` (see `src/integrations/supabase/client.ts` and `supabase/config.toml`).

Connected Supabase organization currently exposes **Genan Prod** with ref `ydpvfsemhbrkhtjjjwqs`. A read-only catalog verification against this project returned:
- `public.products`: absent
- `public.orders`: absent
- `public.create_secure_order_v4(...)`: absent

**Do not swap VITE_SUPABASE_URL to the new project until schema, RLS, functions, storage, and data migration have been verified.** Do not apply old migrations blindly to a production database.

## Required release gates

1. Confirm authoritative source database and back up data and storage.
2. Migrate/test schema, permissions, storage and existing data to intended production Supabase instance.
3. Test secure checkout, payment reconciliation, inventory locking, coupons, order tracking and refund flows with controlled test accounts.
4. Run `npm ci`, `npm run lint`, `npm run build`, and `npm run verify:critical-flows` on a clean checkout.
5. Verify Cloudflare Pages environment variables, Functions and R2 binding, then validate a full end-to-end order against staging.
6. Audit route-level access and server-side RLS/MFA policies.
7. Fix canonical hostname, add correct sitemap/robots references once the final domain is known, and verify metadata/indexing.
8. Check browser/mobile performance, broken images, navigation restoration, accessibility and policy/legal pages.
9. Implement rollback, monitoring and tested backups. Only then merge to `main` and release.

No migration, deployment or production data mutation has been performed in this release branch.

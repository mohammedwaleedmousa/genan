# Genan — Cloudflare Pages deployment

## Build
- Framework preset: Vite
- Build command: `npm run build`
- Build output directory: `dist`
- Production branch: `main`
- Node.js: 20

## Build environment variables
Set these for Production and Preview:
- `VITE_SUPABASE_URL=https://mwwyvmyeqlgccsnztvkm.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY=<Genan publishable key>`
- `VITE_GENAN_WHATSAPP_URL=<optional full wa.me URL>`
- `VITE_GENAN_WHATSAPP_NUMBER=<optional digits only>`

## Pages Functions runtime variables
Set these in the Pages project runtime variables:
- `SUPABASE_URL=https://mwwyvmyeqlgccsnztvkm.supabase.co`
- `SUPABASE_PUBLISHABLE_KEY=<Genan publishable key>`

Do not add a Supabase service-role key to the frontend or Pages project.

## R2
Create or select an R2 bucket for Genan product media and bind it to the Pages project using:
- Variable name: `PRODUCT_MEDIA`

The functions under `/functions/media/*` and `/functions/api/media/upload` depend on this binding.

## Verification after first deploy
Check:
1. `/api/build-health` returns `service: "genan"`.
2. Home, products, categories, product page, cart and checkout load.
3. `/sitemap.xml` uses the deployed Genan hostname.
4. `/qr` encodes the deployed Genan hostname.
5. Customer sign-up reaches the Genan Supabase project.
6. A test order gets a `GN-` order number.
7. Order tracking works with the returned token.

Do not run the production read-load test until the preview has passed the checks above.

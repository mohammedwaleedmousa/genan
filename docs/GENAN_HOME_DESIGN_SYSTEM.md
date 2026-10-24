# GENAN — Editorial Home Design v3

**Decision date:** 24 October 2026  
**Status:** New homepage visual baseline. Replaces the older screenshot-based dark layout (v1/v2) on `/home`.  
**Scope:** Homepage design only. Other store routes and admin keep their current implementation.

## Brand authority

The shared `src/components/Footer.tsx` is the reference for the homepage's appearance: bright white fields, deep black text, soft gold detailing and very selective pale turquoise.

| Token | Colour | Meaning |
| --- | --- | --- |
| Black | `#0E0E0E` | Typography, buttons, signature editorial panel, footer bottom bar |
| White | `#FFFFFF` | Main site canvas, navigation, shopping cards and shared footer |
| Soft gold | `#D8C29A` | Hairlines, highlighted CTAs, understated editorial typography |
| Soft turquoise | `#A9D8D3` | Focus and tiny accents, small service icon tint |
| Neutral tones | pale grey / dark grey | Legibility and photo-background contrast only |

The interface does not add pink or unrelated hues. Photography is free to show real product colours.

## New homepage composition

1. Shared **white customer navbar** (`Navbar` default variant; full search/cart/account/menu logic retained).
2. Black mini brand strip below navigation.
3. Asymmetric **split hero** with text on a light canvas, large campaign image, and working arrows/slide indicators. Dynamically displays active `banners` from Supabase, with existing filtered banners and a neutral fallback.
4. **Four editorial category cards**. Real root `categories` from Supabase, linked to `/products?category=<slug>`; if the catalog is not configured yet, show representative category cards linked to the category directory rather than pretending the filters exist.
5. **Curated product wall**. Live `products` through `PRODUCT_CARD_SELECT` and `mapProductCard`, existing add-to-cart ProductCard behavior and explicit demo-only disclosures. Empty, error and loading states included.
6. **Black signature/brand story** beside fashion photography, linking to About.
7. **Two visual destinations**: new arrivals and brands.
8. White **customer-service strip**.
9. The exact existing **shared footer**, unchanged.

## Technical ownership

- `src/pages/HomePage.tsx`: v3 page layout + queries.
- `src/components/GenanHomeHero.tsx`: live banner integration, arrows and indicators.
- `src/styles/genanHomeV3.css`: all v3 appearance and breakpoint rules, scoped to `.genan-v3-page`.
- `src/components/Footer.tsx`: shared footer.
- Old `src/styles/genanReference.css` and `src/styles/genanHomeTheme.css` are **not imported by v3** and may remain for historic references; do not re-import them into HomePage or place unscoped overrides there.

## Launch-quality checklist

- [x] Hero, categories, products, story, links and service sections rebuilt visually.
- [x] Existing Supabase query fields and commerce ProductCard retained.
- [x] RTL, responsive 4→2 product/category grids, smaller mobile hero, reduced motion supported in CSS.
- [x] All home links target existing site routes.
- [ ] Vite production compilation, visual viewport review at 390 / 768 / 1440 pixels, keyboard navigation review.
- [ ] Cloudflare deployment verification.
- [ ] Replace external editorial stock images with approved assets, ideally from store inventory and the client's own branding, before a public launch.

**Do not call the homepage production verified until the unchecked items have been completed.**

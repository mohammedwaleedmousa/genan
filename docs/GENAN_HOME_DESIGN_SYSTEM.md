# GENAN — Homepage Design System v1

**Status:** Approved implementation baseline for the homepage as of 24 October 2026. Future design changes should be deliberate updates to this baseline, not independent redesigns of each section.

## Visual identity

| Role | Token | Value | Use |
| --- | --- | --- | --- |
| Primary dark | `--genan-home-black` | `#0E0E0E` | Page background, glass navigation, editorial banners, black brand surfaces |
| Primary light | `--genan-home-white` | `#FFFFFF` | Product section, service strip, category cards, shared footer |
| Premium accent | `--genan-home-gold` | `#D8C29A` | CTAs, borders, small accents, current slide and collection highlights |
| Subtle accent | `--genan-home-turquoise` | `#A9D8D3` | Focus rings, selective highlights, contrast against black |
| Contrast-safe gold text | `--genan-home-gold-deep` | `#88662C` | Prices on white backgrounds |
| Contrast-safe turquoise text | `--genan-home-turquoise-deep` | `#356F69` | Small icons and hover text on white backgrounds |

Grey text shades and gold/turquoise tints are permitted for contrast and readability. Avoid pink, brown, olive or green as *interface* colours. Product photography and actual product swatches retain their real colours.

## Frozen homepage structure

Keep the current responsive layout, mobile hero dimensions, dark floating/glass navbar, image slider, category ribbon, product grid, campaign/collection, editorial detail tiles, service strip, and shared branded footer. The homepage is **not being structurally redesigned** in this milestone.

Visual balance: dark black editorial surfaces + high-contrast white shopping panels + gold primary action buttons + sparing turquoise. Do not overuse turquoise or create additional accent colours.

## Technical ownership and scope

- Layout/responsive placement: `src/styles/genanReference.css`.
- **Single authoritative homepage palette and section appearance:** `src/styles/genanHomeTheme.css` (imported AFTER the reference layout stylesheet in `src/pages/HomePage.tsx`).
- Shared footer: `src/components/Footer.tsx`.
- Other routes (product listing, product details, checkout, account, admin) are **out of scope** for this phase; align their designs individually only when requested.
- Do not change product data queries, customer account flows, permissions, ordering, pricing, or Supabase to deliver visual updates.

## Acceptance criteria

1. All four specified palette values are in the homepage stylesheet.
2. Hero/navbar, category ribbon, product cards, editorial sections, service strip and footer feel like one store.
3. Small text on white surfaces uses black or darker gold/turquoise contrast-safe shades.
4. Mobile layout must not require horizontal page scrolling.
5. All existing links, dynamic banner content, cart buttons, filters and checkout routes remain functional.
6. Verify build, tablet/mobile/desktop rendering, RTL spacing, and Cloudflare deployment separately before declaring the homepage production-ready.

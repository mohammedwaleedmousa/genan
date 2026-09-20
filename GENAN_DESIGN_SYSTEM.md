# GENAN Design System

Genan is intentionally **not** a Flamingo derivative. The storefront follows an editorial fashion-house / gallery language.

## Core direction

- Editorial, quiet, spacious, fashion-first.
- Products are presented like objects in a gallery, not rounded ecommerce cards.
- Prefer asymmetry, large whitespace, thin rules, numbered labels, and strong typography.
- UI should feel curated rather than crowded.

## Palette

- Deep Forest: `#173A2D`
- Dark Forest: `#102A20` / `#10251D`
- Ivory: `#F8F6F0`
- Warm Paper: `#EEE9DD`
- Brass: `#9D7B40`
- Light Brass: `#D9BC7D`
- Divider: `#DCD5C6`
- Muted text: `#778179`

Do not reintroduce Flamingo rose/pink as a brand accent.

## Geometry

- Default customer-facing surfaces use sharp or near-sharp corners.
- Avoid rounded ecommerce card stacks and pill-heavy navigation.
- Thin borders replace shadows wherever possible.
- Product imagery should remain the visual focus.

## Navigation

- Dark editorial header.
- Centered Genan wordmark.
- Brass is reserved for active states and small accents.
- Search should feel integrated into the header, not like a separate floating card.

## Home

- Full editorial hero with strong image/text composition.
- Category areas may use collage/asymmetric editorial layouts.
- Brand surfaces should behave like an index or rail, not logo bubbles.
- Sections should have generous vertical rhythm.

## Catalog

- Product cards are borderless and square-edged.
- Images use generous vertical proportions.
- Product name, brand, and price live outside the image with minimal chrome.
- Filters are flat editorial controls.
- Category navigation uses rules/tabs rather than rounded pills.

## Product detail

- Gallery-led split layout.
- Large image area + clearly separated product information column.
- No rounded floating card shell around the entire product.
- Options, quantity, and purchase controls remain visually quiet until needed.

## Brands

- Brands page is an index, not a grid of rounded logo cards.
- Use sequence numbers, typography, and simple logo treatment.

## Footer

- Dark architectural footer.
- Large GENAN wordmark.
- Structured numbered navigation groups.

## Guardrail

When creating a new customer-facing component, ask:

1. Does this look like an editorial fashion catalogue?
2. Is the product/content more prominent than the UI container?
3. Can a shadow or rounded card be replaced by spacing or a thin rule?
4. Is the component using Genan forest/ivory/brass rather than inherited pink?
5. Does it remain readable and usable on mobile?

If the answer to any of these is no, revise before merging.

# GENAN Design System

Genan is an independent fashion storefront. It must not look like a Flamingo derivative.

## Experience principles

- Premium editorial / fashion-house / gallery direction: calm, curated, spacious, image-led.
- Treat products as the focus; avoid crowded ecommerce UI, excessive cards, decorative gradients, and heavy shadows.
- Use strong hierarchy, deliberate whitespace, thin rules, considered asymmetry, and restrained motion.
- All customer routes must feel like one system on both mobile and desktop.
- Mobile is not a compressed desktop layout: prioritize readable copy, comfortable tap targets, stable image ratios, and simple purchase actions.

## Palette

- Ink / primary text: `#111111`
- White / main canvas: `#FFFFFF`
- Soft paper: `#FAF9F6`
- Light gold: `#D8C29A`
- Gold for contrast and focus: `#9B7B42`
- Soft turquoise: `#A9D8D3` — use sparingly for small details, never as a dominant surface
- Rules: `#E8E4DC`
- Muted text: `#66645F`

Do not reintroduce rose/pink branding. Do not make forest green the dominant Genan identity. Keep gold accents restrained rather than turning the UI into a gold-on-gold theme.

## Geometry and surfaces

- Prefer square or near-square corners on customer-facing surfaces.
- Use thin borders and spacing instead of stacked rounded cards and large shadows.
- Keep controls visually quiet, but make interactive states obvious.
- Maintain a consistent 44px minimum target for primary touch controls where practical.

## Typography and accessibility

- Arabic body copy must be clear and comfortably readable; do not rely on tiny 6–9px labels for essential information.
- Editorial display typography may be expressive, but price, size, availability, delivery, payment, and checkout instructions must remain highly legible.
- Preserve browser zoom and text scaling.
- Keyboard focus must be visible; reduced-motion preferences must be respected.
- Maintain useful contrast for muted text, borders, and action states.

## Navigation

- Keep the centered Genan wordmark and restrained editorial header.
- Integrate search into the navigation rather than making it feel like an unrelated floating card.
- Ensure mobile navigation, search, favorites, and cart controls have comfortable touch targets and accessible labels.

## Home and discovery

- Use an image-led editorial hero with clear, concise copy and a single obvious next action.
- Category and brand areas should feel curated and intentional, not like a dense collection of pills.
- Use real active catalog data; never replace store products with demo content for visual polish.
- Give sections consistent vertical rhythm and clear headings.

## Catalog and product cards

- Keep cards borderless or minimally framed, with product images as the primary visual.
- Use readable brand, product name, price, discount, and stock messaging.
- Keep filters and sorting discoverable on touch and desktop, with visible active states.
- Preserve current search, filtering, sorting, pagination, favorites, and add-to-cart behavior.

## Product detail

- Use a gallery-led layout with a clear image area and a distinct information column on desktop.
- On mobile, keep the product, price, options, stock, and purchase action easy to scan without excessive scrolling.
- Preserve image zoom, color and size selection, accessory selection, quantity, and stock guards.

## Cart, checkout, and customer account

- Make order summary, totals, delivery, payment, validation errors, and next steps unambiguous.
- Never change business rules or copy that carries legal/payment meaning as part of a visual-only refactor.
- Preserve login/session behavior, order history, tracking, invoices, favorites, addresses, and notifications.
- Use empty, loading, error, and success states consistently.

## Safe implementation and release

1. Work on a dedicated branch and open a draft PR; never commit visual experiments directly to `main`.
2. Prefer scoped CSS and small component-level changes before replacing page implementations.
3. Do not modify database records, migrations, RPCs, pricing, stock, checkout payloads, delivery/payment rules, or auth/session logic in a UI-only task.
4. Run critical-flow checks, lint, TypeScript, and production build.
5. Review Cloudflare Preview on narrow mobile, large mobile, tablet, laptop, and wide desktop.
6. Smoke-test customer navigation, search/filtering, product options, cart, auth, account, and checkout using a safe test setup.
7. Merge only after the preview is reviewed and required checks are green; verify production after deployment.

## Review questions

- Does this feel like a premium editorial fashion catalogue rather than a generic ecommerce template?
- Is the product/content more prominent than its container?
- Is all essential Arabic copy readable on mobile?
- Can the visitor zoom, navigate by keyboard, and understand focus/active/error states?
- Does every page preserve the existing catalog and commerce behavior?
- Is every color aligned with the restrained black / white / light-gold direction, with turquoise only as a small accent?

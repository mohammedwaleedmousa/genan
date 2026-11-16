# Genan route reachability cleanup — 2026-11-17

Follow-up to the unused-file audit: route registration alone does not establish an active navigation entry.

## Evidence

- Inspected all frontend modules, lazy imports, sidebar items, admin command-search entries, button navigation, account tabs, dynamic brand links, sitemap entries and route permission metadata.
- Checked current CMS content and customer-experience/hero settings for links to candidate routes. No links to the retired customer pages were stored.
- Kept embedded catalog tools: their tabs are reachable from Catalog Health even though they are not standalone routes.
- Kept order confirmation, product/brand/section detail, banner and campaign routes: they are part of checkout or managed publishing flows, not menu-only pages.
- Kept current /auth recovery/reset, navbar product search, embedded account shipments, product reviews and their active backend rules.

## Retired pages and routes

| Route | Evidence |
| --- | --- |
| `/search` | Navbar search already navigates to /products?search=; the standalone search page has no UI caller. |
| `/my-shipments` | Shipment and invoice UI is embedded in AccountPage; no navigation opens the standalone page. |
| `/reset-password` | The old form never becomes ready. Current phone/password recovery and reset are connected inside /auth. |
| `/new-season` | No customer navigation, CMS link or sitemap entry; the only references were settings metadata and legacy collection labels. |
| `/top-selling` | No customer entry; duplicates the connected best-sellers concept using a different legacy collection query. |
| `/reviews` | No customer navigation; removed the obsolete sitemap-only review page. Product reviews and admin reviews remain. |
| `/brands/:slug/products` | No inbound link from brand or section pages; active brand browsing uses BrandPage and BrandSectionPage. |
| `catalog-workflow` | Only router/title metadata referenced it; no sidebar, header search or action opens it. |
| `sales-agents` | Standalone page with no navigation entry or action. Existing checkout/referral data and server rules remain. |
| `countries` | Only router, title metadata and permission classifier referenced the page; no navigation opens it. |
| `brand-filters` | Only route/title/permission metadata referenced the editor; no caller opens it. |
| `size-price-rules` | No UI entry to the editor. Product-detail rule evaluation remains in use and is preserved. |
| `brand-section-products/:id` | Unused duplicate URL. Connected /brand-sections/:id/products route and its editor remain. |

- Both /admin/brand-filters and /admin/brand-filters/:id are retired.
- Removed the CollectionPage helper, ProductListFilters and unused UI table after their last callers were removed.
- Removed collection assignment controls pointing to retired pages. Existing legacy collection data is round-tripped during product saves for compatibility with the product-save API.
- Removed stale customer-experience options, search prefetches, shipments realtime route, review sitemap entry, admin title metadata and retired permission prefixes.

## Files removed

- `src/pages/NewSeasonPage.tsx`
- `src/pages/TopSellingPage.tsx`
- `src/pages/SearchPage.tsx`
- `src/pages/MyShipmentsPage.tsx`
- `src/pages/ResetPasswordPage.tsx`
- `src/pages/BrandProductsPage.tsx`
- `src/pages/ReviewsPage.tsx`
- `src/pages/admin/AdminCatalogWorkflowPage.tsx`
- `src/pages/admin/AdminSalesAgentsPage.tsx`
- `src/pages/admin/AdminCountriesPage.tsx`
- `src/pages/admin/AdminBrandFiltersPage.tsx`
- `src/pages/admin/AdminSizePriceRulesPage.tsx`
- `src/pages/CollectionPage.tsx`
- `src/components/ProductListFilters.tsx`
- `src/components/ui/table.tsx`

## Validation

- Static import resolution includes dynamic imports and the Vite zoom alias; no missing imports or newly orphaned frontend modules.
- The hosting build runs TypeScript, existing critical-flow checks and Vite before publishing.
- Existing database data and active service functions are retained; this cleanup removes disconnected frontend entry points.

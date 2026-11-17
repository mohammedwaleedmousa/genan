// Keep speculative route requests off constrained or unknown connections.
const routeModules: Record<string, () => Promise<unknown>> = {
  "/cart": () => import("@/pages/CartPage"),
  "/checkout": () => import("@/pages/CheckoutPage"),
  "/products": () => import("@/pages/ProductsPage"),
  "/categories": () => import("@/pages/CategoriesPage"),
  "/favorites": () => import("@/pages/FavoritesPage"),
  "/account": () => import("@/pages/AccountPage"),
  "/auth": () => import("@/pages/CustomerAuthPage"),
  "/product": () => import("@/pages/ProductDetailPage"),
  "/best-sellers": () => import("@/pages/BestSellersPage"),
  "/new-arrivals": () => import("@/pages/NewArrivalsPage"),
  "/seasonal-offers": () => import("@/pages/SeasonalOffersPage"),
  "/brands": () => import("@/pages/AllBrandsPage"),
  "/my-orders": () => import("@/pages/MyOrdersPage"),
  "/store-info": () => import("@/pages/StoreInfoPage"),
};
const routePromises = new Map<string, Promise<unknown>>();

const getRouteKey = (path: string) => {
  const pathname = path.split(/[?#]/)[0] || "/";
  if (pathname.startsWith("/product/")) return "/product";
  if (pathname === "/signin" || pathname === "/signup") return "/auth";
  return pathname;
};

export const prefetchStorefrontRoute = (path: string): Promise<unknown> => {
  const connection = (navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
  }).connection;
  if (connection?.saveData || connection?.effectiveType !== "4g") return Promise.resolve();

  const key = getRouteKey(path);
  const loader = routeModules[key];
  if (!loader) return Promise.resolve();

  const existing = routePromises.get(key);
  if (existing) return existing;

  const pending = loader().catch(() => {
    // Offline/slow-network failures must not poison future navigation attempts.
    routePromises.delete(key);
    return undefined;
  });
  routePromises.set(key, pending);
  return pending;
};

export const prefetchProductDetailPage = () => prefetchStorefrontRoute("/product/_");

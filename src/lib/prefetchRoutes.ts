// Keep speculative route requests off constrained or unknown connections.
const routeModules: Record<string, () => Promise<unknown>> = {
  "/home": () => import("@/pages/HomePage"),
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
  "/qr-code": () => import("@/pages/QRCodePage"),
  "/notifications": () => import("@/pages/NotificationsPage"),
};
const routePromises = new Map<string, Promise<unknown>>();

const getRouteKey = (path: string) => {
  const pathname = path.split(/[?#]/)[0] || "/";
  if (pathname.startsWith("/product/")) return "/product";
  if (pathname === "/signin" || pathname === "/signup") return "/auth";
  return pathname;
};

const getConnection = () => (navigator as Navigator & {
  connection?: { saveData?: boolean; effectiveType?: string };
}).connection;

export const prefetchStorefrontRoute = (path: string, userInitiated = false): Promise<unknown> => {
  const connection = getConnection();
  if (!userInitiated && (connection?.saveData || connection?.effectiveType !== "4g")) {
    return Promise.resolve();
  }

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

export const warmStorefrontMenu = (currentPath: string) => {
  const connection = getConnection();
  if (connection?.saveData || (connection?.effectiveType && connection.effectiveType !== "4g")) return;

  // Safari doesn't expose connection speed. Warm just one small route there.
  const routes = ["/products", "/categories"].filter((route) => route !== getRouteKey(currentPath));
  const routeCount = connection?.effectiveType === "4g" ? routes.length : 1;
  let stopped = false;
  const timer = window.setTimeout(async () => {
    for (const route of routes.slice(0, routeCount)) {
      if (stopped) return;
      await prefetchStorefrontRoute(route, true);
    }
  }, 180);

  return () => {
    stopped = true;
    window.clearTimeout(timer);
  };
};

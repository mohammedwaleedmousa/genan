import type { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CARD_SELECT } from "@/lib/productCardData";

// Browser import() caches downloaded route chunks. Warm critical storefront
// routes after first paint; never eagerly download admin or every product image.
const routeModules: Record<string, () => Promise<unknown>> = {
  "/cart": () => import("@/pages/CartPage"),
  "/checkout": () => import("@/pages/CheckoutPage"),
  "/products": () => import("@/pages/ProductsPage"),
  "/categories": () => import("@/pages/CategoriesPage"),
  "/favorites": () => import("@/pages/FavoritesPage"),
  "/account": () => import("@/pages/AccountPage"),
  "/auth": () => import("@/pages/CustomerAuthPage"),
  "/search": () => import("@/pages/SearchPage"),
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

// Use the identical query key and query shape as ProductsPageServer so a
// completed idle-time fetch is reused rather than refetched on navigation.
const prefetchCatalog = async (client: QueryClient) => {
  await client.prefetchQuery({
    queryKey: ["genan-products-direct-v3"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select(`${PRODUCT_CARD_SELECT},audience,created_at,sort_order`)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(500);
      if (error) throw error;
      return data || [];
    },
    staleTime: 2 * 60 * 1000,
  });
};

// Nonblocking, staged warmup: the cart gets the first request. Heavy catalog
// data is low-priority and skipped on data-saving or very slow connections.
export const warmStorefrontRoutes = (client: QueryClient): (() => void) => {
  if (typeof window === "undefined") return () => undefined;

  const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
  const reducedData = Boolean(conn?.saveData || /(?:^|-)2g$/.test(conn?.effectiveType || ""));
  const timers: number[] = [];
  const idleHandles: number[] = [];

  const stage = (delay: number, work: () => void) => {
    const timer = window.setTimeout(() => {
      if (document.visibilityState !== "visible") return;
      if ("requestIdleCallback" in window) {
        idleHandles.push(window.requestIdleCallback(work, { timeout: 1500 }));
      } else {
        work();
      }
    }, delay);
    timers.push(timer);
  };

  stage(250, () => { void prefetchStorefrontRoute("/cart"); });
  stage(950, () => { void prefetchStorefrontRoute("/checkout"); });
  stage(1900, () => { void prefetchStorefrontRoute("/products"); });
  stage(2800, () => { void prefetchProductDetailPage(); });
  if (!reducedData) {
    stage(3600, () => { void prefetchStorefrontRoute("/categories"); });
    stage(4500, () => { void prefetchStorefrontRoute("/favorites"); });
    stage(5500, () => { void prefetchStorefrontRoute("/account"); });
    stage(6500, () => { void prefetchStorefrontRoute("/search"); });
    stage(8000, () => { void prefetchCatalog(client); });
  }

  return () => {
    timers.forEach((timer) => window.clearTimeout(timer));
    if ("cancelIdleCallback" in window) {
      idleHandles.forEach((id) => window.cancelIdleCallback(id));
    }
  };
};

import { queryOptions } from "@tanstack/react-query";

import { supabase } from "@/integrations/supabase/client";
import { mapProductCard, PRODUCT_CARD_SELECT } from "@/lib/productCardData";

export const catalogFilterCategoriesQuery = queryOptions({
  queryKey: ["genan-products-categories-v2"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,slug,name_ar,parent_id,sort_order")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  },
  staleTime: 30 * 60 * 1000,
});

export const catalogProductsQuery = queryOptions({
  queryKey: ["genan-products-direct-v3"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("products")
      .select(`${PRODUCT_CARD_SELECT},created_at,sort_order`)
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .limit(500);

    if (error) throw error;
    return data || [];
  },
  staleTime: 2 * 60 * 1000,
  refetchOnWindowFocus: false,
});

export const storefrontCategoriesQuery = queryOptions({
  queryKey: ["genan-categories-page-v1"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("categories")
      .select("id,name,name_ar,slug,image_url,description_ar,parent_id")
      .eq("is_active", true)
      .is("parent_id", null)
      .order("sort_order", { ascending: true });

    if (error) throw error;
    return data || [];
  },
  staleTime: 10 * 60 * 1000,
});

export const PRODUCT_SHELF_PAGE_SIZE = 20;

export const productShelfQuery = (shelf: "new-arrivals" | "best-sellers", limit = PRODUCT_SHELF_PAGE_SIZE) =>
  queryOptions({
    queryKey: [shelf, limit],
    queryFn: async () => {
      let query = supabase
        .from("products")
        .select(PRODUCT_CARD_SELECT, { count: "exact" })
        .eq("is_active", true);

      if (shelf === "best-sellers") query = query.eq("is_best_seller", true);

      const { data, error, count } = await query.order("created_at", { ascending: false }).limit(limit);
      if (error) throw error;

      return { products: (data || []).map(mapProductCard), total: count || 0 };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previous) => previous,
  });

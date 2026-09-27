import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";

import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CARD_SELECT, mapProductCard } from "@/lib/productCardData";

type ProductAudience = "men" | "women" | "kids" | "unisex";

type Category = {
  id: string;
  slug: string;
  name_ar: string;
  parent_id: string | null;
  sort_order: number;
};

type ProductColor = {
  name: string;
  hex?: string;
  hex2?: string;
};

type RawProduct = Record<string, any> & {
  audience?: ProductAudience | null;
  created_at?: string | null;
  sort_order?: number | null;
  color_variants?: unknown;
  sizes?: unknown;
};

type FilterDraft = {
  category: string;
  brand: string;
  audience: ProductAudience | "all";
  color: string;
  size: string;
  minPrice: string;
  maxPrice: string;
  saleOnly: boolean;
  inStockOnly: boolean;
};

const PAGE_SIZE = 12;

const AUDIENCE_OPTIONS: Array<{ value: ProductAudience; label: string }> = [
  { value: "women", label: "نسائي" },
  { value: "men", label: "رجالي" },
  { value: "kids", label: "أطفال" },
  { value: "unisex", label: "للجنسين" },
];

const normalize = (value: unknown) => String(value || "").trim().toLowerCase();

const parseColorVariants = (value: unknown): Array<Record<string, any>> => {
  if (Array.isArray(value)) return value as Array<Record<string, any>>;
  if (typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const getProductColors = (row: RawProduct): ProductColor[] =>
  parseColorVariants(row.color_variants)
    .map((variant) => ({
      name: String(variant.name || variant.colorName || "").trim(),
      hex: typeof variant.hex === "string" ? variant.hex : undefined,
      hex2: typeof variant.hex2 === "string" ? variant.hex2 : undefined,
    }))
    .filter((color) => color.name);

const getProductSizes = (row: RawProduct): string[] => {
  const directSizes = Array.isArray(row.sizes)
    ? row.sizes
        .map((size) => (typeof size === "string" ? size : String(size?.size || "")))
        .filter(Boolean)
    : [];

  const variantSizes = parseColorVariants(row.color_variants).flatMap((variant) =>
    Array.isArray(variant.sizes)
      ? variant.sizes
          .map((size: any) => (typeof size === "string" ? size : String(size?.size || "")))
          .filter(Boolean)
      : [],
  );

  return Array.from(new Set([...directSizes, ...variantSizes].map((size) => size.trim()).filter(Boolean)));
};

const getFinalPrice = (row: RawProduct) => {
  const price = Number(row.price || 0);
  const discount = Number(row.discount || 0);
  return discount > 0 ? price * (1 - discount / 100) : price;
};

const ProductsPageServer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categorySlug = searchParams.get("category") || "";
  const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();
  const brandFilter = searchParams.get("brand") || "all";
  const audienceFilter = (searchParams.get("audience") || "all") as ProductAudience | "all";
  const colorFilter = searchParams.get("color") || "all";
  const sizeFilter = searchParams.get("size") || "all";
  const minPrice = searchParams.get("min") || "";
  const maxPrice = searchParams.get("max") || "";
  const saleOnly = searchParams.get("sale") === "1";
  const inStockOnly = searchParams.get("stock") === "1";
  const sortBy = searchParams.get("sort") || "new";

  const [draft, setDraft] = useState<FilterDraft>({
    category: categorySlug,
    brand: brandFilter,
    audience: audienceFilter,
    color: colorFilter,
    size: sizeFilter,
    minPrice,
    maxPrice,
    saleOnly,
    inStockOnly,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["genan-products-categories-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,slug,name_ar,parent_id,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as Category[];
    },
    staleTime: 30 * 60 * 1000,
  });

  const { data: rawRows = [], isLoading } = useQuery({
    queryKey: ["genan-products-direct-v3"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select(`${PRODUCT_CARD_SELECT},audience,created_at,sort_order`)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(500);

      if (error) throw error;
      return (data || []) as RawProduct[];
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const rootCategories = useMemo(
    () => categories.filter((category) => !category.parent_id),
    [categories],
  );

  const getCategoryIds = (slug: string) => {
    if (!slug) return [];

    const current = categories.find((category) => category.slug === slug);
    if (!current) return [];

    const ids = new Set<string>([current.id]);
    let changed = true;

    while (changed) {
      changed = false;
      categories.forEach((category) => {
        if (category.parent_id && ids.has(category.parent_id) && !ids.has(category.id)) {
          ids.add(category.id);
          changed = true;
        }
      });
    }

    return Array.from(ids);
  };

  const currentCategory = categories.find((category) => category.slug === categorySlug) || null;
  const categoryIds = useMemo(() => getCategoryIds(categorySlug), [categories, categorySlug]);

  const brands = useMemo(
    () => Array.from(new Set(rawRows.map((row) => String(row.brand || "").trim()).filter(Boolean))).sort((a, b) => a.localeCompare(b)),
    [rawRows],
  );

  const colors = useMemo(() => {
    const map = new Map<string, ProductColor>();

    rawRows.forEach((row) => {
      getProductColors(row).forEach((color) => {
        const key = normalize(color.name);
        if (!map.has(key)) map.set(key, color);
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b, "ar"));
  }, [rawRows]);

  const sizes = useMemo(() => {
    const values = Array.from(new Set(rawRows.flatMap(getProductSizes)));

    return values.sort((a, b) => {
      const aNumber = Number(a);
      const bNumber = Number(b);

      if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) return aNumber - bNumber;
      if (Number.isFinite(aNumber)) return -1;
      if (Number.isFinite(bNumber)) return 1;
      return a.localeCompare(b, "ar");
    });
  }, [rawRows]);

  const priceRange = useMemo(() => {
    if (!rawRows.length) return { min: 0, max: 0 };

    const prices = rawRows.map(getFinalPrice).filter((price) => Number.isFinite(price));
    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [rawRows]);

  const filterRows = (
    rows: RawProduct[],
    filters: {
      category: string;
      brand: string;
      audience: ProductAudience | "all";
      color: string;
      size: string;
      minPrice: string;
      maxPrice: string;
      saleOnly: boolean;
      inStockOnly: boolean;
    },
  ) => {
    const scopedCategoryIds = getCategoryIds(filters.category);
    const minimum = filters.minPrice ? Number(filters.minPrice) : null;
    const maximum = filters.maxPrice ? Number(filters.maxPrice) : null;

    return rows.filter((row) => {
      if (scopedCategoryIds.length && !scopedCategoryIds.includes(String(row.category_id || ""))) return false;
      if (filters.brand !== "all" && String(row.brand || "") !== filters.brand) return false;
      if (filters.audience !== "all" && row.audience !== filters.audience) return false;

      if (filters.color !== "all") {
        const productColors = getProductColors(row).map((color) => normalize(color.name));
        if (!productColors.includes(normalize(filters.color))) return false;
      }

      if (filters.size !== "all") {
        const productSizes = getProductSizes(row).map(normalize);
        if (!productSizes.includes(normalize(filters.size))) return false;
      }

      const finalPrice = getFinalPrice(row);
      if (minimum !== null && Number.isFinite(minimum) && finalPrice < minimum) return false;
      if (maximum !== null && Number.isFinite(maximum) && finalPrice > maximum) return false;

      if (filters.saleOnly && Number(row.discount || 0) <= 0) return false;
      if (filters.inStockOnly && !row.in_stock) return false;

      if (searchQuery) {
        const haystack = [row.name, row.name_ar, row.brand, row.category, row.description, row.description_ar]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!haystack.includes(searchQuery)) return false;
      }

      return true;
    });
  };

  const filtered = useMemo(() => {
    const rows = filterRows(rawRows, {
      category: categorySlug,
      brand: brandFilter,
      audience: audienceFilter,
      color: colorFilter,
      size: sizeFilter,
      minPrice,
      maxPrice,
      saleOnly,
      inStockOnly,
    });

    rows.sort((a, b) => {
      if (sortBy === "price-asc") return getFinalPrice(a) - getFinalPrice(b);
      if (sortBy === "price-desc") return getFinalPrice(b) - getFinalPrice(a);
      if (sortBy === "best") {
        return Number(Boolean(b.is_best_seller)) - Number(Boolean(a.is_best_seller)) ||
          Number(a.sort_order || 0) - Number(b.sort_order || 0);
      }
      if (sortBy === "featured") {
        return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)) ||
          Number(a.sort_order || 0) - Number(b.sort_order || 0);
      }

      return String(b.created_at || "").localeCompare(String(a.created_at || "")) ||
        Number(a.sort_order || 0) - Number(b.sort_order || 0);
    });

    return rows.map((row) => mapProductCard(row as any));
  }, [
    rawRows,
    categories,
    categorySlug,
    brandFilter,
    audienceFilter,
    colorFilter,
    sizeFilter,
    minPrice,
    maxPrice,
    saleOnly,
    inStockOnly,
    searchQuery,
    sortBy,
  ]);

  const draftResultCount = useMemo(
    () => filterRows(rawRows, draft).length,
    [rawRows, categories, draft, searchQuery],
  );

  const visibleProducts = filtered.slice(0, visibleCount);

  const activeFilterCount =
    (categorySlug ? 1 : 0) +
    (brandFilter !== "all" ? 1 : 0) +
    (audienceFilter !== "all" ? 1 : 0) +
    (colorFilter !== "all" ? 1 : 0) +
    (sizeFilter !== "all" ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (saleOnly ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const draftFilterCount =
    (draft.category ? 1 : 0) +
    (draft.brand !== "all" ? 1 : 0) +
    (draft.audience !== "all" ? 1 : 0) +
    (draft.color !== "all" ? 1 : 0) +
    (draft.size !== "all" ? 1 : 0) +
    (draft.minPrice || draft.maxPrice ? 1 : 0) +
    (draft.saleOnly ? 1 : 0) +
    (draft.inStockOnly ? 1 : 0);

  const sortLabel =
    sortBy === "price-asc" ? "الأقل سعرًا" :
    sortBy === "price-desc" ? "الأعلى سعرًا" :
    sortBy === "best" ? "الأكثر اختيارًا" :
    sortBy === "featured" ? "مختارات جنان" : "الأحدث";

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);

    if (!value || value === "all") next.delete(key);
    else next.set(key, value);

    setVisibleCount(PAGE_SIZE);
    setSearchParams(next, { replace: true });
  };

  const openFilters = () => {
    setDraft({
      category: categorySlug,
      brand: brandFilter,
      audience: audienceFilter,
      color: colorFilter,
      size: sizeFilter,
      minPrice,
      maxPrice,
      saleOnly,
      inStockOnly,
    });
    setFiltersOpen(true);
  };

  const clearDraft = () => {
    setDraft({
      category: "",
      brand: "all",
      audience: "all",
      color: "all",
      size: "all",
      minPrice: "",
      maxPrice: "",
      saleOnly: false,
      inStockOnly: false,
    });
  };

  const applyFilters = () => {
    const next = new URLSearchParams(searchParams);

    const setOrDelete = (key: string, value: string | null) => {
      if (!value || value === "all") next.delete(key);
      else next.set(key, value);
    };

    setOrDelete("category", draft.category);
    setOrDelete("brand", draft.brand);
    setOrDelete("audience", draft.audience);
    setOrDelete("color", draft.color);
    setOrDelete("size", draft.size);
    setOrDelete("min", draft.minPrice);
    setOrDelete("max", draft.maxPrice);

    if (draft.saleOnly) next.set("sale", "1");
    else next.delete("sale");

    if (draft.inStockOnly) next.set("stock", "1");
    else next.delete("stock");

    setVisibleCount(PAGE_SIZE);
    setSearchParams(next, { replace: true });
    setFiltersOpen(false);
  };

  const clearFilters = () => {
    const next = new URLSearchParams();

    if (searchParams.get("search")) next.set("search", String(searchParams.get("search")));
    if (sortBy !== "new") next.set("sort", sortBy);

    setVisibleCount(PAGE_SIZE);
    setSearchParams(next, { replace: true });
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white text-[#0E0E0E]">
      <Navbar />
      <CartDrawer />

      <main className="pb-24">
        <section className="border-b border-[#EAEAEA] bg-white px-5 pb-10 pt-14 sm:px-8 md:px-[6vw] md:pb-14 md:pt-20">
          <div className="mx-auto grid max-w-[1760px] gap-8 md:grid-cols-[1.2fr_.8fr] md:items-end">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-12 bg-[#D8C29A]" />
                <span className="text-[8px] font-semibold tracking-[.34em] text-[#9A825B]">GENAN / CATALOG</span>
              </div>

              <h1 className="text-[40px] font-medium leading-[1.22] tracking-[-.055em] sm:text-[52px] md:text-[70px]">
                {currentCategory?.name_ar || (searchQuery ? `نتائج “${searchParams.get("search")}”` : "كل المنتجات")}
              </h1>
            </div>

            <div className="md:text-left">
              <p className="text-[11px] leading-7 text-[#707070] md:text-[13px]">
                اكتشف تشكيلتنا من الأزياء والإكسسوارات المختارة بعناية، واعثر على القطعة التي تكمل أسلوبك.
              </p>
              <p className="mt-4 text-[8px] font-semibold tracking-[.22em] text-[#A9D8D3]">{filtered.length} PRODUCTS</p>
            </div>
          </div>
        </section>

        <section className="border-b border-[#EEEAE3] bg-white px-4 py-4 sm:px-8 md:px-[6vw] md:py-5">
          <div className="mx-auto max-w-[1760px]">
            <div className="mb-2.5 flex items-center justify-between gap-4">
              <span className="text-[8px] font-medium text-[#8A847C]">تصفح حسب القسم</span>

              {categorySlug && (
                <button
                  type="button"
                  onClick={() => setParam("category", null)}
                  className="text-[8px] font-medium text-[#8F7548] underline decoration-[#CDB98F] underline-offset-4"
                >
                  عرض جميع المنتجات
                </button>
              )}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <button
                type="button"
                onClick={() => setParam("category", null)}
                className={`h-9 shrink-0 rounded-full border px-4 text-[9px] font-semibold transition-colors md:h-10 md:px-5 md:text-[10px] ${
                  !categorySlug
                    ? "border-[#171717] bg-[#171717] text-white"
                    : "border-[#E5E0D8] bg-white text-[#5F5A53] hover:border-[#CDB98F] hover:text-[#171717]"
                }`}
              >
                جميع المنتجات
              </button>

              {rootCategories.map((category) => (
                <button
                  type="button"
                  key={category.id}
                  onClick={() => setParam("category", category.slug)}
                  className={`h-9 shrink-0 rounded-full border px-4 text-[9px] font-semibold transition-colors md:h-10 md:px-5 md:text-[10px] ${
                    categorySlug === category.slug
                      ? "border-[#171717] bg-[#171717] text-white"
                      : "border-[#E5E0D8] bg-white text-[#5F5A53] hover:border-[#CDB98F] hover:text-[#171717]"
                  }`}
                >
                  {category.name_ar}
                </button>
              ))}
            </div>
          </div>
        </section>

        <section className="border-b border-[#EEEAE3] bg-white px-4 py-3 sm:px-8 md:px-[6vw] md:py-4">
          <div className="mx-auto flex max-w-[1760px] items-center justify-between gap-3">
            <p className="hidden text-[9px] text-[#77716A] sm:block">{filtered.length} منتج</p>

            <div className="grid w-full grid-cols-2 gap-2 sm:mr-auto sm:w-auto sm:min-w-[300px]">
              <button
                type="button"
                onClick={openFilters}
                className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-[10px] font-semibold transition-colors ${
                  activeFilterCount > 0
                    ? "border-[#CDB98F] bg-[#F7F3EA] text-[#27231F]"
                    : "border-[#E5E0D8] bg-white text-[#39342F] hover:border-[#CDB98F]"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={1.6} />
                فلترة متقدمة
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#171717] px-1 text-[8px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSortOpen(true)}
                className="flex h-10 items-center justify-center gap-2 rounded-xl border border-[#E5E0D8] bg-white px-4 text-[10px] font-semibold text-[#39342F] transition-colors hover:border-[#CDB98F]"
              >
                {sortLabel}
                <ChevronDown className="h-3.5 w-3.5" strokeWidth={1.6} />
              </button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1760px] px-3 pt-8 sm:px-5 md:px-[6vw] md:pt-12">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div key={index} className="aspect-[3/4] animate-pulse bg-[#F1F1F1]" />
              ))}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
              <span className="text-[8px] font-semibold tracking-[.28em] text-[#A9D8D3]">NO MATCHES</span>
              <h3 className="mt-3 text-[28px] font-medium">لا توجد منتجات مطابقة.</h3>
              <button
                type="button"
                onClick={clearFilters}
                className="mt-6 rounded-xl border border-[#0E0E0E] px-6 py-3 text-[10px] font-semibold"
              >
                إعادة التعيين
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 md:grid-cols-3 md:gap-x-5 md:gap-y-12 lg:grid-cols-4">
              {visibleProducts.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          )}

          {visibleCount < filtered.length && (
            <div className="flex justify-center py-14">
              <button
                type="button"
                onClick={() => setVisibleCount((value) => value + PAGE_SIZE)}
                className="rounded-xl border border-[#0E0E0E] px-8 py-3 text-[10px] font-semibold transition-colors hover:bg-[#0E0E0E] hover:text-white"
              >
                عرض المزيد
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {filtersOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/30 backdrop-blur-[1px]"
          onClick={() => setFiltersOpen(false)}
        >
          <aside
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-full max-w-[420px] flex-col bg-[#FFFEFC] shadow-[-18px_0_45px_rgba(20,20,20,.10)]"
          >
            <div className="flex items-center justify-between border-b border-[#EEEAE3] px-5 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[22px] font-semibold text-[#171717]">فلترة المنتجات</h2>
                  {draftFilterCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#171717] px-1 text-[8px] font-bold text-white">
                      {draftFilterCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[9px] text-[#8A847C]">حدد المواصفات التي تبحث عنها</p>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F1EB] text-[#5F5A53]"
                aria-label="إغلاق الفلترة"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
              <div>
                <p className="mb-3 text-[10px] font-semibold text-[#2A2723]">القسم</p>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setDraft((value) => ({ ...value, category: "" }))}
                    className={`h-9 shrink-0 rounded-full border px-4 text-[9px] font-semibold ${
                      !draft.category
                        ? "border-[#171717] bg-[#171717] text-white"
                        : "border-[#E5E0D8] bg-white text-[#5F5A53]"
                    }`}
                  >
                    الكل
                  </button>

                  {rootCategories.map((category) => (
                    <button
                      type="button"
                      key={category.id}
                      onClick={() => setDraft((value) => ({ ...value, category: category.slug }))}
                      className={`h-9 shrink-0 rounded-full border px-4 text-[9px] font-semibold ${
                        draft.category === category.slug
                          ? "border-[#171717] bg-[#171717] text-white"
                          : "border-[#E5E0D8] bg-white text-[#5F5A53]"
                      }`}
                    >
                      {category.name_ar}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-semibold text-[#2A2723]">الماركة</p>
                <div className="relative">
                  <select
                    value={draft.brand}
                    onChange={(event) => setDraft((value) => ({ ...value, brand: event.target.value }))}
                    className="h-11 w-full appearance-none rounded-xl border border-[#E5E0D8] bg-white px-4 text-[10px] text-[#44403A] outline-none focus:border-[#CDB98F]"
                  >
                    <option value="all">كل الماركات</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A847C]" />
                </div>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-semibold text-[#2A2723]">لمن</p>
                <div className="grid grid-cols-2 gap-2">
                  {AUDIENCE_OPTIONS.map((option) => {
                    const active = draft.audience === option.value;

                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() =>
                          setDraft((value) => ({
                            ...value,
                            audience: active ? "all" : option.value,
                          }))
                        }
                        className={`h-10 rounded-xl border text-[9px] font-semibold ${
                          active
                            ? "border-[#171717] bg-[#171717] text-white"
                            : "border-[#E5E0D8] bg-white text-[#5F5A53]"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {colors.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-[#2A2723]">اللون</p>
                    {draft.color !== "all" && (
                      <button
                        type="button"
                        onClick={() => setDraft((value) => ({ ...value, color: "all" }))}
                        className="text-[8px] text-[#8F7548]"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {colors.map((color) => {
                      const active = normalize(draft.color) === normalize(color.name);

                      return (
                        <button
                          type="button"
                          key={color.name}
                          onClick={() =>
                            setDraft((value) => ({
                              ...value,
                              color: active ? "all" : color.name,
                            }))
                          }
                          className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-right text-[8px] font-medium ${
                            active
                              ? "border-[#171717] bg-[#F7F3EA] text-[#171717]"
                              : "border-[#E5E0D8] bg-white text-[#5F5A53]"
                          }`}
                        >
                          <span
                            className="h-4 w-4 shrink-0 rounded-full border border-black/10"
                            style={{
                              background: color.hex2
                                ? `linear-gradient(135deg, ${color.hex || "#ddd"} 50%, ${color.hex2} 50%)`
                                : color.hex || "#ddd",
                            }}
                          />
                          <span className="truncate">{color.name}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[10px] font-semibold text-[#2A2723]">المقاس</p>
                    {draft.size !== "all" && (
                      <button
                        type="button"
                        onClick={() => setDraft((value) => ({ ...value, size: "all" }))}
                        className="text-[8px] text-[#8F7548]"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {sizes.map((size) => {
                      const active = normalize(draft.size) === normalize(size);

                      return (
                        <button
                          type="button"
                          key={size}
                          onClick={() =>
                            setDraft((value) => ({
                              ...value,
                              size: active ? "all" : size,
                            }))
                          }
                          className={`min-w-11 rounded-xl border px-3 py-2.5 text-[9px] font-semibold ${
                            active
                              ? "border-[#171717] bg-[#171717] text-white"
                              : "border-[#E5E0D8] bg-white text-[#5F5A53]"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[10px] font-semibold text-[#2A2723]">السعر</p>
                  <span className="text-[8px] text-[#9A958E]">
                    {priceRange.min} — {priceRange.max}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <label className="relative">
                    <span className="absolute right-3 top-2 text-[7px] text-[#9A958E]">من</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={draft.minPrice}
                      onChange={(event) => setDraft((value) => ({ ...value, minPrice: event.target.value }))}
                      placeholder={String(priceRange.min)}
                      className="h-12 w-full rounded-xl border border-[#E5E0D8] bg-white px-3 pt-3 text-[10px] outline-none focus:border-[#CDB98F]"
                    />
                  </label>

                  <label className="relative">
                    <span className="absolute right-3 top-2 text-[7px] text-[#9A958E]">إلى</span>
                    <input
                      type="number"
                      inputMode="decimal"
                      min="0"
                      value={draft.maxPrice}
                      onChange={(event) => setDraft((value) => ({ ...value, maxPrice: event.target.value }))}
                      placeholder={String(priceRange.max)}
                      className="h-12 w-full rounded-xl border border-[#E5E0D8] bg-white px-3 pt-3 text-[10px] outline-none focus:border-[#CDB98F]"
                    />
                  </label>
                </div>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-semibold text-[#2A2723]">التوفر والعروض</p>

                <div className="space-y-2">
                  {[
                    {
                      label: "العروض فقط",
                      active: draft.saleOnly,
                      toggle: () => setDraft((value) => ({ ...value, saleOnly: !value.saleOnly })),
                    },
                    {
                      label: "المتوفر فقط",
                      active: draft.inStockOnly,
                      toggle: () => setDraft((value) => ({ ...value, inStockOnly: !value.inStockOnly })),
                    },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.label}
                      onClick={item.toggle}
                      className={`flex h-11 w-full items-center justify-between rounded-xl border px-4 text-[10px] font-medium ${
                        item.active
                          ? "border-[#CDB98F] bg-[#F7F3EA] text-[#27231F]"
                          : "border-[#E5E0D8] bg-white text-[#5F5A53]"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          item.active ? "border-[#171717] bg-[#171717]" : "border-[#D8D2C9] bg-white"
                        }`}
                      >
                        {item.active && <Check className="h-3 w-3 text-white" strokeWidth={2} />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[.8fr_1.4fr] gap-2 border-t border-[#EEEAE3] bg-white px-5 py-4">
              <button
                type="button"
                onClick={clearDraft}
                className="h-11 rounded-xl border border-[#E1DCD4] bg-white text-[10px] font-semibold text-[#5F5A53]"
              >
                مسح
              </button>

              <button
                type="button"
                onClick={applyFilters}
                className="h-11 rounded-xl bg-[#171717] text-[10px] font-semibold text-white"
              >
                عرض {draftResultCount} منتج
              </button>
            </div>
          </aside>
        </div>
      )}

      {sortOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/35 p-0 md:items-center md:p-6"
          onClick={() => setSortOpen(false)}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            className="w-full bg-white p-6 md:max-w-[430px]"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[24px] font-medium">ترتيب المنتجات</h3>
              <button
                type="button"
                onClick={() => setSortOpen(false)}
                className="flex h-10 w-10 items-center justify-center border border-[#EAEAEA]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {[
              ["new", "الأحدث"],
              ["featured", "مختارات جنان"],
              ["best", "الأكثر اختيارًا"],
              ["price-asc", "الأقل سعرًا"],
              ["price-desc", "الأعلى سعرًا"],
            ].map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => {
                  setParam("sort", value);
                  setSortOpen(false);
                }}
                className={`mb-px w-full border border-[#EAEAEA] p-4 text-right text-[10px] font-semibold ${
                  sortBy === value ? "bg-[#0E0E0E] text-white" : "bg-white"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsPageServer;

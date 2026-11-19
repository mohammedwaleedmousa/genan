import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, ChevronDown, SlidersHorizontal, X } from "lucide-react";
import { useLocation, useNavigationType, useSearchParams } from "react-router-dom";

import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import ProductCategoryTabs from "@/components/ProductCategoryTabs";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CARD_SELECT, mapProductCard } from "@/lib/productCardData";
import { restoreCatalogScroll, catalogScrollKey } from "@/lib/catalogScroll";
import { getCategoryTreeIds } from "@/lib/categoryTree";

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
  created_at?: string | null;
  sort_order?: number | null;
  color_variants?: unknown;
  sizes?: unknown;
};

type FilterDraft = {
  category: string;
  brand: string;
  color: string;
  size: string;
  minPrice: string;
  maxPrice: string;
  saleOnly: boolean;
  inStockOnly: boolean;
};

const PAGE_SIZE = 12;

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
  const location = useLocation();
  const navigationType = useNavigationType();
  const restoredPath = useRef<string | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categorySlug = searchParams.get("category") || "";
  const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();
  const brandFilter = searchParams.get("brand") || "all";
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
    color: colorFilter,
    size: sizeFilter,
    minPrice,
    maxPrice,
    saleOnly,
    inStockOnly,
  });

  const { data: categories = [], isSuccess: categoriesLoaded } = useQuery({
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

  const { data: rawRows = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["genan-products-direct-v3"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select(`${PRODUCT_CARD_SELECT},created_at,sort_order`)
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

  const currentCategory = categories.find((category) => category.slug === categorySlug) || null;

  useEffect(() => {
    const hasUnknownCategory = categoriesLoaded && categorySlug && !currentCategory;
    if (!searchParams.has("audience") && !hasUnknownCategory) return;

    const next = new URLSearchParams(searchParams);
    next.delete("audience");
    if (hasUnknownCategory) next.delete("category");
    setSearchParams(next, { replace: true });
  }, [categoriesLoaded, categorySlug, currentCategory, searchParams, setSearchParams]);

  const categoryOptions = rootCategories.map((category) => ({ slug: category.slug, label: category.name_ar }));
  if (currentCategory?.parent_id) {
    categoryOptions.unshift({ slug: currentCategory.slug, label: currentCategory.name_ar });
  }


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

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name, "ar"));
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
      color: string;
      size: string;
      minPrice: string;
      maxPrice: string;
      saleOnly: boolean;
      inStockOnly: boolean;
    },
  ) => {
    const scopedCategoryIds = getCategoryTreeIds(categories, filters.category);
    const minimum = filters.minPrice ? Number(filters.minPrice) : null;
    const maximum = filters.maxPrice ? Number(filters.maxPrice) : null;

    return rows.filter((row) => {
      if (scopedCategoryIds.length && !scopedCategoryIds.includes(String(row.category_id || ""))) return false;
      if (filters.brand !== "all" && String(row.brand || "") !== filters.brand) return false;

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

  // Preserve the browsing position when returning from a product detail page.
  useEffect(() => {
    if (isLoading || isError || navigationType !== "POP") return;
    const path = `${location.pathname}${location.search}`;
    if (restoredPath.current === path || !sessionStorage.getItem(catalogScrollKey(path))) return;
    restoredPath.current = path;
    restoreCatalogScroll(path);
  }, [isLoading, isError, navigationType, location.pathname, location.search]);

  // Prevent the background catalog from moving while the mobile drawers are open.
  useEffect(() => {
    if (!filtersOpen && !sortOpen) return;
    const scrollY = window.scrollY;
    const body = document.body;
    const original = {
      position: body.style.position,
      top: body.style.top,
      width: body.style.width,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = original.position;
      body.style.top = original.top;
      body.style.width = original.width;
      body.style.overflow = original.overflow;
      window.scrollTo({ top: scrollY, behavior: "auto" });
    };
  }, [filtersOpen, sortOpen]);


  const activeFilterCount =
    (categorySlug ? 1 : 0) +
    (brandFilter !== "all" ? 1 : 0) +
    (colorFilter !== "all" ? 1 : 0) +
    (sizeFilter !== "all" ? 1 : 0) +
    (minPrice || maxPrice ? 1 : 0) +
    (saleOnly ? 1 : 0) +
    (inStockOnly ? 1 : 0);

  const draftFilterCount =
    (draft.category ? 1 : 0) +
    (draft.brand !== "all" ? 1 : 0) +
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

      <main id="main-content" className="pb-20">
        <header className="mx-auto max-w-[1280px] px-4 pb-3 pt-6 sm:px-6 sm:pt-8 lg:px-8 lg:pt-10">
          <div className="flex items-center justify-center gap-3 sm:gap-5">
            <span aria-hidden="true" className="h-px w-10 shrink-0 bg-[#D8C29A] sm:w-20" />
            <h1 className="min-w-0 break-words text-center text-2xl font-medium text-[#231C1C] sm:text-3xl md:text-4xl">
              {currentCategory?.name_ar || (searchQuery ? `نتائج “${searchParams.get("search")}”` : "جميع المنتجات")}
            </h1>
            <span aria-hidden="true" className="h-px w-10 shrink-0 bg-[#D8C29A] sm:w-20" />
          </div>

          <div className="mt-3 sm:mt-4">
            <ProductCategoryTabs
              categories={categoryOptions}
              selectedSlug={categorySlug}
              onSelect={(slug) => setParam("category", slug)}
            />
          </div>
        </header>

        <div className="sticky top-[56px] z-40 border-y border-[#F0E8E5] bg-white md:top-[120px]">
          <div className="product-grid-container flex flex-wrap items-center justify-between gap-2 py-2.5 sm:gap-4">
            <p aria-live="polite" className="basis-full text-center text-xs text-[#6B655D] sm:basis-auto sm:text-start">
              {isLoading ? "جاري تحميل المنتجات…" : isError ? "تعذّر تحميل المنتجات" : `${filtered.length} منتج`}
            </p>

            <div className="grid w-full grid-cols-2 gap-2 sm:w-auto">
              <button
                type="button"
                aria-expanded={filtersOpen}
                onClick={openFilters}
                className={`flex min-h-10 items-center justify-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors sm:px-5 ${activeFilterCount > 0 ? "border-burgundy bg-burgundy-soft text-burgundy" : "border-[#E8E0DA] bg-white text-[#39342F] hover:border-burgundy hover:text-burgundy"}`}
              >
                <SlidersHorizontal aria-hidden="true" className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                فلترة متقدمة
                {activeFilterCount > 0 && (
                  <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-burgundy px-1 text-[8px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <button
                type="button"
                aria-label={`ترتيب المنتجات: ${sortLabel}`}
                aria-expanded={sortOpen}
                onClick={() => setSortOpen(true)}
                className="flex min-h-10 items-center justify-center gap-2 rounded-full border border-[#E8E0DA] bg-white px-3 text-xs font-semibold text-[#39342F] transition-colors hover:border-burgundy hover:text-burgundy sm:px-5"
              >
                {sortLabel}
                <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} />
              </button>
            </div>
          </div>
        </div>

        <section id="products-grid" aria-label="نتائج المنتجات" aria-busy={isLoading} className="product-grid-container relative z-0 pt-5 sm:pt-7">
          {isLoading ? (
            <div className="product-card-grid">
              {Array.from({ length: 8 }, (_, index) => <ProductCardSkeleton key={index} />)}
            </div>
          ) : isError ? (
            <div role="alert" className="mx-auto flex min-h-[52vh] max-w-lg flex-col items-center justify-center text-center" dir="rtl">
              <span className="text-[9px] font-semibold tracking-[.2em] text-[#9A825B]">GENAN / CONNECTION</span>
              <h3 className="mt-3 text-[24px] font-semibold text-[#171717]">تعذر تحميل المنتجات</h3>
              <p className="mt-3 text-sm leading-7 text-[#6B655D]">حدث خطأ أثناء الاتصال بالمتجر. يرجى المحاولة مجددًا.</p>
              <button type="button" onClick={() => { void refetch(); }} className="mt-6 min-h-11 rounded-xl bg-burgundy px-8 py-3 text-sm font-semibold text-white hover:bg-burgundy-hover">
                إعادة المحاولة
              </button>
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
              <span className="text-[9px] font-semibold tracking-[.24em] text-[#9A825B]">GENAN / COLLECTION</span>
              <h3 className="mt-3 text-[24px] font-semibold">
                {rawRows.length === 0 ? "مجموعة جنان قيد التجهيز" : "لا توجد منتجات مطابقة"}
              </h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-[#6B655D]">
                {rawRows.length === 0
                  ? "نعمل على تجهيز منتجات جنان بصورها وأسعارها وتفاصيلها قبل عرضها للبيع."
                  : "جرّب إزالة بعض الفلاتر أو اختيار قسم آخر."}
              </p>
              {rawRows.length > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-6 min-h-11 rounded-full border border-burgundy px-6 py-3 text-burgundy text-sm font-semibold transition-colors hover:bg-burgundy hover:text-white"
                >
                  مسح الفلاتر
                </button>
              )}
            </div>
          ) : (
            <div className="product-card-grid">
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
                className="min-h-10 rounded-full border border-burgundy px-8 py-2 text-burgundy text-[10px] font-semibold transition-colors hover:bg-burgundy hover:text-white"
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
          className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[2px]"
          onClick={() => setFiltersOpen(false)}
        >
          <aside
            onClick={(event) => event.stopPropagation()}
            className="absolute inset-y-0 right-0 flex w-full max-w-[450px] flex-col bg-[#F8F7F4] shadow-[-18px_0_45px_rgba(20,20,20,.14)]"
          >
            <div className="flex items-center justify-between border-b border-[#EEEAE3] bg-white px-5 py-5">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-[22px] font-bold text-[#171717]">فلترة المنتجات</h2>
                  {draftFilterCount > 0 && (
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-burgundy px-1 text-[8px] font-bold text-white">
                      {draftFilterCount}
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[#8A847C]">حدد المواصفات التي تبحث عنها</p>
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

            <div className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5">
              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="mb-3 text-[13px] font-bold text-[#2A2723]">القسم</p>
                <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  <button
                    type="button"
                    onClick={() => setDraft((value) => ({ ...value, category: "" }))}
                    className={`h-11 shrink-0 rounded-2xl border px-4 text-[11px] font-semibold ${
                      !draft.category
                        ? "border-burgundy bg-burgundy text-white"
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
                      className={`h-11 shrink-0 rounded-2xl border px-4 text-[11px] font-semibold ${
                        draft.category === category.slug
                          ? "border-burgundy bg-burgundy text-white"
                          : "border-[#E5E0D8] bg-white text-[#5F5A53]"
                      }`}
                    >
                      {category.name_ar}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="mb-3 text-[13px] font-bold text-[#2A2723]">الماركة</p>
                <div className="relative">
                  <select
                    value={draft.brand}
                    onChange={(event) => setDraft((value) => ({ ...value, brand: event.target.value }))}
                    className="h-12 w-full appearance-none rounded-2xl border border-[#E5E0D8] bg-[#FAF9F7] px-4 text-[12px] text-[#44403A] outline-none focus:border-[#CDB98F]"
                  >
                    <option value="all">كل الماركات</option>
                    {brands.map((brand) => (
                      <option key={brand} value={brand}>{brand}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A847C]" />
                </div>
              </div>

              {colors.length > 0 && (
                <div className="rounded-3xl bg-white p-4 shadow-sm">
                  <p className="mb-3 text-[13px] font-bold text-[#2A2723]">اللون</p>

                  <div className="relative">
                    <select
                      value={draft.color}
                      onChange={(event) =>
                        setDraft((value) => ({ ...value, color: event.target.value }))
                      }
                      className="h-12 w-full appearance-none rounded-2xl border border-[#E5E0D8] bg-[#FAF9F7] px-4 pr-11 text-[12px] text-[#44403A] outline-none focus:border-[#CDB98F]"
                    >
                      <option value="all">كل الألوان</option>
                      {colors.map((color) => (
                        <option key={color.name} value={color.name}>
                          {color.name}
                        </option>
                      ))}
                    </select>

                    <span
                      className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-black/10"
                      style={{
                        background:
                          draft.color === "all"
                            ? "#F2EFE8"
                            : (() => {
                                const selected = colors.find(
                                  (color) => normalize(color.name) === normalize(draft.color),
                                );

                                if (!selected) return "#F2EFE8";

                                return selected.hex2
                                  ? `linear-gradient(135deg, ${selected.hex || "#ddd"} 50%, ${selected.hex2} 50%)`
                                  : selected.hex || "#ddd";
                              })(),
                      }}
                    />

                    <ChevronDown className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A847C]" />
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-[13px] font-bold text-[#2A2723]">المقاس</p>
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
                          className={`min-w-12 rounded-2xl border px-4 py-3 text-[12px] font-semibold ${
                            active
                              ? "border-burgundy bg-burgundy text-white"
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

              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-[13px] font-bold text-[#2A2723]">السعر</p>
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
                      className="h-14 w-full rounded-2xl border border-[#E5E0D8] bg-[#FAF9F7] px-3 pt-3 text-[12px] outline-none focus:border-[#CDB98F]"
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
                      className="h-14 w-full rounded-2xl border border-[#E5E0D8] bg-[#FAF9F7] px-3 pt-3 text-[12px] outline-none focus:border-[#CDB98F]"
                    />
                  </label>
                </div>
              </div>

              <div className="rounded-3xl bg-white p-4 shadow-sm">
                <p className="mb-3 text-[13px] font-bold text-[#2A2723]">التوفر والعروض</p>

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
                      className={`flex h-12 w-full items-center justify-between rounded-2xl border px-4 text-[12px] font-medium ${
                        item.active
                          ? "border-[#CDB98F] bg-[#F7F3EA] text-[#27231F]"
                          : "border-[#E5E0D8] bg-white text-[#5F5A53]"
                      }`}
                    >
                      <span>{item.label}</span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                          item.active ? "border-burgundy bg-burgundy" : "border-[#D8D2C9] bg-white"
                        }`}
                      >
                        {item.active && <Check className="h-3 w-3 text-white" strokeWidth={2} />}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[.8fr_1.4fr] gap-3 border-t border-[#EEEAE3] bg-white px-5 py-4">
              <button
                type="button"
                onClick={clearDraft}
                className="h-12 rounded-2xl border border-[#E1DCD4] bg-white text-[12px] font-semibold text-[#5F5A53]"
              >
                مسح
              </button>

              <button
                type="button"
                onClick={applyFilters}
                className="h-12 rounded-2xl bg-burgundy text-[12px] font-semibold text-white"
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
            className="w-full rounded-t-3xl bg-white p-6 md:max-w-[430px] md:rounded-3xl"
          >
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[24px] font-medium">ترتيب المنتجات</h3>
              <button
                type="button"
                onClick={() => setSortOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#EAEAEA]"
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
                className={`mb-2 w-full rounded-2xl border border-[#EAEAEA] p-4 text-right text-[12px] font-semibold ${
                  sortBy === value ? "bg-burgundy text-white" : "bg-white"
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

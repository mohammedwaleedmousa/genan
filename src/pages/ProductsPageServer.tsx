import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, SlidersHorizontal, X } from "lucide-react";
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

type RawProduct = Record<string, any> & {
  audience?: ProductAudience | null;
  created_at?: string | null;
  sort_order?: number | null;
};

const PAGE_SIZE = 12;

const AUDIENCE_OPTIONS: Array<{ value: ProductAudience; label: string }> = [
  { value: "women", label: "نسائي" },
  { value: "men", label: "رجالي" },
  { value: "kids", label: "أطفال" },
  { value: "unisex", label: "للجنسين" },
];

const ProductsPageServer = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categorySlug = searchParams.get("category") || "";
  const searchQuery = (searchParams.get("search") || "").trim().toLowerCase();
  const brandFilter = searchParams.get("brand") || "all";
  const audienceFilter = (searchParams.get("audience") || "all") as ProductAudience | "all";
  const saleOnly = searchParams.get("sale") === "1";
  const inStockOnly = searchParams.get("stock") === "1";
  const sortBy = searchParams.get("sort") || "new";

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
    queryKey: ["genan-products-direct-v2"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select(`${PRODUCT_CARD_SELECT},audience,created_at,sort_order`)
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(300);
      if (error) throw error;
      return (data || []) as RawProduct[];
    },
    staleTime: 2 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const currentCategory = categories.find((category) => category.slug === categorySlug) || null;

  const categoryIds = useMemo(() => {
    if (!currentCategory) return [];
    const childIds = categories.filter((category) => category.parent_id === currentCategory.id).map((category) => category.id);
    return [currentCategory.id, ...childIds];
  }, [categories, currentCategory]);

  const brands = useMemo(
    () => Array.from(new Set(rawRows.map((row) => String(row.brand || "").trim()).filter(Boolean))).sort(),
    [rawRows],
  );

  const filtered = useMemo(() => {
    const rows = rawRows.filter((row) => {
      if (categoryIds.length && !categoryIds.includes(String(row.category_id || ""))) return false;
      if (brandFilter !== "all" && String(row.brand || "") !== brandFilter) return false;
      if (audienceFilter !== "all" && row.audience !== audienceFilter) return false;
      if (saleOnly && Number(row.discount || 0) <= 0) return false;
      if (inStockOnly && !row.in_stock) return false;

      if (searchQuery) {
        const haystack = [row.name, row.name_ar, row.brand, row.category, row.description, row.description_ar]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(searchQuery)) return false;
      }

      return true;
    });

    rows.sort((a, b) => {
      if (sortBy === "price-asc") return Number(a.price || 0) - Number(b.price || 0);
      if (sortBy === "price-desc") return Number(b.price || 0) - Number(a.price || 0);
      if (sortBy === "best") return Number(Boolean(b.is_best_seller)) - Number(Boolean(a.is_best_seller)) || Number(a.sort_order || 0) - Number(b.sort_order || 0);
      if (sortBy === "featured") return Number(Boolean(b.is_featured)) - Number(Boolean(a.is_featured)) || Number(a.sort_order || 0) - Number(b.sort_order || 0);
      return String(b.created_at || "").localeCompare(String(a.created_at || "")) || Number(a.sort_order || 0) - Number(b.sort_order || 0);
    });

    return rows.map((row) => mapProductCard(row as any));
  }, [rawRows, categoryIds, brandFilter, audienceFilter, saleOnly, inStockOnly, searchQuery, sortBy]);

  const visibleProducts = filtered.slice(0, visibleCount);
  const activeFilterCount =
    (brandFilter !== "all" ? 1 : 0) +
    (audienceFilter !== "all" ? 1 : 0) +
    (saleOnly ? 1 : 0) +
    (inStockOnly ? 1 : 0);

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

  const clearFilters = () => {
    const next = new URLSearchParams();
    if (categorySlug) next.set("category", categorySlug);
    if (searchQuery) next.set("search", searchQuery);
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

              {categories.filter((category) => !category.parent_id).map((category) => (
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
            <p className="hidden text-[9px] text-[#77716A] sm:block">
              {filtered.length} منتج
            </p>

            <div className="grid w-full grid-cols-2 gap-2 sm:mr-auto sm:w-auto sm:min-w-[300px]">
              <button
                type="button"
                onClick={() => setFiltersOpen(true)}
                className={`flex h-10 items-center justify-center gap-2 rounded-xl border px-4 text-[10px] font-semibold transition-colors ${
                  activeFilterCount > 0
                    ? "border-[#CDB98F] bg-[#F7F3EA] text-[#27231F]"
                    : "border-[#E5E0D8] bg-white text-[#39342F] hover:border-[#CDB98F]"
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" strokeWidth={1.6} />
                فلترة
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
              {Array.from({ length: 8 }).map((_, index) => <div key={index} className="aspect-[3/4] animate-pulse bg-[#F1F1F1]" />)}
            </div>
          ) : visibleProducts.length === 0 ? (
            <div className="flex min-h-[52vh] flex-col items-center justify-center text-center">
              <span className="text-[8px] font-semibold tracking-[.28em] text-[#A9D8D3]">NO MATCHES</span>
              <h3 className="mt-3 text-[28px] font-medium">لا توجد منتجات مطابقة.</h3>
              <button onClick={clearFilters} className="mt-6 border border-[#0E0E0E] px-6 py-3 text-[10px] font-semibold">إعادة التعيين</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 md:grid-cols-3 md:gap-x-5 md:gap-y-12 lg:grid-cols-4">
              {visibleProducts.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
            </div>
          )}

          {visibleCount < filtered.length && (
            <div className="flex justify-center py-14">
              <button onClick={() => setVisibleCount((value) => value + PAGE_SIZE)} className="border border-[#0E0E0E] px-8 py-3 text-[10px] font-semibold transition-colors hover:bg-[#0E0E0E] hover:text-white">
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
            className="absolute inset-y-0 right-0 flex w-full max-w-[390px] flex-col bg-[#FFFEFC] shadow-[-18px_0_45px_rgba(20,20,20,.10)]"
          >
            <div className="flex items-center justify-between border-b border-[#EEEAE3] px-5 py-5">
              <div>
                <h2 className="text-[22px] font-semibold text-[#171717]">فلترة المنتجات</h2>
                <p className="mt-1 text-[9px] text-[#8A847C]">اختر ما يناسبك ثم اعرض النتائج</p>
              </div>

              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F4F1EB] text-[#5F5A53] transition-colors hover:bg-[#EDE8DF]"
                aria-label="إغلاق الفلترة"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 space-y-7 overflow-y-auto px-5 py-6">
              <div>
                <p className="mb-3 text-[10px] font-semibold text-[#2A2723]">الماركة</p>
                <div className="relative">
                  <select
                    value={brandFilter}
                    onChange={(e) => setParam("brand", e.target.value)}
                    className="h-11 w-full appearance-none rounded-xl border border-[#E5E0D8] bg-white px-4 text-[10px] text-[#44403A] outline-none transition-colors focus:border-[#CDB98F]"
                  >
                    <option value="all">كل الماركات</option>
                    {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-4 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8A847C]" />
                </div>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-semibold text-[#2A2723]">لمن</p>
                <div className="grid grid-cols-2 gap-2">
                  {AUDIENCE_OPTIONS.map((option) => {
                    const active = audienceFilter === option.value;
                    return (
                      <button
                        type="button"
                        key={option.value}
                        onClick={() => setParam("audience", active ? null : option.value)}
                        className={`h-10 rounded-xl border text-[9px] font-semibold transition-colors ${
                          active
                            ? "border-[#171717] bg-[#171717] text-white"
                            : "border-[#E5E0D8] bg-white text-[#5F5A53] hover:border-[#CDB98F]"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="mb-3 text-[10px] font-semibold text-[#2A2723]">التوفر والعروض</p>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setParam("sale", saleOnly ? null : "1")}
                    className={`flex h-11 w-full items-center justify-between rounded-xl border px-4 text-[10px] font-medium transition-colors ${
                      saleOnly
                        ? "border-[#CDB98F] bg-[#F7F3EA] text-[#27231F]"
                        : "border-[#E5E0D8] bg-white text-[#5F5A53]"
                    }`}
                  >
                    <span>العروض فقط</span>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      saleOnly ? "border-[#171717] bg-[#171717]" : "border-[#D8D2C9] bg-white"
                    }`}>
                      {saleOnly && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setParam("stock", inStockOnly ? null : "1")}
                    className={`flex h-11 w-full items-center justify-between rounded-xl border px-4 text-[10px] font-medium transition-colors ${
                      inStockOnly
                        ? "border-[#CDB98F] bg-[#F7F3EA] text-[#27231F]"
                        : "border-[#E5E0D8] bg-white text-[#5F5A53]"
                    }`}
                  >
                    <span>المتوفر فقط</span>
                    <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                      inStockOnly ? "border-[#171717] bg-[#171717]" : "border-[#D8D2C9] bg-white"
                    }`}>
                      {inStockOnly && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-[.8fr_1.4fr] gap-2 border-t border-[#EEEAE3] bg-white px-5 py-4">
              <button
                type="button"
                onClick={clearFilters}
                className="h-11 rounded-xl border border-[#E1DCD4] bg-white text-[10px] font-semibold text-[#5F5A53]"
              >
                مسح
              </button>
              <button
                type="button"
                onClick={() => setFiltersOpen(false)}
                className="h-11 rounded-xl bg-[#171717] text-[10px] font-semibold text-white"
              >
                عرض {filtered.length} منتج
              </button>
            </div>
          </aside>
        </div>
      )}

      {sortOpen && (
        <div className="fixed inset-0 z-[110] flex items-end justify-center bg-black/35 p-0 md:items-center md:p-6" onClick={() => setSortOpen(false)}>
          <div onClick={(event) => event.stopPropagation()} className="w-full bg-white p-6 md:max-w-[430px]">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-[24px] font-medium">ترتيب المنتجات</h3>
              <button onClick={() => setSortOpen(false)} className="flex h-10 w-10 items-center justify-center border border-[#EAEAEA]"><X className="h-4 w-4" /></button>
            </div>
            {[
              ["new", "الأحدث"],
              ["featured", "مختارات جنان"],
              ["best", "الأكثر اختيارًا"],
              ["price-asc", "الأقل سعرًا"],
              ["price-desc", "الأعلى سعرًا"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => { setParam("sort", value); setSortOpen(false); }}
                className={`mb-px w-full border border-[#EAEAEA] p-4 text-right text-[10px] font-semibold ${sortBy === value ? "bg-[#0E0E0E] text-white" : "bg-white"}`}
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

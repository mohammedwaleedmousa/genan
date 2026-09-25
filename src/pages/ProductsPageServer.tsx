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

        <section className="border-b border-[#EAEAEA] bg-white px-5 sm:px-8 md:px-[6vw]">
          <div className="mx-auto flex max-w-[1760px] gap-0 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <button onClick={() => setParam("category", null)} className={`shrink-0 border-l border-[#EAEAEA] px-5 py-4 text-[9px] font-semibold ${!categorySlug ? "bg-[#0E0E0E] text-white" : "bg-white text-[#666] hover:bg-[#FAFAFA]"}`}>الكل</button>
            {categories.filter((category) => !category.parent_id).map((category) => (
              <button
                key={category.id}
                onClick={() => setParam("category", category.slug)}
                className={`shrink-0 border-l border-[#EAEAEA] px-5 py-4 text-[9px] font-semibold ${categorySlug === category.slug ? "bg-[#0E0E0E] text-white" : "bg-white text-[#666] hover:bg-[#FAFAFA]"}`}
              >
                {category.name_ar}
              </button>
            ))}
          </div>
        </section>

        <section className="border-b border-[#EAEAEA] bg-white px-5 py-2.5 md:px-[6vw] md:py-3">
          <div className="mx-auto flex h-11 max-w-[1760px] border border-[#EAEAEA] md:h-12">
            <button onClick={() => setFiltersOpen(true)} className="flex flex-1 items-center justify-center gap-2 border-l border-[#EAEAEA] text-[10px] font-semibold">
              <SlidersHorizontal className="h-4 w-4" />
              فلترة
              {activeFilterCount > 0 && <span className="flex h-5 min-w-5 items-center justify-center bg-[#A9D8D3] px-1 text-[8px] font-bold text-[#0E0E0E]">{activeFilterCount}</span>}
            </button>
            <button onClick={() => setSortOpen(true)} className="flex flex-1 items-center justify-center gap-2 text-[10px] font-semibold">
              {sortLabel}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
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
        <div className="fixed inset-0 z-[100] bg-black/35" onClick={() => setFiltersOpen(false)}>
          <aside onClick={(event) => event.stopPropagation()} className="absolute inset-y-0 right-0 w-full max-w-[430px] overflow-y-auto bg-white p-6">
            <div className="flex items-start justify-between border-b border-[#EAEAEA] pb-5">
              <div>
                <span className="text-[8px] font-semibold tracking-[.28em] text-[#9A825B]">FILTER / GENAN</span>
                <h2 className="mt-2 text-[28px] font-medium">تصفية المنتجات</h2>
              </div>
              <button onClick={() => setFiltersOpen(false)} className="flex h-10 w-10 items-center justify-center border border-[#EAEAEA]"><X className="h-4 w-4" /></button>
            </div>

            <div className="space-y-8 py-7">
              <div>
                <p className="mb-3 text-[9px] font-semibold tracking-[.08em]">الماركة</p>
                <select value={brandFilter} onChange={(e) => setParam("brand", e.target.value)} className="h-12 w-full border border-[#DDD] bg-white px-3 text-[11px]">
                  <option value="all">كل الماركات</option>
                  {brands.map((brand) => <option key={brand} value={brand}>{brand}</option>)}
                </select>
              </div>

              <div>
                <p className="mb-3 text-[9px] font-semibold tracking-[.08em]">الفئة</p>
                <div className="grid grid-cols-2 gap-px bg-[#EAEAEA]">
                  {AUDIENCE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setParam("audience", audienceFilter === option.value ? null : option.value)}
                      className={`min-h-11 px-3 text-[9px] font-semibold ${audienceFilter === option.value ? "bg-[#0E0E0E] text-white" : "bg-white text-[#666]"}`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-px bg-[#EAEAEA]">
                <button onClick={() => setParam("sale", saleOnly ? null : "1")} className={`min-h-12 px-3 text-[9px] font-semibold ${saleOnly ? "bg-[#D8C29A] text-[#0E0E0E]" : "bg-white"}`}>العروض فقط</button>
                <button onClick={() => setParam("stock", inStockOnly ? null : "1")} className={`min-h-12 px-3 text-[9px] font-semibold ${inStockOnly ? "bg-[#A9D8D3] text-[#0E0E0E]" : "bg-white"}`}>المتوفر فقط</button>
              </div>
            </div>

            <div className="sticky bottom-0 grid grid-cols-2 gap-2 border-t border-[#EAEAEA] bg-white py-4">
              <button onClick={clearFilters} className="h-12 border border-[#0E0E0E] text-[10px] font-semibold">مسح</button>
              <button onClick={() => setFiltersOpen(false)} className="h-12 bg-[#0E0E0E] text-[10px] font-semibold text-white">عرض {filtered.length}</button>
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

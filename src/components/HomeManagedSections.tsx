import { useMemo, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronUp } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CARD_SELECT, mapProductCard } from "@/lib/productCardData";

type ManagedSection = {
  id: string;
  title: string;
  title_ar: string;
  filter_type: string | null;
  max_products: number | null;
  show_view_all: boolean | null;
  view_all_link: string | null;
  sort_order: number | null;
};

type ProductRow = Record<string, any> & {
  section_ids?: string[] | null;
  created_at?: string | null;
  sort_order?: number | null;
};

type BestSellerStat = {
  product_id: string;
  sold_quantity: number;
  order_count: number;
};

type HomeManagedSectionsProps = {
  betweenSections?: ReactNode;
  afterSections?: ReactNode;
};

const INITIAL_VISIBLE = 8;
const LOAD_MORE_STEP = 8;
const BEST_SELLER_LIMIT = 40;
const DEFAULT_SECTION_FETCH_LIMIT = 48;
const MAX_SECTION_FETCH_LIMIT = 64;
const HOME_CACHE_MS = 5 * 60 * 1000;

const getSectionFetchLimit = (section: ManagedSection) => {
  const configured = Number(section.max_products || 0);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_SECTION_FETCH_LIMIT;
  return Math.min(Math.max(configured, INITIAL_VISIBLE), MAX_SECTION_FETCH_LIMIT);
};

const HomeManagedSections = ({ betweenSections, afterSections }: HomeManagedSectionsProps) => {
  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});

  const { data: sections = [] } = useQuery({
    queryKey: ["home-managed-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("homepage_sections")
        .select("id,title,title_ar,filter_type,max_products,show_view_all,view_all_link,sort_order")
        .eq("is_active", true)
        .in("filter_type", ["featured", "best_seller"])
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as ManagedSection[];
    },
    staleTime: HOME_CACHE_MS,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const sectionSignature = useMemo(
    () => sections.map((section) => `${section.id}:${getSectionFetchLimit(section)}`).join(","),
    [sections],
  );

  const { data: rows = [] } = useQuery({
    queryKey: ["home-managed-section-products", sectionSignature, "bounded-v2"],
    enabled: sections.length > 0,
    queryFn: async () => {
      const requests = sections.map(async (section) => {
        const limit = getSectionFetchLimit(section);
        let query = (supabase as any)
          .from("products")
          .select(`${PRODUCT_CARD_SELECT},section_ids,created_at,sort_order`)
          .eq("is_active", true)
          .eq("in_stock", true);

        if (section.filter_type === "best_seller") {
          query = query.or(`section_ids.cs.{${section.id}},is_best_seller.eq.true`);
        } else {
          query = query.or(`section_ids.cs.{${section.id}},is_featured.eq.true`);
        }

        const { data, error } = await query
          .order("sort_order", { ascending: true, nullsFirst: false })
          .limit(limit);

        if (error) throw error;
        return (data || []) as ProductRow[];
      });

      const results = await Promise.all(requests);
      const merged = new Map<string, ProductRow>();
      results.flat().forEach((row) => merged.set(String(row.id), row));
      return Array.from(merged.values());
    },
    staleTime: HOME_CACHE_MS,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: bestSellerStats = [] } = useQuery({
    queryKey: ["home-best-seller-stats", "confirmed-sales-v2"],
    enabled: sections.some((section) => section.filter_type === "best_seller"),
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("get_best_seller_products", {
        p_limit: BEST_SELLER_LIMIT,
      });
      if (error) throw error;
      return (data || []) as BestSellerStat[];
    },
    staleTime: HOME_CACHE_MS,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const soldIds = useMemo(() => bestSellerStats.map((stat) => stat.product_id), [bestSellerStats]);

  const { data: soldRows = [] } = useQuery({
    queryKey: ["home-best-seller-products", soldIds.join(",")],
    enabled: soldIds.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("products")
        .select(`${PRODUCT_CARD_SELECT},section_ids,created_at,sort_order`)
        .eq("is_active", true)
        .eq("in_stock", true)
        .in("id", soldIds)
        .limit(BEST_SELLER_LIMIT);

      if (error) throw error;
      return (data || []) as ProductRow[];
    },
    staleTime: HOME_CACHE_MS,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const rendered = useMemo(
    () =>
      sections
        .map((section) => {
          if (section.filter_type === "best_seller") {
            const soldById = new Map(soldRows.map((row) => [String(row.id), row]));
            const ranked = bestSellerStats
              .map((stat) => soldById.get(String(stat.product_id)))
              .filter(Boolean) as ProductRow[];

            const fallback = rows
              .filter(
                (row) =>
                  (Array.isArray(row.section_ids) && row.section_ids.includes(section.id)) ||
                  Boolean(row.is_best_seller),
              )
              .filter((row) => !soldById.has(String(row.id)))
              .sort((a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0));

            return {
              section,
              products: [...ranked, ...fallback]
                .slice(0, getSectionFetchLimit(section))
                .map((row) => mapProductCard(row as any)),
            };
          }

          const source = rows.filter(
            (row) =>
              (Array.isArray(row.section_ids) && row.section_ids.includes(section.id)) ||
              Boolean(row.is_featured),
          );
          const sorted = [...source].sort(
            (a, b) => Number(a.sort_order || 0) - Number(b.sort_order || 0) || Number(b.price || 0) - Number(a.price || 0),
          );

          return {
            section,
            products: sorted.slice(0, getSectionFetchLimit(section)).map((row) => mapProductCard(row as any)),
          };
        })
        .filter((entry) => entry.products.length > 0),
    [rows, sections, bestSellerStats, soldRows],
  );

  const loadMore = (id: string, total: number) =>
    setVisibleCounts((current) => ({
      ...current,
      [id]: Math.min((current[id] || INITIAL_VISIBLE) + LOAD_MORE_STEP, total),
    }));

  const collapse = (id: string, count: number) => {
    const next = Math.max(INITIAL_VISIBLE, count - LOAD_MORE_STEP);
    setVisibleCounts((current) => ({ ...current, [id]: next }));
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() =>
        document
          .getElementById(`home-section-${id}-product-${next - 1}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" }),
      ),
    );
  };

  if (!rendered.length) return null;

  return (
    <>
      {rendered.map(({ section, products }, sectionIndex) => {
        const visibleCount = Math.min(visibleCounts[section.id] || INITIAL_VISIBLE, products.length);
        const visibleProducts = products.slice(0, visibleCount);
        const hasMore = visibleCount < products.length;
        const canCollapse = visibleCount > INITIAL_VISIBLE;

        return (
          <div key={section.id}>
            <section
              id={`home-section-${section.id}`}
              className={`scroll-mt-20 py-12 md:py-24 ${sectionIndex % 2 === 0 ? "bg-[#F8F6F0]" : "bg-[#F1EDE2]"}`}
            >
              <div className="mx-auto w-full max-w-[1680px] px-4 md:px-7 lg:px-10">
                <div className="mb-8 flex items-end justify-between gap-6 md:mb-12">
                  <div>
                    <div className="mb-3 flex items-center gap-3">
                      <span className="h-px w-10 bg-[#B89453]/60" />
                      <span className="text-[7px] font-semibold uppercase tracking-[.28em] text-[#9D7B40] md:text-[8px]">
                        {section.title || "GENAN EDIT"}
                      </span>
                    </div>
                    <h2 className="max-w-[720px] text-[27px] font-medium leading-[1.4] tracking-[-0.045em] text-[#173A2D] md:text-[42px]">
                      {section.title_ar}
                    </h2>
                    <p className="mt-3 hidden max-w-[520px] text-[11px] leading-7 text-[#6F786F] md:block">
                      اختيارات مميزة، مرتبة لتصل إلى ما يناسبك بسرعة.
                    </p>
                  </div>

                  {section.view_all_link && (
                    <Link
                      to={section.view_all_link}
                      className="hidden items-center gap-3 border-b border-[#B89453]/55 pb-1 text-[10px] font-semibold text-[#173A2D] transition-colors hover:text-[#9D7B40] md:flex"
                    >
                      عرض الكل
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:gap-x-4 md:grid-cols-3 md:gap-x-5 md:gap-y-12 lg:grid-cols-4 xl:grid-cols-5 xl:gap-x-6">
                  {visibleProducts.map((product, index) => (
                    <div
                      key={product.id}
                      id={`home-section-${section.id}-product-${index}`}
                      className="min-w-0"
                    >
                      <ProductCard product={product} index={sectionIndex * INITIAL_VISIBLE + index} />
                    </div>
                  ))}
                </div>

                {(hasMore || canCollapse) && section.show_view_all !== false && (
                  <div className="mt-10 flex flex-wrap items-center justify-center gap-3 md:mt-16">
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => loadMore(section.id, products.length)}
                        className="inline-flex h-11 items-center gap-2 border border-[#173A2D] bg-transparent px-7 text-[8px] font-semibold text-[#173A2D] transition-colors hover:bg-[#173A2D] hover:text-white md:h-12 md:px-9 md:text-[10px]"
                      >
                        عرض المزيد
                        <ChevronDown className="h-4 w-4" />
                      </button>
                    )}

                    {canCollapse && (
                      <button
                        type="button"
                        onClick={() => collapse(section.id, visibleCount)}
                        className="inline-flex h-11 items-center gap-2 border border-[#CFC7B8] bg-transparent px-6 text-[8px] font-semibold text-[#657068] md:h-12 md:px-8 md:text-[10px]"
                      >
                        تقليص
                        <ChevronUp className="h-4 w-4" />
                      </button>
                    )}

                    <span className="w-full text-center text-[7px] tracking-[0.08em] text-[#889188] md:text-[8px]">
                      يظهر {visibleCount} من {products.length} منتج
                    </span>
                  </div>
                )}
              </div>
            </section>

            {sectionIndex === 0 && rendered.length > 1 ? betweenSections : null}
          </div>
        );
      })}
      {afterSections}
    </>
  );
};

export default HomeManagedSections;

import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import HomeDemoProductCard, { HOME_DEMO_PRODUCTS } from "@/components/HomeDemoProductCard";
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
  brandsSection?: ReactNode;
};

const INITIAL_VISIBLE = 8;
const BEST_SELLER_LIMIT = 40;
const DEFAULT_SECTION_FETCH_LIMIT = 48;
const MAX_SECTION_FETCH_LIMIT = 64;
const HOME_CACHE_MS = 5 * 60 * 1000;
// Preview samples can be disabled for launch with VITE_GENAN_HOME_PREVIEW=false.
const HOME_PREVIEW_ENABLED = import.meta.env.VITE_GENAN_HOME_PREVIEW !== "false";

const getSectionFetchLimit = (section: ManagedSection) => {
  const configured = Number(section.max_products || 0);
  if (!Number.isFinite(configured) || configured <= 0) return DEFAULT_SECTION_FETCH_LIMIT;
  return Math.min(Math.max(configured, INITIAL_VISIBLE), MAX_SECTION_FETCH_LIMIT);
};

const SpecialCollections = () => {
  const promotions = [
    {
      eyebrow: "GENAN PICKS",
      title: "تشكيلات تستحق الاكتشاف",
      action: "اكتشفي الآن",
      url: "/products",
      image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=700&q=80",
      background: "#E8E3D8",
    },
    {
      eyebrow: "SHOE EDIT",
      title: "خطوة جديدة للأناقة",
      action: "تسوقي الآن",
      url: "/categories?parent=shoes",
      image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=600&q=80",
      background: "#DCECE7",
    },
    {
      eyebrow: "THE DETAILS",
      title: "إكسسواراتك المفضلة",
      action: "تسوقي الآن",
      url: "/categories?parent=accessories",
      image: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=600&q=80",
      background: "#EEE6DF",
    },
  ];

  return (
    <section aria-label="عروض ومجموعات خاصة" className="bg-[#FAFAFA] py-8 sm:py-10 md:py-14" dir="rtl">
      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="mb-4 sm:mb-6">
          <span className="mb-1.5 block font-serif text-[9px] font-medium uppercase tracking-[0.2em] text-[#8C6B32]">GENAN COLLECTIONS</span>
          <h2 className="text-[21px] font-semibold tracking-[-0.025em] text-[#0E0E0E] sm:text-[26px] lg:text-[31px]">عروض ومجموعات خاصة</h2>
          <p className="mt-1 text-[10px] text-[#777777] sm:text-[12px]">اكتشفي ما يميز جنان هذا الأسبوع</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-[1.2fr_1fr_1fr]">
          {promotions.map((item, index) => (
            <Link key={item.eyebrow} to={item.url}
              className={`group relative flex min-h-[155px] flex-col justify-between overflow-hidden rounded-xl p-4 text-[#171717] transition-shadow hover:shadow-md sm:min-h-[190px] sm:p-5 lg:min-h-[205px] ${index === 0 ? "col-span-2 lg:col-span-1" : ""}`}
              style={{ backgroundColor: item.background }}>
              <img src={item.image} alt="" loading="lazy" decoding="async"
                className="pointer-events-none absolute inset-y-0 left-0 h-full w-[55%] object-cover [mask-image:linear-gradient(to_right,black_45%,transparent)] transition-transform duration-500 group-hover:scale-105" />
              <span className="relative z-10 text-[9px] font-medium tracking-[0.12em] sm:text-[10px]">{item.eyebrow}</span>
              <div className="relative z-10 max-w-[75%]">
                <h3 className="text-[15px] font-semibold leading-snug sm:text-[19px] lg:text-[21px]">{item.title}</h3>
                <span className="mt-3 inline-flex items-center gap-1 border-b border-current pb-0.5 text-[10px] font-medium sm:text-[11px]">
                  {item.action}<ArrowLeft aria-hidden="true" className="h-3 w-3" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

const HomeManagedSections = ({ betweenSections, brandsSection, afterSections }: HomeManagedSectionsProps) => {

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

  // Keep the storefront shoppable before the merchandiser publishes homepage_sections.
  // Genan demo items are view-only; ProductCard retains their purchase guard.
  const { data: fallbackProducts = [] } = useQuery({
    queryKey: ["genan-home-latest-products", "editorial-v1"],
    enabled: true,
    queryFn: async () => {
      const { data: live, error: liveError } = await supabase
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("is_active", true)
        .eq("in_stock", true)
        .order("created_at", { ascending: false })
        .limit(16);
      if (liveError) throw liveError;
      if (live?.length) return live.map(mapProductCard);
      const { data: demo, error: demoError } = await supabase
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("is_active", true)
        .like("slug", "genan-demo-20261022-%")
        .order("sort_order", { ascending: true })
        .limit(12);
      if (demoError) throw demoError;
      return (demo || []).map(mapProductCard);
    },
    staleTime: HOME_CACHE_MS,
    refetchOnWindowFocus: false,
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

  // Always show the three editorial rows so layout can be reviewed before launch.
  // Real featured/best-seller products still come from the admin-managed sections.
  const featuredSection = rendered.find((entry) => entry.section.filter_type === "featured");
  const bestSection = rendered.find((entry) => entry.section.filter_type === "best_seller");
  const extras = rendered.filter((entry) => entry.section.id !== featuredSection?.section.id && entry.section.id !== bestSection?.section.id);
  const shelves = [
    { key: "new-arrivals", title: "وصل حديثاً", eyebrow: "JUST LANDED", subtitle: "قطع جديدة تستحق الاكتشاف", url: "/new-arrivals", products: fallbackProducts.slice(0, 4), sample: 0 },
    { key: "best-sellers", title: "الأكثر مبيعاً", eyebrow: "MOST LOVED", subtitle: "تشكيلات لاقت إعجاب عملائنا", url: "/best-sellers", products: bestSection?.products || [], sample: 4 },
    { key: "genan-edit", title: "مختارات جنان", eyebrow: "GENAN EDIT", subtitle: "تفاصيل منتقاة لأسلوب مختلف", url: "/products", products: featuredSection?.products.length ? featuredSection.products : fallbackProducts.slice(4, 8), sample: 2 },
    ...extras.map((entry, i) => ({
      key: "managed-" + entry.section.id, title: entry.section.title_ar, eyebrow: entry.section.title || "COLLECTION",
      subtitle: "تشكيلات أخرى تستحق الاكتشاف", url: entry.section.view_all_link || "/products",
      products: entry.products, sample: i,
    })),
  ];

  const renderShelf = (shelf: (typeof shelves)[number], index: number) => {
    // Include one clearly labeled non-purchasable sample in each core row.
    const real = shelf.products.slice(0, HOME_PREVIEW_ENABLED && index < 3 ? 3 : 4);
    const missing = HOME_PREVIEW_ENABLED ? Math.max(0, 4 - real.length) : 0;
    return (
      <section key={shelf.key} id={"home-section-" + shelf.key} aria-label={shelf.title}
        className={"scroll-mt-24 py-8 sm:py-10 md:py-14 " + (index % 2 === 0 ? "bg-white" : "bg-[#FAFAFA]")}>
        <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8">
          <div className="mb-5 flex items-end justify-between gap-3 sm:mb-7">
            <div className="min-w-0">
              <span className="mb-1.5 block font-serif text-[9px] font-medium uppercase tracking-[0.2em] text-[#8C6B32]">{shelf.eyebrow}</span>
              <h2 className="text-[21px] font-semibold tracking-[-0.025em] text-[#0E0E0E] sm:text-[26px] lg:text-[31px]">{shelf.title}</h2>
              <p className="mt-1 text-[10px] text-[#777777] sm:text-[12px]">{shelf.subtitle}</p>
            </div>
            <Link to={shelf.url} className="inline-flex shrink-0 items-center gap-1.5 border-b border-[#D8C29A] pb-1 text-[10px] font-semibold text-[#0E0E0E] hover:text-[#8C6B32] sm:text-[12px]">
              عرض الكل <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-4 sm:gap-4 lg:gap-6">
            {real.map((product, i) => <ProductCard key={product.id} product={product} index={index * 4 + i} />)}
            {Array.from({ length: missing }, (_, i) => (
              <HomeDemoProductCard key={shelf.key + "-sample-" + i} product={HOME_DEMO_PRODUCTS[(shelf.sample + i) % HOME_DEMO_PRODUCTS.length]} />
            ))}
          </div>
        </div>
      </section>
    );
  };

  return (
    <>
      {renderShelf(shelves[0], 0)}
      <SpecialCollections />
      {betweenSections}
      {renderShelf(shelves[1], 1)}
      {brandsSection}
      {renderShelf(shelves[2], 2)}
      {shelves.slice(3).map((shelf, index) => renderShelf(shelf, index + 3))}
      {afterSections}
    </>
  );
};

export default HomeManagedSections;

import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import HeroSlider from "@/components/HeroSlider";
import BrandsStrip from "@/components/BrandsStrip";
import GenanServices from "@/components/GenanServices";
import HomeManagedSections from "@/components/HomeManagedSections";

import { supabase } from "@/integrations/supabase/client";
import { useNearViewport } from "@/hooks/useNearViewport";
import { useCustomerExperience } from "@/hooks/useCustomerExperience";
import { optimizeImage } from "@/lib/imageUrl";

type FeaturedCategoryItem = {
  title: string;
  subtitle: string;
  image: string;
  link: string;
};

type EditorialBanner = {
  image_url: string;
  title_ar: string | null;
  subtitle_ar: string | null;
  cta_text_ar: string | null;
  cta_link: string | null;
  image_zoom: number | null;
  image_position_x: number | null;
  image_position_y: number | null;
};

const isLingerieCategory = (category: { slug?: string | null; name?: string | null; name_ar?: string | null }) => {
  const value = `${category.slug || ""} ${category.name || ""} ${category.name_ar || ""}`
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/\s+/g, " ");
  return /lingerie|لانجري|لانجيري|لانجيرى|ملابس داخليه|ملابس داخلية/.test(value);
};

const EditorialNav = () => {
  const items = [
    { label: "وصل حديثًا", kicker: "NEW", to: "/new-arrivals" },
    { label: "الأكثر اختيارًا", kicker: "BEST", to: "/best-sellers" },
    { label: "العروض", kicker: "EDIT", to: "/seasonal-offers" },
    { label: "كل الماركات", kicker: "BRANDS", to: "/brands" },
  ];

  return (
    <section className="border-b border-[#EAEAEA] bg-[#FFFFFF]" dir="rtl">
      <div className="mx-auto grid max-w-[1680px] grid-cols-2 md:grid-cols-4">
        {items.map((item, index) => (
          <Link
            key={item.to}
            to={item.to}
            className={`group flex min-h-[86px] items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-[#F7F7F7] md:min-h-[104px] md:px-7 ${index % 2 === 0 ? "border-l border-[#EAEAEA]" : ""} md:border-l md:last:border-l-0`}
          >
            <div>
              <span className="block text-[7px] font-semibold tracking-[0.26em] text-[#D8C29A]">{item.kicker}</span>
              <span className="mt-1.5 block text-[11px] font-semibold text-[#0E0E0E] md:text-[13px]">{item.label}</span>
            </div>
            <ArrowUpLeft className="h-4 w-4 text-[#888888] transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#0E0E0E]" strokeWidth={1.3} />
          </Link>
        ))}
      </div>
    </section>
  );
};

const CategoryStories = ({ items, loading = false }: { items: FeaturedCategoryItem[]; loading?: boolean }) => {
  if (!loading && items.length === 0) return null;

  const display = items.slice(0, 5);

  return (
    <section className="bg-[#FFFFFF] py-12 md:py-24" dir="rtl" aria-label="الأقسام">
      <div className="mx-auto max-w-[1680px] px-4 md:px-7 lg:px-10">
        <div className="mb-8 flex items-end justify-between gap-4 md:mb-12">
          <div className="max-w-[680px]">
            <span className="text-[8px] font-semibold tracking-[0.28em] text-[#D8C29A]">DISCOVER / CATEGORIES</span>
            <h2 className="mt-3 text-[28px] font-medium leading-[1.45] tracking-[-0.045em] text-[#0E0E0E] md:text-[44px]">
              لا تبحث طويلًا. ابدأ من المكان الصحيح.
            </h2>
          </div>
          <Link to="/categories" className="hidden items-center gap-2 border-b border-[#D8C29A]/55 pb-1 text-[10px] font-semibold text-[#0E0E0E] md:flex">
            جميع الأقسام
            <ArrowLeft className="h-4 w-4" strokeWidth={1.4} />
          </Link>
        </div>

        {loading ? (
          <div className="grid min-h-[560px] grid-cols-2 gap-3 md:grid-cols-12 md:grid-rows-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className={`animate-pulse bg-[#EFEFEF] ${index === 0 ? "col-span-2 md:col-span-5 md:row-span-2" : "md:col-span-3"}`} />
            ))}
          </div>
        ) : (
          <>
            <div className="hidden h-[610px] grid-cols-12 grid-rows-2 gap-3 md:grid">
              {display.map((item, index) => {
                const placement = [
                  "col-span-5 row-span-2",
                  "col-span-4 row-span-1",
                  "col-span-3 row-span-1",
                  "col-span-3 row-span-1",
                  "col-span-4 row-span-1",
                ][index] || "col-span-3";
                return (
                  <Link key={item.link} to={item.link} className={`group relative overflow-hidden bg-[#F4F4F4] ${placement}`}>
                    <img
                      src={optimizeImage(item.image, index === 0 ? 1000 : 720, 80)}
                      alt={item.title}
                      loading={index < 2 ? "eager" : "lazy"}
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/[0.06] to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 lg:p-7">
                      <div>
                        <p className="text-[17px] font-medium text-white lg:text-[21px]">{item.title}</p>
                        <p className="mt-1 text-[7px] tracking-[0.18em] text-white/65">{item.subtitle}</p>
                      </div>
                      <span className="flex h-9 w-9 items-center justify-center border border-white/35 text-white transition-colors group-hover:bg-white group-hover:text-[#0E0E0E]">
                        <ArrowUpLeft className="h-4 w-4" strokeWidth={1.3} />
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:hidden">
              {display.map((item, index) => (
                <Link key={item.link} to={item.link} className="group relative h-[430px] w-[78vw] max-w-[330px] shrink-0 snap-start overflow-hidden bg-[#F4F4F4]">
                  <img src={optimizeImage(item.image, 700, 80)} alt={item.title} loading={index < 2 ? "eager" : "lazy"} decoding="async" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <p className="text-[19px] font-medium text-white">{item.title}</p>
                    <p className="mt-1 text-[7px] tracking-[0.16em] text-white/65">{item.subtitle}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

const EditorialSection = ({ banner }: { banner: EditorialBanner | null }) => {
  const title = banner?.title_ar?.trim() || "مساحة أقل ازدحامًا، واختيار أكثر وضوحًا.";
  const subtitle = banner?.subtitle_ar?.trim() || "جنان تجمع لك القطع التي تستحق المشاهدة، ثم تترك لك مساحة كافية لتختار بهدوء.";
  const ctaText = banner?.cta_text_ar?.trim() || "شاهد المجموعة";
  const ctaLink = banner?.cta_link?.trim() || "/products";
  const hasImage = Boolean(banner?.image_url?.trim());

  return (
    <section className="bg-[#0E0E0E] py-0" dir="rtl">
      <div className="mx-auto grid min-h-[540px] max-w-[1680px] md:grid-cols-[1.08fr_0.92fr]">
        <div className="relative min-h-[420px] overflow-hidden bg-[#171717]">
          {hasImage ? (
            <img
              src={optimizeImage(banner!.image_url, 1400, 82)}
              alt=""
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                objectPosition: `${Number(banner?.image_position_x ?? 50)}% ${Number(banner?.image_position_y ?? 50)}%`,
                transform: `scale(${Number(banner?.image_zoom ?? 1)})`,
              }}
            />
          ) : (
            <>
              <div className="absolute left-[12%] top-[16%] h-[58%] w-[56%] border border-white/15" />
              <div className="absolute bottom-[12%] right-[12%] h-[42%] w-[42%] bg-[#A9D8D3]/22" />
            </>
          )}
          <div className="absolute inset-0 bg-black/15" />
        </div>

        <div className="flex items-center px-6 py-14 sm:px-10 md:px-12 lg:px-16">
          <div className="max-w-[560px]">
            <span className="text-[8px] font-semibold tracking-[0.3em] text-[#E6D7B8]">THE GENAN EDIT</span>
            <h2 className="mt-5 text-[30px] font-medium leading-[1.6] tracking-[-0.045em] text-white md:text-[44px]">
              {title}
            </h2>
            <p className="mt-5 max-w-[450px] text-[11px] leading-8 text-white/62 md:text-[13px]">
              {subtitle}
            </p>
            <Link to={ctaLink} className="mt-8 inline-flex h-12 items-center gap-3 border border-white/30 px-6 text-[10px] font-semibold text-white transition-colors hover:bg-white hover:text-[#0E0E0E]">
              {ctaText}
              <ArrowLeft className="h-4 w-4" strokeWidth={1.4} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

const HomePage = () => {
  const { data: customerExperience } = useCustomerExperience();
  const showHomeSection = (section: string) => customerExperience?.homeSections[section] !== false;

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories-all-active-v5"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,slug,name,name_ar,parent_id,image_url,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const { data: editorialBanner = null } = useQuery({
    queryKey: ["home-editorial-banner-v2"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("image_url,title_ar,subtitle_ar,cta_text_ar,cta_link,image_zoom,image_position_x,image_position_y")
        .eq("page_slug", "home-editorial")
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      return (data || null) as EditorialBanner | null;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const featuredCategories = useMemo<FeaturedCategoryItem[]>(
    () =>
      categories
        .filter((category: any) => !category.parent_id && !isLingerieCategory(category))
        .map((category: any) => ({
          title: category.name_ar || category.name || category.slug,
          subtitle: category.name || category.name_ar || category.slug,
          image: category.image_url || "/placeholder.svg",
          link: `/categories?parent=${category.slug}`,
        })),
    [categories],
  );

  const brandsViewport = useNearViewport<HTMLDivElement>("160px");
  const imageBanner = showHomeSection("services") ? <GenanServices /> : null;
  const textBanner = showHomeSection("editorial") ? <EditorialSection banner={editorialBanner} /> : null;

  return (
    <div className="relative min-h-screen bg-[#FFFFFF]" dir="rtl">
      <Navbar />
      <CartDrawer />

      <main className="overflow-hidden bg-[#FFFFFF]">
        {showHomeSection("hero") && <HeroSlider />}
        <EditorialNav />
        {showHomeSection("categories") && <CategoryStories items={featuredCategories} loading={categoriesLoading} />}

        {showHomeSection("brands") && (
          <div ref={brandsViewport.ref} className="bg-[#FFFFFF]">
            <BrandsStrip enabled={brandsViewport.isNearViewport} />
          </div>
        )}

        <HomeManagedSections betweenSections={imageBanner} afterSections={textBanner} />
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;

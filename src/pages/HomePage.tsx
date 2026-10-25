import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgePercent, Sparkles, TrendingUp } from "lucide-react";

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

const DesktopDiscovery = () => (
  <section className="hidden bg-background md:block" dir="rtl" aria-label="اكتشف جنان">
    <div className="mx-auto grid w-full max-w-[1500px] grid-cols-3 gap-3 px-6 pb-3 pt-5 lg:px-8">
      <Link to="/new-arrivals" className="group flex min-h-[86px] items-center gap-4 rounded-[20px] border border-[#EAEAEA] bg-[#FAFAFA] px-5 transition-all hover:-translate-y-0.5 hover:border-[#D8C29A] hover:shadow-[0_14px_34px_rgba(14,14,14,0.08)]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#8C6B32] shadow-sm"><Sparkles className="h-5 w-5" strokeWidth={1.5} /></span>
        <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-[#0E0E0E]">وصل حديثاً</span><span className="mt-1 block text-[9px] text-[#8C6B32]">اكتشف أحدث القطع فور وصولها</span></span>
        <ArrowLeft className="h-4 w-4 text-[#8C6B32] transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
      </Link>
      <Link to="/seasonal-offers" className="group flex min-h-[86px] items-center gap-4 rounded-[20px] border border-[#EAEAEA] bg-white px-5 transition-all hover:-translate-y-0.5 hover:border-[#D8C29A] hover:shadow-[0_14px_34px_rgba(14,14,14,0.08)]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#FAFAFA] text-[#8C6B32]"><BadgePercent className="h-5 w-5" strokeWidth={1.5} /></span>
        <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-[#0E0E0E]">العروض</span><span className="mt-1 block text-[9px] text-[#8C6B32]">اختيارات مميزة بأسعار أفضل</span></span>
        <ArrowLeft className="h-4 w-4 text-[#8C6B32] transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
      </Link>
      <Link to="/best-sellers" className="group flex min-h-[86px] items-center gap-4 rounded-[20px] border border-[#EAEAEA] bg-[#FAFAFA] px-5 transition-all hover:-translate-y-0.5 hover:border-[#D8C29A] hover:shadow-[0_14px_34px_rgba(14,14,14,0.08)]">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-[#8C6B32] shadow-sm"><TrendingUp className="h-5 w-5" strokeWidth={1.5} /></span>
        <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold text-[#0E0E0E]">الأكثر مبيعاً</span><span className="mt-1 block text-[9px] text-[#8C6B32]">القطع التي يختارها عملاؤنا أكثر</span></span>
        <ArrowLeft className="h-4 w-4 text-[#8C6B32] transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
      </Link>
    </div>
  </section>
);

const CategoryCarousel = ({ items, loading = false }: { items: FeaturedCategoryItem[]; loading?: boolean }) => {
  if (!loading && items.length === 0) return null;

  // One fashion-editorial row only: six curated categories maximum. On narrow
  // screens the cards swipe horizontally, without a second row or a scrollbar.
  const featured = items.slice(0, 6);

  return (
    <section className="w-full overflow-hidden bg-white py-8 sm:py-10 lg:py-14" dir="rtl" aria-label="الأقسام">
      <div className="mx-auto w-full max-w-[1500px] px-4 sm:px-6 lg:px-8">
        <div className="mb-5 flex items-end justify-between gap-3 sm:mb-7 lg:mb-9">
          <div className="min-w-0">
            <div className="mb-2 flex items-center gap-2">
              <span aria-hidden="true" className="h-px w-5 bg-[#D8C29A]" />
              <span className="font-serif text-[9px] uppercase tracking-[0.23em] text-[#8C6B32]">GENAN / CATEGORIES</span>
            </div>
            <h2 className="text-[21px] font-semibold tracking-[-0.02em] text-[#0E0E0E] sm:text-[25px] lg:text-[29px]">اكتشفي الأقسام</h2>
            <p className="mt-1 hidden text-[12px] leading-6 text-[#767676] sm:block">تشكيلات مختارة لكل إطلالة</p>
          </div>
          <Link
            to="/categories"
            className="inline-flex shrink-0 items-center gap-1.5 border-b border-[#D8C29A] pb-1 text-[11px] font-medium text-[#0E0E0E] transition-colors hover:text-[#8C6B32] sm:text-[12px]"
          >
            عرض الكل
            <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-2 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
          <div className="flex w-max flex-nowrap items-start gap-3 snap-x snap-mandatory sm:gap-4 lg:w-full lg:gap-5 lg:snap-none">
            {loading
              ? Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} aria-hidden="true" className="w-[148px] shrink-0 snap-start sm:w-[180px] md:w-[205px] lg:w-auto lg:min-w-0 lg:flex-1">
                    <div className="aspect-[3/4] w-full animate-pulse rounded-[4px] bg-[#F0F0F0]" />
                    <div className="mt-3 h-3 w-3/5 animate-pulse rounded-full bg-[#EFEFEF]" />
                  </div>
                ))
              : featured.map((item, index) => (
                  <Link
                    key={item.link}
                    to={item.link}
                    className="group block w-[148px] shrink-0 snap-start select-none text-right sm:w-[180px] md:w-[205px] lg:w-auto lg:min-w-0 lg:flex-1"
                  >
                    <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[4px] bg-[#F3F3F3]">
                      <img
                        src={optimizeImage(item.image, 480, 82)}
                        alt={item.title}
                        loading={index < 2 ? "eager" : "lazy"}
                        decoding="async"
                        width={360}
                        height={480}
                        className="h-full w-full object-cover object-center transition-transform duration-500 ease-out group-hover:scale-[1.05]"
                      />
                      <span aria-hidden="true" className="absolute inset-0 border border-[#0E0E0E]/[0.04] transition-colors group-hover:border-[#D8C29A]/60" />
                    </div>
                    <div className="mt-3 flex min-w-0 items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <h3 className="truncate text-[13px] font-semibold leading-6 text-[#0E0E0E] sm:text-[15px]">{item.title}</h3>
                        <p dir="auto" className="mt-0.5 truncate font-serif text-[9px] leading-4 tracking-[0.07em] text-[#898989] sm:text-[10px]">{item.subtitle}</p>
                      </div>
                      <ArrowLeft aria-hidden="true" className="mt-1.5 h-3.5 w-3.5 shrink-0 text-[#8C6B32] transition-transform group-hover:-translate-x-1" strokeWidth={1.5} />
                    </div>
                    <span aria-hidden="true" className="mt-2 block h-px w-7 bg-[#D8C29A]" />
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const EditorialSection = ({ banner }: { banner: EditorialBanner | null }) => {
  const title = banner?.title_ar?.trim() || "الأناقة ليست ما ترتديه، بل ما يبقى في الذاكرة.";
  const subtitle = banner?.subtitle_ar?.trim() || "مختارات منتقاة لمن يقدّر التفاصيل والجودة والتصميم الذي لا يحتاج إلى المبالغة.";
  const ctaText = banner?.cta_text_ar?.trim() || "اكتشف المجموعة";
  const ctaLink = banner?.cta_link?.trim() || "/products";
  const hasImage = Boolean(banner?.image_url?.trim());

  if (hasImage) {
    return (
      <section className="bg-[#FAFAFA] py-6 md:py-14">
        <div className="mx-auto max-w-[1500px] px-0 md:px-6 lg:px-8">
          <div className="relative min-h-[360px] overflow-hidden md:grid md:min-h-[500px] md:grid-cols-[1.35fr_0.85fr] md:rounded-[28px] md:border md:border-[#F7F7F7] md:bg-white md:shadow-[0_24px_70px_rgba(14,14,14,0.07)]">
            <div className="absolute inset-0 md:relative md:inset-auto">
              <img src={optimizeImage(banner!.image_url, 1400, 80)} alt="" loading="lazy" decoding="async" width={1400} height={900} className="h-full w-full object-cover" style={{ objectPosition: `${Number(banner?.image_position_x ?? 50)}% ${Number(banner?.image_position_y ?? 50)}%`, transform: `scale(${Number(banner?.image_zoom ?? 1)})` }} />
              <div className="absolute inset-0 bg-black/35 md:bg-gradient-to-l md:from-black/10 md:via-transparent md:to-black/5" />
            </div>
            <div className="relative z-10 flex min-h-[360px] flex-col items-center justify-center px-5 py-12 text-center md:min-h-[500px] md:items-start md:px-12 md:text-right lg:px-16">
              <div className="mb-4 flex items-center justify-center gap-2 md:justify-start">
                <span className="h-px w-6 bg-white/55 md:bg-[#D8C29A]" />
                <span className="font-serif text-[6px] uppercase tracking-[0.24em] text-white/85 md:text-[8px] md:text-[#8C6B32]">GENAN EDIT</span>
              </div>
              <h2 className="max-w-[700px] whitespace-pre-line text-[21px] font-light leading-[1.8] tracking-[-0.025em] text-white drop-shadow-sm md:text-[34px] md:leading-[1.65] md:text-[#0E0E0E] md:drop-shadow-none">{title}</h2>
              <p className="mt-4 max-w-[450px] text-[8px] leading-6 text-white/85 md:text-[11px] md:leading-8 md:text-[#8C6B32]">{subtitle}</p>
              <Link to={ctaLink} className="mt-5 inline-flex items-center gap-1.5 border-b border-white/50 pb-1 text-[7px] font-semibold text-white md:mt-7 md:gap-2 md:border-[#D8C29A] md:text-[10px] md:text-[#8C6B32]">{ctaText}<ArrowLeft className="h-3 w-3 md:h-4 md:w-4" strokeWidth={1.5} /></Link>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-background px-4 py-11 md:py-20">
      <div className="relative z-10 mx-auto flex max-w-[850px] flex-col items-center justify-center px-4 text-center">
        <div className="mx-auto mb-4 flex items-center justify-center gap-2"><span className="h-px w-6 bg-border" /><span className="font-serif text-[6px] uppercase tracking-[0.24em] text-[#8C6B32]">GENAN EDIT</span><span className="h-px w-6 bg-border" /></div>
        <h2 className="mx-auto max-w-[700px] whitespace-pre-line text-[21px] font-light leading-[1.8] tracking-[-0.025em] text-foreground md:text-[36px] md:leading-[1.7]">{title}</h2>
        <p className="mx-auto mt-4 max-w-[450px] text-[8px] leading-6 text-muted-foreground md:text-[10px] md:leading-7">{subtitle}</p>
        <Link to={ctaLink} className="mx-auto mt-5 inline-flex items-center gap-1.5 border-b border-border pb-1 text-[7px] font-semibold text-[#8C6B32] md:text-[8px]">{ctaText}<ArrowLeft className="h-3 w-3" strokeWidth={1.5} /></Link>
      </div>
    </section>
  );
};

const HomePage = () => {
  const { data: customerExperience } = useCustomerExperience();
  const showHomeSection = (section: string) => customerExperience?.homeSections[section] !== false;

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories-all-active-v4"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,slug,name,name_ar,parent_id,image_url,sort_order").eq("is_active", true).order("sort_order", { ascending: true });
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
    queryKey: ["home-editorial-banner-v1"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("banners").select("image_url,title_ar,subtitle_ar,cta_text_ar,cta_link,image_zoom,image_position_x,image_position_y").eq("page_slug", "home-editorial").eq("is_active", true).maybeSingle();
      if (error) throw error;
      return (data || null) as EditorialBanner | null;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const featuredCategories = useMemo<FeaturedCategoryItem[]>(() => categories
    .filter((category: any) => !category.parent_id && !isLingerieCategory(category))
    .map((category: any) => ({
      title: category.name_ar || category.name || category.slug,
      subtitle: category.name || category.name_ar || category.slug,
      image: category.image_url || "/placeholder.svg",
      link: `/categories?parent=${category.slug}`,
    })), [categories]);

  const brandsViewport = useNearViewport<HTMLDivElement>("120px");
  const imageBanner = showHomeSection("services") ? <div className="bg-background"><GenanServices /></div> : null;
  const textBanner = showHomeSection("editorial") ? <EditorialSection banner={editorialBanner} /> : null;

  return (
    <div className="relative min-h-screen bg-background" dir="rtl">
      <Navbar overlayHero={showHomeSection("hero")} /><CartDrawer />
      <main id="main-content" className="overflow-hidden bg-background">
        {showHomeSection("hero") && <HeroSlider />}
        <DesktopDiscovery />
        {showHomeSection("categories") && <CategoryCarousel items={featuredCategories} loading={categoriesLoading} />}
        {showHomeSection("brands") && (
          <div ref={brandsViewport.ref} className="bg-background" style={{ minHeight: 92 }}><BrandsStrip enabled={brandsViewport.isNearViewport} /></div>
        )}
        <HomeManagedSections betweenSections={imageBanner} afterSections={textBanner} />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;

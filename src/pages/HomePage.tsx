import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

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

const CategoryCarousel = ({ items, loading = false }: { items: FeaturedCategoryItem[]; loading?: boolean }) => {
  if (!loading && items.length === 0) return null;

  const featured = items.slice(0, 4);

  return (
    <section className="w-full overflow-hidden bg-white py-4 sm:py-5 lg:py-6" dir="rtl" aria-label="الأقسام">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <div className="min-w-0">
            <span className="mb-0.5 block font-serif text-[8px] uppercase tracking-[0.2em] text-[#9B7A46]">GENAN / CATEGORIES</span>
            <h2 className="text-[16px] font-semibold leading-6 text-[#0E0E0E] sm:text-[19px]">تسوقي حسب القسم</h2>
          </div>
          <Link to="/categories" className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-[#8C6B32] transition-opacity hover:opacity-70">
            جميع الأقسام
            <ArrowLeft aria-hidden="true" className="h-3 w-3" strokeWidth={1.6} />
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
          <div className="flex w-max flex-nowrap items-start gap-2.5 snap-x snap-proximity sm:gap-3 lg:w-full lg:justify-between lg:gap-4 lg:snap-none">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} aria-hidden="true" className="w-[68px] shrink-0 snap-start sm:w-[78px] md:w-[86px] lg:w-[94px] xl:w-[100px]">
                    <div className="aspect-square w-full animate-pulse rounded-[9px] bg-[#F0F0F0]" />
                    <div className="mx-auto mt-1.5 h-2 w-4/5 animate-pulse rounded-full bg-[#EFEFEF]" />
                  </div>
                ))
              : featured.map((item, index) => (
                  <Link
                    key={item.link}
                    to={item.link}
                    className="group block w-[68px] shrink-0 snap-start select-none sm:w-[78px] md:w-[86px] lg:w-[94px] xl:w-[100px]"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-[9px] bg-[#F5F3F0] ring-1 ring-[#EEEAE4] ring-inset">
                      <img
                        src={optimizeImage(item.image, 240, 77)}
                        alt={item.title}
                        loading={index < 3 ? "eager" : "lazy"}
                        decoding="async"
                        width={200}
                        height={200}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.06]"
                      />
                    </div>
                    <p className="mt-1.5 truncate text-center text-[10px] font-medium leading-4 text-[#0E0E0E] transition-colors group-hover:text-[#8C6B32] sm:text-[11px]">
                      {item.title}
                    </p>
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
    <section className="bg-white px-4 py-8 sm:px-6 md:py-14" aria-label="بانر مختارات جنان">
      <div className="mx-auto grid w-full max-w-[1450px] overflow-hidden bg-[#F5F1EA] md:min-h-[360px] md:grid-cols-[1.05fr_0.95fr] md:rounded-[18px]">
        <div className="order-2 flex flex-col items-start justify-center px-6 py-9 text-right sm:px-10 md:order-1 md:px-14 md:py-12">
          <span className="font-serif text-[10px] uppercase tracking-[0.23em] text-[#8C6B32]">THE GENAN EDIT</span>
          <h2 className="mt-3 max-w-[540px] text-[23px] font-light leading-[1.65] tracking-[-0.025em] text-[#0E0E0E] md:text-[35px]">{title}</h2>
          <p className="mt-3 max-w-[440px] text-[11px] leading-7 text-[#65615B] md:text-[13px]">{subtitle}</p>
          <Link to={ctaLink} className="mt-5 inline-flex items-center gap-2 border-b border-[#8C6B32] pb-1 text-[11px] font-semibold text-[#0E0E0E]">
            {ctaText}<ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
          </Link>
        </div>
        <div className="order-1 h-[245px] overflow-hidden bg-[#EDE8E0] sm:h-[310px] md:order-2 md:h-full">
          <img src="/products/demo/dress.webp" alt="تشكيلة أزياء تجريبية من جنان" width={740} height={610}
            loading="lazy" decoding="async" className="h-full w-full object-cover object-center" />
        </div>
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

  const featuredCategories = useMemo<FeaturedCategoryItem[]>(() => {
    const primaryCategories = categories.filter((category: any) => !category.parent_id && !isLingerieCategory(category));
    const requested = [
      { title: "أحذية", slug: "shoes", pattern: /shoes?|footwear|sneakers?|heels?|احذيه|احذية|حذاء|جزم/ },
      { title: "شنط", slug: "bags", pattern: /bags?|handbags?|purses?|شنط|شنطة|شنطه|حقائب|حقيبة/ },
      { title: "إكسسوارات", slug: "accessories", pattern: /accessor|اكسسوار|إكسسوار|اكسسوارات|إكسسوارات/ },
      { title: "هوم", slug: "home", pattern: /home|homedecor|homeware|منزل|منزلي|ديكور|هوم/ },
    ];
    return requested.map(({ title, slug, pattern }) => {
      const match = primaryCategories.find((category: any) => {
        const searchable = `${category.slug || ""} ${category.name || ""} ${category.name_ar || ""}`
          .toLowerCase().replace(/[أإآ]/g, "ا");
        return pattern.test(searchable);
      });
      return {
        title,
        subtitle: match?.name || title,
        image: match?.image_url || "/placeholder.svg",
        link: `/categories?parent=${encodeURIComponent(match?.slug || slug)}`,
      };
    });
  }, [categories]);

  const brandsViewport = useNearViewport<HTMLDivElement>("120px");
  const imageBanner = showHomeSection("services") ? <GenanServices /> : null;
  const textBanner = showHomeSection("editorial") ? <EditorialSection banner={editorialBanner} /> : null;
  const brandsSection = showHomeSection("brands") ? (
    <div ref={brandsViewport.ref} className="bg-white" style={{ minHeight: 92 }}><BrandsStrip enabled={brandsViewport.isNearViewport} /></div>
  ) : null;

  return (
    <div className="relative min-h-screen bg-background" dir="rtl">
      <Navbar overlayHero={showHomeSection("hero")} /><CartDrawer />
      <main id="main-content" className="overflow-hidden bg-background">
        {showHomeSection("hero") && <HeroSlider />}
        {showHomeSection("categories") && <CategoryCarousel items={featuredCategories} loading={categoriesLoading} />}
        <HomeManagedSections betweenSections={imageBanner} brandsSection={brandsSection} afterSections={textBanner} />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;

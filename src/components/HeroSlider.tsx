import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "phosphor-react";
import { Link } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { isBannerCurrentlyVisible } from "@/lib/bannerSchedule";

const fallbackBanner = {
  title: "الأناقة تبدأ من اختيارك",
  description: "مختارات من الماركات العالمية في الأحذية والملابس والحقائب والإكسسوارات.",
  cta: "اكتشفي المجموعة",
  link: "/products",
};

const HeroSlider = () => {
  const { data: managedBanner } = useQuery({
    queryKey: ["genan-home-hero-banners", "single-banner"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("image_url,title_ar,subtitle_ar,cta_text_ar,cta_link,page_slug,starts_at,ends_at")
        .eq("is_active", true)
        .neq("title", "Between products banner")
        .order("sort_order", { ascending: true })
        .limit(20);
      if (error) throw error;

      return data.find((banner) => (
        banner.page_slug !== "home-editorial" && banner.image_url?.trim() && isBannerCurrentlyVisible(banner)
      )) ?? null;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const banner = managedBanner ? {
    title: managedBanner.title_ar || "",
    description: managedBanner.subtitle_ar,
    cta: managedBanner.cta_text_ar || "اكتشف المجموعة",
    link: managedBanner.page_slug ? `/banner/${managedBanner.page_slug}` : managedBanner.cta_link || "/products",
  } : fallbackBanner;

  return (
    <section dir="rtl" className="relative w-full bg-white">
      <div className="relative h-[285px] w-full overflow-hidden bg-[#F7F7F7] sm:h-[340px] md:h-[500px] lg:h-[560px] xl:h-[620px] 2xl:h-[660px]">
        <img
          src="/brand/genan-home-banner.jpg"
          alt="حقيبة وحذاء أسودان على طاولة"
          loading="eager"
          decoding="async"
          fetchPriority="high"
          width={4028}
          height={2186}
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-l from-background/70 via-background/30 to-transparent sm:from-background/72 sm:via-background/35 md:bg-[linear-gradient(90deg,rgba(14,14,14,.08)_0%,rgba(14,14,14,.04)_38%,rgba(255,255,255,.12)_52%,rgba(255,255,255,.60)_76%,rgba(255,255,255,.80)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/[0.08] to-transparent md:h-40" />
        <div className="absolute inset-0 flex items-center">
          <div className="w-[76%] px-5 pt-12 sm:w-[60%] sm:px-8 sm:pt-14 md:mr-[7vw] md:w-[38%] md:max-w-[590px] md:px-0 md:pt-24">
            <div className="mb-2 flex items-center gap-2 md:mb-5">
              <span className="h-[2px] w-5 rounded-full bg-[#0E0E0E] md:w-8" />
              <span className="font-serif text-[6px] uppercase tracking-[0.22em] text-[#8C6B32] sm:text-[7px] md:text-[10px]">GENAN</span>
            </div>
            <h1 className="line-clamp-2 text-[22px] font-semibold leading-[1.45] tracking-[-0.025em] text-foreground sm:text-[29px] md:text-[44px] lg:text-[54px] xl:text-[64px] xl:leading-[1.25]">
              {banner.title}
            </h1>
            {banner.description && (
              <p className="mt-2 line-clamp-2 max-w-[440px] text-[8px] leading-5 text-muted-foreground sm:text-[10px] md:mt-5 md:text-[13px] md:leading-8 lg:text-[14px]">
                {banner.description}
              </p>
            )}
            <div className="mt-4 flex items-center gap-3 md:mt-8 md:gap-5">
              <Link to={banner.link} className="inline-flex h-[36px] items-center justify-center gap-1.5 rounded-[9px] bg-burgundy px-4 text-[8px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-burgundy-hover hover:shadow-[0_12px_30px_rgba(14,14,14,.28)] sm:h-[40px] md:h-[50px] md:rounded-full md:px-8 md:text-[11px]">
                {banner.cta}<ArrowLeft size={14} weight="bold" />
              </Link>
              <Link to="/products" className="hidden h-[48px] items-center border-b border-[#D8C29A] px-1 text-[11px] font-medium text-[#0E0E0E] transition-colors hover:text-[#8C6B32] md:inline-flex">
                تصفح جميع المنتجات
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;

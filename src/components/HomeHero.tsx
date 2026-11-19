import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "phosphor-react";
import { Link } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { isBannerCurrentlyVisible } from "@/lib/bannerSchedule";

const fallbackTitle = "الأناقة تبدأ من اختيارك";
const fallbackDescription = "مختارات من الماركات العالمية في الأحذية والملابس والحقائب والإكسسوارات.";
const fallbackCta = "اكتشفي المجموعة";

export const HomeHeroPhoto = () => (
  <img
    src="/brand/genan-home-banner.jpg"
    alt="حقيبة وحذاء أسودان على طاولة"
    width={4028}
    height={2186}
    fetchPriority="high"
    className="genan-hero-photo"
  />
);

const HomeHero = () => {
  const { data: banner } = useQuery({
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

      return data.find((item) => (
        item.page_slug !== "home-editorial" && item.image_url?.trim() && isBannerCurrentlyVisible(item)
      )) ?? null;
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const link = banner?.page_slug ? `/banner/${banner.page_slug}` : banner?.cta_link || "/products";
  const description = banner ? banner.subtitle_ar : fallbackDescription;

  return (
    <section dir="rtl" aria-labelledby="genan-home-hero-title" className="w-full bg-white">
      <HomeHeroPhoto />
      <div className="px-5 py-5 text-center sm:px-8 md:py-8">
        <h1 id="genan-home-hero-title" className="text-[22px] font-semibold leading-snug text-foreground sm:text-[29px]">
          {banner?.title_ar || fallbackTitle}
        </h1>
        {description && <p className="mx-auto mt-2 max-w-[440px] text-xs leading-6 text-muted-foreground md:text-sm">{description}</p>}
        <div className="mt-4 flex items-center justify-center gap-5">
          <Link to={link} className="inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-[9px] bg-[#0E0E0E] px-5 text-xs font-semibold text-white transition-colors hover:bg-[#282828] md:rounded-full md:px-8">
            {banner?.cta_text_ar || fallbackCta}
            <ArrowLeft aria-hidden="true" size={14} weight="bold" />
          </Link>
          {link !== "/products" && (
            <Link to="/products" className="hidden min-h-[44px] items-center border-b border-[#D8C29A] px-1 text-xs font-medium text-[#0E0E0E] transition-colors hover:text-[#8C6B32] md:inline-flex">
              تصفح جميع المنتجات
            </Link>
          )}
        </div>
      </div>
    </section>
  );
};

export default HomeHero;

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { isBannerCurrentlyVisible } from "@/lib/bannerSchedule";
import { optimizeImage } from "@/lib/imageUrl";

type HeroBanner = {
  image_url: string;
  title_ar: string | null;
  subtitle_ar: string | null;
  cta_text_ar: string | null;
  cta_link: string | null;
  image_zoom: number | null;
  image_position_x: number | null;
  image_position_y: number | null;
};

const FALLBACK_HERO_IMAGE =
  "https://images.pexels.com/photos/9142805/pexels-photo-9142805.jpeg?auto=compress&cs=tinysrgb&w=1800";

const HeroSlider = () => {
  const { data: banner } = useQuery({
    queryKey: ["genan-emerald-editorial-hero-v1"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("image_url,title_ar,subtitle_ar,cta_text_ar,cta_link,page_slug,image_zoom,image_position_x,image_position_y,starts_at,ends_at,title")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(20);

      if (error) throw error;
      const visible = (data || []).find(
        (item: any) =>
          !String(item.page_slug || "").startsWith("home-editorial") &&
          String(item.title || "") !== "Between products banner" &&
          Boolean(String(item.image_url || "").trim()) &&
          isBannerCurrentlyVisible(item),
      );
      return (visible || null) as HeroBanner | null;
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const heroImage = banner?.image_url?.trim() || FALLBACK_HERO_IMAGE;
  const imageSrc = heroImage.startsWith("/") ? heroImage : optimizeImage(heroImage, 1800, 84);
  const headline = banner?.title_ar?.trim() || "جمالٌ يتجاوز المألوف";
  const description =
    banner?.subtitle_ar?.trim() || "تفاصيل مختارة بعناية، وأسلوب يعبر عنك في كل لحظة.";
  const action = banner?.cta_text_ar?.trim() || "اكتشف المجموعة";
  const link = banner?.cta_link?.trim() || "/products";

  return (
    <section className="genan-hero mx-auto max-w-[1540px] px-3 pt-3 sm:px-5 sm:pt-5 lg:px-8 lg:pt-7" dir="rtl" aria-label="مجموعة جنان الرئيسية">
      <div className="genan-hero-frame relative isolate overflow-hidden rounded-[24px] border border-white/15 sm:rounded-[30px] lg:rounded-[34px]">
        <img
          src={imageSrc}
          alt={banner?.title_ar || "مختارات جنان"}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="genan-hero-photo absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: `${Number(banner?.image_position_x ?? 46)}% ${Number(banner?.image_position_y ?? 35)}%`,
            transform: `scale(${Number(banner?.image_zoom ?? 1)})`,
          }}
        />
        <div className="genan-hero-shade absolute inset-0" />
        <div className="genan-hero-aura pointer-events-none absolute inset-0" />

        <div className="relative z-10 flex h-full flex-col justify-between gap-8 px-6 pb-24 pt-9 sm:px-10 sm:pt-10 lg:px-[8%] lg:pb-32 lg:pt-14">
          <div className="flex items-start justify-between gap-5">
            <div className="flex items-center gap-3 text-white/70" dir="ltr">
              <span className="h-px w-7 bg-[#C4D7C9]/70" />
              <span className="text-[10px] uppercase tracking-[.32em]">GENAN / EDITION 01</span>
            </div>
            <span className="hidden text-[10px] tracking-[.3em] text-white/55 sm:block" dir="ltr">
              THE ART OF DETAILS
            </span>
          </div>

          <div className="max-w-[550px]">
            <div className="mb-5 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B3CBB7]" />
              <span className="text-[11px] font-medium tracking-wide text-[#E8E8DD]">عالم جنان الجديد</span>
            </div>
            <h1 className="genan-hero-title text-[clamp(2.4rem,7.4vw,6.4rem)] font-medium leading-[1.16] !text-white">
              {headline}
            </h1>
            <p className="mt-5 max-w-[380px] text-[14px] leading-[2] text-white/80 sm:text-[16px]">
              {description}
            </p>
            <Link
              to={link}
              className="genan-hero-action mt-8 inline-flex min-h-[51px] items-center gap-4 rounded-full border border-white/50 bg-[#0E2822]/65 px-6 py-3 text-[13px] font-semibold text-white backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-[#D6E6D2] hover:bg-[#153F31] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            >
              {action}
              <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/35">
                <ArrowLeft className="h-4 w-4" strokeWidth={1.7} />
              </span>
            </Link>
          </div>

          <div className="flex items-end justify-between gap-3">
            <div className="flex items-center gap-3 text-[11px] text-white/75" dir="ltr">
              <span className="text-base font-semibold text-white">01</span>
              <span className="h-px w-10 bg-white/40" />
              <span>GENAN</span>
            </div>
            <Link
              to="/categories"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
              aria-label="استعرض الأقسام"
            >
              <ArrowUpLeft className="h-5 w-5" strokeWidth={1.6} />
            </Link>
          </div>
        </div>
        <span className="genan-hero-watermark pointer-events-none absolute bottom-10 left-[4%] hidden text-[10px] uppercase tracking-[.45em] text-white/50 lg:block" dir="ltr">
          ROOTED IN STYLE · MADE FOR YOUR MOMENTS
        </span>
      </div>
    </section>
  );
};

export default HeroSlider;

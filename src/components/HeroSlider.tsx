import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "phosphor-react";

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
    queryKey: ["genan-home-hero-editorial-v4"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("image_url,title_ar,subtitle_ar,cta_text_ar,cta_link,page_slug,image_zoom,image_position_x,image_position_y,starts_at,ends_at,title")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(20);

      if (error) throw error;

      const match = (data || []).find(
        (item: any) =>
          !String(item.page_slug || "").startsWith("home-editorial") &&
          String(item.title || "") !== "Between products banner" &&
          Boolean(String(item.image_url || "").trim()) &&
          isBannerCurrentlyVisible(item),
      );

      return (match || null) as HeroBanner | null;
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const image = banner?.image_url?.trim() || FALLBACK_HERO_IMAGE;
  const imageSrc = image.startsWith("/") ? image : optimizeImage(image, 1800, 86);
  const title = banner?.title_ar?.trim() || "أناقة عصرية، بتفاصيل تشبهك.";
  const description =
    banner?.subtitle_ar?.trim() || "مختارات منتقاة بعناية لتكمّل إطلالتك بأسلوب هادئ وواثق.";
  const cta = banner?.cta_text_ar?.trim() || "اكتشفي المجموعة";
  const link = banner?.cta_link?.trim() || "/products";

  return (
    <section dir="rtl" className="w-full bg-white px-3 pt-3 md:px-6 md:pt-6">
      <div className="relative mx-auto h-[285px] max-w-[1500px] overflow-hidden border border-[#E6DED0] bg-[#F4F0E8] shadow-[0_25px_65px_-52px_rgba(15,15,15,.55)] sm:h-[330px] md:h-[500px] lg:h-[545px]">
        <div className="absolute inset-0 md:left-0 md:right-auto md:w-[58%]">
          <img
            src={imageSrc}
            alt={title}
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="h-full w-full object-cover"
            style={{
              objectPosition: `${Number(banner?.image_position_x ?? 50)}% ${Number(banner?.image_position_y ?? 42)}%`,
              transform: `scale(${Number(banner?.image_zoom ?? 1)})`,
            }}
          />
        </div>

        <div className="absolute inset-0 bg-gradient-to-l from-black/72 via-black/34 to-black/5 md:bg-gradient-to-l md:from-[#F4F0E8] md:from-[35%] md:via-[#F4F0E8]/90 md:via-[49%] md:to-transparent" />

        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full border border-[#7FAEA8]/35 md:right-[31%] md:top-[-92px] md:h-64 md:w-64" />
        <div className="pointer-events-none absolute right-7 top-7 h-3 w-3 rotate-45 border border-[#D0B779]/80 md:right-[8%] md:top-12 md:h-4 md:w-4" />
        <div className="pointer-events-none absolute bottom-[-70px] right-[35%] hidden h-52 w-52 rounded-full bg-[#7FAEA8]/10 blur-2xl md:block" />

        <div className="relative z-10 flex h-full items-center px-5 sm:px-8 md:px-[7%]">
          <div className="w-[82%] max-w-[520px] md:w-[40%]">
            <div className="mb-2.5 flex items-center gap-2 md:mb-4">
              <span className="h-px w-6 bg-[#D8C29A] md:w-9" />
              <span className="text-[6px] font-semibold tracking-[.27em] text-[#E9D9B8] md:text-[9px] md:text-[#9A825B]">
                GENAN / NEW EDIT
              </span>
            </div>

            <h1 className="max-w-[480px] text-[25px] font-semibold leading-[1.4] tracking-[-.035em] !text-white sm:text-[31px] md:text-[48px] md:!text-[#111111]">
              {title}
            </h1>

            <p className="mt-2.5 max-w-[400px] text-[8px] leading-5 text-white/75 sm:text-[9px] md:mt-4 md:text-[11px] md:leading-7 md:text-[#6D685F]">
              {description}
            </p>

            <Link
              to={link}
              className="mt-4 inline-flex items-center gap-2 border-b border-[#D8C29A] pb-1.5 text-[8px] font-semibold text-white transition-all duration-300 hover:gap-3 md:mt-7 md:text-[10px] md:text-[#111111]"
            >
              {cta}
              <ArrowLeft size={14} weight="bold" />
            </Link>
          </div>
        </div>

        <span className="pointer-events-none absolute -bottom-5 right-3 text-[62px] font-semibold tracking-[.11em] text-white/[.05] md:-bottom-11 md:right-[5%] md:text-[135px] md:text-[#111]/[.035]">
          GENAN
        </span>

        <div className="absolute bottom-4 left-4 hidden items-center gap-2 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7FAEA8]" />
          <span className="text-[7px] font-semibold tracking-[.22em] text-[#111]/35">GENAN / 2026</span>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;

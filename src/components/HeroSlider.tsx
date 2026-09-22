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

const HeroSlider = () => {
  const { data: banner } = useQuery({
    queryKey: ["genan-home-hero-compact-v3"],
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

  const image = banner?.image_url?.trim() || "/demo/genan-bag-black.svg";
  const imageSrc = image.startsWith("/") ? image : optimizeImage(image, 1600, 84);
  const title = banner?.title_ar?.trim() || "اختيارات هادئة، بتفاصيل أوضح.";
  const description = banner?.subtitle_ar?.trim() || "اكتشف تشكيلة جنان المختارة بعناية.";
  const cta = banner?.cta_text_ar?.trim() || "تسوق الآن";
  const link = banner?.cta_link?.trim() || "/products";

  return (
    <section dir="rtl" className="w-full bg-white px-3 pt-3 md:px-0 md:pt-0">
      <div className="relative mx-auto h-[245px] max-w-[1600px] overflow-hidden border border-[#E8E3DA] bg-[#F2EFE9] sm:h-[300px] md:h-[500px] md:max-w-none md:border-x-0 md:border-t-0 lg:h-[560px]">
        <img
          src={imageSrc}
          alt={title}
          loading="eager"
          decoding="async"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
          style={{
            objectPosition: `${Number(banner?.image_position_x ?? 50)}% ${Number(banner?.image_position_y ?? 50)}%`,
            transform: `scale(${Number(banner?.image_zoom ?? 1)})`,
          }}
        />

        <div className="absolute inset-0 bg-gradient-to-l from-white/96 via-white/72 to-transparent md:from-white/95 md:via-white/50" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/[.06] to-transparent" />

        <div className="absolute inset-0 flex items-center">
          <div className="mr-5 w-[68%] max-w-[520px] sm:mr-8 sm:w-[58%] md:mr-[7vw] md:w-[38%]">
            <div className="mb-2 flex items-center gap-2 md:mb-4">
              <span className="h-px w-5 bg-[#C9B183] md:w-8" />
              <span className="text-[6px] font-semibold tracking-[.24em] text-[#9A825B] md:text-[9px]">GENAN / EDIT</span>
            </div>

            <h1 className="line-clamp-2 text-[23px] font-semibold leading-[1.45] tracking-[-.03em] text-[#0E0E0E] sm:text-[29px] md:text-[46px]">
              {title}
            </h1>

            <p className="mt-2 line-clamp-2 text-[8px] leading-5 text-[#777] sm:text-[9px] md:mt-4 md:text-[11px] md:leading-7">
              {description}
            </p>

            <Link
              to={link}
              className="mt-3 inline-flex items-center gap-1.5 border-b border-[#C9B183] pb-1 text-[7px] font-semibold text-[#0E0E0E] md:mt-6 md:gap-2 md:text-[10px]"
            >
              {cta}
              <ArrowLeft size={13} weight="bold" />
            </Link>
          </div>
        </div>

        <span className="absolute bottom-3 left-3 text-[6px] font-semibold tracking-[.22em] text-[#0E0E0E]/35 md:bottom-5 md:left-6 md:text-[8px]">
          GENAN / 2026
        </span>
      </div>
    </section>
  );
};

export default HeroSlider;

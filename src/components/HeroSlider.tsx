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
  const description = banner?.subtitle_ar?.trim() || "تشكيلة منتقاة بهوية جنان.";
  const cta = banner?.cta_text_ar?.trim() || "تسوق الآن";
  const link = banner?.cta_link?.trim() || "/products";

  return (
    <section dir="rtl" className="bg-white px-3 pt-3 md:px-0 md:pt-0">
      <div className="relative mx-auto h-[285px] w-full max-w-[1600px] overflow-hidden border border-[#E8E4DC] bg-[#F2EFE8] sm:h-[340px] md:h-[500px] md:border-x-0 md:border-t-0 lg:h-[540px]">
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

        <div className="absolute inset-0 bg-gradient-to-l from-black/78 via-black/36 to-transparent md:from-black/72 md:via-black/28" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/28 to-transparent" />

        <div className="absolute inset-0 flex items-center">
          <div className="w-[78%] px-5 sm:w-[64%] sm:px-8 md:mr-[6vw] md:w-[42%] md:max-w-[570px] md:px-0">
            <div className="mb-2 flex items-center gap-2 md:mb-4">
              <span className="h-px w-6 bg-[#D8C29A] md:w-8" />
              <span className="text-[6px] font-semibold tracking-[.28em] text-[#E6D7B8] md:text-[9px]">GENAN / EDIT</span>
            </div>

            <h1 className="text-[24px] font-medium leading-[1.45] tracking-[-.04em] !text-white sm:text-[30px] md:text-[44px] lg:text-[50px]">
              {title}
            </h1>

            <p className="mt-2 max-w-[390px] text-[8px] leading-6 text-white/72 sm:text-[9px] md:mt-4 md:text-[11px] md:leading-7">
              {description}
            </p>

            <Link
              to={link}
              className="mt-4 inline-flex h-9 items-center gap-2 bg-white px-4 text-[8px] font-semibold text-[#0E0E0E] md:mt-6 md:h-11 md:px-6 md:text-[10px]"
            >
              {cta}
              <ArrowLeft size={13} weight="bold" />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-3 left-4 flex items-center gap-2 text-[6px] font-semibold tracking-[.22em] text-white/55 md:bottom-5 md:left-6 md:text-[8px]">
          GENAN / 2026
          <span className="h-1.5 w-1.5 bg-[#A9D8D3]" />
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;

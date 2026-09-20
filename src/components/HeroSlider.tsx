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
    queryKey: ["genan-home-hero-compact-v1"],
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
          String(item.page_slug || "") !== "home-editorial" &&
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
  const imageSrc = image.startsWith("/") ? image : optimizeImage(image, 1400, 86);
  const title = banner?.title_ar?.trim() || "اختيارات واضحة. تصميم أهدأ.";
  const description =
    banner?.subtitle_ar?.trim() ||
    "تجربة تسوق مرتبة حول القطعة، بدون ازدحام بصري.";
  const cta = banner?.cta_text_ar?.trim() || "تسوق الآن";
  const link = banner?.cta_link?.trim() || "/products";

  return (
    <section dir="rtl" className="bg-white px-4 pt-4 sm:px-6 md:px-[5vw] md:pt-6">
      <div className="mx-auto max-w-[1600px] overflow-hidden bg-[#0E0E0E]">
        <div className="grid min-h-[420px] md:min-h-[500px] md:grid-cols-[42%_58%]">
          <div className="order-2 flex items-center px-6 py-10 text-white sm:px-9 md:order-1 md:px-12 lg:px-16">
            <div className="max-w-[510px]">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-9 bg-[#D8C29A]" />
                <span className="text-[7px] font-semibold tracking-[.28em] text-[#D8C29A]">GENAN / EDIT</span>
                <span className="h-1.5 w-1.5 bg-[#A9D8D3]" />
              </div>

              <h1 className="text-[34px] font-medium leading-[1.3] tracking-[-.045em] text-white sm:text-[42px] lg:text-[52px]">
                {title}
              </h1>

              <p className="mt-4 max-w-[430px] text-[10px] leading-7 text-white/58 sm:text-[11px]">
                {description}
              </p>

              <Link
                to={link}
                className="mt-7 inline-flex h-11 items-center gap-3 bg-white px-6 text-[9px] font-semibold text-[#0E0E0E]"
              >
                {cta}
                <ArrowLeft size={14} weight="bold" />
              </Link>
            </div>
          </div>

          <div className="order-1 relative min-h-[300px] overflow-hidden bg-[#F3F3F3] md:order-2 md:min-h-[500px]">
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
            <div className="absolute bottom-0 left-0 bg-white px-4 py-3">
              <span className="text-[7px] font-semibold tracking-[.2em] text-[#777]">GENAN / 2026</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;

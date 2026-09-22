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
    queryKey: ["genan-home-hero-editorial-v2"],
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
  const imageSrc = image.startsWith("/") ? image : optimizeImage(image, 1800, 88);
  const title = banner?.title_ar?.trim() || "جنان، بشكل أكثر هدوءًا.";
  const description =
    banner?.subtitle_ar?.trim() ||
    "تشكيلة منتقاة داخل مساحة نظيفة، حيث تبدأ التجربة من القطعة نفسها.";
  const cta = banner?.cta_text_ar?.trim() || "اكتشف التشكيلة";
  const link = banner?.cta_link?.trim() || "/products";

  return (
    <section className="bg-white px-0 pt-0 md:px-[2.2vw] md:pt-5">
      <div className="mx-auto max-w-[1880px] overflow-hidden border-y border-black/5 bg-[#F3F0E9] md:border">
        <div dir="ltr" className="grid min-h-[720px] md:min-h-[calc(100svh-118px)] md:grid-cols-[58%_42%]">
          <div className="relative order-1 min-h-[430px] overflow-hidden bg-[#E7E3DA] md:min-h-full">
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

            <div className="absolute inset-0 bg-gradient-to-t from-black/28 via-transparent to-black/5" />

            <div className="absolute bottom-0 left-0 right-0 flex items-end justify-between gap-4 p-4 text-white md:p-6">
              <span className="text-[7px] font-semibold tracking-[.26em] text-white/70">GENAN / 2026</span>
              <span className="h-px w-14 bg-[#D8C29A]" />
            </div>
          </div>

          <div dir="rtl" className="order-2 flex items-center bg-[#0E0E0E] px-6 py-12 text-white sm:px-10 md:px-[4vw] md:py-16">
            <div className="w-full max-w-[560px]">
              <div className="flex items-center justify-between border-b border-white/12 pb-5">
                <div className="flex items-center gap-3">
                  <span className="h-px w-9 bg-[#D8C29A]" />
                  <span className="text-[7px] font-semibold tracking-[.3em] text-[#D8C29A]">GENAN / EDIT</span>
                </div>
                <span className="h-2 w-2 bg-[#A9D8D3]" />
              </div>

              <div className="py-10 md:py-14">
                <span className="text-[9px] font-medium tracking-[.18em] text-white/38">NEW SELECTION / 01</span>

                <h1 className="mt-5 max-w-[520px] text-[39px] font-medium leading-[1.23] tracking-[-.055em] !text-white sm:text-[48px] lg:text-[64px]">
                  {title}
                </h1>

                <p className="mt-6 max-w-[430px] text-[11px] leading-8 text-white/55 md:text-[12px]">
                  {description}
                </p>
              </div>

              <div className="flex items-end justify-between gap-5 border-t border-white/12 pt-6">
                <Link
                  to={link}
                  className="inline-flex h-12 items-center gap-3 bg-white px-7 text-[10px] font-semibold text-[#0E0E0E] transition-colors hover:bg-[#E6D7B8]"
                >
                  {cta}
                  <ArrowLeft size={15} weight="bold" />
                </Link>

                <div className="hidden text-left md:block">
                  <div className="text-[7px] tracking-[.24em] text-white/30">CURATED</div>
                  <div className="mt-1 text-[9px] text-white/58">BY GENAN</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;

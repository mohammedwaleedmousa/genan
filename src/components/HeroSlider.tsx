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
    queryKey: ["genan-clean-home-hero-v1"],
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
  const title = banner?.title_ar?.trim() || "اختيارات أقل. حضور أقوى.";
  const description =
    banner?.subtitle_ar?.trim() ||
    "جنان ترتب تجربة التسوق حول المنتج نفسه: صورة واضحة، تفاصيل هادئة، واختيار أسرع.";
  const cta = banner?.cta_text_ar?.trim() || "اكتشف المنتجات";
  const link = banner?.cta_link?.trim() || "/products";

  return (
    <section dir="rtl" className="border-b border-[#EAEAEA] bg-white">
      <div className="mx-auto grid max-w-[1760px] md:min-h-[620px] md:grid-cols-2">
        <div className="flex items-center px-5 py-14 sm:px-8 md:px-[6vw] md:py-20">
          <div className="max-w-[620px]">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-12 bg-[#D8C29A]" />
              <span className="text-[8px] font-semibold tracking-[.34em] text-[#9A825B]">GENAN / CURATED STORE</span>
              <span className="h-1.5 w-1.5 bg-[#A9D8D3]" />
            </div>

            <h1 className="text-[42px] font-medium leading-[1.28] tracking-[-.055em] text-[#0E0E0E] sm:text-[54px] lg:text-[68px]">
              {title}
            </h1>

            <p className="mt-6 max-w-[500px] text-[12px] leading-8 text-[#6F6F6F] md:text-[13px]">
              {description}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-5">
              <Link
                to={link}
                className="inline-flex h-12 items-center gap-3 bg-[#0E0E0E] px-7 text-[10px] font-semibold text-white transition-colors hover:bg-[#1B1B1B]"
              >
                {cta}
                <ArrowLeft size={15} weight="bold" />
              </Link>

              <Link
                to="/categories"
                className="border-b border-[#D8C29A] pb-1.5 text-[10px] font-semibold text-[#0E0E0E]"
              >
                تصفح الأقسام
              </Link>
            </div>

            <div className="mt-12 flex items-center gap-8 border-t border-[#EAEAEA] pt-5">
              <div>
                <span className="block text-[16px] font-semibold text-[#0E0E0E]">01</span>
                <span className="mt-1 block text-[7px] tracking-[.16em] text-[#999]">CLEAR LAYOUT</span>
              </div>
              <div>
                <span className="block text-[16px] font-semibold text-[#0E0E0E]">02</span>
                <span className="mt-1 block text-[7px] tracking-[.16em] text-[#999]">CURATED ITEMS</span>
              </div>
              <div>
                <span className="block h-2 w-2 bg-[#A9D8D3]" />
                <span className="mt-2 block text-[7px] tracking-[.16em] text-[#999]">GENAN DETAIL</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative min-h-[430px] overflow-hidden bg-[#F4F4F4] md:min-h-[620px]">
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

          <div className="pointer-events-none absolute inset-0 border-[14px] border-white/0 md:border-[22px]" />

          <div className="absolute bottom-0 left-0 flex items-center gap-3 bg-white px-5 py-4 md:px-6">
            <span className="h-1.5 w-1.5 bg-[#A9D8D3]" />
            <span className="text-[7px] font-semibold tracking-[.24em] text-[#777]">GENAN / 2026</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;

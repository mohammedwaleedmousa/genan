import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { isBannerCurrentlyVisible } from "@/lib/bannerSchedule";
import { optimizeImage } from "@/lib/imageUrl";

type HomeEditorialBannerProps = {
  slot?: 0 | 1;
};

const fallbackCopy = [
  {
    kicker: "GENAN / NEW",
    title: "تفاصيل أقل. اختيار أوضح.",
    subtitle: "اكتشف الجديد من جنان.",
    cta: "وصل حديثًا",
    link: "/new-arrivals",
  },
  {
    kicker: "GENAN / CURATED",
    title: "مختارات منتقاة بهدوء.",
    subtitle: "تسوق التشكيلة الكاملة.",
    cta: "اكتشف التشكيلة",
    link: "/products",
  },
];

const GenanServices = ({ slot = 0 }: HomeEditorialBannerProps) => {
  const { data: banners = [] } = useQuery({
    queryKey: ["genan-home-editorial-banners-compact-v2"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("id,title,title_ar,subtitle_ar,image_url,cta_text_ar,cta_link,image_zoom,image_position_x,image_position_y,page_slug,sort_order,starts_at,ends_at")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(30);

      if (error) throw error;

      return (data || []).filter(
        (item: any) =>
          isBannerCurrentlyVisible(item) &&
          (
            String(item.page_slug || "").startsWith("home-editorial") ||
            String(item.title || "") === "Between products banner"
          ),
      );
    },
    staleTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const banner = banners[slot] || null;
  const fallback = fallbackCopy[slot];
  const imageUrl = String(banner?.image_url || "").trim();
  const title = String(banner?.title_ar || fallback.title);
  const subtitle = String(banner?.subtitle_ar || fallback.subtitle);
  const cta = String(banner?.cta_text_ar || fallback.cta);
  const link = String(banner?.cta_link || fallback.link);

  return (
    <section className="bg-white px-3 py-3 sm:px-5 md:px-[5vw] md:py-7" dir="rtl">
      <div className="relative mx-auto h-[210px] max-w-[1500px] overflow-hidden bg-[#0E0E0E] sm:h-[250px] md:h-[340px]">
        {imageUrl ? (
          <>
            <img
              src={optimizeImage(imageUrl, 1600, 82)}
              alt={title}
              loading="lazy"
              decoding="async"
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                objectPosition: `${Number(banner?.image_position_x ?? 50)}% ${Number(banner?.image_position_y ?? 50)}%`,
                transform: `scale(${Number(banner?.image_zoom ?? 1)})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/74 via-black/38 to-black/10" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[#0E0E0E]" />
            <div className="absolute -left-12 -top-16 h-56 w-56 border border-[#D8C29A]/18 md:h-72 md:w-72" />
            <span className="absolute -bottom-5 left-4 text-[72px] font-medium tracking-[.1em] text-white/[.035] md:text-[120px]">GENAN</span>
          </>
        )}

        <div className="relative z-10 flex h-full items-center px-5 sm:px-7 md:px-10 lg:px-12">
          <div className="max-w-[520px]">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-6 bg-[#D8C29A]" />
              <span className="text-[6px] font-semibold tracking-[.26em] text-[#E6D7B8] md:text-[8px]">
                {fallback.kicker}
              </span>
            </div>

            <h2 className="text-[22px] font-medium leading-[1.45] tracking-[-.04em] !text-white sm:text-[26px] md:text-[36px]">
              {title}
            </h2>

            <p className="mt-2 max-w-[430px] text-[8px] leading-6 text-white/65 md:mt-3 md:text-[10px]">
              {subtitle}
            </p>

            <Link
              to={link}
              className="mt-4 inline-flex items-center gap-2 border-b border-white/35 pb-1 text-[8px] font-semibold text-white md:text-[9px]"
            >
              {cta}
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.4} />
            </Link>
          </div>
        </div>

        <span className="absolute bottom-3 left-4 z-10 text-[6px] tracking-[.22em] text-white/32 md:bottom-4 md:left-5 md:text-[7px]">
          0{slot + 1} / HOME EDIT
        </span>
      </div>
    </section>
  );
};

export default GenanServices;

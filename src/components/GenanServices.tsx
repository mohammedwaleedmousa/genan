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
    title: "تفاصيل أقل. اختيار أوضح.",
    subtitle: "اكتشف الجديد من جنان.",
    cta: "وصل حديثًا",
    link: "/new-arrivals",
  },
  {
    title: "مختارات صنعت لتبقى.",
    subtitle: "تشكيلة هادئة، مرتبة حول القطعة نفسها.",
    cta: "تسوق التشكيلة",
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
    <section className="bg-white px-3 py-3 md:px-6 md:py-8" dir="rtl">
      <div className="relative mx-auto h-[188px] max-w-[1500px] overflow-hidden bg-[#0E0E0E] md:h-[340px]">
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
            <div className="absolute inset-0 bg-gradient-to-l from-black/75 via-black/35 to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[#0E0E0E]" />
            <div className="absolute left-4 top-4 h-[70%] w-[44%] border border-[#D8C29A]/20 md:left-9 md:top-8" />
            <span className="absolute -bottom-5 left-3 text-[62px] font-medium tracking-[.08em] text-white/[.035] md:-bottom-12 md:text-[150px]">GENAN</span>
          </>
        )}

        <div className="relative z-10 flex h-full items-center px-5 md:px-12">
          <div className="max-w-[520px]">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-px w-5 bg-[#D8C29A]" />
              <span className="text-[6px] font-semibold tracking-[.24em] text-[#E6D7B8] md:text-[8px]">GENAN / CURATED</span>
            </div>

            <h2 className="max-w-[450px] text-[20px] font-medium leading-[1.45] tracking-[-.035em] !text-white md:text-[36px]">
              {title}
            </h2>

            <p className="mt-2 line-clamp-1 text-[7px] text-white/55 md:mt-3 md:text-[10px]">{subtitle}</p>

            <Link to={link} className="mt-3 inline-flex items-center gap-1.5 border-b border-white/35 pb-0.5 text-[7px] font-semibold text-white md:mt-5 md:text-[9px]">
              {cta}
              <ArrowLeft className="h-3 w-3" strokeWidth={1.5} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenanServices;

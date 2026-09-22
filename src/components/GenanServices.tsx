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
    kicker: "GENAN / EDITORIAL",
    title: "تفاصيل أقل. حضور أقوى.",
    subtitle: "فواصل بصرية هادئة بين المجموعات حتى تبقى الصفحة مرتبة ومريحة.",
    cta: "اكتشف الجديد",
    link: "/new-arrivals",
  },
  {
    kicker: "GENAN / CURATED",
    title: "القطعة أولاً، وكل شيء آخر يأتي بعدها.",
    subtitle: "تجربة مبنية حول الصورة والاختيار، لا حول الزحام.",
    cta: "تسوق التشكيلة",
    link: "/products",
  },
];

const GenanServices = ({ slot = 0 }: HomeEditorialBannerProps) => {
  const { data: banners = [] } = useQuery({
    queryKey: ["genan-home-editorial-banners-v1"],
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
            String(item.page_slug || "") === "home-editorial" ||
            String(item.title || "") === "Between products banner"
          ),
      );
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const banner = banners[slot] || null;
  const fallback = fallbackCopy[slot];
  const imageUrl = String(banner?.image_url || "").trim();
  const title = String(banner?.title_ar || fallback.title);
  const subtitle = String(banner?.subtitle_ar || fallback.subtitle);
  const cta = String(banner?.cta_text_ar || fallback.cta);
  const link = String(banner?.cta_link || fallback.link);

  return (
    <section className="bg-white px-4 py-5 sm:px-6 md:px-[5vw] md:py-9" dir="rtl">
      <div className="relative mx-auto min-h-[320px] max-w-[1600px] overflow-hidden bg-[#0E0E0E] md:min-h-[430px]">
        {imageUrl ? (
          <>
            <img
              src={optimizeImage(imageUrl, 1800, 84)}
              alt={title}
              loading="lazy"
              decoding="async"
              width={1600}
              height={620}
              className="absolute inset-0 h-full w-full object-cover"
              style={{
                objectPosition: `${Number(banner?.image_position_x ?? 50)}% ${Number(banner?.image_position_y ?? 50)}%`,
                transform: `scale(${Number(banner?.image_zoom ?? 1)})`,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-l from-black/78 via-black/40 to-black/10" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[#0E0E0E]" />
            <div className="absolute -left-[8%] top-1/2 h-[280px] w-[280px] -translate-y-1/2 border border-[#D8C29A]/20 md:h-[420px] md:w-[420px]" />
            <div className="absolute left-[8%] top-[20%] h-2 w-2 bg-[#A9D8D3]" />
            <div className="absolute bottom-[14%] left-[16%] h-px w-[24%] bg-[#D8C29A]/35" />
            <span className="absolute -bottom-7 left-4 select-none text-[82px] font-medium tracking-[.08em] text-white/[.035] md:-bottom-12 md:text-[170px]">
              GENAN
            </span>
          </>
        )}

        <div className="relative z-10 flex min-h-[320px] items-end p-6 sm:p-8 md:min-h-[430px] md:items-center md:p-14 lg:p-16">
          <div className="max-w-[660px]">
            <div className="mb-5 flex items-center gap-3">
              <span className="h-px w-10 bg-[#D8C29A]" />
              <span className="text-[8px] font-semibold tracking-[.32em] text-[#E6D7B8]">
                {banner ? "GENAN / EDITORIAL" : fallback.kicker}
              </span>
            </div>

            <h2 className="max-w-[620px] text-[30px] font-medium leading-[1.35] tracking-[-.05em] !text-white sm:text-[38px] md:text-[52px]">
              {title}
            </h2>

            <p className="mt-4 max-w-[520px] text-[10px] leading-7 text-white/58 md:text-[12px] md:leading-8">
              {subtitle}
            </p>

            <Link
              to={link}
              className="mt-7 inline-flex h-11 items-center gap-3 border border-white/30 bg-white px-6 text-[9px] font-semibold text-[#0E0E0E] transition-colors hover:bg-[#E6D7B8] md:h-12 md:px-7 md:text-[10px]"
            >
              {cta}
              <ArrowLeft className="h-4 w-4" strokeWidth={1.4} />
            </Link>
          </div>
        </div>

        <span className="absolute bottom-5 left-5 z-10 text-[7px] tracking-[.26em] text-white/35 md:bottom-7 md:left-7">
          0{slot + 1} / HOME EDIT
        </span>
      </div>
    </section>
  );
};

export default GenanServices;

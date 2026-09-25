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
    title: "أناقة هادئة. حضور لا ينسى.",
    subtitle: "مختارات جنان بتفاصيل عصرية ولمسة راقية لكل يوم.",
    cta: "اكتشفي الجديد",
    link: "/new-arrivals",
    imageUrl:
      "https://images.pexels.com/photos/8989866/pexels-photo-8989866.jpeg?auto=compress&cs=tinysrgb&w=1800",
  },
  {
    title: "مختارات صنعت لتبقى.",
    subtitle: "تشكيلة هادئة، مرتبة حول القطعة نفسها.",
    cta: "تسوق التشكيلة",
    link: "/products",
    imageUrl: "",
  },
];

const GenanServices = ({ slot = 0 }: HomeEditorialBannerProps) => {
  const { data: banners = [] } = useQuery({
    queryKey: ["genan-home-editorial-banners-compact-v3"],
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
  const imageUrl = String(banner?.image_url || fallback.imageUrl || "").trim();
  const title = String(banner?.title_ar || fallback.title);
  const subtitle = String(banner?.subtitle_ar || fallback.subtitle);
  const cta = String(banner?.cta_text_ar || fallback.cta);
  const link = String(banner?.cta_link || fallback.link);

  return (
    <section className="bg-white px-3 py-4 md:px-6 md:py-9" dir="rtl">
      <div className="relative mx-auto min-h-[232px] max-w-[1500px] overflow-hidden border border-[#E6DED0] bg-[#F6F2EA] shadow-[0_20px_55px_-45px_rgba(15,15,15,.4)] md:h-[360px]">
        {imageUrl ? (
          <>
            <div className="absolute inset-0 md:left-0 md:right-auto md:w-[56%]">
              <img
                src={optimizeImage(imageUrl, 1800, 84)}
                alt={title}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover"
                style={{
                  objectPosition: `${Number(banner?.image_position_x ?? 50)}% ${Number(banner?.image_position_y ?? 46)}%`,
                  transform: `scale(${Number(banner?.image_zoom ?? 1)})`,
                }}
              />
            </div>

            <div className="absolute inset-0 bg-gradient-to-l from-black/78 via-black/42 to-black/10 md:bg-gradient-to-l md:from-[#F6F2EA] md:from-[38%] md:via-[#F6F2EA]/88 md:via-[52%] md:to-transparent" />
          </>
        ) : (
          <>
            <div className="absolute inset-0 bg-[#111111]" />
            <div className="absolute left-5 top-5 h-[68%] w-[42%] border border-[#D8C29A]/20 md:left-10 md:top-9" />
          </>
        )}

        <span className="pointer-events-none absolute -right-11 -top-12 h-32 w-32 rounded-full border border-[#7FAEA8]/35 md:-right-16 md:-top-20 md:h-52 md:w-52" />
        <span className="pointer-events-none absolute right-7 top-5 h-2.5 w-2.5 rotate-45 border border-[#C9B183]/80 md:right-[9%] md:top-10 md:h-4 md:w-4" />
        <span className="pointer-events-none absolute bottom-[-50px] right-[33%] hidden h-36 w-36 rounded-full bg-[#8AB8B0]/10 blur-2xl md:block" />

        <div className="pointer-events-none absolute -bottom-3 right-3 text-[56px] font-semibold tracking-[.12em] text-white/[.055] md:-bottom-8 md:right-[5%] md:text-[120px] md:text-[#111]/[.035]">
          GENAN
        </div>

        <div className="relative z-10 flex min-h-[232px] items-center px-5 py-7 md:h-full md:px-[7%] md:py-0">
          <div className="w-[86%] max-w-[520px] md:w-[43%]">
            <div className="mb-2.5 flex items-center gap-2 md:mb-4">
              <span className="h-px w-6 bg-[#D8C29A] md:w-8" />
              <span className="text-[6px] font-semibold tracking-[.26em] text-[#E7D7B7] md:text-[8px] md:text-[#9A825B]">
                GENAN / CURATED
              </span>
            </div>

            <h2 className="max-w-[470px] text-[22px] font-semibold leading-[1.45] tracking-[-.035em] !text-white md:text-[39px] md:!text-[#111111]">
              {title}
            </h2>

            <p className="mt-2.5 max-w-[390px] text-[8px] leading-5 text-white/72 md:mt-4 md:text-[10px] md:leading-6 md:text-[#6E6961]">
              {subtitle}
            </p>

            <Link
              to={link}
              className="mt-4 inline-flex items-center gap-2 border-b border-[#D8C29A] pb-1.5 text-[8px] font-semibold text-white transition-all duration-300 hover:gap-3 md:mt-6 md:text-[10px] md:text-[#111111]"
            >
              {cta}
              <ArrowLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            </Link>
          </div>
        </div>

        <div className="absolute bottom-3 left-3 hidden items-center gap-2 md:flex">
          <span className="h-1.5 w-1.5 rounded-full bg-[#7FAEA8]" />
          <span className="text-[7px] font-semibold tracking-[.22em] text-[#111]/35">GENAN / 2026</span>
        </div>
      </div>
    </section>
  );
};

export default GenanServices;

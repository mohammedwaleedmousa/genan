import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import { Autoplay } from "swiper/modules";
import { ArrowLeft } from "phosphor-react";

import { supabase } from "@/integrations/supabase/client";
import { isBannerCurrentlyVisible } from "@/lib/bannerSchedule";
import { handleImageError, optimizeImage } from "@/lib/imageUrl";

import "swiper/css";

type HeroSlide = {
  image: string;
  title: string;
  desc: string;
  cta: string;
  link: string;
  imageZoom: number;
  imagePositionX: number;
  imagePositionY: number;
};

const FallbackHero = () => (
  <div className="relative min-h-[760px] overflow-hidden bg-[#FFFFFF] md:min-h-[820px]">
    <div className="absolute inset-y-0 left-0 hidden w-[12%] border-r border-[#0E0E0E]/15 md:block">
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[8px] tracking-[0.42em] text-[#0E0E0E]/45 [writing-mode:vertical-rl]">
        GENAN — CURATED COMMERCE
      </div>
    </div>

    <div className="grid min-h-[760px] md:ml-[12%] md:min-h-[820px] md:grid-cols-[1.05fr_.95fr]">
      <div className="relative flex items-end bg-[#0E0E0E] px-6 pb-10 pt-20 sm:px-10 md:px-14 md:pb-16 lg:px-20">
        <span className="absolute left-6 top-6 text-[clamp(100px,17vw,260px)] font-light leading-none tracking-[-.08em] text-white/[0.055] md:left-10 md:top-0">G</span>
        <div className="relative max-w-[720px]">
          <span className="text-[8px] font-semibold tracking-[.38em] text-[#D8C29A]">GENAN / NEW LANGUAGE</span>
          <h1 className="mt-5 text-[44px] font-medium leading-[1.25] tracking-[-.06em] text-white sm:text-[58px] lg:text-[78px]">
            التسوق كمساحة عرض، لا كقائمة طويلة.
          </h1>
          <p className="mt-7 max-w-[520px] text-[12px] leading-8 text-white/58 md:text-[14px]">
            تجربة هادئة، انتقائية، ومصممة حول القطعة نفسها. جنان تعرض أقل، لكن بطريقة تستحق التوقف.
          </p>
          <div className="mt-9 flex items-center gap-5">
            <Link to="/products" className="inline-flex h-12 items-center gap-3 bg-white px-7 text-[10px] font-semibold text-[#0E0E0E] transition-transform hover:-translate-y-0.5">
              اكتشف المجموعة <ArrowLeft size={15} weight="bold" />
            </Link>
            <Link to="/new-arrivals" className="border-b border-white/35 pb-1 text-[10px] font-semibold text-white/80">وصل حديثًا</Link>
          </div>
        </div>
      </div>

      <div className="relative min-h-[420px] overflow-hidden bg-[#E6D7B8] md:min-h-0">
        <div className="absolute inset-[9%] border border-[#0E0E0E]/25" />
        <div className="absolute bottom-[11%] right-[10%] h-[43%] w-[50%] bg-[#FFFFFF]" />
        <div className="absolute bottom-[17%] right-[16%] h-[43%] w-[50%] border border-[#0E0E0E]" />
        <div className="absolute left-6 top-6 max-w-[180px] text-[8px] leading-5 tracking-[.24em] text-[#0E0E0E]/55">
          OBJECTS / STYLE / DAILY LIFE
        </div>
      </div>
    </div>
  </div>
);

const HeroSlider = () => {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: managedSlides = [], isLoading } = useQuery({
    queryKey: ["genan-home-hero-banners-v3"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("banners")
        .select("image_url,title,title_ar,subtitle_ar,cta_text_ar,cta_link,page_slug,image_zoom,image_position_x,image_position_y,starts_at,ends_at")
        .eq("is_active", true)
        .neq("title", "Between products banner")
        .order("sort_order", { ascending: true })
        .limit(20);

      if (error) throw error;

      return (data || [])
        .filter((slide: any) => String(slide.page_slug || "") !== "home-editorial")
        .filter((slide: any) => Boolean(String(slide.image_url || "").trim()) && isBannerCurrentlyVisible(slide))
        .slice(0, 5)
        .map((slide: any) => ({
          image: String(slide.image_url),
          title: String(slide.title_ar || ""),
          desc: String(slide.subtitle_ar || ""),
          cta: String(slide.cta_text_ar || "اكتشف المجموعة"),
          link: slide.page_slug ? `/banner/${slide.page_slug}` : slide.cta_link || "/products",
          imageZoom: Number(slide.image_zoom ?? 1),
          imagePositionX: Number(slide.image_position_x ?? 50),
          imagePositionY: Number(slide.image_position_y ?? 50),
        })) as HeroSlide[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const slides = managedSlides;
  const heroImageWidth = typeof window !== "undefined" && window.innerWidth < 768 ? 900 : 1600;

  return (
    <section dir="rtl" className="w-full bg-[#FFFFFF]">
      {slides.length > 0 ? (
        <div className="relative overflow-hidden">
          <Swiper
            modules={[Autoplay]}
            onSwiper={(swiper) => { swiperRef.current = swiper; }}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            autoplay={{ delay: 6800, disableOnInteraction: false, pauseOnMouseEnter: true }}
            speed={900}
            loop={slides.length > 1}
            className="w-full"
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={`${slide.image}-${index}`}>
                <article className="relative min-h-[760px] overflow-hidden md:min-h-[820px]">
                  <div className="absolute inset-0">
                    <img
                      src={optimizeImage(slide.image, heroImageWidth, index === 0 ? 86 : 80)}
                      alt={slide.title || "Genan"}
                      loading={index === 0 ? "eager" : "lazy"}
                      decoding="async"
                      fetchPriority={index === 0 ? "high" : "low"}
                      width={heroImageWidth}
                      height={1200}
                      onError={handleImageError}
                      className="h-full w-full object-cover"
                      style={{
                        objectPosition: `${slide.imagePositionX}% ${slide.imagePositionY}%`,
                        transform: `scale(${slide.imageZoom})`,
                      }}
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,34,27,.92)_0%,rgba(15,34,27,.78)_34%,rgba(15,34,27,.18)_70%,rgba(15,34,27,.05)_100%)]" />
                  </div>

                  <div className="relative z-10 flex min-h-[760px] items-end px-5 pb-12 pt-24 sm:px-8 md:min-h-[820px] md:px-[8vw] md:pb-20">
                    <div className="max-w-[690px]">
                      <div className="mb-6 flex items-center gap-4">
                        <span className="text-[8px] font-semibold tracking-[.4em] text-[#E6D7B8]">GENAN / {String(index + 1).padStart(2, "0")}</span>
                        <span className="h-px w-16 bg-[#E6D7B8]/45" />
                      </div>
                      <h1 className="text-[44px] font-medium leading-[1.28] tracking-[-.065em] text-white sm:text-[58px] lg:text-[78px]">
                        {slide.title}
                      </h1>
                      {slide.desc && <p className="mt-6 max-w-[520px] text-[12px] leading-8 text-white/66 md:text-[14px]">{slide.desc}</p>}
                      <div className="mt-9 flex flex-wrap items-center gap-5">
                        <Link to={slide.link} className="inline-flex h-12 items-center gap-3 bg-white px-7 text-[10px] font-semibold text-[#0E0E0E] transition-transform hover:-translate-y-0.5">
                          {slide.cta} <ArrowLeft size={15} weight="bold" />
                        </Link>
                        <Link to="/products" className="border-b border-white/35 pb-1 text-[10px] font-semibold text-white/82">كل المنتجات</Link>
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 top-0 hidden w-[74px] border-r border-white/15 md:block">
                    <span className="absolute bottom-10 left-1/2 -translate-x-1/2 text-[8px] tracking-[.36em] text-[#A9D8D3]/80 [writing-mode:vertical-rl]">CURATED BY GENAN</span>
                  </div>
                </article>
              </SwiperSlide>
            ))}
          </Swiper>

          {slides.length > 1 && (
            <div className="absolute bottom-6 left-5 z-30 flex gap-1 sm:left-8 md:bottom-10 md:left-[8vw]">
              {slides.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`الانتقال إلى العرض ${index + 1}`}
                  onClick={() => swiperRef.current?.slideToLoop(index)}
                  className={`h-8 min-w-10 border-t px-2 text-[8px] transition-all ${activeIndex === index ? "border-white text-white" : "border-white/25 text-white/45"}`}
                >
                  {String(index + 1).padStart(2, "0")}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : isLoading ? (
        <div className="min-h-[760px] animate-pulse bg-[#DCD6C8]" />
      ) : (
        <FallbackHero />
      )}
    </section>
  );
};

export default HeroSlider;

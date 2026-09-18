import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper";
import { Autoplay } from "swiper/modules";
import { ArrowLeft } from "phosphor-react";

import Logo from "@/components/Logo";
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
  <div className="mx-auto grid min-h-[650px] w-full max-w-[1680px] overflow-hidden bg-[#F5F1E7] md:grid-cols-[0.92fr_1.08fr]">
    <div className="relative order-2 flex items-center overflow-hidden px-6 py-14 sm:px-10 md:order-1 md:px-14 lg:px-20">
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full border border-[#173A2D]/10" />
      <div className="pointer-events-none absolute -bottom-8 -left-8 h-48 w-48 rounded-full border border-[#B89453]/20" />
      <div className="relative max-w-[620px]">
        <div className="mb-9 flex items-center gap-4">
          <span className="text-[9px] font-medium tracking-[0.38em] text-[#9D7B40]">GENAN / 01</span>
          <span className="h-px w-14 bg-[#B89453]/55" />
        </div>
        <Logo size="xl" className="mb-7" />
        <h1 className="max-w-[610px] text-[38px] font-medium leading-[1.42] tracking-[-0.055em] text-[#173A2D] sm:text-[48px] lg:text-[66px]">
          أشياء مختارة بهدوء، لتبقى أكثر.
        </h1>
        <p className="mt-6 max-w-[470px] text-[12px] leading-8 text-[#647067] lg:text-[14px]">
          جنان ليست واجهة مليئة بالضجيج. هي مساحة مرتبة لاكتشاف القطع التي تستحق أن تتوقف عندها.
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-5">
          <Link to="/products" className="inline-flex h-12 items-center gap-3 bg-[#173A2D] px-7 text-[10px] font-semibold tracking-[0.02em] text-white transition-all hover:bg-[#214C3B]">
            اكتشف المجموعة
            <ArrowLeft size={15} weight="bold" />
          </Link>
          <Link to="/new-arrivals" className="inline-flex h-12 items-center border-b border-[#9D7B40]/55 text-[10px] font-semibold text-[#173A2D]">
            وصل حديثًا
          </Link>
        </div>
      </div>
    </div>

    <div className="relative order-1 min-h-[430px] overflow-hidden bg-[#173A2D] md:order-2 md:min-h-[650px]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_72%_25%,rgba(255,255,255,.13),transparent_22%),radial-gradient(circle_at_28%_76%,rgba(184,148,83,.34),transparent_28%)]" />
      <div className="absolute left-[12%] top-[11%] h-[68%] w-[58%] border border-white/16" />
      <div className="absolute bottom-[12%] right-[8%] h-[36%] w-[38%] bg-[#F0E7D1]" />
      <div className="absolute bottom-[18%] right-[14%] h-[36%] w-[38%] border border-[#B89453]" />
      <div className="absolute left-7 top-7 text-[8px] tracking-[0.4em] text-white/55 [writing-mode:vertical-rl]">
        OBJECTS · STYLE · EVERYDAY
      </div>
      <div className="absolute bottom-7 right-7 max-w-[260px] text-right text-[11px] leading-6 text-white/65">
        مساحة جديدة للتسوق، مصممة حول الاختيار لا حول الازدحام.
      </div>
    </div>
  </div>
);

const HeroSlider = () => {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: managedSlides = [], isLoading } = useQuery({
    queryKey: ["genan-home-hero-banners-v2"],
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
  const heroImageWidth = typeof window !== "undefined" && window.innerWidth < 768 ? 900 : 1500;

  return (
    <section dir="rtl" className="w-full bg-[#EEE9DD]">
      <div className="mx-auto w-full max-w-[1760px] px-0 md:px-5 lg:px-8">
        {slides.length > 0 ? (
          <div className="relative overflow-hidden md:py-6">
            <Swiper
              modules={[Autoplay]}
              onSwiper={(swiper) => { swiperRef.current = swiper; }}
              onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
              autoplay={{ delay: 6200, disableOnInteraction: false, pauseOnMouseEnter: true }}
              speed={820}
              loop={slides.length > 1}
              className="w-full"
            >
              {slides.map((slide, index) => (
                <SwiperSlide key={`${slide.image}-${index}`}>
                  <article className="grid min-h-[680px] overflow-hidden bg-[#F8F6F0] md:grid-cols-[0.9fr_1.1fr]">
                    <div className="order-2 flex items-center px-6 py-12 sm:px-10 md:order-1 md:px-12 lg:px-16 xl:px-20">
                      <div className="w-full max-w-[620px]">
                        <div className="mb-7 flex items-center gap-4">
                          <span className="text-[8px] font-semibold tracking-[0.35em] text-[#9D7B40]">
                            GENAN / {String(index + 1).padStart(2, "0")}
                          </span>
                          <span className="h-px w-12 bg-[#B89453]/55" />
                        </div>
                        <h1 className="max-w-[610px] text-[36px] font-medium leading-[1.46] tracking-[-0.05em] text-[#173A2D] sm:text-[46px] lg:text-[64px]">
                          {slide.title}
                        </h1>
                        {slide.desc && (
                          <p className="mt-6 max-w-[470px] text-[12px] leading-8 text-[#657068] lg:text-[14px]">
                            {slide.desc}
                          </p>
                        )}
                        <div className="mt-9 flex flex-wrap items-center gap-5">
                          <Link to={slide.link} className="inline-flex h-12 items-center gap-3 bg-[#173A2D] px-7 text-[10px] font-semibold text-white transition-all hover:bg-[#214C3B]">
                            {slide.cta}
                            <ArrowLeft size={15} weight="bold" />
                          </Link>
                          <Link to="/products" className="inline-flex h-12 items-center border-b border-[#9D7B40]/55 text-[10px] font-semibold text-[#173A2D]">
                            كل المنتجات
                          </Link>
                        </div>
                      </div>
                    </div>

                    <div className="relative order-1 min-h-[440px] overflow-hidden bg-[#D9D4C8] md:order-2 md:min-h-[680px]">
                      <img
                        src={optimizeImage(slide.image, heroImageWidth, index === 0 ? 84 : 78)}
                        alt={slide.title || "Genan"}
                        loading={index === 0 ? "eager" : "lazy"}
                        decoding="async"
                        fetchPriority={index === 0 ? "high" : "low"}
                        width={heroImageWidth}
                        height={1100}
                        onError={handleImageError}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-[1400ms]"
                        style={{
                          objectPosition: `${slide.imagePositionX}% ${slide.imagePositionY}%`,
                          transform: `scale(${slide.imageZoom})`,
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/[0.03]" />
                      <div className="absolute bottom-5 left-5 text-[8px] tracking-[0.32em] text-white/70 md:bottom-8 md:left-8">
                        CURATED BY GENAN
                      </div>
                    </div>
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>

            {slides.length > 1 && (
              <div className="absolute bottom-8 right-6 z-30 flex items-center gap-2 md:bottom-12 md:right-[calc(55%+28px)]">
                {slides.map((_, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-label={`الانتقال إلى العرض ${index + 1}`}
                    onClick={() => swiperRef.current?.slideToLoop(index)}
                    className={`flex h-7 min-w-7 items-center justify-center border-b text-[8px] transition-all ${activeIndex === index ? "border-[#173A2D] text-[#173A2D]" : "border-transparent text-[#8A918A]"}`}
                  >
                    {String(index + 1).padStart(2, "0")}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : isLoading ? (
          <div className="min-h-[680px] animate-pulse bg-[#E4DFD3]" />
        ) : (
          <FallbackHero />
        )}
      </div>
    </section>
  );
};

export default HeroSlider;

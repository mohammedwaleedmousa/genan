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
  <div className="relative isolate min-h-[420px] overflow-hidden bg-[#F2EFE5] sm:min-h-[480px] md:min-h-[610px]">
    <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(184,148,83,.18),transparent_30%),radial-gradient(circle_at_85%_85%,rgba(25,75,57,.18),transparent_34%)]" />
    <div className="absolute -left-[7%] top-[12%] h-[290px] w-[290px] rounded-full border border-[#173A2D]/12 md:h-[450px] md:w-[450px]" />
    <div className="absolute -left-[2%] top-[20%] h-[210px] w-[210px] rounded-full border border-[#B89453]/20 md:h-[330px] md:w-[330px]" />
    <div className="absolute bottom-[-120px] right-[-70px] h-[360px] w-[360px] rounded-full bg-[#173A2D] md:h-[520px] md:w-[520px]" />
    <div className="absolute bottom-[42px] right-[42px] hidden h-[230px] w-[230px] rounded-full border border-white/15 md:block" />
    <div className="absolute right-[10%] top-[18%] hidden text-[11px] tracking-[0.42em] text-[#173A2D]/35 md:block [writing-mode:vertical-rl]">
      CURATED · TIMELESS · GENAN
    </div>

    <div className="relative z-10 mx-auto flex min-h-[420px] w-full max-w-[1500px] items-center px-5 py-14 sm:min-h-[480px] sm:px-8 md:min-h-[610px] md:px-12 lg:px-16">
      <div className="max-w-[650px]">
        <div className="mb-6 flex items-center gap-3">
          <span className="h-px w-9 bg-[#B89453]" />
          <span className="text-[8px] font-semibold tracking-[0.34em] text-[#9D7B40] md:text-[10px]">A NEW CHAPTER</span>
        </div>
        <Logo size="xl" className="mb-5" />
        <h1 className="max-w-[600px] text-[34px] font-medium leading-[1.5] tracking-[-0.04em] text-[#173A2D] sm:text-[42px] md:text-[58px] lg:text-[68px]">
          اختيارات تعرف كيف تصنع حضورها.
        </h1>
        <p className="mt-5 max-w-[490px] text-[12px] leading-8 text-[#5F685F] md:text-[14px]">
          تجربة تسوق جديدة من جنان، مبنية حول القطع المختارة، التفاصيل الهادئة، والبحث الأسرع عن ما يناسبك.
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-4">
          <Link
            to="/products"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-[#173A2D] px-7 text-[11px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#214C3B] hover:shadow-[0_16px_38px_rgba(23,58,45,.22)]"
          >
            تسوق الآن
            <ArrowLeft size={15} weight="bold" />
          </Link>
          <Link
            to="/categories"
            className="inline-flex h-12 items-center border-b border-[#B89453]/65 px-1 text-[11px] font-semibold text-[#173A2D] transition-colors hover:text-[#9D7B40]"
          >
            استكشف الأقسام
          </Link>
        </div>
      </div>
    </div>
  </div>
);

const HeroSlider = () => {
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const { data: managedSlides = [], isLoading } = useQuery({
    queryKey: ["genan-home-hero-banners-v1"],
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
  const heroImageWidth = typeof window !== "undefined" && window.innerWidth < 768 ? 720 : 1920;

  return (
    <section dir="rtl" className="w-full bg-[#F8F6F0]">
      <div className="relative overflow-hidden border-b border-[#DED9CB]">
        {slides.length > 0 ? (
          <Swiper
            modules={[Autoplay]}
            onSwiper={(swiper) => { swiperRef.current = swiper; }}
            onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
            autoplay={{ delay: 5600, disableOnInteraction: false, pauseOnMouseEnter: true }}
            speed={760}
            loop={slides.length > 1}
            className="w-full"
          >
            {slides.map((slide, index) => (
              <SwiperSlide key={`${slide.image}-${index}`}>
                <div className="relative h-[430px] w-full overflow-hidden bg-[#E9E5DB] sm:h-[500px] md:h-[610px] lg:h-[660px]">
                  <img
                    src={optimizeImage(slide.image, heroImageWidth, index === 0 ? 82 : 76)}
                    alt={slide.title || "Genan"}
                    loading={index === 0 ? "eager" : "lazy"}
                    decoding="async"
                    fetchPriority={index === 0 ? "high" : "low"}
                    width={heroImageWidth}
                    height={1000}
                    onError={handleImageError}
                    className="absolute inset-0 h-full w-full object-cover"
                    style={{ objectPosition: `${slide.imagePositionX}% ${slide.imagePositionY}%`, transform: `scale(${slide.imageZoom})` }}
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(15,35,27,.08)_0%,rgba(15,35,27,.08)_36%,rgba(244,241,232,.35)_58%,rgba(244,241,232,.94)_82%,rgba(244,241,232,.98)_100%)]" />
                  <div className="absolute inset-0 flex items-center">
                    <div className="mr-[6vw] w-[72%] max-w-[600px] sm:w-[58%] md:w-[42%]">
                      <div className="mb-4 flex items-center gap-3">
                        <span className="h-px w-8 bg-[#B89453]" />
                        <span className="text-[8px] font-semibold tracking-[0.3em] text-[#9D7B40] md:text-[10px]">GENAN EDIT</span>
                      </div>
                      <h1 className="text-[30px] font-medium leading-[1.5] tracking-[-0.035em] text-[#173A2D] sm:text-[38px] md:text-[56px] lg:text-[66px]">
                        {slide.title}
                      </h1>
                      {slide.desc && (
                        <p className="mt-4 max-w-[460px] text-[11px] leading-7 text-[#5F685F] md:text-[14px] md:leading-8">{slide.desc}</p>
                      )}
                      <div className="mt-7 flex items-center gap-5">
                        <Link to={slide.link} className="inline-flex h-12 items-center gap-2 rounded-full bg-[#173A2D] px-7 text-[11px] font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#214C3B]">
                          {slide.cta}
                          <ArrowLeft size={15} weight="bold" />
                        </Link>
                        <Link to="/products" className="hidden border-b border-[#B89453]/65 pb-1 text-[11px] font-semibold text-[#173A2D] md:inline-flex">
                          جميع المنتجات
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        ) : isLoading ? (
          <div className="h-[430px] animate-pulse bg-[#EEEAE0] sm:h-[500px] md:h-[610px]" />
        ) : (
          <FallbackHero />
        )}

        {!isLoading && slides.length > 1 && (
          <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                type="button"
                aria-label={`الانتقال إلى العرض ${index + 1}`}
                onClick={() => swiperRef.current?.slideToLoop(index)}
                className={`h-[2px] rounded-full transition-all duration-300 ${activeIndex === index ? "w-12 bg-[#173A2D]" : "w-5 bg-white/75"}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default HeroSlider;

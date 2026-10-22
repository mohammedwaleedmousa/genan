import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isBannerCurrentlyVisible } from "@/lib/bannerSchedule";
import { optimizeImage } from "@/lib/imageUrl";

type HeroItem = {
  image_url: string;
  title_ar?: string | null;
  subtitle_ar?: string | null;
  cta_text_ar?: string | null;
  cta_link?: string | null;
  image_zoom?: number | null;
  image_position_x?: number | null;
  image_position_y?: number | null;
};

const fallbackSlides: HeroItem[] = [
  {
    image_url: "https://images.pexels.com/photos/9142805/pexels-photo-9142805.jpeg?auto=compress&cs=tinysrgb&w=1800",
    title_ar: "جمال يتجاوز الزمن",
    subtitle_ar: "إطلالات وتفاصيل تعكس قوتك .. بأناقة عصرية",
    cta_text_ar: "تسوقي الآن",
    cta_link: "/products",
  },
  {
    image_url: "https://images.pexels.com/photos/8989866/pexels-photo-8989866.jpeg?auto=compress&cs=tinysrgb&w=1800",
    title_ar: "خطوات نحو الأناقة",
    subtitle_ar: "اختيارات استثنائية لكل يوم",
    cta_text_ar: "اكتشفي المجموعة",
    cta_link: "/products",
  },
  {
    image_url: "https://images.pexels.com/photos/769733/pexels-photo-769733.jpeg?auto=compress&cs=tinysrgb&w=1800",
    title_ar: "تفاصيل تصنع الفرق",
    subtitle_ar: "من التفاصيل الصغيرة تبدأ الحكاية",
    cta_text_ar: "تصفحي الأقسام",
    cta_link: "/categories",
  },
];

const HeroSlider = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { data: banners = [] } = useQuery({
    queryKey: ["genan-reference-banners-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("banners")
        .select("image_url,title_ar,subtitle_ar,cta_text_ar,cta_link,page_slug,image_zoom,image_position_x,image_position_y,starts_at,ends_at,title,sort_order")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(12);
      if (error) throw error;
      return (data || []).filter((item) =>
        Boolean(item.image_url) &&
        !String(item.page_slug || "").startsWith("home-editorial") &&
        item.title !== "Between products banner" &&
        isBannerCurrentlyVisible(item),
      ) as HeroItem[];
    },
    staleTime: 10 * 60 * 1000,
  });
  const slides = banners.length ? banners.slice(0, 3) : fallbackSlides;
  const currentIndex = activeIndex % slides.length;
  const slide = slides[currentIndex];
  const img = slide.image_url.startsWith("/") ? slide.image_url : optimizeImage(slide.image_url, 1800, 86);
  const previous = () => setActiveIndex((index) => (index + slides.length - 1) % slides.length);
  const next = () => setActiveIndex((index) => (index + 1) % slides.length);

  return (
    <section className="genan-ref-hero" aria-label="المجموعة الرئيسية" dir="rtl">
      <div className="genan-ref-hero-visual">
        <img
          src={img}
          alt={slide.title_ar || "إطلالات جنان"}
          fetchPriority="high"
          decoding="async"
          className="genan-ref-hero-img"
          style={{
            objectPosition: `${Number(slide.image_position_x ?? 45)}% ${Number(slide.image_position_y ?? 35)}%`,
            transform: `scale(${Number(slide.image_zoom ?? 1)})`,
          }}
        />
        <div className="genan-ref-hero-overlay" />
      </div>

      <div className="genan-ref-hero-heading">
        <p className="genan-ref-small-heading">مجموعة جديدة</p>
        <h1>{slide.title_ar || "جمال يتجاوز الزمن"}</h1>
        <p className="genan-ref-hero-caption">
          {slide.subtitle_ar || "إطلالات وتفاصيل تعكس قوتك .. بأناقة عصرية"}
        </p>
        <Link to={slide.cta_link || "/products"} className="genan-ref-outline-button">
          <span>{slide.cta_text_ar || "تسوقي الآن"}</span>
          <span className="genan-ref-button-circle"><ArrowLeft aria-hidden="true" size={17} /></span>
        </Link>
      </div>

      <div className="genan-ref-hero-side" dir="ltr">
        <div className="genan-ref-side-wordmark">GENAN</div>
        <p>MORE<br />THAN<br />A LOOK</p>
        <div className="genan-ref-side-rule" aria-hidden="true" />
        <div className="genan-ref-slide-labels" aria-label="اختر صورة المجموعة">
          {slides.map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-current={currentIndex === index ? "true" : undefined}
              aria-label={`الصورة ${index + 1}`}
            >{String(index + 1).padStart(2, "0")}</button>
          ))}
        </div>
        <div className="genan-ref-slider-arrows">
          <button type="button" onClick={previous} aria-label="الصورة السابقة"><ChevronLeft size={16} /></button>
          <button type="button" onClick={next} aria-label="الصورة التالية"><ChevronRight size={16} /></button>
        </div>
      </div>
    </section>
  );
};

export default HeroSlider;

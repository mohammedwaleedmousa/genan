import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { isBannerCurrentlyVisible } from "@/lib/bannerSchedule";
import { optimizeImage } from "@/lib/imageUrl";

type HomeBanner = {
  image_url: string;
  title_ar?: string | null;
  subtitle_ar?: string | null;
  cta_text_ar?: string | null;
  cta_link?: string | null;
  image_zoom?: number | null;
  image_position_x?: number | null;
  image_position_y?: number | null;
};

const fallbackBanners: HomeBanner[] = [
  {
    image_url: "https://images.pexels.com/photos/9142805/pexels-photo-9142805.jpeg?auto=compress&cs=tinysrgb&w=1800",
    title_ar: "أناقة تحكي حكايتك",
    subtitle_ar: "قطع مختارة لتمنح كل إطلالة تفاصيل لا تُنسى.",
    cta_text_ar: "اكتشفي التشكيلة",
    cta_link: "/products",
  },
  {
    image_url: "https://images.pexels.com/photos/8989866/pexels-photo-8989866.jpeg?auto=compress&cs=tinysrgb&w=1800",
    title_ar: "تفاصيل تُشبهك",
    subtitle_ar: "من الحقائب إلى الإكسسوارات، اختيارات تعكس أسلوبك الخاص.",
    cta_text_ar: "تسوقي الجديد",
    cta_link: "/new-arrivals",
  },
  {
    image_url: "https://images.pexels.com/photos/769733/pexels-photo-769733.jpeg?auto=compress&cs=tinysrgb&w=1800",
    title_ar: "اختيارات مختلفة",
    subtitle_ar: "أزياء وأحذية وإكسسوارات بلمسة عصرية.",
    cta_text_ar: "تصفحي الأقسام",
    cta_link: "/categories",
  },
];

const GenanHomeHero = () => {
  const [active, setActive] = useState(0);
  const { data: banners = [] } = useQuery({
    queryKey: ["genan-editorial-home-banners-v3"],
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
      ) as HomeBanner[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const slides = banners.length ? banners.slice(0, 3) : fallbackBanners;
  const index = active % slides.length;
  const slide = slides[index];
  const imageUrl = slide.image_url.startsWith("/")
    ? slide.image_url
    : optimizeImage(slide.image_url, 1700, 85);

  return (
    <section className="genan-v3-hero" aria-roledescription="عارض صور" aria-label="مجموعة جنان الرئيسية">
      <div className="genan-v3-hero-copy">
        <span className="genan-v3-eyebrow"><span className="genan-v3-eyebrow-line" /> GENAN / THE EDIT</span>
        <span className="genan-v3-hero-seal">مساحة لاكتشاف الأناقة</span>
        <h1>{slide.title_ar || "أناقة تحكي حكايتك"}</h1>
        <p className="genan-v3-hero-subtitle">{slide.subtitle_ar || "قطع مختارة لتمنح كل إطلالة تفاصيل لا تُنسى."}</p>
        <div className="genan-v3-hero-actions">
          <Link className="genan-v3-btn genan-v3-btn-dark" to={slide.cta_link || "/products"}>
            {slide.cta_text_ar || "اكتشفي التشكيلة"}
            <ArrowUpLeft size={18} strokeWidth={1.6} aria-hidden="true" />
          </Link>
          <Link className="genan-v3-text-link" to="/brands">
            استكشفي الماركات
            <ArrowLeft size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="genan-v3-hero-footnote">
          <span className="genan-v3-line-dot" aria-hidden="true" />
          <span>حقائب · ملابس · أحذية · إكسسوارات</span>
        </div>
      </div>

      <div className="genan-v3-hero-visual">
        <div className="genan-v3-hero-image-frame">
          <img
            key={imageUrl}
            className="genan-v3-hero-image"
            src={imageUrl}
            alt={slide.title_ar || "أزياء وإكسسوارات من جنان"}
            decoding="async"
            fetchPriority="high"
            style={{
              objectPosition: `${Number(slide.image_position_x ?? 45)}% ${Number(slide.image_position_y ?? 35)}%`,
              transform: `scale(${Number(slide.image_zoom ?? 1)})`,
            }}
          />
          <div className="genan-v3-hero-image-wash" aria-hidden="true" />
          <span className="genan-v3-hero-photo-tag" dir="ltr">THE GENAN SELECTION</span>
        </div>
        <div className="genan-v3-hero-turquoise" aria-hidden="true" />
        <div className="genan-v3-hero-controls" aria-label="التحكم بصور الواجهة">
          <div className="genan-v3-slide-indicators">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`عرض الصورة ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
                className={i === index ? "is-current" : ""}
              >
                <span />
              </button>
            ))}
          </div>
          <span className="genan-v3-slide-count" dir="ltr">
            {String(index + 1).padStart(2, "0")} <span>/</span> {String(slides.length).padStart(2, "0")}
          </span>
          <div className="genan-v3-slide-arrows">
            <button type="button" aria-label="الصورة السابقة" onClick={() => setActive((v) => (v + slides.length - 1) % slides.length)}>
              <ChevronRight size={20} aria-hidden="true" />
            </button>
            <button type="button" aria-label="الصورة التالية" onClick={() => setActive((v) => (v + 1) % slides.length)}>
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GenanHomeHero;

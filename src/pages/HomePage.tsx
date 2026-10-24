import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpLeft, Headphones, ShieldCheck, Truck } from "lucide-react";

import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import GenanHomeHero from "@/components/GenanHomeHero";
import ProductCard from "@/components/ProductCard";
import Footer from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CARD_SELECT, mapProductCard } from "@/lib/productCardData";
import { optimizeImage } from "@/lib/imageUrl";
import "@/styles/genanHomeV3.css";

type HomeCategory = {
  id: string;
  slug: string;
  name_ar: string;
  name: string;
  image_url: string | null;
};

const categoryPlaceholders = [
  {
    title: "الحقائب",
    caption: "BAGS",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=82",
  },
  {
    title: "الملابس",
    caption: "FASHION",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=900&q=82",
  },
  {
    title: "الأحذية",
    caption: "SHOES",
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=900&q=82",
  },
  {
    title: "الإكسسوارات",
    caption: "ACCESSORIES",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=900&q=82",
  },
] as const;

const HomePage = () => {
  const {
    data: featured = [],
    isLoading: featuredLoading,
    isError: featuredError,
    refetch: refetchFeatured,
  } = useQuery({
    queryKey: ["genan-v3-featured-products"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("is_active", true)
        .eq("in_stock", true)
        .order("sort_order", { ascending: true })
        .limit(8);
      if (error) throw error;
      return (data || []).map(mapProductCard);
    },
    staleTime: 3 * 60 * 1000,
  });

  const {
    data: demoPreview = [],
    isLoading: demoLoading,
    isError: demoError,
    refetch: refetchDemo,
  } = useQuery({
    queryKey: ["genan-v3-demo-preview"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("is_active", true)
        .like("slug", "genan-demo-20261022-%")
        .order("sort_order", { ascending: true })
        .limit(8);
      if (error) throw error;
      return (data || []).map(mapProductCard);
    },
    staleTime: 2 * 60 * 1000,
    enabled: featured.length === 0 && !featuredLoading && !featuredError,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["genan-v3-home-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,slug,name_ar,name,image_url")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order", { ascending: true })
        .limit(4);
      if (error) throw error;
      return (data || []) as HomeCategory[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const products = featured.length ? featured : demoPreview;
  const displayingDemo = featured.length === 0 && demoPreview.length > 0;
  const loading = featuredLoading || (featured.length === 0 && !featuredError && demoLoading);
  const error = featuredError || (featured.length === 0 && demoError);

  const categoryCards = categories.length
    ? categories.map((category, i) => ({
        id: category.id,
        title: category.name_ar || category.name,
        caption: category.name,
        image: category.image_url ? optimizeImage(category.image_url, 800, 82) : categoryPlaceholders[i % categoryPlaceholders.length].image,
        to: `/products?category=${encodeURIComponent(category.slug)}`,
      }))
    : categoryPlaceholders.map((item, i) => ({ ...item, id: `preview-${i}`, to: "/categories" }));

  return (
    <div className="genan-v3-page" dir="rtl">
      <Navbar />
      <CartDrawer />

      <main id="main-content" className="genan-v3-main">
        <div className="genan-v3-topline">
          <span dir="ltr">GENAN / CURATED STYLE</span>
          <span>تفاصيل مختارة لأناقة كل يوم</span>
          <Link to="/new-arrivals">شاهدي الجديد <ArrowLeft size={13} aria-hidden="true" /></Link>
        </div>

        <GenanHomeHero />

        <section className="genan-v3-categories genan-v3-container" aria-labelledby="genan-v3-categories-title">
          <div className="genan-v3-section-heading">
            <div>
              <span className="genan-v3-section-index" dir="ltr">01 / DISCOVER</span>
              <h2 id="genan-v3-categories-title">عالم جنان، بأسلوبك</h2>
              <p>من القطعة الأساسية إلى التفاصيل التي تكمل إطلالتك.</p>
            </div>
            <Link className="genan-v3-arrow-link" to="/categories">كل الأقسام <ArrowUpLeft size={17} aria-hidden="true" /></Link>
          </div>
          <div className="genan-v3-category-grid">
            {categoryCards.map((category, index) => (
              <Link to={category.to} className="genan-v3-category-card" key={category.id}>
                <div className="genan-v3-category-photo">
                  <img src={category.image} alt={category.title} loading="lazy" decoding="async" />
                  <span className="genan-v3-category-count" dir="ltr">{String(index + 1).padStart(2, "0")}</span>
                  <span className="genan-v3-category-icon"><ArrowUpLeft size={19} strokeWidth={1.5} aria-hidden="true" /></span>
                </div>
                <div className="genan-v3-category-info">
                  <h3>{category.title}</h3>
                  <span dir="ltr">{category.caption}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        <section className="genan-v3-products" aria-labelledby="genan-v3-products-title">
          <div className="genan-v3-container">
            <div className="genan-v3-section-heading">
              <div>
                <span className="genan-v3-section-index" dir="ltr">02 / THE SELECTION</span>
                <h2 id="genan-v3-products-title">اختيارات تستحق الاكتشاف</h2>
                <p>{displayingDemo ? "منتجات تجريبية للمعاينة فقط — ليست متاحة للشراء" : "تشكيلة مختارة من عالم الموضة والإكسسوارات."}</p>
              </div>
              <Link className="genan-v3-arrow-link" to="/products">تسوقي كل المنتجات <ArrowUpLeft size={17} aria-hidden="true" /></Link>
            </div>

            {products.length > 0 ? (
              <div className="genan-v3-products-grid">
                {products.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            ) : loading ? (
              <div className="genan-v3-products-grid" role="status" aria-label="جار تحميل المنتجات">
                {Array.from({ length: 4 }, (_, i) => <div className="genan-v3-product-skeleton" key={i} />)}
              </div>
            ) : (
              <div className="genan-v3-empty">
                <span className="genan-v3-empty-mark" dir="ltr">G.</span>
                <h3>{error ? "تعذّر تحميل التشكيلة" : "تشكيلتنا قيد التجهيز"}</h3>
                <p>{error ? "يرجى المحاولة مرة أخرى لعرض المنتجات." : "ترقّبي قطعًا جديدة تُضاف إلى عالم جنان."}</p>
                {error ? (
                  <button type="button" onClick={() => { void refetchFeatured(); void refetchDemo(); }} className="genan-v3-btn genan-v3-btn-dark">إعادة المحاولة</button>
                ) : (
                  <Link to="/categories" className="genan-v3-btn genan-v3-btn-dark">تصفحي الأقسام <ArrowLeft size={16} aria-hidden="true" /></Link>
                )}
              </div>
            )}
            <div className="genan-v3-products-bottom">
              <Link to="/products">اكتشفي المزيد من جنان <ArrowLeft size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <section className="genan-v3-story genan-v3-container" aria-labelledby="genan-v3-story-title">
          <div className="genan-v3-story-content">
            <div className="genan-v3-story-label" dir="ltr">THE GENAN POINT OF VIEW</div>
            <span className="genan-v3-story-rule" aria-hidden="true" />
            <h2 id="genan-v3-story-title">الأناقة ليست تفصيلًا عابرًا.</h2>
            <p>هي اختياراتك التي تعبّر عنك. في جنان، نمنح القطع المميزة مساحة لتتألق بطريقتك الخاصة.</p>
            <Link className="genan-v3-btn genan-v3-btn-gold" to="/store-info#about">
              اكتشفي جنان <ArrowUpLeft size={18} aria-hidden="true" />
            </Link>
            <div className="genan-v3-story-signature" dir="ltr">GENAN</div>
          </div>
          <div className="genan-v3-story-image">
            <img
              src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1350&q=85"
              alt="مجموعة أزياء بتنسيقات هادئة"
              loading="lazy"
              decoding="async"
            />
            <span dir="ltr">STYLE IS PERSONAL.</span>
          </div>
        </section>

        <section className="genan-v3-edits genan-v3-container" aria-labelledby="genan-v3-edits-title">
          <div className="genan-v3-section-heading">
            <div>
              <span className="genan-v3-section-index" dir="ltr">03 / EXPLORE MORE</span>
              <h2 id="genan-v3-edits-title">وجهاتك القادمة</h2>
              <p>مساحتان لاكتشاف المزيد من الاختيارات.</p>
            </div>
          </div>
          <div className="genan-v3-edits-grid">
            <Link className="genan-v3-edit-card genan-v3-edit-card--new" to="/new-arrivals">
              <img src="https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1300&q=82" loading="lazy" decoding="async" alt="إطلالة أزياء حديثة" />
              <span className="genan-v3-edit-wash" aria-hidden="true" />
              <span className="genan-v3-edit-type" dir="ltr">JUST LANDED</span>
              <span className="genan-v3-edit-bottom"><span><strong>وصل حديثًا</strong><small>جديد عالم جنان</small></span><ArrowUpLeft size={22} aria-hidden="true" /></span>
            </Link>
            <Link className="genan-v3-edit-card genan-v3-edit-card--brands" to="/brands">
              <img src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1300&q=82" loading="lazy" decoding="async" alt="حقائب بتصاميم متنوعة" />
              <span className="genan-v3-edit-wash" aria-hidden="true" />
              <span className="genan-v3-edit-type" dir="ltr">THE BRAND EDIT</span>
              <span className="genan-v3-edit-bottom"><span><strong>عالم الماركات</strong><small>اكتشفي تشكيلات متنوعة</small></span><ArrowUpLeft size={22} aria-hidden="true" /></span>
            </Link>
          </div>
        </section>

        <section className="genan-v3-services" aria-label="خدمات بوتيك جنان">
          <div className="genan-v3-container genan-v3-services-grid">
            {[
              { icon: Headphones, title: "نحن معك", detail: "تواصلي معنا للاستفسار عن طلباتك." },
              { icon: ShieldCheck, title: "خصوصيتك تهمّنا", detail: "تعرّفي على سياسة الخصوصية." },
              { icon: Truck, title: "الشحن والتوصيل", detail: "التفاصيل المتاحة تظهر عند الطلب." },
            ].map(({ icon: Icon, title, detail }) => (
              <div className="genan-v3-service" key={title}>
                <span className="genan-v3-service-icon"><Icon size={24} strokeWidth={1.35} aria-hidden="true" /></span>
                <div><h3>{title}</h3><p>{detail}</p></div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;

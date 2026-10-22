import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, BadgeCheck, Boxes, Flame, Gem, Headphones, Package, ShieldCheck, Shirt, ShoppingBag, Truck } from "lucide-react";

import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import ReferenceFooter from "@/components/ReferenceFooter";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CARD_SELECT, mapProductCard } from "@/lib/productCardData";
import "@/styles/genanReference.css";

const categories = [
  { title: "أفكار وأناقة", caption: "GENAN IDEAS", to: "/categories", icon: Flame },
  { title: "الإكسسوارات", caption: "ACCESSORIES", to: "/categories", icon: ShoppingBag },
  { title: "الإطلالات اليومية", caption: "EVERYDAY EDIT", to: "/new-arrivals", icon: Shirt },
  { title: "المجموعات الخاصة", caption: "SPECIAL COLLECTIONS", to: "/products", icon: Gem },
  { title: "العبايات", caption: "GENAN COLLECTION", to: "/products", icon: Boxes, featured: true },
] as const;

const productSelect = PRODUCT_CARD_SELECT;

const HomePage = () => {
  const {
    data: featured = [],
    isLoading: featuredLoading,
    isError: featuredError,
    refetch: refetchFeatured,
  } = useQuery({
    queryKey: ["genan-reference-popular-products-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(productSelect)
        .eq("is_active", true)
        .eq("in_stock", true)
        .order("sort_order", { ascending: true })
        .limit(4);
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
    queryKey: ["genan-reference-demo-products-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(productSelect)
        .eq("is_active", true)
        .like("slug", "genan-demo-20261022-%")
        .order("sort_order", { ascending: true })
        .limit(4);
      if (error) throw error;
      return (data || []).map(mapProductCard);
    },
    staleTime: 2 * 60 * 1000,
  });

  const products = featured.length > 0 ? featured : demoPreview;
  const displayingDemo = featured.length === 0 && demoPreview.length > 0;
  const loading = featuredLoading || demoLoading;
  const error = featuredError || demoError;

  return (
    <div className="genan-reference-page" dir="rtl">
      <div className="genan-reference-shell">
        <Navbar variant="editorial" />
        <CartDrawer />
        <main id="main-content" className="genan-ref-main">
          <div className="genan-ref-hero-composition">
            <HeroSlider />
            <nav aria-label="مجموعات جنان" className="genan-ref-category-ribbon">
              {categories.map(({ title, caption, to, icon: Icon, ...rest }) => (
                <Link
                  to={to}
                  key={title}
                  className={`genan-ref-category-tile ${"featured" in rest && rest.featured ? "is-featured" : ""}`}
                >
                  {"featured" in rest && rest.featured && (
                    <img src="https://images.pexels.com/photos/9142805/pexels-photo-9142805.jpeg?auto=compress&cs=tinysrgb&w=250" alt="" className="genan-ref-category-feature-image" loading="lazy" />
                  )}
                  <Icon className="genan-ref-category-icon" aria-hidden="true" size={25} strokeWidth={1.35} />
                  <span className="genan-ref-category-name">{title}</span>
                  <span className="genan-ref-category-caption">{caption}</span>
                  {"featured" in rest && rest.featured && <span className="genan-ref-category-arrow"><ArrowLeft size={15} /></span>}
                </Link>
              ))}
            </nav>
          </div>

          <section className="genan-ref-popular" aria-labelledby="genan-popular-heading">
            <div className="genan-ref-section-heading">
              <div>
                <h2 id="genan-popular-heading">الأكثر رواجًا</h2>
                <p>{displayingDemo ? "معاينة منتجات تجريبية — الأسعار والمخزون للعرض فقط، وليست متاحة للشراء" : "قطع مختارة بعناية .. لترافقك في كل لحظة"}</p>
              </div>
              <Link to="/products" className="genan-ref-view-all">عرض الكل <ArrowLeft size={16} aria-hidden="true" /></Link>
            </div>
            {products.length > 0 ? (
              <div className="genan-ref-products-grid">
                {products.map((product, index) => <ProductCard product={product} index={index} key={product.id} />)}
              </div>
            ) : loading ? (
              <div className="genan-ref-products-grid" aria-label="جار تحميل المنتجات" role="status">
                {[0, 1, 2, 3].map((x) => <div className="genan-ref-product-skeleton" key={x} />)}
              </div>
            ) : (
              <div className="genan-ref-empty-state">
                <h3>{error ? "تعذّر عرض المنتجات حاليًا" : "تشكيلتنا قيد التجهيز"}</h3>
                <p>{error ? "يرجى التحقق من اتصال الإنترنت والمحاولة مجددًا" : "تصفحي الأقسام إلى حين إضافة التشكيلة الجديدة"}</p>
                {error ? <button onClick={() => { void refetchFeatured(); void refetchDemo(); }} type="button">إعادة المحاولة</button> : <Link to="/categories">عرض الأقسام</Link>}
              </div>
            )}
          </section>

          <section className="genan-ref-collection" aria-label="مجموعة جديدة">
            <div className="genan-ref-collection-photo" aria-hidden="true" />
            <div className="genan-ref-collection-shade" />
            <div className="genan-ref-collection-copy">
              <p>مجموعة جديدة</p>
              <h2>خطوات<br />أعمق</h2>
              <span>إلهام من الأرض .. بإطلالة نحو المستقبل</span>
              <Link to="/products" className="genan-ref-outline-button">
                اكتشفي المجموعة <span className="genan-ref-button-circle"><ArrowLeft size={16} /></span>
              </Link>
            </div>
            <div className="genan-ref-collection-mark" dir="ltr">
              <strong>GENAN</strong>
              <span>ROOTED<br />IN HER<br />EVOLVING</span>
              <small>01 &nbsp; ━ &nbsp; 02 &nbsp; 03</small>
            </div>
          </section>

          <section className="genan-ref-details" aria-label="تفاصيل جنان">
            <div className="genan-ref-detail-intro">
              <div className="genan-ref-detail-portrait" aria-hidden="true" />
              <div className="genan-ref-detail-intro-copy">
                <h2>تفاصيل تصنع الفرق</h2>
                <p>من الأقمشة الفاخرة إلى التفاصيل الدقيقة ..<br />كل قطعة من جنان تحكي قصة</p>
                <Link className="genan-ref-outline-button" to="/products">
                  اكتشفي المزيد <span className="genan-ref-button-circle"><ArrowLeft size={15} /></span>
                </Link>
              </div>
            </div>
            <Link to="/products" className="genan-ref-detail-tile is-fabric"><span>أقمشة فاخرة</span></Link>
            <Link to="/products" className="genan-ref-detail-tile is-embroidery"><span>حرفية عربية</span></Link>
            <Link to="/products" className="genan-ref-detail-tile is-design"><span>تصاميم عصرية</span></Link>
          </section>

          <section className="genan-ref-services" aria-label="خدمات جنان">
            {[
              { icon: Headphones, title: "خدمة عملاء مميزة", detail: "دائمًا معك" },
              { icon: ShieldCheck, title: "الخصوصية أولًا", detail: "حماية معلوماتك" },
              { icon: Package, title: "خيارات دفع متنوعة", detail: "بحسب المتاح في منطقتك" },
              { icon: Truck, title: "خيارات توصيل", detail: "تُعرض عند إتمام الطلب" },
            ].map(({ icon: Icon, title, detail }) => (
              <div className="genan-ref-service" key={title}>
                <Icon size={27} strokeWidth={1.35} aria-hidden="true" />
                <span><strong>{title}</strong><small>{detail}</small></span>
              </div>
            ))}
          </section>
        </main>
        <ReferenceFooter />
      </div>
    </div>
  );
};

export default HomePage;

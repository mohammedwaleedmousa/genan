import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpLeft, Headphones, Package, ShieldCheck, Sparkles, Truck } from "lucide-react";

import Navbar from "@/components/Navbar";
import EditorialFooter from "@/components/EditorialFooter";
import EditorialMobileNav from "@/components/EditorialMobileNav";
import CartDrawer from "@/components/CartDrawer";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CARD_SELECT, mapProductCard } from "@/lib/productCardData";
import { optimizeImage } from "@/lib/imageUrl";
import "@/styles/genanEditorial.css";

type Category = {
  id: string;
  slug: string;
  name: string;
  name_ar: string;
  image_url: string | null;
};

type Brand = {
  id: string;
  name: string;
  slug: string | null;
};

function SectionTitle({
  eyebrow,
  title,
  description,
  to,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  to?: string;
}) {
  return (
    <div className="genan-section-heading mb-7 flex flex-wrap items-end justify-between gap-4 md:mb-10">
      <div>
        <span className="mb-2 block text-[10px] font-medium uppercase tracking-[.28em] text-[#B2C7B4]" dir="ltr">
          {eyebrow}
        </span>
        <h2 className="text-2xl font-medium leading-tight text-[#F5F3EC] md:text-[40px]">{title}</h2>
        {description && <p className="mt-3 max-w-xl text-[13px] leading-7 text-[#B8B9B2]">{description}</p>}
      </div>
      {to && (
        <Link
          to={to}
          className="genan-text-link inline-flex min-h-11 items-center gap-3 text-[13px] text-[#E5EBDF] transition-colors hover:text-white"
        >
          عرض الكل <ArrowLeft className="h-4 w-4" strokeWidth={1.6} />
        </Link>
      )}
    </div>
  );
}

const HomePage = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["genan-emerald-categories-v1"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,slug,name,name_ar,image_url")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order", { ascending: true })
        .limit(8);
      if (error) throw error;
      return (data || []) as Category[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: featured = [], isLoading: featuredLoading, isError: featuredError, refetch: refetchFeatured } = useQuery({
    queryKey: ["genan-emerald-featured-v1"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("is_active", true)
        .eq("in_stock", true)
        .eq("is_featured", true)
        .order("sort_order", { ascending: true })
        .limit(8);
      if (error) throw error;
      return (data || []).map(mapProductCard);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: demoPreview = [], isLoading: demoLoading, isError: demoError, refetch: refetchDemo } = useQuery({
    queryKey: ["genan-emerald-demo-preview-v1"],
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
  });

  const { data: best = [] } = useQuery({
    queryKey: ["genan-emerald-bestsellers-v1"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("is_active", true)
        .eq("in_stock", true)
        .eq("is_best_seller", true)
        .order("sort_order", { ascending: true })
        .limit(4);
      if (error) throw error;
      return (data || []).map(mapProductCard);
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: brands = [] } = useQuery({
    queryKey: ["genan-emerald-brands-v1"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id,name,slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(10);
      if (error) throw error;
      return (data || []) as Brand[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const collection = featured.length > 0 ? featured : demoPreview;
  const showingDemo = featured.length === 0 && demoPreview.length > 0;
  const collectionBusy = featuredLoading || demoLoading;
  const collectionFailed = featuredError || demoError;

  return (
    <div className="genan-editorial-home min-h-screen text-[#F5F4EF]" dir="rtl">
      <Navbar variant="editorial" />
      <CartDrawer />
      <EditorialMobileNav />

      <main id="main-content" className="overflow-hidden">
        <HeroSlider />

        {categories.length > 0 && (
          <section className="genan-category-overlap relative z-20 mx-auto max-w-[1510px] px-4 sm:px-7 lg:px-11" aria-label="تسوق حسب القسم">
            <div className="genan-category-dock rounded-[22px] border border-white/25 p-2 shadow-[0_20px_60px_rgba(0,0,0,.24)] backdrop-blur-2xl md:rounded-[27px] md:p-3">
              <div className="genan-category-scroll flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {categories.map((category, index) => (
                  <Link
                    key={category.id}
                    to={`/products?category=${encodeURIComponent(category.slug)}`}
                    className={`genan-category-chip group flex min-w-[116px] flex-1 items-center gap-2 rounded-[15px] border p-2 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#C2D8C5]/70 sm:min-w-[160px] md:min-h-[78px] md:p-3 ${index === 0 ? "genan-category-chip-first" : ""}`}
                  >
                    <span className="genan-category-thumb relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#D7D4C8]/30 md:h-12 md:w-12">
                      {category.image_url ? (
                        <img
                          src={category.image_url.startsWith("/") ? category.image_url : optimizeImage(category.image_url, 240, 75)}
                          alt=""
                          loading={index < 3 ? "eager" : "lazy"}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <Sparkles aria-hidden="true" className="h-5 w-5 text-[#486858]" />
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-semibold sm:text-[12px]">{category.name_ar || category.name}</span>
                      <span className="mt-0.5 hidden truncate text-[8px] tracking-widest opacity-50 sm:block" dir="ltr">{category.name}</span>
                    </span>
                    <ArrowUpLeft className="hidden h-3.5 w-3.5 shrink-0 opacity-60 transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 lg:block" />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="genan-products-section mx-auto max-w-[1520px] px-4 pb-12 pt-14 sm:px-7 md:pb-24 md:pt-24 lg:px-11" aria-label="مختارات جنان">
          <SectionTitle
            eyebrow="GENAN / CURATED SELECTION"
            title={showingDemo ? "اكتشف عالم جنان" : "مختارات جنان"}
            description={showingDemo
              ? "معاينة بصرية لمنتجات تجريبية لا تتوفر للشراء. التفاصيل والأسعار الحالية لأغراض اختبار المتجر فقط."
              : "قطع مختارة بعناية لترافقك في تفاصيل كل يوم."}
            to="/products"
          />

          {collection.length > 0 ? (
            <div className="genan-editorial-product-grid grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-5 lg:gap-6">
              {collection.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          ) : collectionBusy ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-6" aria-label="جاري تحميل المنتجات" role="status">
              {[0, 1, 2, 3].map((index) => <div key={index} className="aspect-[3/4] animate-pulse rounded-2xl bg-white/10" />)}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-14 text-center">
              <p className="text-xl font-medium text-white">{collectionFailed ? "تعذر تحميل المجموعة" : "مجموعتنا قيد التجهيز"}</p>
              <p className="mt-3 text-[13px] text-white/60">
                {collectionFailed ? "تحقق من الاتصال، ثم أعد المحاولة." : "استكشف التصنيفات بينما نجهز المزيد من القطع."}
              </p>
              {collectionFailed ? (
                <button onClick={() => { void refetchFeatured(); void refetchDemo(); }} type="button" className="mt-6 min-h-11 rounded-full border border-white/30 px-6 text-sm text-white hover:bg-white/10">
                  إعادة المحاولة
                </button>
              ) : (
                <Link to="/categories" className="mt-6 inline-flex min-h-11 items-center rounded-full border border-white/30 px-6 text-sm text-white hover:bg-white/10">تصفح الأقسام</Link>
              )}
            </div>
          )}
        </section>

        <section className="genan-story-section mx-auto max-w-[1540px] px-4 pb-8 sm:px-7 md:pb-20 lg:px-8" aria-label="فلسفة جنان">
          <div className="genan-story-card relative isolate grid min-h-[360px] items-end overflow-hidden rounded-[24px] border border-white/15 bg-[#17221F] md:min-h-[480px] md:grid-cols-[.95fr_1.05fr] md:rounded-[32px]">
            <div className="genan-story-image absolute inset-0 md:inset-y-0 md:left-0 md:right-auto md:w-[62%]" />
            <div className="genan-story-overlay absolute inset-0" />
            <div className="relative z-10 px-6 pb-12 pt-14 sm:px-10 md:px-16 md:py-14">
              <span className="text-[10px] tracking-[.33em] text-[#B7C8B9]" dir="ltr">GENAN / A DIFFERENT PERSPECTIVE</span>
              <h2 className="mt-5 max-w-[540px] text-[clamp(2.4rem,5vw,4.7rem)] font-medium leading-[1.25] text-white">
                كل تفصيلة...<br />تروي حكاية
              </h2>
              <p className="mt-5 max-w-sm text-[13px] leading-8 text-white/80 sm:text-[15px]">
                نؤمن أن الجمال يكمن في الاختيارات الصغيرة. اكتشف قطعًا تكمل أسلوبك وتمنح أيامك لمسة خاصة.
              </p>
              <Link to="/products" className="mt-7 inline-flex min-h-[48px] items-center gap-3 rounded-full border border-[#C4D7C9]/65 bg-[#0F2922]/50 px-6 text-[13px] text-white backdrop-blur-sm hover:bg-[#1A4536]">
                استكشف التشكيلة <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
            <span aria-hidden="true" className="pointer-events-none absolute bottom-6 left-8 z-10 hidden text-[11px] tracking-[.45em] text-white/50 md:block" dir="ltr">
              ROOTED IN HER · EVOLVING
            </span>
          </div>
        </section>

        <section className="genan-craft-section mx-auto max-w-[1520px] px-4 py-9 sm:px-7 md:py-16 lg:px-11" aria-label="تفاصيل تصنع الفرق">
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <span className="text-[10px] tracking-[.27em] text-[#ADC9BA]" dir="ltr">THE ART OF DETAILS</span>
              <h2 className="mt-3 text-[28px] font-medium text-white md:text-[43px]">تفاصيل تصنع الفرق</h2>
            </div>
            <Link to="/categories" className="genan-text-link inline-flex min-h-11 items-center gap-2 text-[13px] text-[#DFE6DE] hover:text-white">
              استكشف المزيد <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 md:gap-5">
            {[
              { title: "اختيارات مميزة", description: "تصفح منتجات جنان حسب القسم", style: "genan-detail-card-one", to: "/categories", number: "01" },
              { title: "ألوان وتفاصيل", description: "استكشف الخيارات المتاحة لكل قطعة", style: "genan-detail-card-two", to: "/products", number: "02" },
              { title: "أسلوبك الخاص", description: "تشكيلة تتجدد مع كل موسم", style: "genan-detail-card-three", to: "/new-arrivals", number: "03" },
            ].map((item) => (
              <Link key={item.number} to={item.to} className={`genan-detail-card ${item.style} group relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-[20px] border border-white/10 p-6 transition-transform duration-300 hover:-translate-y-1 md:min-h-[250px]`}>
                <span className="text-[11px] tracking-[.25em] text-white/65">{item.number} / GENAN</span>
                <div className="relative z-10">
                  <h3 className="text-2xl font-medium text-white">{item.title}</h3>
                  <p className="mt-2 text-[12px] leading-6 text-white/70">{item.description}</p>
                </div>
                <ArrowUpLeft className="absolute bottom-6 left-6 h-5 w-5 text-[#DAE9DF] transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
              </Link>
            ))}
          </div>
        </section>

        {best.length > 0 && (
          <section className="mx-auto max-w-[1520px] px-4 pb-16 pt-7 sm:px-7 md:pb-24 lg:px-11" aria-label="الأكثر اختيارًا">
            <SectionTitle eyebrow="GENAN / MOST WANTED" title="الأكثر اختيارًا" to="/best-sellers" />
            <div className="genan-editorial-product-grid grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4 md:gap-6">
              {best.map((product, index) => <ProductCard key={product.id} product={product} index={index} />)}
            </div>
          </section>
        )}

        {brands.length > 0 && (
          <section className="mx-auto max-w-[1520px] px-4 pb-16 pt-7 sm:px-7 md:pb-20 lg:px-11" aria-label="ماركات جنان">
            <SectionTitle eyebrow="GENAN / BRANDS" title="الماركات" to="/brands" />
            <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {brands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/brands/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="flex min-h-[82px] min-w-[145px] flex-1 items-center justify-center rounded-[16px] border border-white/15 bg-white/[.045] px-5 text-center text-sm font-semibold tracking-wide text-[#F1EFE8] transition-colors hover:border-[#96B3A1] hover:bg-white/10"
                >
                  {brand.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        <section className="genan-benefits-section mx-auto max-w-[1540px] px-4 py-6 sm:px-7 lg:px-8" aria-label="خدمات المتجر">
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {[
              { icon: Truck, title: "خيارات التوصيل", desc: "تُعرض عند إتمام الطلب" },
              { icon: ShieldCheck, title: "طرق دفع واضحة", desc: "الخيارات المتاحة حسب منطقتك" },
              { icon: Package, title: "معلومات المنتج", desc: "التفاصيل والمقاسات والألوان" },
              { icon: Headphones, title: "تحتاج للمساعدة؟", desc: "تواصل معنا من صفحة المتجر" },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] px-4 py-5">
                <Icon className="h-6 w-6 shrink-0 text-[#B3CDBA]" strokeWidth={1.4} aria-hidden="true" />
                <div>
                  <p className="text-[12px] font-semibold text-white">{title}</p>
                  <p className="mt-1 text-[10px] leading-5 text-white/55">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      <EditorialFooter />
    </div>
  );
};

export default HomePage;

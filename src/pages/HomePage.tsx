import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CARD_SELECT, mapProductCard } from "@/lib/productCardData";
import { optimizeImage } from "@/lib/imageUrl";

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

const categoryDesktopLayout = [
  "md:col-span-5 md:row-span-2",
  "md:col-span-4",
  "md:col-span-3",
  "md:col-span-3",
  "md:col-span-4",
];

const SectionHeader = ({
  number,
  eyebrow,
  title,
  description,
  to,
  inverse = false,
}: {
  number: string;
  eyebrow: string;
  title: string;
  description?: string;
  to?: string;
  inverse?: boolean;
}) => (
  <div className="mb-8 grid gap-6 border-t border-current/10 pt-5 md:mb-12 md:grid-cols-[110px_1fr_auto] md:items-end md:gap-8">
    <span className={`text-[10px] font-semibold tracking-[.28em] ${inverse ? "text-white/38" : "text-[#9A825B]"}`}>
      {number}
    </span>

    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className={`h-px w-8 ${inverse ? "bg-[#D8C29A]" : "bg-[#D8C29A]"}`} />
        <span className={`text-[8px] font-semibold tracking-[.3em] ${inverse ? "text-[#D8C29A]" : "text-[#9A825B]"}`}>
          {eyebrow}
        </span>
      </div>
      <h2 className={`max-w-[820px] text-[28px] font-medium leading-[1.3] tracking-[-.045em] md:text-[44px] ${inverse ? "text-white" : "text-[#0E0E0E]"}`}>
        {title}
      </h2>
      {description && (
        <p className={`mt-3 max-w-[590px] text-[11px] leading-7 md:text-[12px] ${inverse ? "text-white/52" : "text-[#737373]"}`}>
          {description}
        </p>
      )}
    </div>

    {to && (
      <Link
        to={to}
        className={`hidden items-center gap-2 border-b pb-1 text-[9px] font-semibold transition-opacity hover:opacity-60 md:flex ${inverse ? "border-white/30 text-white" : "border-[#C9B183] text-[#0E0E0E]"}`}
      >
        عرض الكل
        <ArrowLeft className="h-4 w-4" strokeWidth={1.4} />
      </Link>
    )}
  </div>
);

const HomePage = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["genan-home-categories-editorial-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,slug,name,name_ar,image_url")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order", { ascending: true })
        .limit(5);

      if (error) throw error;
      return (data || []) as Category[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: featured = [] } = useQuery({
    queryKey: ["genan-home-featured-editorial-v2"],
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

  const { data: best = [] } = useQuery({
    queryKey: ["genan-home-best-editorial-v2"],
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
    queryKey: ["genan-home-brands-editorial-v2"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id,name,slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(8);

      if (error) throw error;
      return (data || []) as Brand[];
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div dir="rtl" className="min-h-screen bg-white text-[#0E0E0E]">
      <Navbar />
      <CartDrawer />

      <main className="overflow-hidden">
        <HeroSlider />

        {categories.length > 0 && (
          <section className="bg-[#F7F5F0] px-4 py-14 sm:px-6 md:px-[5vw] md:py-24">
            <div className="mx-auto max-w-[1600px]">
              <SectionHeader
                number="01"
                eyebrow="SHOP / CATEGORY"
                title="ابدأ من القسم الذي يشبهك."
                description="دخول أسرع إلى التشكيلة، بواجهة تحرّر الصور من شكل الكروت التقليدي وتعرضها كصفحات من كتالوج."
                to="/categories"
              />

              <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 md:mx-0 md:overflow-visible md:px-0">
                <div className="flex w-max gap-3 md:grid md:w-full md:grid-cols-12 md:grid-rows-2 md:gap-3">
                  {categories.map((category, index) => (
                    <Link
                      key={category.id}
                      to={`/products?category=${category.slug}`}
                      className={`group relative w-[72vw] max-w-[310px] shrink-0 overflow-hidden bg-[#EAE7E0] md:w-auto md:max-w-none ${categoryDesktopLayout[index] || "md:col-span-3"}`}
                    >
                      <div className={`relative overflow-hidden ${index === 0 ? "aspect-[4/5] md:h-full md:aspect-auto" : "aspect-[5/4] md:h-[235px] md:aspect-auto lg:h-[275px]"}`}>
                        {category.image_url ? (
                          <img
                            src={category.image_url.startsWith("/") ? category.image_url : optimizeImage(category.image_url, index === 0 ? 900 : 640, 84)}
                            alt={category.name_ar}
                            loading={index < 2 ? "eager" : "lazy"}
                            decoding="async"
                            className="absolute inset-0 h-full w-full object-cover transition duration-700 ease-out group-hover:scale-[1.035] group-hover:brightness-[.92]"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-[#EAE7E0]" />
                        )}

                        <div className="absolute inset-0 bg-gradient-to-t from-black/68 via-black/0 to-black/5" />

                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4 md:p-5">
                          <div>
                            <span className="text-[7px] font-semibold tracking-[.24em] text-[#E6D7B8]">
                              {String(index + 1).padStart(2, "0")}
                            </span>
                            <h3 className="mt-1 text-[17px] font-medium tracking-[-.03em] !text-white md:text-[20px]">
                              {category.name_ar}
                            </h3>
                          </div>
                          <ArrowUpLeft className="h-4 w-4 text-[#A9D8D3] transition-transform duration-300 group-hover:-translate-x-1 group-hover:-translate-y-1" strokeWidth={1.35} />
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <Link to="/categories" className="mt-7 inline-flex items-center gap-2 border-b border-[#C9B183] pb-1 text-[9px] font-semibold md:hidden">
                جميع الأقسام <ArrowLeft className="h-3.5 w-3.5" />
              </Link>
            </div>
          </section>
        )}

        <section className="bg-white px-4 py-14 sm:px-6 md:px-[5vw] md:py-24">
          <div className="mx-auto max-w-[1600px]">
            <SectionHeader
              number="02"
              eyebrow="GENAN / EDIT"
              title="اختيارات تستحق أن تكون في الواجهة."
              description="مجموعة مختارة بعناية، مع ترك المساحة للمنتج نفسه بدل ازدحام العناصر حوله."
              to="/products?sort=featured"
            />

            <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 md:grid-cols-4 md:gap-x-5 md:gap-y-14">
              {featured.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>

            <Link to="/products?sort=featured" className="mt-8 inline-flex items-center gap-2 border-b border-[#C9B183] pb-1 text-[9px] font-semibold md:hidden">
              عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="relative overflow-hidden bg-[#0E0E0E] px-5 py-16 text-white sm:px-8 md:px-[6vw] md:py-28">
          <div aria-hidden className="pointer-events-none absolute -left-4 top-1/2 -translate-y-1/2 select-none text-[28vw] font-semibold leading-none tracking-[-.08em] text-white/[.025]">
            GENAN
          </div>

          <div className="relative mx-auto grid max-w-[1600px] gap-12 md:grid-cols-[1fr_360px] md:items-end">
            <div className="max-w-[850px]">
              <div className="mb-5 flex items-center gap-3">
                <span className="h-px w-10 bg-[#D8C29A]" />
                <span className="text-[8px] font-semibold tracking-[.32em] text-[#D8C29A]">03 / THE GENAN NOTE</span>
                <span className="h-1.5 w-1.5 bg-[#A9D8D3]" />
              </div>

              <p className="text-[11px] leading-8 text-white/45 md:text-[12px]">أقل عناصر. صور أكبر. قرار أسرع.</p>
              <h2 className="mt-4 max-w-[800px] text-[36px] font-medium leading-[1.35] tracking-[-.05em] !text-white md:text-[62px]">
                التسوق الراقي لا يحتاج إلى ضجيج بصري.
              </h2>
            </div>

            <div className="border-t border-white/15 pt-5 md:border-r md:border-t-0 md:pr-8 md:pt-0">
              <p className="text-[11px] leading-8 text-white/52">
                في جنان نعطي الأولوية للصورة، الاسم، والسعر. كل ما لا يساعدك على الاختيار يأخذ خطوة إلى الخلف.
              </p>
              <Link to="/products" className="mt-6 inline-flex h-12 items-center gap-3 bg-white px-7 text-[10px] font-semibold text-[#0E0E0E] transition-colors hover:bg-[#E6D7B8]">
                اكتشف التشكيلة
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {best.length > 0 && (
          <section className="bg-[#F7F5F0] px-4 py-14 sm:px-6 md:px-[5vw] md:py-24">
            <div className="mx-auto max-w-[1600px]">
              <SectionHeader
                number="04"
                eyebrow="MOST WANTED"
                title="الأكثر اختيارًا الآن."
                description="قطع تتكرر حولها الاختيارات، مع إبقاء القسم مختصرًا وواضحًا."
                to="/best-sellers"
              />

              <div className="grid grid-cols-2 gap-x-3 gap-y-10 sm:gap-x-4 md:grid-cols-4 md:gap-x-5 md:gap-y-14">
                {best.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}

        {brands.length > 0 && (
          <section className="bg-white px-4 py-14 sm:px-6 md:px-[5vw] md:py-24">
            <div className="mx-auto max-w-[1600px]">
              <SectionHeader number="05" eyebrow="BRAND INDEX" title="الماركات، بدون ازدحام." to="/brands" />

              <div className="border-t border-[#DADADA]">
                {brands.map((brand, index) => (
                  <Link
                    key={brand.id}
                    to={`/brands/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="group grid min-h-[74px] grid-cols-[52px_1fr_auto] items-center gap-3 border-b border-[#E2E2E2] transition-colors hover:bg-[#0E0E0E] md:min-h-[88px] md:grid-cols-[90px_1fr_auto]"
                  >
                    <span className="text-[8px] tracking-[.2em] text-[#9A825B] group-hover:text-[#D8C29A]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-[16px] font-medium tracking-[.04em] text-[#0E0E0E] transition-colors group-hover:text-white md:text-[20px]">
                      {brand.name}
                    </span>
                    <ArrowUpLeft className="ml-3 h-4 w-4 text-[#A9D8D3] transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 md:ml-5" strokeWidth={1.3} />
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default HomePage;

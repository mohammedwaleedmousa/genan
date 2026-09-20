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

const SectionHeader = ({
  eyebrow,
  title,
  description,
  to,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  to?: string;
}) => (
  <div className="mb-6 flex items-end justify-between gap-6 md:mb-8">
    <div>
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px w-10 bg-[#D8C29A]" />
        <span className="text-[8px] font-semibold tracking-[.3em] text-[#9A825B]">{eyebrow}</span>
      </div>
      <h2 className="text-[25px] font-medium leading-[1.35] tracking-[-.04em] text-[#0E0E0E] md:text-[36px]">{title}</h2>
      {description && <p className="mt-3 max-w-[560px] text-[11px] leading-7 text-[#777] md:text-[12px]">{description}</p>}
    </div>

    {to && (
      <Link to={to} className="hidden items-center gap-2 border-b border-[#D8C29A] pb-1 text-[9px] font-semibold text-[#0E0E0E] md:flex">
        عرض الكل
        <ArrowLeft className="h-4 w-4" strokeWidth={1.4} />
      </Link>
    )}
  </div>
);

const HomePage = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["genan-home-categories-clean-v1"],
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
    queryKey: ["genan-home-featured-clean-v1"],
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
    queryKey: ["genan-home-best-clean-v1"],
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
    queryKey: ["genan-home-brands-clean-v1"],
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

      <main>
        <HeroSlider />

        <section className="bg-white px-4 py-10 sm:px-6 md:px-[5vw] md:py-14">
          <div className="mx-auto max-w-[1600px]">
            <SectionHeader
              eyebrow="SHOP BY CATEGORY"
              title="تسوق حسب القسم"
              description="أقسام صغيرة وواضحة في صف واحد، للوصول أسرع."
              to="/categories"
            />

            <div className="-mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 md:mx-0 md:overflow-visible md:px-0">
              <div className="flex w-max gap-3 md:grid md:w-full md:grid-cols-5 md:gap-3">
                {categories.map((category, index) => (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.slug}`}
                    className="group w-[160px] shrink-0 sm:w-[180px] md:w-auto"
                  >
                    <div className="relative aspect-[5/4] overflow-hidden bg-[#F4F4F4]">
                      {category.image_url ? (
                        <img
                          src={category.image_url.startsWith("/") ? category.image_url : optimizeImage(category.image_url, 520, 82)}
                          alt={category.name_ar}
                          loading={index < 3 ? "eager" : "lazy"}
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#F2F2F2]" />
                      )}

                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/68 to-transparent px-3 pb-3 pt-10">
                        <div className="flex items-end justify-between gap-2">
                          <div>
                            <span className="text-[6px] font-semibold tracking-[.18em] text-[#E6D7B8]">{String(index + 1).padStart(2, "0")}</span>
                            <h3 className="mt-0.5 text-[13px] font-medium text-white md:text-[14px]">{category.name_ar}</h3>
                          </div>
                          <ArrowUpLeft className="h-3.5 w-3.5 text-[#A9D8D3]" strokeWidth={1.4} />
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            <Link to="/categories" className="mt-6 inline-flex items-center gap-2 text-[9px] font-semibold text-[#0E0E0E] md:hidden">
              جميع الأقسام <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="border-y border-[#EAEAEA] bg-[#FAFAFA] px-4 py-14 sm:px-6 md:px-[5vw] md:py-20">
          <div className="mx-auto max-w-[1600px]">
            <SectionHeader
              eyebrow="GENAN EDIT"
              title="مختارات جنان"
              description="المنتجات التي نريد أن تراها أولًا. نفس الكارد الذي أعجبك، بدون أي تغيير."
              to="/products?sort=featured"
            />

            <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 md:grid-cols-3 md:gap-x-5 md:gap-y-12 lg:grid-cols-4">
              {featured.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>

            <Link to="/products?sort=featured" className="mt-8 inline-flex items-center gap-2 text-[9px] font-semibold text-[#0E0E0E] md:hidden">
              عرض الكل <ArrowLeft className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        <section className="bg-[#0E0E0E] px-5 py-16 text-white sm:px-8 md:px-[6vw] md:py-24">
          <div className="mx-auto flex max-w-[1600px] flex-col gap-10 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[720px]">
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-10 bg-[#D8C29A]" />
                <span className="text-[8px] font-semibold tracking-[.3em] text-[#D8C29A]">GENAN / SIMPLE LUXURY</span>
                <span className="h-1.5 w-1.5 bg-[#A9D8D3]" />
              </div>
              <h2 className="text-[34px] font-medium leading-[1.4] tracking-[-.045em] text-white md:text-[52px]">
                تصميم هادئ، والمنتج هو العنصر الأقوى.
              </h2>
              <p className="mt-4 max-w-[540px] text-[11px] leading-8 text-white/55 md:text-[12px]">
                الأبيض والأسود هما الأساس. الذهبي للتفاصيل الراقية، والتروازي يظهر فقط كلَمسة صغيرة.
              </p>
            </div>

            <Link
              to="/products"
              className="inline-flex h-12 w-fit items-center gap-3 bg-white px-7 text-[10px] font-semibold text-[#0E0E0E]"
            >
              تسوق الآن
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </div>
        </section>

        {best.length > 0 && (
          <section className="bg-white px-4 py-14 sm:px-6 md:px-[5vw] md:py-20">
            <div className="mx-auto max-w-[1600px]">
              <SectionHeader
                eyebrow="MOST WANTED"
                title="الأكثر اختيارًا"
                description="أربع قطع فقط في هذا القسم حتى تبقى الصفحة خفيفة وواضحة."
                to="/best-sellers"
              />

              <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 md:grid-cols-4 md:gap-x-5">
                {best.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}

        {brands.length > 0 && (
          <section className="border-t border-[#EAEAEA] bg-[#FAFAFA] px-4 py-14 sm:px-6 md:px-[5vw] md:py-20">
            <div className="mx-auto max-w-[1600px]">
              <SectionHeader eyebrow="BRANDS" title="الماركات" to="/brands" />

              <div className="grid grid-cols-2 border-r border-t border-[#E2E2E2] md:grid-cols-4">
                {brands.map((brand) => (
                  <Link
                    key={brand.id}
                    to={`/brands/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="flex min-h-[118px] items-center justify-center border-b border-l border-[#E2E2E2] bg-white px-4 text-center transition-colors hover:bg-[#F7F7F7]"
                  >
                    <span className="text-[12px] font-medium tracking-[.06em] text-[#0E0E0E]">{brand.name}</span>
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

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import HeroSlider from "@/components/HeroSlider";
import ProductCard from "@/components/ProductCard";
import GenanServices from "@/components/GenanServices";
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
  to,
}: {
  eyebrow: string;
  title: string;
  to?: string;
}) => (
  <div className="mb-4 flex items-end justify-between gap-3 md:mb-7">
    <div>
      <div className="mb-1.5 flex items-center gap-2">
        <span className="h-px w-5 bg-[#C9B183] md:w-7" />
        <span className="text-[6px] font-semibold tracking-[.24em] text-[#9A825B] md:text-[8px]">{eyebrow}</span>
      </div>
      <h2 className="text-[17px] font-semibold tracking-[-.025em] text-[#0E0E0E] md:text-[29px]">{title}</h2>
    </div>

    {to && (
      <Link to={to} className="flex shrink-0 items-center gap-1 border-b border-[#D8C29A] pb-0.5 text-[7px] font-semibold text-[#0E0E0E] md:gap-2 md:text-[10px]">
        عرض الكل
        <ArrowLeft className="h-3 w-3 md:h-4 md:w-4" strokeWidth={1.5} />
      </Link>
    )}
  </div>
);

const HomePage = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["genan-home-categories-compact-v1"],
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

  const { data: featured = [] } = useQuery({
    queryKey: ["genan-home-featured-compact-v1"],
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
    queryKey: ["genan-home-best-compact-v1"],
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
    queryKey: ["genan-home-brands-compact-v1"],
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

  return (
    <div dir="rtl" className="min-h-screen bg-white text-[#0E0E0E]">
      <Navbar />
      <CartDrawer />

      <main className="overflow-hidden bg-white">
        <HeroSlider />

        {categories.length > 0 && (
          <section className="bg-[#FAF9F6] py-6 md:py-12">
            <div className="mx-auto max-w-[1500px] px-3 md:px-6 lg:px-8">
              <SectionHeader eyebrow="SHOP / CATEGORY" title="تسوق حسب القسم" to="/categories" />

              <div className="-mx-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden md:mx-0 md:overflow-visible md:px-0">
                <div className="flex w-max gap-2.5 after:block after:w-3 after:shrink-0 after:content-[''] md:grid md:w-full md:grid-cols-4 md:gap-4 md:after:hidden lg:grid-cols-6 xl:grid-cols-8">
                  {categories.map((category, index) => (
                    <Link
                      key={category.id}
                      to={`/products?category=${category.slug}`}
                      className="group block w-[82px] shrink-0 sm:w-[94px] md:w-auto"
                    >
                      <div className="relative aspect-[4/5] overflow-hidden border border-[#E7E2D9] bg-[#F1EEE8]">
                        {category.image_url ? (
                          <img
                            src={category.image_url.startsWith("/") ? category.image_url : optimizeImage(category.image_url, 360, 80)}
                            alt={category.name_ar || category.name}
                            loading={index < 5 ? "eager" : "lazy"}
                            decoding="async"
                            className="h-full w-full object-cover object-center transition-transform duration-500 md:group-hover:scale-[1.035]"
                          />
                        ) : (
                          <div className="h-full w-full bg-[#F1EEE8]" />
                        )}
                      </div>

                      <div className="mt-1.5 text-center">
                        <p className="truncate text-[8px] font-semibold text-[#222] md:text-[11px]">
                          {category.name_ar || category.name}
                        </p>
                        <p className="mt-0.5 hidden truncate text-[6px] tracking-[.08em] text-[#9A825B] md:block">
                          {category.name}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {featured.length > 0 && (
          <section className="bg-white py-7 md:py-14">
            <div className="mx-auto max-w-[1500px] px-3 md:px-6 lg:px-8">
              <SectionHeader eyebrow="GENAN / EDIT" title="مختارات جنان" to="/products?sort=featured" />

              <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-3 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                {featured.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}

        <GenanServices slot={0} />

        {best.length > 0 && (
          <section className="bg-[#FAF9F6] py-7 md:py-14">
            <div className="mx-auto max-w-[1500px] px-3 md:px-6 lg:px-8">
              <SectionHeader eyebrow="MOST WANTED" title="الأكثر اختيارًا" to="/best-sellers" />

              <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 sm:gap-x-3 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                {best.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}

        {brands.length > 0 && (
          <section className="bg-white py-7 md:py-14">
            <div className="mx-auto max-w-[1500px] px-3 md:px-6 lg:px-8">
              <SectionHeader eyebrow="BRANDS" title="الماركات" to="/brands" />

              <div className="-mx-3 overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0">
                <div className="flex w-max gap-2 md:grid md:w-full md:grid-cols-5">
                  {brands.map((brand) => (
                    <Link
                      key={brand.id}
                      to={`/brands/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, "-")}`}
                      className="flex h-[58px] min-w-[132px] items-center justify-center border border-[#E7E2D9] bg-white px-4 text-center text-[#111111] transition-all duration-200 hover:border-[#C9B183] hover:bg-[#FBF8F1] md:min-w-0"
                    >
                      <span className="text-[9px] font-semibold tracking-[.04em] text-[#111111] md:text-[11px]">{brand.name}</span>
                    </Link>
                  ))}
                </div>
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

import { useMemo } from "react";
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
  logo_url: string | null;
};

const SectionTitle = ({
  eyebrow,
  title,
  description,
  link,
  linkLabel = "عرض الكل",
}: {
  eyebrow: string;
  title: string;
  description?: string;
  link?: string;
  linkLabel?: string;
}) => (
  <div className="mb-9 flex items-end justify-between gap-8 md:mb-12">
    <div className="max-w-[760px]">
      <div className="mb-3 flex items-center gap-3">
        <span className="h-px w-10 bg-[#D8C29A]" />
        <span className="text-[8px] font-semibold tracking-[.32em] text-[#9A825B]">{eyebrow}</span>
      </div>
      <h2 className="text-[31px] font-medium leading-[1.35] tracking-[-.045em] text-[#0E0E0E] md:text-[48px]">{title}</h2>
      {description && <p className="mt-3 max-w-[560px] text-[11px] leading-7 text-[#707070] md:text-[13px]">{description}</p>}
    </div>
    {link && (
      <Link to={link} className="group hidden items-center gap-3 border-b border-[#D8C29A] pb-1.5 text-[10px] font-semibold text-[#0E0E0E] md:flex">
        {linkLabel}
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" strokeWidth={1.4} />
      </Link>
    )}
  </div>
);

const HomePage = () => {
  const { data: categories = [] } = useQuery({
    queryKey: ["genan-home-categories-v1"],
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

  const { data: featuredRows = [] } = useQuery({
    queryKey: ["genan-home-featured-v1"],
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

  const { data: bestRows = [] } = useQuery({
    queryKey: ["genan-home-best-v1"],
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
    queryKey: ["genan-home-brands-v1"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id,name,slug,logo_url")
        .eq("is_active", true)
        .order("sort_order", { ascending: true })
        .limit(8);
      if (error) throw error;
      return (data || []) as Brand[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const categoryLayout = useMemo(() => categories.slice(0, 5), [categories]);

  return (
    <div className="min-h-screen bg-white text-[#0E0E0E]" dir="rtl">
      <Navbar />
      <CartDrawer />

      <main className="overflow-hidden">
        <HeroSlider />

        <section className="border-b border-[#EAEAEA] bg-white">
          <div className="mx-auto grid max-w-[1760px] grid-cols-2 md:grid-cols-4">
            {[
              ["NEW / 01", "وصل حديثًا", "/new-arrivals"],
              ["EDIT / 02", "مختارات جنان", "/products?sort=featured"],
              ["BEST / 03", "الأكثر اختيارًا", "/best-sellers"],
              ["BRANDS / 04", "الماركات", "/brands"],
            ].map(([kicker, label, to], index) => (
              <Link
                key={to}
                to={to}
                className={`group flex min-h-[92px] items-center justify-between gap-4 px-5 py-5 transition-colors hover:bg-[#FAFAFA] md:min-h-[110px] md:px-8 ${index < 3 ? "border-l border-[#EAEAEA]" : ""}`}
              >
                <div>
                  <span className="text-[7px] font-semibold tracking-[.28em] text-[#9A825B]">{kicker}</span>
                  <p className="mt-2 text-[12px] font-semibold text-[#0E0E0E] md:text-[14px]">{label}</p>
                </div>
                <ArrowUpLeft className="h-4 w-4 text-[#A9D8D3]" strokeWidth={1.4} />
              </Link>
            ))}
          </div>
        </section>

        {categoryLayout.length > 0 && (
          <section className="bg-white px-4 py-16 sm:px-6 md:px-[5vw] md:py-28">
            <div className="mx-auto max-w-[1760px]">
              <SectionTitle
                eyebrow="DISCOVER / CATEGORIES"
                title="ابدأ من القسم، ثم دع القطعة تتكلم."
                description="بدل ازدحام الخيارات، رتبنا تجربة جنان حول مجموعات واضحة ومساحات بصرية هادئة."
                link="/categories"
                linkLabel="كل الأقسام"
              />

              <div className="grid gap-3 md:grid-cols-12 md:grid-rows-[340px_340px]">
                {categoryLayout.map((category, index) => {
                  const placement = [
                    "md:col-span-5 md:row-span-2",
                    "md:col-span-4",
                    "md:col-span-3",
                    "md:col-span-3",
                    "md:col-span-4",
                  ][index] || "md:col-span-3";

                  return (
                    <Link
                      key={category.id}
                      to={`/products?category=${category.slug}`}
                      className={`group relative min-h-[310px] overflow-hidden bg-[#F4F4F4] ${placement}`}
                    >
                      {category.image_url ? (
                        <img
                          src={optimizeImage(category.image_url, index === 0 ? 1000 : 760, 82)}
                          alt={category.name_ar}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[linear-gradient(145deg,#f7f7f7,#ececec)]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/58 via-black/[0.05] to-transparent" />
                      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-5 p-5 md:p-7">
                        <div>
                          <span className="text-[7px] font-semibold tracking-[.22em] text-[#E6D7B8]">{String(index + 1).padStart(2, "0")} / CATEGORY</span>
                          <h3 className="mt-2 text-[22px] font-medium text-white md:text-[27px]">{category.name_ar}</h3>
                          <p className="mt-1 text-[8px] tracking-[.12em] text-white/55">{category.name}</p>
                        </div>
                        <span className="flex h-10 w-10 items-center justify-center border border-white/35 text-[#A9D8D3]">
                          <ArrowUpLeft className="h-4 w-4" strokeWidth={1.4} />
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        <section className="border-y border-[#EAEAEA] bg-[#FAFAFA] px-4 py-16 sm:px-6 md:px-[5vw] md:py-28">
          <div className="mx-auto max-w-[1760px]">
            <SectionTitle
              eyebrow="THE GENAN EDIT"
              title="ثمان قطع كافية لتفهم شكل المتجر."
              description="عرض تجريبي مباشر للبطاقات والأسعار والألوان والتفاعل، قبل إدخال مخزونك الحقيقي."
              link="/products"
            />

            <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 md:grid-cols-3 md:gap-x-5 md:gap-y-12 lg:grid-cols-4">
              {featuredRows.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} />
              ))}
            </div>
          </div>
        </section>

        <section className="grid min-h-[560px] bg-[#0E0E0E] text-white md:grid-cols-[.9fr_1.1fr]">
          <div className="relative flex items-end border-b border-white/10 px-6 py-14 md:border-b-0 md:border-l md:px-[6vw] md:py-20">
            <div className="max-w-[610px]">
              <span className="text-[8px] font-semibold tracking-[.36em] text-[#D8C29A]">GENAN / DESIGN NOTE</span>
              <h2 className="mt-5 text-[36px] font-medium leading-[1.35] tracking-[-.05em] text-white md:text-[58px]">
                الأبيض يفتح المساحة. الأسود يثبت الهوية.
              </h2>
              <p className="mt-5 max-w-[480px] text-[11px] leading-8 text-white/55 md:text-[13px]">
                الذهبي يظهر في التفاصيل التي تستحق الانتباه، والتروازي لا يظهر إلا كإشارة صغيرة تجعل جنان له بصمته الخاصة.
              </p>
            </div>
          </div>
          <div className="relative min-h-[390px] overflow-hidden bg-[#E6D7B8]">
            <div className="absolute left-[9%] top-[12%] h-[68%] w-[58%] bg-white" />
            <div className="absolute bottom-[9%] right-[10%] h-[48%] w-[52%] bg-[#0E0E0E]" />
            <div className="absolute bottom-[16%] right-[17%] h-[48%] w-[52%] border border-[#A9D8D3]" />
            <span className="absolute right-8 top-8 text-[8px] font-semibold tracking-[.35em] text-[#0E0E0E]/50">WHITE / BLACK / GOLD / AQUA</span>
          </div>
        </section>

        {bestRows.length > 0 && (
          <section className="bg-white px-4 py-16 sm:px-6 md:px-[5vw] md:py-28">
            <div className="mx-auto max-w-[1760px]">
              <SectionTitle
                eyebrow="MOST WANTED"
                title="الأكثر اختيارًا الآن."
                description="قسم أصغر وأكثر تركيزًا، حتى لا تبدو الصفحة ككتالوج طويل بلا نهاية."
                link="/best-sellers"
              />
              <div className="grid grid-cols-2 gap-x-3 gap-y-9 sm:gap-x-4 md:grid-cols-4 md:gap-x-5">
                {bestRows.map((product, index) => (
                  <ProductCard key={product.id} product={product} index={index} />
                ))}
              </div>
            </div>
          </section>
        )}

        {brands.length > 0 && (
          <section className="border-t border-[#EAEAEA] bg-[#FAFAFA]">
            <div className="mx-auto max-w-[1760px] px-4 py-14 sm:px-6 md:px-[5vw] md:py-20">
              <SectionTitle eyebrow="BRANDS / INDEX" title="علامات داخل جنان." link="/brands" />
              <div className="grid grid-cols-2 border-r border-t border-[#DEDEDE] sm:grid-cols-4">
                {brands.map((brand, index) => (
                  <Link
                    key={brand.id}
                    to={`/brands/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="group flex min-h-[150px] items-center justify-center border-b border-l border-[#DEDEDE] bg-white px-5 text-center transition-colors hover:bg-[#0E0E0E]"
                  >
                    <div>
                      <span className="text-[7px] tracking-[.25em] text-[#A9D8D3]">{String(index + 1).padStart(2, "0")}</span>
                      <p className="mt-3 text-[15px] font-medium tracking-[.08em] text-[#0E0E0E] transition-colors group-hover:text-white">{brand.name}</p>
                    </div>
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

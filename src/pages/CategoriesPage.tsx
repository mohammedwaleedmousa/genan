import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { supabase } from "@/integrations/supabase/client";
import { optimizeImage } from "@/lib/imageUrl";

type Category = {
  id: string;
  name: string;
  name_ar: string;
  slug: string;
  image_url: string | null;
  description_ar: string | null;
  parent_id: string | null;
};

const CategoriesPage = () => {
  const { data: categories = [], isLoading } = useQuery({
    queryKey: ["genan-categories-page-v1"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id,name,name_ar,slug,image_url,description_ar,parent_id")
        .eq("is_active", true)
        .is("parent_id", null)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as Category[];
    },
    staleTime: 10 * 60 * 1000,
  });

  return (
    <div dir="rtl" className="min-h-screen bg-white text-[#0E0E0E]">
      <Navbar />
      <CartDrawer />

      <main>
        <section className="border-b border-[#EAEAEA] px-5 py-14 sm:px-8 md:px-[6vw] md:py-20">
          <div className="mx-auto grid max-w-[1760px] gap-8 md:grid-cols-[1.2fr_.8fr] md:items-end">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-12 bg-[#D8C29A]" />
                <span className="text-[8px] font-semibold tracking-[.34em] text-[#9A825B]">GENAN / CATEGORIES</span>
              </div>
              <h1 className="max-w-[800px] text-[40px] font-medium leading-[1.25] tracking-[-.055em] sm:text-[52px] md:text-[70px]">
                كل ما تحب، في مكانه.
              </h1>
            </div>
            <p className="max-w-[460px] text-[11px] leading-8 text-[#707070] md:text-[13px]">
              تصفح الأزياء والحقائب والأحذية والساعات والإكسسوارات، واختر ما يناسب أسلوبك.
            </p>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 md:px-[5vw] md:py-16">
          <div className="mx-auto max-w-[1760px]">
            {isLoading ? (
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="aspect-[4/5] animate-pulse bg-[#F3F3F3]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                {categories.map((category, index) => (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.slug}`}
                    className="group min-w-0"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden border border-[#EAEAEA] bg-[#F7F7F7]">
                      {category.image_url ? (
                        <img
                          src={optimizeImage(category.image_url, 520, 82)}
                          alt={category.name_ar}
                          loading={index < 8 ? "eager" : "lazy"}
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#F3F3F3]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-transparent to-transparent" />
                      <span className="absolute left-2 top-2 text-[6px] font-semibold tracking-[.18em] text-[#A9D8D3] md:left-3 md:top-3 md:text-[7px]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="absolute inset-x-0 bottom-0 p-2 md:p-3">
                        <h2 className="truncate text-[10px] font-semibold text-white md:text-[14px]">{category.name_ar}</h2>
                      </div>
                    </div>
                    <p className="mt-1 truncate text-center text-[6px] tracking-[.08em] text-[#9A825B] md:text-[8px]">{category.name}</p>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-10 flex justify-center">
              <Link to="/products" className="inline-flex h-12 items-center gap-3 border border-[#0E0E0E] px-7 text-[10px] font-semibold transition-colors hover:bg-[#0E0E0E] hover:text-white">
                جميع المنتجات
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default CategoriesPage;

import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ArrowUpLeft } from "lucide-react";

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
                أقسام واضحة، بدون ازدحام.
              </h1>
            </div>
            <p className="max-w-[460px] text-[11px] leading-8 text-[#707070] md:text-[13px]">
              كل قسم يأخذ مساحته الخاصة، مع صورة واضحة ومسار مباشر للمنتجات الموجودة داخله.
            </p>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 md:px-[5vw] md:py-16">
          <div className="mx-auto max-w-[1760px]">
            {isLoading ? (
              <div className="grid gap-3 md:grid-cols-2">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="h-[430px] animate-pulse bg-[#F3F3F3]" />
                ))}
              </div>
            ) : (
              <div className="grid gap-px bg-[#EAEAEA] md:grid-cols-2">
                {categories.map((category, index) => (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.slug}`}
                    className="group relative min-h-[430px] overflow-hidden bg-[#F7F7F7] md:min-h-[560px]"
                  >
                    {category.image_url && (
                      <img
                        src={optimizeImage(category.image_url, 1100, 84)}
                        alt={category.name_ar}
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/[0.06] to-transparent" />
                    <span className="absolute left-5 top-5 text-[8px] font-semibold tracking-[.3em] text-[#A9D8D3] md:left-7 md:top-7">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="absolute inset-x-0 bottom-0 p-5 md:p-8">
                      <div className="flex items-end justify-between gap-5">
                        <div>
                          <span className="text-[7px] font-semibold tracking-[.24em] text-[#E6D7B8]">{category.name}</span>
                          <h2 className="mt-2 text-[30px] font-medium tracking-[-.035em] text-white md:text-[40px]">{category.name_ar}</h2>
                          {category.description_ar && <p className="mt-3 max-w-[430px] text-[10px] leading-6 text-white/58 md:text-[11px]">{category.description_ar}</p>}
                        </div>
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center border border-white/35 text-white transition-colors group-hover:bg-white group-hover:text-[#0E0E0E]">
                          <ArrowUpLeft className="h-4 w-4" strokeWidth={1.4} />
                        </span>
                      </div>
                    </div>
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

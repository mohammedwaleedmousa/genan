import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpLeft, Search, X } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { supabase } from "@/integrations/supabase/client";
import { handleImageError, optimizeImage } from "@/lib/imageUrl";

interface BrandRow {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  sort_order: number | null;
}

const AllBrandsPage = () => {
  const [term, setTerm] = useState("");

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["all-brands"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id,name,logo_url,sort_order,slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as BrandRow[];
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const list = useMemo(() => {
    const query = term.trim().toLowerCase();
    return brands
      .map((brand) => ({
        ...brand,
        slug: brand.slug || brand.name.toLowerCase().trim().replace(/\s+/g, "-"),
      }))
      .filter((brand) => !query || brand.name.toLowerCase().includes(query));
  }, [brands, term]);

  return (
    <div className="min-h-screen bg-[#F8F6F0]" dir="rtl">
      <Navbar />
      <CartDrawer />

      <main className="pb-20">
        <section className="border-b border-[#DCD5C6]">
          <div className="mx-auto grid max-w-[1680px] gap-8 px-5 py-12 md:grid-cols-[1.25fr_.75fr] md:px-8 md:py-20 lg:px-12">
            <div>
              <span className="text-[8px] font-semibold tracking-[0.34em] text-[#9D7B40]">BRAND INDEX / GENAN</span>
              <h1 className="mt-5 text-[42px] font-medium leading-[1.25] tracking-[-0.055em] text-[#173A2D] md:text-[72px]">
                دليل الماركات
              </h1>
            </div>
            <div className="flex items-end">
              <p className="max-w-[420px] text-[11px] leading-7 text-[#69736B] md:text-[13px]">
                فهرس مباشر للعلامات الموجودة في جنان. بدون بطاقات مزدحمة؛ اختر الاسم وادخل إلى مجموعته.
              </p>
            </div>
          </div>
        </section>

        <section className="sticky top-[110px] z-20 border-b border-[#DCD5C6] bg-[#F8F6F0]/96 backdrop-blur-xl md:top-[126px]">
          <div className="mx-auto flex max-w-[1680px] items-center gap-4 px-5 py-4 md:px-8 lg:px-12">
            <Search className="h-4 w-4 shrink-0 text-[#9D7B40]" strokeWidth={1.4} />
            <input
              value={term}
              onChange={(event) => setTerm(event.target.value)}
              placeholder="ابحث باسم الماركة"
              autoComplete="off"
              className="h-10 min-w-0 flex-1 border-0 bg-transparent text-[12px] text-[#173A2D] outline-none placeholder:text-[#8A938B]"
            />
            {term && (
              <button type="button" onClick={() => setTerm("")} aria-label="مسح البحث" className="flex h-8 w-8 items-center justify-center border border-[#DCD5C6] text-[#657068]">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <span className="hidden text-[9px] tracking-[0.14em] text-[#8A938B] sm:block">{list.length} / {brands.length}</span>
          </div>
        </section>

        <section className="mx-auto max-w-[1680px] px-5 md:px-8 lg:px-12">
          {isLoading ? (
            <div className="grid md:grid-cols-2">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="h-[118px] animate-pulse border-b border-[#DCD5C6] md:odd:border-l" />
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex min-h-[44vh] flex-col items-start justify-center border-b border-[#DCD5C6]">
              <span className="text-[8px] tracking-[0.24em] text-[#9D7B40]">NO MATCH</span>
              <h2 className="mt-3 text-[28px] font-medium text-[#173A2D]">لا توجد ماركة بهذا الاسم.</h2>
              <button type="button" onClick={() => setTerm("")} className="mt-6 border-b border-[#173A2D] pb-1 text-[10px] font-semibold text-[#173A2D]">
                العودة للفهرس الكامل
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2">
              {list.map((brand, index) => (
                <Link
                  key={brand.id}
                  to={`/brands/${brand.slug}`}
                  className="group grid min-h-[118px] grid-cols-[46px_1fr_64px] items-center gap-4 border-b border-[#DCD5C6] py-5 transition-colors hover:bg-[#EEE9DD] md:min-h-[136px] md:grid-cols-[56px_1fr_80px] md:px-5 md:odd:border-l"
                >
                  <span className="self-start pt-1 text-[8px] tracking-[0.16em] text-[#9D7B40]">{String(index + 1).padStart(2, "0")}</span>
                  <div className="min-w-0">
                    <h2 className="truncate font-serif text-[24px] font-medium tracking-[0.03em] text-[#173A2D] md:text-[30px]">{brand.name}</h2>
                    <span className="mt-2 block text-[7px] tracking-[0.2em] text-[#7D877F]">VIEW COLLECTION</span>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center justify-self-end bg-white/55 p-2 md:h-16 md:w-16">
                    {brand.logo_url ? (
                      <img src={optimizeImage(brand.logo_url, 180, 78)} alt={brand.name} loading={index < 6 ? "eager" : "lazy"} onError={handleImageError} className="h-full w-full object-contain grayscale transition-all duration-300 group-hover:grayscale-0" />
                    ) : (
                      <ArrowUpLeft className="h-5 w-5 text-[#9D7B40] transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" strokeWidth={1.2} />
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AllBrandsPage;

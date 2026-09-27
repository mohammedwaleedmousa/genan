import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpLeft, Search, X } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { supabase } from "@/integrations/supabase/client";

type Brand = {
  id: string;
  name: string;
  slug: string | null;
  description: string | null;
};

const AllBrandsPage = () => {
  const [query, setQuery] = useState("");

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["genan-all-brands-v4"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id,name,slug,description")
        .eq("is_active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      return (data || []) as Brand[];
    },
    staleTime: 10 * 60 * 1000,
  });

  const filteredBrands = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return brands;

    return brands.filter((brand) =>
      [brand.name, brand.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(value),
    );
  }, [brands, query]);

  return (
    <div dir="rtl" className="min-h-screen bg-white text-[#171717]">
      <Navbar />
      <CartDrawer />

      <main>
        <section className="border-b border-[#EEEAE3] bg-white">
          <div className="mx-auto max-w-[1500px] px-4 py-9 md:px-6 md:py-12">
            <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[8px] font-medium tracking-[.2em] text-[#9A825B]">GENAN / BRANDS</p>

                <h1 className="mt-3 text-[34px] font-semibold tracking-[-.04em] md:text-[52px]">
                  الماركات
                </h1>

                <p className="mt-3 max-w-[500px] text-[10px] leading-6 text-[#77716A] md:text-[11px]">
                  اختر الماركة التي تريدها وتصفح منتجاتها مباشرة.
                </p>
              </div>

              <div className="w-full md:max-w-[360px]">
                <div className="relative">
                  <Search className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8A847C]" />

                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="ابحث عن ماركة"
                    className="h-11 w-full rounded-xl border border-[#E5E0D8] bg-white pr-11 pl-10 text-[10px] outline-none transition-colors placeholder:text-[#AAA49A] focus:border-[#CDB98F]"
                  />

                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery("")}
                      className="absolute left-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[#8A847C] hover:bg-[#F5F2EC]"
                      aria-label="مسح البحث"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                <p className="mt-2 px-1 text-[8px] text-[#8A847C]">
                  {filteredBrands.length} ماركة
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1500px] px-3 py-6 md:px-6 md:py-10">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div
                  key={index}
                  className="aspect-square animate-pulse rounded-xl bg-[#F5F3EF]"
                />
              ))}
            </div>
          ) : filteredBrands.length === 0 ? (
            <div className="flex min-h-[42vh] flex-col items-center justify-center text-center">
              <h2 className="text-[20px] font-semibold">لا توجد ماركة بهذا الاسم</h2>

              <button
                type="button"
                onClick={() => setQuery("")}
                className="mt-4 text-[10px] font-medium text-[#8F7548] underline decoration-[#CDB98F] underline-offset-4"
              >
                عرض جميع الماركات
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
              {filteredBrands.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/brands/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, "-")}`}
                  className="group relative flex aspect-square min-w-0 flex-col items-center justify-center overflow-hidden rounded-xl border border-[#E8E3DB] bg-white p-4 text-center transition-all duration-200 hover:border-[#CDB98F] hover:bg-[#FCFAF6]"
                >
                  <span className="absolute right-3 top-3 text-[7px] font-medium text-[#B09A70]">
                    {brand.name.trim().charAt(0).toUpperCase()}
                  </span>

                  <div className="max-w-full">
                    <h2 className="truncate text-[15px] font-semibold tracking-[-.02em] text-[#171717] md:text-[18px]">
                      {brand.name}
                    </h2>

                    {brand.description && (
                      <p className="mx-auto mt-2 line-clamp-2 max-w-[160px] text-[8px] leading-5 text-[#8A847C] md:text-[9px]">
                        {brand.description}
                      </p>
                    )}
                  </div>

                  <span className="absolute bottom-3 left-3 flex h-8 w-8 items-center justify-center rounded-full bg-[#F5F2EC] text-[#8F7548] transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5">
                    <ArrowUpLeft className="h-3.5 w-3.5" />
                  </span>
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

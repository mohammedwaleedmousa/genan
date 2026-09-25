import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpLeft } from "lucide-react";

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
  const { data: brands = [], isLoading } = useQuery({
    queryKey: ["genan-all-brands-v2"],
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

  const groupedBrands = useMemo(() => {
    const groups = new Map<string, Brand[]>();

    brands.forEach((brand) => {
      const first = brand.name.trim().charAt(0).toUpperCase() || "#";
      const key = /[A-Z]/.test(first) ? first : "#";
      const list = groups.get(key) || [];
      list.push(brand);
      groups.set(key, list);
    });

    return Array.from(groups.entries()).sort(([a], [b]) => {
      if (a === "#") return 1;
      if (b === "#") return -1;
      return a.localeCompare(b);
    });
  }, [brands]);

  return (
    <div dir="rtl" className="min-h-screen bg-white text-[#0E0E0E]">
      <Navbar />
      <CartDrawer />

      <main>
        <section className="border-b border-[#E7E2D9] bg-[#FAF9F6]">
          <div className="mx-auto max-w-[1500px] px-4 py-10 md:px-6 md:py-16">
            <div className="grid gap-8 md:grid-cols-[1fr_260px] md:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <span className="h-px w-10 bg-[#D8C29A]" />
                  <span className="text-[7px] font-semibold tracking-[.3em] text-[#9A825B]">GENAN / BRAND INDEX</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[#A9D8D3]" />
                </div>

                <h1 className="mt-5 max-w-[760px] text-[34px] font-medium leading-[1.2] tracking-[-.045em] md:text-[58px]">
                  ماركات نختارها لأن التفاصيل تصنع الفرق.
                </h1>
              </div>

              <div className="border-t border-[#D9D2C8] pt-4 md:border-r md:border-t-0 md:pr-6 md:pt-0">
                <span className="block text-[7px] tracking-[.18em] text-[#9A825B]">TOTAL BRANDS</span>
                <span className="mt-2 block text-[40px] font-medium leading-none md:text-[48px]">{brands.length}</span>
                <p className="mt-2 text-[8px] leading-5 text-[#777]">تصفح العلامات واختر ما يناسب أسلوبك.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1500px] px-4 py-8 md:px-6 md:py-14">
          {isLoading ? (
            <div className="space-y-8">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="grid gap-4 border-t border-[#E7E2D9] pt-5 md:grid-cols-[80px_1fr]">
                  <div className="h-10 w-10 animate-pulse bg-[#F2EFE9]" />
                  <div className="grid grid-cols-2 gap-px bg-[#E7E2D9] md:grid-cols-3 lg:grid-cols-4">
                    {Array.from({ length: 4 }).map((__, item) => (
                      <div key={item} className="h-28 animate-pulse bg-[#F7F5F0]" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-10 md:space-y-14">
              {groupedBrands.map(([letter, group]) => (
                <section key={letter} className="grid gap-4 border-t border-[#E7E2D9] pt-5 md:grid-cols-[80px_1fr] md:gap-8">
                  <div className="md:sticky md:top-[98px] md:self-start">
                    <span className="text-[30px] font-medium leading-none text-[#D8C29A] md:text-[36px]">{letter}</span>
                  </div>

                  <div className="grid grid-cols-2 border-r border-t border-[#E7E2D9] md:grid-cols-3 lg:grid-cols-4">
                    {group.map((brand) => (
                      <Link
                        key={brand.id}
                        to={`/brands/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, "-")}`}
                        className="group relative min-h-[120px] border-b border-l border-[#E7E2D9] bg-white p-4 transition-colors hover:bg-[#FBF8F1] md:min-h-[150px] md:p-5"
                      >
                        <div className="flex h-full flex-col justify-between">
                          <span className="text-[7px] tracking-[.18em] text-[#9A825B]">GENAN SELECT</span>

                          <div>
                            <h2 className="truncate text-[16px] font-medium tracking-[.02em] text-[#0E0E0E] md:text-[19px]">
                              {brand.name}
                            </h2>
                            {brand.description && (
                              <p className="mt-2 line-clamp-2 text-[8px] leading-5 text-[#777]">
                                {brand.description}
                              </p>
                            )}
                          </div>
                        </div>

                        <ArrowUpLeft className="absolute bottom-4 left-4 h-3.5 w-3.5 text-[#9A825B] transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" />
                      </Link>
                    ))}
                  </div>
                </section>
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

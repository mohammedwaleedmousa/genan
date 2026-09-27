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
    queryKey: ["genan-all-brands-v3"],
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

  const groupedBrands = useMemo(() => {
    const groups = new Map<string, Brand[]>();

    filteredBrands.forEach((brand) => {
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
  }, [filteredBrands]);

  const alphabet = useMemo(
    () => groupedBrands.map(([letter]) => letter),
    [groupedBrands],
  );

  return (
    <div dir="rtl" className="min-h-screen bg-white text-[#171717]">
      <Navbar />
      <CartDrawer />

      <main>
        <section className="border-b border-[#EEEAE3] bg-white">
          <div className="mx-auto max-w-[1500px] px-4 py-10 md:px-6 md:py-14">
            <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[8px] font-medium tracking-[.2em] text-[#9A825B]">GENAN / BRANDS</p>
                <h1 className="mt-3 text-[34px] font-semibold tracking-[-.04em] md:text-[54px]">
                  الماركات
                </h1>
                <p className="mt-3 max-w-[520px] text-[10px] leading-6 text-[#77716A] md:text-[11px]">
                  تصفح جميع العلامات المتوفرة في جنان، وابحث مباشرة عن الماركة التي تريدها.
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

                <div className="mt-2 flex items-center justify-between px-1 text-[8px] text-[#8A847C]">
                  <span>{filteredBrands.length} ماركة</span>
                  {query && <span>نتائج البحث</span>}
                </div>
              </div>
            </div>
          </div>
        </section>

        {alphabet.length > 0 && (
          <section className="border-b border-[#EEEAE3] bg-white">
            <div className="mx-auto flex max-w-[1500px] gap-1.5 overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:px-6">
              {alphabet.map((letter) => (
                <a
                  key={letter}
                  href={`#brand-letter-${letter}`}
                  className="flex h-8 min-w-8 shrink-0 items-center justify-center rounded-lg border border-[#E8E3DB] bg-white px-2 text-[9px] font-semibold text-[#5F5A53] transition-colors hover:border-[#CDB98F] hover:text-[#171717]"
                >
                  {letter}
                </a>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-[1500px] px-4 py-8 md:px-6 md:py-12">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 12 }).map((_, index) => (
                <div key={index} className="h-[92px] animate-pulse rounded-xl bg-[#F5F3EF]" />
              ))}
            </div>
          ) : groupedBrands.length === 0 ? (
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
            <div className="space-y-10 md:space-y-12">
              {groupedBrands.map(([letter, group]) => (
                <section
                  key={letter}
                  id={`brand-letter-${letter}`}
                  className="scroll-mt-24"
                >
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-[24px] font-semibold text-[#171717]">{letter}</span>
                    <span className="h-px flex-1 bg-[#EEEAE3]" />
                    <span className="text-[8px] text-[#9A958E]">{group.length}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-3 lg:grid-cols-4">
                    {group.map((brand) => (
                      <Link
                        key={brand.id}
                        to={`/brands/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, "-")}`}
                        className="group flex min-h-[92px] items-center justify-between rounded-xl border border-[#E8E3DB] bg-white px-4 py-4 transition-colors hover:border-[#CDB98F] hover:bg-[#FCFAF6] md:min-h-[104px] md:px-5"
                      >
                        <div className="min-w-0">
                          <h2 className="truncate text-[14px] font-semibold text-[#171717] md:text-[16px]">
                            {brand.name}
                          </h2>
                          {brand.description && (
                            <p className="mt-1.5 line-clamp-1 text-[8px] text-[#8A847C] md:text-[9px]">
                              {brand.description}
                            </p>
                          )}
                        </div>

                        <ArrowUpLeft className="h-4 w-4 shrink-0 text-[#A18A61] transition-transform group-hover:-translate-x-0.5 group-hover:-translate-y-0.5" />
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

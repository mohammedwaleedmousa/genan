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
    queryKey: ["genan-all-brands-v1"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id,name,slug,description")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
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
        <section className="border-b border-[#EAEAEA] bg-[#0E0E0E] px-5 py-14 text-white sm:px-8 md:px-[6vw] md:py-20">
          <div className="mx-auto max-w-[1760px]">
            <div className="mb-4 flex items-center gap-3">
              <span className="h-px w-12 bg-[#D8C29A]" />
              <span className="text-[8px] font-semibold tracking-[.34em] text-[#D8C29A]">GENAN / BRANDS</span>
            </div>
            <h1 className="max-w-[820px] text-[42px] font-medium leading-[1.25] tracking-[-.055em] sm:text-[54px] md:text-[72px]">
              ماركات نختارها بعناية لأسلوبك.
            </h1>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 md:px-[5vw] md:py-20">
          <div className="mx-auto max-w-[1760px]">
            {isLoading ? (
              <div className="grid grid-cols-2 gap-px bg-[#EAEAEA] md:grid-cols-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="h-[220px] animate-pulse bg-[#F5F5F5]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 border-r border-t border-[#EAEAEA] md:grid-cols-4">
                {brands.map((brand, index) => (
                  <Link
                    key={brand.id}
                    to={`/brands/${brand.slug || brand.name.toLowerCase().replace(/\s+/g, "-")}`}
                    className="group relative flex min-h-[220px] flex-col justify-between border-b border-l border-[#EAEAEA] bg-white p-5 transition-all duration-200 hover:bg-[#FBF8F1] md:min-h-[280px] md:p-7"
                  >
                    <span className="text-[8px] font-semibold tracking-[.28em] text-[#A9D8D3]">{String(index + 1).padStart(2, "0")}</span>
                    <div>
                      <h2 className="text-[20px] font-medium tracking-[.04em] text-[#0E0E0E] md:text-[25px]">{brand.name}</h2>
                      {brand.description && <p className="mt-2 line-clamp-2 text-[9px] leading-6 text-[#777]">{brand.description}</p>}
                    </div>
                    <ArrowUpLeft className="absolute bottom-5 left-5 h-4 w-4 text-[#D8C29A] transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1 md:bottom-7 md:left-7" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default AllBrandsPage;

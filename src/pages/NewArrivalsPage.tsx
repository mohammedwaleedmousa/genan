import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";

import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CARD_SELECT, mapProductCard } from "@/lib/productCardData";
import { useSiteContent, getSiteText } from "@/hooks/useSiteContent";

const PAGE_SIZE = 20;

const NewArrivalsPage = () => {
  const { data: content } = useSiteContent("new_arrivals_");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const { data, isLoading, isFetching } = useQuery({
    queryKey: ["new-arrivals", visibleCount],
    queryFn: async () => {
      const { data: rows, error, count } = await supabase
        .from("products")
        .select(PRODUCT_CARD_SELECT, { count: "exact" })
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(visibleCount);

      if (error) throw error;

      return {
        products: (rows || []).map(mapProductCard),
        total: count || 0,
      };
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 20 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    placeholderData: (previous) => previous,
  });

  const products = data?.products || [];
  const total = data?.total || 0;
  const hasMore = products.length < total;

  return (
    <div className="min-h-screen bg-white text-[#0E0E0E]" dir="rtl">
      <Navbar />
      <CartDrawer />

      <main>
        <section className="border-b border-[#E7E2D9] bg-white">
          <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-10 md:grid-cols-[1fr_280px] md:px-6 md:py-16">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-[#D8C29A]" />
                <span className="text-[7px] font-semibold tracking-[.3em] text-[#9A825B]">
                  {getSiteText(content, "new_arrivals_eyebrow", "NEW ARRIVALS")}
                </span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#A9D8D3]" />
              </div>

              <h1 className="mt-5 max-w-[720px] text-[34px] font-medium leading-[1.18] tracking-[-.045em] md:text-[58px]">
                وصل حديثًا إلى جنان.
              </h1>

              <p className="mt-4 max-w-[520px] text-[10px] leading-7 text-[#6F6A63] md:text-[11px]">
                أحدث القطع التي وصلت إلى المتجر، مرتبة من الأحدث لتكتشف كل جديد أولًا.
              </p>
            </div>

            <div className="flex items-end justify-between border-t border-[#E7E2D9] pt-5 md:flex-col md:items-start md:justify-end md:border-r md:border-t-0 md:pr-7 md:pt-0">
              <span className="text-[7px] font-semibold tracking-[.2em] text-[#9A825B]">CURRENT EDIT</span>
              <div className="mt-2">
                <span className="text-[38px] font-medium leading-none text-[#0E0E0E] md:text-[52px]">
                  {String(total).padStart(2, "0")}
                </span>
                <span className="mr-2 text-[8px] text-[#777]">قطعة جديدة</span>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1500px] px-3 py-7 md:px-6 md:py-12">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-6 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
              {Array.from({ length: 10 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex min-h-[48vh] flex-col items-center justify-center border-y border-[#E7E2D9] px-5 text-center">
              <span className="text-[7px] font-semibold tracking-[.26em] text-[#9A825B]">GENAN / NEW</span>
              <h2 className="mt-3 text-[18px] font-semibold">لا توجد إضافات جديدة حاليًا</h2>
              <p className="mt-2 max-w-[280px] text-[9px] leading-6 text-[#777]">
                ستظهر هنا أحدث القطع فور إضافتها إلى المتجر.
              </p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className={index === 0 ? "col-span-2 md:col-span-2" : "min-w-0"}
                  >
                    {index === 0 && (
                      <div className="mb-3 flex items-center justify-between border-b border-[#E7E2D9] pb-2">
                        <span className="text-[7px] font-semibold tracking-[.22em] text-[#9A825B]">LATEST DROP</span>
                        <span className="text-[7px] text-[#777]">01</span>
                      </div>
                    )}
                    <ProductCard product={product} index={index} badge={index < 6 ? "NEW IN" : undefined} />
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-10">
                  <button
                    type="button"
                    disabled={isFetching}
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="flex h-11 min-w-[160px] items-center justify-center gap-2 border-b border-[#D8C29A] px-6 text-[9px] font-semibold text-[#0E0E0E] disabled:opacity-50"
                  >
                    {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {isFetching ? "جارٍ التحميل" : "عرض المزيد"}
                    {!isFetching && <ArrowLeft className="h-3.5 w-3.5" />}
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NewArrivalsPage;

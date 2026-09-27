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
        <section className="border-b border-[#EEEAE3] bg-white">
          <div className="mx-auto max-w-[1500px] px-4 py-10 md:px-6 md:py-14">
            <div className="flex flex-col gap-7 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[8px] font-medium tracking-[.2em] text-[#9A825B]">
                  {getSiteText(content, "new_arrivals_eyebrow", "NEW ARRIVALS")}
                </p>

                <h1 className="mt-3 text-[34px] font-semibold tracking-[-.04em] text-[#171717] md:text-[54px]">
                  وصل حديثًا
                </h1>

                <p className="mt-3 max-w-[540px] text-[10px] leading-6 text-[#77716A] md:text-[11px]">
                  أحدث المنتجات المضافة إلى جنان، مرتبة من الأحدث إلى الأقدم.
                </p>
              </div>

              <div className="flex min-w-[220px] items-center justify-between rounded-xl border border-[#E8E3DB] bg-[#FCFAF6] px-4 py-4 md:px-5">
                <div>
                  <p className="text-[8px] font-medium text-[#8A847C]">الإضافات الجديدة</p>
                  <p className="mt-1 text-[9px] text-[#9A958E]">يتم تحديثها تلقائيًا</p>
                </div>

                <div className="text-left">
                  <span className="block text-[28px] font-semibold leading-none text-[#171717] md:text-[32px]">
                    {total}
                  </span>
                  <span className="mt-1 block text-[8px] text-[#8A847C]">منتج</span>
                </div>
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
              <div className="mb-6 flex items-center justify-between border-b border-[#EEEAE3] pb-3 md:mb-8">
                <div>
                  <h2 className="text-[14px] font-semibold text-[#171717] md:text-[16px]">أحدث الإضافات</h2>
                  <p className="mt-1 text-[8px] text-[#8A847C]">الأحدث يظهر أولًا</p>
                </div>
                <span className="text-[8px] text-[#8A847C]">{products.length} من {total}</span>
              </div>

              <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                {products.map((product, index) => (
                  <div key={product.id} className="min-w-0">
                    <ProductCard product={product} index={index} badge={index < 6 ? "NEW" : undefined} />
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-10">
                  <button
                    type="button"
                    disabled={isFetching}
                    onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
                    className="flex h-11 min-w-[160px] items-center justify-center gap-2 rounded-xl border border-[#E1DCD4] bg-white px-6 text-[9px] font-semibold text-[#171717] transition-colors hover:border-[#CDB98F] disabled:opacity-50"
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

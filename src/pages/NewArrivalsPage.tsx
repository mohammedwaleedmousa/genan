import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Sparkles } from "lucide-react";

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
    <div className="min-h-screen bg-[#FAF9F7] text-[#302725]" dir="rtl">
      <Navbar />
      <CartDrawer />

      <main className="space-y-4 px-3 pb-20 pt-4 sm:px-5 md:px-7 md:pt-24">
        <section className="mx-auto w-full max-w-[1500px] overflow-hidden rounded-3xl bg-[#F6F3EA]">
          <div className="mx-auto w-full max-w-[1500px] px-4 pb-5 pt-6 md:px-6 md:pb-7 md:pt-8">
            <div className="flex items-end justify-between gap-5">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="h-[2px] w-4 rounded-full bg-[#0E0E0E]" />
                  <span className="font-serif text-[7px] tracking-[0.25em] text-[#9A825B]">{getSiteText(content, "new_arrivals_eyebrow", "NEW ARRIVALS")}</span>
                </div>
                <h1 className="text-[25px] font-semibold leading-tight tracking-[-0.035em] text-[#403131] md:text-[36px]">وصل حديثًا</h1>
                <p className="mt-1.5 max-w-[275px] text-[8px] leading-5 text-[#899289] md:max-w-md md:text-[10px]">أحدث القطع المضافة إلى جنان.</p>
              </div>
              {!isLoading && total > 0 && (
                <div className="shrink-0 text-left">
                  <span className="block text-[18px] font-semibold leading-none text-[#9A825B] md:text-[22px]">{total}</span>
                  <span className="mt-1 block text-[7px] text-[#929A92]">منتج جديد</span>
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1500px] rounded-3xl bg-white shadow-sm">
          <div className="mx-auto flex h-[42px] w-full max-w-[1500px] items-center justify-between px-3 md:h-[46px] md:px-6">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 stroke-[1.5] text-[#D8C29A]" />
              <span className="text-[8px] font-medium text-[#755F5E] md:text-[9px]">أحدث الإضافات</span>
            </div>
            <span className="text-[7px] text-[#A89B95] md:text-[8px]">الأحدث أولًا</span>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[1500px] rounded-3xl bg-white px-3 py-5 shadow-sm sm:px-5 md:px-6 md:py-7">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:gap-x-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
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
              <div className="grid grid-cols-2 gap-x-2.5 gap-y-5 sm:gap-x-3 sm:gap-y-6 md:grid-cols-3 md:gap-x-5 md:gap-y-8 lg:grid-cols-4 xl:grid-cols-5">
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
                    className="flex h-11 min-w-[150px] items-center justify-center gap-2 rounded-full border border-[#D4C9B3] bg-white px-6 text-[9px] font-semibold text-[#0E0E0E] disabled:opacity-50"
                  >
                    {isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    {isFetching ? "جارٍ التحميل" : "عرض المزيد"}
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

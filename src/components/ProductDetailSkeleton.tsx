import { Skeleton } from "@/components/ui/skeleton";
import Navbar from "@/components/Navbar";

const ProductDetailSkeleton = () => (
  <div className="min-h-screen bg-white" dir="rtl">
    <div className="hidden md:block">
      <Navbar />
    </div>

    <header className="sticky top-0 z-50 flex h-[58px] items-center justify-between border-b border-[#E7E2D9] bg-white px-3 md:hidden">
      <Skeleton className="h-8 w-8 rounded-none bg-[#F1EEE8]" />
      <Skeleton className="absolute left-1/2 top-1/2 h-5 w-24 -translate-x-1/2 -translate-y-1/2 rounded-none bg-[#ECE8E1]" />
      <div className="flex gap-1">
        <Skeleton className="h-8 w-8 rounded-none bg-[#F1EEE8]" />
        <Skeleton className="h-8 w-8 rounded-none bg-[#F1EEE8]" />
        <Skeleton className="h-8 w-8 rounded-none bg-[#F1EEE8]" />
      </div>
    </header>

    <main className="pb-[82px] md:pb-16">
      <div className="mx-auto w-full max-w-[1600px] md:px-7 lg:px-10">
        <div className="grid grid-cols-1 bg-white lg:grid-cols-[minmax(0,1.12fr)_minmax(390px,.88fr)] lg:gap-8">
          <section className="bg-[#F7F7F7]">
            <Skeleton className="h-[56svh] min-h-[380px] w-full rounded-none bg-[#EFEDE8] md:aspect-[4/5] md:h-auto md:min-h-0" />
            <div className="flex gap-2 border-b border-[#E7E2D9] bg-white px-3 py-3">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton key={index} className="h-14 w-14 shrink-0 rounded-none bg-[#F1EEE8]" />
              ))}
            </div>
          </section>

          <section className="bg-white lg:border-r lg:border-[#E7E2D9] lg:px-8 lg:py-2">
            <div className="border-b border-[#E7E2D9] px-4 py-5 lg:px-0">
              <Skeleton className="h-2 w-28 rounded-none bg-[#D8C29A]/45" />
              <Skeleton className="mt-4 h-6 w-[80%] rounded-none bg-[#ECE8E1]" />
              <Skeleton className="mt-2 h-6 w-[55%] rounded-none bg-[#F1EEE8]" />
              <Skeleton className="mt-4 h-3 w-[88%] rounded-none bg-[#F1EEE8]" />
              <Skeleton className="mt-2 h-3 w-[68%] rounded-none bg-[#F1EEE8]" />
              <Skeleton className="mt-5 h-7 w-28 rounded-none bg-[#E7E2D9]" />
            </div>

            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="border-b border-[#E7E2D9] px-4 py-4 lg:px-0">
                <Skeleton className="h-2.5 w-20 rounded-none bg-[#ECE8E1]" />
                <div className="mt-3 flex gap-2">
                  <Skeleton className="h-9 w-16 rounded-none bg-[#F1EEE8]" />
                  <Skeleton className="h-9 w-16 rounded-none bg-[#F1EEE8]" />
                  <Skeleton className="h-9 w-16 rounded-none bg-[#F1EEE8]" />
                </div>
              </div>
            ))}

            <div className="hidden gap-2 border-t border-[#E7E2D9] pt-5 lg:flex">
              <Skeleton className="h-12 flex-1 rounded-none bg-[#F1EEE8]" />
              <Skeleton className="h-12 flex-1 rounded-none bg-[#111111]" />
            </div>
          </section>
        </div>

        <div className="mt-10 border-t border-[#E7E2D9] pt-8">
          <Skeleton className="h-3 w-32 rounded-none bg-[#D8C29A]/40" />
          <Skeleton className="mt-3 h-5 w-40 rounded-none bg-[#ECE8E1]" />
          <Skeleton className="mt-3 h-2.5 w-64 rounded-none bg-[#F1EEE8]" />

          <div className="mt-8 grid gap-10 md:grid-cols-2 md:gap-12">
            {[0, 1].map((column) => (
              <section key={column} className={column === 1 ? "md:border-r md:border-[#E7E2D9] md:pr-10" : ""}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Skeleton className="h-2 w-20 rounded-none bg-[#D8C29A]/45" />
                    <Skeleton className="mt-3 h-5 w-32 rounded-none bg-[#ECE8E1]" />
                    <Skeleton className="mt-2 h-2.5 w-48 rounded-none bg-[#F1EEE8]" />
                  </div>
                  <Skeleton className="h-9 w-24 rounded-none bg-[#0E0E0E]/85" />
                </div>

                <div className="mt-5 border-y border-[#E7E2D9] py-6">
                  <Skeleton className="mx-auto h-5 w-5 rounded-full bg-[#D8C29A]/55" />
                  <Skeleton className="mx-auto mt-3 h-3 w-32 rounded-none bg-[#ECE8E1]" />
                  <Skeleton className="mx-auto mt-2 h-2.5 w-52 rounded-none bg-[#F1EEE8]" />
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>

    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-[#E7E2D9] bg-white px-2.5 pt-2 lg:hidden" style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}>
      <div className="flex h-[49px] gap-2">
        <Skeleton className="h-full flex-1 rounded-none bg-[#F1EEE8]" />
        <Skeleton className="h-full flex-1 rounded-none bg-[#111111]" />
      </div>
    </div>
  </div>
);

export default ProductDetailSkeleton;

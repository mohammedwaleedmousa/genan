import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import { storefrontCategoriesQuery } from "@/lib/storefrontCatalogQueries";
import { optimizeImage } from "@/lib/imageUrl";

const CategoriesPage = () => {
  const { data: categories = [], isLoading } = useQuery(storefrontCategoriesQuery);

  return (
    <div dir="rtl" className="min-h-screen bg-[#FAF9F7] text-[#0E0E0E]">
      <Navbar />
      <CartDrawer />

      <main className="space-y-4 px-3 pb-12 pt-4 sm:px-5 sm:pt-7 lg:px-7">
        <section className="mx-auto max-w-[1760px] rounded-3xl bg-white px-5 py-10 shadow-sm sm:px-8 md:px-[6vw] md:py-16">
          <div className="mx-auto grid max-w-[1760px] gap-8 md:grid-cols-[1.2fr_.8fr] md:items-end">
            <div>
              <div className="mb-4 flex items-center gap-3">
                <span className="h-px w-12 bg-[#D8C29A]" />
                <span className="text-[8px] font-semibold tracking-[.34em] text-[#9A825B]">GENAN / CATEGORIES</span>
              </div>
              <h1 className="max-w-[800px] text-[40px] font-medium leading-[1.25] tracking-[-.055em] sm:text-[52px] md:text-[70px]">
                كل ما تحب، في مكانه.
              </h1>
            </div>
            <p className="max-w-[460px] text-[11px] leading-8 text-[#707070] md:text-[13px]">
              تصفّحي أقسام المتجر واكتشفي التشكيلة المتاحة.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1760px] rounded-3xl bg-white px-3 py-7 shadow-sm sm:px-6 sm:py-10 md:px-[5vw] md:py-14">
          <div className="mx-auto max-w-[1760px]">
            {isLoading ? (
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className="aspect-[4/5] animate-pulse bg-[#F3F3F3]" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-2 md:gap-4">
                {categories.map((category, index) => (
                  <Link
                    key={category.id}
                    to={`/products?category=${category.slug}`}
                    className="group min-w-0"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden border border-[#EAEAEA] bg-[#F7F7F7]">
                      {category.image_url ? (
                        <img
                          src={optimizeImage(category.image_url, 520, 82)}
                          alt={category.name_ar}
                          loading={index < 8 ? "eager" : "lazy"}
                          decoding="async"
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.025]"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-[#F3F3F3]" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/48 via-transparent to-transparent" />
                      <span className="absolute left-2 top-2 text-[6px] font-semibold tracking-[.18em] text-[#A9D8D3] md:left-3 md:top-3 md:text-[7px]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div className="absolute inset-x-0 bottom-0 p-2 md:p-3">
                        <h2 className="truncate text-[10px] font-semibold text-white md:text-[14px]">{category.name_ar}</h2>
                      </div>
                    </div>
                    <p className="mt-1 truncate text-center text-[6px] tracking-[.08em] text-[#9A825B] md:text-[8px]">{category.name}</p>
                  </Link>
                ))}
              </div>
            )}

            <div className="mt-10 flex justify-center">
              <Link
                to="/products"
                className="inline-flex h-11 items-center gap-2.5 rounded-xl bg-burgundy px-6 text-[10px] font-semibold text-white transition-colors hover:bg-burgundy-hover"
              >
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

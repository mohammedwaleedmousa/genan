import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Check, ChevronDown, Heart, Plus, ShoppingBag } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ProductCard from "@/components/ProductCard";

import { useFavorites } from "@/hooks/useFavorites";
import { useStore } from "@/store/useStore";
import { useSiteContent, getSiteText, formatSiteText } from "@/hooks/useSiteContent";
import { toast } from "@/hooks/use-toast";

type SortOption = "newest" | "priceLow" | "priceHigh" | "name";

const sortOptions: { value: SortOption; label: string; description: string }[] = [
  { value: "newest", label: "الأحدث", description: "الأحدث إضافة للمفضلة" },
  { value: "priceLow", label: "الأقل سعرًا", description: "من السعر الأقل للأعلى" },
  { value: "priceHigh", label: "الأعلى سعرًا", description: "من السعر الأعلى للأقل" },
  { value: "name", label: "الاسم", description: "ترتيب أبجدي" },
];

const FavoritesPage = () => {
  const { favorites } = useFavorites();
  const { addToCart } = useStore();
  const { data: content } = useSiteContent("favorites_");

  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement | null>(null);

  const heroCountTemplate = getSiteText(
    content,
    "favorites_hero_with_count",
    "لديك {count} منتج في قائمة المفضلة",
  );

  const heroText =
    favorites.length > 0
      ? formatSiteText(heroCountTemplate, { count: favorites.length })
      : getSiteText(content, "favorites_hero_empty", "لم تقم بإضافة أي منتجات للمفضلة بعد");

  const sortedFavorites = useMemo(() => {
    const items = [...favorites];

    if (sortBy === "priceLow") return items.sort((a, b) => a.price - b.price);
    if (sortBy === "priceHigh") return items.sort((a, b) => b.price - a.price);
    if (sortBy === "name") {
      return items.sort((a, b) => (a.nameAr || "").localeCompare(b.nameAr || "", "ar"));
    }

    return items;
  }, [favorites, sortBy]);

  const currentSort = useMemo(
    () => sortOptions.find((option) => option.value === sortBy) || sortOptions[0],
    [sortBy],
  );

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!sortRef.current) return;
      if (sortRef.current.contains(event.target as Node)) return;
      setSortOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const handleAddAllToCart = () => {
    let added = 0;
    let needsSelection = 0;
    let unavailable = 0;

    favorites.forEach((product) => {
      const colorVariants = Array.isArray(product.color_variants)
        ? product.color_variants
        : Array.isArray(product.colorVariants)
          ? product.colorVariants
          : [];

      const hasSizes = Array.isArray(product.sizes) && product.sizes.length > 0;
      const hasVariantSizes = colorVariants.some(
        (variant: any) => Array.isArray(variant?.sizes) && variant.sizes.length > 0,
      );
      const hasColorChoice = colorVariants.length > 1;

      if (!product.inStock || (typeof product.stockQuantity === "number" && product.stockQuantity <= 0)) {
        unavailable += 1;
        return;
      }

      if (hasSizes || hasVariantSizes || hasColorChoice) {
        needsSelection += 1;
        return;
      }

      addToCart(
        product,
        1,
        undefined,
        undefined,
        colorVariants[0]?.id,
        colorVariants[0]?.colorName || colorVariants[0]?.name,
      );
      added += 1;
    });

    if (added > 0) {
      toast({
        title: "تمت الإضافة للسلة",
        description: `تمت إضافة ${added} منتج إلى سلتك.`,
      });
    }

    if (needsSelection > 0) {
      toast({
        title: "اختر التفاصيل أولًا",
        description: `${needsSelection} منتج يحتاج اختيار المقاس أو اللون قبل إضافته للسلة.`,
      });
    }

    if (unavailable > 0) {
      toast({
        title: "منتجات غير متوفرة",
        description: `${unavailable} منتج غير متوفر حاليًا ولم تتم إضافته.`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#0E0E0E]" dir="rtl">
      <Navbar />
      <CartDrawer />

      <main>
        <section className="border-b border-[#E7E2D9] bg-white">
          <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-10 md:grid-cols-[1fr_260px] md:px-6 md:py-14">
            <div>
              <div className="flex items-center gap-3">
                <span className="h-px w-10 bg-[#D8C29A]" />
                <span className="text-[7px] font-semibold tracking-[.3em] text-[#9A825B]">GENAN / WISHLIST</span>
                <span className="h-1.5 w-1.5 rounded-full bg-[#A9D8D3]" />
              </div>

              <h1 className="mt-5 text-[34px] font-medium leading-[1.18] tracking-[-.045em] md:text-[54px]">
                اختيارات احتفظت بها.
              </h1>

              <p className="mt-4 max-w-[520px] text-[9px] leading-6 text-[#777] md:text-[10px]">
                {heroText}
              </p>
            </div>

            <div className="flex items-end justify-between border-t border-[#E7E2D9] pt-5 md:flex-col md:items-start md:justify-end md:border-r md:border-t-0 md:pr-7 md:pt-0">
              <Heart className="h-5 w-5 text-[#0E0E0E]" strokeWidth={1.3} />
              <div>
                <span className="text-[42px] font-medium leading-none">{String(favorites.length).padStart(2, "0")}</span>
                <span className="mr-2 text-[7px] text-[#777]">محفوظ</span>
              </div>
            </div>
          </div>
        </section>

        {favorites.length > 0 ? (
          <>
            <section className="border-b border-[#E7E2D9] bg-[#FAF9F6]">
              <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 md:px-6">
                <div className="flex items-center gap-3">
                  <span className="text-[7px] font-semibold tracking-[.2em] text-[#9A825B]">SAVED PIECES</span>
                  <span className="h-1 w-1 rounded-full bg-[#A9D8D3]" />
                  <span className="text-[8px] text-[#666]">{sortedFavorites.length} منتج</span>
                </div>

                <button
                  type="button"
                  onClick={handleAddAllToCart}
                  className="flex h-9 items-center gap-2 border-b border-[#D8C29A] px-1 text-[8px] font-semibold text-[#0E0E0E]"
                >
                  <Plus className="h-3 w-3" />
                  إضافة المتاح للسلة
                </button>
              </div>
            </section>

            <section className="mx-auto w-full max-w-[1500px] px-3 py-6 md:px-6 md:py-10">
              <div className="mb-6 flex items-center justify-between border-b border-[#E7E2D9] pb-3">
                <div>
                  <span className="text-[7px] font-semibold tracking-[.2em] text-[#9A825B]">MY EDIT</span>
                  <h2 className="mt-1 text-[18px] font-semibold">المفضلة</h2>
                </div>

                <div ref={sortRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setSortOpen((current) => !current)}
                    className="flex h-9 min-w-[116px] items-center justify-between gap-3 border-b border-[#CFC6B8] px-1 text-right"
                  >
                    <div>
                      <span className="block text-[6px] text-[#999]">ترتيب</span>
                      <span className="mt-0.5 block text-[8px] font-semibold text-[#0E0E0E]">{currentSort.label}</span>
                    </div>
                    <ChevronDown className={`h-3 w-3 transition-transform ${sortOpen ? "rotate-180" : ""}`} />
                  </button>

                  {sortOpen && (
                    <div className="absolute left-0 top-[42px] z-50 w-[205px] border border-[#E7E2D9] bg-white p-1 shadow-[0_14px_35px_rgba(14,14,14,.08)]">
                      {sortOptions.map((option) => {
                        const active = sortBy === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSortBy(option.value);
                              setSortOpen(false);
                            }}
                            className={`flex min-h-[48px] w-full items-center justify-between px-3 text-right ${
                              active ? "bg-[#FAF9F6]" : "bg-white"
                            }`}
                          >
                            <div>
                              <span className="block text-[8px] font-semibold text-[#0E0E0E]">{option.label}</span>
                              <span className="mt-1 block text-[6px] text-[#999]">{option.description}</span>
                            </div>
                            {active && <Check className="h-3 w-3 text-[#9A825B]" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-x-2.5 gap-y-7 md:grid-cols-4 md:gap-x-5 md:gap-y-10">
                {sortedFavorites.map((product, index) => (
                  <div key={product.id} className="min-w-0">
                    <ProductCard product={product} index={index} />
                  </div>
                ))}
              </div>
            </section>
          </>
        ) : (
          <section className="mx-auto flex min-h-[58vh] max-w-[1500px] items-center px-6 py-14">
            <div className="max-w-[460px] border-r-2 border-[#D8C29A] pr-5">
              <span className="text-[7px] font-semibold tracking-[.25em] text-[#9A825B]">EMPTY WISHLIST</span>
              <h2 className="mt-3 text-[26px] font-medium tracking-[-.035em]">
                {getSiteText(content, "favorites_empty_title", "قائمة المفضلة فارغة")}
              </h2>
              <p className="mt-3 text-[9px] leading-6 text-[#777]">
                {getSiteText(
                  content,
                  "favorites_empty_desc",
                  "احفظ القطع التي تعجبك لتعود إليها بسهولة في أي وقت.",
                )}
              </p>

              <Link
                to="/products"
                className="mt-6 inline-flex h-11 items-center gap-2 bg-[#0E0E0E] px-6 text-[9px] font-semibold text-white"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                {getSiteText(content, "favorites_browse_cta", "تصفح المنتجات")}
              </Link>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default FavoritesPage;

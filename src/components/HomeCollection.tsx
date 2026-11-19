import { useState } from "react";
import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

import ProductCard from "@/components/ProductCard";
import ProductCardSkeleton from "@/components/ProductCardSkeleton";
import ProductCategoryTabs from "@/components/ProductCategoryTabs";
import { supabase } from "@/integrations/supabase/client";
import { getCategoryTreeIds, type CatalogCategory } from "@/lib/categoryTree";
import { mapProductCard, PRODUCT_CARD_SELECT } from "@/lib/productCardData";
import type { Product } from "@/store/useStore";

type CollectionCategory = { slug: string; label: string };

type HomeCollectionProps = {
  categories: readonly CatalogCategory[];
  tabs: readonly CollectionCategory[];
  allProducts: UseQueryResult<Product[]>;
};

const visibleProductCount = 4;

const HomeCollection = ({ categories, tabs, allProducts }: HomeCollectionProps) => {
  const [selection, setSelection] = useState("");
  const selectedCategory = tabs.find((category) => category.slug === selection);
  const selectedSlug = selectedCategory?.slug || "";
  const categoryIds = getCategoryTreeIds(categories, selectedSlug);
  const categoryProducts = useQuery({
    queryKey: ["genan-home-collection-products", categoryIds],
    enabled: categoryIds.length > 0,
    queryFn: async ({ signal }) => {
      const { data, error } = await supabase
        .from("products")
        .select(PRODUCT_CARD_SELECT)
        .eq("is_active", true)
        .eq("in_stock", true)
        .in("category_id", categoryIds)
        .order("created_at", { ascending: false })
        .limit(visibleProductCount + 1)
        .abortSignal(signal);

      if (error) throw error;
      return (data || []).map(mapProductCard);
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: products = [], isLoading, isError, refetch } = selectedSlug ? categoryProducts : allProducts;
  const allProductsLink = selectedSlug ? `/products?category=${encodeURIComponent(selectedSlug)}` : "/products";

  return (
    <section aria-labelledby="home-collection-title" className="bg-white py-6 sm:py-8 lg:py-10" dir="rtl">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3 sm:gap-5">
          <span aria-hidden="true" className="h-px w-10 bg-[#D8C29A] sm:w-20" />
          <h2 id="home-collection-title" className="text-center text-2xl font-medium text-[#231C1C] sm:text-3xl md:text-4xl">تشكيلتنا</h2>
          <span aria-hidden="true" className="h-px w-10 bg-[#D8C29A] sm:w-20" />
        </div>

        <div className="mb-4 mt-3 sm:mb-5 sm:mt-4">
          <ProductCategoryTabs categories={tabs} selectedSlug={selectedSlug} onSelect={setSelection} />
        </div>
      </div>

      <div className="product-grid-container">
        <div aria-busy={isLoading} aria-live="polite">
          {isLoading ? (
            <div className="product-card-grid" aria-label="جاري تحميل المنتجات">
              {Array.from({ length: visibleProductCount }, (_, index) => (
                <ProductCardSkeleton key={index} />
              ))}
            </div>
          ) : isError && products.length === 0 ? (
            <div className="rounded-2xl bg-[#FAF6F2] px-4 py-8 text-center text-sm text-[#5E4B47]">
              <p>تعذّر تحميل المنتجات.</p>
              <button type="button" onClick={() => void refetch()} className="mt-3 rounded-full border border-burgundy px-4 py-1.5 text-burgundy">إعادة المحاولة</button>
            </div>
          ) : products.length > 0 ? (
            <div className="product-card-grid">
              {products.slice(0, visibleProductCount).map((product, index) => (
                <ProductCard key={product.id} product={product} index={index + 2} />
              ))}
            </div>
          ) : (
            <p className="rounded-2xl bg-[#FAF6F2] px-4 py-8 text-center text-sm text-[#5E4B47]">
              {selectedCategory ? `لا توجد منتجات متاحة في قسم ${selectedCategory.label} حاليًا.` : "لا توجد منتجات متاحة حاليًا."}
            </p>
          )}
        </div>

        {products.length > visibleProductCount && (
          <div className="mt-5 flex justify-center">
            <Link to={allProductsLink} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-burgundy px-5 text-xs font-semibold text-burgundy transition-colors hover:bg-burgundy-soft">
              {selectedCategory ? "عرض كل منتجات القسم" : "عرض كل المنتجات"}
              <ArrowLeft aria-hidden="true" className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
};

export default HomeCollection;

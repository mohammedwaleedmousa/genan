import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import HeroSlider from "@/components/HeroSlider";
import BrandsStrip from "@/components/BrandsStrip";
import GenanServices from "@/components/GenanServices";
import HomeManagedSections from "@/components/HomeManagedSections";

import { supabase } from "@/integrations/supabase/client";
import { useNearViewport } from "@/hooks/useNearViewport";
import { useCustomerExperience } from "@/hooks/useCustomerExperience";
import { optimizeImage } from "@/lib/imageUrl";

type FeaturedCategoryItem = {
  title: string;
  subtitle: string;
  image: string;
  link: string;
};

const isLingerieCategory = (category: { slug?: string | null; name?: string | null; name_ar?: string | null }) => {
  const value = `${category.slug || ""} ${category.name || ""} ${category.name_ar || ""}`
    .toLowerCase()
    .replace(/[أإآ]/g, "ا")
    .replace(/\s+/g, " ");
  return /lingerie|لانجري|لانجيري|لانجيرى|ملابس داخليه|ملابس داخلية/.test(value);
};

const CategoryCarousel = ({ items, loading = false }: { items: FeaturedCategoryItem[]; loading?: boolean }) => {
  if (!loading && items.length === 0) return null;

  const featured = items.slice(0, 4);

  return (
    <section className="w-full overflow-hidden bg-white py-4 sm:py-5 lg:py-6" dir="rtl" aria-label="الأقسام">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        <div className="mb-3 flex items-center justify-between gap-3 sm:mb-4">
          <div className="min-w-0">
            <span className="mb-0.5 block font-serif text-[8px] uppercase tracking-[0.2em] text-[#9B7A46]">GENAN / CATEGORIES</span>
            <h2 className="text-[16px] font-semibold leading-6 text-[#0E0E0E] sm:text-[19px]">تسوقي حسب القسم</h2>
          </div>
          <Link to="/categories" className="inline-flex shrink-0 items-center gap-1 text-[10px] font-medium text-[#8C6B32] transition-opacity hover:opacity-70">
            جميع الأقسام
            <ArrowLeft aria-hidden="true" className="h-3 w-3" strokeWidth={1.6} />
          </Link>
        </div>

        <div className="-mx-4 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden sm:-mx-6 sm:px-6 lg:mx-0 lg:overflow-visible lg:px-0">
          <div className="flex w-max flex-nowrap items-start gap-2.5 snap-x snap-proximity sm:gap-3 lg:w-full lg:justify-between lg:gap-4 lg:snap-none">
            {loading
              ? Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} aria-hidden="true" className="w-[68px] shrink-0 snap-start sm:w-[78px] md:w-[86px] lg:w-[94px] xl:w-[100px]">
                    <div className="aspect-square w-full animate-pulse rounded-[9px] bg-[#F0F0F0]" />
                    <div className="mx-auto mt-1.5 h-2 w-4/5 animate-pulse rounded-full bg-[#EFEFEF]" />
                  </div>
                ))
              : featured.map((item, index) => (
                  <Link
                    key={item.link}
                    to={item.link}
                    className="group block w-[68px] shrink-0 snap-start select-none sm:w-[78px] md:w-[86px] lg:w-[94px] xl:w-[100px]"
                  >
                    <div className="relative aspect-square w-full overflow-hidden rounded-[9px] bg-[#F5F3F0] ring-1 ring-[#EEEAE4] ring-inset">
                      <img
                        src={optimizeImage(item.image, 240, 77)}
                        alt={item.title}
                        loading={index < 3 ? "eager" : "lazy"}
                        decoding="async"
                        width={200}
                        height={200}
                        className="h-full w-full object-cover object-center transition-transform duration-300 group-hover:scale-[1.06]"
                      />
                    </div>
                    <p className="mt-1.5 truncate text-center text-[10px] font-medium leading-4 text-[#0E0E0E] transition-colors group-hover:text-[#8C6B32] sm:text-[11px]">
                      {item.title}
                    </p>
                  </Link>
                ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const HomePage = () => {
  const { data: customerExperience } = useCustomerExperience();
  const showHomeSection = (section: string) => customerExperience?.homeSections[section] !== false;

  const { data: categories = [], isLoading: categoriesLoading } = useQuery({
    queryKey: ["categories-all-active-v4"],
    queryFn: async () => {
      const { data, error } = await supabase.from("categories").select("id,slug,name,name_ar,parent_id,image_url,sort_order").eq("is_active", true).order("sort_order", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const featuredCategories = useMemo<FeaturedCategoryItem[]>(() => {
    const primaryCategories = categories.filter((category: any) => !category.parent_id && !isLingerieCategory(category));
    const requested = [
      { title: "أحذية", slug: "shoes", pattern: /shoes?|footwear|sneakers?|heels?|احذيه|احذية|حذاء|جزم/ },
      { title: "شنط", slug: "bags", pattern: /bags?|handbags?|purses?|شنط|شنطة|شنطه|حقائب|حقيبة/ },
      { title: "إكسسوارات", slug: "accessories", pattern: /accessor|اكسسوار|إكسسوار|اكسسوارات|إكسسوارات/ },
      { title: "هوم", slug: "home", pattern: /home|homedecor|homeware|منزل|منزلي|ديكور|هوم/ },
    ];
    return requested.map(({ title, slug, pattern }) => {
      const match = primaryCategories.find((category: any) => {
        const searchable = `${category.slug || ""} ${category.name || ""} ${category.name_ar || ""}`
          .toLowerCase().replace(/[أإآ]/g, "ا");
        return pattern.test(searchable);
      });
      return {
        title,
        subtitle: match?.name || title,
        image: match?.image_url || "/placeholder.svg",
        link: `/categories?parent=${encodeURIComponent(match?.slug || slug)}`,
      };
    });
  }, [categories]);

  const brandsViewport = useNearViewport<HTMLDivElement>("120px");
  const imageBanner = showHomeSection("services") ? <GenanServices /> : null;
  const brandsSection = showHomeSection("brands") ? (
    <div ref={brandsViewport.ref} className="bg-white" style={{ minHeight: 92 }}><BrandsStrip enabled={brandsViewport.isNearViewport} /></div>
  ) : null;

  return (
    <div className="relative min-h-screen bg-background" dir="rtl">
      <Navbar overlayHero={showHomeSection("hero")} /><CartDrawer />
      <main id="main-content" className="overflow-hidden bg-background">
        {showHomeSection("hero") && <HeroSlider />}
        {showHomeSection("categories") && <CategoryCarousel items={featuredCategories} loading={categoriesLoading} />}
        <HomeManagedSections betweenSections={imageBanner} brandsSection={brandsSection} />
      </main>
      <Footer />
    </div>
  );
};

export default HomePage;

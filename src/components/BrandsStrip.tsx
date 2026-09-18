import { useLayoutEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { optimizeImage } from "@/lib/imageUrl";

interface BrandRow {
  id: string;
  name: string;
  slug: string | null;
  logo_url: string | null;
  countries: string[] | null;
  is_active: boolean | null;
  sort_order: number | null;
}

interface BrandViewModel {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
}

const BRAND_STRIP_POSITION_KEY = "genan-home-brand-strip-position";
const normalizeBrandName = (value: string) => value.trim().toLocaleLowerCase();

const BrandsStrip = ({ enabled = true }: { enabled?: boolean }) => {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const { data: brands = [] } = useQuery({
    queryKey: ["home-brands"],
    enabled,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("brands")
        .select("id,name,logo_url,countries,is_active,sort_order,slug")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });

      if (error) throw error;
      return (data || []) as BrandRow[];
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  const renderBrands = useMemo<BrandViewModel[]>(() => {
    const seen = new Set<string>();
    return brands.reduce<BrandViewModel[]>((result, brand) => {
      const key = normalizeBrandName(brand.name);
      if (!key || seen.has(key)) return result;
      seen.add(key);
      result.push({
        id: brand.id,
        name: brand.name,
        slug: brand.slug || brand.name.toLowerCase().trim().replace(/\s+/g, "-"),
        logo_url: brand.logo_url,
      });
      return result;
    }, []);
  }, [brands]);

  useLayoutEffect(() => {
    if (!enabled || !renderBrands.length || !scrollerRef.current) return;
    try {
      const saved = sessionStorage.getItem(BRAND_STRIP_POSITION_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (typeof parsed.scrollLeft === "number") scrollerRef.current.scrollLeft = parsed.scrollLeft;
    } catch {}
  }, [enabled, renderBrands.length]);

  const saveStripPosition = (id: string) => {
    if (!scrollerRef.current) return;
    try {
      sessionStorage.setItem(
        BRAND_STRIP_POSITION_KEY,
        JSON.stringify({ scrollLeft: scrollerRef.current.scrollLeft, brandId: id }),
      );
    } catch {}
  };

  if (!enabled || !renderBrands.length) return null;

  return (
    <section className="w-full overflow-hidden border-y border-[#DCD5C6] bg-[#EEE9DD] py-10 md:py-16" dir="rtl" aria-label="الماركات">
      <div className="mx-auto w-full max-w-[1680px] px-4 md:px-7 lg:px-10">
        <div className="mb-7 flex items-end justify-between md:mb-10">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <span className="h-px w-10 bg-[#B89453]/60" />
              <span className="text-[7px] font-semibold tracking-[.28em] text-[#9D7B40] md:text-[8px]">BRANDS</span>
            </div>
            <h2 className="text-[27px] font-medium tracking-[-0.04em] text-[#173A2D] md:text-[40px]">أشهر الماركات</h2>
          </div>
          <Link to="/brands" className="flex items-center gap-2 border-b border-[#B89453]/55 pb-1 text-[8px] font-semibold text-[#173A2D] md:text-[10px]">
            جميع الماركات
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>

        <div
          ref={scrollerRef}
          className="-mx-3 overflow-x-auto px-3 pb-1 [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden md:mx-0 md:px-0"
        >
          <div className="flex w-max gap-0 border-y border-[#D7CFBF] pl-5 md:pl-8">
            {renderBrands.map((brand) => (
              <Link
                key={brand.id}
                to={`/brands/${brand.slug}`}
                onClick={() => saveStripPosition(brand.id)}
                className="group flex w-[150px] shrink-0 flex-col items-center border-l border-[#D7CFBF] px-6 py-7 md:w-[210px] md:px-8 md:py-9"
              >
                <div className="flex h-[54px] w-full items-center justify-center bg-transparent md:h-[68px]">
                  {brand.logo_url ? (
                    <img
                      src={optimizeImage(brand.logo_url, 240, 78)}
                      alt={brand.name}
                      loading="lazy"
                      decoding="async"
                      className="max-h-[58%] max-w-[78%] object-contain grayscale transition-all duration-300 group-hover:scale-105 group-hover:grayscale-0"
                    />
                  ) : (
                    <span className="font-serif text-[16px] font-medium tracking-[0.08em] text-[#173A2D]">{brand.name}</span>
                  )}
                </div>
                <p className="mt-3 max-w-full truncate text-[7px] font-semibold tracking-[0.12em] text-[#667168]">{brand.name}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BrandsStrip;

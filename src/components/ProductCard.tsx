import { memo, useEffect, useMemo, useState } from "react";
import type { MouseEvent, SyntheticEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Heart, ImageOff, ShoppingBag } from "lucide-react";

import { Product, useStore } from "@/store/useStore";
import { toast } from "@/hooks/use-toast";
import { useCurrency } from "@/lib/currency";
import { useFavorites } from "@/hooks/useFavorites";
import { saveCatalogScroll } from "@/lib/catalogScroll";
import { createImageSrcSet, optimizeCatalogImage } from "@/lib/imageUrl";
import { prefetchProductDetailPage } from "@/lib/prefetchRoutes";

type ColorVariant = {
  name?: string;
  hex?: string;
  hex2?: string;
  images?: string[];
};

type DisplayProduct = Product & {
  colorVariants?: ColorVariant[];
  color_variants?: ColorVariant[];
  rating?: number;
};

interface ProductCardProps {
  product: DisplayProduct;
  index?: number;
  badge?: string;
  size?: "large" | "medium" | "small";
  onQuickView?: (product: DisplayProduct) => void;
}

type ImageFit = "cover" | "contain";

const isHeicImage = (url: string) => {
  const cleanUrl = url.split("?")[0].toLowerCase();
  return cleanUrl.endsWith(".heic") || cleanUrl.endsWith(".heif");
};

const isCloudflareCatalogTransform = (url: string) => url.includes("/cdn-cgi/image/");

const ProductCard = ({ product, index = 2, badge, onQuickView }: ProductCardProps) => {
  const location = useLocation();
  const navigate = useNavigate();

  const isLiked = useFavorites((state) => state.favorites.some((favorite) => favorite.id === product.id));
  const toggleFavorite = useFavorites((state) => state.toggleFavorite);
  const addToCart = useStore((state) => state.addToCart);
  const openCart = useStore((state) => state.openCart);
  const { format } = useCurrency();

  const [bagPop, setBagPop] = useState(false);
  const [heartBeat, setHeartBeat] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const [allImagesFailed, setAllImagesFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageFit, setImageFit] = useState<ImageFit>("cover");

  const colors = useMemo<ColorVariant[]>(() => product.colorVariants || product.color_variants || [], [product.colorVariants, product.color_variants]);

  const imageCandidates = useMemo(() => {
    const variantImages = colors.flatMap((color) => (Array.isArray(color.images) ? color.images : []));
    const productImages = Array.isArray(product.images) ? product.images : [];
    const uniqueImages = Array.from(new Set([...variantImages, ...productImages].filter((image): image is string => typeof image === "string" && image.trim().length > 0)));
    const normalImages = uniqueImages.filter((image) => !isHeicImage(image));
    const heicImages = uniqueImages.filter((image) => isHeicImage(image));
    return [...normalImages, ...heicImages];
  }, [colors, product.images]);

  const primaryColor = useMemo(() => colors.find((color) => Array.isArray(color.images) && color.images.some((image) => typeof image === "string" && image.trim().length > 0)) || colors[0], [colors]);
  const firstColorName = primaryColor?.name;
  const mainImage = imageCandidates[imageIndex];

  const optimizedMainImage = useMemo(() => (mainImage ? optimizeCatalogImage(mainImage, 480, 78) : ""), [mainImage]);
  const optimizedMainImageSrcSet = useMemo(
    () => (mainImage && !optimizedMainImage.includes("/cdn-cgi/image/") ? createImageSrcSet(mainImage, [240, 360, 480], 78) : undefined),
    [mainImage, optimizedMainImage],
  );

  useEffect(() => {
    setImageIndex(0);
    setAllImagesFailed(false);
    setImageLoaded(false);
    setImageFit("cover");
  }, [product.id]);

  useEffect(() => {
    setImageLoaded(false);
    setImageFit("cover");
  }, [imageIndex]);

  const handleMainImageLoad = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;
    const width = image.naturalWidth;
    const height = image.naturalHeight;

    if (!width || !height) {
      setImageFit("cover");
      setImageLoaded(true);
      return;
    }

    const imageRatio = width / height;
    setImageFit(imageRatio >= 0.68 && imageRatio <= 1.05 ? "cover" : "contain");
    setImageLoaded(true);
  };

  const handleMainImageError = (event: SyntheticEvent<HTMLImageElement>) => {
    const image = event.currentTarget;

    if (mainImage && isCloudflareCatalogTransform(image.currentSrc || image.src) && image.dataset.originalTried !== "1") {
      image.dataset.originalTried = "1";
      image.removeAttribute("srcset");
      image.src = mainImage;
      return;
    }

    if (imageIndex < imageCandidates.length - 1) {
      setImageIndex((current) => current + 1);
      return;
    }

    setAllImagesFailed(true);
    setImageLoaded(true);
  };

  const handleFavorite = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const nowLiked = toggleFavorite(product);
    setHeartBeat(true);
    window.setTimeout(() => setHeartBeat(false), 260);
    toast({ title: nowLiked ? "تمت الإضافة للمفضلة" : "تمت الإزالة من المفضلة" });
  };

  const handleAdd = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    const variants = product.variants;
    const sizes = Array.isArray((product as any).sizes) ? (product as any).sizes : [];
    const hasConfiguredSizes = Boolean((product as any).hasSizes || (product as any).has_sizes || sizes.length > 0);
    const needsSelection = Boolean(variants?.length || colors.length || hasConfiguredSizes);

    if (needsSelection) {
      if (onQuickView) {
        onQuickView(product);
      } else {
        navigate(`/product/${product.slug}`);
      }
      return;
    }

    addToCart(product, 1);
    setBagPop(true);
    window.setTimeout(() => setBagPop(false), 280);
    toast({ title: "تمت الإضافة إلى السلة" });
    openCart();
  };

  const getDisplayedPrice = () => {
    const variants = product.variants;
    if (!variants?.length) return format(product.price);

    const prices = variants.map((variant) => variant.price ?? product.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice ? format(minPrice) : `${format(minPrice)} - ${format(maxPrice)}`;
  };

  const discount = Number(product.discount || 0);
  const cardBadge = badge || (discount > 0 ? `-${discount}%` : undefined);
  const isMobileViewport = typeof window !== "undefined" && window.innerWidth <= 767;
  const eagerImageLimit = isMobileViewport ? 2 : 4;
  const shouldEagerLoad = index < eagerImageLimit;
  const shouldPrioritize = index < 2;

  return (
    <Link
      to={`/product/${product.slug}`}
      dir="rtl"
      data-catalog-product-id={product.id}
      onPointerEnter={() => void prefetchProductDetailPage()}
      onPointerDown={() => void prefetchProductDetailPage()}
      onFocus={() => void prefetchProductDetailPage()}
      onClick={() => saveCatalogScroll(`${location.pathname}${location.search}`, product.id)}
      className="group block w-full min-w-0"
    >
      <article className="relative w-full min-w-0">
        <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#ECE8DE]">
          {!allImagesFailed && optimizedMainImage ? (
            <>
              {!imageLoaded && <div className="absolute inset-0 z-[2] animate-pulse bg-[#E4DFD3]" />}
              <img
                key={`${product.id}-${imageIndex}-${mainImage}`}
                src={optimizedMainImage}
                srcSet={optimizedMainImageSrcSet}
                alt={product.nameAr || product.name || "منتج جنان"}
                loading={shouldEagerLoad ? "eager" : "lazy"}
                decoding="async"
                fetchPriority={shouldPrioritize ? "high" : "auto"}
                onLoad={handleMainImageLoad}
                onError={handleMainImageError}
                width={480}
                height={640}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                className={`absolute inset-0 h-full w-full select-none transition-[opacity,transform] duration-500 group-hover:scale-[1.025] ${imageLoaded ? "opacity-100" : "opacity-0"} ${imageFit === "cover" ? "object-cover object-center" : "scale-[1.02] object-contain object-center"}`}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#ECE8DE]">
              <ImageOff className="h-6 w-6 text-[#98A198]" strokeWidth={1.2} />
              <span className="mt-2 text-[8px] text-[#7D867D]">الصورة غير متوفرة</span>
            </div>
          )}

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-black/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

          <button
            type="button"
            aria-label={isLiked ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
            onClick={handleFavorite}
            className={`absolute left-3 top-3 z-20 flex h-9 w-9 items-center justify-center bg-white/88 text-[#173A2D] backdrop-blur-md transition-all hover:bg-white ${heartBeat ? "scale-110" : "scale-100"}`}
          >
            <Heart className={`h-[16px] w-[16px] ${isLiked ? "fill-[#173A2D] text-[#173A2D]" : "fill-transparent text-[#173A2D]"}`} strokeWidth={1.35} />
          </button>

          {cardBadge && (
            <span className="absolute right-3 top-3 z-20 bg-[#173A2D] px-2.5 py-1.5 text-[7px] font-semibold tracking-[0.06em] text-white">
              {cardBadge}
            </span>
          )}

          {product.inStock ? (
            <button
              type="button"
              aria-label="إضافة إلى السلة"
              onClick={handleAdd}
              className={`absolute bottom-3 left-3 z-20 flex h-10 w-10 items-center justify-center bg-[#F8F6F0] text-[#173A2D] shadow-[0_8px_22px_rgba(23,58,45,.12)] transition-all md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 ${bagPop ? "scale-110" : "scale-100"}`}
            >
              <ShoppingBag className="h-[16px] w-[16px]" strokeWidth={1.5} />
            </button>
          ) : (
            <span className="absolute bottom-3 left-3 bg-white/88 px-2 py-1 text-[7px] font-medium text-[#6D786F]">نفدت الكمية</span>
          )}

          {colors.length > 0 && (
            <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 bg-white/86 px-2 py-1.5 backdrop-blur-md">
              {colors.slice(0, 4).map((color, colorIndex) => (
                <span
                  key={`${color.name || "color"}-${colorIndex}`}
                  title={color.name}
                  className="block h-[9px] w-[9px] shrink-0 rounded-full border border-white shadow-[0_0_0_1px_rgba(25,35,30,.13)]"
                  style={color.hex2
                    ? { background: `linear-gradient(135deg, ${color.hex || "#e2e2e2"} 0%, ${color.hex || "#e2e2e2"} 50%, ${color.hex2} 50%, ${color.hex2} 100%)` }
                    : { backgroundColor: color.hex || "#e2e2e2" }}
                />
              ))}
              {colors.length > 4 && <span className="mr-0.5 text-[6px] text-[#6F786F]">+{colors.length - 4}</span>}
            </div>
          )}
        </div>

        <div className="pt-3.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="mb-1 text-[7px] font-semibold uppercase tracking-[0.16em] text-[#9D7B40]">
                {product.brand || "GENAN"}
              </p>
              <h3 className="truncate text-[11px] font-medium leading-5 text-[#173A2D] md:text-[12px]">
                {product.nameAr || product.name}
              </h3>
            </div>
            <span className="shrink-0 text-[11px] font-semibold text-[#173A2D] md:text-[12px]">
              {getDisplayedPrice()}
            </span>
          </div>

          {firstColorName && (
            <p className="mt-1.5 truncate text-[7px] text-[#7B857D]">{firstColorName}</p>
          )}
        </div>
      </article>
    </Link>
  );};

export default memo(ProductCard);

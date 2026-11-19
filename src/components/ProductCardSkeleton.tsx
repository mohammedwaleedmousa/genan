const ProductCardSkeleton = () => (
  <div className="product-card-frame motion-safe:animate-pulse" dir="rtl" aria-hidden="true">
    <div className="product-card-media" />
    <div className="product-card-details pt-3">
      <div className="h-2.5 w-3/4 rounded-full bg-[#F5EFE8]" />
      <div className="mt-2 h-2 w-1/2 rounded-full bg-[#F5EFE8]" />
      <div className="mt-4 h-2.5 w-2/5 rounded-full bg-[#F5EFE8]" />
      <div className="absolute bottom-[9px] left-[9px] h-[33px] w-[33px] rounded-[9px] bg-[#F5EFE8]" />
    </div>
  </div>
);

export default ProductCardSkeleton;

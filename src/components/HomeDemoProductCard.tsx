// Local presentation samples for the homepage layout. These never enter the
// products table, the shopping cart, favorites, checkout, orders or stock logic.
export type HomeDemoProduct = {
  nameAr: string;
  brand: string;
  image: string;
  displayPriceSAR: number;
};

export const HOME_DEMO_PRODUCTS: readonly HomeDemoProduct[] = [
  { nameAr: "حقيبة جلدية سوداء", brand: "GENAN EDIT", image: "/products/demo/bag-black.webp", displayPriceSAR: 420 },
  { nameAr: "حقيبة عاجية أنيقة", brand: "GENAN EDIT", image: "/products/demo/bag-ivory.webp", displayPriceSAR: 395 },
  { nameAr: "فستان بتصميم راقٍ", brand: "GENAN EDIT", image: "/products/demo/dress.webp", displayPriceSAR: 580 },
  { nameAr: "حذاء بكعب أنيق", brand: "GENAN EDIT", image: "/products/demo/shoe.webp", displayPriceSAR: 340 },
  { nameAr: "محفظة كلاسيكية", brand: "GENAN EDIT", image: "/products/demo/wallet.webp", displayPriceSAR: 195 },
  { nameAr: "ساعة أنيقة", brand: "GENAN EDIT", image: "/products/demo/watch.webp", displayPriceSAR: 465 },
  { nameAr: "نظارة شمسية", brand: "GENAN EDIT", image: "/products/demo/sunglasses.webp", displayPriceSAR: 250 },
  { nameAr: "عطر بتصميم فاخر", brand: "GENAN EDIT", image: "/products/demo/perfume.webp", displayPriceSAR: 310 },
];

const HomeDemoProductCard = ({ product }: { product: HomeDemoProduct }) => (
  <article
    aria-label={product.nameAr + " — منتج تجريبي للعرض فقط، غير متاح للشراء"}
    className="relative min-w-0 overflow-hidden rounded-[15px] border border-[#EAEAEA] bg-white"
  >
    <div className="relative aspect-[4/5] overflow-hidden bg-[#F4F4F4]">
      <img
        src={product.image}
        alt={product.nameAr + " — صورة تجريبية"}
        loading="lazy"
        decoding="async"
        width={400}
        height={500}
        className="h-full w-full object-cover object-center"
      />
      <span className="absolute right-2 top-2 rounded-[6px] border border-[#D8C29A]/65 bg-white/95 px-2 py-1 text-[9px] font-semibold text-[#8C6B32]">
        عرض تجريبي
      </span>
    </div>
    <div className="h-[91px] px-[10px] pb-2 pt-2">
      <h3 className="truncate text-[11px] font-semibold leading-5 text-[#0E0E0E]">{product.nameAr}</h3>
      <p className="truncate text-[9px] leading-4 text-[#777777]">{product.brand}</p>
      <div className="mt-2 flex items-center justify-between gap-1">
        <span className="text-[11px] font-semibold text-[#8C6B32]">
          {product.displayPriceSAR.toLocaleString("en-US")} ر.س
        </span>
        <span className="text-[8px] text-[#777777]">غير متاح للشراء</span>
      </div>
    </div>
  </article>
);

export default HomeDemoProductCard;

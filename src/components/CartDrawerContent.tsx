import { useEffect } from "react";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useStore } from "@/store/useStore";
import { useCurrency } from "@/lib/currency";

const POST_AUTH_REDIRECT_KEY = "genan-post-auth-redirect";

const CartDrawerContent = () => {
  const { customer, cart, isCartOpen, closeCart, removeFromCart, updateQuantity, getCartTotal, clearCart } = useStore();

  const navigate = useNavigate();

  const total = getCartTotal();
  const { format: formatCurrency } = useCurrency();

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    if (!isCartOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeCart();
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isCartOpen, closeCart]);

  const handleCheckout = () => {
    closeCart();

    if (!customer || customer.id === "guest") {
      window.sessionStorage.setItem(POST_AUTH_REDIRECT_KEY, "/checkout");
      navigate("/auth?returnTo=%2Fcheckout");
      return;
    }

    window.sessionStorage.removeItem(POST_AUTH_REDIRECT_KEY);
    navigate("/checkout");
  };

  const handleBrowseProducts = () => {
    closeCart();
    navigate("/products");
  };

  if (!isCartOpen) return null;

  return (
    <>
      <button
        type="button"
        aria-label="إغلاق السلة"
        onClick={closeCart}
        className="fixed inset-0 z-[70] cursor-default bg-black/15 backdrop-blur-[1px]"
      />

      <aside
        className="fixed inset-y-0 right-0 z-[80] flex w-full flex-col border-l border-[#E8E4DC] bg-[#FCFBF8] shadow-[-18px_0_50px_rgba(31,34,30,.06)] sm:max-w-[440px]"
        dir="rtl"
      >
        <header className="shrink-0 border-b border-[#E9E5DD] bg-[#FCFBF8]/95 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+14px)] backdrop-blur sm:px-5 sm:pt-5">
          <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
            <button
              type="button"
              onClick={closeCart}
              aria-label="إغلاق"
              className="flex h-10 w-10 items-center justify-center border border-[#DEDAD2] bg-white text-[#4C514D] transition-colors active:bg-[#F3F1EC]"
            >
              <X className="h-4 w-4 stroke-[1.4]" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h2 className="text-[18px] font-semibold tracking-[-0.025em] text-[#26312C]">سلة التسوق</h2>
                {totalQuantity > 0 && (
                  <span className="text-[8px] font-medium text-[#8A8F89]">({totalQuantity})</span>
                )}
              </div>
              <p className="mt-1 font-serif text-[6px] tracking-[0.28em] text-[#9A8461]">GENAN BAG</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center border border-[#E5E1D9] bg-[#F5F2EC] text-[#6C716D]">
              <ShoppingBag className="h-[17px] w-[17px] stroke-[1.35]" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5">
          {cart.length === 0 ? (
            <div className="flex min-h-full flex-col items-center justify-center px-6 pb-16 text-center">
              <div className="flex h-[72px] w-[72px] items-center justify-center border border-[#DED9D0] bg-white">
                <ShoppingBag className="h-6 w-6 stroke-[1.2] text-[#8B8F8A]" />
              </div>

              <span className="mt-5 font-serif text-[6px] tracking-[0.28em] text-[#9A8461]">GENAN</span>
              <h3 className="mt-2 text-[18px] font-semibold text-[#29332E]">سلتك فارغة</h3>
              <p className="mt-2 max-w-[250px] text-[9px] leading-5 text-[#838781]">
                اكتشف أحدث اختيارات جنان وأضف القطع التي تحبها إلى سلتك.
              </p>

              <button
                type="button"
                onClick={handleBrowseProducts}
                className="mt-6 h-[44px] border border-[#2C3932] bg-[#2C3932] px-8 text-[10px] font-semibold text-white transition-colors active:bg-[#202A25]"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            <div className="divide-y divide-[#EAE6DF]">
              {cart.map((item, cartIndex) => {
                const variant = item.variantId
                  ? item.product.variants?.find((candidate) => candidate.id === item.variantId)
                  : undefined;

                const basePrice = variant?.price !== undefined ? variant.price : item.product.price;
                const discount = variant?.discount !== undefined ? variant.discount : item.product.discount;
                const itemPrice = discount ? basePrice * (1 - discount / 100) : basePrice;

                const accessoriesTotal = item.selectedAccessories
                  ? item.selectedAccessories.reduce(
                      (sum, accessory) => sum + accessory.price * accessory.quantity,
                      0,
                    )
                  : 0;

                const unitTotal = itemPrice + accessoriesTotal;
                const image = variant?.images?.[0] || item.product.images?.[0];
                const stock = item.product.stockQuantity;
                const maxQuantityReached = typeof stock === "number" && item.quantity >= stock;

                return (
                  <article
                    key={`${item.product.id}-${item.variantId || "base"}-${cartIndex}`}
                    className="py-4 first:pt-1"
                  >
                    <div className="flex gap-3.5">
                      <div className="relative h-[126px] w-[98px] shrink-0 overflow-hidden bg-[#F2F0EB]">
                        {image ? (
                          <img
                            src={image}
                            alt={item.product.nameAr}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <ShoppingBag className="h-5 w-5 stroke-[1.25] text-[#B2B4B0]" />
                          </div>
                        )}

                        {!!discount && (
                          <span className="absolute bottom-1.5 right-1.5 bg-white/95 px-2 py-1 text-[7px] font-semibold text-[#786747] shadow-sm">
                            -{discount}%
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {item.product.brand && (
                              <p className="mb-1 truncate text-[7px] tracking-[0.05em] text-[#92958F]">
                                {item.product.brand}
                              </p>
                            )}

                            <h3 className="line-clamp-2 text-[11px] font-semibold leading-[1.65] text-[#2D332F]">
                              {item.product.nameAr}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id, item.variantId)}
                            aria-label="حذف المنتج"
                            className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E4E0D8] bg-white text-[#8F8276] transition-colors active:bg-[#F4F1EC]"
                          >
                            <Trash2 className="h-3.5 w-3.5 stroke-[1.35]" />
                          </button>
                        </div>

                        {(item.selectedSize || item.selectedColor) && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[7px] text-[#7E837D]">
                            {item.selectedSize && (
                              <span>
                                <span className="text-[#A0A39E]">المقاس:</span> {item.selectedSize}
                              </span>
                            )}

                            {item.selectedColor && (
                              <span>
                                <span className="text-[#A0A39E]">اللون:</span> {item.selectedColor}
                              </span>
                            )}
                          </div>
                        )}

                        {item.selectedAccessories && item.selectedAccessories.length > 0 && (
                          <p className="mt-2 line-clamp-1 text-[7px] text-[#8B8F89]">
                            +{" "}
                            {item.selectedAccessories.map((accessory, index) => (
                              <span key={`${accessory.name_ar}-${index}`}>
                                {accessory.name_ar}
                                {accessory.quantity > 1 ? ` ×${accessory.quantity}` : ""}
                                {index < item.selectedAccessories!.length - 1 ? "، " : ""}
                              </span>
                            ))}
                          </p>
                        )}

                        <div className="mt-2.5 flex items-end gap-2">
                          <span className="text-[14px] font-semibold leading-none text-[#343A36]">
                            {formatCurrency(unitTotal)}
                          </span>

                          {!!discount && (
                            <span className="text-[7px] leading-none text-[#A3A6A1] line-through">
                              {formatCurrency(basePrice)}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div className="flex h-[32px] items-center border border-[#DCD8D0] bg-white">
                            <button
                              type="button"
                              onClick={() =>
                                updateQuantity(
                                  item.product.id,
                                  item.quantity - 1,
                                  item.variantId,
                                )
                              }
                              disabled={item.quantity <= 1}
                              className="flex h-full w-8 items-center justify-center text-[#555B57] disabled:opacity-25"
                            >
                              <Minus className="h-3 w-3 stroke-[1.45]" />
                            </button>

                            <span className="flex h-full min-w-[30px] items-center justify-center border-x border-[#E5E1DA] px-1 text-[9px] font-semibold text-[#343A36]">
                              {item.quantity}
                            </span>

                            <button
                              type="button"
                              onClick={() => {
                                if (maxQuantityReached) return;
                                updateQuantity(
                                  item.product.id,
                                  item.quantity + 1,
                                  item.variantId,
                                );
                              }}
                              disabled={maxQuantityReached}
                              className="flex h-full w-8 items-center justify-center text-[#555B57] disabled:opacity-25"
                            >
                              <Plus className="h-3 w-3 stroke-[1.45]" />
                            </button>
                          </div>

                          <div className="text-left">
                            <span className="block text-[6px] text-[#A1A49F]">الإجمالي</span>
                            <span className="mt-1 block text-[10px] font-semibold leading-none text-[#4B514D]">
                              {formatCurrency(unitTotal * item.quantity)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {cart.length > 0 && (
          <footer className="shrink-0 border-t border-[#E6E2DA] bg-[#FEFDFB] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-4 sm:px-5 sm:pb-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[8px] text-[#8B8F89]">المجموع</p>
                <p className="mt-1 text-[7px] text-[#A0A39E]">{totalQuantity} قطعة في السلة</p>
              </div>

              <span className="text-[23px] font-semibold leading-none text-[#2E3531]">
                {formatCurrency(total)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="flex h-[49px] w-full items-center justify-center gap-2 bg-[#2C3932] text-[11px] font-semibold text-white transition-colors active:bg-[#202A25]"
            >
              <ShoppingBag className="h-4 w-4 stroke-[1.45]" />
              إتمام الشراء
            </button>

            <div className="mt-3 flex items-center justify-between border-t border-[#EFECE6] pt-3">
              <button
                type="button"
                onClick={handleBrowseProducts}
                className="text-[8px] font-medium text-[#59615C]"
              >
                متابعة التسوق
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="text-[8px] font-medium text-[#9B7963]"
              >
                إفراغ السلة
              </button>
            </div>
          </footer>
        )}
      </aside>
    </>
  );
};

export default CartDrawerContent;

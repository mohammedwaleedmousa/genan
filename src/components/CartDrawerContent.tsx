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
        className="fixed inset-0 z-[70] cursor-default bg-black/45 backdrop-blur-[2px]"
      />

      <aside
        role="dialog" aria-modal="true" aria-labelledby="genan-cart-title"
        className="genan-editorial-drawer fixed inset-y-0 right-0 z-[80] flex w-full flex-col border-l border-[#E7DCCD] bg-[#FAF9F6] text-[#171717] shadow-[-18px_0_50px_rgba(31,34,30,.17)] sm:max-w-[460px]"
        dir="rtl"
      >
        <header className="genan-drawer-header shrink-0 border-b border-[#E8DDD0] bg-[#FAF9F6]/95 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+14px)] backdrop-blur sm:px-5 sm:pt-5">
          <div className="grid grid-cols-[40px_1fr_40px] items-center gap-3">
            <button
              type="button"
              onClick={closeCart}
              aria-label="إغلاق"
              className="flex h-10 w-10 items-center justify-center border border-[#E1D3C3] bg-white text-[#171717] transition-colors active:bg-[#F3EDE5]"
            >
              <X className="h-4 w-4 stroke-[1.4]" />
            </button>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2">
                <h2 id="genan-cart-title" className="text-[22px] font-semibold tracking-tight text-[#171717]">اختياراتك</h2>
                {totalQuantity > 0 && (
                  <span className="text-[11px] font-medium text-[#8D7965]">({totalQuantity})</span>
                )}
              </div>
              <p className="mt-1 font-serif text-[10px] tracking-[0.28em] text-[#9B7845]">GENAN / THE EDIT</p>
            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-full border border-[#E5DACB] bg-[#F5EFE7] text-[#9B7845]">
              <ShoppingBag className="h-[17px] w-[17px] stroke-[1.35]" />
            </div>
          </div>
        </header>

        <div className="genan-drawer-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:px-5">
          {cart.length === 0 ? (
            <div className="genan-drawer-empty flex min-h-full flex-col items-center justify-center px-6 pb-16 text-center">
              <div className="flex h-[86px] w-[86px] items-center justify-center rounded-full border border-[#E4D6C5] bg-[#F2EAE0]">
                <ShoppingBag className="h-6 w-6 stroke-[1.2] text-[#A18259]" />
              </div>

              <span className="mt-5 font-serif text-[10px] tracking-[0.28em] text-[#9B7845]">GENAN</span>
              <h3 className="mt-2 text-[18px] font-semibold text-[#171717]">سلتك فارغة</h3>
              <p className="mt-2 max-w-[280px] text-[13px] leading-6 text-[#80746A]">
                اكتشف أحدث اختيارات جنان وأضف القطع التي تحبها إلى سلتك.
              </p>

              <button
                type="button"
                onClick={handleBrowseProducts}
                className="mt-7 h-[50px] rounded-xl bg-[#171717] px-8 text-[13px] font-semibold text-white transition-colors hover:bg-[#38302A]"
              >
                تصفح المنتجات
              </button>
            </div>
          ) : (
            <div className="genan-drawer-items space-y-3">
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
                    data-look={String(cartIndex + 1).padStart(2, "0")}
                    key={`${item.product.id}-${item.variantId || "base"}-${cartIndex}`}
                    className="genan-drawer-item rounded-2xl border border-[#E9E1D5] bg-white p-3 sm:p-4"
                  >
                    <div className="flex gap-3.5">
                      <div className="genan-drawer-image relative h-[138px] w-[98px] shrink-0 overflow-hidden rounded-xl bg-[#F4EFE8]">
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
                            <ShoppingBag className="h-5 w-5 stroke-[1.25] text-[#AE9572]" />
                          </div>
                        )}

                        {!!discount && (
                          <span className="absolute bottom-1.5 right-1.5 bg-white/95 px-2 py-1 text-[11px] font-semibold text-[#9B7845] shadow-sm">
                            -{discount}%
                          </span>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 py-0.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            {item.product.brand && (
                              <p className="mb-1 truncate text-[11px] tracking-[0.05em] text-[#8C7B66]">
                                {item.product.brand}
                              </p>
                            )}

                            <h3 className="genan-drawer-name line-clamp-2 text-[14px] font-semibold leading-[1.65] text-[#171717]">
                              {item.product.nameAr}
                            </h3>
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.product.id, item.variantId)}
                            aria-label="حذف المنتج"
                            className="genan-drawer-remove flex h-7 w-7 shrink-0 items-center justify-center border border-[#E8DDD0] bg-white text-[#9A7866] transition-colors active:bg-[#F5EDE3]"
                          >
                            <Trash2 className="h-3.5 w-3.5 stroke-[1.35]" />
                          </button>
                        </div>

                        {(item.selectedSize || item.selectedColor) && (
                          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-[#84796E]">
                            {item.selectedSize && (
                              <span>
                                <span className="text-[#928476]">المقاس:</span> {item.selectedSize}
                              </span>
                            )}

                            {item.selectedColor && (
                              <span>
                                <span className="text-[#928476]">اللون:</span> {item.selectedColor}
                              </span>
                            )}
                          </div>
                        )}

                        {item.selectedAccessories && item.selectedAccessories.length > 0 && (
                          <p className="mt-2 line-clamp-1 text-[11px] text-[#8C8175]">
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
                          <span className="text-[16px] font-semibold leading-none text-[#171717]">
                            {formatCurrency(unitTotal)}
                          </span>

                          {!!discount && (
                            <span className="text-[11px] leading-none text-[#ADA397] line-through">
                              {formatCurrency(basePrice)}
                            </span>
                          )}
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div className="genan-drawer-qty flex h-[38px] items-center overflow-hidden rounded-lg border border-[#E4D7C8] bg-[#FAF8F5]">
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
                              className="flex h-full w-8 items-center justify-center text-[#171717] disabled:opacity-25"
                            >
                              <Minus className="h-3 w-3 stroke-[1.45]" />
                            </button>

                            <span className="flex h-full min-w-[30px] items-center justify-center border-x border-[#E4D7C8] px-1 text-[12px] font-semibold text-[#171717]">
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
                              className="flex h-full w-8 items-center justify-center text-[#171717] disabled:opacity-25"
                            >
                              <Plus className="h-3 w-3 stroke-[1.45]" />
                            </button>
                          </div>

                          <div className="text-left">
                            <span className="block text-[10px] text-[#928476]">الإجمالي</span>
                            <span className="mt-1 block text-[13px] font-semibold leading-none text-[#171717]">
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
          <footer className="genan-drawer-footer shrink-0 border-t border-[#E7DCCD] bg-[#FFFFFF] px-4 pb-[calc(env(safe-area-inset-bottom)+12px)] pt-4 sm:px-5 sm:pb-5">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <p className="text-[11px] text-[#8C8175]">المجموع</p>
                <p className="mt-1 text-[11px] text-[#928476]">{totalQuantity} قطعة في السلة</p>
              </div>

              <span className="text-[23px] font-semibold leading-none text-[#171717]">
                {formatCurrency(total)}
              </span>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              className="genan-drawer-checkout flex h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-[#171717] text-[14px] font-semibold text-white transition-colors hover:bg-[#38302A] active:bg-[#38302A]"
            >
              <ShoppingBag className="h-4 w-4 stroke-[1.45]" />
              إتمام الشراء
            </button>

            <div className="mt-3 flex items-center justify-between border-t border-[#EFECE6] pt-3">
              <button
                type="button"
                onClick={handleBrowseProducts}
                className="text-[11px] font-medium text-[#9B7845]"
              >
                متابعة التسوق
              </button>

              <button
                type="button"
                onClick={clearCart}
                className="text-[11px] font-medium text-[#917967]"
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

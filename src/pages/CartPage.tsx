import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";

import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";
import Footer from "@/components/Footer";

import { useStore } from "@/store/useStore";
import { useSiteContent, getSiteText } from "@/hooks/useSiteContent";
import { useCurrency } from "@/lib/currency";

const CartPage = () => {
  const { cart, updateQuantity, removeFromCart, getCartTotal } = useStore();
  const navigate = useNavigate();
  const { data: content } = useSiteContent("cart_");

  const { format: formatCurrency } = useCurrency();
  const total = getCartTotal();

  const totalQuantity = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-[#FAF9F7] text-[#171717]" dir="rtl">
      <Navbar />
      <CartDrawer />

      <main id="main-content" className="pb-14 md:pb-20">
        <header className="mx-auto mt-4 flex w-full max-w-[1100px] items-center justify-between gap-3 rounded-3xl bg-white px-4 py-4 sm:px-6 md:mt-7 md:py-5">
          <div className="flex items-center gap-3">
            <Link to="/products" aria-label="العودة للتسوق" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#F6F4F0]"><ArrowLeft className="h-5 w-5 text-[#171717]" /></Link>
            <div><span className="text-[10px] font-medium tracking-[0.18em] text-[#A38960]">GENAN</span><h1 className="text-[20px] font-bold text-[#171717] md:text-[24px]">{getSiteText(content, "cart_title", "حقيبتي")}</h1></div>
          </div>
          {cart.length > 0 && <div className="rounded-2xl bg-[#F7F4EE] px-3 py-2 text-left"><span className="block text-[10px] text-[#8C6B32]">المجموع</span><strong className="text-[15px] text-[#171717] sm:text-[18px]">{formatCurrency(total)}</strong></div>}
        </header>

        {cart.length === 0 ? (
          <section className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center px-6 text-center">
            <div className="flex h-[78px] w-[78px] items-center justify-center rounded-2xl border border-[#EAE5DA] bg-white">
              <ShoppingBag className="h-6 w-6 stroke-[1.25] text-[#8C6B32]" />
            </div>

            <span className="mt-5 font-serif text-[6px] tracking-[0.25em] text-[#8C6B32]">GENAN</span>

            <h2 className="mt-2 text-[18px] font-semibold text-[#171717]">
              {getSiteText(content, "cart_empty_text", "حقيبتك فارغة")}
            </h2>

            <p className="mt-2 max-w-[280px] text-[12px] leading-6 text-[#777777]">
              اكتشف المنتجات وأضف القطع التي تحبها إلى حقيبتك.
            </p>

            <Link
              to="/products"
              className="mt-6 inline-flex h-[48px] items-center justify-center gap-2 rounded-2xl border border-[#2C3932] bg-[#171717] px-7 text-[10px] font-semibold text-white active:bg-[#303030]"
            >
              {getSiteText(content, "cart_start_shopping", "ابدأ التسوق")}
              <ArrowLeft className="h-3.5 w-3.5 stroke-[1.6]" />
            </Link>
          </section>
        ) : (
          <section className="mx-auto grid w-full max-w-[1100px] gap-8 px-4 py-6 sm:px-6 md:px-7 md:py-9 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-12">
            <div>
              <div className="divide-y divide-[#EEEAE3] rounded-3xl bg-white px-4 sm:px-5">
                {cart.map((item, index) => {
                  const variant =
                    item.variantId && item.product.variants
                      ? item.product.variants.find((candidate) => candidate.id === item.variantId)
                      : undefined;

                  const basePrice = variant?.price !== undefined ? variant.price : item.product.price;
                  const discount = variant?.discount !== undefined ? variant.discount : item.product.discount;
                  const price = discount ? basePrice * (1 - discount / 100) : basePrice;

                  const accessoriesTotal = item.selectedAccessories
                    ? item.selectedAccessories.reduce(
                        (sum, accessory) => sum + accessory.price * accessory.quantity,
                        0,
                      )
                    : 0;

                  const unitTotal = price + accessoriesTotal;
                  const itemTotal = unitTotal * item.quantity;

                  const image = variant?.images?.[0] || item.product.images?.[0];

                  const stock = item.product.stockQuantity;
                  const maxQuantityReached = typeof stock === "number" && item.quantity >= stock;

                  return (
                    <article
                      key={`${item.product.id}-${item.variantId || "base"}-${item.selectedSize || ""}-${index}`}
                      className="bg-white py-5 first:pt-1 last:pb-3 sm:py-6"
                    >
                      <div className="flex gap-3.5 md:gap-5">
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="relative h-[142px] w-[105px] shrink-0 overflow-hidden rounded-xl bg-[#F5F3EF] sm:h-[160px] sm:w-[122px]"
                        >
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
                              <ShoppingBag className="h-5 w-5 stroke-[1.3] text-[#B1B4B0]" />
                            </div>
                          )}

                          {!!discount && (
                            <span className="absolute bottom-1.5 right-1.5 flex items-center gap-1 bg-white/95 px-2 py-1 text-[7px] font-semibold text-[#786747] shadow-sm">
                              <Tag className="h-2.5 w-2.5" />
                              {discount}%
                            </span>
                          )}
                        </Link>

                        <div className="min-w-0 flex-1 py-0.5">
                          <div className="flex items-start justify-between gap-3">
                            <Link to={`/product/${item.product.slug}`} className="min-w-0 flex-1">
                              {item.product.brand && (
                                <p className="mb-1.5 truncate text-[10px] tracking-[0.05em] text-[#968268]">
                                  {item.product.brand}
                                </p>
                              )}

                              <h3 className="line-clamp-2 text-[13px] font-semibold leading-[1.6] text-[#171717] md:text-[15px]">
                                {item.product.nameAr}
                              </h3>
                            </Link>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id, item.variantId)}
                              aria-label="حذف المنتج"
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[#999] hover:bg-[#F6F4F0] hover:text-[#171717]"
                            >
                              <Trash2 className="h-3.5 w-3.5 stroke-[1.4]" />
                            </button>
                          </div>

                          {(item.selectedSize || item.selectedColor) && (
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-[#777]">
                              {item.selectedSize && (
                                <span>
                                  <span className="text-[#888888]">المقاس:</span> {item.selectedSize}
                                </span>
                              )}

                              {item.selectedColor && (
                                <span>
                                  <span className="text-[#888888]">اللون:</span> {item.selectedColor}
                                </span>
                              )}
                            </div>
                          )}

                          {item.selectedAccessories && item.selectedAccessories.length > 0 && (
                            <p className="mt-2 line-clamp-1 text-[10px] text-[#777777]">
                              +{" "}
                              {item.selectedAccessories.map((accessory, accessoryIndex) => (
                                <span key={`${accessory.name_ar}-${accessoryIndex}`}>
                                  {accessory.name_ar}
                                  {accessory.quantity > 1 ? ` ×${accessory.quantity}` : ""}
                                  {accessoryIndex < item.selectedAccessories!.length - 1 ? "، " : ""}
                                </span>
                              ))}
                            </p>
                          )}

                          <div className="mt-2.5 flex items-end gap-2">
                            <span className="text-[14px] font-semibold leading-none text-[#171717] md:text-[16px]">
                              {formatCurrency(unitTotal)}
                            </span>

                            {!!discount && (
                              <span className="text-[7px] leading-none text-[#A2A5A0] line-through md:text-[8px]">
                                {formatCurrency(basePrice)}
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex items-end justify-between gap-3 md:mt-6">
                            <div className="flex h-[38px] items-center overflow-hidden rounded-full border border-[#EAE5DA] bg-[#FAF9F7] md:h-[38px]">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.quantity <= 1) return;
                                  updateQuantity(item.product.id, item.quantity - 1, item.variantId);
                                }}
                                disabled={item.quantity <= 1}
                                className="flex h-full w-8 items-center justify-center text-[#171717] disabled:opacity-25 md:w-9"
                              >
                                <Minus className="h-3 w-3 stroke-[1.5]" />
                              </button>

                              <span className="flex h-full min-w-[30px] items-center justify-center border-x border-[#EAE5DA] px-1 text-[9px] font-semibold text-[#171717] md:min-w-[34px]">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  if (maxQuantityReached) return;
                                  updateQuantity(item.product.id, item.quantity + 1, item.variantId);
                                }}
                                disabled={maxQuantityReached}
                                className="flex h-full w-8 items-center justify-center text-[#171717] disabled:opacity-25 md:w-9"
                              >
                                <Plus className="h-3 w-3 stroke-[1.5]" />
                              </button>
                            </div>

                            <div className="text-left">
                              <span className="block text-[6px] text-[#888888]">الإجمالي</span>
                              <span className="mt-1 block text-[11px] font-semibold leading-none text-[#8C6B32] md:text-[13px]">
                                {formatCurrency(itemTotal)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </div>

            <aside className="lg:relative">
              <div className="rounded-3xl bg-white p-5 shadow-sm lg:sticky lg:top-28 lg:p-6">
                <h2 className="mb-4 text-[16px] font-semibold text-[#171717]">{getSiteText(content, "cart_summary_title", "ملخص الطلب")}</h2>
                <div className="border-y border-[#EAE5DA] py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#777777]">
                      {getSiteText(content, "cart_subtotal_label", "المجموع الفرعي")}
                    </span>
                    <span className="text-[10px] font-semibold text-[#171717]">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between py-5">
                  <div>
                    <span className="block text-[10px] font-semibold text-[#171717]">
                      {getSiteText(content, "cart_total_label", "الإجمالي")}
                    </span>
                    
                  </div>

                  <div className="text-left">
                    <span className="text-[23px] font-semibold leading-none text-[#171717]">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/checkout")}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#171717] text-[13px] font-semibold text-white active:bg-[#303030]"
                >
                  <ShoppingBag className="h-4 w-4 stroke-[1.45]" />
                  {getSiteText(content, "cart_checkout_cta", "إتمام الطلب")}
                </button>

                <Link
                  to="/products"
                  className="mt-3 flex h-[46px] w-full items-center justify-center gap-1.5 rounded-2xl border border-[#EAE5DA] bg-white text-[12px] font-medium text-[#5F5A53]"
                >
                  {getSiteText(content, "cart_continue_cta", "متابعة التسوق")}
                  <ArrowLeft className="h-3 w-3 stroke-[1.5]" />
                </Link>

              </div>
            </aside>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CartPage;

import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Minus, Plus, ShoppingBag, Tag, Trash2 } from "lucide-react";

import Navbar from "@/components/Navbar";
import CartDrawer from "@/components/CartDrawer";

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
    <div className="min-h-screen bg-[#FCFBF8] text-[#2E3430]" dir="rtl">
      <Navbar />
      <CartDrawer />

      <main className="pb-20 md:pt-24">
        <section className="border-b border-[#E8E4DC] bg-[#FEFDFB]">
          <div className="mx-auto flex w-full max-w-[1200px] items-end justify-between gap-5 px-4 pb-5 pt-6 md:px-6 md:pb-7 md:pt-8">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-px w-4 bg-[#71654F]" />
                <span className="font-serif text-[7px] tracking-[0.24em] text-[#92836A]">GENAN BAG</span>
              </div>

              <h1 className="text-[25px] font-semibold leading-tight tracking-[-0.035em] text-[#28312C] md:text-[36px]">
                {getSiteText(content, "cart_title", "حقيبتي")}
              </h1>

              <p className="mt-1.5 text-[8px] text-[#8E938E] md:text-[10px]">
                {totalQuantity > 0
                  ? `${totalQuantity} ${totalQuantity === 1 ? "قطعة" : "قطع"} في السلة`
                  : "اختياراتك ستظهر هنا"}
              </p>
            </div>

            {cart.length > 0 && (
              <div className="shrink-0 text-left">
                <span className="block text-[18px] font-semibold leading-none text-[#313733] md:text-[22px]">
                  {formatCurrency(total)}
                </span>
              </div>
            )}
          </div>
        </section>

        {cart.length === 0 ? (
          <section className="mx-auto flex min-h-[55vh] max-w-md flex-col items-center justify-center px-6 text-center">
            <div className="flex h-[78px] w-[78px] items-center justify-center border border-[#DDD8CF] bg-white">
              <ShoppingBag className="h-6 w-6 stroke-[1.25] text-[#969A95]" />
            </div>

            <span className="mt-5 font-serif text-[6px] tracking-[0.25em] text-[#92836A]">GENAN</span>

            <h2 className="mt-2 text-[18px] font-semibold text-[#2C3530]">
              {getSiteText(content, "cart_empty_text", "حقيبتك فارغة")}
            </h2>

            <p className="mt-1.5 max-w-[260px] text-[9px] leading-5 text-[#858A85]">
              اكتشف المنتجات وأضف القطع التي تحبها إلى حقيبتك.
            </p>

            <Link
              to="/products"
              className="mt-5 inline-flex h-[44px] items-center justify-center gap-2 border border-[#2C3932] bg-[#2C3932] px-7 text-[10px] font-semibold text-white active:bg-[#202A25]"
            >
              {getSiteText(content, "cart_start_shopping", "ابدأ التسوق")}
              <ArrowLeft className="h-3.5 w-3.5 stroke-[1.6]" />
            </Link>
          </section>
        ) : (
          <section className="mx-auto grid w-full max-w-[1200px] gap-6 px-4 py-5 md:px-6 md:py-8 lg:grid-cols-[minmax(0,1fr)_330px] lg:gap-10">
            <div>
              <div className="mb-3 flex items-center justify-between border-b border-[#E8E4DC] pb-3">
                <div>
                  <h2 className="text-[15px] font-semibold text-[#343A36] md:text-[18px]">منتجات الحقيبة</h2>
                  <p className="mt-1 text-[7px] text-[#929792] md:text-[8px]">{cart.length} منتج</p>
                </div>

                <Link
                  to="/products"
                  className="flex items-center gap-1 text-[8px] font-medium text-[#6B716D] md:text-[9px]"
                >
                  متابعة التسوق
                  <ArrowLeft className="h-3 w-3 stroke-[1.5]" />
                </Link>
              </div>

              <div className="divide-y divide-[#E9E5DE]">
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
                      className="py-4 md:py-5"
                    >
                      <div className="flex gap-3.5 md:gap-5">
                        <Link
                          to={`/product/${item.product.slug}`}
                          className="relative h-[132px] w-[100px] shrink-0 overflow-hidden bg-[#F1EFEA] md:h-[162px] md:w-[124px]"
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
                                <p className="mb-1 truncate text-[7px] tracking-[0.05em] text-[#92958F] md:text-[8px]">
                                  {item.product.brand}
                                </p>
                              )}

                              <h3 className="line-clamp-2 text-[11px] font-semibold leading-[1.6] text-[#303632] md:text-[13px]">
                                {item.product.nameAr}
                              </h3>
                            </Link>

                            <button
                              type="button"
                              onClick={() => removeFromCart(item.product.id, item.variantId)}
                              aria-label="حذف المنتج"
                              className="flex h-7 w-7 shrink-0 items-center justify-center border border-[#E3DFD8] bg-white text-[#8E8175] active:bg-[#F4F1EC]"
                            >
                              <Trash2 className="h-3.5 w-3.5 stroke-[1.4]" />
                            </button>
                          </div>

                          {(item.selectedSize || item.selectedColor) && (
                            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[7px] text-[#7D827D]">
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
                            <p className="mt-2 line-clamp-1 text-[7px] text-[#8D918C]">
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
                            <span className="text-[14px] font-semibold leading-none text-[#343A36] md:text-[16px]">
                              {formatCurrency(unitTotal)}
                            </span>

                            {!!discount && (
                              <span className="text-[7px] leading-none text-[#A2A5A0] line-through md:text-[8px]">
                                {formatCurrency(basePrice)}
                              </span>
                            )}
                          </div>

                          <div className="mt-4 flex items-end justify-between gap-3 md:mt-6">
                            <div className="flex h-[32px] items-center border border-[#DCD8D0] bg-white md:h-[35px]">
                              <button
                                type="button"
                                onClick={() => {
                                  if (item.quantity <= 1) return;
                                  updateQuantity(item.product.id, item.quantity - 1, item.variantId);
                                }}
                                disabled={item.quantity <= 1}
                                className="flex h-full w-8 items-center justify-center text-[#555B57] disabled:opacity-25 md:w-9"
                              >
                                <Minus className="h-3 w-3 stroke-[1.5]" />
                              </button>

                              <span className="flex h-full min-w-[30px] items-center justify-center border-x border-[#E5E1DA] px-1 text-[9px] font-semibold text-[#343A36] md:min-w-[34px]">
                                {item.quantity}
                              </span>

                              <button
                                type="button"
                                onClick={() => {
                                  if (maxQuantityReached) return;
                                  updateQuantity(item.product.id, item.quantity + 1, item.variantId);
                                }}
                                disabled={maxQuantityReached}
                                className="flex h-full w-8 items-center justify-center text-[#555B57] disabled:opacity-25 md:w-9"
                              >
                                <Plus className="h-3 w-3 stroke-[1.5]" />
                              </button>
                            </div>

                            <div className="text-left">
                              <span className="block text-[6px] text-[#A0A39E]">الإجمالي</span>
                              <span className="mt-1 block text-[11px] font-semibold leading-none text-[#4A504C] md:text-[13px]">
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
              <div className="border-t border-[#DDD9D1] pt-5 lg:sticky lg:top-28 lg:border lg:border-[#E4E0D8] lg:bg-[#FEFDFB] lg:p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="font-serif text-[6px] tracking-[0.22em] text-[#92836A]">GENAN CHECKOUT</p>
                    <h2 className="mt-1 text-[17px] font-semibold text-[#303732]">
                      {getSiteText(content, "cart_summary_title", "ملخص الطلب")}
                    </h2>
                  </div>

                  <ShoppingBag className="h-5 w-5 stroke-[1.35] text-[#858B86]" />
                </div>

                <div className="border-y border-[#E9E5DE] py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-[#7F857F]">
                      {getSiteText(content, "cart_subtotal_label", "المجموع الفرعي")}
                    </span>
                    <span className="text-[10px] font-semibold text-[#3B423E]">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <div className="flex items-end justify-between py-5">
                  <div>
                    <span className="block text-[10px] font-semibold text-[#363D39]">
                      {getSiteText(content, "cart_total_label", "الإجمالي")}
                    </span>
                    <span className="mt-1 block text-[7px] text-[#9A9E99]">شامل المنتجات الحالية</span>
                  </div>

                  <div className="text-left">
                    <span className="text-[23px] font-semibold leading-none text-[#2C332F]">
                      {formatCurrency(total)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => navigate("/checkout")}
                  className="flex h-[48px] w-full items-center justify-center gap-2 bg-[#2C3932] text-[11px] font-semibold text-white active:bg-[#202A25]"
                >
                  <ShoppingBag className="h-4 w-4 stroke-[1.45]" />
                  {getSiteText(content, "cart_checkout_cta", "إتمام الطلب")}
                </button>

                <Link
                  to="/products"
                  className="mt-2.5 flex h-[41px] w-full items-center justify-center gap-1.5 border border-[#DEDAD2] bg-white text-[9px] font-medium text-[#59615C]"
                >
                  {getSiteText(content, "cart_continue_cta", "متابعة التسوق")}
                  <ArrowLeft className="h-3 w-3 stroke-[1.5]" />
                </Link>

                <p className="mt-3 text-center text-[7px] leading-5 text-[#919691]">
                  يمكنك تطبيق رمز الخصم أثناء إتمام الطلب.
                </p>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
};

export default CartPage;

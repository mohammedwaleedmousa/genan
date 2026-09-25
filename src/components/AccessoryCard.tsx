import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Minus, Plus, X } from "lucide-react";

interface Accessory {
  name: string;
  name_ar: string;
  price: number;
  image_url?: string;
  description?: string;
  description_ar?: string;
}

interface AccessoryCardProps {
  accessory: Accessory;
  quantity: number;
  currency: string;
  onQuantityChange: (delta: number) => void;
}

const AccessoryCard = ({ accessory, quantity, currency, onQuantityChange }: AccessoryCardProps) => {
  const [showPopup, setShowPopup] = useState(false);

  return (
    <>
      <div className="flex items-center gap-3 border border-[#E7E2D9] bg-white p-2.5">
        <button
          type="button"
          onClick={() => setShowPopup(true)}
          className="h-16 w-16 shrink-0 overflow-hidden bg-[#F7F7F7]"
          aria-label={accessory.name_ar}
        >
          {accessory.image_url ? (
            <img
              src={accessory.image_url}
              alt={accessory.name_ar}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[16px] text-[#B8B0A5]">+</span>
          )}
        </button>

        <button type="button" onClick={() => setShowPopup(true)} className="min-w-0 flex-1 text-right">
          <p className="truncate text-[9px] font-semibold text-[#0E0E0E]">{accessory.name_ar}</p>
          <p className="mt-1 text-[8px] font-semibold text-[#9A825B]">+{accessory.price} {currency}</p>
        </button>

        <div className="flex h-9 items-center border border-[#DCD6CC]">
          <button
            type="button"
            onClick={() => onQuantityChange(-1)}
            disabled={quantity <= 0}
            className="flex h-full w-8 items-center justify-center disabled:opacity-30"
            aria-label="تقليل الكمية"
          >
            <Minus className="h-3 w-3" />
          </button>
          <span className="flex h-full min-w-[30px] items-center justify-center border-x border-[#E7E2D9] text-[9px] font-semibold text-[#0E0E0E]">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => onQuantityChange(1)}
            className="flex h-full w-8 items-center justify-center"
            aria-label="زيادة الكمية"
          >
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showPopup && (
          <>
            <motion.button
              type="button"
              aria-label="إغلاق"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPopup(false)}
              className="fixed inset-0 z-[70] bg-black/45"
            />

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              className="fixed inset-x-4 bottom-4 z-[80] mx-auto max-w-[520px] border border-[#E7E2D9] bg-white md:inset-x-auto md:bottom-auto md:left-1/2 md:top-1/2 md:w-[520px] md:-translate-x-1/2 md:-translate-y-1/2"
              dir="rtl"
            >
              <button
                type="button"
                onClick={() => setShowPopup(false)}
                className="absolute left-3 top-3 z-10 flex h-8 w-8 items-center justify-center border border-[#E7E2D9] bg-white"
                aria-label="إغلاق"
              >
                <X className="h-3.5 w-3.5" />
              </button>

              <div className="aspect-[16/10] overflow-hidden bg-[#F7F7F7]">
                {accessory.image_url ? (
                  <img
                    src={accessory.image_url}
                    alt={accessory.name_ar}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-[18px] text-[#B8B0A5]">GENAN</div>
                )}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[7px] font-semibold tracking-[.22em] text-[#9A825B]">ADD-ON</span>
                    <h3 className="mt-1.5 text-[16px] font-semibold text-[#0E0E0E]">{accessory.name_ar}</h3>
                  </div>
                  <span className="text-[14px] font-semibold text-[#0E0E0E]">+{accessory.price} {currency}</span>
                </div>

                {accessory.description_ar && (
                  <p className="mt-3 text-[9px] leading-6 text-[#666]">{accessory.description_ar}</p>
                )}

                <div className="mt-5 flex items-center justify-between border-t border-[#E7E2D9] pt-4">
                  <div className="flex h-10 items-center border border-[#DCD6CC]">
                    <button
                      type="button"
                      onClick={() => onQuantityChange(-1)}
                      disabled={quantity <= 0}
                      className="flex h-full w-10 items-center justify-center disabled:opacity-30"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="flex h-full min-w-[38px] items-center justify-center border-x border-[#E7E2D9] text-[10px] font-semibold">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => onQuantityChange(1)}
                      className="flex h-full w-10 items-center justify-center"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (quantity === 0) onQuantityChange(1);
                      setShowPopup(false);
                    }}
                    className="h-10 bg-[#0E0E0E] px-6 text-[9px] font-semibold text-white"
                  >
                    {quantity > 0 ? "تم" : "أضف إلى الطلب"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default AccessoryCard;

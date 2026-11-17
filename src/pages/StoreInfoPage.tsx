import { useEffect } from "react";
import { ArrowLeft, ChevronDown, Clock, Mail, MessageCircle, Phone, Shield, Truck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import StoreStory from "@/components/StoreStory";

import { supabase } from "@/integrations/supabase/client";
import { getSiteText, useSiteContent } from "@/hooks/useSiteContent";

const StoreInfoPage = () => {
  const location = useLocation();
  const { data: content } = useSiteContent("store_info_");

  const { data: storeInfo } = useQuery({
    queryKey: ["store-info"],

    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key, value").in("key", ["store_info", "whatsapp", "whatsapp_ye", "whatsapp_sa"]);

      if (error) throw error;

      let storeData: Record<string, unknown> = {};

      data?.forEach((item) => {
        if (item.key === "store_info") {
          if (typeof item.value === "string") {
            try {
              storeData = JSON.parse(item.value) as Record<string, unknown>;
            } catch {
              storeData = { name: "Genan" };
            }
          } else if (item.value && typeof item.value === "object" && !Array.isArray(item.value)) {
            storeData = item.value as Record<string, unknown>;
          }
        } else {
          storeData[item.key] = item.value;
        }
      });

      return storeData;
    },

    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });

  useEffect(() => {
    if (!location.hash) return;
    const targetId = decodeURIComponent(location.hash.slice(1));
    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "start", behavior: "auto" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [location.hash, location.key]);

  const whatsappNumber = storeInfo?.whatsapp || storeInfo?.whatsapp_ye || storeInfo?.whatsapp_sa;
  const phone = String(storeInfo?.phone_sa || storeInfo?.phone_ye || storeInfo?.phone || "");
  const email = String(storeInfo?.email || "").trim();
  const showEmail = Boolean(email && email.toLowerCase() !== "info@genan.com");
  const whatsappDigits = String(whatsappNumber || phone).replace(/\D/g, "");

  const facts = [
    {
      label: getSiteText(content, "store_info_phone_label", "الهاتف"),
      value: phone,
      icon: Phone,
      href: phone ? `tel:${phone}` : "",
    },
    ...(showEmail ? [{
      label: getSiteText(content, "store_info_email_label", "البريد الإلكتروني"),
      value: email,
      icon: Mail,
      href: `mailto:${email}`,
    }] : []),
    {
      label: getSiteText(content, "store_info_hours_label", "ساعات العمل"),
      value: getSiteText(content, "store_info_hours_value", "يوميًا · استقبال الطلبات على مدار الساعة"),
      icon: Clock,
      href: "",
    },
  ];

  const faq = [
    {
      q: getSiteText(content, "store_info_faq_1_q", "كيف أعرف حالة طلبي؟"),
      a: getSiteText(content, "store_info_faq_1_a", "استخدم صفحة تتبع الطلب وأدخل بيانات الطلب المطلوبة لمعرفة آخر حالة مسجلة."),
    },
    {
      q: getSiteText(content, "store_info_faq_2_q", "كيف أعرف رسوم ومدة التوصيل؟"),
      a: getSiteText(content, "store_info_faq_2_a", "تظهر شركة التوصيل ورسومها والمعلومات المتاحة عنها أثناء إتمام الطلب قبل التأكيد النهائي."),
    },
    {
      q: getSiteText(content, "store_info_faq_3_q", "كيف أطلب إرجاعاً أو استبدالاً؟"),
      a: getSiteText(content, "store_info_faq_3_a", "تواصل مع خدمة العملاء وأرسل رقم الطلب وتفاصيل المنتج، وسيتم التحقق من الطلب وحالة المنتج وإرشادك للخطوة المناسبة."),
    },
  ];

  return (
    <div className="min-h-screen bg-white text-[#0E0E0E]" dir="rtl">
      <Navbar />
      <CartDrawer />

      <main id="main-content" className="!pb-0">
        <StoreStory content={content} />

        <section aria-labelledby="genan-support-title" className="border-t border-[#EEE9DF] bg-[#FAF8F3]">
          <div className="mx-auto max-w-[1280px] px-5 py-10 sm:px-10 sm:py-14 lg:px-14">
            <header className="mb-5 sm:mb-7">
              <h2 id="genan-support-title" className="text-3xl font-semibold sm:text-4xl">خدمة العملاء</h2>
              <p className="mt-2 max-w-[34rem] text-sm leading-7 text-[#62605C] sm:text-base">
                {getSiteText(content, "store_info_cta_description", "نساعدكِ في معرفة تفاصيل القطعة والمقاسات المتوفرة وخيارات التوصيل قبل الطلب.")}
              </p>
            </header>

            <div className="grid gap-4 lg:grid-cols-[1fr_1.18fr]">
              <section id="contact" className="scroll-mt-32 rounded-xl border border-[#EAE4D9] bg-white p-4 sm:p-6">
                <h3 className="text-lg font-semibold sm:text-xl">معلومات المتجر</h3>
                <dl className="mt-2 divide-y divide-[#EEE9DF]">
                  {facts.filter(({ value }) => value).map(({ label, value, icon: Icon, href }) => (
                    <div key={label} className="grid grid-cols-[minmax(6rem,.7fr)_minmax(0,1.3fr)] items-center gap-3 py-3">
                      <dt className="flex items-center gap-2 text-sm text-[#655B4E]">
                        <Icon size={16} aria-hidden="true" className="shrink-0 text-[#8C6B32]" /> {label}
                      </dt>
                      <dd className="break-words text-sm font-medium leading-6">
                        {href ? <a href={href} className="underline decoration-[#D8C29A] underline-offset-4"><bdi>{value}</bdi></a> : value}
                      </dd>
                    </div>
                  ))}
                </dl>
                {whatsappDigits && (
                  <a href={`https://wa.me/${whatsappDigits}`} className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D8C29A] px-4 text-sm font-semibold hover:bg-[#F6F3EA]">
                    <MessageCircle size={17} aria-hidden="true" />
                    {getSiteText(content, "store_info_cta_whatsapp", "تواصلي عبر واتساب")}
                  </a>
                )}
              </section>

              <section id="faq" className="scroll-mt-32 rounded-xl border border-[#EAE4D9] bg-white p-4 sm:p-6">
                <h3 className="text-lg font-semibold sm:text-xl">الأسئلة الشائعة</h3>
                <div className="mt-2 divide-y divide-[#EEE9DF]">
                  {faq.map(({ q, a }) => (
                    <details key={q} className="group">
                      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 py-3 text-sm font-semibold sm:text-base">
                        {q} <ChevronDown size={16} aria-hidden="true" className="shrink-0 text-[#806434] group-open:rotate-180" />
                      </summary>
                      <p className="pb-4 text-sm leading-7 text-[#62605C]">{a}</p>
                    </details>
                  ))}
                </div>
              </section>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <section id="shipping" className="scroll-mt-32 border-t border-[#E3DAC9] px-1 pt-4">
                <h3 className="flex items-center gap-2 text-base font-semibold"><Truck size={18} aria-hidden="true" className="text-[#8C6B32]" /> {getSiteText(content, "store_info_shipping_details_title", "الشحن والتوصيل")}</h3>
                <p className="mt-2 text-sm leading-7 text-[#62605C]">{getSiteText(content, "store_info_shipping_details_desc", "اختاري شركة التوصيل أثناء إتمام الطلب. تظهر الرسوم والمعلومات المتاحة عن التوصيل قبل تأكيد الطلب.")}</p>
                <Link to="/shipping-policy" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-[#D8C29A] underline-offset-4">
                  سياسة الشحن <ArrowLeft size={14} aria-hidden="true" />
                </Link>
              </section>
              <section id="returns" className="scroll-mt-32 border-t border-[#E3DAC9] px-1 pt-4">
                <h3 className="flex items-center gap-2 text-base font-semibold"><Shield size={18} aria-hidden="true" className="text-[#8C6B32]" /> {getSiteText(content, "store_info_returns_title", "الإرجاع والاستبدال")}</h3>
                <p className="mt-2 text-sm leading-7 text-[#62605C]">{getSiteText(content, "store_info_returns_desc", "إذا احتجتِ إلى إرجاع أو استبدال، تواصلي مع خدمة العملاء وشاركي رقم الطلب وتفاصيل المنتج.")}</p>
                <Link to="/returns-policy" className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-[#D8C29A] underline-offset-4">
                  شروط الإرجاع <ArrowLeft size={14} aria-hidden="true" />
                </Link>
              </section>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default StoreInfoPage;

import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";

interface PolicySection {
  id: string;
  path?: string;
  title: string;
  items: string[];
}

const documentTitle = "السياسات والشروط والأحكام";
const sections: PolicySection[] = [
  {
    id: "orders",
    title: "أولاً: سياسة الطلبات والشراء",
    items: [
      "يستقبل بوتيك جنان الطلبات عبر الموقع الإلكتروني وحسابات التواصل الاجتماعي المعتمدة، بما في ذلك واتساب وإنستغرام.",
      "يجب على العميل التأكد من صحة بيانات التواصل ورقم الهاتف وعنوان التوصيل قبل تأكيد الطلب.",
      "يعتبر الطلب مؤكداً بعد مراجعة تفاصيله واعتماده من قبل المتجر.",
      "تخضع الطلبات لتوفر المنتجات في المخزون.",
      "في حال عدم توفر منتج تم طلبه، يحق للمتجر إبلاغ العميل واقتراح البدائل أو إلغاء المنتج غير المتوفر.",
      "يلتزم المتجر بتوضيح تفاصيل الطلب والسعر الإجمالي ورسوم التوصيل قبل التأكيد النهائي.",
    ],
  },
  {
    id: "payment",
    title: "ثانياً: سياسة الدفع",
    items: [
      "يتم توضيح أسعار المنتجات وطرق الدفع المتاحة للعميل قبل إتمام الطلب.",
      "يجب الالتزام بطرق الدفع المعتمدة والمعلنة من قبل البوتيك.",
      "لا يعتبر الطلب مدفوعاً إلا بعد التحقق من استلام المبلغ.",
      "في حال وجود خطأ في عملية الدفع، يرجى التواصل مع خدمة العملاء وتقديم ما يثبت العملية.",
    ],
  },
  {
    id: "shipping",
    path: "/shipping-policy",
    title: "ثالثاً: سياسة الشحن والتوصيل",
    items: [
      "يوفر بوتيك جنان خدمة التوصيل إلى مختلف محافظات الجمهورية اليمنية، وفقاً لنطاق تغطية شركات التوصيل المتاحة.",
      "يتم تحديد رسوم التوصيل وفقاً للمدينة أو المنطقة وموقع العميل.",
      "يتم إبلاغ العميل برسوم التوصيل والمدة التقديرية قبل تأكيد الطلب.",
      "يتحمل العميل مسؤولية تقديم عنوان صحيح ورقم هاتف فعال.",
      "في حال تعذر استلام الطلب بسبب عدم صحة بيانات العميل أو عدم تجاوبه مع مندوب التوصيل، يتم التنسيق معه بشأن إعادة التوصيل وأي رسوم إضافية مترتبة عليها.",
      "قد تتأثر مواعيد التوصيل بالظروف اللوجستية أو الظروف الخارجة عن إرادة المتجر.",
    ],
  },
  {
    id: "returns",
    path: "/returns-policy",
    title: "رابعاً: سياسة الاستبدال والاسترجاع",
    items: [
      "يحق للعميل تقديم طلب الاستبدال أو الاسترجاع خلال مدة لا تتجاوز 3 أيام من تاريخ استلام المنتج.",
      "يشترط لقبول الطلب أن يكون المنتج بحالته الأصلية، غير مستخدم أو متضرر، مع الاحتفاظ بالتغليف والملحقات الأصلية إن وجدت.",
      "تخضع المنتجات للفحص والتحقق من حالتها قبل الموافقة على الاستبدال أو الاسترجاع.",
      "تتم دراسة طلبات الاسترجاع والموافقة عليها وفقاً لطبيعة الحالة وسبب الطلب.",
      "في حال الموافقة على الاسترجاع، يتم تحديد آلية إعادة المبلغ بالتنسيق بين العميل وإدارة البوتيك.",
      "يتحمل العميل رسوم التوصيل الخاصة بعملية الاستبدال أو الاسترجاع، ما لم يكن السبب ناتجاً عن خطأ من المتجر أو عيب في المنتج، حيث يتحمل المتجر التكاليف المتعلقة بذلك.",
      "لا تشمل هذه السياسة أي تنازل عن الحقوق القانونية الإلزامية للعميل بموجب القوانين المعمول بها.",
    ],
  },
  {
    id: "products",
    title: "خامساً: سياسة المنتجات والصور",
    items: [
      "يحرص بوتيك جنان على تقديم صور وأوصاف دقيقة للمنتجات.",
      "قد تظهر اختلافات طفيفة في درجات الألوان نتيجة اختلاف الإضاءة أو إعدادات الشاشات.",
      "يتحمل العميل مسؤولية مراجعة تفاصيل المنتج والمقاسات والمواصفات قبل إتمام الطلب.",
      "في حال وجود اختلاف جوهري بين المنتج المستلم والوصف المعروض، يرجى التواصل مع خدمة العملاء.",
    ],
  },
  {
    id: "privacy",
    path: "/privacy-policy",
    title: "سادساً: سياسة الخصوصية وحماية البيانات",
    items: [
      "يحترم بوتيك جنان خصوصية العملاء ويلتزم بالحفاظ على سرية بياناتهم.",
      "يتم جمع البيانات الضرورية لإتمام الطلبات والتواصل مع العملاء وتنظيم عمليات التوصيل وخدمة ما بعد البيع.",
      "لا تتم مشاركة بيانات العملاء إلا مع الجهات اللازمة لتنفيذ الخدمات، مثل شركات التوصيل، أو عند وجود التزام قانوني.",
      "لا يتم استخدام بيانات العملاء لأغراض تسويقية غير مرتبطة بالخدمات إلا وفق الأسس والموافقات اللازمة.",
      "يحرص البوتيك على اتخاذ التدابير المناسبة لحماية بيانات العملاء من الوصول أو الاستخدام غير المصرح به.",
    ],
  },
  {
    id: "support",
    title: "سابعاً: خدمة العملاء والشكاوى",
    items: [
      "يمكن للعملاء التواصل مع بوتيك جنان عبر قنوات التواصل الرسمية المعلنة.",
      "يستقبل المتجر الاستفسارات والشكاوى المتعلقة بالطلبات والمنتجات والتوصيل.",
      "تتم مراجعة الشكاوى والعمل على معالجتها خلال فترة زمنية مناسبة وفقاً لطبيعة كل حالة.",
      "يرجى إرفاق رقم الطلب وصور المنتج عند تقديم شكوى تتعلق بالمنتج المستلم.",
    ],
  },
  {
    id: "terms",
    title: "ثامناً: الشروط والأحكام العامة",
    items: [
      "يحق لبوتيك جنان تحديث الأسعار والعروض وتوفر المنتجات وفقاً لمتطلبات العمل.",
      "تخضع الطلبات للسياسات المعمول بها وقت تأكيد الشراء.",
      "يحق للمتجر تحديث هذه الوثيقة عند الحاجة، مع نشر النسخة المحدثة عبر الموقع الإلكتروني.",
      "لا يجوز استخدام الموقع أو قنوات المتجر بطريقة تنتهك القوانين أو تضر بحقوق المتجر أو العملاء الآخرين.",
      "تخضع هذه الشروط للقوانين والأنظمة المعمول بها في الجمهورية اليمنية، مع مراعاة حقوق المستهلك الإلزامية.",
    ],
  },
];

const PolicyBrand = () => (
  <span>بوتيك جنان <span aria-hidden="true">|</span> <bdi lang="en">JINAN BOUTIQUE</bdi></span>
);

const PolicyPage = () => {
  const { pathname, hash } = useLocation();
  const path = pathname.replace(/\/+$/, "").toLowerCase();
  const selectedSection = sections.find((section) => section.path === path);
  const visibleSections = selectedSection ? [selectedSection] : sections;

  useEffect(() => {
    if (!hash) return;
    document.getElementById(hash.slice(1))?.scrollIntoView({ block: "start" });
  }, [hash, path]);

  return (
    <div className="min-h-screen bg-[#FFFDFC] text-[#302725]" dir="rtl">
      <Navbar />
      <CartDrawer />

      <main id="main-content" className="mx-auto w-full max-w-[880px] px-4 pb-16 pt-5 md:px-6 md:pb-20 md:pt-8">
        <header className="rounded-[20px] border border-[#E9DFDB] bg-[#F6F3EA] px-5 py-7 md:px-8 md:py-10">
          <p className="text-sm font-semibold text-[#6F5730]"><PolicyBrand /></p>
          <h1 className="mt-3 text-2xl font-semibold leading-relaxed md:text-4xl">{selectedSection?.title ?? documentTitle}</h1>
          <p className="mt-2 text-sm leading-7 text-[#62564C]">النسخة المعتمدة للنشر على الموقع الإلكتروني</p>
          {selectedSection ? (
            <Link to="/terms" className="mt-5 inline-block font-semibold text-burgundy underline underline-offset-4">
              {documentTitle}
            </Link>
          ) : (
            <div className="mt-5 space-y-2 text-[15px] leading-8 text-[#514640]">
              <p>مرحباً بكم في بوتيك جنان.</p>
              <p>نحرص في بوتيك جنان على تقديم تجربة تسوق تجمع بين الأناقة والجودة والموثوقية. توضح هذه الوثيقة السياسات المنظمة لعمليات الشراء والدفع والتوصيل والاستبدال والاسترجاع والخصوصية، بهدف ضمان حقوق العملاء والمتجر وتوفير تجربة تسوق واضحة ومريحة.</p>
            </div>
          )}
        </header>

        {!selectedSection && (
          <nav aria-label="فهرس السياسات" className="mt-5 rounded-[18px] border border-[#EAE0DC] bg-white px-5 py-4 md:px-8">
            <ul className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {sections.map((section) => (
                <li key={section.id}>
                  <a href={"#" + section.id} className="inline-block py-1.5 text-sm text-burgundy underline underline-offset-4">
                    {section.title}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        <article className="mt-5 divide-y divide-[#F0E8E5] rounded-[18px] border border-[#EAE0DC] bg-white">
          {visibleSections.map((section) => (
            <section key={section.id} id={section.id} className="scroll-mt-24 px-5 py-6 md:px-8 md:py-8">
              {!selectedSection && <h2 className="mb-4 text-lg font-semibold leading-relaxed md:text-xl">{section.title}</h2>}
              <ol className="list-decimal space-y-3 ps-6 text-[15px] leading-8 text-[#514640] marker:font-semibold marker:text-[#6F5730]">
                {section.items.map((item) => <li key={item} className="ps-1">{item}</li>)}
              </ol>
            </section>
          ))}
          <div className="px-5 py-6 text-sm leading-7 md:px-8">
            <p className="font-semibold"><PolicyBrand /></p>
            <p>الأناقة تبدأ من اختيارك.</p>
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
};

export default PolicyPage;

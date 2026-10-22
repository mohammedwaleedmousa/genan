import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpLeft } from "lucide-react";

const footerGroups = [
  {
    title: "تسوق",
    links: [
      { label: "جميع المنتجات", to: "/products" },
      { label: "الأقسام", to: "/categories" },
      { label: "الماركات", to: "/brands" },
      { label: "وصل حديثًا", to: "/new-arrivals" },
    ],
  },
  {
    title: "خدمة العملاء",
    links: [
      { label: "تتبع الطلب", to: "/order-tracking" },
      { label: "سياسة الشحن", to: "/shipping-policy" },
      { label: "الإرجاع والاستبدال", to: "/returns-policy" },
      { label: "التواصل", to: "/store-info#contact" },
    ],
  },
  {
    title: "جنان",
    links: [
      { label: "عن المتجر", to: "/store-info#about" },
      { label: "سياسة الخصوصية", to: "/privacy-policy" },
      { label: "الشروط والأحكام", to: "/terms" },
    ],
  },
];

const EditorialFooter = () => (
  <footer className="genan-editorial-footer mt-12 border-t border-white/10 bg-[#0B100F] text-white" dir="rtl">
    <div className="mx-auto grid max-w-[1520px] gap-12 px-5 pb-12 pt-14 sm:px-8 md:grid-cols-[1.15fr_2fr] md:gap-16 md:pt-20 lg:px-12">
      <div>
        <Link to="/home" aria-label="GENAN — الرئيسية" className="inline-flex flex-col">
          <span className="font-serif text-4xl font-medium tracking-[.3em] text-[#F5F3E9]" dir="ltr">GENAN</span>
          <span className="mt-2 text-[15px] tracking-widest text-[#AFC4B6]">جنان</span>
        </Link>
        <p className="mt-6 max-w-[290px] text-[13px] leading-8 text-white/60">
          تفاصيل تعكس ذوقك. اكتشف مجموعة جنان بأسلوب تسوق سهل وتجربة مميزة.
        </p>
        <Link to="/store-info#contact" className="mt-7 inline-flex items-center gap-3 rounded-full border border-white/25 px-5 py-3 text-[12px] text-[#E6E6E0] hover:border-[#B4D0B9] hover:bg-white/5">
          تواصل معنا <ArrowUpLeft className="h-4 w-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
        {footerGroups.map((group) => (
          <div key={group.title}>
            <h3 className="text-[14px] font-semibold text-[#EDEDE6]">{group.title}</h3>
            <div className="mt-5 flex flex-col items-start gap-4">
              {group.links.map((item) => (
                <Link key={item.to} to={item.to} className="text-[12px] text-white/55 transition-colors hover:text-[#C5DDCB]">
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="mx-auto flex max-w-[1520px] flex-wrap items-center justify-between gap-4 border-t border-white/10 px-5 py-6 sm:px-8 lg:px-12">
      <p className="text-[11px] text-white/45">© {new Date().getFullYear()} GENAN — جميع الحقوق محفوظة</p>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="inline-flex min-h-11 items-center gap-2 text-[12px] text-[#DAE5DC] hover:text-white"
      >
        العودة للأعلى <ArrowUp className="h-4 w-4" />
      </button>
    </div>
  </footer>
);

export default EditorialFooter;

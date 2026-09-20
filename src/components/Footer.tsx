import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpLeft } from "lucide-react";

const columns = [
  {
    index: "01",
    title: "اكتشف",
    links: [
      { label: "وصل حديثًا", href: "/new-arrivals" },
      { label: "جميع المنتجات", href: "/products" },
      { label: "الماركات", href: "/brands" },
      { label: "العروض", href: "/seasonal-offers" },
    ],
  },
  {
    index: "02",
    title: "الخدمة",
    links: [
      { label: "تتبع الطلب", href: "/order-tracking" },
      { label: "الشحن والتوصيل", href: "/shipping-policy" },
      { label: "الإرجاع والاستبدال", href: "/returns-policy" },
      { label: "تواصل معنا", href: "/store-info#contact" },
    ],
  },
  {
    index: "03",
    title: "جنان",
    links: [
      { label: "عن جنان", href: "/store-info#about" },
      { label: "الخصوصية", href: "/privacy-policy" },
      { label: "الشروط والأحكام", href: "/terms" },
      { label: "باركود المتجر", href: "/qr-code" },
    ],
  },
];

const Footer = () => (
  <footer className="w-full bg-[#102A20] text-[#F3EFE4]" dir="rtl">
    <div className="mx-auto max-w-[1680px] px-5 sm:px-8 lg:px-12">
      <div className="grid gap-10 border-b border-white/15 py-12 md:grid-cols-[1.15fr_1.85fr] md:gap-16 md:py-16">
        <div className="max-w-[560px]">
          <span className="text-[8px] font-semibold tracking-[0.34em] text-[#C7A866]">GENAN / ADEN</span>
          <h2 className="mt-5 text-[34px] font-medium leading-[1.55] tracking-[-0.045em] text-white md:text-[48px]">
            اختيار أقل.<br />حضور أقوى.
          </h2>
          <p className="mt-5 max-w-[430px] text-[11px] leading-7 text-white/55 md:text-[13px]">
            مساحة أزياء مرتبة كفهرس بصري؛ نعرض القطع بوضوح ونترك لك مساحة كافية لتختار ما يشبهك.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-7 gap-y-10 sm:grid-cols-3">
          {columns.map((column) => (
            <div key={column.index} className="border-t border-white/20 pt-4">
              <div className="mb-6 flex items-center justify-between gap-3">
                <h3 className="text-[12px] font-semibold text-white">{column.title}</h3>
                <span className="text-[8px] tracking-[0.18em] text-[#C7A866]">{column.index}</span>
              </div>
              <ul className="space-y-3.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link to={link.href} className="group inline-flex items-center gap-2 text-[11px] text-white/58 transition-colors hover:text-white md:text-[12px]">
                      {link.label}
                      <ArrowUpLeft className="h-3 w-3 opacity-0 transition-all group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" strokeWidth={1.4} />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-b border-white/15 py-7 md:py-10">
        <Link to="/home" aria-label="Genan" className="block overflow-hidden">
          <span className="block font-serif text-[clamp(54px,11vw,168px)] font-medium leading-[0.82] tracking-[0.12em] text-white">
            GENAN
          </span>
        </Link>
      </div>

      <div className="flex flex-col gap-4 py-5 text-[9px] text-white/40 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 GENAN — جميع الحقوق محفوظة.</p>
        <div className="flex items-center gap-5">
          <span className="tracking-[0.18em]">CURATED FASHION INDEX</span>
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="inline-flex items-center gap-2 border-b border-white/25 pb-1 text-white/70 transition-colors hover:border-white hover:text-white">
            للأعلى
            <ArrowUp className="h-3 w-3" strokeWidth={1.4} />
          </button>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

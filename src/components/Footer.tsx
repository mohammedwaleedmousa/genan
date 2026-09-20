import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpLeft } from "lucide-react";

const groups = [
  { title: "التسوق", links: [["جميع المنتجات", "/products"], ["وصل حديثًا", "/new-arrivals"], ["الماركات", "/brands"], ["العروض", "/seasonal-offers"]] },
  { title: "المساعدة", links: [["تتبع الطلب", "/order-tracking"], ["الشحن والتوصيل", "/shipping-policy"], ["الإرجاع والاستبدال", "/returns-policy"], ["الأسئلة الشائعة", "/store-info#faq"]] },
  { title: "جنان", links: [["عن جنان", "/store-info#about"], ["الخصوصية", "/privacy-policy"], ["الشروط والأحكام", "/terms"], ["تواصل معنا", "/store-info#contact"]] },
];

const Footer = () => (
  <footer className="bg-[#0E0E0E] text-white" dir="rtl">
    <div className="border-b border-white/10 px-5 py-12 sm:px-8 md:px-[6vw] md:py-16">
      <div className="grid gap-12 lg:grid-cols-[1.25fr_.75fr] lg:items-end">
        <div>
          <span className="text-[8px] font-semibold tracking-[.4em] text-[#E6D7B8]">GENAN / STAY CURIOUS</span>
          <h2 className="mt-4 max-w-[880px] text-[38px] font-medium leading-[1.35] tracking-[-.055em] text-white sm:text-[52px] lg:text-[68px]">
            مساحة أهدأ للتسوق، واختيار أكثر وضوحًا.
          </h2>
        </div>
        <Link to="/products" className="group inline-flex w-fit items-center gap-5 border-b border-white/30 pb-3 text-[11px] font-semibold text-white">
          ابدأ الاكتشاف
          <ArrowUpLeft className="h-4 w-4 text-[#A9D8D3] transition-transform group-hover:-translate-x-1 group-hover:-translate-y-1" strokeWidth={1.4} />
        </Link>
      </div>
    </div>

    <div className="grid border-b border-white/10 md:grid-cols-[1.1fr_1.9fr]">
      <div className="flex min-h-[240px] flex-col justify-between border-b border-white/10 px-5 py-9 sm:px-8 md:border-b-0 md:border-l md:px-[6vw] md:py-12">
        <div>
          <Link to="/home" className="text-[34px] font-medium tracking-[.18em] text-white">GENAN</Link>
          <p className="mt-4 max-w-[360px] text-[11px] leading-7 text-white/48">
            متجر إلكتروني انتقائي للأزياء والإكسسوارات، مبني حول جودة العرض وسهولة الاختيار.
          </p>
        </div>
        <span className="mt-10 text-[8px] tracking-[.28em] text-white/30">ADEN / YEMEN</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3">
        {groups.map((group, groupIndex) => (
          <div key={group.title} className={`min-h-[240px] px-5 py-9 sm:px-7 md:py-12 ${groupIndex < groups.length - 1 ? "border-l border-white/10" : ""}`}>
            <p className="text-[8px] font-semibold tracking-[.24em] text-[#E6D7B8]">{group.title}</p>
            <ul className="mt-6 space-y-3.5">
              {group.links.map(([label, href]) => (
                <li key={href}>
                  <Link to={href} className="text-[11px] text-white/60 transition-colors hover:text-white">{label}</Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>

    <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8 md:px-[6vw]">
      <p className="text-[8px] tracking-[.16em] text-white/32">© 2026 GENAN — ALL RIGHTS RESERVED</p>
      <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex w-fit items-center gap-2 text-[9px] text-white/55 transition-colors hover:text-white">
        العودة للأعلى <ArrowUp className="h-3.5 w-3.5" />
      </button>
    </div>
  </footer>
);

export default Footer;

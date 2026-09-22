import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpLeft, Instagram, MessageCircle } from "lucide-react";

const groups = [
  {
    title: "اكتشف",
    links: [
      ["جميع المنتجات", "/products"],
      ["وصل حديثًا", "/new-arrivals"],
      ["الماركات", "/brands"],
      ["العروض", "/seasonal-offers"],
    ],
  },
  {
    title: "الخدمة",
    links: [
      ["تتبع الطلب", "/order-tracking"],
      ["الشحن والتوصيل", "/shipping-policy"],
      ["الإرجاع والاستبدال", "/returns-policy"],
      ["الأسئلة الشائعة", "/store-info#faq"],
    ],
  },
  {
    title: "جنان",
    links: [
      ["عن جنان", "/store-info#about"],
      ["تواصل معنا", "/store-info#contact"],
      ["الخصوصية", "/privacy-policy"],
      ["الشروط والأحكام", "/terms"],
    ],
  },
];

const Footer = () => (
  <footer className="border-t border-[#E8E5DE] bg-[#F7F5F0] text-[#0E0E0E]" dir="rtl">
    <div className="px-5 py-10 sm:px-8 md:px-[6vw] md:py-14">
      <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[1.15fr_1.85fr] lg:gap-16">
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-px w-9 bg-[#C9B183]" />
              <span className="text-[8px] font-semibold tracking-[.34em] text-[#9A825B]">GENAN / ADEN</span>
            </div>

            <Link to="/home" className="mt-5 inline-block text-[34px] font-medium tracking-[.19em] text-[#0E0E0E] md:text-[42px]">
              GENAN
            </Link>

            <p className="mt-4 max-w-[390px] text-[11px] leading-7 text-[#6E6E6E]">
              تجربة تسوق منتقاة للأزياء والإكسسوارات، بهوية هادئة ومساحة أكبر للمنتج.
            </p>
          </div>

          <div className="mt-8 flex items-center gap-2">
            <Link
              to="/store-info#contact"
              className="flex h-10 items-center gap-2 border border-[#D9D4C9] bg-white px-4 text-[9px] font-semibold transition-colors hover:border-[#0E0E0E]"
            >
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.4} />
              تواصل معنا
            </Link>
            <a
              href="#"
              aria-label="Instagram"
              className="flex h-10 w-10 items-center justify-center border border-[#D9D4C9] bg-white transition-colors hover:border-[#0E0E0E]"
            >
              <Instagram className="h-3.5 w-3.5" strokeWidth={1.4} />
            </a>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-x-7 gap-y-9 border-t border-[#DCD7CD] pt-7 sm:grid-cols-3 lg:border-t-0 lg:pt-0">
            {groups.map((group, index) => (
              <div key={group.title} className={index > 0 ? "lg:border-r lg:border-[#DFDAD0] lg:pr-7" : ""}>
                <div className="flex items-center gap-2">
                  <span className="text-[7px] font-semibold tracking-[.18em] text-[#A38B60]">0{index + 1}</span>
                  <p className="text-[9px] font-semibold text-[#0E0E0E]">{group.title}</p>
                </div>

                <ul className="mt-5 space-y-3">
                  {group.links.map(([label, href]) => (
                    <li key={href}>
                      <Link
                        to={href}
                        className="group inline-flex items-center gap-2 text-[10px] text-[#707070] transition-colors hover:text-[#0E0E0E]"
                      >
                        <span>{label}</span>
                        <ArrowUpLeft className="h-3 w-3 opacity-0 transition-all group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" strokeWidth={1.3} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-9 flex flex-col gap-4 border-t border-[#DCD7CD] pt-5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[8px] tracking-[.12em] text-[#8A8A8A]">© 2026 GENAN — ALL RIGHTS RESERVED</p>

            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="flex w-fit items-center gap-2 text-[9px] font-medium text-[#606060] transition-colors hover:text-[#0E0E0E]"
            >
              العودة للأعلى
              <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.4} />
            </button>
          </div>
        </div>
      </div>
    </div>
  </footer>
);

export default Footer;

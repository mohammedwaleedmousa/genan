import { Link } from "react-router-dom";
import { ArrowUp, Instagram, MessageCircle } from "lucide-react";

const groups = [
  {
    title: "التسوق",
    links: [
      ["المنتجات", "/products"],
      ["وصل حديثًا", "/new-arrivals"],
      ["الماركات", "/brands"],
      ["العروض", "/seasonal-offers"],
    ],
  },
  {
    title: "الخدمة",
    links: [
      ["تتبع الطلب", "/order-tracking"],
      ["الشحن", "/shipping-policy"],
      ["الإرجاع", "/returns-policy"],
      ["الأسئلة الشائعة", "/store-info#faq"],
    ],
  },
  {
    title: "جنان",
    links: [
      ["عن جنان", "/store-info#about"],
      ["تواصل معنا", "/store-info#contact"],
      ["الخصوصية", "/privacy-policy"],
      ["الشروط", "/terms"],
    ],
  },
];

const Footer = () => (
  <footer className="border-t border-[#E7E2D9] bg-[#FAF9F6] text-[#0E0E0E]" dir="rtl">
    <div className="mx-auto max-w-[1500px] px-4 py-7 md:px-6 md:py-11 lg:px-8">
      <div className="grid gap-7 md:grid-cols-[1fr_1.8fr] md:gap-12">
        <div>
          <Link to="/home" className="text-[24px] font-medium tracking-[.18em] text-[#0E0E0E] md:text-[32px]">GENAN</Link>
          <p className="mt-2 max-w-[320px] text-[8px] leading-5 text-[#777] md:text-[10px] md:leading-6">
            أزياء وإكسسوارات مختارة بعناية، داخل تجربة تسوق بسيطة وواضحة.
          </p>

          <div className="mt-4 flex gap-2">
            <Link to="/store-info#contact" className="flex h-9 items-center gap-2 border border-[#DDD8CE] bg-white px-3 text-[8px] font-semibold">
              <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.4} />
              تواصل
            </Link>
            <a href="#" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center border border-[#DDD8CE] bg-white">
              <Instagram className="h-3.5 w-3.5" strokeWidth={1.4} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 border-t border-[#E1DCD2] pt-5 md:border-t-0 md:pt-0">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-[8px] font-semibold text-[#9A825B] md:text-[9px]">{group.title}</p>
              <ul className="mt-3 space-y-2">
                {group.links.map(([label, href]) => (
                  <li key={href}>
                    <Link to={href} className="text-[8px] text-[#6E6E6E] transition-colors hover:text-[#0E0E0E] md:text-[9px]">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between border-t border-[#E1DCD2] pt-4">
        <p className="text-[6px] tracking-[.1em] text-[#969696] md:text-[8px]">© 2026 GENAN</p>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} className="flex items-center gap-1.5 text-[7px] text-[#666] md:text-[8px]">
          للأعلى
          <ArrowUp className="h-3 w-3" strokeWidth={1.4} />
        </button>
      </div>
    </div>
  </footer>
);

export default Footer;

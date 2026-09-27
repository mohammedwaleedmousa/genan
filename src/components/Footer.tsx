import { Link } from "react-router-dom";
import { ArrowUp, Instagram } from "lucide-react";

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
    title: "خدمة العملاء",
    links: [
      ["تتبع الطلب", "/order-tracking"],
      ["الشحن", "/shipping-policy"],
      ["الإرجاع", "/returns-policy"],
      ["تواصل معنا", "/store-info#contact"],
    ],
  },
  {
    title: "جنان",
    links: [
      ["عن جنان", "/store-info#about"],
      ["الخصوصية", "/privacy-policy"],
      ["الشروط", "/terms"],
    ],
  },
];

const Footer = () => (
  <footer className="border-t border-[#ECE8E1] bg-white text-[#171717]" dir="rtl">
    <div className="mx-auto max-w-[1500px] px-4 py-9 md:px-6 md:py-12 lg:px-8">
      <div className="grid gap-9 md:grid-cols-[1.1fr_2fr] md:gap-16">
        <div className="max-w-[360px]">
          <Link
            to="/home"
            className="inline-block text-[26px] font-medium tracking-[.14em] text-[#171717] md:text-[30px]"
          >
            GENAN
          </Link>

          <p className="mt-3 text-[10px] leading-6 text-[#77716A] md:text-[11px]">
            أزياء وإكسسوارات مختارة بعناية، بتجربة تسوق بسيطة وواضحة.
          </p>

          <div className="mt-5 flex items-center gap-4">
            <Link
              to="/store-info#contact"
              className="text-[10px] font-medium text-[#333] underline decoration-[#CDB98F] underline-offset-4 transition-colors hover:text-[#8F7548]"
            >
              تواصل معنا
            </Link>

            <a
              href="#"
              aria-label="Instagram"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#E7E2D9] text-[#555] transition-colors hover:border-[#CDB98F] hover:text-[#8F7548]"
            >
              <Instagram className="h-4 w-4" strokeWidth={1.5} />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-7 gap-y-8 border-t border-[#F0ECE6] pt-7 sm:grid-cols-3 md:border-t-0 md:pt-0">
          {groups.map((group) => (
            <div key={group.title}>
              <h3 className="text-[10px] font-semibold text-[#222] md:text-[11px]">{group.title}</h3>
              <ul className="mt-4 space-y-3">
                {group.links.map(([label, href]) => (
                  <li key={href}>
                    <Link
                      to={href}
                      className="text-[9px] text-[#77716A] transition-colors hover:text-[#171717] md:text-[10px]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-9 flex items-center justify-between border-t border-[#F0ECE6] pt-5">
        <p className="text-[8px] text-[#9A958E]">© 2026 GENAN. جميع الحقوق محفوظة.</p>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="flex items-center gap-1.5 text-[9px] text-[#69645D] transition-colors hover:text-[#171717]"
        >
          للأعلى
          <ArrowUp className="h-3.5 w-3.5" strokeWidth={1.5} />
        </button>
      </div>
    </div>
  </footer>
);

export default Footer;

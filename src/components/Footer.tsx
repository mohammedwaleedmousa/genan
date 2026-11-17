import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpLeft } from "lucide-react";

const footerLinks = [
  { label: "عن جنان", href: "/store-info#about" },
  { label: "تتبع الطلب", href: "/order-tracking" },
  { label: "تواصل معنا", href: "/store-info#contact" },
  { label: "السياسات والشروط", href: "/terms" },
  { label: "سياسة الخصوصية", href: "/privacy-policy" },
];

const Footer = () => (
  <footer dir="rtl" aria-label="تذييل متجر جنان" className="w-full bg-[#211915] text-[#F8ECDF]">
    <div className="mx-auto max-w-[1360px] px-5 sm:px-10 lg:px-16">
      <div className="flex flex-col gap-6 py-9 sm:py-11 lg:flex-row lg:items-end lg:justify-between lg:gap-12">
        <div>
          <p dir="ltr" className="w-fit font-serif text-4xl leading-none tracking-[0.15em] sm:text-[3.1rem]">GENAN</p>
          <p className="mt-3 max-w-[25rem] text-sm leading-7 text-[#D8C4B4]">مختارات من الأزياء والحقائب والأحذية والإكسسوارات.</p>
        </div>
        <nav aria-label="روابط التذييل">
          <ul className="flex flex-wrap gap-x-5 gap-y-1 sm:gap-x-7">
            {footerLinks.map(({ label, href }) => (
              <li key={href}>
                <Link to={href} className="inline-flex min-h-11 items-center text-sm text-[#E8D5C6] underline-offset-4 hover:underline focus-visible:rounded-sm">
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 border-t border-[#E8D5C6]/25 pb-5 pt-4 text-[#D8C4B4] sm:py-6">
        <p className="text-xs leading-6">
          <bdi dir="ltr">© GENAN 2026</bdi> <span className="ms-1">جميع الحقوق محفوظة.</span>
        </p>
        <a
          href="https://linetech.company/"
          className="inline-flex min-h-11 flex-wrap items-center gap-x-2.5 gap-y-1 text-xs transition-colors hover:text-white focus-visible:rounded-sm"
        >
          <span>طُوّر بواسطة شركة</span>
          <img src="/brand/linetech-logo.svg" alt="LINETECH" width={104} height={22} loading="lazy" decoding="async" className="h-5 w-auto" />
          <ArrowUpLeft aria-hidden="true" size={14} className="text-[#D7B68F]" />
        </a>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })}
          className="inline-flex min-h-11 items-center gap-2 text-xs transition-colors hover:text-white"
        >
          العودة للأعلى <ArrowUp aria-hidden="true" size={15} />
        </button>
      </div>
    </div>
  </footer>
);

export default Footer;

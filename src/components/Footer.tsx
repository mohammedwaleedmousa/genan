import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpLeft, ChevronLeft, Headphones } from "lucide-react";
import Logo from "@/components/Logo";

const footerColumns = [
  {
    title: "خدمة العملاء",
    links: [
      { label: "تتبع الطلب", to: "/order-tracking" },
      { label: "تواصل معنا", to: "/store-info#contact" },
      { label: "الشحن والتوصيل", to: "/shipping-policy" },
      { label: "الإرجاع والاستبدال", to: "/returns-policy" },
      { label: "الأسئلة الشائعة", to: "/store-info#faq" },
    ],
  },
  {
    title: "جنان",
    links: [
      { label: "عن جنان", to: "/store-info#about" },
      { label: "الماركات", to: "/brands" },
      { label: "سياسة الخصوصية", to: "/privacy-policy" },
      { label: "الشروط والأحكام", to: "/terms" },
      { label: "باركود المتجر", to: "/qr-code" },
    ],
  },
  {
    title: "اكتشفي",
    links: [
      { label: "جميع المنتجات", to: "/products" },
      { label: "الأقسام", to: "/categories" },
      { label: "وصل حديثًا", to: "/new-arrivals" },
      { label: "العروض", to: "/seasonal-offers" },
    ],
  },
] as const;

const Footer = () => (
  <footer
    className="genan-site-footer w-full min-w-0 overflow-hidden border-t border-[#E6E1D8] bg-white text-[#0E0E0E]"
    dir="rtl"
    aria-label="روابط ومعلومات بوتيك جنان"
  >
    {/* A restrained four-colour accent: black, white, soft gold and pale turquoise. */}
    <div aria-hidden="true" className="h-[3px] bg-[linear-gradient(90deg,#A9D8D3_0%,#D8C29A_50%,#0E0E0E_100%)]" />

    <div className="mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12">
      <div className="flex flex-col gap-7 border-b border-[#EAE6DE] py-9 sm:flex-row sm:items-center sm:justify-between sm:gap-10 md:py-12">
        <div className="max-w-[490px]">
          <Link
            to="/home"
            aria-label="جنان — العودة إلى الصفحة الرئيسية"
            className="inline-flex max-w-full items-center rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#B8975A]"
          >
            <Logo size="xl" variant="footer" showArabic className="text-[#0E0E0E]" />
          </Link>
          <div className="mt-4 h-[2px] w-12 rounded-full bg-[#D8C29A]" aria-hidden="true" />
          <p className="mt-4 max-w-[440px] text-[13px] leading-[1.95] text-[#605E5A] sm:text-sm">
            بوتيك يجمع الأناقة والتفاصيل المميزة. اكتشفي تشكيلتنا المختارة من الحقائب والملابس والأحذية والإكسسوارات.
          </p>
        </div>

        <div className="flex w-full max-w-[335px] items-start gap-3 rounded-2xl border border-[#D8E9E7] bg-[#F6FBFA] p-4 sm:shrink-0 sm:p-5">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#CFE5E2] bg-[#E7F4F2] text-[#185C57]" aria-hidden="true">
            <Headphones size={21} strokeWidth={1.7} />
          </span>
          <div className="min-w-0">
            <h2 className="text-[14px] font-semibold text-[#141414]">نحن هنا لمساعدتك</h2>
            <p className="mt-1 text-[12px] leading-6 text-[#686B69]">لديك استفسار عن منتج أو طلب؟ تواصلي معنا.</p>
            <Link
              to="/store-info#contact"
              className="mt-2 inline-flex min-h-10 items-center gap-2 rounded-md text-[12px] font-semibold text-[#0E0E0E] underline decoration-[#D8C29A] decoration-2 underline-offset-4 transition-colors hover:text-[#276C66] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8975A]"
            >
              تواصلي مع جنان
              <ArrowUpLeft size={15} strokeWidth={1.8} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      <nav
        aria-label="روابط أسفل المتجر"
        className="grid grid-cols-2 gap-x-7 gap-y-8 py-9 sm:grid-cols-3 sm:gap-x-12 md:py-11 lg:gap-x-24"
      >
        {footerColumns.map((column) => (
          <div key={column.title} className="min-w-0">
            <h2 className="mb-4 flex items-center gap-2.5 text-[14px] font-bold text-[#0E0E0E] sm:text-[15px]">
              <span aria-hidden="true" className="h-[19px] w-[3px] shrink-0 rounded-full bg-[#C5A168]" />
              {column.title}
            </h2>
            <ul className="space-y-0.5">
              {column.links.map(({ label, to }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group inline-flex min-h-10 max-w-full items-center gap-1.5 rounded-sm py-2 text-[12px] leading-6 text-[#62615E] transition-colors hover:text-[#101010] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8975A] sm:text-[13px]"
                  >
                    <span>{label}</span>
                    <ChevronLeft size={13} strokeWidth={1.7} className="shrink-0 text-[#B8975A] opacity-0 transition-all duration-200 group-hover:-translate-x-0.5 group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
    </div>

    <div className="w-full bg-[#0E0E0E] text-white">
      <div className="mx-auto flex w-full max-w-[1440px] flex-col items-center justify-between gap-3 px-5 py-4 sm:flex-row sm:gap-6 sm:px-8 lg:px-12">
        <p className="text-center text-[11px] leading-6 text-[#E6E6E6] sm:text-right">
          © {new Date().getFullYear()} <span className="font-semibold text-[#D8C29A]">GENAN</span> — جميع الحقوق محفوظة.
        </p>
        <button
          type="button"
          onClick={() => {
            const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
          }}
          aria-label="العودة إلى أعلى الصفحة"
          className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-[#57534D] bg-[#1A1A1A] px-4 py-2 text-[12px] font-medium text-white transition-colors hover:border-[#D8C29A] hover:text-[#D8C29A] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#A9D8D3]"
        >
          العودة للأعلى
          <ArrowUp size={15} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </div>
    </div>
  </footer>
);

export default Footer;

import { Link } from "react-router-dom";
import { ArrowUp, ArrowUpLeft, Headphones, ShieldCheck, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";

type FooterLink = { label: string; href: string };
type FooterColumn = { title: string; links: FooterLink[] };
type Assurance = { title: string; detail: string; href: string; icon: LucideIcon };

const assurances: Assurance[] = [
  {
    title: "نحن معك",
    detail: "تواصلي معنا للاستفسار عن طلباتك.",
    href: "/store-info#contact",
    icon: Headphones,
  },
  {
    title: "خصوصيتك تهمّنا",
    detail: "تعرّفي على سياسة الخصوصية.",
    href: "/privacy-policy",
    icon: ShieldCheck,
  },
  {
    title: "الشحن والتوصيل",
    detail: "التفاصيل المتاحة تظهر عند الطلب.",
    href: "/shipping-policy",
    icon: Truck,
  },
];

const customerService: FooterColumn = {
  title: "خدمة العملاء",
  links: [
    { label: "تتبع الطلب", href: "/order-tracking" },
    { label: "تواصل معنا", href: "/store-info#contact" },
    { label: "الشحن والتوصيل", href: "/shipping-policy" },
    { label: "الإرجاع والاستبدال", href: "/returns-policy" },
    { label: "الأسئلة الشائعة", href: "/store-info#faq" },
  ],
};

const aboutGenan: FooterColumn = {
  title: "جنان",
  links: [
    { label: "عن جنان", href: "/store-info#about" },
    { label: "الماركات", href: "/brands" },
    { label: "سياسة الخصوصية", href: "/privacy-policy" },
    { label: "الشروط والأحكام", href: "/terms" },
    { label: "باركود المتجر", href: "/qr-code" },
  ],
};

const discover: FooterColumn = {
  title: "اكتشفي",
  links: [
    { label: "جميع المنتجات", href: "/products" },
    { label: "الأقسام", href: "/categories" },
    { label: "وصل حديثاً", href: "/new-arrivals" },
    { label: "العروض", href: "/seasonal-offers" },
  ],
};

const FooterLinkColumn = ({ title, links }: FooterColumn) => (
  <nav aria-label={title} className="min-w-0">
    <h3 className="mb-8 flex items-center gap-3 text-[16px] font-bold leading-7 text-[#0E0E0E] sm:text-[17px]">
      <span aria-hidden="true" className="h-[19px] w-[3px] shrink-0 rounded-full bg-[#C6A86E]" />
      {title}
    </h3>
    <ul className="space-y-7">
      {links.map(({ label, href }) => (
        <li key={href}>
          <Link
            to={href}
            className="inline-block text-[14px] leading-7 text-[#6D6D6D] transition-colors hover:text-[#8C6B32] focus-visible:rounded-sm sm:text-[15px]"
          >
            {label}
          </Link>
        </li>
      ))}
    </ul>
  </nav>
);

const Footer = () => (
  <footer dir="rtl" aria-label="تذييل متجر جنان" className="w-full bg-white text-[#0E0E0E]">
    {/* The three service rows follow the supplied mobile reference. */}
    <section aria-label="مساعدة ومعلومات التسوق" className="mx-auto w-full max-w-[1160px] px-3 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 lg:gap-x-10">
        {assurances.map(({ title, detail, href, icon: Icon }, index) => (
          <Link
            to={href}
            key={href}
            className={
              "group flex min-h-[119px] items-center gap-3 border-b border-[#E8E6E3] px-0 py-6 text-right transition-colors hover:bg-[#FCFDFC] sm:min-h-[126px] sm:gap-5 lg:border-b-0 lg:py-9 " +
              (index > 0 ? "lg:border-r lg:border-[#E8E6E3] lg:pr-6" : "")
            }
          >
            <span
              aria-hidden="true"
              className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-[16px] border border-[#D2E7E3] bg-[#EAF6F4] text-[#406F6B] sm:h-[56px] sm:w-[56px]"
            >
              <Icon className="h-[25px] w-[25px] sm:h-[28px] sm:w-[28px]" strokeWidth={1.55} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[18px] font-bold leading-8 text-[#0E0E0E] sm:text-[20px]">{title}</span>
              <span className="mt-1 block text-[13px] leading-7 text-[#737373] sm:text-[14px]">{detail}</span>
            </span>
          </Link>
        ))}
      </div>
    </section>

    <div
      aria-hidden="true"
      className="h-[3px] w-full bg-[linear-gradient(90deg,#A9D8D3_0%,#D8C29A_64%,#0E0E0E_100%)]"
    />

    {/* Wordmark, boutique description and contact card mirror the second photo. */}
    <section aria-label="عن جنان" className="mx-auto w-full max-w-[1080px] px-5 pb-12 pt-11 sm:px-8 sm:pb-14 sm:pt-16">
      <div className="flex items-baseline justify-end gap-3" dir="ltr">
        <span dir="rtl" className="text-[12px] leading-none text-[#8A8A8A] sm:text-sm">جنان</span>
        <span className="font-serif text-[46px] font-medium leading-none tracking-[0.10em] text-[#0E0E0E] sm:text-[64px] md:text-[74px]">
          GENAN
        </span>
      </div>
      <div aria-hidden="true" className="mr-0 ml-auto mt-6 h-[2px] w-[49px] rounded-full bg-[#D8C29A] sm:w-[58px]" />
      <p className="mt-7 text-right text-[14px] leading-[2.05] text-[#6D6D6D] sm:mt-9 sm:text-[16px]">
        بوتيك يجمع الأناقة والتفاصيل المميزة. اكتشفي تشكيلتنا المختارة من الحقائب والملابس والأحذية والإكسسوارات.
      </p>

      <div className="mt-8 rounded-[20px] border border-[#D1E7E4] bg-[#F7FBFA] px-4 pb-6 pt-5 sm:mt-10 sm:px-7 sm:pb-8 sm:pt-7">
        <div className="flex items-start gap-3 sm:gap-5">
          <span
            aria-hidden="true"
            className="flex h-[49px] w-[49px] shrink-0 items-center justify-center rounded-[14px] border border-[#CEE6E2] bg-[#E6F3F1] text-[#39726C] sm:h-[56px] sm:w-[56px]"
          >
            <Headphones className="h-[25px] w-[25px] sm:h-[28px] sm:w-[28px]" strokeWidth={1.65} />
          </span>
          <div className="min-w-0 flex-1 text-right">
            <h3 className="text-[17px] font-bold leading-8 text-[#0E0E0E] sm:text-xl">نحن هنا لمساعدتك</h3>
            <p className="mt-1 text-[13px] leading-7 text-[#727272] sm:text-[15px]">
              لديك استفسار عن منتج أو طلب؟ تواصلي معنا.
            </p>
            <Link
              to="/store-info#contact"
              className="mt-6 inline-flex min-h-[32px] items-center gap-3 border-b-[2px] border-[#D8C29A] pb-1 text-[15px] font-bold leading-7 text-[#0E0E0E] transition-colors hover:text-[#8C6B32] sm:text-[17px]"
            >
              تواصلي مع جنان
              <ArrowUpLeft aria-hidden="true" className="h-[17px] w-[17px]" strokeWidth={1.7} />
            </Link>
          </div>
        </div>
      </div>
    </section>

    {/* On mobile: service and Genan side by side; Discover below service on the right. */}
    <section aria-label="روابط المتجر" className="mx-auto w-full max-w-[1080px] px-5 pb-24 sm:px-8 sm:pb-28">
      <div className="mb-9 h-px w-full bg-[#E8E6E3]" aria-hidden="true" />
      <div className="grid grid-cols-2 gap-x-5 gap-y-16 sm:gap-x-14 md:grid-cols-3 md:gap-x-20">
        <div className="col-start-1 row-start-1">
          <FooterLinkColumn {...customerService} />
        </div>
        <div className="col-start-2 row-start-1">
          <FooterLinkColumn {...aboutGenan} />
        </div>
        <div className="col-start-1 row-start-2 md:col-start-3 md:row-start-1">
          <FooterLinkColumn {...discover} />
        </div>
      </div>
    </section>

    {/* Reference's distinct black copyright band and return-to-top control. */}
    <div className="w-full bg-[#0E0E0E] px-4 pb-5 pt-6 text-center text-white sm:py-8">
      <p className="text-[12px] leading-7 text-[#F1F1F1] sm:text-[13px]">
        <span className="text-[#D8C29A]">© GENAN 2026</span>
        <span> — جميع الحقوق محفوظة.</span>
      </p>
      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="mt-4 inline-flex min-h-[43px] items-center justify-center gap-4 rounded-[14px] border border-[#55524C] bg-[#1C1C1C] px-5 text-[13px] font-medium text-white transition-colors hover:border-[#D8C29A] hover:bg-[#272727]"
        aria-label="العودة للأعلى"
      >
        <span>العودة للأعلى</span>
        <ArrowUp aria-hidden="true" className="h-4 w-4" strokeWidth={1.65} />
      </button>
    </div>
  </footer>
);

export default Footer;

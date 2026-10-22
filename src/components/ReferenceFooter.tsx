import { Link } from "react-router-dom";
import { ArrowLeft, Instagram, Youtube } from "lucide-react";

const footerColumns = [
  { heading: "عن جنان", links: [
    { label: "قصتنا", to: "/store-info#about" },
    { label: "قيمنا", to: "/store-info#about" },
    { label: "تواصل معنا", to: "/store-info#contact" },
  ] },
  { heading: "خدمة العملاء", links: [
    { label: "تتبع الطلب", to: "/order-tracking" },
    { label: "الاستبدال والإرجاع", to: "/returns-policy" },
    { label: "سياسة الشحن", to: "/shipping-policy" },
    { label: "الأسئلة الشائعة", to: "/store-info" },
  ] },
  { heading: "تسوقي", links: [
    { label: "المنتجات", to: "/products" },
    { label: "المجموعات", to: "/categories" },
    { label: "الإكسسوارات", to: "/categories" },
    { label: "العروض الخاصة", to: "/seasonal-offers" },
  ] },
];

const ReferenceFooter = () => (
  <footer className="genan-ref-footer" dir="rtl">
    <div className="genan-ref-footer-main">
      <div className="genan-ref-footer-newsletter">
        <h2>انضمي إلى عالم جنان</h2>
        <p>كوني أول من يعرف عن المجموعات الجديدة<br />والعروض الحصرية.</p>
        <Link to="/store-info#contact" className="genan-ref-newsletter-link">
          تواصلي معنا لمعرفة الجديد <ArrowLeft size={17} aria-hidden="true" />
        </Link>
      </div>
      <div className="genan-ref-footer-links">
        {footerColumns.map(({ heading, links }) => (
          <div key={heading}>
            <h3>{heading}</h3>
            {links.map(({ label, to }) => <Link to={to} key={label}>{label}</Link>)}
          </div>
        ))}
      </div>
      <div className="genan-ref-footer-brand">
        <Link to="/home" aria-label="جنان، الصفحة الرئيسية"><span dir="ltr">GENAN</span><small>جنان</small></Link>
        <p>أكثر من مجرد زي ..<br />جنان هو أسلوب حياة وتفاصيل مختارة بعناية.</p>
        <div className="genan-ref-socials">
          <Link aria-label="تواصل معنا" to="/store-info#contact"><Instagram size={16} /></Link>
          <Link aria-label="عن جنان" to="/store-info#about"><Youtube size={16} /></Link>
        </div>
      </div>
    </div>
    <div className="genan-ref-footer-bottom">
      <span>المملكة العربية السعودية &nbsp; | &nbsp; SAR</span>
      <div><Link to="/terms">الشروط والأحكام</Link><Link to="/privacy-policy">سياسة الخصوصية</Link></div>
      <span>© {new Date().getFullYear()} جنان — جميع الحقوق محفوظة</span>
    </div>
  </footer>
);
export default ReferenceFooter;

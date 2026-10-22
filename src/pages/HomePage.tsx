import { useState, type FormEvent, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ChevronDown, ChevronLeft, ChevronRight, Flame, Grid2X2, Heart, Headphones, Menu, Package, Search, ShieldCheck, ShoppingBag, UserRound, X, Shirt, Bookmark, Truck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { PRODUCT_CARD_SELECT, mapProductCard } from "@/lib/productCardData";
import ProductCard from "@/components/ProductCard";
import CartDrawer from "@/components/CartDrawer";
import { useStore } from "@/store/useStore";
import { useFavorites } from "@/hooks/useFavorites";
import "@/styles/genanReference.css";
import { genanReferenceEye } from "@/assets/genanReferenceEye";

// Only the supplied 1122 × 1402 GENAN screenshot governs the composition.
// Photography is a replaceable editorial asset; real product media always comes from Supabase.
const art = {
  hero: "https://images.pexels.com/photos/9142805/pexels-photo-9142805.jpeg?auto=compress&cs=tinysrgb&w=1800",
  story: "https://images.pexels.com/photos/8989866/pexels-photo-8989866.jpeg?auto=compress&cs=tinysrgb&w=1800",
  fabric: "https://images.pexels.com/photos/6044226/pexels-photo-6044226.jpeg?auto=compress&cs=tinysrgb&w=800",
  embroidery: "https://images.pexels.com/photos/4210854/pexels-photo-4210854.jpeg?auto=compress&cs=tinysrgb&w=800",
  textile: "https://images.pexels.com/photos/4622061/pexels-photo-4622061.jpeg?auto=compress&cs=tinysrgb&w=800",
};
const menuItems = [
  ["الرئيسية","/home"],
  ["العبايات","/products"],
  ["الإكسسوارات","/categories"],
  ["عروض خاصة","/seasonal-offers"],
];
function Pill({to,children}:{to:string;children:ReactNode}) {
  return <Link to={to} className="gr-pill"><span className="gr-pill-circle"><ArrowLeft size={16}/></span>{children}</Link>;
}
function Header() {
  const navigate=useNavigate();
  const {customer,openCart,getCartCount}=useStore();
  const favorites=useFavorites(s=>s.favorites);
  const [q,setQ]=useState("");
  const [menu,setMenu]=useState(false);
  const [search,setSearch]=useState(false);
  const submit=(e:FormEvent)=>{e.preventDefault();if(q.trim()){navigate("/products?search="+encodeURIComponent(q.trim()));setMenu(false);setSearch(false);}};
  return <>
    <header className="gr-header" dir="ltr">
      <Link className="gr-logo" to="/home" aria-label="GENAN — الرئيسية">GENAN<small>جنان</small></Link>
      <nav className="gr-main-nav" dir="rtl" aria-label="التنقل الرئيسي">{menuItems.map(([label,url],i)=><Link key={url} className={i===0?"gr-nav-current":""} to={url}>{label}</Link>)}</nav>
      <div className="gr-header-tools">
        <form className="gr-search" dir="rtl" onSubmit={submit}><input aria-label="بحث عن منتج" placeholder="ابحث عن منتج ..." value={q} onChange={e=>setQ(e.target.value)}/><button type="submit" aria-label="بحث"><Search size={16}/></button></form>
        <Link to="/favorites" className="gr-action" aria-label={"المفضلة "+favorites.length}><Heart size={21} strokeWidth={1.6}/></Link>
        <button type="button" className="gr-action gr-cart" onClick={openCart} aria-label="سلة المشتريات"><ShoppingBag size={20} strokeWidth={1.6}/>{getCartCount()>0&&<b>{getCartCount()}</b>}</button>
        <Link className="gr-action" to={customer?"/account":"/auth"} aria-label="حسابي"><UserRound size={20} strokeWidth={1.5}/></Link>
        <span className="gr-language" aria-label="العربية">AR <ChevronDown size={12}/></span>
        <button className="gr-mobile-search-button" type="button" aria-label="بحث" onClick={()=>setSearch(v=>!v)}><Search size={20}/></button>
        <button className="gr-mobile-menu-button" type="button" aria-label="القائمة" onClick={()=>setMenu(v=>!v)}>{menu?<X size={22}/>:<Menu size={22}/>}</button>
      </div>
    </header>
    {(menu||search)&&<div className="gr-mobile-panel" dir="rtl">{search&&<form onSubmit={submit}><input aria-label="بحث" value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث عن منتج ..."/><button type="submit"><Search size={18}/></button></form>}{menu&&menuItems.map(([l,u])=><Link key={u} to={u} onClick={()=>setMenu(false)}>{l}<ChevronLeft size={18}/></Link>)}</div>}
  </>;
}
function Hero() {
  const [slide,setSlide]=useState(0);
  const {data:banner}=useQuery({
    queryKey:["genan-reference-main-banner"],
    queryFn:async()=>{
      const {data,error}=await supabase.from("banners").select("image_url,title_ar,subtitle_ar,cta_text_ar,cta_link,sort_order,page_slug").eq("is_active",true).order("sort_order",{ascending:true}).limit(10);
      if(error)throw error;
      return (data||[]).filter(b=>!String(b.page_slug||"").startsWith("home-editorial") && Boolean(b.image_url));
    },staleTime:300000,
  });
  const active=banner?.length?banner[slide%banner.length]:null;
  return <section className="gr-hero" aria-label="المجموعة الجديدة" dir="rtl">
    <div className="gr-hero-photo" style={{backgroundImage:'url("'+(active?.image_url||art.hero)+'")'}}/>
    <div className="gr-hero-filter"/>
    <div className="gr-hero-copy"><span className="gr-overline">مجموعة جديدة</span><h1>{active?.title_ar||"جمال\nيتجاوز الزمن"}</h1><p>{active?.subtitle_ar||"عبايات وإطلالات تعكس قوتك .. بأناقة عصرية"}</p><Pill to={active?.cta_link||"/products"}>{active?.cta_text_ar||"تسوقي الآن"}</Pill></div>
    <div className="gr-hero-index" dir="ltr"><span className="gr-side-brand">GENAN<small>MORE<br/>THAN<br/>A LOOK</small></span><div className="gr-slide-line"/><div className="gr-slide-index"><b>{String(slide+1).padStart(2,"0")}</b><span>02</span><span>03</span></div><div className="gr-slide-arrows"><button type="button" aria-label="السابق" onClick={()=>setSlide(v=>(v+2)%3)}><ChevronLeft size={16}/></button><button type="button" aria-label="التالي" onClick={()=>setSlide(v=>(v+1)%3)}><ChevronRight size={16}/></button></div></div>
  </section>;
}
const categories=[
  {title:"العبايات",href:"/products",icon:Shirt,featured:true},
  {title:"المجموعات الخاصة",href:"/new-arrivals",icon:Grid2X2},
  {title:"الإطلالات اليومية",href:"/products",icon:Bookmark},
  {title:"الإكسسوارات",href:"/categories",icon:ShoppingBag},
  {title:"أفكار وأناقة",href:"/store-info#about",icon:Flame},
];
function Categories() {
  return <nav className="gr-category-dock" dir="rtl" aria-label="التسوق حسب القسم">{categories.slice().reverse().map(({title,href,icon:Icon,featured})=><Link key={title} to={href} className={"gr-category-tile"+(featured?" gr-category-featured":"")}>{featured?<img src={art.hero} loading="lazy" alt=""/>:<Icon size={29} strokeWidth={1.15}/>}<span>{title}</span>{featured&&<span className="gr-category-arrow"><ArrowLeft size={17}/></span>}</Link>)}</nav>;
}
function Products() {
  const {data=[],isLoading,isError,refetch}=useQuery({
    queryKey:["genan-reference-four-products"],
    queryFn:async()=>{
      const {data,error}=await supabase.from("products").select(PRODUCT_CARD_SELECT).eq("is_active",true).order("sort_order",{ascending:true}).limit(8);
      if(error)throw error;
      return (data||[]).map(mapProductCard);
    },staleTime:120000
  });
  return <section className="gr-products" dir="rtl">
    <div className="gr-products-head"><div><h2>الأكثر رواجاً</h2><p>قطع مختارة بعناية .. لترافقك في كل لحظة</p></div><Link to="/products">عرض الكل <ArrowLeft size={16}/></Link></div>
    {data.length>0?<div className="gr-product-grid">{data.slice(0,4).map((p,i)=><ProductCard key={p.id} product={p} index={i}/>)}</div>:isLoading?<div className="gr-product-grid" role="status" aria-label="تحميل المنتجات">{[1,2,3,4].map(x=><div key={x} className="gr-skeleton"/>)}</div>:<p className="gr-empty">{isError?"تعذر تحميل المنتجات":"المجموعة قيد التجهيز"}　{isError?<button type="button" onClick={()=>void refetch()}>إعادة المحاولة</button>:<Link to="/products">تصفح المنتجات</Link>}</p>}
    {data.length>0&&data.slice(0,4).every(p=>p.slug.startsWith("genan-demo-"))&&<p className="gr-demo-label">معاينة تجريبية: هذه المنتجات وأسعارها غير متاحة للبيع.</p>}
  </section>;
}
function Campaign() {
  return <section className="gr-campaign" dir="rtl" aria-label="مجموعة خطوات أعمق"><div className="gr-campaign-image" style={{backgroundImage:'url("'+art.story+'")'}}/><div className="gr-campaign-shade"/><div className="gr-campaign-brand" dir="ltr">GENAN<small>ROOTED<br/>IN HER<br/>EVOLVING</small><i>01　　02　　03</i></div><div className="gr-campaign-copy"><span className="gr-overline">مجموعة جديدة</span><h2>خطوات<br/>أعمق</h2><p>إلهام من الأرض .. بإطلالة نحو المستقبل</p><Pill to="/new-arrivals">اكتشفي المجموعة</Pill></div></section>;
}
function Details() {
  const tiles=[["تصاميم عصرية",art.textile],["حرفية عربية",art.embroidery],["أقمشة فاخرة",art.fabric]];
  return <section className="gr-details" aria-label="تفاصيل تصنع الفرق" dir="rtl">
    {tiles.map(([title,image])=><Link key={title} to="/products" className="gr-detail-photo" style={{backgroundImage:'url("'+image+'")'}}><span>{title}</span></Link>)}
    <div className="gr-details-text"><h2>تفاصيل تصنع الفرق</h2><p>من الأقمشة الفاخرة إلى التفاصيل الدقيقة ..<br/>كل قطعة من جنان تحكي قصة.</p><Pill to="/products">اكتشفي المزيد</Pill></div>
    <div className="gr-details-face" style={{backgroundImage:'url("'+genanReferenceEye+'")'}}/>
  </section>;
}
function Benefits() {
  const benefits=[{icon:Headphones,title:"خدمة عملاء مميزة",sub:"دائماً معك"},{icon:ShieldCheck,title:"ضمان أصالة",sub:"ومنتج يستحق الثقة"},{icon:Package,title:"دفع آمن",sub:"خيارات دفع متعددة"},{icon:Truck,title:"توصيل سريع",sub:"حسب مناطق التغطية"}];
  return <section className="gr-benefits" aria-label="مميزات المتجر" dir="rtl">{benefits.map(({icon:Icon,title,sub})=><div key={title} className="gr-benefit"><Icon size={27} strokeWidth={1.15}/><div><b>{title}</b><small>{sub}</small></div></div>)}</section>;
}
const footerCols=[
  {heading:"عن جنان",links:[["قصتنا","/store-info#about"],["قيمنا","/store-info#about"],["الاستدامة","/store-info#about"],["تواصل معنا","/store-info#contact"]]},
  {heading:"خدمة العملاء",links:[["تتبع الطلب","/order-tracking"],["الاستبدال والإرجاع","/returns-policy"],["دليل المقاسات","/store-info"],["الأسئلة الشائعة","/store-info"]]},
  {heading:"تسوقي",links:[["العبايات","/products"],["المجموعات","/new-arrivals"],["الإكسسوارات","/categories"],["العروض الخاصة","/seasonal-offers"]]}
];
function Footer() {
  const [email,setEmail]=useState("");
  const [submitted,setSubmitted]=useState(false);
  return <footer className="gr-footer" dir="rtl">
    <div className="gr-footer-body">
      <div className="gr-news"><h3>انضمي إلى عالم جنان</h3><p>كوني أول من يعرف عن المجموعات الجديدة<br/>والعروض الحصرية.</p><form onSubmit={e=>{e.preventDefault();setSubmitted(true);}}><input required type="email" aria-label="البريد الإلكتروني" placeholder="أدخل بريدك الإلكتروني" value={email} onChange={e=>setEmail(e.target.value)}/><button type="submit" aria-label="الاشتراك"><ArrowLeft size={16}/></button></form>{submitted&&<small>الاشتراك بالبريد غير مفعّل حاليًا.</small>}</div>
      {footerCols.map(col=><div className="gr-footer-col" key={col.heading}><h4>{col.heading}</h4>{col.links.map(([l,to])=><Link key={l} to={to}>{l}</Link>)}</div>)}
      <div className="gr-footer-brand" dir="ltr"><Link to="/home">GENAN</Link><span>جنان</span><p dir="rtl">أكثر من مجرد زي ..<br/>جنان هو أسلوب حياة للمرأة العصرية.</p><div className="gr-socials"><span>◎</span><span>▶</span><span>𝕏</span><span>◆</span></div></div>
    </div>
    <div className="gr-footer-bottom"><span>🇸🇦　المملكة العربية السعودية　|　SAR</span><div><Link to="/terms">الشروط والأحكام</Link><Link to="/privacy-policy">سياسة الخصوصية</Link><Link to="/privacy-policy">سياسة ملفات الارتباط</Link></div><span>جميع الحقوق محفوظة © {new Date().getFullYear()} جنان</span></div>
  </footer>;
}
export default function HomePage() {
  return <div className="genan-reference-home" dir="rtl"><CartDrawer/><div className="gr-page"><Header/><main id="main-content"><Hero/><Categories/><Products/><Campaign/><Details/><Benefits/></main><Footer/></div></div>;
}

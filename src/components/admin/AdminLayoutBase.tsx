import { useEffect, useMemo, useRef, useState, type CSSProperties, type RefObject } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ExternalLink, Loader2, Search, UserRound, X } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { ADMIN_LOGIN_PATH, adminPath, legacyAdminPathToCurrent, normalizeAdminPathForLegacyRules } from "@/lib/adminRoutes";

import AdminSidebar from "./AdminSidebar";
import "@/admin-refresh.css";
import NotificationsDropdown from "./NotificationsDropdown";

/* =========================================================
   ADMIN DESIGN SYSTEM
========================================================= */

const ADMIN_THEME = {
  background: "#F7F6F2",
  backgroundSoft: "#FBFAF6",
  surface: "#FFFFFF",
  surfaceSoft: "#FEFCF8",
  text: "#222821",
  textSecondary: "#60695E",
  muted: "#657066",
  border: "#E7E0D4",
  borderStrong: "#D8CBB9",
  primary: "#765830",
  primaryDark: "#604627",
  primarySoft: "#F5ECDA",
  blue: "#557C83",
  blueSoft: "#EAF3F3",
  teal: "#3D8071",
  tealSoft: "#E6F2EE",
  coral: "#B47367",
  coralSoft: "#FAEDEA",
  rose: "#A86B72",
  roseSoft: "#F9EDEE",
  amber: "#AD854A",
  amberSoft: "#F8F0E0",
  green: "#56836B",
  greenSoft: "#EBF4EE",
  violet: "#88758C",
  violetSoft: "#F2ECF3",
  cyan: "#5C858D",
  cyanSoft: "#EDF5F5",
  online: "#4A9B74",
};

const adminThemeVariables = {
  "--background": "40 22% 96%",
  "--foreground": "145 10% 15%",
  "--card": "0 0% 100%",
  "--card-foreground": "145 10% 15%",
  "--popover": "0 0% 100%",
  "--popover-foreground": "145 10% 15%",
  "--primary": "37 40% 37%",
  "--primary-foreground": "0 0% 100%",
  "--secondary": "38 28% 96%",
  "--secondary-foreground": "145 9% 29%",
  "--muted": "39 24% 96%",
  "--muted-foreground": "145 8% 39%",
  "--accent": "37 45% 92%",
  "--accent-foreground": "35 31% 30%",
  "--border": "37 22% 89%",
  "--input": "37 22% 89%",
  "--ring": "37 40% 37%",
  "--sidebar-background": "38 45% 98%",
  "--sidebar-foreground": "145 10% 15%",
  "--sidebar-primary": "37 40% 37%",
  "--sidebar-primary-foreground": "0 0% 100%",
  "--sidebar-accent": "40 30% 95%",
  "--sidebar-accent-foreground": "145 11% 18%",
  "--sidebar-border": "37 22% 89%",
  "--sidebar-ring": "37 40% 37%",
  "--admin-bg": ADMIN_THEME.background,
  "--admin-bg-soft": ADMIN_THEME.backgroundSoft,
  "--admin-surface": ADMIN_THEME.surface,
  "--admin-surface-soft": ADMIN_THEME.surfaceSoft,
  "--admin-text": ADMIN_THEME.text,
  "--admin-text-secondary": ADMIN_THEME.textSecondary,
  "--admin-muted": ADMIN_THEME.muted,
  "--admin-border": ADMIN_THEME.border,
  "--admin-border-strong": ADMIN_THEME.borderStrong,
  "--admin-primary": ADMIN_THEME.primary,
  "--admin-primary-dark": ADMIN_THEME.primaryDark,
  "--admin-primary-soft": ADMIN_THEME.primarySoft,
  "--admin-blue": ADMIN_THEME.blue,
  "--admin-blue-soft": ADMIN_THEME.blueSoft,
  "--admin-teal": ADMIN_THEME.teal,
  "--admin-teal-soft": ADMIN_THEME.tealSoft,
  "--admin-coral": ADMIN_THEME.coral,
  "--admin-coral-soft": ADMIN_THEME.coralSoft,
  "--admin-rose": ADMIN_THEME.rose,
  "--admin-rose-soft": ADMIN_THEME.roseSoft,
  "--admin-amber": ADMIN_THEME.amber,
  "--admin-amber-soft": ADMIN_THEME.amberSoft,
  "--admin-green": ADMIN_THEME.green,
  "--admin-green-soft": ADMIN_THEME.greenSoft,
  "--admin-violet": ADMIN_THEME.violet,
  "--admin-violet-soft": ADMIN_THEME.violetSoft,
  "--admin-cyan": ADMIN_THEME.cyan,
  "--admin-cyan-soft": ADMIN_THEME.cyanSoft,
  "--admin-online": ADMIN_THEME.online,

  /* Compatibility with old admin pages */
  "--admin-olive": ADMIN_THEME.primary,
  "--admin-olive-dark": ADMIN_THEME.primaryDark,
  "--admin-olive-deep": "#5B4529",
  "--admin-olive-soft": ADMIN_THEME.primarySoft,
  "--admin-olive-soft-2": "#F6EDDC",
  "--admin-olive-soft-3": "#FCFAF6",
  "--admin-white": ADMIN_THEME.surface,
} as CSSProperties;

/* =========================================================
   ADMIN SEARCH
========================================================= */

type SearchableAdminPage = {
  title: string;
  section: string;
  url: string;
  keywords?: string;
};

const searchablePages: SearchableAdminPage[] = [
  { title: "لوحة التحكم", section: "الرئيسية", url: "/admin", keywords: "dashboard مؤشرات" },
  { title: "الطلبات", section: "الرئيسية", url: "/admin/orders", keywords: "orders طلب" },
  { title: "المنتجات", section: "الكتالوج", url: "/admin/products", keywords: "products" },
  { title: "إضافة منتج", section: "الكتالوج", url: "/admin/products/new", keywords: "new product" },
  { title: "العملاء", section: "الرئيسية", url: "/admin/customers", keywords: "customers" },

  { title: "تجربة عرض المنتج", section: "الكتالوج", url: "/admin/product-experience" },
  { title: "الفئات", section: "الكتالوج", url: "/admin/categories" },
  { title: "الماركات", section: "الكتالوج", url: "/admin/brands" },
  { title: "ربط الماركات بالفئات", section: "الكتالوج", url: "/admin/brand-category-map" },
  { title: "سير عمل الكتالوج", section: "الكتالوج", url: "/admin/catalog-workflow" },
  { title: "تعديلات المخزون", section: "الكتالوج", url: "/admin/inventory-adjustments" },

  { title: "البانرات", section: "واجهة المتجر", url: "/admin/banners" },
  { title: "أقسام الصفحة الرئيسية", section: "واجهة المتجر", url: "/admin/sections" },
  { title: "المحتوى", section: "واجهة المتجر", url: "/admin/content" },
  { title: "صفحات الماركات", section: "واجهة المتجر", url: "/admin/brand-pages" },
  { title: "أقسام الماركات", section: "واجهة المتجر", url: "/admin/brand-sections" },
  { title: "فلاتر الماركات", section: "واجهة المتجر", url: "/admin/brand-filters" },
  { title: "تجربة العميل", section: "واجهة المتجر", url: "/admin/customer-experience" },
  { title: "خريطة الواجهة", section: "واجهة المتجر", url: "/admin/storefront-map" },

  { title: "إدارة التوصيل", section: "العمليات", url: "/admin/delivery" },
  { title: "مناطق الدفع عند الاستلام", section: "العمليات", url: "/admin/cod-regions", keywords: "cod مناطق" },
  { title: "التقييمات", section: "العمليات", url: "/admin/reviews" },

  { title: "الفواتير", section: "المالية", url: "/admin/invoices" },
  { title: "طرق الدفع", section: "المالية", url: "/admin/payment-methods" },
  { title: "المصروفات", section: "المالية", url: "/admin/expenses" },
  { title: "دفتر اليومية", section: "المالية", url: "/admin/ledger" },
  { title: "المرتجعات", section: "المالية", url: "/admin/refunds" },
  { title: "العملات", section: "المالية", url: "/admin/currencies" },
  { title: "الدول", section: "المالية", url: "/admin/countries" },

  { title: "الحملات", section: "التسويق", url: "/admin/campaigns" },
  { title: "العروض", section: "التسويق", url: "/admin/offers" },
  { title: "القسائم", section: "التسويق", url: "/admin/coupons" },
  { title: "إشعارات العملاء", section: "التسويق", url: "/admin/customer-notifications" },
  { title: "سجل إرسال الإشعارات", section: "التسويق", url: "/admin/notification-deliveries" },

  { title: "نظرة عامة", section: "التقارير", url: "/admin/reports" },
  { title: "الأرباح والمالية", section: "التقارير", url: "/admin/reports/finance" },
  { title: "تحليل العملاء", section: "التقارير", url: "/admin/reports/customers" },

  { title: "الإعدادات", section: "النظام", url: "/admin/settings" },
  { title: "سجل النشاط", section: "النظام", url: "/admin/audit-log" },
];

/* =========================================================
   PAGE META
========================================================= */

type PageMetaRule = {
  match: string;
  title: string;
  section: string;
  exact?: boolean;
};

const pageMetaRules: PageMetaRule[] = [
  { match: "/admin/products/new", title: "إضافة منتج", section: "الكتالوج", exact: true },
  { match: "/admin/product-experience", title: "تجربة عرض المنتج", section: "الكتالوج", exact: true },
  { match: "/admin/products/", title: "تحرير المنتج", section: "الكتالوج" },
  { match: "/admin/products", title: "المنتجات", section: "الكتالوج", exact: true },

  { match: "/admin/orders", title: "الطلبات", section: "الطلبات", exact: true },

  { match: "/admin/customers/", title: "تفاصيل العميل", section: "العملاء" },
  { match: "/admin/customers", title: "العملاء", section: "العملاء", exact: true },

  { match: "/admin/categories", title: "الفئات", section: "الكتالوج", exact: true },
  { match: "/admin/brands", title: "الماركات", section: "الكتالوج", exact: true },
  { match: "/admin/brand-category-map", title: "ربط الماركات بالفئات", section: "الكتالوج", exact: true },
  { match: "/admin/catalog-workflow", title: "سير عمل الكتالوج", section: "الكتالوج", exact: true },
  { match: "/admin/inventory-adjustments", title: "تعديلات المخزون", section: "الكتالوج", exact: true },

  { match: "/admin/banners", title: "البانرات", section: "واجهة المتجر", exact: true },
  { match: "/admin/sections", title: "أقسام الصفحة الرئيسية", section: "واجهة المتجر", exact: true },
  { match: "/admin/content", title: "المحتوى", section: "واجهة المتجر", exact: true },
  { match: "/admin/brand-pages", title: "صفحات الماركات", section: "واجهة المتجر" },
  { match: "/admin/brand-sections", title: "أقسام الماركات", section: "واجهة المتجر" },
  { match: "/admin/brand-filters", title: "فلاتر الماركات", section: "واجهة المتجر" },
  { match: "/admin/customer-experience", title: "تجربة العميل", section: "واجهة المتجر", exact: true },
  { match: "/admin/storefront-map", title: "خريطة الواجهة", section: "واجهة المتجر", exact: true },

  { match: "/admin/delivery", title: "إدارة التوصيل", section: "العمليات", exact: true },
  { match: "/admin/cod-regions", title: "مناطق الدفع عند الاستلام", section: "العمليات", exact: true },
  { match: "/admin/reviews", title: "التقييمات", section: "العمليات", exact: true },

  { match: "/admin/invoices", title: "الفواتير", section: "المالية", exact: true },
  { match: "/admin/payment-methods", title: "طرق الدفع", section: "المالية", exact: true },
  { match: "/admin/expenses", title: "المصروفات", section: "المالية", exact: true },
  { match: "/admin/ledger", title: "دفتر اليومية", section: "المالية", exact: true },
  { match: "/admin/refunds", title: "المرتجعات", section: "المالية", exact: true },
  { match: "/admin/currencies", title: "العملات", section: "المالية", exact: true },
  { match: "/admin/countries", title: "الدول", section: "المالية", exact: true },

  { match: "/admin/campaigns", title: "الحملات", section: "التسويق", exact: true },
  { match: "/admin/offers", title: "العروض", section: "التسويق", exact: true },
  { match: "/admin/coupons", title: "القسائم", section: "التسويق", exact: true },
  { match: "/admin/customer-notifications", title: "إشعارات العملاء", section: "التسويق", exact: true },
  { match: "/admin/notification-deliveries", title: "سجل إرسال الإشعارات", section: "التسويق", exact: true },

  { match: "/admin/reports/finance", title: "الأرباح والمالية", section: "التقارير", exact: true },
  { match: "/admin/reports/customers", title: "تحليل العملاء", section: "التقارير", exact: true },
  { match: "/admin/reports", title: "التقارير والتحليلات", section: "التقارير", exact: true },

  { match: "/admin/settings", title: "الإعدادات", section: "النظام", exact: true },
  { match: "/admin/audit-log", title: "سجل النشاط", section: "النظام", exact: true },
];

/* =========================================================
   ADMIN LAYOUT
========================================================= */

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const legacyPathname = normalizeAdminPathForLegacyRules(location.pathname);

  const searchRef = useRef<HTMLInputElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const [userEmail, setUserEmail] = useState("");
  const [userName, setUserName] = useState("مدير المتجر");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  /* =========================================================
     CURRENT PAGE
  ========================================================= */

  const currentPageMeta = useMemo(() => {
    if (legacyPathname === "/admin") return { title: "لوحة التحكم", section: "الرئيسية" };

    const exactRule = pageMetaRules.find((rule) => rule.exact && legacyPathname === rule.match);

    if (exactRule) return exactRule;

    const partialRule = pageMetaRules.find((rule) => !rule.exact && legacyPathname.startsWith(rule.match));

    if (partialRule) return partialRule;

    return { title: "لوحة الإدارة", section: "جنان" };
  }, [legacyPathname]);

  /* =========================================================
     SEARCH
  ========================================================= */

  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    if (!query) return searchablePages.slice(0, 7);

    return searchablePages
      .filter((page) => `${page.title} ${page.section} ${page.keywords || ""}`.toLowerCase().includes(query))
      .slice(0, 8);
  }, [searchQuery]);

  /* =========================================================
     AUTH
  ========================================================= */

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      if (import.meta.env.DEV) {
        const params = new URLSearchParams(window.location.search);

        if (params.get("dev") === "true") {
          setIsAdmin(true);
          return;
        }
      }

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        navigate(ADMIN_LOGIN_PATH);
        return;
      }

      const { data: roleData } = await supabase.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();

      if (!roleData) {
        navigate(ADMIN_LOGIN_PATH);
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Auth check error:", error);
      navigate(ADMIN_LOGIN_PATH);
    } finally {
      setIsLoading(false);
    }
  };

  /* =========================================================
     LOCK OUTER SCROLL
  ========================================================= */

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");

    const oldHtmlOverflow = html.style.overflow;
    const oldBodyOverflow = body.style.overflow;
    const oldRootOverflow = root?.style.overflow || "";

    const oldHtmlHeight = html.style.height;
    const oldBodyHeight = body.style.height;
    const oldRootHeight = root?.style.height || "";

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.classList.add("genan-admin-active");
    html.style.height = "100%";
    body.style.height = "100%";

    if (root) {
      root.style.overflow = "hidden";
      root.style.height = "100%";
    }

    return () => {
      html.style.overflow = oldHtmlOverflow;
      body.style.overflow = oldBodyOverflow;
      body.classList.remove("genan-admin-active");
      html.style.height = oldHtmlHeight;
      body.style.height = oldBodyHeight;

      if (root) {
        root.style.overflow = oldRootOverflow;
        root.style.height = oldRootHeight;
      }
    };
  }, []);

  /* =========================================================
     USER
  ========================================================= */

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const user = data.user;

      if (!user) return;

      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || "مدير المتجر");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const user = session?.user;

      if (!user) {
        setUserEmail("");
        return;
      }

      setUserEmail(user.email || "");
      setUserName(user.user_metadata?.full_name || user.user_metadata?.name || "مدير المتجر");
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  /* =========================================================
     CTRL / CMD + K
  ========================================================= */

  useEffect(() => {
    const handleKeyboard = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        if (window.innerWidth < 768) setMobileSearchOpen(true);

        requestAnimationFrame(() => {
          searchRef.current?.focus();
        });
      }

      if (event.key === "Escape") {
        setSearchFocused(false);
        setMobileSearchOpen(false);
        searchRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, []);

  /* =========================================================
     ROUTE CHANGE
  ========================================================= */

  useEffect(() => {
    setSearchQuery("");
    setSearchFocused(false);
    setMobileSearchOpen(false);
  }, [location.pathname]);

  const openSearchResult = (url: string) => {
    setSearchQuery("");
    setSearchFocused(false);
    setMobileSearchOpen(false);
    navigate(legacyAdminPathToCurrent(url));
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (isLoading || !isAdmin) {
    return (
      <div style={adminThemeVariables} className="fixed inset-0 flex h-[100dvh] w-full items-center justify-center overflow-hidden bg-[#F7F6F2] font-admin">
        <div className="flex flex-col items-center">
          <div className="flex h-[52px] w-[52px] items-center justify-center rounded-[15px] border border-[#E4DACA] bg-white">
            <Loader2 className="h-[19px] w-[19px] animate-spin text-[#96713E]" strokeWidth={1.8} />
          </div>

          <p className="mt-3 text-[10px] font-medium text-[#969EAA]">{isLoading ? "جاري تجهيز لوحة التحكم..." : "جاري التحقق من الصلاحيات..."}</p>
        </div>
      </div>
    );
  }

  /* =========================================================
     FINAL SHELL
  ========================================================= */

  return (
    <SidebarProvider defaultOpen={true} style={{ "--sidebar-width": "276px", "--sidebar-width-icon": "70px" } as CSSProperties} className="h-[100dvh] min-h-0 overflow-hidden bg-[#F7F6F2]">
      <div dir="rtl" style={adminThemeVariables} className="admin-workspace flex h-[100dvh] w-full overflow-hidden bg-[#F7F6F2] font-admin text-[#283129]">
        <AdminSidebar />

        <SidebarInset className="relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[#F7F6F2]">
          {/* =====================================================
              TOP BAR
          ===================================================== */}

          <header className="relative z-40 flex h-[64px] shrink-0 items-center border-b border-[#E7E0D4] bg-white px-3 sm:px-4 lg:px-5">
            <div className="flex w-full min-w-0 items-center gap-3">
              <div className="flex min-w-0 shrink-0 items-center gap-2.5">
                <SidebarTrigger className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[10px] border border-[#E4DACA] bg-[#FBF9F5] text-[#69717C] shadow-none transition-colors duration-150 hover:border-[#D9DEE5] hover:bg-white hover:text-[#4D5560]" />

                <div className="hidden h-[26px] w-px bg-[#E9ECF0] sm:block" />

                <div className="hidden min-w-0 sm:block">
                  <div className="flex items-center gap-[6px]">
                    <span className="text-[11px] font-medium text-[#9A8B77]">{currentPageMeta.section}</span>
                    <ChevronLeft className="h-[9px] w-[9px] text-[#C0C5CC]" strokeWidth={1.8} />
                    <span className="max-w-[180px] truncate text-[12px] font-semibold text-[#374438]">{currentPageMeta.title}</span>
                  </div>

                  <p className="mt-[3px] text-[9px] font-semibold tracking-[0.1em] text-[#A08C6A]">GENAN ADMIN</p>
                </div>
              </div>

              <div className="relative mx-auto hidden w-full max-w-[500px] md:block">
                <SearchBox searchRef={searchRef} query={searchQuery} focused={searchFocused} results={searchResults} onQueryChange={setSearchQuery} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)} onSelect={openSearchResult} />
              </div>

              <div className="mr-auto flex shrink-0 items-center gap-[6px]">
                <button type="button" onClick={() => setMobileSearchOpen((current) => !current)} aria-label="البحث" className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-[#E4DACA] bg-white text-[#737B86] transition-colors hover:border-[#D9DEE5] hover:bg-[#FBF9F5] hover:text-[#4E5661] md:hidden">
                  {mobileSearchOpen ? <X className="h-[15px] w-[15px]" strokeWidth={1.8} /> : <Search className="h-[15px] w-[15px]" strokeWidth={1.8} />}
                </button>

                <button type="button" onClick={() => window.open("/home", "_blank", "noopener,noreferrer")} className="hidden h-[42px] items-center gap-[6px] rounded-[10px] border border-[#E4DACA] bg-white px-[10px] text-[9px] font-semibold text-[#69717B] transition-colors hover:border-[#D9DEE5] hover:bg-[#FBF9F5] hover:text-[#3F4650] xl:flex">
                  <ExternalLink className="h-[12px] w-[12px]" strokeWidth={1.8} />
                  عرض المتجر
                </button>

                <div className="flex h-[42px] w-[42px] items-center justify-center rounded-[10px] border border-[#E4DACA] bg-white text-[#69717B] transition-colors hover:border-[#D9DEE5] hover:bg-[#FBF9F5]">
                  <NotificationsDropdown />
                </div>

                <div className="mx-[3px] hidden h-[25px] w-px bg-[#E8EBEF] lg:block" />

                <button type="button" onClick={() => navigate(adminPath("settings"))} className="group flex min-w-0 items-center gap-[8px] rounded-[11px] px-[3px] py-[2px] transition-colors hover:bg-[#F7F9FB]">
                  <div className="relative flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[11px] bg-[linear-gradient(135deg,#F1E1C6_0%,#E4F1EB_100%)] text-[11px] font-bold uppercase text-[#94703D]">
                    {userName ? userName.charAt(0).toUpperCase() : <UserRound className="h-[14px] w-[14px]" strokeWidth={1.7} />}
                    <span className="absolute bottom-0 left-0 h-[9px] w-[9px] rounded-full border-2 border-white bg-[#65A77C]" />
                  </div>

                  <div className="hidden min-w-0 text-right lg:block">
                    <p className="max-w-[120px] truncate text-[10px] font-semibold leading-none text-[#353B44]">{userName}</p>
                    <p dir="ltr" className="mt-[4px] max-w-[120px] truncate text-left text-[10px] font-medium leading-none text-[#9CA3AC]">{userEmail || "مدير النظام"}</p>
                  </div>

                  <ChevronLeft className="hidden h-[11px] w-[11px] shrink-0 text-[#A1A8B1] lg:block" strokeWidth={1.8} />
                </button>
              </div>
            </div>
          </header>

          {/* =====================================================
              MOBILE SEARCH
          ===================================================== */}

          {mobileSearchOpen && (
            <div className="relative z-30 shrink-0 border-b border-[#E7E0D4] bg-white px-3 pb-3 pt-2 md:hidden">
              <SearchBox searchRef={searchRef} query={searchQuery} focused={true} results={searchResults} onQueryChange={setSearchQuery} onFocus={() => setSearchFocused(true)} onBlur={() => window.setTimeout(() => setSearchFocused(false), 120)} onSelect={openSearchResult} />
            </div>
          )}

          {/* =====================================================
              PAGE
          ===================================================== */}

          <main className="relative min-h-0 min-w-0 flex-1 overflow-hidden bg-[#F7F6F2]">
            <div className="admin-page-scroll h-full w-full overflow-x-hidden overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
              <div className="mx-auto min-h-full w-full max-w-[1600px] px-4 py-5 lg:px-6 lg:py-6 xl:px-7">
                <Outlet />
              </div>
            </div>
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

/* =========================================================
   SEARCH BOX
========================================================= */

const SearchBox = ({ searchRef, query, focused, results, onQueryChange, onFocus, onBlur, onSelect }: { searchRef: RefObject<HTMLInputElement>; query: string; focused: boolean; results: SearchableAdminPage[]; onQueryChange: (value: string) => void; onFocus: () => void; onBlur: () => void; onSelect: (url: string) => void }) => {
  return (
    <div className="relative w-full">
      <Search className="pointer-events-none absolute right-[13px] top-1/2 z-10 h-[14px] w-[14px] -translate-y-1/2 text-[#9AA2AC]" strokeWidth={1.7} />

      <input ref={searchRef} type="search" value={query} onChange={(event) => onQueryChange(event.target.value)} onFocus={onFocus} onBlur={onBlur} placeholder="انتقل إلى صفحة أو أداة..." className="h-[38px] w-full rounded-[10px] border border-[#E5E8ED] bg-[#FBF9F5] pr-[38px] pl-[58px] text-[10.5px] font-medium text-[#343B44] outline-none transition-colors placeholder:text-[#A3AAB4] focus:border-[#DADDE9] focus:bg-white" />

      <span className="pointer-events-none absolute left-[8px] top-1/2 flex h-[23px] -translate-y-1/2 items-center rounded-[6px] border border-[#E3E7EC] bg-white px-[7px] text-[7.5px] font-semibold text-[#9AA1AB]">⌘ K</span>

      {focused && (
        <div className="absolute inset-x-0 top-[44px] z-[100] overflow-hidden rounded-[13px] border border-[#E3E7EC] bg-white shadow-[0_14px_40px_rgba(26,33,45,0.10)]">
          <div className="border-b border-[#EEF0F3] px-3 py-[8px]">
            <p className="text-[7.5px] font-bold tracking-[0.05em] text-[#A0A7B0]">{query.trim() ? "نتائج البحث" : "وصول سريع"}</p>
          </div>

          <div className="max-h-[300px] overflow-y-auto p-[5px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {results.length > 0 ? (
              results.map((result) => (
                <button key={result.url} type="button" onMouseDown={(event) => event.preventDefault()} onClick={() => onSelect(result.url)} className="flex h-[44px] w-full items-center rounded-[9px] px-[9px] text-right transition-colors hover:bg-[#F7F9FB]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-semibold text-[#404750]">{result.title}</p>
                    <p className="mt-[3px] truncate text-[7.5px] font-medium text-[#9BA2AC]">{result.section}</p>
                  </div>

                  <ChevronLeft className="h-[11px] w-[11px] shrink-0 text-[#B2B7BF]" strokeWidth={1.8} />
                </button>
              ))
            ) : (
              <div className="px-4 py-9 text-center">
                <Search className="mx-auto h-[17px] w-[17px] text-[#B7BDC4]" strokeWidth={1.6} />
                <p className="mt-2 text-[9px] font-medium text-[#969DA7]">لا توجد صفحة مطابقة</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
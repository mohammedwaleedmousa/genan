import { ShieldCheck,

  Activity,
  BarChart3,
  BadgePercent,
  Bell,
  BookOpen,
  Boxes,
  Brain,
  ChevronDown,
  ChevronLeft,
  CircleDollarSign,
  Coins,
  Command,
  CreditCard,
  FileText,
  Globe2,
  Grid3X3,
  Image,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  MapPinCheck,
  Megaphone,
  Package,
  Palette,
  PanelsTopLeft,
  PieChart,
  Plus,
  Receipt,
  RotateCcw,
  ScrollText,
  Send,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  Star,
  Store,
  Tag,
  TicketPercent,
  Truck,
  Users,
  WalletCards,
  Workflow,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, type CSSProperties, type ElementType } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthActions } from "@/hooks/useAuthActions";
import { Sidebar, useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { ADMIN_LOGIN_PATH, adminPath, legacyAdminPathToCurrent, normalizeAdminPathForLegacyRules } from "@/lib/adminRoutes";

type Tone = "indigo" | "coral" | "blue" | "teal" | "rose" | "amber" | "green" | "violet" | "cyan" | "slate";

type NavItem = {
  title: string;
  url: string;
  icon: ElementType;
  tone: Tone;
  exact?: boolean;
  counter?: "orders";
};

type NavSection = {
  id: string;
  title: string;
  subtitle: string;
  icon: ElementType;
  tone: Tone;
  items: NavItem[];
};

const ACCORDION_TRANSITION = {
  duration: 0.2,
  ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
};

const adminTone = {
  icon: "bg-[#F3E8D6] text-[#967242]",
  activeIcon: "bg-[#EAD5AD] text-[#74552D]",
  active: "border-[#E4D3B2] bg-[#F6ECDD] text-[#272B24]",
  line: "bg-[#A98650]",
  badge: "bg-[#E9D8B8] text-[#73532B]",
  dot: "bg-[#A98650]",
};
const toneStyles: Record<Tone, typeof adminTone> = {
  indigo: adminTone, coral: adminTone, blue: adminTone, teal: adminTone,
  rose: adminTone, amber: adminTone, green: adminTone,
  violet: adminTone, cyan: adminTone, slate: adminTone,
};

const primaryItems: NavItem[] = [
  { title: "الرئيسية", url: "/admin", icon: LayoutDashboard, tone: "slate", exact: true },
  { title: "الطلبات", url: "/admin/orders", icon: ShoppingBag, tone: "slate", counter: "orders" },
  { title: "المنتجات", url: "/admin/products", icon: Package, tone: "slate" },
  { title: "العملاء", url: "/admin/customers", icon: Users, tone: "slate" },
  { title: "التقارير", url: "/admin/reports", icon: BarChart3, tone: "slate" },
  { title: "الإعدادات", url: "/admin/settings", icon: Settings, tone: "slate" },
];
const sections: NavSection[] = [
  {
    id: "catalog", title: "الكتالوج والمخزون", subtitle: "الفئات والماركات والمخزون", icon: Boxes, tone: "slate",
    items: [
      { title: "الفئات", url: "/admin/categories", icon: Grid3X3, tone: "slate" },
      { title: "الماركات", url: "/admin/brands", icon: Tag, tone: "slate" },
      { title: "المخزون", url: "/admin/inventory-adjustments", icon: Package, tone: "slate" },
      { title: "ربط الفئات بالماركات", url: "/admin/brand-category-map", icon: Workflow, tone: "slate" },
      { title: "صحة الكتالوج", url: "/admin/catalog-health", icon: Activity, tone: "slate" },
    ],
  },
  {
    id: "storefront", title: "مظهر المتجر والتسويق", subtitle: "الواجهة والعروض", icon: Palette, tone: "slate",
    items: [
      { title: "البانرات", url: "/admin/banners", icon: Image, tone: "slate" },
      { title: "الأقسام الرئيسية", url: "/admin/sections", icon: LayoutGrid, tone: "slate" },
      { title: "المحتوى", url: "/admin/content", icon: FileText, tone: "slate" },
      { title: "تجربة العميل", url: "/admin/customer-experience", icon: SlidersHorizontal, tone: "slate" },
      { title: "صفحات الماركات", url: "/admin/brand-pages", icon: Store, tone: "slate" },
      { title: "العروض", url: "/admin/offers", icon: BadgePercent, tone: "slate" },
      { title: "القسائم", url: "/admin/coupons", icon: TicketPercent, tone: "slate" },
      { title: "الحملات", url: "/admin/campaigns", icon: Megaphone, tone: "slate" },
    ],
  },
  {
    id: "operations", title: "العمليات وخدمة العملاء", subtitle: "التوصيل والمراجعات", icon: Truck, tone: "slate",
    items: [
      { title: "إدارة التوصيل", url: "/admin/delivery", icon: Truck, tone: "slate" },
      { title: "الدفع عند الاستلام", url: "/admin/cod-regions", icon: MapPinCheck, tone: "slate" },
      { title: "التقييمات", url: "/admin/reviews", icon: Star, tone: "slate" },
      { title: "أسئلة المنتجات", url: "/admin/product-questions", icon: Star, tone: "slate" },
      { title: "استعادة كلمات المرور", url: "/admin/password-recovery", icon: ShieldCheck, tone: "slate" },
      { title: "إشعارات العملاء", url: "/admin/customer-notifications", icon: Bell, tone: "slate" },
    ],
  },
  {
    id: "finance", title: "المالية والأدوات", subtitle: "الفواتير والوظائف المتقدمة", icon: WalletCards, tone: "slate",
    items: [
      { title: "الفواتير", url: "/admin/invoices", icon: Receipt, tone: "slate" },
      { title: "طرق الدفع", url: "/admin/payment-methods", icon: CreditCard, tone: "slate" },
      { title: "المصروفات", url: "/admin/expenses", icon: CircleDollarSign, tone: "slate" },
      { title: "دفتر اليومية", url: "/admin/ledger", icon: BookOpen, tone: "slate" },
      { title: "المرتجعات", url: "/admin/refunds", icon: RotateCcw, tone: "slate" },
      { title: "العملات", url: "/admin/currencies", icon: Coins, tone: "slate" },
      { title: "التقرير المالي", url: "/admin/reports/finance", icon: PieChart, tone: "slate" },
      { title: "تحليل العملاء", url: "/admin/reports/customers", icon: Brain, tone: "slate" },
      { title: "سجل النشاط", url: "/admin/audit-log", icon: ScrollText, tone: "slate" },
    ],
  },
];
const systemItems: NavItem[] = [];

const AdminSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { state, setOpenMobile } = useSidebar();
  const { logout } = useAuthActions();

  const collapsed = state === "collapsed";
  const legacyPathname = normalizeAdminPathForLegacyRules(location.pathname);

  const [userEmail, setUserEmail] = useState("");

  const { data: ordersCount = 0 } = useQuery({
    queryKey: ["admin-sidebar-orders-count"],
    queryFn: async () => {
      const { count, error } = await supabase.from("orders").select("id", { count: "exact", head: true });

      if (error) throw error;

      return count ?? 0;
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });

  const isActive = (item: NavItem) => {
    if (item.exact) return legacyPathname === item.url;

    return legacyPathname === item.url || legacyPathname.startsWith(`${item.url}/`);
  };

  const isSectionActive = (section: NavSection) => {
    return section.items.some((item) => isActive(item));
  };

  const getCurrentSection = () => {
    return sections.find((section) => isSectionActive(section))?.id ?? null;
  };

  const [openSection, setOpenSection] = useState<string | null>(() => getCurrentSection());

  useEffect(() => {
    const current = getCurrentSection();

    if (current) {
      setOpenSection(current);
    }
  }, [location.pathname]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email || "");
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || "");
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const channel = supabase.channel("admin-sidebar-orders-count").on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sidebar-orders-count"] });
    }).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  const closeMobile = () => {
    setOpenMobile(false);
  };

  const handleSectionClick = (section: NavSection) => {
    if (collapsed) {
      navigate(legacyAdminPathToCurrent(section.items[0].url));
      closeMobile();
      return;
    }

    setOpenSection((current) => current === section.id ? null : section.id);
  };

  const handleLogout = async () => {
    if (!window.confirm("هل تريد تسجيل الخروج من لوحة التحكم؟")) return;

    await logout({
      redirectTo: ADMIN_LOGIN_PATH,
      successTitle: "تم تسجيل الخروج بنجاح",
      onSuccess: () => setUserEmail(""),
    });
  };

  return (
    <Sidebar side="right" collapsible="icon" style={{ "--sidebar-width": "288px", "--sidebar-width-icon": "70px" } as CSSProperties} className="genan-admin-sidebar h-[100dvh] border-l border-[#E3D9C8] bg-[#FCFAF6] font-admin text-[#252820] shadow-none">
      <div className="relative flex h-full min-h-0 flex-col overflow-hidden bg-[#FCFAF6]">
        {/* COLOR BAR */}

        <div className="absolute inset-x-0 top-0 z-20 h-[3px] bg-[#B99A66]" />

        {/* HEADER */}

        <div className="shrink-0 px-[10px] pb-[7px] pt-[12px]">
          <button type="button" onClick={() => navigate(adminPath())} className={cn("flex w-full items-center rounded-[16px] border border-[#E3D6BD] bg-[#F5EEE0] transition-colors duration-150 hover:border-[#D6C29B] hover:bg-[#EEE2CD]", collapsed ? "h-[52px] justify-center" : "h-[62px] gap-[10px] px-[9px]")}>
            <div aria-hidden="true" className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-[12px] bg-[#C5A773] font-serif text-[26px] font-semibold text-[#1E2721]">G</div>

            {!collapsed && (
              <>
                <div className="min-w-0 flex-1 text-right">
                  <div className="flex items-center gap-[7px]">
                    <h1 className="truncate font-serif text-[18px] font-bold tracking-[0.1em] text-[#242822]" dir="ltr">GENAN</h1>
                    <span className="h-[6px] w-[6px] rounded-full bg-[#65A77C]" />
                  </div>

                  <div className="mt-[5px] flex items-center gap-[5px]">
                    <Activity className="h-[9px] w-[9px] text-[#9DA4AE]" strokeWidth={1.7} />
                    <span className="truncate text-[8px] font-medium text-[#9AA1AB]">إدارة متجر جنان</span>
                  </div>
                </div>

                <span className="rounded-[7px] border border-[#E2D1AE] bg-[#F3EBDA] px-[7px] py-[4px] text-[7px] font-bold tracking-[0.07em] text-[#886738]">ADMIN</span>
              </>
            )}
          </button>
        </div>

        {/* QUICK ACCESS */}

        {!collapsed && (
          <div className="mx-[10px] mb-[5px] flex gap-[5px]">
            <QuickAction icon={Plus} label="إضافة منتج" tone="blue" onClick={() => navigate(adminPath("products/new"))} />
            <QuickAction icon={ShoppingBag} label="الطلبات" tone="coral" onClick={() => navigate(adminPath("orders"))} />
            <QuickAction icon={BarChart3} label="التقارير" tone="cyan" onClick={() => navigate(adminPath("reports"))} />
          </div>
        )}

        {/* NAV */}

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-[8px] pb-[8px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {!collapsed && <SectionLabel icon={Command}>الرئيسية</SectionLabel>}

          <div className="space-y-[2px]">
            {primaryItems.map((item) => (
              <MainItem key={item.url} item={item} active={isActive(item)} collapsed={collapsed} count={item.counter === "orders" ? ordersCount : undefined} onNavigate={closeMobile} />
            ))}
          </div>

          {!collapsed && <SectionLabel icon={Store}>أقسام إضافية</SectionLabel>}

          {collapsed && systemItems.length > 0 && <Divider />}

          <div className="space-y-[2px]">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = isSectionActive(section);
              const open = openSection === section.id;
              const tone = toneStyles[section.tone];

              return (
                <div key={section.id}>
                  <button type="button" onClick={() => handleSectionClick(section)} title={collapsed ? section.title : undefined} className={cn("group relative flex w-full items-center rounded-[11px] border transition-colors duration-150", collapsed ? "h-[43px] justify-center border-transparent" : "min-h-[47px] gap-[8px] px-[8px] py-[4px]", active ? tone.active : "border-transparent text-[#5E6259] hover:border-[#E2D4BD] hover:bg-white hover:text-[#313740]")}>
                    {active && <span className={cn("absolute right-0 top-1/2 h-[20px] w-[3px] -translate-y-1/2 rounded-l-full", tone.line)} />}

                    <span className={cn("flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] transition-colors duration-150", active ? tone.activeIcon : tone.icon)}>
                      <Icon className="h-[14px] w-[14px]" strokeWidth={1.75} />
                    </span>

                    {!collapsed && (
                      <>
                        <div className="min-w-0 flex-1 text-right">
                          <p className={cn("truncate text-[12px] leading-none", active ? "font-semibold" : "font-medium")}>{section.title}</p>
                          <p className="mt-[4px] truncate text-[7px] font-medium text-[#918B7E]">{section.subtitle}</p>
                        </div>

                        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={ACCORDION_TRANSITION} className="flex h-[20px] w-[20px] shrink-0 items-center justify-center text-[#9DA4AD]">
                          <ChevronDown className="h-[11px] w-[11px]" strokeWidth={1.8} />
                        </motion.span>
                      </>
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {!collapsed && open && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={ACCORDION_TRANSITION} className="overflow-hidden">
                        <div className="mr-[23px] py-[3px] pr-[10px]">
                          <div className="space-y-[1px] border-r border-[#E6E9EE] pr-[7px]">
                            {section.items.map((item) => (
                              <SubItem key={item.url} item={item} active={isActive(item)} onNavigate={closeMobile} />
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {!collapsed && systemItems.length > 0 && <SectionLabel icon={Settings}>النظام</SectionLabel>}

          {collapsed && systemItems.length > 0 && <Divider />}

          <div className="space-y-[2px]">
            {systemItems.map((item) => (
              <MainItem key={item.url} item={item} active={isActive(item)} collapsed={collapsed} onNavigate={closeMobile} />
            ))}
          </div>
        </div>

        {/* ACCOUNT */}

        <div className="shrink-0 border-t border-[#E9ECF0] bg-white/70 p-[8px]">
          {userEmail ? (
            <>
              <button type="button" onClick={() => navigate(adminPath("settings"))} className={cn("group flex w-full items-center rounded-[11px] transition-colors duration-150 hover:bg-white", collapsed ? "h-[43px] justify-center" : "gap-[8px] px-[6px] py-[5px]")}>
                <div className="relative flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-[10px] bg-[#F0E4CF] text-[10.5px] font-bold uppercase text-[#75552D]">
                  {userEmail.charAt(0).toUpperCase()}
                  <span className="absolute bottom-0 left-0 h-[8px] w-[8px] rounded-full border-2 border-white bg-[#65A77C]" />
                </div>

                {!collapsed && (
                  <>
                    <div className="min-w-0 flex-1 text-right">
                      <p className="truncate text-[10px] font-semibold leading-none text-[#373C44]">مدير المتجر</p>
                      <p dir="ltr" className="mt-[4px] truncate text-left text-[7.5px] leading-none text-[#9BA2AB]">{userEmail}</p>
                    </div>

                    <ChevronLeft className="h-[12px] w-[12px] shrink-0 text-[#A0A7B0]" strokeWidth={1.8} />
                  </>
                )}
              </button>

              <button type="button" onClick={handleLogout} className={cn("mt-[1px] flex min-h-[36px] w-full items-center rounded-[8px] text-[#8A919B] transition-colors duration-150 hover:bg-[#FFF3F1] hover:text-[#C15F56]", collapsed ? "justify-center" : "gap-[7px] px-[8px]")}>
                <LogOut className="h-[11px] w-[11px]" strokeWidth={1.8} />
                {!collapsed && <span className="text-[9px] font-medium">تسجيل الخروج</span>}
              </button>
            </>
          ) : (
            <button type="button" onClick={() => navigate(ADMIN_LOGIN_PATH)} className="flex h-[38px] w-full items-center justify-center rounded-[10px] bg-[#A98A59] text-[10px] font-semibold text-white transition-colors hover:bg-[#927548]">تسجيل الدخول</button>
          )}
        </div>
      </div>
    </Sidebar>
  );
};

const MainItem = ({ item, active, collapsed, count, onNavigate }: { item: NavItem; active: boolean; collapsed: boolean; count?: number; onNavigate: () => void }) => {
  const Icon = item.icon;
  const tone = toneStyles[item.tone];

  const displayCount = count !== undefined ? (count > 999 ? "999+" : count.toLocaleString("en-US")) : null;

  return (
    <NavLink to={legacyAdminPathToCurrent(item.url)} end={item.exact} onClick={onNavigate} title={collapsed ? item.title : undefined} className={cn("group relative flex w-full items-center rounded-[11px] border transition-colors duration-150", collapsed ? "h-[43px] justify-center border-transparent" : "h-[46px] gap-[8px] px-[8px]", active ? tone.active : "border-transparent text-[#5E6259] hover:border-[#E2D4BD] hover:bg-white hover:text-[#313740]")}>
      {active && <span className={cn("absolute right-0 top-1/2 h-[20px] w-[3px] -translate-y-1/2 rounded-l-full", tone.line)} />}

      <span className={cn("flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px] transition-colors duration-150", active ? tone.activeIcon : tone.icon)}>
        <Icon className="h-[14px] w-[14px]" strokeWidth={1.8} />
      </span>

      {!collapsed && (
        <>
          <span className={cn("min-w-0 flex-1 truncate text-right text-[11px]", active ? "font-semibold" : "font-medium")}>{item.title}</span>

          {displayCount !== null && <span className={cn("flex min-w-[26px] items-center justify-center rounded-full px-[7px] py-[3px] text-[8px] font-bold leading-none", tone.badge)}>{displayCount}</span>}
        </>
      )}

      {collapsed && count !== undefined && count > 0 && <span className={cn("absolute left-[7px] top-[7px] h-[6px] w-[6px] rounded-full ring-2 ring-[#FBFCFD]", tone.dot)} />}
    </NavLink>
  );
};

const SubItem = ({ item, active, onNavigate }: { item: NavItem; active: boolean; onNavigate: () => void }) => {
  const Icon = item.icon;
  const tone = toneStyles[item.tone];

  return (
    <NavLink to={legacyAdminPathToCurrent(item.url)} end={item.exact} onClick={onNavigate} className={cn("group flex min-h-[36px] w-full items-center gap-[6px] rounded-[7px] px-[6px] transition-colors duration-150", active ? `${tone.active} font-semibold` : "font-medium text-[#727367] hover:bg-white hover:text-[#4C5560]")}>
      <span className={cn("flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-[6px]", active ? tone.activeIcon : "text-[#A1A7B0]")}>
        <Icon className="h-[10.5px] w-[10.5px]" strokeWidth={1.8} />
      </span>

      <span className="min-w-0 flex-1 truncate text-[11px]">{item.title}</span>

      {active && <span className={cn("h-[4px] w-[4px] shrink-0 rounded-full", tone.dot)} />}
    </NavLink>
  );
};

const QuickAction = ({ icon: Icon, label, tone, onClick }: { icon: ElementType; label: string; tone: Tone; onClick: () => void }) => {
  const style = toneStyles[tone];

  return (
    <button type="button" onClick={onClick} className="group flex h-[40px] min-w-0 flex-1 items-center justify-center gap-[5px] rounded-[10px] border border-[#E8EBEF] bg-white px-[6px] transition-colors duration-150 hover:border-[#DBE0E6] hover:bg-[#FDFDFE]">
      <span className={cn("flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[7px]", style.icon)}>
        <Icon className="h-[10.5px] w-[10.5px]" strokeWidth={1.8} />
      </span>

      <span className="truncate text-[7.5px] font-semibold text-[#717984]">{label}</span>
    </button>
  );
};

const SectionLabel = ({ children, icon: Icon }: { children: React.ReactNode; icon: ElementType }) => {
  return (
    <div className="mb-[5px] mt-[11px] flex items-center gap-[6px] px-[8px]">
      <Icon className="h-[9px] w-[9px] text-[#A5ABB4]" strokeWidth={1.7} />
      <span className="shrink-0 text-[7px] font-bold tracking-[0.04em] text-[#A1A8B1]">{children}</span>
      <span className="h-px flex-1 bg-[#ECEFF2]" />
    </div>
  );
};

const Divider = () => {
  return <div className="mx-[10px] my-[7px] h-px bg-[#ECEFF2]" />;
};

export default AdminSidebar;

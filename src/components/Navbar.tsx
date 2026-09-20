import {
  Bell,
  CaretLeft,
  Crown,
  Globe,
  Heart,
  House,
  List,
  MagnifyingGlass,
  MapPin,
  Package,
  QrCode,
  ShoppingCart,
  SignIn,
  SignOut,
  SquaresFour,
  Tag,
  User,
} from "phosphor-react";
import type { Icon } from "phosphor-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useStore } from "@/store/useStore";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useCurrency, getActiveCurrencies } from "@/lib/currency";
import { useCustomerNotifications } from "@/hooks/useCustomerNotifications";
import { supabase } from "@/integrations/supabase/client";
import Logo from "@/components/Logo";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type SearchSuggestion = {
  value: string;
  type: "منتج" | "ماركة" | "قسم";
};

let searchIndexCache: SearchSuggestion[] | null = null;
let searchIndexPromise: Promise<SearchSuggestion[]> | null = null;

const normalizeSearch = (value: string) => value.trim().toLocaleLowerCase("ar");

const loadSearchIndex = async () => {
  if (searchIndexCache) return searchIndexCache;
  if (searchIndexPromise) return searchIndexPromise;

  searchIndexPromise = (async () => {
    const [productsResult, brandsResult, categoriesResult] = await Promise.all([
      supabase.from("products").select("name_ar,name").eq("is_active", true).limit(1000),
      supabase.from("brands").select("name").eq("is_active", true).limit(500),
      supabase.from("categories").select("name_ar,name").eq("is_active", true).limit(500),
    ]);

    const raw: SearchSuggestion[] = [
      ...((productsResult.data || []) as Array<{ name_ar: string | null; name: string | null }>).map((row) => ({ value: String(row.name_ar || row.name || "").trim(), type: "منتج" as const })),
      ...((brandsResult.data || []) as Array<{ name: string | null }>).map((row) => ({ value: String(row.name || "").trim(), type: "ماركة" as const })),
      ...((categoriesResult.data || []) as Array<{ name_ar: string | null; name: string | null }>).map((row) => ({ value: String(row.name_ar || row.name || "").trim(), type: "قسم" as const })),
    ].filter((item) => item.value);

    searchIndexCache = Array.from(new Map(raw.map((item) => [`${item.type}:${normalizeSearch(item.value)}`, item])).values());
    return searchIndexCache;
  })();

  try {
    return await searchIndexPromise;
  } finally {
    searchIndexPromise = null;
  }
};

const Section = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <section className="mt-6">
    <p className="mb-2 px-2 text-[9px] font-semibold tracking-[0.12em] text-white/35">{label}</p>
    <div className="space-y-1">{children}</div>
  </section>
);

const NavItem = ({
  icon: Icon,
  label,
  badge,
  isActive,
  onPress,
}: {
  icon: Icon;
  label: string;
  badge?: number | string;
  isActive?: boolean;
  onPress: () => void;
}) => (
  <button
    type="button"
    onClick={onPress}
    className={`relative flex min-h-[48px] w-full items-center gap-3 rounded-[14px] px-3 text-right transition-colors ${isActive ? "bg-white/[0.08] text-white" : "text-white/68 hover:bg-white/[0.05] hover:text-white"}`}
  >
    {isActive && <span className="absolute right-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[#E6D7B8]" />}
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-white/[0.10] text-[#E6D7B8]" : "bg-white/[0.05] text-white/55"}`}>
      <Icon size={19} weight="regular" />
    </span>
    <span className={`flex-1 text-right text-[13px] ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
    {!!badge && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#A9D8D3] px-1.5 text-[9px] font-bold text-[#0E0E0E]">{badge}</span>}
    <CaretLeft size={14} className={isActive ? "text-[#E6D7B8]" : "text-white/25"} />
  </button>
);

const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchIndex, setSearchIndex] = useState<SearchSuggestion[]>(() => searchIndexCache || []);
  const restoreScrollOnUnlockRef = useRef(true);
  const searchResultsRef = useRef<HTMLDivElement | null>(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { openCart, getCartCount, customer, setCustomer } = useStore();
  const { favorites } = useFavorites();
  const { logout } = useAuthActions();
  const cartCount = getCartCount();

  const { unreadCount } = useCustomerNotifications({ enabled: menuOpen, enableToasts: false });
  const { mode, setMode, short } = useCurrency();
  const searchPanelOpen = searchFocused && searchTerm.trim().length > 0;

  const goFromMenu = (to: string) => {
    if (location.pathname + location.search !== to) navigate(to);
    window.requestAnimationFrame(() => setMenuOpen(false));
  };

  const desktopLinks = [
    { label: "الرئيسية", to: "/home" },
    { label: "الأقسام", to: "/categories" },
    { label: "جميع المنتجات", to: "/products" },
    { label: "العروض", to: "/seasonal-offers" },
    { label: "وصل حديثاً", to: "/new-arrivals" },
    { label: "الأكثر مبيعاً", to: "/best-sellers" },
    { label: "معلومات المتجر", to: "/store-info" },
    { label: "باركود المتجر", to: "/qr-code" },
  ];

  useEffect(() => {
    const previousStorefront = document.body.dataset.storefront;
    document.body.dataset.storefront = "genan";
    return () => {
      if (previousStorefront) document.body.dataset.storefront = previousStorefront;
      else delete document.body.dataset.storefront;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void loadSearchIndex().then((index) => {
      if (!cancelled) setSearchIndex(index);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const suggestions = useMemo(() => {
    const value = normalizeSearch(searchTerm);
    if (!value) return [];
    return searchIndex
      .filter((item) => normalizeSearch(item.value).includes(value))
      .sort((a, b) => {
        const aValue = normalizeSearch(a.value);
        const bValue = normalizeSearch(b.value);
        const aStarts = aValue.startsWith(value) ? 0 : 1;
        const bStarts = bValue.startsWith(value) ? 0 : 1;
        return aStarts - bStarts || a.value.localeCompare(b.value, "ar");
      })
      .slice(0, 20);
  }, [searchIndex, searchTerm]);

  useEffect(() => {
    if (!searchFocused) return;

    const scrollY = window.scrollY;
    const body = document.body;
    const html = document.documentElement;
    const previousBody = { position: body.style.position, top: body.style.top, left: body.style.left, right: body.style.right, width: body.style.width, overflow: body.style.overflow };
    const previousHtml = { overflow: html.style.overflow, overscrollBehavior: html.style.overscrollBehavior };

    const preventBackgroundScroll = (event: Event) => {
      const target = event.target as Node | null;
      if (target && searchResultsRef.current?.contains(target)) return;
      event.preventDefault();
    };

    restoreScrollOnUnlockRef.current = true;
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.width = "100%";
    body.style.overflow = "hidden";
    html.style.overflow = "hidden";
    html.style.overscrollBehavior = "none";

    document.addEventListener("touchmove", preventBackgroundScroll, { passive: false });
    document.addEventListener("wheel", preventBackgroundScroll, { passive: false });

    return () => {
      document.removeEventListener("touchmove", preventBackgroundScroll);
      document.removeEventListener("wheel", preventBackgroundScroll);
      body.style.position = previousBody.position;
      body.style.top = previousBody.top;
      body.style.left = previousBody.left;
      body.style.right = previousBody.right;
      body.style.width = previousBody.width;
      body.style.overflow = previousBody.overflow;
      html.style.overflow = previousHtml.overflow;
      html.style.overscrollBehavior = previousHtml.overscrollBehavior;
      if (restoreScrollOnUnlockRef.current) window.scrollTo(0, scrollY);
      restoreScrollOnUnlockRef.current = true;
    };
  }, [searchFocused]);

  const staticLabels: Record<string, { label: string; flag: string }> = {
    SAR: { label: "ريال سعودي", flag: "🇸🇦" },
    YER_SOUTH: { label: "ريال يمني - جنوبي", flag: "🇾🇪" },
    YER_NORTH: { label: "ريال يمني - شمالي", flag: "🇾🇪" },
  };

  const currencies = getActiveCurrencies().map((currency) => ({
    key: currency.code as typeof mode,
    label: staticLabels[currency.code]?.label ?? currency.meta.label,
    flag: staticLabels[currency.code]?.flag ?? "💱",
  }));

  const closeSearch = () => {
    restoreScrollOnUnlockRef.current = true;
    setSearchFocused(false);
    setSearchTerm("");
  };

  const runSearch = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    restoreScrollOnUnlockRef.current = false;
    navigate(`/products?search=${encodeURIComponent(cleaned)}`);
    setSearchTerm("");
    setSearchFocused(false);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(searchTerm);
  };

  const handleLogout = async () => {
    await logout();
    setCustomer(null);
    navigate("/home");
    window.requestAnimationFrame(() => setMenuOpen(false));
  };

  const currencyMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button type="button" aria-label="العملة" className="flex h-10 items-center gap-1 rounded-xl px-2 text-[11px] font-semibold text-white/70 transition-colors hover:bg-[#FFFFFF]/8 hover:text-[#E6D7B8] md:h-10 md:px-3">
          <Globe size={17} />
          <span>{short}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-[14px] border-[#EAEAEA] bg-white text-[#0E0E0E]">
        <DropdownMenuLabel className="text-xs text-[#0E0E0E]">اختر العملة</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#EAEAEA]" />
        {currencies.map((currency) => (
          <DropdownMenuItem key={currency.key} onClick={() => setMode(currency.key)} className={`cursor-pointer justify-between rounded-[9px] focus:bg-[#F1EEE5] ${mode === currency.key ? "bg-[#F1EEE5]" : ""}`}>
            <span className="flex items-center gap-2 text-sm text-[#0E0E0E]">
              <span>{currency.flag}</span>
              {currency.label}
            </span>
            {mode === currency.key && <span className="h-2 w-2 rounded-full bg-[#E6D7B8]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <header dir="rtl" className="fixed inset-x-0 top-0 z-50 border-b border-white/10 bg-[#0E0E0E]/96 text-white backdrop-blur-2xl">
        {searchFocused && <div aria-hidden="true" className="fixed inset-x-0 bottom-0 top-[112px] z-[55] touch-none bg-[#0E0E0E]/96 md:top-[120px]" />}
        <div className="mx-auto max-w-[1500px] px-4 md:px-6 lg:px-8">
          <div className="relative flex h-[58px] items-center justify-between md:hidden">
            <div className="flex items-center">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button type="button" aria-label="فتح القائمة" className="flex h-10 w-10 items-center justify-center rounded-xl text-white/78 transition-colors hover:bg-[#FFFFFF]/8 hover:text-[#E6D7B8]">
                    <List size={22} />
                  </button>
                </SheetTrigger>

                <SheetContent side="right" dir="rtl" className="flex h-full w-[86vw] max-w-[355px] flex-col border-l border-white/10 bg-[#0E0E0E] p-0">
                  <div className="flex items-center justify-center border-b border-white/10 px-5 py-5">
                    <button type="button" onClick={() => goFromMenu("/home")} className="flex items-center" aria-label="الرئيسية">
                      <Logo size="lg" showArabic invert />
                    </button>
                  </div>

                  <nav className="flex-1 overflow-y-auto px-3 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {unreadCount > 0 && (
                      <button type="button" onClick={() => goFromMenu("/notifications")} className="mt-4 flex w-full items-center gap-3 rounded-[14px] border border-[#E6D7B8] bg-[#F7F7F7] px-4 py-3 text-right">
                        <Bell size={19} className="text-[#D8C29A]" />
                        <span className="flex-1 text-xs font-medium text-[#0E0E0E]">لديك {unreadCount} إشعار جديد</span>
                      </button>
                    )}

                    <Section label="التسوق">
                      <NavItem icon={House} label="الرئيسية" isActive={location.pathname === "/home"} onPress={() => goFromMenu("/home")} />
                      <NavItem icon={SquaresFour} label="الأقسام" isActive={location.pathname === "/categories"} onPress={() => goFromMenu("/categories")} />
                      <NavItem icon={Package} label="جميع المنتجات" isActive={location.pathname === "/products"} onPress={() => goFromMenu("/products")} />
                      <NavItem icon={Tag} label="العروض" isActive={location.pathname === "/seasonal-offers"} onPress={() => goFromMenu("/seasonal-offers")} />
                      <NavItem icon={Package} label="وصل حديثاً" isActive={location.pathname === "/new-arrivals"} onPress={() => goFromMenu("/new-arrivals")} />
                      <NavItem icon={Crown} label="الأكثر مبيعاً" isActive={location.pathname === "/best-sellers"} onPress={() => goFromMenu("/best-sellers")} />
                    </Section>

                    <Section label="الحساب">
                      <NavItem icon={ShoppingCart} label="السلة" badge={cartCount || undefined} isActive={location.pathname === "/cart"} onPress={() => goFromMenu("/cart")} />
                      <NavItem icon={Heart} label="المفضلة" badge={favorites.length || undefined} isActive={location.pathname === "/favorites"} onPress={() => goFromMenu("/favorites")} />
                      <NavItem icon={User} label="حسابي" isActive={location.pathname === "/account"} onPress={() => goFromMenu("/account")} />
                    </Section>

                    <Section label="المتجر">
                      <NavItem icon={MapPin} label="معلومات المتجر" isActive={location.pathname === "/store-info"} onPress={() => goFromMenu("/store-info")} />
                      <NavItem icon={QrCode} label="باركود المتجر" isActive={location.pathname === "/qr-code"} onPress={() => goFromMenu("/qr-code")} />
                    </Section>
                  </nav>

                  <div className="border-t border-white/10 bg-[#0E0E0E] p-4">
                    {customer ? (
                      <button type="button" onClick={handleLogout} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E4D8D4] bg-[#FFFFFF] text-sm font-medium text-[#70625D] transition-colors hover:border-[#E2B9B5] hover:bg-[#FAFAFA] hover:text-[#E6D7B8]">
                        <SignOut size={18} />
                        تسجيل الخروج
                      </button>
                    ) : (
                      <button type="button" onClick={() => goFromMenu("/auth")} className="flex h-11 w-full items-center justify-center gap-2 bg-[#E6D7B8] text-sm font-semibold text-[#0E0E0E] transition-colors hover:bg-[#E6D7B8]">
                        <SignIn size={18} />
                        تسجيل الدخول
                      </button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <Link to="/home" aria-label="الرئيسية" className="absolute left-1/2 -translate-x-1/2">
              <Logo size="md" invert />
            </Link>

            <div className="flex items-center gap-0.5">
              {currencyMenu}
              <button type="button" onClick={openCart} aria-label="السلة" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-white/78 transition-colors hover:bg-[#FFFFFF]/8 hover:text-[#E6D7B8]">
                <ShoppingCart size={21} weight="regular" />
                {cartCount > 0 && <span className="absolute -left-1 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#E6D7B8] px-1 text-[9px] font-bold text-[#0E0E0E]">{cartCount > 99 ? "99+" : cartCount}</span>}
              </button>
            </div>
          </div>

          <div className="relative hidden h-[86px] grid-cols-[1fr_auto_1fr] items-center md:grid">
            <form onSubmit={submitSearch} className="relative z-[70] w-full max-w-[340px] justify-self-start">
              <label className="relative block border-b border-white/20">
                <MagnifyingGlass size={17} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-white/38" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="ابحث في جنان..."
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={searchPanelOpen && suggestions.length > 0}
                  className="h-[42px] w-full bg-transparent pr-7 pl-8 text-[11px] text-white outline-none placeholder:text-white/35"
                />
              </label>

              {searchFocused && (
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={closeSearch} aria-label="إغلاق البحث" className="absolute left-0 top-1/2 z-[80] flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[18px] font-light text-white/45">×</button>
              )}

              {searchPanelOpen && suggestions.length > 0 && (
                <div ref={searchResultsRef} role="listbox" className="absolute right-0 top-[50px] z-[75] max-h-[360px] w-[390px] overflow-y-auto border border-white/12 bg-[#0E0E0E] shadow-[0_24px_60px_rgba(35,49,40,0.12)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {suggestions.map((suggestion, index) => (
                    <button key={`${suggestion.type}-${suggestion.value}-${index}`} type="button" role="option" onMouseDown={(e) => e.preventDefault()} onClick={() => runSearch(suggestion.value)} className="flex w-full items-center gap-3 border-b border-[#EAEAEA] px-4 py-3 text-right transition-colors last:border-b-0 hover:bg-[#FFFFFF]/8">
                      <MagnifyingGlass size={14} className="shrink-0 text-[#D8C29A]" />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-white/82">{suggestion.value}</span>
                      <span className="shrink-0 text-[7px] tracking-[0.08em] text-white/35">{suggestion.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            <Link to="/home" aria-label="الرئيسية" className="justify-self-center">
              <Logo size="xl" showArabic invert />
            </Link>

            <div className="flex items-center justify-self-end gap-1">
              {currencyMenu}
              <Link to="/favorites" aria-label="المفضلة" className="relative flex h-10 w-10 items-center justify-center text-white/76 transition-colors hover:text-[#E6D7B8]">
                <Heart size={19} weight="regular" />
                {favorites.length > 0 && <span className="absolute -left-1 top-0 flex h-[15px] min-w-[15px] items-center justify-center bg-[#E6D7B8] px-1 text-[7px] font-bold text-[#0E0E0E]">{favorites.length > 99 ? "99+" : favorites.length}</span>}
              </Link>
              <button type="button" onClick={openCart} aria-label="السلة" className="relative flex h-10 w-10 items-center justify-center text-white/76 transition-colors hover:text-[#E6D7B8]">
                <ShoppingCart size={19} weight="regular" />
                {cartCount > 0 && <span className="absolute -left-1 top-0 flex h-[15px] min-w-[15px] items-center justify-center bg-[#E6D7B8] px-1 text-[7px] font-bold text-[#0E0E0E]">{cartCount > 99 ? "99+" : cartCount}</span>}
              </button>
              <Link to={customer ? "/account" : "/auth"} className="ml-1 flex h-10 items-center gap-2 border-r border-[#EAEAEA] pr-3 text-[9px] font-semibold text-white/76 transition-colors hover:text-[#E6D7B8]">
                <User size={16} />
                <span>{customer ? "حسابي" : "الدخول"}</span>
              </Link>
            </div>
          </div>

          <form onSubmit={submitSearch} className="relative z-[70] pb-3 md:hidden">
            <label className="relative block">
              <MagnifyingGlass size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#777777]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="ابحث عن منتج، ماركة أو قسم..."
                enterKeyHint="search"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={searchPanelOpen && suggestions.length > 0}
                className="h-10 w-full border-b border-white/20 bg-transparent pr-9 pl-9 text-[12px] text-white outline-none placeholder:text-white/35 focus:border-[#A9D8D3]"
              />
            </label>

            {searchFocused && (
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={closeSearch} aria-label="إغلاق البحث" className="absolute left-3 top-[22px] z-[80] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[20px] font-light leading-none text-white/45 transition-colors hover:bg-[#F5F5F5] hover:text-[#E6D7B8] active:bg-[#EFEFEF]">×</button>
            )}

            {searchPanelOpen && suggestions.length > 0 && (
              <div ref={searchResultsRef} role="listbox" className="absolute inset-x-0 top-[calc(100%-8px)] z-[75] max-h-[calc(100dvh-135px)] touch-pan-y overflow-y-auto overscroll-contain rounded-2xl border border-[#EAEAEA] bg-white shadow-[0_14px_35px_rgba(78,55,50,0.12)] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {suggestions.map((suggestion, index) => (
                  <button key={`${suggestion.type}-${suggestion.value}-${index}`} type="button" role="option" onMouseDown={(e) => e.preventDefault()} onClick={() => runSearch(suggestion.value)} className="flex w-full items-center gap-3 border-b border-[#F4F4F4] px-4 py-3 text-right transition-colors last:border-b-0 hover:bg-[#FAFAFA] active:bg-[#F4F4F4]">
                    <MagnifyingGlass size={15} className="shrink-0 text-[#D8C29A]" />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#0E0E0E]">{suggestion.value}</span>
                    <span className="shrink-0 bg-[#F7F7F7] px-2 py-1 text-[8px] text-[#777777]">{suggestion.type}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <nav className="hidden h-[40px] items-center justify-center gap-0 border-t border-white/10 md:flex">
            {desktopLinks.map((item) => {
              const active = location.pathname === item.to || (item.to === "/products" && location.pathname.startsWith("/product/"));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex h-full items-center px-4 text-[9px] font-semibold tracking-[0.01em] transition-colors lg:px-5 lg:text-[10px] ${active ? "text-white" : "text-white/50 hover:text-white"}`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-4 bottom-0 h-px bg-[#A9D8D3] lg:inset-x-5" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <div aria-hidden="true" className="h-[110px] md:h-[126px]" />
    </>
  );
};

export default Navbar;
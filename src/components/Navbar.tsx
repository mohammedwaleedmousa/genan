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
    <p className="mb-2 px-2 text-[10px] font-semibold text-[#7B817B]">{label}</p>
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
    className={`relative flex min-h-[48px] w-full items-center gap-3 rounded-[14px] px-3 text-right transition-colors ${isActive ? "bg-[#F3F0E6] text-[#173A2D]" : "text-[#35483F] hover:bg-[#F5F3EC]"}`}
  >
    {isActive && <span className="absolute right-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[#173A2D]" />}
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-[#E8E4D8] text-[#9D7B40]" : "bg-[#F3F0E8] text-[#697269]"}`}>
      <Icon size={19} weight="regular" />
    </span>
    <span className={`flex-1 text-right text-[13px] ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
    {!!badge && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#173A2D] px-1.5 text-[9px] font-bold text-white">{badge}</span>}
    <CaretLeft size={14} className={isActive ? "text-[#9D7B40]" : "text-[#C5B9B5]"} />
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
        <button type="button" aria-label="العملة" className="flex h-10 items-center gap-1 rounded-xl px-2 text-[11px] font-semibold text-[#45564D] transition-colors hover:bg-[#F3F0E6] hover:text-[#9D7B40] md:h-10 md:px-3">
          <Globe size={17} />
          <span>{short}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60 rounded-[14px] border-[#DDD7C8] bg-white">
        <DropdownMenuLabel className="text-xs text-[#31443A]">اختر العملة</DropdownMenuLabel>
        <DropdownMenuSeparator className="bg-[#E4DED1]" />
        {currencies.map((currency) => (
          <DropdownMenuItem key={currency.key} onClick={() => setMode(currency.key)} className={`cursor-pointer justify-between rounded-[9px] focus:bg-[#F1EEE5] ${mode === currency.key ? "bg-[#F1EEE5]" : ""}`}>
            <span className="flex items-center gap-2 text-sm text-[#35483F]">
              <span>{currency.flag}</span>
              {currency.label}
            </span>
            {mode === currency.key && <span className="h-2 w-2 rounded-full bg-[#173A2D]" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <header dir="rtl" className="fixed inset-x-0 top-0 z-50 border-b border-[#D9D2C4] bg-[#F8F6F0]/96 backdrop-blur-2xl">
        {searchFocused && <div aria-hidden="true" className="fixed inset-x-0 bottom-0 top-[112px] z-[55] touch-none bg-white/96 md:top-[120px]" />}
        <div className="mx-auto max-w-[1500px] px-4 md:px-6 lg:px-8">
          <div className="relative flex h-[58px] items-center justify-between md:hidden">
            <div className="flex items-center">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button type="button" aria-label="فتح القائمة" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#35483F] transition-colors hover:bg-[#F3F0E6] hover:text-[#9D7B40]">
                    <List size={22} />
                  </button>
                </SheetTrigger>

                <SheetContent side="right" dir="rtl" className="flex h-full w-[86vw] max-w-[355px] flex-col border-l border-[#E3DDD0] bg-[#F8F6F0] p-0">
                  <div className="flex items-center justify-center border-b border-[#E3DDD0] px-5 py-5">
                    <button type="button" onClick={() => goFromMenu("/home")} className="flex items-center" aria-label="الرئيسية">
                      <Logo size="lg" showArabic />
                    </button>
                  </div>

                  <nav className="flex-1 overflow-y-auto px-3 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {unreadCount > 0 && (
                      <button type="button" onClick={() => goFromMenu("/notifications")} className="mt-4 flex w-full items-center gap-3 rounded-[14px] border border-[#D8CCAE] bg-[#F3F0E6] px-4 py-3 text-right">
                        <Bell size={19} className="text-[#9D7B40]" />
                        <span className="flex-1 text-xs font-medium text-[#173A2D]">لديك {unreadCount} إشعار جديد</span>
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

                  <div className="border-t border-[#E3DDD0] bg-[#F8F6F0] p-4">
                    {customer ? (
                      <button type="button" onClick={handleLogout} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-[#E4D8D4] bg-white text-sm font-medium text-[#70625D] transition-colors hover:border-[#E2B9B5] hover:bg-[#FFF8F6] hover:text-[#9D7B40]">
                        <SignOut size={18} />
                        تسجيل الخروج
                      </button>
                    ) : (
                      <button type="button" onClick={() => goFromMenu("/auth")} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#173A2D] text-sm font-semibold text-white transition-colors hover:bg-[#214C3B]">
                        <SignIn size={18} />
                        تسجيل الدخول
                      </button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>

            <Link to="/home" aria-label="الرئيسية" className="absolute left-1/2 -translate-x-1/2">
              <Logo size="md" />
            </Link>

            <div className="flex items-center gap-0.5">
              {currencyMenu}
              <button type="button" onClick={openCart} aria-label="السلة" className="relative flex h-10 w-10 items-center justify-center rounded-xl text-[#35483F] transition-colors hover:bg-[#F3F0E6] hover:text-[#9D7B40]">
                <ShoppingCart size={21} weight="regular" />
                {cartCount > 0 && <span className="absolute -left-1 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#173A2D] px-1 text-[9px] font-bold text-white">{cartCount > 99 ? "99+" : cartCount}</span>}
              </button>
            </div>
          </div>

          <div className="relative hidden h-[86px] grid-cols-[1fr_auto_1fr] items-center md:grid">
            <form onSubmit={submitSearch} className="relative z-[70] w-full max-w-[340px] justify-self-start">
              <label className="relative block border-b border-[#CFC8B9]">
                <MagnifyingGlass size={17} className="pointer-events-none absolute right-0 top-1/2 -translate-y-1/2 text-[#738078]" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="ابحث في جنان..."
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={searchPanelOpen && suggestions.length > 0}
                  className="h-[42px] w-full bg-transparent pr-7 pl-8 text-[11px] text-[#173A2D] outline-none placeholder:text-[#8B938C]"
                />
              </label>

              {searchFocused && (
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={closeSearch} aria-label="إغلاق البحث" className="absolute left-0 top-1/2 z-[80] flex h-7 w-7 -translate-y-1/2 items-center justify-center text-[18px] font-light text-[#778077]">×</button>
              )}

              {searchPanelOpen && suggestions.length > 0 && (
                <div ref={searchResultsRef} role="listbox" className="absolute right-0 top-[50px] z-[75] max-h-[360px] w-[390px] overflow-y-auto border border-[#D9D2C4] bg-[#F8F6F0] shadow-[0_24px_60px_rgba(35,49,40,0.12)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {suggestions.map((suggestion, index) => (
                    <button key={`${suggestion.type}-${suggestion.value}-${index}`} type="button" role="option" onMouseDown={(e) => e.preventDefault()} onClick={() => runSearch(suggestion.value)} className="flex w-full items-center gap-3 border-b border-[#E4DED1] px-4 py-3 text-right transition-colors last:border-b-0 hover:bg-[#EEE9DD]">
                      <MagnifyingGlass size={14} className="shrink-0 text-[#9D7B40]" />
                      <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-[#173A2D]">{suggestion.value}</span>
                      <span className="shrink-0 text-[7px] tracking-[0.08em] text-[#798279]">{suggestion.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            <Link to="/home" aria-label="الرئيسية" className="justify-self-center">
              <Logo size="xl" showArabic />
            </Link>

            <div className="flex items-center justify-self-end gap-1">
              {currencyMenu}
              <Link to="/favorites" aria-label="المفضلة" className="relative flex h-10 w-10 items-center justify-center text-[#31473B] transition-colors hover:text-[#9D7B40]">
                <Heart size={19} weight="regular" />
                {favorites.length > 0 && <span className="absolute -left-1 top-0 flex h-[15px] min-w-[15px] items-center justify-center bg-[#173A2D] px-1 text-[7px] font-bold text-white">{favorites.length > 99 ? "99+" : favorites.length}</span>}
              </Link>
              <button type="button" onClick={openCart} aria-label="السلة" className="relative flex h-10 w-10 items-center justify-center text-[#31473B] transition-colors hover:text-[#9D7B40]">
                <ShoppingCart size={19} weight="regular" />
                {cartCount > 0 && <span className="absolute -left-1 top-0 flex h-[15px] min-w-[15px] items-center justify-center bg-[#173A2D] px-1 text-[7px] font-bold text-white">{cartCount > 99 ? "99+" : cartCount}</span>}
              </button>
              <Link to={customer ? "/account" : "/auth"} className="ml-1 flex h-10 items-center gap-2 border-r border-[#D8D1C3] pr-3 text-[9px] font-semibold text-[#31473B] transition-colors hover:text-[#9D7B40]">
                <User size={16} />
                <span>{customer ? "حسابي" : "الدخول"}</span>
              </Link>
            </div>
          </div>

          <form onSubmit={submitSearch} className="relative z-[70] pb-3 md:hidden">
            <label className="relative block">
              <MagnifyingGlass size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7A827A]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="ابحث عن منتج، ماركة أو قسم..."
                enterKeyHint="search"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={searchPanelOpen && suggestions.length > 0}
                className="h-10 w-full border-b border-[#CFC8B9] bg-transparent pr-9 pl-9 text-[12px] text-[#173A2D] outline-none placeholder:text-[#8B938C] focus:border-[#9D7B40]"
              />
            </label>

            {searchFocused && (
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={closeSearch} aria-label="إغلاق البحث" className="absolute left-3 top-[22px] z-[80] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[20px] font-light leading-none text-[#778077] transition-colors hover:bg-[#EFECE3] hover:text-[#9D7B40] active:bg-[#EAE6DC]">×</button>
            )}

            {searchPanelOpen && suggestions.length > 0 && (
              <div ref={searchResultsRef} role="listbox" className="absolute inset-x-0 top-[calc(100%-8px)] z-[75] max-h-[calc(100dvh-135px)] touch-pan-y overflow-y-auto overscroll-contain rounded-2xl border border-[#DDD7C8] bg-white shadow-[0_14px_35px_rgba(78,55,50,0.12)] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {suggestions.map((suggestion, index) => (
                  <button key={`${suggestion.type}-${suggestion.value}-${index}`} type="button" role="option" onMouseDown={(e) => e.preventDefault()} onClick={() => runSearch(suggestion.value)} className="flex w-full items-center gap-3 border-b border-[#ECE8DE] px-4 py-3 text-right transition-colors last:border-b-0 hover:bg-[#FFF8F6] active:bg-[#EFEBE1]">
                    <MagnifyingGlass size={15} className="shrink-0 text-[#9D7B40]" />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#2D4136]">{suggestion.value}</span>
                    <span className="shrink-0 rounded-full bg-[#F0EDE5] px-2 py-1 text-[8px] text-[#778077]">{suggestion.type}</span>
                  </button>
                ))}
              </div>
            )}
          </form>

          <nav className="hidden h-[40px] items-center justify-center gap-0 border-t border-[#DED7C8] md:flex">
            {desktopLinks.map((item) => {
              const active = location.pathname === item.to || (item.to === "/products" && location.pathname.startsWith("/product/"));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex h-full items-center px-4 text-[9px] font-semibold tracking-[0.01em] transition-colors lg:px-5 lg:text-[10px] ${active ? "text-[#173A2D]" : "text-[#667168] hover:text-[#173A2D]"}`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-4 bottom-0 h-px bg-[#173A2D] lg:inset-x-5" />}
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
import Logo from "@/components/Logo";
import {
  Bell,
  CaretLeft,
  Crown,
  Heart,
  House,
  List,
  MagnifyingGlass,
  MapPin,
  Package,
  QrCode,
  ShoppingBag,
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
import { useCustomerNotifications } from "@/hooks/useCustomerNotifications";
import { supabase } from "@/integrations/supabase/client";

import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

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
  <section className="mt-5">
    <p className="mb-2 px-3 text-[11px] font-semibold text-[#8C6B32]">{label}</p>
    <div className="space-y-1 rounded-3xl bg-white p-1.5">{children}</div>
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
    className={`relative flex min-h-[48px] w-full items-center gap-3 rounded-2xl px-3 text-right transition-colors ${isActive ? "bg-[#F4EEE4] text-[#171717]" : "text-[#171717] hover:bg-[#F8F6F2]"}`}
  >
    {isActive && <span className="absolute right-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full bg-[#0E0E0E]" />}
    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-[#E9DDC9] text-[#735729]" : "bg-[#F7F5F1] text-[#77716A]"}`}>
      <Icon size={19} weight="regular" />
    </span>
    <span className={`flex-1 text-right text-[13px] ${isActive ? "font-semibold" : "font-medium"}`}>{label}</span>
    {!!badge && <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#0E0E0E] px-1.5 text-[9px] font-bold text-white">{badge}</span>}
    <CaretLeft size={14} className={isActive ? "text-[#8C6B32]" : "text-[#D8C29A]"} />
  </button>
);

type NavbarProps = { variant?: "default" | "product" | "editorial"; overlayHero?: boolean };

const Navbar = ({ overlayHero = false }: NavbarProps) => {
  // Scope shared storefront treatments to Genan, not the admin dashboard.
  useEffect(() => {
    const previous = document.body.dataset.storefront;
    document.body.dataset.storefront = "genan";
    return () => {
      if (previous) document.body.dataset.storefront = previous;
      else delete document.body.dataset.storefront;
    };
  }, []);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [headerScrolled, setHeaderScrolled] = useState(() => typeof window !== "undefined" && window.scrollY > 24);
  const mobileSearchInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!overlayHero) return;
    const update = () => setHeaderScrolled(window.scrollY > 24);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [overlayHero]);

  useEffect(() => {
    if (!mobileSearchOpen) return;
    const frame = window.requestAnimationFrame(() => mobileSearchInputRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [mobileSearchOpen]);
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

  const closeSearch = () => {
    restoreScrollOnUnlockRef.current = true;
    setSearchFocused(false);
    setMobileSearchOpen(false);
    setSearchTerm("");
  };

  const runSearch = (value: string) => {
    const cleaned = value.trim();
    if (!cleaned) return;
    restoreScrollOnUnlockRef.current = false;
    navigate(`/products?search=${encodeURIComponent(cleaned)}`);
    setSearchTerm("");
    setSearchFocused(false);
    setMobileSearchOpen(false);
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


  return (
    <>
      <header dir="rtl" className={`fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,backdrop-filter] duration-300 ${overlayHero && !headerScrolled && !mobileSearchOpen ? "border-b border-transparent bg-transparent shadow-none backdrop-blur-none" : "border-b border-white/60 bg-white/65 shadow-[0_6px_28px_rgba(14,14,14,0.09)] backdrop-blur-2xl backdrop-saturate-150"}`}>
        {searchFocused && <div aria-hidden="true" className="fixed inset-x-0 bottom-0 top-[56px] z-[55] touch-none bg-white/96 md:top-[120px]" />}
        <div className="mx-auto max-w-[1500px] px-4 md:px-6 lg:px-8">
          <div className="relative flex h-14 items-center justify-between md:hidden">
            <div className="flex items-center">
              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button type="button" aria-label="فتح القائمة" onClick={() => { if (mobileSearchOpen) closeSearch(); }} className="flex h-10 w-10 items-center justify-center rounded-xl text-[#0E0E0E] transition-colors hover:text-[#8C6B32]">
                    <List size={22} />
                  </button>
                </SheetTrigger>

                <SheetContent side="right" dir="rtl" className="flex h-full w-[86vw] max-w-[355px] flex-col border-l border-[#EAE5DA] bg-[#FAF9F7] p-0">
                  <div className="flex items-center justify-center border-b border-[#EAE5DA] bg-white px-5 py-5">
                    <button type="button" onClick={() => goFromMenu("/home")} className="flex items-center" aria-label="الرئيسية">
                      <Logo size="lg" className="shrink-0" />
                    </button>
                  </div>

                  <nav className="flex-1 overflow-y-auto overscroll-contain px-4 pb-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                    {unreadCount > 0 && (
                      <button type="button" onClick={() => goFromMenu("/notifications")} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-[#EAE5DA] bg-white px-4 py-3 text-right">
                        <Bell size={19} className="text-[#8C6B32]" />
                        <span className="flex-1 text-xs font-medium text-[#8C6B32]">لديك {unreadCount} إشعار جديد</span>
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

                  <div className="border-t border-[#EAE5DA] bg-white p-4">
                    {customer ? (
                      <button type="button" onClick={handleLogout} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-[#D8C29A] bg-white text-sm font-medium text-[#0E0E0E] transition-colors hover:border-[#D8C29A] hover:text-[#8C6B32]">
                        <SignOut size={18} />
                        تسجيل الخروج
                      </button>
                    ) : (
                      <button type="button" onClick={() => goFromMenu("/auth")} className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[#0E0E0E] text-sm font-semibold text-white transition-colors">
                        <SignIn size={18} />
                        تسجيل الدخول
                      </button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
              <button type="button" onClick={() => { if (mobileSearchOpen) closeSearch(); else { setMenuOpen(false); setMobileSearchOpen(true); } }} aria-label={mobileSearchOpen ? "إغلاق البحث" : "فتح البحث"} aria-expanded={mobileSearchOpen} aria-controls="genan-mobile-nav-search" className="flex h-10 w-10 items-center justify-center rounded-xl text-[#0E0E0E] transition-colors hover:text-[#8C6B32]">
                <MagnifyingGlass size={22} weight="regular" />
              </button>
            </div>

            <Link to="/home" aria-label="الرئيسية" className="absolute left-1/2 -translate-x-1/2">
              <Logo size="md" className="shrink-0" />
            </Link>

            <div className="flex shrink-0 items-center gap-1">
              {/* Bag occupies the former currency slot and always opens the full cart page. */}
              <Link to="/cart" aria-label="افتح حقيبة التسوق" title="حقيبة التسوق" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#0E0E0E] transition-colors hover:text-[#8C6B32]">
                <ShoppingBag size={22} weight="regular" aria-hidden="true" />
                {cartCount > 0 && <span className="absolute -left-1 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#0E0E0E] px-1 text-[9px] font-bold text-white">{cartCount > 99 ? "99+" : cartCount}</span>}
              </Link>
              <button type="button" onClick={openCart} aria-label="فتح السلة السريعة" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-[#0E0E0E] transition-colors hover:text-[#8C6B32]">
                <ShoppingCart size={21} weight="regular" />
              </button>
            </div>
          </div>

          <div className="hidden md:flex md:h-[72px] md:items-center md:gap-6 lg:gap-8">
            <Link to="/home" aria-label="الرئيسية" className="flex shrink-0 items-center gap-3">
              <Logo size="lg" className="shrink-0" />
            </Link>

            <form onSubmit={submitSearch} className="relative z-[70] mx-auto w-full max-w-[620px]">
              <label className="relative block">
                <MagnifyingGlass size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#686868]" />
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  placeholder="ابحث عن منتج، ماركة أو قسم..."
                  autoComplete="off"
                  aria-autocomplete="list"
                  aria-expanded={searchPanelOpen && suggestions.length > 0}
                  className="h-[44px] w-full rounded-full border border-[#F7F7F7] bg-[#FAFAFA] pr-11 pl-11 text-[12px] text-[#0E0E0E] outline-none transition-all placeholder:text-[#686868] focus:border-[#D8C29A] focus:bg-white focus:shadow-[0_8px_28px_rgba(14,14,14,0.08)]"
                />
              </label>

              {searchFocused && (
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={closeSearch} aria-label="إغلاق البحث" className="absolute left-3 top-1/2 z-[80] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[18px] font-light text-[#8C6B32]">×</button>
              )}

              {searchPanelOpen && suggestions.length > 0 && (
                <div ref={searchResultsRef} role="listbox" className="absolute inset-x-0 top-[52px] z-[75] max-h-[360px] overflow-y-auto rounded-[18px] border border-[#D8C29A] bg-white shadow-[0_18px_50px_rgba(14,14,14,0.12)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                  {suggestions.map((suggestion, index) => (
                    <button key={`${suggestion.type}-${suggestion.value}-${index}`} type="button" role="option" onMouseDown={(e) => e.preventDefault()} onClick={() => runSearch(suggestion.value)} className="flex w-full items-center gap-3 border-b border-[#FAFAFA] px-4 py-3 text-right transition-colors last:border-b-0 hover:bg-[#FAFAFA]">
                      <MagnifyingGlass size={15} className="shrink-0 text-[#8C6B32]" />
                      <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#0E0E0E]">{suggestion.value}</span>
                      <span className="shrink-0 rounded-full bg-[#FAFAFA] px-2 py-1 text-[8px] text-[#8C6B32]">{suggestion.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </form>

            <div className="flex shrink-0 items-center gap-1.5">
              <Link to="/cart" aria-label="افتح حقيبة التسوق" title="حقيبة التسوق" className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-transparent text-[#0E0E0E] transition-colors hover:border-[#F7F7F7] hover:text-[#8C6B32]">
                <ShoppingBag size={20} weight="regular" aria-hidden="true" />
                {cartCount > 0 && <span className="absolute -left-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#0E0E0E] px-1 text-[8px] font-bold text-white">{cartCount > 99 ? "99+" : cartCount}</span>}
              </Link>
              <Link to="/favorites" aria-label="المفضلة" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-[#0E0E0E] transition-colors hover:border-[#F7F7F7] hover:text-[#8C6B32]">
                <Heart size={20} weight="regular" />
                {favorites.length > 0 && <span className="absolute -left-1 -top-1 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-[#0E0E0E] px-1 text-[8px] font-bold text-white">{favorites.length > 99 ? "99+" : favorites.length}</span>}
              </Link>
              <button type="button" onClick={openCart} aria-label="فتح السلة السريعة" className="relative flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-[#0E0E0E] transition-colors hover:border-white/65 hover:text-[#8C6B32]">
                <ShoppingCart size={20} weight="regular" />
              </button>
              <Link to={customer ? "/account" : "/auth"} className="flex h-10 items-center gap-2 rounded-full border border-[#D8C29A] bg-white px-3 text-[10px] font-medium text-[#0E0E0E] transition-colors hover:border-[#D8C29A] hover:text-[#8C6B32]">
                <User size={17} />
                <span className="hidden lg:inline">{customer ? "حسابي" : "تسجيل الدخول"}</span>
              </Link>
            </div>
          </div>

          {mobileSearchOpen && <form id="genan-mobile-nav-search" onSubmit={submitSearch} role="search" className="absolute inset-x-0 top-full z-[70] border-t border-[#F7F7F7] bg-white/95 px-4 pb-3 pt-3 shadow-[0_14px_30px_rgba(14,14,14,0.08)] md:hidden">
            <label className="relative block">
              <MagnifyingGlass size={18} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#686868]" />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="ابحث عن منتج، ماركة أو قسم..."
                enterKeyHint="search"
                 ref={mobileSearchInputRef}
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={searchPanelOpen && suggestions.length > 0}
                className="h-11 w-full rounded-2xl border border-[#F7F7F7] bg-[#FAFAFA] pr-11 pl-11 text-[13px] text-[#0E0E0E] outline-none placeholder:text-[#686868] focus:border-[#D8C29A] focus:bg-white"
              />
            </label>

            {searchFocused && (
              <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={closeSearch} aria-label="إغلاق البحث" className="absolute left-3 top-[22px] z-[80] flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[20px] font-light leading-none text-[#8C6B32] transition-colors hover:text-[#8C6B32] active:bg-[#F7F7F7]">×</button>
            )}

            {searchPanelOpen && suggestions.length > 0 && (
              <div ref={searchResultsRef} role="listbox" className="absolute inset-x-0 top-[calc(100%-8px)] z-[75] max-h-[calc(100dvh-135px)] touch-pan-y overflow-y-auto overscroll-contain rounded-2xl border border-[#D8C29A] bg-white shadow-[0_14px_35px_rgba(14,14,14,0.12)] [-webkit-overflow-scrolling:touch] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {suggestions.map((suggestion, index) => (
                  <button key={`${suggestion.type}-${suggestion.value}-${index}`} type="button" role="option" onMouseDown={(e) => e.preventDefault()} onClick={() => runSearch(suggestion.value)} className="flex w-full items-center gap-3 border-b border-[#FAFAFA] px-4 py-3 text-right transition-colors last:border-b-0 hover:bg-[#FAFAFA] active:bg-[#F7F7F7]">
                    <MagnifyingGlass size={15} className="shrink-0 text-[#8C6B32]" />
                    <span className="min-w-0 flex-1 truncate text-[12px] font-medium text-[#0E0E0E]">{suggestion.value}</span>
                    <span className="shrink-0 rounded-full bg-[#FAFAFA] px-2 py-1 text-[8px] text-[#8C6B32]">{suggestion.type}</span>
                  </button>
                ))}
              </div>
            )}
          </form>}

          <nav className={`hidden h-[48px] items-center justify-center gap-1 border-t md:flex lg:gap-2 ${overlayHero && !headerScrolled && !mobileSearchOpen ? "border-transparent" : "border-white/45"}`}>
            {desktopLinks.map((item) => {
              const active = location.pathname === item.to || (item.to === "/products" && location.pathname.startsWith("/product/"));
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative flex h-full items-center px-3 text-[10px] font-medium transition-colors lg:px-4 lg:text-[11px] ${active ? "text-[#8C6B32]" : "text-[#0E0E0E] hover:text-[#8C6B32]"}`}
                >
                  {item.label}
                  {active && <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-[#0E0E0E] lg:inset-x-4" />}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      {!overlayHero && <div aria-hidden="true" className="h-[56px] md:h-[120px]" />}
    </>
  );
};

export default Navbar;
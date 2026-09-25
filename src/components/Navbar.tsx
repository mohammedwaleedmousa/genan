import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Globe,
  Heart,
  List,
  MagnifyingGlass,
  ShoppingBag,
  SignIn,
  SignOut,
  User,
  X,
} from "phosphor-react";

import Logo from "@/components/Logo";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuthActions } from "@/hooks/useAuthActions";
import { useFavorites } from "@/hooks/useFavorites";
import { getActiveCurrencies, useCurrency } from "@/lib/currency";
import { useStore } from "@/store/useStore";

type SearchSuggestion = {
  value: string;
  type: "منتج" | "ماركة" | "قسم";
};

let searchIndexCache: SearchSuggestion[] | null = null;

const normalizeSearch = (value: string) => value.trim().toLocaleLowerCase("ar");

const loadSearchIndex = async () => {
  if (searchIndexCache) return searchIndexCache;

  const [productsResult, brandsResult, categoriesResult] = await Promise.all([
    supabase.from("products").select("name_ar,name").eq("is_active", true).limit(500),
    supabase.from("brands").select("name").eq("is_active", true).limit(200),
    supabase.from("categories").select("name_ar,name").eq("is_active", true).limit(200),
  ]);

  const raw: SearchSuggestion[] = [
    ...((productsResult.data || []) as Array<{ name_ar: string | null; name: string | null }>).map((row) => ({
      value: String(row.name_ar || row.name || "").trim(),
      type: "منتج" as const,
    })),
    ...((brandsResult.data || []) as Array<{ name: string | null }>).map((row) => ({
      value: String(row.name || "").trim(),
      type: "ماركة" as const,
    })),
    ...((categoriesResult.data || []) as Array<{ name_ar: string | null; name: string | null }>).map((row) => ({
      value: String(row.name_ar || row.name || "").trim(),
      type: "قسم" as const,
    })),
  ].filter((item) => item.value);

  searchIndexCache = Array.from(
    new Map(raw.map((item) => [`${item.type}:${normalizeSearch(item.value)}`, item])).values(),
  );

  return searchIndexCache;
};

const navLinks = [
  { label: "الرئيسية", to: "/home" },
  { label: "المنتجات", to: "/products" },
  { label: "الأقسام", to: "/categories" },
  { label: "الماركات", to: "/brands" },
  { label: "وصل حديثًا", to: "/new-arrivals" },
];

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [desktopSearchOpen, setDesktopSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchIndex, setSearchIndex] = useState<SearchSuggestion[]>(() => searchIndexCache || []);

  const { openCart, getCartCount, customer, setCustomer } = useStore();
  const favorites = useFavorites((state) => state.favorites);
  const { logout } = useAuthActions();
  const { mode, setMode, short } = useCurrency();

  const cartCount = getCartCount();
  const currencies = getActiveCurrencies();

  useEffect(() => {
    const previousStorefront = document.body.dataset.storefront;
    document.body.dataset.storefront = "genan";

    return () => {
      if (previousStorefront) document.body.dataset.storefront = previousStorefront;
      else delete document.body.dataset.storefront;
    };
  }, []);

  useEffect(() => {
    let active = true;
    void loadSearchIndex().then((index) => {
      if (active) setSearchIndex(index);
    });
    return () => {
      active = false;
    };
  }, []);

  const suggestions = useMemo(() => {
    const value = normalizeSearch(searchTerm);
    if (!value) return [];

    return searchIndex
      .filter((item) => normalizeSearch(item.value).includes(value))
      .sort((a, b) => {
        const av = normalizeSearch(a.value);
        const bv = normalizeSearch(b.value);
        return Number(!av.startsWith(value)) - Number(!bv.startsWith(value)) || a.value.localeCompare(b.value, "ar");
      })
      .slice(0, 7);
  }, [searchIndex, searchTerm]);

  const submitSearch = (value = searchTerm) => {
    const cleaned = value.trim();
    if (!cleaned) return;

    navigate(`/products?search=${encodeURIComponent(cleaned)}`);
    setSearchTerm("");
    setDesktopSearchOpen(false);
    setMobileSearchOpen(false);
    setMenuOpen(false);
  };

  const handleLogout = async () => {
    await logout();
    setCustomer(null);
    setMenuOpen(false);
    navigate("/home");
  };

  const isActive = (to: string) =>
    location.pathname === to || (to === "/products" && location.pathname.startsWith("/product/"));

  return (
    <>
      <header dir="rtl" className="fixed inset-x-0 top-0 z-50 border-b border-[#EAEAEA] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-[1760px] items-center px-3 sm:px-5 md:h-[76px] md:px-[5vw]">
          <div className="flex flex-1 items-center justify-start md:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <button type="button" aria-label="فتح القائمة" className="flex h-10 w-10 items-center justify-center text-[#0E0E0E]">
                  <List size={23} weight="regular" />
                </button>
              </SheetTrigger>

              <SheetContent side="right" dir="rtl" className="w-[84vw] max-w-[330px] border-l border-[#EEEAE3] bg-white p-0 shadow-[-12px_0_35px_rgba(14,14,14,.07)]">
                <div className="flex h-[72px] items-center justify-between border-b border-[#F0ECE5] px-5">
                  <div>
                    <Logo size="md" />
                    <p className="mt-1 text-[6px] tracking-[.22em] text-[#A38B61]">GENAN / MENU</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    aria-label="إغلاق القائمة"
                    className="flex h-9 w-9 items-center justify-center text-[#777] transition-colors hover:text-[#0E0E0E]"
                  >
                    <X size={17} />
                  </button>
                </div>

                <div className="flex h-[calc(100dvh-72px)] flex-col">
                  <div className="border-b border-[#F4F1EB] px-5 py-4">
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        submitSearch();
                      }}
                      className="relative"
                    >
                      <MagnifyingGlass size={15} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#999]" />
                      <input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="ابحث عن منتج أو ماركة أو قسم"
                        className="h-10 w-full border-0 border-b border-[#DDD8CF] bg-transparent pr-7 pl-1 text-[11px] outline-none transition-colors focus:border-[#C9B183]"
                      />
                    </form>

                    {suggestions.length > 0 && (
                      <div className="pt-2">
                        {suggestions.slice(0, 4).map((item) => (
                          <button
                            key={`sidebar-${item.type}-${item.value}`}
                            type="button"
                            onClick={() => submitSearch(item.value)}
                            className="flex w-full items-center justify-between py-2 text-right"
                          >
                            <span className="truncate text-[9px] font-medium text-[#555]">{item.value}</span>
                            <span className="text-[7px] text-[#AAA]">{item.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto px-3 py-3">
                    <nav aria-label="القائمة الرئيسية">
                      {navLinks.map((item) => {
                        const active = isActive(item.to);
                        return (
                          <SheetClose asChild key={item.to}>
                            <Link
                              to={item.to}
                              className={`relative flex h-[48px] w-full items-center justify-between px-4 text-right transition-colors ${active ? "bg-[#FBF8F1] font-semibold text-[#0E0E0E]" : "font-medium text-[#666] hover:bg-[#FCFBF8] hover:text-[#0E0E0E]"}`}
                            >
                              {active && <span className="absolute inset-y-[10px] right-0 w-[2px] bg-[#C9B183]" />}
                              <span className="text-[11px]">{item.label}</span>
                              {active && <span className="h-1.5 w-1.5 rounded-full bg-[#A9D8D3]" />}
                            </Link>
                          </SheetClose>
                        );
                      })}
                    </nav>

                    <div className="my-3 h-px bg-[#F0ECE5]" />

                    <div>
                      <p className="px-4 pb-1 text-[7px] font-semibold tracking-[.18em] text-[#AAA49A]">حسابي وتسوقي</p>

                      <button
                        type="button"
                        onClick={() => {
                          openCart();
                          setMenuOpen(false);
                        }}
                        className="flex h-11 w-full items-center justify-between px-4 text-[10px] font-medium text-[#666] transition-colors hover:text-[#0E0E0E]"
                      >
                        <span className="flex items-center gap-2.5"><ShoppingBag size={15} /> السلة</span>
                        {cartCount > 0 && (
                          <span className="min-w-[18px] text-center text-[8px] font-semibold text-[#9A825B]">
                            {cartCount > 99 ? "99+" : cartCount}
                          </span>
                        )}
                      </button>

                      <SheetClose asChild>
                        <Link
                          to="/favorites"
                          className="flex h-11 w-full items-center justify-between px-4 text-[10px] font-medium text-[#666] transition-colors hover:text-[#0E0E0E]"
                        >
                          <span className="flex items-center gap-2.5"><Heart size={15} /> المفضلة</span>
                          {favorites.length > 0 && <span className="text-[8px] font-semibold text-[#9A825B]">{favorites.length}</span>}
                        </Link>
                      </SheetClose>

                      <SheetClose asChild>
                        <Link
                          to={customer ? "/account" : "/auth"}
                          className="flex h-11 w-full items-center px-4 text-[10px] font-medium text-[#666] transition-colors hover:text-[#0E0E0E]"
                        >
                          <span className="flex items-center gap-2.5"><User size={15} /> {customer ? "حسابي" : "تسجيل الدخول"}</span>
                        </Link>
                      </SheetClose>
                    </div>

                    <div className="my-3 h-px bg-[#F0ECE5]" />

                    <div>
                      <div className="flex items-center justify-between px-4 pb-1">
                        <p className="text-[7px] font-semibold tracking-[.18em] text-[#AAA49A]">العملة</p>
                        <span className="text-[8px] font-semibold text-[#0E0E0E]">{short}</span>
                      </div>

                      <div className="px-2">
                        {currencies.map((currency) => {
                          const activeCurrency = mode === currency.code;
                          return (
                            <button
                              key={currency.code}
                              type="button"
                              onClick={() => setMode(currency.code as typeof mode)}
                              className={`relative flex h-10 w-full items-center justify-between px-2.5 text-right transition-colors ${activeCurrency ? "text-[#0E0E0E]" : "text-[#777] hover:text-[#0E0E0E]"}`}
                            >
                              <span className="flex items-center gap-2 text-[9px]">
                                <Globe size={13} />
                                {currency.meta.label}
                              </span>
                              {activeCurrency && <span className="h-1.5 w-1.5 rounded-full bg-[#A9D8D3]" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#F0ECE5] px-5 py-4">
                    {customer ? (
                      <button
                        onClick={handleLogout}
                        className="flex h-10 w-full items-center gap-2 text-[9px] font-medium text-[#777] transition-colors hover:text-[#0E0E0E]"
                      >
                        <SignOut size={14} />
                        تسجيل الخروج
                      </button>
                    ) : (
                      <SheetClose asChild>
                        <Link
                          to="/auth"
                          className="flex h-10 w-full items-center gap-2 text-[9px] font-semibold text-[#0E0E0E]"
                        >
                          <SignIn size={14} />
                          تسجيل الدخول
                        </Link>
                      </SheetClose>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <nav className="hidden flex-1 items-center justify-start gap-6 lg:gap-8 md:flex">
            {navLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`relative flex h-[76px] items-center text-[10px] font-semibold transition-colors ${isActive(item.to) ? "text-[#0E0E0E]" : "text-[#777] hover:text-[#0E0E0E]"}`}
              >
                {item.label}
                {isActive(item.to) && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-[#D8C29A]" />}
              </Link>
            ))}
          </nav>

          <Link to="/home" aria-label="الرئيسية" className="absolute left-1/2 -translate-x-1/2">
            <Logo size="lg" />
          </Link>

          <div className="flex flex-1 items-center justify-end gap-0.5 md:gap-1">
            <div className="relative hidden md:block">
              {desktopSearchOpen ? (
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    submitSearch();
                  }}
                  className="relative flex h-10 w-[230px] items-center border-b border-[#CFCFCF]"
                >
                  <MagnifyingGlass size={16} className="shrink-0 text-[#777]" />
                  <input
                    autoFocus
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="ابحث"
                    className="h-full min-w-0 flex-1 bg-transparent px-3 text-[11px] outline-none"
                  />
                  <button type="button" onClick={() => { setDesktopSearchOpen(false); setSearchTerm(""); }} className="flex h-8 w-8 items-center justify-center text-[#777]">
                    <X size={14} />
                  </button>

                  {suggestions.length > 0 && (
                    <div className="absolute left-0 right-0 top-11 border border-[#EAEAEA] bg-white shadow-[0_18px_50px_rgba(0,0,0,.08)]">
                      {suggestions.map((item) => (
                        <button
                          key={`${item.type}-${item.value}`}
                          type="button"
                          onClick={() => submitSearch(item.value)}
                          className="flex w-full items-center justify-between border-b border-[#F0F0F0] px-4 py-3 text-right last:border-b-0 hover:bg-[#FAFAFA]"
                        >
                          <span className="truncate text-[10px] font-medium text-[#0E0E0E]">{item.value}</span>
                          <span className="text-[7px] text-[#A0A0A0]">{item.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </form>
              ) : (
                <button onClick={() => setDesktopSearchOpen(true)} aria-label="بحث" className="flex h-10 w-10 items-center justify-center text-[#0E0E0E]">
                  <MagnifyingGlass size={18} />
                </button>
              )}
            </div>

            <button onClick={() => setMobileSearchOpen((value) => !value)} aria-label="بحث" className="flex h-10 w-10 items-center justify-center text-[#0E0E0E] md:hidden">
              <MagnifyingGlass size={19} />
            </button>

            <Link to="/favorites" aria-label="المفضلة" className="relative hidden h-10 w-10 items-center justify-center text-[#0E0E0E] md:flex">
              <Heart size={18} />
              {favorites.length > 0 && <span className="absolute left-0 top-0 h-2 w-2 bg-[#A9D8D3]" />}
            </Link>

            <button onClick={openCart} aria-label="السلة" className="relative flex h-10 w-10 items-center justify-center text-[#0E0E0E]">
              <ShoppingBag size={19} />
              {cartCount > 0 && (
                <span className="absolute -left-1 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center bg-[#0E0E0E] px-1 text-[8px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="hidden h-10 items-center gap-1 px-2 text-[9px] font-semibold text-[#555] lg:flex">
                  <Globe size={15} /> {short}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-52 border-[#EAEAEA] bg-white">
                {currencies.map((currency) => (
                  <DropdownMenuItem
                    key={currency.code}
                    onClick={() => setMode(currency.code as typeof mode)}
                    className="flex cursor-pointer items-center justify-between text-[11px]"
                  >
                    <span>{currency.meta.label}</span>
                    {mode === currency.code && <span className="h-2 w-2 bg-[#A9D8D3]" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            <Link to={customer ? "/account" : "/auth"} aria-label={customer ? "حسابي" : "تسجيل الدخول"} className="hidden h-10 w-10 items-center justify-center text-[#0E0E0E] md:flex">
              <User size={18} />
            </Link>
          </div>
        </div>

        {mobileSearchOpen && (
          <div className="border-t border-[#EAEAEA] bg-white px-4 py-3 md:hidden">
            <form
              onSubmit={(event) => {
                event.preventDefault();
                submitSearch();
              }}
              className="relative"
            >
              <MagnifyingGlass size={16} className="absolute right-0 top-1/2 -translate-y-1/2 text-[#777]" />
              <input
                autoFocus
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="ابحث عن منتج أو ماركة أو قسم"
                className="h-10 w-full border-b border-[#DADADA] bg-transparent pr-7 pl-8 text-[12px] outline-none focus:border-[#A9D8D3]"
              />
              <button type="button" onClick={() => { setMobileSearchOpen(false); setSearchTerm(""); }} className="absolute left-0 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#777]">
                <X size={14} />
              </button>
            </form>

            {suggestions.length > 0 && (
              <div className="mt-2 border border-[#EAEAEA]">
                {suggestions.slice(0, 5).map((item) => (
                  <button
                    key={`${item.type}-${item.value}`}
                    type="button"
                    onClick={() => submitSearch(item.value)}
                    className="flex w-full items-center justify-between border-b border-[#F0F0F0] px-3 py-3 text-right last:border-b-0"
                  >
                    <span className="truncate text-[11px] font-medium">{item.value}</span>
                    <span className="text-[7px] text-[#999]">{item.type}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </header>

      <div aria-hidden="true" className={mobileSearchOpen ? "h-[105px] md:h-[76px]" : "h-14 md:h-[76px]"} />
    </>
  );
};

export default Navbar;

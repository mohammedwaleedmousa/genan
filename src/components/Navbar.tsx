import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Globe,
  Heart,
  List,
  MagnifyingGlass,
  ShoppingBag,
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

  const { openCart, getCartCount, customer } = useStore();
  const favorites = useFavorites((state) => state.favorites);
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
      .slice(0, 6);
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

  const isActive = (to: string) =>
    location.pathname === to || (to === "/products" && location.pathname.startsWith("/product/"));

  return (
    <>
      <header dir="rtl" className="fixed inset-x-0 top-0 z-50 border-b border-[#EEEAE2] bg-white/95 backdrop-blur-xl">
        {/* Mobile navbar */}
        <div className="md:hidden">
          <div className="flex h-16 items-center justify-between px-4">
            <Link to="/home" aria-label="الرئيسية" className="flex items-center">
              <Logo size="md" />
            </Link>

            <div className="flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => setMobileSearchOpen((value) => !value)}
                aria-label="بحث"
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#222] transition-colors hover:bg-[#F7F5F1]"
              >
                <MagnifyingGlass size={19} />
              </button>

              <button
                type="button"
                onClick={openCart}
                aria-label="السلة"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#222] transition-colors hover:bg-[#F7F5F1]"
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span className="absolute left-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B99A63] px-1 text-[8px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    aria-label="فتح القائمة"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#222] transition-colors hover:bg-[#F7F5F1]"
                  >
                    <List size={21} />
                  </button>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  dir="rtl"
                  className="w-[86vw] max-w-[340px] border-l border-[#EEEAE2] bg-[#FFFEFC] p-0 shadow-[-18px_0_45px_rgba(20,20,20,.08)]"
                >
                  <div className="flex h-[72px] items-center justify-between border-b border-[#F0EDE7] px-5">
                    <Logo size="md" />

                    <button
                      type="button"
                      onClick={() => setMenuOpen(false)}
                      aria-label="إغلاق القائمة"
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F6F3ED] text-[#555] transition-colors hover:bg-[#EEE9E0] hover:text-[#111]"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="flex h-[calc(100dvh-72px)] flex-col">
                    <div className="px-5 pb-4 pt-5">
                      <form
                        onSubmit={(event) => {
                          event.preventDefault();
                          submitSearch();
                        }}
                        className="relative"
                      >
                        <MagnifyingGlass
                          size={17}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8D887F]"
                        />
                        <input
                          value={searchTerm}
                          onChange={(event) => setSearchTerm(event.target.value)}
                          placeholder="ابحث في جنان"
                          className="h-12 w-full rounded-xl border border-[#E9E4DB] bg-white pr-11 pl-4 text-[12px] outline-none transition-colors placeholder:text-[#AAA49A] focus:border-[#CDB98F]"
                        />
                      </form>

                      {suggestions.length > 0 && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-[#EEEAE2] bg-white">
                          {suggestions.slice(0, 4).map((item) => (
                            <button
                              key={`sidebar-${item.type}-${item.value}`}
                              type="button"
                              onClick={() => submitSearch(item.value)}
                              className="flex w-full items-center justify-between border-b border-[#F3F0EA] px-4 py-3 text-right last:border-b-0 hover:bg-[#FAF8F4]"
                            >
                              <span className="truncate text-[11px] font-medium text-[#333]">{item.value}</span>
                              <span className="text-[8px] text-[#A39D93]">{item.type}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-3">
                      <nav aria-label="القائمة الرئيسية" className="space-y-1">
                        {navLinks.map((item) => {
                          const active = isActive(item.to);

                          return (
                            <SheetClose asChild key={item.to}>
                              <Link
                                to={item.to}
                                className={`flex h-12 items-center rounded-xl px-4 text-[12px] transition-colors ${
                                  active
                                    ? "bg-[#F3EFE6] font-semibold text-[#171717]"
                                    : "font-medium text-[#66615A] hover:bg-[#F8F6F2] hover:text-[#171717]"
                                }`}
                              >
                                {item.label}
                              </Link>
                            </SheetClose>
                          );
                        })}
                      </nav>

                      <div className="my-5 h-px bg-[#EFECE6]" />

                      <div className="space-y-1">
                        <SheetClose asChild>
                          <Link
                            to={customer ? "/account" : "/auth"}
                            className="flex h-11 items-center gap-3 rounded-xl px-4 text-[11px] font-medium text-[#5E5952] transition-colors hover:bg-[#F8F6F2] hover:text-[#171717]"
                          >
                            <User size={17} />
                            {customer ? "حسابي" : "تسجيل الدخول"}
                          </Link>
                        </SheetClose>

                        <SheetClose asChild>
                          <Link
                            to="/favorites"
                            className="flex h-11 items-center justify-between rounded-xl px-4 text-[11px] font-medium text-[#5E5952] transition-colors hover:bg-[#F8F6F2] hover:text-[#171717]"
                          >
                            <span className="flex items-center gap-3">
                              <Heart size={17} />
                              المفضلة
                            </span>
                            {favorites.length > 0 && (
                              <span className="text-[9px] font-semibold text-[#A18451]">{favorites.length}</span>
                            )}
                          </Link>
                        </SheetClose>

                        <button
                          type="button"
                          onClick={() => {
                            openCart();
                            setMenuOpen(false);
                          }}
                          className="flex h-11 w-full items-center justify-between rounded-xl px-4 text-[11px] font-medium text-[#5E5952] transition-colors hover:bg-[#F8F6F2] hover:text-[#171717]"
                        >
                          <span className="flex items-center gap-3">
                            <ShoppingBag size={17} />
                            السلة
                          </span>
                          {cartCount > 0 && (
                            <span className="text-[9px] font-semibold text-[#A18451]">{cartCount > 99 ? "99+" : cartCount}</span>
                          )}
                        </button>
                      </div>
                    </div>

                    <div className="border-t border-[#EFECE6] px-5 py-4">
                      <p className="mb-3 text-[9px] font-medium text-[#999188]">العملة</p>
                      <div className="grid grid-cols-3 gap-2">
                        {currencies.map((currency) => {
                          const activeCurrency = mode === currency.code;

                          return (
                            <button
                              key={currency.code}
                              type="button"
                              onClick={() => setMode(currency.code as typeof mode)}
                              className={`h-9 rounded-lg border text-[9px] font-medium transition-colors ${
                                activeCurrency
                                  ? "border-[#CDB98F] bg-[#F6F1E7] text-[#2A2723]"
                                  : "border-[#EDE9E2] bg-white text-[#77716A] hover:bg-[#F8F6F2]"
                              }`}
                            >
                              {currency.meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>

          {mobileSearchOpen && (
            <div className="border-t border-[#F0EDE7] bg-[#FFFEFC] px-4 py-3">
              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  submitSearch();
                }}
                className="relative"
              >
                <MagnifyingGlass
                  size={17}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#8D887F]"
                />
                <input
                  autoFocus
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="ابحث في جنان"
                  className="h-11 w-full rounded-xl border border-[#E9E4DB] bg-white pr-11 pl-10 text-[12px] outline-none focus:border-[#CDB98F]"
                />
                <button
                  type="button"
                  onClick={() => {
                    setMobileSearchOpen(false);
                    setSearchTerm("");
                  }}
                  className="absolute left-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-[#8D887F]"
                >
                  <X size={14} />
                </button>
              </form>

              {suggestions.length > 0 && (
                <div className="mt-2 overflow-hidden rounded-xl border border-[#EEEAE2] bg-white">
                  {suggestions.slice(0, 4).map((item) => (
                    <button
                      key={`mobile-${item.type}-${item.value}`}
                      type="button"
                      onClick={() => submitSearch(item.value)}
                      className="flex w-full items-center justify-between border-b border-[#F3F0EA] px-4 py-3 text-right last:border-b-0"
                    >
                      <span className="truncate text-[11px] font-medium text-[#333]">{item.value}</span>
                      <span className="text-[8px] text-[#A39D93]">{item.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Desktop navbar */}
        <div className="hidden md:block">
          <div className="mx-auto flex h-[72px] max-w-[1600px] items-center px-6 lg:px-10 xl:px-14">
            <Link to="/home" aria-label="الرئيسية" className="flex min-w-[150px] items-center">
              <Logo size="lg" />
            </Link>

            <nav className="flex flex-1 items-center justify-center gap-7 lg:gap-10">
              {navLinks.map((item) => {
                const active = isActive(item.to);

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`relative flex h-[72px] items-center text-[11px] font-medium transition-colors ${
                      active ? "text-[#161616]" : "text-[#6F6A63] hover:text-[#161616]"
                    }`}
                  >
                    {item.label}
                    {active && (
                      <span className="absolute bottom-0 right-0 h-[2px] w-full rounded-full bg-[#B99A63]" />
                    )}
                  </Link>
                );
              })}
            </nav>

            <div className="flex min-w-[230px] items-center justify-end gap-1">
              <div className="relative">
                {desktopSearchOpen ? (
                  <form
                    onSubmit={(event) => {
                      event.preventDefault();
                      submitSearch();
                    }}
                    className="relative flex h-10 w-[220px] items-center rounded-full border border-[#E8E3DB] bg-[#FAF8F4] px-3"
                  >
                    <MagnifyingGlass size={16} className="shrink-0 text-[#7C766E]" />
                    <input
                      autoFocus
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="ابحث في جنان"
                      className="h-full min-w-0 flex-1 bg-transparent px-2 text-[11px] outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setDesktopSearchOpen(false);
                        setSearchTerm("");
                      }}
                      className="flex h-7 w-7 items-center justify-center text-[#807A72]"
                    >
                      <X size={13} />
                    </button>

                    {suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-12 overflow-hidden rounded-xl border border-[#EEEAE2] bg-white shadow-[0_16px_40px_rgba(20,20,20,.09)]">
                        {suggestions.map((item) => (
                          <button
                            key={`desktop-${item.type}-${item.value}`}
                            type="button"
                            onClick={() => submitSearch(item.value)}
                            className="flex w-full items-center justify-between border-b border-[#F3F0EA] px-4 py-3 text-right last:border-b-0 hover:bg-[#FAF8F4]"
                          >
                            <span className="truncate text-[10px] font-medium text-[#292929]">{item.value}</span>
                            <span className="text-[8px] text-[#A39D93]">{item.type}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDesktopSearchOpen(true)}
                    aria-label="بحث"
                    className="flex h-10 w-10 items-center justify-center rounded-full text-[#252525] transition-colors hover:bg-[#F6F3ED]"
                  >
                    <MagnifyingGlass size={18} />
                  </button>
                )}
              </div>

              <Link
                to="/favorites"
                aria-label="المفضلة"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#252525] transition-colors hover:bg-[#F6F3ED]"
              >
                <Heart size={18} />
                {favorites.length > 0 && (
                  <span className="absolute left-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-[#B99A63]" />
                )}
              </Link>

              <button
                type="button"
                onClick={openCart}
                aria-label="السلة"
                className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#252525] transition-colors hover:bg-[#F6F3ED]"
              >
                <ShoppingBag size={18} />
                {cartCount > 0 && (
                  <span className="absolute -left-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#B99A63] px-1 text-[8px] font-bold text-white">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label="اختيار العملة"
                    className="hidden h-10 items-center gap-1.5 rounded-full px-3 text-[9px] font-medium text-[#625D56] transition-colors hover:bg-[#F6F3ED] lg:flex"
                  >
                    <Globe size={15} />
                    {short}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 rounded-xl border-[#EAE5DD] bg-white p-1.5">
                  {currencies.map((currency) => (
                    <DropdownMenuItem
                      key={currency.code}
                      onClick={() => setMode(currency.code as typeof mode)}
                      className="flex cursor-pointer items-center justify-between rounded-lg px-3 py-2 text-[10px]"
                    >
                      <span>{currency.meta.label}</span>
                      {mode === currency.code && <span className="h-1.5 w-1.5 rounded-full bg-[#B99A63]" />}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link
                to={customer ? "/account" : "/auth"}
                aria-label={customer ? "حسابي" : "تسجيل الدخول"}
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#252525] transition-colors hover:bg-[#F6F3ED]"
              >
                <User size={18} />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div
        aria-hidden="true"
        className={mobileSearchOpen ? "h-[125px] md:h-[72px]" : "h-16 md:h-[72px]"}
      />
    </>
  );
};

export default Navbar;

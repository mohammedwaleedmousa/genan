import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2, LockKeyhole, MapPin, Phone, UserRound } from "lucide-react";

import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { clearCustomerSession, setCustomerSession } from "@/lib/customerSession";

type AuthMode = "login" | "register" | "recovery";

type CustomerRow = {
  id: string;
  user_id?: string | null;
  name: string;
  phone: string;
  country?: string | null;
  region?: string | null;
  avatar_url?: string | null;
  created_at?: string;
};

const PHONE_COUNTRIES = [
  { iso: "YE", name: "اليمن", dial: "+967", flag: "🇾🇪", placeholder: "77xxxxxxx" },
  { iso: "SA", name: "السعودية", dial: "+966", flag: "🇸🇦", placeholder: "5xxxxxxxx" },
  { iso: "AE", name: "الإمارات", dial: "+971", flag: "🇦🇪", placeholder: "5xxxxxxxx" },
  { iso: "OM", name: "عُمان", dial: "+968", flag: "🇴🇲", placeholder: "9xxxxxxx" },
  { iso: "QA", name: "قطر", dial: "+974", flag: "🇶🇦", placeholder: "xxxxxxxx" },
  { iso: "KW", name: "الكويت", dial: "+965", flag: "🇰🇼", placeholder: "xxxxxxxx" },
  { iso: "BH", name: "البحرين", dial: "+973", flag: "🇧🇭", placeholder: "xxxxxxxx" },
  { iso: "EG", name: "مصر", dial: "+20", flag: "🇪🇬", placeholder: "1xxxxxxxxx" },
  { iso: "JO", name: "الأردن", dial: "+962", flag: "🇯🇴", placeholder: "7xxxxxxxx" },
  { iso: "US", name: "أمريكا / كندا", dial: "+1", flag: "🇺🇸", placeholder: "xxxxxxxxxx" },
  { iso: "MY", name: "ماليزيا", dial: "+60", flag: "🇲🇾", placeholder: "1xxxxxxxxx" },
  { iso: "GB", name: "بريطانيا", dial: "+44", flag: "🇬🇧", placeholder: "7xxxxxxxxx" },
  { iso: "DE", name: "ألمانيا", dial: "+49", flag: "🇩🇪", placeholder: "xxxxxxxxxx" },
  { iso: "NL", name: "هولندا", dial: "+31", flag: "🇳🇱", placeholder: "6xxxxxxxx" },
  { iso: "TR", name: "تركيا", dial: "+90", flag: "🇹🇷", placeholder: "5xxxxxxxxx" },
  { iso: "IN", name: "الهند", dial: "+91", flag: "🇮🇳", placeholder: "xxxxxxxxxx" },
  { iso: "PK", name: "باكستان", dial: "+92", flag: "🇵🇰", placeholder: "3xxxxxxxxx" },
  { iso: "ID", name: "إندونيسيا", dial: "+62", flag: "🇮🇩", placeholder: "8xxxxxxxxxx" },
  { iso: "CN", name: "الصين", dial: "+86", flag: "🇨🇳", placeholder: "1xxxxxxxxxx" },
] as const;

type PhoneCountryCode = (typeof PHONE_COUNTRIES)[number]["iso"];

const arabicDigitsToLatin = (value: string) =>
  value
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));

const defaultRegionForCountry = (country: string) => (country === "YE" ? "عدن" : "غير محدد");

const CustomerAuthPage = () => {
  const navigate = useNavigate();
  const { setCustomer, setRegion } = useStore();

  const [mode, setMode] = useState<AuthMode>("login");
  const [phoneCountry, setPhoneCountry] = useState<PhoneCountryCode>("YE");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGuestLoading, setIsGuestLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", password: "", region: "عدن" });

  const selectedPhoneCountry = useMemo(
    () => PHONE_COUNTRIES.find((country) => country.iso === phoneCountry) || PHONE_COUNTRIES[0],
    [phoneCountry],
  );

  const updateField = (field: keyof typeof formData, value: string) => {
    setFormData((previous) => ({ ...previous, [field]: value }));
  };

  const buildPhone = () => {
    let digits = arabicDigitsToLatin(formData.phone).replace(/\D/g, "");

    if (!digits) throw new Error("أدخل رقم الهاتف.");

    const dialDigits = selectedPhoneCountry.dial.replace(/\D/g, "");

    // الحقل مخصص للرقم المحلي فقط. إذا لصق العميل رمز الدولة نحذفه حتى لا يتكرر.
    digits = digits.replace(/^00+/, "");
    if (digits.startsWith(dialDigits) && digits.length > dialDigits.length + 6) {
      digits = digits.slice(dialDigits.length);
    }

    // إزالة الصفر المحلي: 077... => 77... / 05... => 5...
    digits = digits.replace(/^0+/, "");

    const fullPhone = `${selectedPhoneCountry.dial}${digits}`;
    if (!/^\+[1-9]\d{7,14}$/.test(fullPhone)) {
      throw new Error("رقم الهاتف غير صحيح لهذه الدولة.");
    }

    return fullPhone;
  };

  const persistCustomer = (raw: CustomerRow) => {
    const country = raw.country || phoneCountry;
    const region = raw.region || defaultRegionForCountry(country);

    setCustomer({ id: raw.id, name: raw.name, phone: raw.phone, region });
    setRegion(region);
    setCustomerSession({
      id: raw.id,
      user_id: raw.user_id || undefined,
      name: raw.name,
      phone: raw.phone,
      region,
      country,
      avatar_url: raw.avatar_url || null,
    });

    return { ...raw, country, region };
  };

  const getOwnCustomer = async (userId: string) => {
    const { data, error } = await (supabase as any)
      .from("customers")
      .select("id,user_id,name,phone,country,region,avatar_url,created_at")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return data as CustomerRow | null;
  };

  const finalizeRegistration = async (body: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("customer-registration-finalize", { body });
    if (error) throw error;
    if (!data?.customer) throw new Error(data?.error || "تعذر إنشاء ملف العميل");
    return data.customer as CustomerRow;
  };

  useEffect(() => {
    let active = true;

    const restore = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active || !session?.user) return;

      try {
        const customer = await getOwnCustomer(session.user.id);
        if (!active || !customer) return;
        persistCustomer(customer);
        navigate("/home", { replace: true });
      } catch {
        // نبقي صفحة الدخول مفتوحة إذا كانت الجلسة ناقصة.
      }
    };

    void restore();
    return () => { active = false; };
  }, [navigate]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = formData.name.trim();
    const password = formData.password;
    const selectedRegion = formData.region.trim();

    if (!formData.phone.trim()) {
      toast({ title: "رقم الهاتف مطلوب", description: "أدخل رقم الهاتف المحلي بدون رمز الدولة.", variant: "destructive" });
      return;
    }

    if (!password) {
      toast({ title: "كلمة المرور مطلوبة", description: "أدخل كلمة المرور.", variant: "destructive" });
      return;
    }
    if (mode === "register" && (password.length < 8 || password.length > 72)) {
      toast({ title: "كلمة المرور غير مناسبة", description: "استخدم كلمة مرور من 8 إلى 72 حرفاً.", variant: "destructive" });
      return;
    }

    if (mode === "register" && (!name || !selectedRegion)) {
      toast({ title: "البيانات غير مكتملة", description: "أدخل الاسم والمنطقة.", variant: "destructive" });
      return;
    }

    let phone = "";
    try {
      phone = buildPhone();
    } catch (error: any) {
      toast({ title: "رقم الهاتف غير صحيح", description: error?.message || "تحقق من الرقم.", variant: "destructive" });
      return;
    }

    setIsLoading(true);

    try {
      // لا نلغي جلسات الهاتف الآخر عند تبديل الحساب على هذا الجهاز.
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);

      if (mode === "register") {
        const country = phoneCountry;
        const region = selectedRegion || defaultRegionForCountry(country);

        const { data: registration, error: registrationError } = await supabase.functions.invoke("genan-password-register", {
          body: { name, phone, password, region, country },
        });
        if (registrationError || !registration?.ok) {
          throw new Error(registration?.error || "تعذر إنشاء الحساب. حاول مجددًا.");
        }
        const email = phone.slice(1) + "@accounts.genan.invalid";
        const { data: loginResult, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
        if (loginError || !loginResult.user) throw new Error("تم إنشاء الحساب، ولكن تعذر تسجيل الدخول. حاول تسجيل الدخول مرة أخرى.");
        const customer = await getOwnCustomer(loginResult.user.id);
        if (!customer) throw new Error("تم إنشاء الحساب ولكن تعذر تحميل الملف الشخصي.");
        persistCustomer(customer);
        toast({ title: "تم إنشاء الحساب", description: `أهلاً ${customer.name}` });
        navigate("/home", { replace: true });
        return;
      }

      const email = phone.slice(1) + "@accounts.genan.invalid";
      let { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({ email, password });
      // Preserve access for customers created with the original phone-password flow.
      if (loginError || !loginData.user) {
        const legacy = await supabase.auth.signInWithPassword({ phone, password });
        loginData = legacy.data;
        loginError = legacy.error;
      }
      if (loginError || !loginData.user) {
        throw new Error("رقم الهاتف أو كلمة المرور غير صحيحة");
      }

      let customer = await getOwnCustomer(loginData.user.id);
      if (!customer) {
        const country = phoneCountry;
        customer = await finalizeRegistration({
          name: "عميل جنان",
          phone,
          region: defaultRegionForCountry(country),
          country,
          channel: "none",
        });
      }

      persistCustomer(customer);
      toast({ title: "مرحباً بعودتك", description: `أهلاً ${customer.name}` });
      navigate("/home", { replace: true });
    } catch (error: any) {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);

      const message = String(error?.message || "تعذر المتابعة.");
      const lower = message.toLowerCase();
      let friendly = message;

      if (lower.includes("already registered") || lower.includes("user already") || lower.includes("already exists")) {
        friendly = "رقم الهاتف مسجل مسبقاً. اختر تسجيل الدخول واستخدم نفس الرقم وكلمة المرور.";
      } else if (lower.includes("invalid login credentials")) {
        friendly = "رقم الهاتف أو كلمة المرور غير صحيحة.";
      }

      toast({ title: "تعذر المتابعة", description: friendly, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGuest = async () => {
    setIsGuestLoading(true);
    try {
      await supabase.auth.signOut({ scope: "local" }).catch(() => undefined);
      clearCustomerSession();
      setCustomer({ id: "guest", name: "ضيف", phone: "", region: "عدن" });
      setRegion("عدن");
      navigate("/home");
    } finally {
      setIsGuestLoading(false);
    }
  };

  const changeMode = (nextMode: AuthMode) => {
    if (isLoading) return;
    setMode(nextMode);
    setShowPassword(false);
    if (nextMode === "register" && phoneCountry === "YE" && !formData.region) updateField("region", "عدن");
  };

  return (
    <main className="min-h-[100svh] bg-[#FAF9F7] text-[#171717]" dir="rtl">
      <div className="mx-auto flex min-h-[100svh] w-full max-w-[560px] flex-col px-3 pb-7 pt-7 sm:px-6 md:justify-center md:py-10">
        <div className="flex justify-center">
          <button type="button" onClick={() => navigate("/home")} aria-label="العودة إلى المتجر" className="flex h-[72px] w-[72px] items-center justify-center">
            <img src="/icons/app-icon-1024.png" alt="Genan" width={78} height={78} fetchPriority="high" className="h-[78px] w-[78px] object-contain" />
          </button>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2.5">
          <span className="h-px w-5 bg-[#C6B17F]" />
          <span className="font-serif text-[8px] tracking-[0.26em] text-[#D8C29A]">GENAN</span>
          <span className="h-px w-5 bg-[#C6B17F]" />
        </div>

        <section className="mt-6 overflow-hidden rounded-3xl bg-white p-5 shadow-[0_12px_38px_rgba(25,20,12,0.06)] sm:p-8">
          <div className="rounded-2xl bg-[#F6F3EA] px-5 py-6 text-center">
            <span className="text-[9px] font-semibold tracking-[0.22em] text-[#9A825B]">GENAN / YOUR ACCOUNT</span>
            <h1 className="mt-2 text-[25px] font-semibold tracking-[-0.035em] text-[#171717] sm:text-[30px]">
              {mode === "login" ? "أهلًا بعودتك" : mode === "register" ? "انضمي إلى جنان" : "استعادة حسابك"}
            </h1>
            <p className="mx-auto mt-2 max-w-[350px] text-[10px] leading-5 text-[#958883] sm:text-[11px] sm:leading-6">
              {mode === "login"
                ? "اختياراتك المفضلة وطلباتك كلها في مكان واحد."
                : mode === "register" ? "حساب واحد لتجربة تسوق أكثر سهولة." : "نساعدك على استعادة الوصول لحسابك بطريقة آمنة."}
            </p>
          </div>

          <div className="mt-6 grid grid-cols-2 rounded-2xl bg-[#F6F3EA] p-1">
            <button type="button" onClick={() => changeMode("login")} className={`h-[44px] rounded-xl text-[12px] font-semibold ${mode === "login" ? "bg-white text-[#443936] shadow-[0_1px_4px_rgba(49,39,35,0.06)]" : "text-[#9F928D]"}`}>
              تسجيل الدخول
            </button>
            <button type="button" onClick={() => changeMode("register")} className={`h-[42px] rounded-[10px] text-[11px] font-medium ${mode === "register" ? "bg-white text-[#443936] shadow-[0_1px_4px_rgba(49,39,35,0.06)]" : "text-[#9F928D]"}`}>
              حساب جديد
            </button>
          </div>

          {mode === "recovery" ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-[#E8DDCB] bg-[#FCFAF6] p-5">
                <LockKeyhole className="mb-3 h-6 w-6 text-[#9A825B]" strokeWidth={1.5} />
                <h2 className="text-[15px] font-semibold text-[#171717]">حماية حسابك أولًا</h2>
                <p className="mt-2 text-[12px] leading-7 text-[#77716A]">لأن رقم الهاتف غير موثّق حاليًا برسالة تحقق، لا يمكن تغيير كلمة المرور بمجرد إدخال الرقم. تواصلي مع إدارة المتجر للتحقق من ملكية الحساب ومساعدتك.</p>
              </div>
              <button type="button" onClick={() => navigate("/store-info")} className="flex h-12 w-full items-center justify-center rounded-2xl bg-[#171717] text-[12px] font-semibold text-white">معلومات التواصل مع المتجر</button>
              <button type="button" onClick={() => changeMode("login")} className="flex h-11 w-full items-center justify-center rounded-2xl border border-[#E5DED0] bg-white text-[12px] font-medium text-[#5F5A53]">العودة لتسجيل الدخول</button>
            </div>
          ) : <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            {mode === "register" && (
              <div>
                <label htmlFor="auth-name" className="mb-1.5 block px-1 text-[9px] font-medium text-[#746761]">الاسم الكامل</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A99D98]" strokeWidth={1.5} />
                  <input id="auth-name" value={formData.name} onChange={(event) => updateField("name", event.target.value)} autoComplete="name" placeholder="أدخل اسمك الكامل" className="h-[50px] w-full rounded-2xl border border-[#E8DEDA] bg-[#FCFAF7] pr-11 pl-4 text-[12px] text-[#443936] outline-none focus:border-[#D8C29A]" />
                </div>
              </div>
            )}

            {mode === "register" && (
              <div>
                <label htmlFor="auth-region" className="mb-1.5 block px-1 text-[9px] font-medium text-[#746761]">المدينة / المنطقة</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A99D98]" strokeWidth={1.5} />
                  <input id="auth-region" value={formData.region} onChange={(event) => updateField("region", event.target.value)} autoComplete="address-level2" placeholder="مثال: عدن، الرياض" className="h-[50px] w-full rounded-[12px] border border-[#E8DEDA] bg-white pr-11 pl-4 text-[12px] text-[#443936] outline-none focus:border-[#D8C29A]" />
                </div>
              </div>
            )}

            <div>
              <label htmlFor="auth-phone" className="mb-1.5 block px-1 text-[9px] font-medium text-[#746761]">الدولة ورقم الهاتف</label>
              <div className="grid grid-cols-[150px_1fr] gap-2" dir="ltr">
                <select
                  aria-label="الدولة"
                  value={phoneCountry}
                  onChange={(event) => {
                    const next = event.target.value as PhoneCountryCode;
                    setPhoneCountry(next);
                    setFormData((previous) => ({
                      ...previous,
                      phone: "",
                      region: next === "YE" && !previous.region
                        ? "عدن"
                        : next !== "YE" && previous.region === "عدن"
                          ? ""
                          : previous.region,
                    }));
                  }}
                  className="h-[50px] rounded-2xl border border-[#E8DEDA] bg-[#FCFAF7] px-2 text-[11px] text-[#443936] outline-none focus:border-[#D8C29A]"
                  dir="rtl"
                >
                  {PHONE_COUNTRIES.map((country) => (
                    <option key={country.iso} value={country.iso}>{country.flag} {country.name} {country.dial}</option>
                  ))}
                </select>

                <div className="relative">
                  <Phone className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A99D98]" strokeWidth={1.5} />
                  <input
                    id="auth-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={formData.phone}
                    onChange={(event) => updateField("phone", arabicDigitsToLatin(event.target.value).replace(/\D/g, "").slice(0, 15))}
                    placeholder={selectedPhoneCountry.placeholder}
                    dir="ltr"
                    className="h-[50px] w-full rounded-[12px] border border-[#E8DEDA] bg-white pr-11 pl-4 text-left text-[12px] text-[#443936] outline-none focus:border-[#D8C29A]"
                  />
                </div>
              </div>
              <p className="mt-1.5 px-1 text-[8px] leading-4 text-[#A19590]">
                رمز الدولة {selectedPhoneCountry.dial} يضاف تلقائياً. اكتب الرقم المحلي فقط، ويمكن كتابة الصفر الأول أو بدونه.
              </p>
            </div>

            <div>
              <label htmlFor="auth-password" className="mb-1.5 block px-1 text-[9px] font-medium text-[#746761]">كلمة المرور</label>
              <div className="relative">
                <LockKeyhole className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#A99D98]" strokeWidth={1.5} />
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                  value={formData.password}
                  onChange={(event) => updateField("password", event.target.value)}
                  placeholder={mode === "register" ? "8 أحرف على الأقل" : "كلمة المرور"}
                  dir="ltr"
                  className="h-[50px] w-full rounded-[12px] border border-[#E8DEDA] bg-white pr-11 pl-12 text-left text-[12px] text-[#443936] outline-none focus:border-[#D8C29A]"
                />
                <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"} className="absolute left-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[#A99D98]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="mt-2 flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl bg-[#171717] text-[13px] font-semibold text-white disabled:opacity-60">
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "login" ? "تسجيل الدخول" : "إنشاء الحساب"}
            </button>
            {mode === "login" && (
              <button type="button" onClick={() => changeMode("recovery")} className="block w-full py-2 text-left text-[12px] font-semibold text-[#8C6B32] hover:underline">نسيت كلمة المرور؟</button>
            )}
          </form>}

          <button type="button" onClick={handleGuest} disabled={isGuestLoading || isLoading} className="mt-3 flex h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-[#E8DEDA] bg-white text-[12px] font-medium text-[#746761] disabled:opacity-60">
            {isGuestLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            الدخول كضيف
          </button>
        </section>
      </div>
    </main>
  );
};

export default CustomerAuthPage;

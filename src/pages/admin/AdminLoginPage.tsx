import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, LogIn, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_BASE_PATH } from "@/lib/adminRoutes";

// Only an existing user with the server-side admin role may open the admin area.
// The route name is NOT an authorization mechanism.
const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isCurrentUserAdmin = async () => {
    const { data, error } = await supabase.rpc("is_current_user_admin");
    if (error) throw error;
    return data === true;
  };

  useEffect(() => {
    let active = true;
    const restore = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user || !active) return;
      try {
        if (await isCurrentUserAdmin() && active) navigate(ADMIN_BASE_PATH, { replace: true });
      } catch (error) {
        console.error("Could not restore Genan admin session", error);
      }
    };
    void restore();
    return () => { active = false; };
  }, [navigate]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const login = identifier.trim();
    if (!login || !password) {
      toast({ title: "بيانات غير مكتملة", description: "أدخل البريد أو رقم الهاتف وكلمة المرور.", variant: "destructive" });
      return;
    }

    // International format is required for phone accounts; +967 is assumed for
    // nine-digit Yemeni mobile numbers entered without the country prefix.
    const digits = login.replace(/[٠-٩]/g, d => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
      .replace(/[۰-۹]/g, d => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d))).replace(/[^\d+]/g, "");
    const phone = digits.startsWith("+") ? digits
      : /^0?7\d{8}$/.test(digits) ? "+967" + digits.replace(/^0/, "")
      : "+" + digits.replace(/^00/, "");
    if (!login.includes("@") && !/^\+[1-9]\d{7,14}$/.test(phone)) {
      toast({ title: "رقم غير صحيح", description: "اكتب رقم الهاتف مع رمز الدولة مثل +96777xxxxxxx.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const credentials = login.includes("@")
        ? { email: login.toLowerCase(), password }
        : { phone, password };
      const { error } = await supabase.auth.signInWithPassword(credentials);
      if (error) throw error;

      if (!(await isCurrentUserAdmin())) {
        // Never treat customer signup or an admin-looking URL as an admin role.
        await supabase.auth.signOut({ scope: "local" });
        throw new Error("هذا الحساب لا يملك صلاحية الإدارة.");
      }
      toast({ title: "مرحباً", description: "تم تسجيل دخول الإدارة بنجاح." });
      navigate(ADMIN_BASE_PATH, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "تعذر تسجيل الدخول.";
      const friendly = /invalid login credentials/i.test(message) ? "رقم الهاتف أو البريد أو كلمة المرور غير صحيحة." : message;
      toast({ title: "تعذر تسجيل الدخول", description: friendly, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#F7F6F2] text-[#243228]" dir="rtl">
      <div className="grid min-h-[100dvh] lg:grid-cols-[minmax(0,1fr)_minmax(0,.85fr)]">
        <section className="flex min-h-[100dvh] flex-col justify-between px-6 py-8 sm:px-12 lg:min-h-[100dvh] lg:px-[clamp(42px,6vw,110px)] lg:py-12">
          <div className="flex items-center justify-between gap-4 border-b border-[#CFC4B4] pb-6">
            <div className="flex items-center gap-3">
              <span className="h-8 w-[2px] bg-[#9B7B4F]" />
              <div>
                <span className="block text-[12px] font-bold tracking-[.22em] text-[#293D31]" dir="ltr">GENAN STUDIO</span>
                <span className="mt-1 block text-[11px] text-[#7C7C6D]">منطقة الإدارة</span>
              </div>
            </div>
            <a href="/home" className="text-[12px] font-semibold text-[#5A6658] underline underline-offset-4 hover:text-[#896E4B]">العودة للمتجر</a>
          </div>

          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="mx-auto w-full max-w-[460px] py-16">
            <div className="mb-9">
              <span className="text-[11px] font-semibold tracking-[.08em] text-[#8C7149]">مساحة خاصة بمديري المتجر</span>
              <h1 className="mt-4 text-[35px] font-semibold leading-[1.2] text-[#202F25] sm:text-[44px]">مرحبًا بعودتك.</h1>
              <p className="mt-4 max-w-sm text-[13px] leading-7 text-[#667063]">ادخل إلى مكتب إدارة جنان لمتابعة المنتجات والطلبات والعملاء.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="admin-identifier" className="mb-2 block text-[12px] font-semibold text-[#3A493C]">البريد الإلكتروني أو رقم الهاتف</label>
                <div className="relative">
                  <UserRound className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#806C4D]" />
                  <Input id="admin-identifier" type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                    autoComplete="username" placeholder="البريد الإلكتروني أو +967..." dir="ltr"
                    className="h-[54px] rounded-[16px] border border-[#DFD6C9] bg-[#FAF9F5] pr-12 text-[14px] text-[#26352B] shadow-none focus-visible:border-[#896D46] focus-visible:ring-1 focus-visible:ring-[#896D46]" />
                </div>
              </div>
              <div>
                <label htmlFor="admin-password" className="mb-2 block text-[12px] font-semibold text-[#3A493C]">كلمة المرور</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#806C4D]" />
                  <Input id="admin-password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                    autoComplete="current-password" className="h-[54px] rounded-[16px] border border-[#DFD6C9] bg-[#FAF9F5] pr-12 text-[14px] text-[#26352B] shadow-none focus-visible:border-[#896D46] focus-visible:ring-1 focus-visible:ring-[#896D46]" />
                </div>
              </div>
              <Button type="submit" disabled={isLoading} className="flex min-h-[54px] w-full items-center justify-center gap-3 rounded-[16px] bg-[#25382D] px-5 text-[14px] font-semibold text-white shadow-[0_10px_22px_rgba(33,53,39,.12)] transition-colors hover:bg-[#3F5343]">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><LogIn className="h-5 w-5" />دخول لوحة الإدارة</>}
              </Button>
            </form>
            <p className="mt-7 text-[11px] leading-6 text-[#70786B]">هذه المساحة مخصصة للحسابات التي لديها صلاحيات الإدارة فقط.</p>
          </motion.div>
          <div className="border-t border-[#CFC4B4] pt-5 text-[11px] tracking-[.14em] text-[#97846B]" dir="ltr">GENAN BOUTIQUE · MANAGEMENT</div>
        </section>
        <aside className="relative m-4 hidden min-h-[calc(100dvh-32px)] flex-col justify-between overflow-hidden rounded-[32px] bg-[#263C30] p-12 text-[#F5ECE0] shadow-[0_14px_45px_rgba(39,46,32,.12)] lg:flex">
          <div className="absolute -bottom-20 -left-24 h-[530px] w-[530px] rounded-full border border-[#D2BC95]/20" aria-hidden="true" />
          <div className="absolute bottom-10 left-10 h-[380px] w-[380px] rounded-full border border-[#D2BC95]/15" aria-hidden="true" />
          <div className="relative flex items-center justify-between border-b border-[#9EA48C]/30 pb-6">
            <span className="font-serif text-[28px] tracking-[.17em] text-[#F1E6D4]" dir="ltr">GENAN</span>
            <span className="text-[10px] tracking-[.2em] text-[#D3B98D]" dir="ltr">THE ATELIER</span>
          </div>
          <div className="relative">
            <span className="font-serif text-[clamp(125px,17vw,300px)] leading-none tracking-[-.09em] text-[#CBB184]" dir="ltr">G.</span>
            <div className="mb-8 mt-4 h-[1px] w-20 bg-[#CBB184]" />
            <h2 className="max-w-md text-[34px] font-normal leading-[1.5] text-[#F0E9DF]">تفاصيل دقيقة.<br />إدارة أكثر هدوءًا.</h2>
            <p className="mt-5 max-w-sm text-[14px] leading-8 text-[#BFCFC1]">مساحة عمل صُممت لتليق بهوية بوتيك جنان، وتُبقي ما يهمك قريبًا.</p>
          </div>
          <div className="relative border-t border-[#9EA48C]/30 pt-6 text-[11px] text-[#B6BFB4]" dir="ltr">CURATED COMMERCE · GENAN</div>
        </aside>
      </div>
    </main>
  );
};

export default AdminLoginPage;

import { useEffect, useState, type FormEvent } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Loader2, Lock, LogIn, UserRound } from "lucide-react";
import Logo from "@/components/Logo";
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
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7F6F2] p-5 sm:p-6" dir="rtl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="w-full max-w-[420px]">
        <div className="space-y-7 rounded-[24px] border border-[#E3D6C4] bg-white p-7 shadow-[0_24px_70px_rgba(29,38,28,.08)] sm:p-9">
          <div className="flex justify-center"><Logo size="xl" /></div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm">لوحة التحكم</p>
            <h1 className="mt-2 font-heading text-lg text-foreground">تسجيل دخول الأدمن</h1>
            <p className="mt-2 text-xs text-muted-foreground">برقم الهاتف أو البريد الإلكتروني وكلمة المرور، دون OTP.</p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="admin-identifier" className="block text-sm text-muted-foreground">البريد الإلكتروني أو رقم الهاتف</label>
              <div className="relative">
                <UserRound className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="admin-identifier" type="text" value={identifier} onChange={e => setIdentifier(e.target.value)}
                  autoComplete="username" placeholder="البريد أو +967..." dir="ltr"
                  className="bg-background/50 border-0 ring-1 ring-border/50 focus:ring-2 focus:ring-primary pr-10 rounded-xl h-12" />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-sm text-muted-foreground">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input id="admin-password" type="password" value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="bg-background/50 border-0 ring-1 ring-border/50 focus:ring-2 focus:ring-primary pr-10 rounded-xl h-12" />
              </div>
            </div>
            <Button type="submit" disabled={isLoading} className="w-full rounded-xl bg-[#24382D] py-6 text-base font-semibold text-white hover:bg-[#364B3C]">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5 ml-2" />دخول</>}
            </Button>
          </form>
          <p className="text-center text-muted-foreground text-xs">الدخول متاح فقط للحسابات التي لديها صلاحية الإدارة في قاعدة البيانات.</p>
        </div>
        <div className="text-center mt-6">
          <a href="/home" className="text-muted-foreground hover:text-primary text-sm transition-colors">العودة للمتجر</a>
        </div>
      </motion.div>
    </main>
  );
};

export default AdminLoginPage;

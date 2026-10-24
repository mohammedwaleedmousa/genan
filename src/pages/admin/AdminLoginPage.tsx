import { useEffect, useState, type FormEvent } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ADMIN_BASE_PATH } from '@/lib/adminRoutes';
import { Lock, Mail, Loader2, LogIn } from 'lucide-react';
import Logo from '@/components/Logo';

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // The server checks the admin role; never authorize from a URL or user metadata.
  const isCurrentUserAdmin = async () => {
    const { data, error } = await supabase.rpc('is_current_user_admin');
    if (error) throw error;
    return data === true;
  };

  useEffect(() => {
    let active = true;

    const checkExistingSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error || !session?.user || !active) return;

      try {
        const isAdmin = await isCurrentUserAdmin();
        if (active && isAdmin) navigate(ADMIN_BASE_PATH, { replace: true });
      } catch (error) {
        console.error('Could not restore admin session:', error);
      }
    };

    void checkExistingSession();
    return () => { active = false; };
  }, [navigate]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isLoading) return;

    const email = formData.email.trim().toLowerCase();
    if (!email || !formData.password) {
      toast({ title: 'بيانات غير مكتملة', description: 'أدخل البريد الإلكتروني وكلمة المرور.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: formData.password,
      });
      if (error) throw error;

      if (!(await isCurrentUserAdmin())) {
        await supabase.auth.signOut({ scope: 'local' });
        throw new Error('هذا الحساب غير مخوّل للدخول إلى لوحة الإدارة.');
      }

      toast({ title: 'مرحباً', description: 'تم تسجيل الدخول بنجاح.' });
      navigate(ADMIN_BASE_PATH, { replace: true });
    } catch (error) {
      console.error('Admin login failed:', error);
      const message = error instanceof Error ? error.message : '';
      const invalid = /invalid login credentials|email not confirmed|invalid credentials/i.test(message);
      toast({
        title: 'تعذر تسجيل الدخول',
        description: invalid ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة، أو أن الحساب غير مفعل.' : (message || 'تعذر التحقق من بيانات الدخول.'),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="w-full max-w-sm"
      >
        <div className="bg-card rounded-2xl shadow-2xl shadow-primary/10 p-8 space-y-7 border border-primary/40">
          <div className="flex justify-center"><Logo size="lg" /></div>
          <div className="text-center">
            <p className="text-muted-foreground text-sm">لوحة تحكم جنان</p>
            <h2 className="mt-2 font-heading text-lg text-foreground">تسجيل دخول الإدارة</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="admin-email" className="block text-sm text-muted-foreground">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="admin-email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(event) => setFormData((current) => ({ ...current, email: event.target.value }))}
                  autoComplete="username"
                  className="bg-background/50 border-0 ring-1 ring-border/50 focus:ring-2 focus:ring-primary pr-10 rounded-xl h-12"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="admin-password" className="block text-sm text-muted-foreground">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="admin-password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={(event) => setFormData((current) => ({ ...current, password: event.target.value }))}
                  autoComplete="current-password"
                  className="bg-background/50 border-0 ring-1 ring-border/50 focus:ring-2 focus:ring-primary pr-10 rounded-xl h-12"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-6 rounded-xl text-base">
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5 ml-2" />دخول</>}
            </Button>
          </form>

          <p className="text-center text-muted-foreground text-xs">
            الدخول بالبريد الإلكتروني وكلمة المرور. الوصول مقتصر على حسابات الإدارة المصرح لها.
          </p>
        </div>
        <div className="text-center mt-6">
          <a href="/home" className="text-muted-foreground hover:text-primary text-sm transition-colors">العودة للمتجر</a>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminLoginPage;

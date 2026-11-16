import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, X, Save, Users } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type BankAccount = { bank: string; account: string; name: string };
const BANK_ACCOUNT_KEYS = ["bank_accounts", "bank_accounts_ye", "bank_accounts_sa"];

const AdminSettingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([{ bank: "", account: "", name: "جنان" }]);

  useEffect(() => {
    let active = true;
    const fetchSettings = async () => {
      try {
        const { data, error } = await supabase.from("site_settings").select("key,value").in("key", BANK_ACCOUNT_KEYS);
        if (error) throw error;
        for (const key of BANK_ACCOUNT_KEYS) {
          let value = data?.find((setting) => setting.key === key)?.value;
          if (typeof value === "string") {
            try { value = JSON.parse(value); } catch { continue; }
          }
          if (Array.isArray(value) && value.length > 0) {
            if (active) setBankAccounts(value as BankAccount[]);
            break;
          }
        }
      } catch (error) {
        console.error("Error fetching bank account settings:", error);
        if (active) toast({ title: "خطأ", description: "تعذر تحميل الحسابات البنكية.", variant: "destructive" });
      } finally {
        if (active) setIsLoading(false);
      }
    };
    void fetchSettings();
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    try {
      await Promise.all(BANK_ACCOUNT_KEYS.map(async (key) => {
        const { error } = await supabase.from("site_settings").upsert({ key, value: bankAccounts }, { onConflict: "key" });
        if (error) throw error;
      }));
      toast({ title: "تم", description: "تم حفظ الحسابات البنكية بنجاح" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error?.message || "تعذر حفظ الحسابات البنكية.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const addBankAccount = () => setBankAccounts((current) => [...current, { bank: "", account: "", name: "جنان" }]);
  const updateBankAccount = (index: number, field: keyof BankAccount, value: string) => {
    setBankAccounts((current) => current.map((account, i) => i === index ? { ...account, [field]: value } : account));
  };
  const removeBankAccount = (index: number) => setBankAccounts((current) => current.filter((_, i) => i !== index));

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-gold" /></div>;

  return (
    <div className="genan-studio-page genan-settings-workspace w-full max-w-[1480px] space-y-6" dir="rtl" data-genan-screen="settings">
      <AdminPageHeader
        category="الإدارة"
        title="الإعدادات"
        description="إدارة الحسابات البنكية وصلاحيات الفريق"
        actions={[
          { label: "صلاحيات الفريق", icon: Users, href: "/admin/team", variant: "secondary" },
          { label: "حفظ التغييرات", icon: Save, onClick: handleSave, variant: "primary" },
        ]}
      />
      <div className="genan-settings-main space-y-5">
      {/* Bank Accounts */}
      <div className="rounded-[20px] border border-[#E8DED0] bg-white p-5 shadow-[0_7px_26px_rgba(31,37,29,.035)] space-y-4 sm:p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg text-foreground">الحسابات البنكية</h2>
          <Button variant="outline" size="sm" onClick={() => addBankAccount()}>
            إضافة حساب
          </Button>
        </div>
        {bankAccounts.map((acc, index) => (
          <div key={index} className="grid grid-cols-1 gap-3 rounded-xl bg-[#FAF8F3] p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">البنك</label>
              <Input
                value={acc.bank}
                onChange={(e) => updateBankAccount(index, "bank", e.target.value)}
                placeholder="الراجحي"
              />
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">رقم الحساب</label>
              <Input
                value={acc.account}
                onChange={(e) => updateBankAccount(index, "account", e.target.value)}
                placeholder="97..."
                dir="ltr"
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => removeBankAccount(index)}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="sticky bottom-3 z-20 flex justify-end rounded-xl border border-[#E8DAC5] bg-[#FFFDFA]/95 p-2 shadow-[0_10px_35px_rgba(39,38,30,.10)] backdrop-blur-md">
        <Button type="button" onClick={handleSave} disabled={isSaving} className="min-h-[43px] w-full rounded-xl bg-[#26382D] px-6 text-[12px] font-semibold text-white hover:bg-[#3A4E3F] sm:w-auto">
          {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
          {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;

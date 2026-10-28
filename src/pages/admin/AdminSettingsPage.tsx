import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, Upload, X, FileText, Save, MessageCircle, Plus } from "lucide-react";
import AdminPageHeader from "@/components/admin/AdminPageHeader";

type ChatbotConfig = {
  enabled: boolean;
  greeting: string;
  faqs: Array<{ question: string; answer: string }>;
};

const defaultChatbotConfig: ChatbotConfig = {
  enabled: true,
  greeting: "أهلاً بك. أنا مساعد بوتيك جنان، ويسعدني مساعدتك في اختيار المنتجات ومعرفة الأسعار والتوفر والشحن.",
  faqs: [],
};

const AdminSettingsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<"general" | "assistant" | "finance" | "documents">("general");

  const [storeInfo, setStoreInfo] = useState({
    name: "جنان",
    email: "",
    phone: "",
  });

  const [socialLinks, setSocialLinks] = useState({
    whatsapp: "",
    instagram: "",
    snapchat: "",
  });

  const [whatsapp, setWhatsapp] = useState("");

  const [bankAccounts, setBankAccounts] = useState([{ bank: "", account: "", name: "جنان" }]);

  const [certPdfUrl, setCertPdfUrl] = useState("");
  const [certImages, setCertImages] = useState<string[]>([]);
  const [chatbotConfig, setChatbotConfig] = useState<ChatbotConfig>(defaultChatbotConfig);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from("site_settings").select("*");

      if (data) {
        data.forEach((setting) => {
          // Handle both string JSON and direct JSON values
          let value = setting.value;
          if (typeof value === "string") {
            try {
              value = JSON.parse(value);
            } catch (e) {
              // Keep as string if not valid JSON
            }
          }

          switch (setting.key) {
            case "store_info":
              if (value && typeof value === "object") {
                const info = value as Record<string, string>;
                setStoreInfo({
                  name: info.name || "جنان",
                  email: info.email || "",
                  phone: info.phone || info.phone_ye || info.phone_sa || "",
                });
              }
              break;
            case "whatsapp":
              if (typeof value === "string") setWhatsapp(value);
              break;
            case "whatsapp_sa":
              if (typeof value === "string" && !whatsapp) setWhatsapp(value);
              break;
            case "whatsapp_ye":
              if (typeof value === "string") setWhatsapp(value);
              break;
            case "bank_accounts":
              if (Array.isArray(value) && value.length > 0) setBankAccounts(value as any);
              break;
            case "bank_accounts_sa":
              if (Array.isArray(value) && value.length > 0 && bankAccounts.length === 0) setBankAccounts(value as any);
              break;
            case "bank_accounts_ye":
              if (Array.isArray(value) && value.length > 0) setBankAccounts(value as any);
              break;
            case "certification_pdf_url":
              setCertPdfUrl(typeof value === "string" ? value : "");
              break;
            case "social_whatsapp":
              setSocialLinks((prev) => ({ ...prev, whatsapp: typeof value === "string" ? value : "" }));
              break;
            case "social_snapchat":
              setSocialLinks((prev) => ({ ...prev, snapchat: typeof value === "string" ? value : "" }));
              break;
            case "social_instagram":
              setSocialLinks((prev) => ({ ...prev, instagram: typeof value === "string" ? value : "" }));
              break;
            case "chatbot_config":
              if (value && typeof value === "object" && !Array.isArray(value)) {
                const config = value as Partial<ChatbotConfig>;
                setChatbotConfig({
                  enabled: config.enabled !== false,
                  greeting: config.greeting || defaultChatbotConfig.greeting,
                  faqs: Array.isArray(config.faqs) ? config.faqs.filter((item): item is { question: string; answer: string } => Boolean(item?.question && item?.answer)) : [],
                });
              }
              break;
          }
        });
      }

      // Fetch certification images
      const { data: images } = await supabase
        .from("certification_images")
        .select("*")
        .eq("is_active", true)
        .order("sort_order");

      if (images) {
        setCertImages(images.map((img) => img.image_url));
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: string, value: any) => {
    const { error } = await supabase.from("site_settings").upsert({ key, value }, { onConflict: "key" });

    if (error) throw error;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all([
        updateSetting("store_info", storeInfo),
        updateSetting("whatsapp", whatsapp),
        updateSetting("whatsapp_sa", whatsapp),
        updateSetting("whatsapp_ye", whatsapp),
        updateSetting("bank_accounts", bankAccounts),
        updateSetting("bank_accounts_sa", bankAccounts),
        updateSetting("bank_accounts_ye", bankAccounts),
        updateSetting("certification_pdf_url", certPdfUrl),
        updateSetting("social_whatsapp", socialLinks.whatsapp),
        updateSetting("social_instagram", socialLinks.instagram),
        updateSetting("social_snapchat", socialLinks.snapchat),
        updateSetting("chatbot_config", chatbotConfig),
      ]);

      toast({ title: "تم", description: "تم حفظ الإعدادات بنجاح" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const sanitizeStorageFileName = (name: string) => name.replace(/[^\w.-]+/g, "_");

  const clearCertPdf = async () => {
    try {
      setCertPdfUrl("");
      await updateSetting("certification_pdf_url", "");
      toast({ title: "تم", description: "تم حذف ملف PDF" });
    } catch (error: any) {
      toast({ title: "خطأ", description: error?.message || "فشل حذف ملف PDF", variant: "destructive" });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: "pdf" | "image") => {
    const file = e.target.files?.[0];

    // Allow re-uploading the same file
    e.target.value = "";

    if (!file) return;

    const isPdf = type === "pdf";

    if (isPdf && !file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "خطأ", description: "الرجاء اختيار ملف PDF فقط", variant: "destructive" });
      return;
    }

    if (!isPdf && !file.type.startsWith("image/")) {
      toast({ title: "خطأ", description: "الرجاء اختيار صورة فقط", variant: "destructive" });
      return;
    }

    const folder = isPdf ? "certifications" : "certifications/images";
    const fileName = `${folder}/${Date.now()}-${sanitizeStorageFileName(file.name)}`;

    try {
      const { error: uploadError } = await supabase.storage.from("uploads").upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || (isPdf ? "application/pdf" : undefined),
      });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("uploads").getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;

      if (isPdf) {
        setCertPdfUrl(publicUrl);
        await updateSetting("certification_pdf_url", publicUrl);
        toast({ title: "تم", description: "تم رفع ملف PDF بنجاح" });
        return;
      }

      // نحتاج شهادة واحدة فقط: استبدال أي صور موجودة
      const { error: deleteError } = await supabase
        .from("certification_images")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000");

      if (deleteError) throw deleteError;

      const { error: insertError } = await supabase.from("certification_images").insert({
        image_url: publicUrl,
        sort_order: 0,
        is_active: true,
      });

      if (insertError) throw insertError;

      setCertImages([publicUrl]);
      toast({ title: "تم", description: "تم تحديث صورة التوثيق" });
    } catch (error: any) {
      toast({
        title: "خطأ",
        description: error?.message || "فشل في رفع الملف",
        variant: "destructive",
      });
    }
  };

  const removeCertImage = async () => {
    const imageUrl = certImages[0];
    if (!imageUrl) return;

    const { error } = await supabase.from("certification_images").delete().eq("image_url", imageUrl);

    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      return;
    }

    setCertImages([]);
    toast({ title: "تم", description: "تم حذف صورة التوثيق" });
  };

  const addBankAccount = () => {
    setBankAccounts((prev) => [...prev, { bank: "", account: "", name: "جنان" }]);
  };

  const updateBankAccount = (index: number, field: string, value: string) => {
    setBankAccounts((prev) => prev.map((acc, i) => (i === index ? { ...acc, [field]: value } : acc)));
  };

  const removeBankAccount = (index: number) => {
    setBankAccounts((prev) => prev.filter((_, i) => i !== index));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto" dir="rtl">
      <AdminPageHeader
        category="الإدارة"
        title="الإعدادات"
        description="إعدادات منظمة لتسهيل إدارة المتجر والتواصل والحسابات"
        actions={[
          {
            label: "حفظ التغييرات",
            icon: Save,
            onClick: handleSave,
            variant: "primary",
          },
        ]}
      />

      <nav aria-label="أقسام إعدادات جنان" className="flex flex-wrap gap-2 rounded-[18px] border border-[#E8DDCD] bg-white p-2 shadow-[0_6px_22px_rgba(33,36,28,.035)]" role="tablist">
        {([
          { id: "general", label: "معلومات المتجر" },
          { id: "assistant", label: "مساعد العملاء" },
          { id: "finance", label: "الحسابات البنكية" },
          { id: "documents", label: "التوثيق والشهادات" },
        ] as const).map((tab) => (
          <button key={tab.id} type="button" role="tab" id={"genan-settings-tab-" + tab.id}
            aria-selected={activeSettingsTab === tab.id}
            aria-controls={"genan-settings-panel-" + tab.id}
            onClick={() => setActiveSettingsTab(tab.id)}
            className={activeSettingsTab === tab.id
              ? "min-h-[43px] rounded-xl bg-[#27382E] px-4 text-[12px] font-semibold text-white"
              : "min-h-[43px] rounded-xl bg-[#FAF7F1] px-4 text-[12px] font-semibold text-[#71685B] transition-colors hover:bg-[#EEE3D1]"}>
            {tab.label}
          </button>
        ))}
      </nav>
      <p className="-mt-3 text-[12px] text-[#867A69]">يمكنك التنقل بين الأقسام، ثم الضغط على «حفظ التغييرات» لحفظ الإعدادات.</p>

      {activeSettingsTab === "general" && (
        <div id="genan-settings-panel-general" role="tabpanel" aria-labelledby="genan-settings-tab-general" className="space-y-5">
      {/* Store Info */}
      <div className="rounded-[20px] border border-[#E8DED0] bg-white p-5 shadow-[0_7px_26px_rgba(31,37,29,.035)] space-y-4 sm:p-6">
        <h2 className="font-heading text-lg text-foreground">معلومات المتجر</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">اسم المتجر</label>
            <Input value={storeInfo.name} onChange={(e) => setStoreInfo({ ...storeInfo, name: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">البريد الإلكتروني الموثّق (اختياري)</label>
            <Input
              value={storeInfo.email}
              onChange={(e) => setStoreInfo({ ...storeInfo, email: e.target.value })}
              placeholder="اتركه فارغًا حتى يتوفر بريد رسمي يعمل"
              dir="ltr"
            />
          </div>
        </div>
      </div>

      {/* WhatsApp */}
      <div className="rounded-[20px] border border-[#E8DED0] bg-white p-5 shadow-[0_7px_26px_rgba(31,37,29,.035)] space-y-4 sm:p-6">
        <h2 className="font-heading text-lg text-foreground">رقم واتساب</h2>
        <div>
          <label className="block text-sm text-muted-foreground mb-2">رقم واتساب المتجر</label>
          <Input
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="+967778579777"
            dir="ltr"
          />
        </div>
      </div>

      {/* Social Links */}
      <div className="rounded-[20px] border border-[#E8DED0] bg-white p-5 shadow-[0_7px_26px_rgba(31,37,29,.035)] space-y-4 sm:p-6">
        <h2 className="font-heading text-lg text-foreground">روابط التواصل الاجتماعي (الفوتر)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">رابط واتساب</label>
            <Input
              value={socialLinks.whatsapp}
              onChange={(e) => setSocialLinks({ ...socialLinks, whatsapp: e.target.value })}
              placeholder="https://wa.me/966..."
              dir="ltr"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">رابط انستجرام</label>
            <Input
              value={socialLinks.instagram}
              onChange={(e) => setSocialLinks({ ...socialLinks, instagram: e.target.value })}
              placeholder="https://instagram.com/..."
              dir="ltr"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm text-muted-foreground">رابط سناب شات</label>
            <Input value={socialLinks.snapchat} onChange={(e) => setSocialLinks({ ...socialLinks, snapchat: e.target.value })} placeholder="https://www.snapchat.com/add/..." dir="ltr" />
          </div>
        </div>
      </div>

        </div>
      )}

      {activeSettingsTab === "assistant" && (
        <div id="genan-settings-panel-assistant" role="tabpanel" aria-labelledby="genan-settings-tab-assistant">
      {/* Customer Assistant */}
      <div className="rounded-[20px] border border-[#E8DED0] bg-white p-5 shadow-[0_7px_26px_rgba(31,37,29,.035)] space-y-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary"><MessageCircle className="h-5 w-5" /></span>
            <div><h2 className="font-heading text-lg text-foreground">مساعد العملاء</h2><p className="text-sm text-muted-foreground">أدر ظهور المساعد وإجاباته المجانية من محتوى المتجر.</p></div>
          </div>
          <Switch checked={chatbotConfig.enabled} onCheckedChange={(enabled) => setChatbotConfig((current) => ({ ...current, enabled }))} aria-label="تفعيل مساعد العملاء" />
        </div>
        <div>
          <label className="block text-sm text-muted-foreground mb-2">رسالة الترحيب</label>
          <Textarea value={chatbotConfig.greeting} onChange={(event) => setChatbotConfig((current) => ({ ...current, greeting: event.target.value }))} rows={3} />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between"><label className="text-sm text-muted-foreground">أسئلة وأجوبة المساعد</label><Button type="button" size="sm" variant="outline" onClick={() => setChatbotConfig((current) => ({ ...current, faqs: [...current.faqs, { question: "", answer: "" }] }))}><Plus className="w-4 h-4 ml-1" />إضافة سؤال</Button></div>
          {chatbotConfig.faqs.map((faq, index) => (
            <div key={index} className="grid gap-3 rounded-xl border border-[#E9E0D2] p-3 md:grid-cols-[1fr_1fr_auto]">
              <Input value={faq.question} onChange={(event) => setChatbotConfig((current) => ({ ...current, faqs: current.faqs.map((item, itemIndex) => itemIndex === index ? { ...item, question: event.target.value } : item) }))} placeholder="سؤال العميل" />
              <Textarea value={faq.answer} onChange={(event) => setChatbotConfig((current) => ({ ...current, faqs: current.faqs.map((item, itemIndex) => itemIndex === index ? { ...item, answer: event.target.value } : item) }))} placeholder="إجابة المساعد" rows={2} />
              <Button type="button" size="icon" variant="ghost" className="text-destructive" onClick={() => setChatbotConfig((current) => ({ ...current, faqs: current.faqs.filter((_, itemIndex) => itemIndex !== index) }))}><X className="w-4 h-4" /></Button>
            </div>
          ))}
          <p className="text-xs text-muted-foreground">يقرأ المساعد هذه الإجابات، إضافة إلى نصوص الصفحات المنشورة والمنتجات والماركات والأقسام.</p>
        </div>
      </div>

        </div>
      )}

      {activeSettingsTab === "finance" && (
        <div id="genan-settings-panel-finance" role="tabpanel" aria-labelledby="genan-settings-tab-finance">
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

        </div>
      )}

      {activeSettingsTab === "documents" && (
        <div id="genan-settings-panel-documents" role="tabpanel" aria-labelledby="genan-settings-tab-documents">
      {/* Certifications */}
      <div className="rounded-[20px] border border-[#E8DED0] bg-white p-5 shadow-[0_7px_26px_rgba(31,37,29,.035)] space-y-4 sm:p-6">
        <h2 className="font-heading text-lg text-foreground">التوثيق والشهادات</h2>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">ملف PDF للتوثيق</label>
          {certPdfUrl ? (
            <div className="flex items-center gap-4 rounded-xl bg-[#F6F0E5] p-4">
              <FileText className="w-8 h-8 text-gold" />
              <span className="flex-1 text-sm truncate">{certPdfUrl}</span>
              <Button variant="ghost" size="icon" onClick={() => setCertPdfUrl("")}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <label className="block w-full cursor-pointer rounded-2xl border-2 border-dashed border-[#D8C9AF] p-8 text-center transition-colors hover:border-[#A78956]">
              <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">اختر ملف PDF</span>
              <input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, "pdf")} className="hidden" />
            </label>
          )}
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">صورة التوثيق</label>
          <div className="flex flex-wrap gap-4">
            {certImages[0] ? (
              <div className="relative w-32 h-32">
                <img loading="lazy" src={certImages[0]} alt="صورة التوثيق" className="w-full h-full object-cover rounded" />
                <button
                  onClick={removeCertImage}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full"
                  type="button"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <label className="flex h-32 w-32 cursor-pointer items-center justify-center rounded-2xl border-2 border-dashed border-[#D8C9AF] transition-colors hover:border-[#A78956]">
                <Upload className="w-6 h-6 text-muted-foreground" />
                <input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, "image")} className="hidden" />
              </label>
            )}
          </div>
        </div>
      </div>
        </div>
      )}

      <div className="sticky bottom-3 z-20 flex justify-end rounded-xl border border-[#E8DAC5] bg-[#FFFDFA]/95 p-2 shadow-[0_10px_35px_rgba(39,38,30,.10)] backdrop-blur-md">
        <Button type="button" onClick={handleSave} disabled={isSaving} className="min-h-[43px] w-full rounded-xl bg-[#26382D] px-6 text-[12px] font-semibold text-white hover:bg-[#3A4E3F] sm:w-auto">
          {isSaving ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />}
          {isSaving ? "جاري الحفظ..." : "حفظ التغييرات"}
        </Button>
      </div>
    </div>
  );
};

export default AdminSettingsPage;

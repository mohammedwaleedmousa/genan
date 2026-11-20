import { useContext, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { AlertCircle, Banknote, Check, ChevronDown, ChevronLeft, ChevronRight, CreditCard, Loader2, MapPin, ShoppingBag, Ticket, Truck, User, X } from "lucide-react";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import CheckoutTransferDetails, { type CheckoutBankAccount } from "@/components/CheckoutTransferDetails";
import LoadingScreen from "@/components/LoadingScreen";

import { useStore } from "@/store/useStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { getGuestAddresses, listCustomerAddresses, upsertSavedAddress, type SavedAddress } from "@/lib/savedAddresses";
import { CustomerAuthContext, customerSignInPath, loadCustomerProfile, type CustomerProfile } from "@/lib/customerSession";
import { optimizeImage, handleImageError } from "@/lib/imageUrl";
import { useCurrency } from "@/lib/currency";

const orderAccessorySchema = z.object({
  name: z.string().max(200).optional(),
  name_ar: z.string().max(200).optional(),
  price: z.number().nonnegative().max(1000000),
  quantity: z.number().int().min(1).max(100),
  image_url: z.string().max(2000).optional(),
});

const orderItemSchema = z.object({
  product_id: z.string().uuid(),
  product_name: z.string().min(1).max(500),
  product_image: z.string().max(2000).optional(),
  quantity: z.number().int().min(1).max(100),
  price: z.number().nonnegative().max(10000000),
  selected_size: z.string().max(100).nullable(),
  selected_color: z.string().max(100).nullable().optional(),
  selected_accessories: z.array(orderAccessorySchema).max(50),
});

const orderItemsSchema = z.array(orderItemSchema).min(1).max(100);

const createCheckoutRequestId = () => {
  if (typeof crypto.randomUUID === "function") return crypto.randomUUID();
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

const arabicDigitsToLatin = (value: string) => value.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)));

const normalizeCheckoutPhone = (value: string) => {
  const latin = arabicDigitsToLatin(value).trim();
  let compact = latin.replace(/[\s().-]/g, "");
  if (compact.startsWith("00")) compact = `+${compact.slice(2)}`;

  if (!compact.startsWith("+")) {
    let digits = compact.replace(/\D/g, "");
    if (/^0?7\d{8}$/.test(digits)) {
      if (digits.startsWith("0")) digits = digits.slice(1);
      return `+967${digits}`;
    }
    if (/^9677\d{8}$/.test(digits)) return `+${digits}`;
    throw new Error("invalid_checkout_phone");
  }

  if (!/^\+[1-9]\d{7,14}$/.test(compact)) throw new Error("invalid_checkout_phone");
  return compact;
};

const orderCountryFromPhone = (phone: string) => phone.startsWith("+967") ? "YE" : "GLOBAL";

interface DeliveryCompany {
  id: string;
  name: string;
  base_fee: number;
  delivery_days: string | null;
  service_scope?: "aden" | "outside" | "all";
}

const checkoutRemittanceSchema = z.object({
  name: z.string().trim().min(1),
  providers: z.array(z.string().trim().min(1)).min(1),
});

interface PaymentMethod {
  id: string;
  code: string;
  name: string;
  name_ar: string;
  type: string;
}

interface CODRegion {
  id: string;
  region_name: string;
  region_name_ar: string;
}

const YEMEN_GOVERNORATES = [
  "عدن",
  "أمانة العاصمة",
  "صنعاء",
  "تعز",
  "حضرموت",
  "إب",
  "الحديدة",
  "ذمار",
  "لحج",
  "أبين",
  "شبوة",
  "مأرب",
  "الجوف",
  "صعدة",
  "عمران",
  "حجة",
  "المحويت",
  "ريمة",
  "الضالع",
  "البيضاء",
  "المهرة",
  "أرخبيل سقطرى",
] as const;

const normalizeGovernorate = (value?: string | null) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return "";
  const prefix = normalized.split(/\s*[-–—،,]\s*/, 1)[0];
  const exact = YEMEN_GOVERNORATES.find((governorate) => governorate === prefix);
  if (exact) return exact;
  if (normalized.includes("عدن") || normalized.includes("aden")) return "عدن";
  return YEMEN_GOVERNORATES.find((governorate) => normalized.includes(governorate.toLowerCase())) || "";
};

const cityWithoutGovernorate = (value: string, governorate: string) => {
  const city = value.trim();
  if (!governorate || !city.startsWith(governorate)) return city;
  const suffix = city.slice(governorate.length);
  return /^\s*[-–—،,]\s*/.test(suffix) ? suffix.replace(/^\s*[-–—،,]\s*/, "").trim() : city;
};

const composeOrderCity = (governorate: string, city: string) => [governorate.trim(), city.trim()].filter(Boolean).join(" - ");

const deliveryCompanyScope = (company: DeliveryCompany) => company.service_scope || (String(company.delivery_days || "").includes("داخل عدن") ? "aden" : "outside");

const STEPS = [
  { key: "info", label: "المعلومات", icon: User },
  { key: "address", label: "العنوان", icon: MapPin },
  { key: "payment", label: "الدفع", icon: CreditCard },
  { key: "review", label: "المراجعة", icon: Check },
] as const;

const CheckoutPage = () => {
  const user = useContext(CustomerAuthContext);
  const profile = useQuery({
    queryKey: ["checkout-customer-profile", user?.id],
    queryFn: () => loadCustomerProfile(user!.id),
    enabled: Boolean(user),
    refetchOnMount: "always",
    refetchOnReconnect: false,
  });
  const addresses = useQuery({
    queryKey: ["checkout-customer-addresses", profile.data?.id],
    queryFn: () => listCustomerAddresses(profile.data!.id),
    enabled: Boolean(profile.data),
    refetchOnMount: "always",
    refetchOnReconnect: false,
  });

  if (user === undefined || (user && (profile.isFetching || addresses.isFetching))) return <LoadingScreen />;
  if (user && !profile.data) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-center" dir="rtl">
        <div className="space-y-4">
          <p>تعذر تحميل بيانات حسابك لإتمام الطلب.</p>
          <button type="button" onClick={() => void profile.refetch()} className="font-medium text-burgundy underline">إعادة المحاولة</button>
        </div>
      </main>
    );
  }

  return <CheckoutForm key={user?.id || "guest"} customer={profile.data} addresses={addresses.data} addressesUnavailable={addresses.isError} />;
};

const CheckoutForm = ({ customer, addresses, addressesUnavailable }: {
  customer?: CustomerProfile;
  addresses?: SavedAddress[];
  addressesUnavailable: boolean;
}) => {
  const navigate = useNavigate();
  const { cart, getCartTotal, clearCart, currencyMode } = useStore();
  const isGuestLike = !customer;
  const subtotal = getCartTotal();
  const { format: formatCurrency } = useCurrency();

  const [savedAddresses] = useState(() => customer ? addresses || [] : getGuestAddresses());
  const defaultAddress = savedAddresses.find((address) => address.isDefault) || savedAddresses[0];
  const accountGovernorate = normalizeGovernorate(customer?.region);
  const addressGovernorate = normalizeGovernorate(defaultAddress?.city);
  const initialGovernorate = addressGovernorate || accountGovernorate;

  const [currentStep, setCurrentStep] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [selectedDelivery, setSelectedDelivery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState(initialGovernorate);
  const deliveryScope = selectedRegion === "عدن" ? "aden" : "outside";
  const [termsAccepted, setTermsAccepted] = useState(false);

  const [formData, setFormData] = useState({
    name: customer?.name || defaultAddress?.name || "",
    phone: customer?.phone || defaultAddress?.phone || "",
    address: defaultAddress?.address || "",
    city: defaultAddress ? cityWithoutGovernorate(defaultAddress.city, addressGovernorate) : "",
    notes: defaultAddress?.notes || "",
  });

  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [launchDiscountEligible, setLaunchDiscountEligible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(defaultAddress?.id || "");
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);

  const selectGovernorate = (governorate: string) => {
    setSelectedAddressId("");
    setSelectedRegion(governorate);
  };

  const { data: deliveryCompanies = [] } = useQuery({
    queryKey: ["delivery-companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("delivery_companies").select("id,name,base_fee,delivery_days,service_scope,is_active").eq("is_active", true).order("name");
      if (error) throw error;
      return (data || []) as DeliveryCompany[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const adenDeliveryCompany = useMemo(() => deliveryCompanies.find((company) => deliveryCompanyScope(company) === "aden") || null, [deliveryCompanies]);
  const visibleDeliveryCompanies = useMemo(() => deliveryCompanies.filter((company) => {
    const scope = deliveryCompanyScope(company);
    return scope === deliveryScope || scope === "all";
  }), [deliveryCompanies, deliveryScope]);

  useEffect(() => {
    if (!visibleDeliveryCompanies.some((company) => company.id === selectedDelivery)) {
      setSelectedDelivery(visibleDeliveryCompanies[0]?.id || "");
    }
  }, [selectedDelivery, visibleDeliveryCompanies]);

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["checkout-payment-methods"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("payment_methods").select("id,code,name,name_ar,type").eq("is_active", true).order("sort_order", { ascending: true });
      if (error) throw error;
      return (data || []) as PaymentMethod[];
    },
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });

  const visiblePaymentMethods = useMemo(() => {
    const nonCashMethods = paymentMethods.filter((method) => method.type !== "cash" && method.code !== "cod" && method.code !== "cash");
    if (deliveryScope === "outside") return nonCashMethods;

    const codMethod = paymentMethods.find((method) => method.type === "cash" || method.code === "cod" || method.code === "cash") || {
      id: "aden-cod",
      code: "cod",
      name: "Cash on delivery",
      name_ar: "الدفع عند الاستلام",
      type: "cash",
    };

    return [codMethod, ...nonCashMethods];
  }, [paymentMethods, deliveryScope]);

  useEffect(() => {
    if (paymentMethod && !visiblePaymentMethods.some((method) => method.code === paymentMethod)) {
      setPaymentMethod("");
    }
  }, [paymentMethod, visiblePaymentMethods]);

  const { data: checkoutSettings = {} } = useQuery<Record<string, unknown>>({
    queryKey: ["checkout-settings", "transfer-details"],
    queryFn: async () => {
      const { data, error } = await supabase.from("site_settings").select("key,value").in("key", ["bank_accounts", "bank_accounts_ye", "bank_accounts_sa", "checkout_bank_remittance"]);
      if (error) throw error;
      return Object.fromEntries((data || []).map((setting) => [setting.key, setting.value]));
    },
    staleTime: 1000 * 60 * 10,
    refetchOnWindowFocus: false,
  });

  const bankAccounts = useMemo<CheckoutBankAccount[]>(() => {
    let value: any = checkoutSettings.bank_accounts ?? checkoutSettings.bank_accounts_ye ?? checkoutSettings.bank_accounts_sa;
    if (typeof value === "string") {
      try { value = JSON.parse(value); } catch { return []; }
    }
    if (!Array.isArray(value)) return [];
    return value.map((item) => ({
      bank: String(item?.bank || "").trim(),
      account: String(item?.account || "").trim(),
      name: String(item?.name || "").trim(),
    })).filter(({ bank, account }) => bank && account);
  }, [checkoutSettings]);

  const remittanceSetting = checkoutRemittanceSchema.safeParse(checkoutSettings.checkout_bank_remittance).data;
  const remittance = remittanceSetting?.name && remittanceSetting.providers?.length
    ? { name: remittanceSetting.name, providers: remittanceSetting.providers }
    : undefined;

  const { data: codRegions = [] } = useQuery({
    queryKey: ["cod-regions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("cod_regions").select("id,region_name,region_name_ar").eq("is_active", true).order("region_name_ar");
      if (error) throw error;
      return (data || []) as CODRegion[];
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  const selectedCompany = deliveryCompanies.find((company) => company.id === selectedDelivery);
  const deliveryFee = selectedCompany?.base_fee || 0;
  const total = Math.max(0, subtotal + deliveryFee - discountAmount);
  const selectedPaymentMethod = visiblePaymentMethods.find((method) => method.code === paymentMethod) || null;
  const isCashPayment = selectedPaymentMethod?.type === "cash" || selectedPaymentMethod?.code === "cod" || selectedPaymentMethod?.code === "cash";
  const isBankPayment = selectedPaymentMethod?.type === "bank" || selectedPaymentMethod?.code === "bank";

  useEffect(() => {
    if (appliedCoupon) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const normalizedPhone = normalizeCheckoutPhone(String(customer?.phone || formData.phone || "").trim());
        const { data, error } = await (supabase as any).rpc("get_launch_discount_status", { p_customer_phone: normalizedPhone });
        if (cancelled) return;
        if (error || !data?.eligible) {
          setLaunchDiscountEligible(false);
          setDiscountAmount(0);
          return;
        }
        setLaunchDiscountEligible(true);
        setDiscountAmount(Math.min(subtotal, subtotal * 0.10));
      } catch {
        if (!cancelled) {
          setLaunchDiscountEligible(false);
          setDiscountAmount(0);
        }
      }
    }, 250);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [appliedCoupon, customer?.phone, formData.phone, subtotal]);

  const applyCoupon = async () => {
    const normalized = couponCode.trim().toUpperCase();
    if (!normalized) { toast({ title: "أدخل كود الخصم", variant: "destructive" }); return; }
    try {
      const { data, error } = await (supabase as any).rpc("validate_checkout_coupon", { p_code: normalized, p_customer_phone: normalizeCheckoutPhone(String(customer?.phone || formData.phone || "").trim()) });
      if (error) throw error;
      if (!data?.valid) { setAppliedCoupon(null); const reason = String(data?.reason || "invalid"); const description = reason === "expired" ? "انتهت صلاحية هذا الكود (48 ساعة)." : reason === "already_used" ? "سبق لك الاستفادة من خصم الإحالة، ولا يمكن استخدامه مرة أخرى." : reason === "self_referral" ? "لا يمكنك استخدام كود الإحالة الخاص بك." : reason === "phone_required" ? "أدخل رقم هاتفك أولاً للتحقق من أهلية الكود." : "كود الخصم غير موجود أو غير فعال."; toast({ title: "تعذر تطبيق الكود", description, variant: "destructive" }); return; }
      const value = Number(data.value) || 0;
      let discount = data.type === "percentage" ? (subtotal * value) / 100 : value;
      discount = Math.min(discount, subtotal);
      setDiscountAmount(discount); setAppliedCoupon(normalized);
      toast({ title: "تم تطبيق الكوبون", description: `خصم ${formatCurrency(discount)}` });
    } catch {
      setAppliedCoupon(null);
      setDiscountAmount(launchDiscountEligible ? Math.min(subtotal, subtotal * 0.10) : 0);
      toast({ title: "تعذر التحقق من الكوبون", description: "حاول مرة أخرى.", variant: "destructive" });
    }
  };

  const removeCoupon = () => { setCouponCode(""); setAppliedCoupon(null); setDiscountAmount(launchDiscountEligible ? Math.min(subtotal, subtotal * 0.10) : 0); toast({ title: "تمت إزالة الكوبون" }); };

  const selectedSavedAddress = savedAddresses.find((address) => address.id === selectedAddressId);

  const selectSavedAddress = (id: string) => {
    const address = savedAddresses.find((item) => item.id === id);
    const governorate = normalizeGovernorate(address?.city);
    setSelectedAddressId(id);
    setAddressPickerOpen(false);
    setSelectedRegion(governorate || accountGovernorate);
    setFormData((current) => ({
      ...current,
      name: customer?.name || address?.name || current.name,
      phone: customer?.phone || address?.phone || current.phone,
      city: address ? cityWithoutGovernorate(address.city, governorate) : "",
      address: address?.address || "",
      notes: address?.notes || "",
    }));
  };

  const createSecureOrder = async (items: unknown[], requestId: string) => {
    const normalizedCustomerPhone = normalizeCheckoutPhone(String(customer?.phone || formData.phone || "").trim());
    const orderCountry = orderCountryFromPhone(normalizedCustomerPhone);
    const { data, error } = await (supabase as any).rpc("create_secure_order_v4", {
      p_request_id: requestId,
      p_customer_name: String(customer?.name || formData.name || "").trim(),
      p_customer_phone: normalizedCustomerPhone,
      p_customer_address: formData.address.trim(),
      p_customer_notes: formData.notes.trim() || null,
      p_country: orderCountry,
      p_customer_city: composeOrderCity(selectedRegion, formData.city),
      p_customer_region: selectedRegion || null,
      p_items: items,
      p_payment_method: isCashPayment ? "cod" : paymentMethod,
      p_currency_mode: currencyMode,
      p_currency_code: currencyMode,
      p_coupon_code: appliedCoupon || null,
      p_delivery_company_id: selectedDelivery || null,
    });
    if (error) { console.error("RPC ERROR FULL:", error); throw error; }
    return data;
  };

  const validateStep = (step: number) => {
    if (step === 0) {
      const name = String(customer?.name || formData.name || "").trim();
      const phone = String(customer?.phone || formData.phone || "").trim();
      if (!name || !phone) { toast({ title: "الاسم ورقم الهاتف مطلوبان", variant: "destructive" }); return false; }
      try { normalizeCheckoutPhone(phone); } catch { toast({ title: "رقم الهاتف غير صحيح", description: "لرقم يمني أدخل 9 أرقام تبدأ بـ7، وللأرقام الدولية استخدم رمز الدولة مثل +966.", variant: "destructive" }); return false; }
    }
    if (step === 1 && (!selectedRegion || !formData.city.trim() || !formData.address.trim())) { toast({ title: "المحافظة والمدينة والعنوان مطلوبة", variant: "destructive" }); return false; }
    if (step === 2) {
      if (!selectedRegion) { toast({ title: "اختر محافظة التوصيل", variant: "destructive" }); return false; }
      if (!selectedDelivery || !selectedCompany || !visibleDeliveryCompanies.some((company) => company.id === selectedDelivery)) { toast({ title: "اختر شركة التوصيل", description: "يجب تحديد شركة التوصيل المناسبة لنطاق التوصيل قبل المتابعة.", variant: "destructive" }); return false; }
      if (!paymentMethod || !selectedPaymentMethod) { toast({ title: "اختر طريقة الدفع", description: "يجب تحديد طريقة الدفع قبل المتابعة.", variant: "destructive" }); return false; }
      if (isCashPayment && deliveryScope !== "aden") { toast({ title: "الدفع عند الاستلام متاح داخل عدن فقط", variant: "destructive" }); return false; }
    }
    return true;
  };

  const nextStep = () => { if (!validateStep(currentStep)) return; setCurrentStep((current) => Math.min(current + 1, STEPS.length - 1)); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const prevStep = () => { setCurrentStep((current) => Math.max(current - 1, 0)); window.scrollTo({ top: 0, behavior: "smooth" }); };

  const saveAddressForCheckout = async (requestId: string, name: string, phone: string) => {
    const city = composeOrderCity(selectedRegion, formData.city);
    const address = formData.address.trim();
    const notes = formData.notes.trim();
    const existing = selectedSavedAddress || savedAddresses.find((saved) => {
      const governorate = normalizeGovernorate(saved.city);
      return composeOrderCity(governorate || accountGovernorate, cityWithoutGovernorate(saved.city, governorate)) === city
        && saved.address.trim() === address;
    });
    const draft = {
      id: existing?.id || requestId,
      label: existing?.label || (savedAddresses.length === 0 ? "العنوان الافتراضي" : `عنوان ${savedAddresses.length + 1}`),
      name,
      phone,
      city,
      address,
      notes,
      isDefault: existing?.isDefault ?? savedAddresses.length === 0,
    };

    if (!customer) {
      upsertSavedAddress("guest", draft);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session || session.user.id !== customer.user_id) throw new Error("customer_session_changed");

    const values = {
      id: draft.id,
      user_id: customer.id,
      customer_id: customer.id,
      label: draft.label,
      recipient_name: draft.name,
      phone: draft.phone,
      city: draft.city,
      address_line1: draft.address,
      notes: draft.notes || null,
      is_default: draft.isDefault,
    };
    const { error } = await supabase.from("customer_addresses").upsert(values);
    if (!error) return;
    if (!existing && values.is_default && error.code === "23505" && error.message.includes("idx_customer_addresses_one_default")) {
      const { error: retryError } = await supabase.from("customer_addresses").upsert({ ...values, is_default: false });
      if (retryError) throw retryError;
      return;
    }
    throw error;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!validateStep(0) || !validateStep(1) || !validateStep(2)) return;
    if (!termsAccepted) { toast({ title: "وافق على السياسات لإتمام الطلب", description: "راجع الشروط وسياسة الخصوصية والإرجاع ثم فعّل مربع الموافقة.", variant: "destructive" }); return; }
    setIsSubmitting(true);
    const rawOrderItems = cart.map((item) => {
      const basePrice = item.product.discount ? item.product.price * (1 - item.product.discount / 100) : item.product.price;
      const accessoriesTotal = item.selectedAccessories?.reduce((sum, accessory) => sum + accessory.price * accessory.quantity, 0) || 0;
      return { product_id: item.product.id, product_name: item.product.nameAr, product_image: item.product.images?.[0] || "", quantity: item.quantity, price: basePrice + accessoriesTotal, selected_size: item.selectedSize || null, selected_color: item.selectedColor || item.variantColor || null, selected_accessories: (item.selectedAccessories || []).map((accessory) => ({ name: String((accessory as any).name || ""), name_ar: String((accessory as any).name_ar || (accessory as any).name || ""), price: Number((accessory as any).price) || 0, quantity: Number((accessory as any).quantity) || 1, image_url: String((accessory as any).image_url || "") })) };
    });
    const validation = orderItemsSchema.safeParse(rawOrderItems);
    if (!validation.success) { console.error("ORDER VALIDATION:", validation.error); toast({ title: "بيانات الطلب غير صحيحة", description: "تحقق من المنتجات وحاول مرة أخرى.", variant: "destructive" }); setIsSubmitting(false); return; }

    const requestFingerprint = JSON.stringify({
      customerId: customer?.id || "guest",
      name: String(customer?.name || formData.name || "").trim(),
      phone: normalizeCheckoutPhone(String(customer?.phone || formData.phone || "").trim()),
      address: formData.address.trim(),
      notes: formData.notes.trim() || null,
      city: composeOrderCity(selectedRegion, formData.city),
      region: selectedRegion || null,
      country: orderCountryFromPhone(normalizeCheckoutPhone(String(customer?.phone || formData.phone || "").trim())),
      paymentMethod: isCashPayment ? "cod" : paymentMethod,
      currencyMode,
      coupon: appliedCoupon || null,
      deliveryCompanyId: selectedDelivery,
      items: validation.data,
    });
    const requestStorageKey = "genan-checkout-idempotency";
    let checkoutRequestId = createCheckoutRequestId();
    try {
      const stored = sessionStorage.getItem(requestStorageKey);
      const previous = stored ? JSON.parse(stored) as { fingerprint?: string; requestId?: string } : null;
      if (previous?.fingerprint === requestFingerprint && previous.requestId) {
        checkoutRequestId = previous.requestId;
      } else {
        sessionStorage.setItem(requestStorageKey, JSON.stringify({ fingerprint: requestFingerprint, requestId: checkoutRequestId }));
      }
    } catch {
      // A unique in-memory key still protects this submission; server idempotency remains authoritative.
    }

    try {
      const customerName = String(customer?.name || formData.name || "").trim();
      const customerPhone = normalizeCheckoutPhone(String(customer?.phone || formData.phone || "").trim());
      const createdOrder = await createSecureOrder(validation.data, checkoutRequestId);
      try {
        await saveAddressForCheckout(checkoutRequestId, customerName, customerPhone);
      } catch {
        if (customer) toast({ title: "تم الطلب وتعذر حفظ العنوان", description: "يمكنك إضافة عنوان التوصيل من صفحة حسابي." });
      }
      const regionData = codRegions.find((region) => region.id === selectedRegion || region.region_name === selectedRegion || region.region_name_ar === selectedRegion);
      const amountsAreNative = createdOrder.total_base !== null && createdOrder.total_base !== undefined && Number(createdOrder.exchange_rate_snapshot) > 0;
      const orderData = { orderId: createdOrder.order_id, orderNumber: createdOrder.order_number, trackingToken: createdOrder.tracking_token, customerName: customerName || "عميل", customerPhone, customerAddress: formData.address || "-", customerCity: composeOrderCity(selectedRegion, formData.city), customerNotes: formData.notes || "", items: Array.isArray(createdOrder.items) ? createdOrder.items : validation.data, subtotal: Number(createdOrder.subtotal), deliveryFee: Number(createdOrder.delivery_fee), discountAmount: Number(createdOrder.discount_amount), couponCode: Number(createdOrder.discount_amount) > 0 ? (appliedCoupon || null) : null, referralCode: createdOrder.referral_code || null, referralExpiresAt: createdOrder.referral_expires_at || null, discountSource: createdOrder.discount_source || null, total: Number(createdOrder.total), totalBase: Number(createdOrder.total_base ?? createdOrder.total), amountsAreNative, paymentMethod, paymentMethodName: selectedPaymentMethod?.name_ar || selectedPaymentMethod?.name || paymentMethod, deliveryCompany: createdOrder.delivery_company || selectedCompany?.name || "", selectedRegion: regionData?.region_name_ar || selectedRegion || null, country: orderCountryFromPhone(customerPhone), currencyMode: createdOrder.currency_mode || currencyMode, createdAt: createdOrder.created_at || new Date().toISOString() };
      // Keep a short-lived same-tab recovery copy so a refresh on the confirmation page
      // does not discard the newly-created order details. Never place the tracking token in the URL.
      try {
        sessionStorage.setItem("genan-last-order-confirmation", JSON.stringify({
          savedAt: Date.now(),
          orderData,
        }));
      } catch {
        // Navigation state remains the primary path when session storage is unavailable.
      }
      clearCart();
      navigate("/order-confirmation", { state: { orderData } });
      try { sessionStorage.removeItem(requestStorageKey); } catch { /* Storage is optional. */ }
    } catch (error) {
      const rawMessage = error instanceof Error ? error.message : "فشل إرسال الطلب";
      const message = rawMessage.includes("invalid_checkout_phone") || rawMessage.includes("invalid_yemen_phone") ? "أدخل رقم هاتف صحيح. لليمن استخدم 9 أرقام تبدأ بـ7، وللدول الأخرى استخدم رمز الدولة." : rawMessage.includes("order_rate_limit") ? "تم إرسال عدة طلبات خلال فترة قصيرة. حاول مرة أخرى بعد قليل." : rawMessage.includes("guest_order_capacity_limit") ? "إنشاء الطلبات غير متاح مؤقتاً بسبب عدد كبير من المحاولات. حاول بعد قليل." : rawMessage.includes("insufficient_stock") ? "تغير مخزون أحد المنتجات في السلة. راجع الكمية وحاول مرة أخرى." : rawMessage.includes("variant_selection_required") ? "تحقق من اختيار المقاس أو اللون لجميع المنتجات." : rawMessage.includes("referral_code_expired") ? "انتهت صلاحية كود الإحالة (48 ساعة). استخدم كوداً آخر." : rawMessage.includes("referral_discount_already_used") ? "سبق لك الاستفادة من خصم الإحالة، لذلك لا يمكن استخدامه مرة أخرى." : rawMessage.includes("self_referral_not_allowed") ? "لا يمكنك استخدام كود الإحالة الخاص بك." : rawMessage.includes("invalid_coupon") ? "كود الخصم لم يعد صالحاً. أزله أو جرّب كوداً آخر." : rawMessage.includes("invalid_payment_method") ? "طريقة الدفع المختارة غير متاحة حالياً. اختر طريقة دفع أخرى." : rawMessage.includes("invalid_cod_region") ? "الدفع عند الاستلام متاح حاليًا داخل عدن فقط. اختر التحويل البنكي لهذه المحافظة." : rawMessage.includes("invalid_delivery_scope") ? "شركة التوصيل لا تغطي المحافظة المختارة. اختر شركة أخرى." : rawMessage.includes("invalid_delivery_company") || rawMessage.includes("delivery_company_required") ? "شركة التوصيل المختارة غير متاحة حالياً. اختر شركة توصيل أخرى." : rawMessage;
      toast({ title: "تعذر إنشاء الطلب", description: message, variant: "destructive" });
      setIsSubmitting(false);
    }
  };

  if (cart.length === 0) {
    return <div className="min-h-screen bg-white" dir="rtl"><Navbar /><CartDrawer /><main className="mx-auto flex min-h-[65vh] max-w-[1200px] items-center px-5 py-16"><div className="max-w-[420px] border-r-2 border-[#D8C29A] pr-5"><span className="text-[7px] font-semibold tracking-[.24em] text-[#9A825B]">GENAN / CHECKOUT</span><h1 className="mt-3 text-[27px] font-medium tracking-[-.035em] text-[#0E0E0E]">السلة فارغة</h1><p className="mt-2 text-[12px] leading-6 text-[#777]">أضف بعض المنتجات أولًا ثم عد لإتمام طلبك.</p><button type="button" onClick={() => navigate("/products")} className="mt-6 h-12 rounded-2xl bg-burgundy px-6 text-[12px] font-semibold text-white">تصفح المنتجات</button></div></main><Footer /></div>;
  }

  return (
    <div className="min-h-screen bg-[#FAF9F7]" dir="rtl">
      <Navbar /><CartDrawer />
      <main className="pb-12 pt-4 md:pb-16 md:pt-7">
        <div className="mx-auto w-full max-w-[1120px] px-3 sm:px-5 md:px-7">
          <header className="mb-5 flex items-center justify-between gap-3 rounded-3xl bg-white px-4 py-4 shadow-sm sm:px-6">
            <div className="flex items-center gap-3">
              <Link to="/cart" aria-label="العودة إلى سلة التسوق" className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F5F3EF] text-[#171717]"><ChevronRight className="h-5 w-5" /></Link>
              <div>
                <span className="text-[10px] font-medium tracking-[0.17em] text-[#A38960]">GENAN</span>
                <h1 className="text-[19px] font-bold text-[#171717] sm:text-[23px]">إتمام الطلب</h1>
              </div>
            </div>
            <div className="rounded-2xl bg-[#F7F4EE] px-3 py-2 text-left">
              <span className="block text-[10px] text-[#8C6B32]">المجموع</span>
              <strong className="text-[15px] text-[#171717] sm:text-[18px]">{formatCurrency(total)}</strong>
            </div>
          </header>
          <nav aria-label="مراحل إتمام الطلب" className="mb-5 rounded-3xl bg-white px-4 py-5 shadow-sm sm:px-6">
            <div className="mb-4 flex items-center justify-between gap-2">
              <div>
                <p className="text-[11px] text-[#8B795D]">الخطوة {currentStep + 1} من {STEPS.length}</p>
                <h2 className="mt-1 text-[18px] font-bold text-[#171717]">{STEPS[currentStep].label}</h2>
              </div>
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#F2EEE6] text-[#8C6B32]">{(() => { const ActiveIcon = STEPS[currentStep].icon; return <ActiveIcon className="h-5 w-5" />; })()}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {STEPS.map((step, index) => {
                const done = index < currentStep;
                const active = index === currentStep;
                return (
                  <button key={step.key} type="button" disabled={index > currentStep} onClick={() => { if (index < currentStep) setCurrentStep(index); }}
                    aria-current={active ? "step" : undefined}
                    className={`flex min-w-0 flex-col items-center gap-2 rounded-2xl p-2 ${active ? "bg-burgundy text-white" : done ? "bg-[#F3ECDD] text-[#8C6B32]" : "bg-[#F6F6F5] text-[#999]"} disabled:cursor-default`}>
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">{done ? <Check className="h-4 w-4" /> : <step.icon className="h-4 w-4" />}</span>
                    <span className="text-[10px] font-semibold sm:text-[12px]">{step.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>
          <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7"><div className="min-w-0"><section className="overflow-hidden rounded-3xl bg-white shadow-sm">
            {currentStep === 1 && (
              <div className="px-5 pt-6 sm:px-7 md:px-8">
                <label htmlFor="checkout-governorate" className="mb-2 block text-[12px] font-semibold text-[#3F3C37]">المحافظة *</label>
                <select id="checkout-governorate" name="governorate" value={selectedRegion} onChange={(event) => selectGovernorate(event.target.value)} className="h-14 w-full rounded-2xl border border-[#E6DCCB] bg-[#FCFAF7] px-4 text-[13px] text-[#0E0E0E] outline-none focus:border-[#C6B17F]">
                  <option value="">اختر المحافظة</option>
                  {YEMEN_GOVERNORATES.map((governorate) => <option key={governorate} value={governorate}>{governorate}</option>)}
                </select>
                <p className="mt-1.5 text-[6px] leading-5 text-[#777777]">تتحدد شركات التوصيل وطرق الدفع المتاحة حسب المحافظة.</p>
              </div>
            )}
            {currentStep === 2 && (
              <div className="px-5 pt-6 sm:px-7 md:px-8">
                <label htmlFor="checkout-payment-governorate" className="mb-2 block text-[12px] font-semibold text-[#3F3C37]">محافظة التوصيل *</label>
                <select id="checkout-payment-governorate" name="payment_governorate" value={selectedRegion} onChange={(event) => selectGovernorate(event.target.value)} className="h-14 w-full rounded-2xl border border-[#E6DCCB] bg-[#FCFAF7] px-4 text-[13px] text-[#0E0E0E] outline-none focus:border-[#C6B17F]">
                  <option value="">اختر المحافظة</option>
                  {YEMEN_GOVERNORATES.map((governorate) => <option key={governorate} value={governorate}>{governorate}</option>)}
                </select>
                {deliveryScope === "outside" && (
                  <div className="mt-3 flex items-start gap-2 rounded-2xl border border-[#EEDFC4] bg-[#FFF9EF] px-3 py-3">
                    <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B17C37]" strokeWidth={1.5} />
                    <div>
                      <p className="text-[8px] font-semibold text-[#8E6937]">التوصيل إلى {selectedRegion || "المحافظات الأخرى"}</p>
                      <p className="mt-1 text-[7px] leading-5 text-[#8A7659]">الدفع عند الاستلام مفعّل داخل عدن فقط حاليًا؛ للمحافظات الأخرى اختر التحويل البنكي، وستظهر الرسوم والمدة قبل التأكيد.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
            {currentStep === 3 && (
              <div className="px-5 pt-6 sm:px-7 md:px-8">
                <div className="rounded-2xl border border-[#EAEAEA] bg-[#FAF9F7] p-4">
                  <p className="text-[11px] text-[#8C7E79]">المحافظة: <span className="font-semibold text-[#0E0E0E]">{selectedRegion}</span></p>
                  <label className="mt-3 flex cursor-pointer items-start gap-2.5">
                    <input type="checkbox" checked={termsAccepted} onChange={(event) => setTermsAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-burgundy" />
                    <span className="text-[11px] leading-6 text-[#666666]">قرأت وأوافق على <Link to="/terms" target="_blank" className="font-semibold text-burgundy underline underline-offset-2">السياسات والشروط والأحكام</Link> و<Link to="/privacy-policy" target="_blank" className="font-semibold text-burgundy underline underline-offset-2">سياسة الخصوصية</Link> و<Link to="/returns-policy" target="_blank" className="font-semibold text-burgundy underline underline-offset-2">سياسة الاستبدال والاسترجاع</Link>.</span>
                  </label>
                </div>
              </div>
            )}
            {currentStep === 0 && <div className="p-5 sm:p-7 md:p-8"><div className="mb-7 flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4EEE4]"><User className="h-5 w-5 text-[#98733D]" strokeWidth={1.5} /></span><div><h2 className="text-[15px] font-semibold text-[#0E0E0E]">معلوماتك الشخصية</h2><p className="mt-0.5 text-[7px] text-[#777777]">بيانات التواصل الخاصة بالطلب.</p></div></div><div className="mb-5 rounded-3xl bg-[#F6F3EA] p-4 sm:p-5"><p className="mb-3 text-[11px] font-semibold text-[#8C6B32]">01 / التواصل معك</p><div><label className="mb-2 block text-[12px] font-semibold text-[#3F3C37]">رقم الهاتف *</label><input value={isGuestLike ? formData.phone : customer?.phone || ""} onChange={(event) => { if (isGuestLike) setFormData((current) => ({ ...current, phone: event.target.value })); }} disabled={!isGuestLike} placeholder="رقم الهاتف" dir="ltr" inputMode="tel" className="h-14 w-full rounded-2xl border border-[#E6DCCB] bg-[#FCFAF7] px-4 text-left text-[13px] text-[#0E0E0E] outline-none placeholder:text-[#999999] focus:border-[#C6B17F] disabled:bg-[#F7F4F2] disabled:text-[#777777]" /></div></div><div className="grid grid-cols-1 gap-4 md:grid-cols-2"><div><label className="mb-2 block text-[12px] font-semibold text-[#3F3C37]">الاسم الكامل *</label><input value={isGuestLike ? formData.name : customer?.name || ""} onChange={(event) => { if (isGuestLike) setFormData((current) => ({ ...current, name: event.target.value })); }} disabled={!isGuestLike} placeholder="أدخل اسمك" className="h-14 w-full rounded-2xl border border-[#E6DCCB] bg-[#FCFAF7] px-4 text-[13px] text-[#0E0E0E] outline-none placeholder:text-[#999999] focus:border-[#C6B17F] disabled:bg-[#F7F4F2] disabled:text-[#777777]" /></div></div>{isGuestLike && <Link to={customerSignInPath("/checkout")} className="mt-4 inline-block text-[12px] font-medium text-burgundy underline underline-offset-2">سجّلي الدخول لاستخدام عنوانك المحفوظ</Link>}</div>}
            {currentStep === 1 && <div className="p-5 sm:p-7 md:p-8"><div className="mb-7 flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4EEE4]"><MapPin className="h-5 w-5 text-[#98733D]" strokeWidth={1.5} /></span><div><h2 className="text-[16px] font-semibold text-[#0E0E0E]">عنوان التوصيل</h2><p className="mt-0.5 text-[7px] text-[#777777]">أدخل المكان الذي تريد استلام الطلب فيه.</p></div></div>{addressesUnavailable && <p role="status" className="mb-4 text-[12px] text-[#8C6B32]">تعذر تحميل العناوين المحفوظة. يمكنك إدخال عنوانك للمتابعة.</p>}{savedAddresses.length > 0 && <div className="relative mb-4"><label className="mb-2 block text-[12px] font-semibold text-[#3F3C37]">عنوان محفوظ</label><button type="button" onClick={() => setAddressPickerOpen((current) => !current)} className={`flex h-14 w-full items-center justify-between rounded-2xl border bg-[#FAF9F7] px-4 text-right text-[9px] ${addressPickerOpen ? "border-[#C6B17F]" : "border-[#DED8CF]"}`}><div className="min-w-0">{selectedSavedAddress ? <><p className="truncate font-medium text-[#0E0E0E]">{selectedSavedAddress.label}</p><p className="mt-0.5 truncate text-[7px] text-[#777777]">{selectedSavedAddress.city} — {selectedSavedAddress.address}</p></> : <span className="text-[#777777]">إضافة عنوان جديد</span>}</div><ChevronDown className={`h-3.5 w-3.5 shrink-0 text-[#777777] transition-transform ${addressPickerOpen ? "rotate-180" : ""}`} strokeWidth={1.5} /></button>{addressPickerOpen && <><button type="button" onClick={() => setAddressPickerOpen(false)} aria-label="إغلاق قائمة العناوين" className="fixed inset-0 z-[60] cursor-default" /><div className="absolute inset-x-0 top-[68px] z-[70] overflow-hidden rounded-lg border border-[#EAEAEA] bg-white p-1.5 shadow-[0_12px_32px_rgba(50,35,30,0.10)]"><button type="button" onClick={() => selectSavedAddress("")} className={`flex min-h-[48px] w-full items-center justify-between rounded-xl px-3 text-right text-[12px] ${!selectedAddressId ? "bg-burgundy-soft text-burgundy" : "text-[#555555]"}`}><span>عنوان جديد</span>{!selectedAddressId && <Check className="h-3.5 w-3.5" />}</button>{savedAddresses.map((address) => { const active = selectedAddressId === address.id; return <button key={address.id} type="button" onClick={() => selectSavedAddress(address.id)} className={`flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl px-3 text-right ${active ? "bg-burgundy-soft" : "active:bg-[#FAF9F6]"}`}><div className="min-w-0"><p className={`truncate text-[8px] font-medium ${active ? "text-[#0E0E0E]" : "text-[#0E0E0E]"}`}>{address.label}</p><p className="mt-1 truncate text-[6px] text-[#777777]">{address.city} — {address.address}</p></div>{active && <Check className="h-3.5 w-3.5 shrink-0 text-burgundy" />}</button>; })}</div></>}</div>}<div className="grid grid-cols-1 gap-5 md:grid-cols-2"><div><label className="mb-2 block text-[12px] font-semibold text-[#3F3C37]">المدينة *</label><input value={formData.city} onChange={(event) => { setSelectedAddressId(""); setFormData((current) => ({ ...current, city: event.target.value })); }} placeholder="مثال: المنصورة أو المعلا" className="h-14 w-full rounded-2xl border border-[#E6DCCB] bg-[#FCFAF7] px-4 text-[13px] text-[#0E0E0E] outline-none placeholder:text-[#999999] focus:border-[#C6B17F]" /></div><div><label className="mb-2 block text-[12px] font-semibold text-[#3F3C37]">العنوان بالتفصيل *</label><input value={formData.address} onChange={(event) => { setSelectedAddressId(""); setFormData((current) => ({ ...current, address: event.target.value })); }} placeholder="الحي، الشارع، رقم المبنى" className="h-14 w-full rounded-2xl border border-[#E6DCCB] bg-[#FCFAF7] px-4 text-[13px] text-[#0E0E0E] outline-none placeholder:text-[#999999] focus:border-[#C6B17F]" /></div></div><div className="mt-5"><label className="mb-2 block text-[12px] font-semibold text-[#3F3C37]">ملاحظات إضافية <span className="font-normal text-[#999999]">اختياري</span></label><textarea value={formData.notes} onChange={(event) => setFormData((current) => ({ ...current, notes: event.target.value }))} rows={3} placeholder="وقت التسليم المفضل، معلم قريب..." className="w-full resize-none rounded-2xl border border-[#DED8CF] bg-[#FCFAF7] px-4 py-3 text-[12px] leading-6 text-[#0E0E0E] outline-none placeholder:text-[#999999] focus:border-[#C6B17F]" /></div></div>}
            {currentStep === 2 && <div className="p-5 sm:p-7 md:p-8"><div className="mb-7 flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4EEE4]"><CreditCard className="h-5 w-5 text-[#98733D]" strokeWidth={1.5} /></span><div><h2 className="text-[11px] font-semibold text-[#0E0E0E]">الشحن والدفع</h2><p className="mt-0.5 text-[7px] text-[#777777]">اختر نطاق التوصيل ثم شركة التوصيل وطريقة الدفع.</p></div></div><div><div className="mb-3 grid grid-cols-2 gap-2"><button type="button" onClick={() => { if (selectedRegion !== "عدن") selectGovernorate("عدن"); setSelectedDelivery(adenDeliveryCompany?.id || ""); }} className={`min-h-[52px] rounded-2xl border px-4 text-[12px] font-semibold transition-all active:scale-[0.98] ${deliveryScope === "aden" ? "border-burgundy bg-burgundy-soft text-burgundy" : "border-[#DED8CF] bg-white text-[#555555]"}`}>توصيل في عدن</button><button type="button" onClick={() => { if (selectedRegion === "عدن") selectGovernorate(""); setSelectedDelivery(""); setPaymentMethod((current) => current === "cod" || current === "cash" ? "" : current); }} className={`min-h-[52px] rounded-2xl border px-4 text-[12px] font-semibold transition-all active:scale-[0.98] ${deliveryScope === "outside" ? "border-burgundy bg-burgundy-soft text-burgundy" : "border-[#DED8CF] bg-white text-[#555555]"}`}>توصيل خارج عدن</button></div><div className="mb-2.5 flex items-center gap-1.5"><Truck className="h-3.5 w-3.5 text-[#9A825B]" strokeWidth={1.5} /><span className="text-[8px] font-semibold text-[#0E0E0E]">شركة التوصيل *</span></div>{visibleDeliveryCompanies.length > 0 ? <div className="grid grid-cols-1 gap-2 md:grid-cols-2">{visibleDeliveryCompanies.map((company) => { const active = selectedDelivery === company.id; return <button key={company.id} type="button" onClick={() => setSelectedDelivery(company.id)} className={`relative flex min-h-[82px] items-center justify-between rounded-2xl border p-4 text-right shadow-sm transition-all active:scale-[0.99] ${active ? "border-burgundy bg-burgundy-soft" : "border-[#DED8CF] bg-white active:bg-[#FAF9F6]"}`}><div><p className={`text-[9px] font-semibold ${active ? "text-[#0E0E0E]" : "text-[#0E0E0E]"}`}>{company.name}</p><p className="mt-1 text-[7px] text-[#777777]">{formatCurrency(company.base_fee)}{company.delivery_days ? ` • ${company.delivery_days}` : ""}</p></div><span className={`flex h-5 w-5 items-center justify-center rounded-2xl border ${active ? "border-burgundy bg-burgundy" : "border-[#D4CCBC]"}`}>{active && <Check className="h-2.5 w-2.5 text-white" strokeWidth={2.2} />}</span></button>; })}</div> : <div className="flex items-center gap-2 rounded-2xl bg-[#FFFFFF] px-3 py-3"><AlertCircle className="h-3.5 w-3.5 text-[#777777]" /><span className="text-[7px] text-[#777777]">لا توجد شركات توصيل متاحة لهذا الخيار حالياً.</span></div>}</div><div className="mt-5"><p className="mb-2.5 text-[8px] font-semibold text-[#0E0E0E]">طريقة الدفع *</p>{visiblePaymentMethods.length > 0 ? <div className="grid grid-cols-2 gap-2">{visiblePaymentMethods.map((method) => { const active = paymentMethod === method.code; const Icon = method.type === "cash" ? Banknote : CreditCard; return <button key={method.id} type="button" onClick={() => setPaymentMethod(method.code)} className={`relative flex min-h-[86px] flex-col items-start justify-center rounded-2xl border p-4 text-right shadow-sm transition-all active:scale-[0.99] ${active ? "border-burgundy bg-burgundy-soft" : "border-[#DED8CF] bg-white"}`}><Icon className={`h-4 w-4 ${active ? "text-burgundy" : "text-[#777777]"}`} strokeWidth={1.5} /><p className="mt-2 text-[8px] font-semibold text-[#0E0E0E]">{method.name_ar || method.name}</p><p className="mt-0.5 text-[6px] text-[#777777]">{method.name}</p>{active && <span className="absolute left-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-2xl bg-burgundy"><Check className="h-2.5 w-2.5 text-white" /></span>}</button>; })}</div> : <div className="rounded-2xl bg-[#FFFFFF] px-3 py-3 text-[7px] text-[#777777]">لا توجد طرق دفع مفعلة من لوحة الإدارة.</div>}</div>
              {isBankPayment && <CheckoutTransferDetails accounts={bankAccounts} remittance={remittance} />}
              <div className="mt-5 border-t border-[#E7E2D9] pt-4"><div className="mb-2 flex items-center gap-1.5"><Ticket className="h-3.5 w-3.5 text-[#9A825B]" strokeWidth={1.5} /><span className="text-[8px] font-semibold text-[#0E0E0E]">كود الخصم</span><span className="text-[6px] text-[#777777]">اختياري</span></div>{appliedCoupon ? <div className="flex min-h-[46px] items-center justify-between gap-3 rounded-2xl border border-[#CFE1D2] bg-[#F5FAF6] px-3"><div className="flex min-w-0 items-center gap-2"><span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-2xl bg-[#6F9576]"><Check className="h-3 w-3 text-white" /></span><div className="min-w-0"><p className="truncate text-[8px] font-semibold text-[#54745A]">{appliedCoupon}</p><p className="mt-0.5 text-[6px] text-[#77907B]">خصم {formatCurrency(discountAmount)}</p></div></div><button type="button" onClick={removeCoupon} className="flex h-9 items-center gap-1 rounded-xl px-3 text-[11px] font-medium text-[#A45D5D] active:bg-white"><X className="h-3 w-3" />إزالة</button></div> : <div className="flex gap-2"><input value={couponCode} onChange={(event) => setCouponCode(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void applyCoupon(); }} placeholder="أدخل الكود" dir="ltr" className="h-12 min-w-0 flex-1 rounded-2xl border border-[#DED8CF] bg-white px-3 text-left text-[8px] uppercase text-[#0E0E0E] outline-none placeholder:text-[#999999] focus:border-[#C6B17F]" /><button type="button" onClick={applyCoupon} className="h-12 shrink-0 rounded-2xl border border-[#D8C29A] bg-[#F3ECDD] px-5 text-[12px] font-semibold text-[#0E0E0E] active:bg-[#FAFAFA]">تطبيق</button></div>}</div></div>}
            {currentStep === 3 && <div className="p-5 sm:p-7 md:p-8"><div className="mb-7 flex items-center gap-3"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F4EEE4]"><Check className="h-5 w-5 text-[#98733D]" strokeWidth={1.7} /></span><div><h2 className="text-[11px] font-semibold text-[#0E0E0E]">مراجعة الطلب</h2><p className="mt-0.5 text-[7px] text-[#777777]">راجع معلوماتك قبل التأكيد النهائي.</p></div></div><div className="border-b border-[#E7E2D9] py-3 first:pt-0"><p className="text-[7px] font-medium text-[#777777]">معلومات التواصل</p><p className="mt-1.5 text-[9px] font-medium text-[#0E0E0E]">{customer?.name || formData.name}</p><p dir="ltr" className="mt-1 text-right text-[7px] text-[#777777]">{customer?.phone || formData.phone}</p></div><div className="border-b border-[#E7E2D9] py-3"><p className="text-[7px] font-medium text-[#777777]">عنوان التوصيل</p><p className="mt-1.5 text-[9px] leading-5 text-[#0E0E0E]">{formData.city} — {formData.address}</p>{formData.notes && <p className="mt-1 text-[7px] leading-5 text-[#777777]">ملاحظات: {formData.notes}</p>}</div><div className="border-b border-[#E7E2D9] py-3"><p className="text-[7px] font-medium text-[#777777]">الشحن والدفع</p><p className="mt-1.5 text-[9px] text-[#0E0E0E]">{selectedCompany?.name || "—"} <span className="mx-1 text-[#C9BDB8]">•</span> {selectedPaymentMethod?.name_ar || selectedPaymentMethod?.name || "—"}</p>{appliedCoupon && <p className="mt-1.5 text-[7px] font-medium text-[#5C8063]">كوبون {appliedCoupon} — خصم {formatCurrency(discountAmount)}</p>}</div><div className="pt-3"><p className="mb-3 text-[7px] font-medium text-[#777777]">المنتجات</p><div className="space-y-3">{cart.map((item, index) => { const price = item.product.discount ? item.product.price * (1 - item.product.discount / 100) : item.product.price; const accessoriesTotal = item.selectedAccessories?.reduce((sum, accessory) => sum + accessory.price * accessory.quantity, 0) || 0; const color = item.selectedColor || item.variantColor; return <div key={`${item.product.id}-${index}`} className="flex items-center gap-3"><div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-xl border border-[#E7E1D5] bg-[#FFFFFF] p-1"><img src={optimizeImage(item.product.images?.[0] || "/placeholder.svg", 200, 80)} alt={item.product.nameAr || ""} loading="lazy" decoding="async" onError={handleImageError} className="h-full w-full object-contain object-center" /></div><div className="min-w-0 flex-1"><p className="truncate text-[8px] font-medium text-[#0E0E0E]">{item.product.nameAr}</p><div className="mt-1 flex flex-wrap gap-x-2 gap-y-1 text-[6px] text-[#777777]"><span>الكمية: {item.quantity}</span>{item.selectedSize && <span>المقاس: {item.selectedSize}</span>}{color && <span>اللون: {color}</span>}</div></div><span className="shrink-0 text-[8px] font-semibold text-[#0E0E0E]">{formatCurrency((price + accessoriesTotal) * item.quantity)}</span></div>; })}</div></div></div>}
          </section><div className="mt-4 flex items-center justify-between gap-2 rounded-3xl bg-white p-3 shadow-sm sm:p-4"><button type="button" onClick={prevStep} disabled={currentStep === 0} className="flex h-12 min-w-[108px] items-center justify-center gap-1.5 rounded-2xl border border-[#E4DCCD] bg-white px-4 text-[12px] font-semibold text-[#555555] disabled:cursor-not-allowed disabled:opacity-35"><ChevronRight className="h-3.5 w-3.5" strokeWidth={1.5} />السابق</button>{currentStep < STEPS.length - 1 ? <button type="button" onClick={nextStep} className="flex h-12 min-w-[108px] items-center justify-center gap-1.5 rounded-2xl bg-burgundy shadow-[0_8px_20px_rgba(14,14,14,0.15)] px-5 text-[12px] font-semibold text-white hover:bg-burgundy-hover active:bg-burgundy-hover">التالي<ChevronLeft className="h-3.5 w-3.5" strokeWidth={1.5} /></button> : <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex h-[52px] min-w-[175px] items-center justify-center gap-2 rounded-2xl bg-burgundy shadow-[0_8px_20px_rgba(14,14,14,0.15)] px-5 text-[12px] font-semibold text-white hover:bg-burgundy-hover active:bg-burgundy-hover disabled:cursor-not-allowed disabled:opacity-50">{isSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}{isSubmitting ? "جارٍ إنشاء الطلب" : "تأكيد الطلب النهائي"}</button>}</div></div>
          <aside className="min-w-0 lg:sticky lg:top-24 lg:self-start"><div className="overflow-hidden rounded-3xl border border-[#E8DFD2] bg-white shadow-[0_14px_36px_rgba(28,22,12,0.055)]"><div className="border-b border-[#E7E2D9] px-4 py-3.5"><div className="flex items-center justify-between"><h2 className="text-[10px] font-semibold text-[#0E0E0E]">ملخص الطلب</h2><span className="text-[6px] text-[#777777]">{cart.length} {cart.length === 1 ? "منتج" : "منتجات"}</span></div></div><div className="max-h-[280px] overflow-y-auto px-4 [scrollbar-width:thin]">{cart.map((item, index) => { const price = item.product.discount ? item.product.price * (1 - item.product.discount / 100) : item.product.price; const accessoriesTotal = item.selectedAccessories?.reduce((sum, accessory) => sum + accessory.price * accessory.quantity, 0) || 0; const color = item.selectedColor || item.variantColor; return <div key={`${item.product.id}-${index}`} className={`flex items-center gap-3 py-3 ${index !== cart.length - 1 ? "border-b border-[#E7E2D9]" : ""}`}><div className="flex h-[60px] w-[60px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-[#E7E1D5] bg-[#FFFFFF] p-1"><img src={optimizeImage(item.product.images?.[0] || "/placeholder.svg", 200, 80)} alt={item.product.nameAr || ""} loading="lazy" decoding="async" onError={handleImageError} className="h-full w-full object-contain object-center" /></div><div className="min-w-0 flex-1"><p className="truncate text-[7.5px] font-medium leading-5 text-[#0E0E0E]">{item.product.nameAr}</p><div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[6px] text-[#777777]"><span>الكمية {item.quantity}</span>{item.selectedSize && <><span className="text-[#DADADA]">•</span><span>{item.selectedSize}</span></>}{color && <><span className="text-[#DADADA]">•</span><span className="max-w-[60px] truncate">{color}</span></>}</div></div><span className="shrink-0 text-[7px] font-semibold text-[#0E0E0E]">{formatCurrency((price + accessoriesTotal) * item.quantity)}</span></div>; })}</div><div className="border-t border-[#E7E2D9] px-4 py-4"><div className="space-y-2.5"><div className="flex items-center justify-between text-[7px] text-[#666666]"><span>المجموع الفرعي</span><span>{formatCurrency(subtotal)}</span></div><div className="flex items-center justify-between text-[7px] text-[#666666]"><span>رسوم التوصيل</span><span>{deliveryFee > 0 ? formatCurrency(deliveryFee) : "—"}</span></div>{discountAmount > 0 && <div className="flex items-center justify-between text-[7px] font-medium text-[#63806A]"><span>{appliedCoupon ? "خصم الكود" : "خصم إطلاق جنان 10%"}</span><span>-{formatCurrency(discountAmount)}</span></div>}</div><div className="mt-4 flex items-end justify-between border-t border-[#E7E2D9] pt-3"><div><span className="block text-[7px] text-[#777777]">الإجمالي</span><span className="mt-0.5 block text-[6px] text-[#999999]">شامل رسوم التوصيل</span></div><span className="text-[15px] font-bold text-[#D8C29A]">{formatCurrency(total)}</span></div></div></div><div className="mt-2 flex items-center justify-center gap-2 py-2 text-[6px] text-[#777777]"><Check className="h-3 w-3 text-[#6F9275]" strokeWidth={1.7} />بيانات طلبك تُرسل بشكل آمن</div></aside></div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default CheckoutPage;

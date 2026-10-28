import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, ExternalLink, Package, Plus, Settings, ShoppingBag, Store, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminPath } from "@/lib/adminRoutes";

const shortcuts = [
  { title: "إضافة منتج", subtitle: "أضف منتجًا جديدًا للمتجر", href: adminPath("products/new"), icon: Plus },
  { title: "إدارة الطلبات", subtitle: "متابعة الطلبات والشحن", href: adminPath("orders"), icon: ShoppingBag },
  { title: "المنتجات والمخزون", subtitle: "الأسعار والكميات والمقاسات", href: adminPath("products"), icon: Package },
  { title: "مظهر المتجر", subtitle: "تعديل البانرات وأقسام الموقع", href: adminPath("banners"), icon: Store },
  { title: "العملاء", subtitle: "إدارة حسابات العملاء", href: adminPath("customers"), icon: Users },
  { title: "التقارير", subtitle: "المبيعات والأداء العام", href: adminPath("reports"), icon: BarChart3 },
];

const AdminOverviewHome = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["genan-admin-overview-counts"],
    queryFn: async () => {
      const [orders, products, customers] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }),
        supabase.from("products").select("id", { count: "exact", head: true }),
        supabase.from("customers").select("id", { count: "exact", head: true }),
      ]);
      return {
        orders: orders.error ? null : orders.count,
        products: products.error ? null : products.count,
        customers: customers.error ? null : customers.count,
      };
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
    retry: 1,
  });

  const metrics = [
    { title: "إجمالي الطلبات", value: data?.orders, href: adminPath("orders"), icon: ShoppingBag },
    { title: "عدد المنتجات", value: data?.products, href: adminPath("products"), icon: Package },
    { title: "العملاء", value: data?.customers, href: adminPath("customers"), icon: Users },
  ];

  return (
    <div className="space-y-6 pb-8">
      <header className="relative isolate overflow-hidden rounded-[24px] bg-[#203027] px-5 py-8 text-white shadow-[0_15px_50px_rgba(26,40,31,.12)] sm:px-9 sm:py-10">
        <div aria-hidden="true" className="pointer-events-none absolute -left-12 -top-20 h-[270px] w-[270px] rounded-full border border-[#C7A774]/20" />
        <p dir="ltr" className="relative text-left text-[11px] font-semibold tracking-[.18em] text-[#D9C08F]">GENAN / MANAGEMENT</p>
        <h1 className="relative mt-4 text-[28px] font-bold text-white sm:text-[34px]">إدارة بوتيك جنان</h1>
        <p className="relative mt-3 max-w-[530px] text-[13px] leading-7 text-[#D9E2DA]">كل ما تحتاجه لإدارة المنتجات والطلبات والعملاء في مكان واحد.</p>
        <div className="relative mt-6 flex flex-wrap items-center gap-3">
          <Link to={adminPath("products/new")} className="inline-flex h-[45px] items-center gap-2 rounded-xl bg-[#C5A776] px-5 text-[13px] font-bold text-[#203027] transition-colors hover:bg-[#E0C48F]"><Plus className="h-4 w-4" />إضافة منتج</Link>
          <a href="/home" target="_blank" rel="noopener noreferrer" className="inline-flex h-[45px] items-center gap-2 rounded-xl border border-[#728574] px-4 text-[12px] font-semibold text-white transition-colors hover:bg-white/10"><ExternalLink className="h-4 w-4" />عرض المتجر</a>
        </div>
      </header>

      <section aria-label="ملخص نشاط المتجر" className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {metrics.map(item => {
          const Icon = item.icon;
          return (
            <Link key={item.href} to={item.href} className="flex items-center justify-between rounded-[19px] border border-[#E8E0D4] bg-white px-5 py-5 shadow-[0_6px_26px_rgba(26,34,28,.04)] transition-colors hover:border-[#CDB68E]">
              <div>
                <p className="text-[12px] font-medium text-[#7F877C]">{item.title}</p>
                <p className="mt-2 text-[28px] font-bold tabular-nums text-[#253128]">{isLoading ? "…" : typeof item.value === "number" ? item.value.toLocaleString("en-US") : "—"}</p>
              </div>
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F3EBDE] text-[#83643D]"><Icon className="h-[22px] w-[22px]" strokeWidth={1.75} /></span>
            </Link>
          );
        })}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-[11px] font-semibold text-[#99794B]">العمليات اليومية</p>
            <h2 className="mt-1 text-[22px] font-bold text-[#253128]">وصول سريع</h2>
          </div>
          <Link to={adminPath("settings")} className="inline-flex items-center gap-2 text-[12px] font-medium text-[#7D6543] hover:underline"><Settings className="h-4 w-4" />الإعدادات</Link>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shortcuts.map(item => {
            const Icon = item.icon;
            return (
              <Link key={item.href} to={item.href} className="group flex min-h-[102px] items-center gap-4 rounded-[18px] border border-[#E9E1D5] bg-white p-4 transition-colors hover:border-[#CCB187] hover:bg-[#FFFDF9]">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F2E9D9] text-[#7D623C] group-hover:bg-[#E9D9BD]"><Icon className="h-[21px] w-[21px]" /></span>
                <span className="min-w-0 flex-1"><span className="block text-[14px] font-semibold text-[#253128]">{item.title}</span><span className="mt-1 block text-[11px] leading-5 text-[#606C62]">{item.subtitle}</span></span>
                <ArrowLeft className="h-4 w-4 shrink-0 text-[#BCA786]" />
              </Link>
            );
          })}
        </div>
      </section>

      <section className="flex flex-col gap-3 rounded-[18px] border border-[#E9DBC3] bg-[#F5ECDE] px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-[14px] font-semibold text-[#332D23]">المؤشرات التفصيلية</h2>
          <p className="mt-1 text-[12px] leading-6 text-[#7E776C]">صفحة التحليل الكاملة متاحة عند الحاجة دون ازدحام الرئيسية.</p>
        </div>
        <Link to={adminPath() + "?workspace=analytics"} className="inline-flex h-[43px] shrink-0 items-center justify-center gap-2 rounded-xl bg-[#26372C] px-5 text-[12px] font-semibold text-white hover:bg-[#364A3B]"><BarChart3 className="h-4 w-4" />عرض المؤشرات</Link>
      </section>
    </div>
  );
};

export default AdminOverviewHome;

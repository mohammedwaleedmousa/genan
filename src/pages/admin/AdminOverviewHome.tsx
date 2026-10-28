import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowLeft, ArrowUpLeft, BarChart3, Boxes, ChevronLeft, ExternalLink,
  Image as ImageIcon, Package, Plus, Settings2, ShoppingBag, Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminPath } from "@/lib/adminRoutes";

const primaryTasks = [
  { number: "01", title: "إضافة قطعة جديدة", detail: "ابدأ بإدخال الصور والمقاسات والأسعار", href: adminPath("products/new"), icon: Plus },
  { number: "02", title: "متابعة الطلبات", detail: "حالات الطلبات والتجهيز والتوصيل", href: adminPath("orders"), icon: ShoppingBag },
  { number: "03", title: "تنظيم الكتالوج", detail: "المنتجات والكميات والأقسام", href: adminPath("products"), icon: Boxes },
];

const supportingTasks = [
  { title: "الهوية والمحتوى", href: adminPath("banners"), icon: ImageIcon },
  { title: "إدارة العملاء", href: adminPath("customers"), icon: Users },
  { title: "التقارير والتحليلات", href: adminPath("reports"), icon: BarChart3 },
  { title: "إعدادات المتجر", href: adminPath("settings"), icon: Settings2 },
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
    { label: "إجمالي الطلبات", value: data?.orders, href: adminPath("orders"), icon: ShoppingBag },
    { label: "المنتجات في الكتالوج", value: data?.products, href: adminPath("products"), icon: Package },
    { label: "العملاء المسجلون", value: data?.customers, href: adminPath("customers"), icon: Users },
  ];

  return (
    <div dir="rtl" className="genan-studio-home space-y-7 pb-12 lg:space-y-9">
      {/* Bespoke split masthead: visual hierarchy instead of an old KPI dashboard hero. */}
      <header className="genan-home-hero grid min-h-[300px] overflow-hidden lg:grid-cols-[minmax(0,1.5fr)_minmax(250px,.8fr)]">
        <div className="relative flex flex-col justify-between p-6 sm:p-9 lg:p-11">
          <div>
            <div className="flex items-center gap-3">
              <span className="h-[1px] w-10 bg-[#90734E]" aria-hidden="true" />
              <span dir="ltr" className="text-[11px] font-semibold tracking-[.22em] text-[#685537]">GENAN / MANAGEMENT</span>
            </div>
            <p className="mt-7 text-[13px] font-semibold text-[#7C6649]">مكتب إدارة البوتيك</p>
            <h1 className="mt-3 max-w-2xl text-[33px] font-semibold leading-[1.35] tracking-tight text-[#1D2923] sm:text-[43px] lg:text-[49px]">كل تفاصيل جنان،
              <span className="block font-normal text-[#806B50]">في مساحة واحدة.</span>
            </h1>
          </div>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to={adminPath("products/new")} className="inline-flex min-h-[47px] items-center justify-center gap-2 rounded-2xl bg-[#23382E] px-5 text-[13px] font-semibold text-white shadow-[0_6px_18px_rgba(25,44,31,.13)] transition-colors hover:bg-[#3B5043]">
              <Plus className="h-4 w-4" /> إضافة منتج <ArrowUpLeft className="h-4 w-4" />
            </Link>
            <a href="/home" target="_blank" rel="noopener noreferrer" className="inline-flex min-h-[47px] items-center justify-center gap-2 rounded-2xl border border-[#BDAA90] bg-white/65 px-5 text-[13px] font-semibold text-[#26362C] transition-colors hover:bg-white">
              <ExternalLink className="h-4 w-4" /> مشاهدة المتجر
            </a>
          </div>
        </div>
        <div className="relative flex min-h-[200px] flex-col justify-between overflow-hidden bg-[#263C30] p-7 text-[#F3ECE0] sm:p-9 lg:p-10">
          <div className="absolute -bottom-20 -left-12 h-[255px] w-[255px] rounded-full border border-[#C8B18B]/25" aria-hidden="true" />
          <div className="absolute -bottom-8 left-1 h-[180px] w-[180px] rounded-full border border-[#C8B18B]/20" aria-hidden="true" />
          <div className="relative flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[.2em] text-[#D4BE9A]" dir="ltr">THE ATELIER</span>
            <span className="h-2 w-2 rounded-full bg-[#D5B780]" aria-hidden="true" />
          </div>
          <div className="relative mt-12">
            <span className="block font-serif text-[82px] font-normal leading-[.8] tracking-tighter text-[#D2B98E]" dir="ltr">G.</span>
            <div className="mt-6 h-px w-16 bg-[#AB9066]" />
            <p className="mt-5 max-w-[270px] text-[13px] leading-7 text-[#E5DFD4]">ركّز على اختيار المنتجات وخدمة العملاء؛ واترك باقي التفاصيل تحت سيطرتك.</p>
          </div>
        </div>
      </header>

      {/* Three figures in a single ruled strip, not isolated gradient KPI cards. */}
      <section aria-label="لمحة سريعة" className="genan-home-metrics">
        <div className="grid grid-cols-1 sm:grid-cols-3">
          {metrics.map((metric, index) => {
            const Icon = metric.icon;
            return (
              <Link key={metric.href} to={metric.href} className="group flex items-center justify-between gap-5 px-6 py-7 sm:px-7 sm:py-7">
                <div>
                  <div className="flex items-center gap-2 text-[#6C705F]">
                    <span className="font-mono text-[10px] text-[#9D845D]">0{index + 1}</span>
                    <span className="text-[12px] font-semibold">{metric.label}</span>
                  </div>
                  <p className="mt-3 text-[37px] font-medium leading-none tabular-nums text-[#1C2C24] sm:text-[43px]">{isLoading ? "—" : typeof metric.value === "number" ? metric.value.toLocaleString("en-US") : "—"}</p>
                </div>
                <Icon className="h-[29px] w-[29px] shrink-0 text-[#98794B] transition-transform group-hover:-translate-y-1" strokeWidth={1.3} />
              </Link>
            );
          })}
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(290px,.8fr)] lg:gap-6">
        <section className="min-w-0">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <span className="text-[11px] font-semibold tracking-[.08em] text-[#8D714B]">العمل اليومي</span>
              <h2 className="mt-2 text-[27px] font-semibold text-[#1D2923] sm:text-[30px]">من أين تبدأ؟</h2>
            </div>
            <span className="text-[11px] text-[#6B746A]">الخطوات الأكثر استخدامًا</span>
          </div>
          <div className="genan-primary-workflow">
            {primaryTasks.map(task => {
              const Icon = task.icon;
              return (
                <Link key={task.number} to={task.href} className="group flex min-h-[104px] items-center gap-4 px-5 py-5 sm:gap-6 sm:px-6">
                  <span className="w-7 shrink-0 font-mono text-[13px] text-[#A18866]">{task.number}</span>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#F5EFE4] text-[#765E3D]"><Icon className="h-5 w-5" strokeWidth={1.6} /></span>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-[16px] font-semibold text-[#253128] sm:text-[18px]">{task.title}</h3>
                    <p className="mt-1 text-[12px] leading-6 text-[#616B60]">{task.detail}</p>
                  </div>
                  <ArrowLeft className="h-5 w-5 shrink-0 text-[#796243] transition-transform group-hover:-translate-x-1" />
                </Link>
              );
            })}
          </div>
        </section>

        <section className="genan-tools-panel p-5 sm:p-7">
          <span className="text-[11px] font-semibold tracking-[.1em] text-[#8C7049]" dir="ltr">TOOLS / 04</span>
          <h2 className="mt-3 text-[24px] font-semibold text-[#223128]">أدوات المتجر</h2>
          <p className="mt-2 text-[12px] leading-6 text-[#697166]">إجراءات إضافية تظل قريبة دون ازدحام مساحة العمل.</p>
          <div className="mt-6 space-y-2 border-t border-[#DED3C3] pt-3">
            {supportingTasks.map(link => {
              const Icon = link.icon;
              return (
                <Link key={link.href} to={link.href} className="group flex min-h-[54px] items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-[#364339] transition-colors hover:bg-white/85">
                  <Icon className="h-[18px] w-[18px] shrink-0 text-[#8C714C]" strokeWidth={1.6} />
                  <span className="flex-1">{link.title}</span>
                  <ChevronLeft className="h-4 w-4 text-[#8E7B61] transition-transform group-hover:-translate-x-1" />
                </Link>
              );
            })}
          </div>
          <Link to={adminPath() + "?workspace=analytics"} className="mt-7 flex min-h-[48px] items-center justify-between rounded-2xl bg-[#25392F] px-5 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#3C5041]">
            <span className="flex items-center gap-2"><BarChart3 className="h-4 w-4" /> المؤشرات التفصيلية</span>
            <ArrowUpLeft className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
};

export default AdminOverviewHome;

import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { ArrowLeft, ArrowUpLeft, Clock3, ExternalLink, Package, Plus, RefreshCw, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { adminPath } from "@/lib/adminRoutes";

type QueueOrder = { id: string; order_number: string | null; customer_name: string | null; created_at: string; status: string };
type UnavailableProduct = { id: string; name: string | null; name_ar: string | null };
const orderStatus: Record<string, { label: string; color: string }> = {
  pending: { label: "بانتظار التأكيد", color: "bg-[#FFF2DA] text-[#7C551D]" },
  confirmed: { label: "مؤكد", color: "bg-[#EDF3FA] text-[#3E6185]" },
  processing: { label: "قيد التجهيز", color: "bg-[#EAF4EC] text-[#386B47]" },
};
const dateLabel = (date: string) => {
  const value = new Date(date);
  return Number.isNaN(value.getTime()) ? "—" : new Intl.DateTimeFormat("ar-YE", { day: "numeric", month: "short" }).format(value);
};

const AdminOverviewHome = () => {
  const queue = useQuery({
    queryKey: ["genan-admin-workqueue"],
    queryFn: async () => {
      const [waiting, preparing, latest] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("orders").select("id", { count: "exact", head: true }).in("status", ["confirmed", "processing"]),
        supabase.from("orders")
          .select("id,order_number,customer_name,created_at,status")
          .in("status", ["pending", "confirmed", "processing"])
          .order("created_at", { ascending: false })
          .limit(6),
      ]);
      if (waiting.error) throw waiting.error;
      if (preparing.error) throw preparing.error;
      if (latest.error) throw latest.error;
      return {
        waiting: waiting.count ?? 0,
        preparing: preparing.count ?? 0,
        latest: (latest.data ?? []) as QueueOrder[],
      };
    },
    staleTime: 20_000,
    refetchInterval: 45_000,
    retry: 1,
  });

  const inventory = useQuery({
    queryKey: ["genan-admin-unavailable-products"],
    queryFn: async () => {
      const [count, products] = await Promise.all([
        supabase.from("products").select("id", { count: "exact", head: true }).eq("is_active", true).eq("in_stock", false),
        supabase.from("products").select("id,name,name_ar").eq("is_active", true).eq("in_stock", false).order("name").limit(5),
      ]);
      if (count.error) throw count.error;
      if (products.error) throw products.error;
      return { total: count.count ?? 0, products: (products.data ?? []) as UnavailableProduct[] };
    },
    staleTime: 45_000,
    refetchInterval: 90_000,
    retry: 1,
  });

  const refresh = () => {
    void queue.refetch();
    void inventory.refetch();
  };

  return (
    <div className="genan-daily-desk space-y-5 pb-9" dir="rtl">
      <header className="flex flex-col justify-between gap-4 rounded-[25px] border border-[#E6E0D6] bg-[#FFFEFB] px-5 py-6 shadow-[0_6px_24px_rgba(32,43,33,.035)] sm:flex-row sm:items-end sm:px-8 sm:py-7">
        <div className="min-w-0">
          <p className="mb-2 text-[11px] font-semibold text-[#937548]">لوحة التشغيل</p>
          <h1 className="text-[28px] font-bold leading-[1.35] text-[#223429] sm:text-[34px]">ما الذي يحتاج متابعتك؟</h1>
          <p className="mt-2 text-[13px] leading-6 text-[#697469]">الطلبات والمخزون أولاً؛ بدون إحصاءات أو أقسام لا تحتاجها يوميًا.</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <button type="button" onClick={refresh} aria-label="تحديث البيانات"
            disabled={queue.isFetching || inventory.isFetching}
            className="inline-flex min-h-[43px] items-center gap-2 rounded-xl border border-[#E0D8CA] bg-[#FAF8F2] px-4 text-[12px] font-semibold text-[#4E5D4E] hover:bg-[#EEE8DC] disabled:opacity-60">
            <RefreshCw className={"h-4 w-4 " + (queue.isFetching || inventory.isFetching ? "animate-spin" : "")} /> تحديث
          </button>
          <Link to={adminPath("products/new")} className="inline-flex min-h-[43px] items-center gap-2 rounded-xl bg-[#263C30] px-5 text-[12px] font-semibold text-white hover:bg-[#395141]">
            <Plus className="h-4 w-4" /> إضافة منتج
          </Link>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)]">
        <section className="overflow-hidden rounded-[24px] border border-[#E7E0D6] bg-[#FFFEFC] shadow-[0_8px_28px_rgba(35,42,32,.045)]" aria-labelledby="genan-workorders-title">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EEE8DE] px-5 py-5 sm:px-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#EAF1EA] text-[#345744]"><ShoppingBag className="h-[19px] w-[19px]" /></span>
              <div><h2 id="genan-workorders-title" className="text-[17px] font-bold text-[#29392D]">طلبات تحتاج متابعة</h2>
                <p className="mt-1 text-[11px] text-[#727A71]">أحدث الطلبات المفتوحة</p></div>
            </div>
            <Link to={adminPath("orders")} className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#79603A] hover:underline">كل الطلبات <ArrowUpLeft className="h-4 w-4" /></Link>
          </div>

          <div className="grid grid-cols-2 border-b border-[#EEE8DE] bg-[#FBF9F4]">
            <Link to={adminPath("orders")} className="flex items-center justify-between gap-3 border-l border-[#EAE2D6] px-5 py-4 hover:bg-[#F4EDE1]">
              <div><p className="text-[11px] font-medium text-[#626C61]">بانتظار التأكيد</p>
                <p className="mt-1 text-[25px] font-bold tabular-nums text-[#725327]">{queue.isLoading ? "…" : queue.isError ? "—" : queue.data?.waiting}</p></div>
              <Clock3 className="h-5 w-5 text-[#B28E51]" />
            </Link>
            <Link to={adminPath("orders")} className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-[#F4EDE1]">
              <div><p className="text-[11px] font-medium text-[#626C61]">مؤكدة أو قيد التجهيز</p>
                <p className="mt-1 text-[25px] font-bold tabular-nums text-[#2F5940]">{queue.isLoading ? "…" : queue.isError ? "—" : queue.data?.preparing}</p></div>
              <Package className="h-5 w-5 text-[#5F8269]" />
            </Link>
          </div>

          <div className="divide-y divide-[#EEEAE3]">
            {queue.isError ? <p className="px-6 py-8 text-[13px] text-[#9E4E41]">تعذر جلب الطلبات. استخدم زر التحديث للمحاولة مجددًا.</p> :
             queue.isLoading ? <p className="px-6 py-9 text-center text-[13px] text-[#758076]">جاري تحميل الطلبات...</p> :
             queue.data?.latest.length ? queue.data.latest.map(order => {
               const state = orderStatus[order.status] ?? { label: order.status, color: "bg-[#F1F1EE] text-[#596259]" };
               return (
                 <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-[#FAF8F3] sm:px-6">
                   <div className="min-w-0 flex-1">
                     <p className="truncate text-[13px] font-semibold text-[#24352A]">{order.customer_name?.trim() || "عميل بدون اسم"}</p>
                     <p className="mt-1 text-[11px] text-[#7A8276]"><span dir="ltr" className="inline-block">{order.order_number || order.id.slice(0, 8)}</span> · {dateLabel(order.created_at)}</p>
                   </div>
                   <span className={"rounded-full px-3 py-1.5 text-[11px] font-semibold " + state.color}>{state.label}</span>
                 </div>
               );
             }) : <div className="px-6 py-10 text-center">
               <p className="text-[14px] font-semibold text-[#394A3D]">لا توجد طلبات مفتوحة حالياً</p>
               <p className="mt-2 text-[12px] text-[#798477]">سيظهر هنا أي طلب يحتاج متابعة.</p>
             </div>}
          </div>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-[#E7E0D6] bg-[#FFFEFC] shadow-[0_8px_28px_rgba(35,42,32,.045)]" aria-labelledby="genan-inventory-title">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EEE8DE] px-5 py-5">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-[14px] bg-[#F5EBDD] text-[#8C6738]"><Package className="h-[19px] w-[19px]" /></span>
              <div><h2 id="genan-inventory-title" className="text-[17px] font-bold text-[#29392D]">منتجات غير متوفرة</h2>
                <p className="mt-1 text-[11px] text-[#727A71]">المنتجات النشطة المسجلة كغير متوفرة</p></div>
            </div>
            <span className="rounded-full bg-[#F5ECDD] px-3 py-1 text-[13px] font-bold tabular-nums text-[#8B6432]">
              {inventory.isLoading ? "…" : inventory.isError ? "—" : inventory.data?.total}
            </span>
          </div>
          <div className="divide-y divide-[#EFEAE2]">
            {inventory.isError ? <p className="px-5 py-8 text-[13px] text-[#9E4E41]">تعذر جلب بيانات المنتجات.</p> :
             inventory.isLoading ? <p className="px-5 py-9 text-center text-[13px] text-[#758076]">جاري تحميل المخزون...</p> :
             inventory.data?.products.length ? inventory.data.products.map(product => (
               <Link to={adminPath("products/" + product.id)} key={product.id} className="group flex min-h-[68px] items-center gap-3 px-5 py-3.5 hover:bg-[#FAF8F3]">
                 <span className="h-2 w-2 shrink-0 rounded-full bg-[#CA9962]" />
                 <span className="min-w-0 flex-1 truncate text-[13px] font-medium text-[#334336]">{product.name_ar || product.name || "منتج بدون اسم"}</span>
                 <ArrowLeft className="h-4 w-4 shrink-0 text-[#9A8B73] transition-transform group-hover:-translate-x-1" />
               </Link>
             )) : <div className="px-5 py-10 text-center">
               <p className="text-[14px] font-semibold text-[#394A3D]">لا توجد منتجات نشطة غير متوفرة</p>
               <p className="mt-2 text-[12px] text-[#798477]">المنتجات المتاحة لا تظهر في هذه القائمة.</p>
             </div>}
          </div>
          <Link to={adminPath("products")} className="flex min-h-[51px] items-center justify-center gap-2 border-t border-[#EEE8DE] bg-[#FBF8F2] text-[12px] font-semibold text-[#79603A] hover:bg-[#F3EBDE]">
            إدارة المنتجات <ArrowUpLeft className="h-4 w-4" />
          </Link>
        </section>
      </div>
      <p className="px-1 text-[11px] text-[#7D857A]">تُحدَّث البيانات تلقائيًا، ويمكنك تحديثها يدويًا من الأعلى. التفاصيل المالية والتقارير متاحة من القائمة الجانبية.</p>
    </div>
  );
};

export default AdminOverviewHome;

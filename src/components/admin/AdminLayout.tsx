import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Loader2, LockKeyhole } from "lucide-react";
import AdminLayoutBase from "@/components/admin/AdminLayoutBase";
import { supabase } from "@/integrations/supabase/client";
import { ADMIN_LOGIN_PATH, adminPath, normalizeAdminPathForLegacyRules } from "@/lib/adminRoutes";

type RoutePermission =
  | "products.view"
  | "products.edit"
  | "inventory.view"
  | "inventory.adjust"
  | "orders.view"
  | "orders.manage"
  | "customers.view"
  | "marketing.manage"
  | "finance.manage"
  | "reports.view"
  | "settings.manage"
  | "admin.permissions.manage";

type PermissionSnapshot = {
  userId: string;
  isAdmin: boolean;
  values: Map<string, boolean>;
  expiresAt: number;
};

const PERMISSION_CACHE_TTL_MS = 60_000;
let permissionSnapshot: PermissionSnapshot | null = null;
let permissionSnapshotPromise: { userId: string; promise: Promise<PermissionSnapshot | null> } | null = null;

const permissionForLocation = (pathname: string, search: string): RoutePermission | null => {
  pathname = normalizeAdminPathForLegacyRules(pathname);

  if (pathname === "/admin") {
    const workspace = new URLSearchParams(search).get("workspace");
    if (workspace === "team") return "admin.permissions.manage";
    if (workspace === "publishing") return "marketing.manage";
    if (workspace === "preparation") return "orders.view";
    return null;
  }

  if (pathname === "/admin/products") return "products.view";
  if (pathname.startsWith("/admin/products/") || pathname.startsWith("/admin/categories") || pathname.startsWith("/admin/brands") || pathname.startsWith("/admin/brand-category-map") || pathname.startsWith("/admin/catalog-") || pathname.startsWith("/admin/size-price-rules")) return "products.edit";
  if (pathname.startsWith("/admin/inventory-adjustments")) return "inventory.adjust";
  if (pathname.startsWith("/admin/orders")) return "orders.view";
  if (pathname.startsWith("/admin/delivery") || pathname.startsWith("/admin/reviews") || pathname.startsWith("/admin/product-questions")) return "orders.manage";
  if (pathname.startsWith("/admin/customers")) return "customers.view";

  if (
    pathname.startsWith("/admin/banners") ||
    pathname.startsWith("/admin/sections") ||
    pathname.startsWith("/admin/content") ||
    pathname.startsWith("/admin/brand-pages") ||
    pathname.startsWith("/admin/brand-sections") ||
    pathname.startsWith("/admin/brand-filters") ||
    pathname.startsWith("/admin/customer-experience") ||
    pathname.startsWith("/admin/campaigns") ||
    pathname.startsWith("/admin/offers") ||
    pathname.startsWith("/admin/coupons") ||
    pathname.startsWith("/admin/customer-notifications") ||
    pathname.startsWith("/admin/notification-deliveries")
  ) return "marketing.manage";

  if (
    pathname.startsWith("/admin/invoices") ||
    pathname.startsWith("/admin/payment-methods") ||
    pathname.startsWith("/admin/expenses") ||
    pathname.startsWith("/admin/ledger") ||
    pathname.startsWith("/admin/refunds") ||
    pathname.startsWith("/admin/currencies") ||
    pathname.startsWith("/admin/countries") ||
    pathname.startsWith("/admin/cod-regions")
  ) return "finance.manage";

  if (pathname.startsWith("/admin/reports") || pathname.startsWith("/admin/analytics") || pathname.startsWith("/admin/revenue") || pathname.startsWith("/admin/profit-report") || pathname.startsWith("/admin/finance") || pathname.startsWith("/admin/customer-intelligence")) return "reports.view";
  if (pathname.startsWith("/admin/settings") || pathname.startsWith("/admin/audit-log")) return "settings.manage";
  return null;
};

const loadPermissionSnapshot = async (): Promise<PermissionSnapshot | null> => {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;

  const userId = sessionData.session?.user?.id;
  if (!userId) return null;

  if (permissionSnapshot?.userId === userId && permissionSnapshot.expiresAt > Date.now()) {
    return permissionSnapshot;
  }

  if (permissionSnapshotPromise?.userId === userId) return permissionSnapshotPromise.promise;

  const snapshotPromise = (async () => {
    const { data: isAdmin, error: adminError } = await supabase.rpc("is_current_user_admin");
    if (adminError) throw adminError;

    if (isAdmin !== true) {
      const deniedSnapshot: PermissionSnapshot = {
        userId,
        isAdmin: false,
        values: new Map<string, boolean>(),
        expiresAt: Date.now() + PERMISSION_CACHE_TTL_MS,
      };
      permissionSnapshot = deniedSnapshot;
      return deniedSnapshot;
    }

    const { data, error } = await supabase
      .from("admin_user_permissions")
      .select("permission, granted")
      .eq("user_id", userId);

    if (error) throw error;

    const values = new Map<string, boolean>();
    (data ?? []).forEach((row) => values.set(String(row.permission), row.granted !== false));

    permissionSnapshot = {
      userId,
      isAdmin: true,
      values,
      expiresAt: Date.now() + PERMISSION_CACHE_TTL_MS,
    };

    return permissionSnapshot;
  })();

  permissionSnapshotPromise = { userId, promise: snapshotPromise };

  try {
    return await snapshotPromise;
  } finally {
    if (permissionSnapshotPromise?.promise === snapshotPromise) {
      permissionSnapshotPromise = null;
    }
  }
};

const resolveAdminPermission = async (permission: RoutePermission | null) => {
  const snapshot = await loadPermissionSnapshot();
  if (!snapshot || !snapshot.isAdmin) return false;

  // Do not apply a permission snapshot if the active session changed while it loaded.
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw sessionError;
  if (sessionData.session?.user?.id !== snapshot.userId) return false;

  if (!permission) return true;
  return snapshot.values.get(permission) !== false;
};

const prefetchPrimaryAdminRoutes = () => {
  void Promise.allSettled([
    import("@/pages/admin/AdminOrdersWithNotesPage"),
    import("@/pages/admin/AdminProductsPage"),
    import("@/pages/admin/AdminCustomersPage"),
    import("@/pages/admin/reports/ReportsOverviewPage"),
    import("@/pages/admin/reports/ReportsCustomersPage"),
  ]);
};

const adminInteractiveColorOverrides = `
  .admin-workspace .btn-unified {
    background: linear-gradient(135deg, #B59A6D 0%, #987746 100%) !important;
    border-color: #987746 !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
    transform: none !important;
  }

  .admin-workspace .btn-unified:hover {
    background: linear-gradient(135deg, #99784D 0%, #7E6037 100%) !important;
    border-color: #7E6037 !important;
    color: #FFFFFF !important;
    box-shadow: none !important;
    transform: none !important;
  }

  .admin-workspace .btn-unified[data-variant="outline"] {
    background: #FFFFFF !important;
    border-color: #E7DED1 !important;
    color: #5F6874 !important;
  }

  .admin-workspace .btn-unified[data-variant="outline"]:hover {
    background: #F5F6FB !important;
    border-color: #DCCAAE !important;
    color: #6E552D !important;
  }

  .admin-workspace .btn-unified[data-variant="secondary"] {
    background: #F6ECDA !important;
    border-color: #E5D3B4 !important;
    color: #6E552D !important;
  }

  .admin-workspace .btn-unified[data-variant="secondary"]:hover {
    background: #EDE2CB !important;
    border-color: #D5C3A4 !important;
    color: #563F22 !important;
  }

  .admin-workspace .btn-unified[data-variant="ghost"] {
    background: transparent !important;
    border-color: transparent !important;
    color: #626A75 !important;
  }

  .admin-workspace .btn-unified[data-variant="ghost"]:hover {
    background: #F2F4F7 !important;
    border-color: #E3E7EC !important;
    color: #4D5560 !important;
  }

  .admin-workspace .btn-unified[data-variant="destructive"] {
    background: #C95F5F !important;
    border-color: #B95353 !important;
    color: #FFFFFF !important;
  }

  .admin-workspace .btn-unified[data-variant="destructive"]:hover {
    background: #B95353 !important;
    border-color: #A94A4A !important;
    color: #FFFFFF !important;
  }

  .admin-workspace button[class*="bg-[#AE756C]"],
  .admin-workspace a[class*="bg-[#AE756C]"],
  .admin-workspace [role="button"][class*="bg-[#AE756C]"] {
    background-color: #99784D !important;
    color: #FFFFFF !important;
  }

  .admin-workspace button[class*="bg-[#FFF0F1]"],
  .admin-workspace button [class*="bg-[#FFF0F1]"],
  .admin-workspace a[class*="bg-[#FFF0F1]"],
  .admin-workspace a [class*="bg-[#FFF0F1]"],
  .admin-workspace [role="button"][class*="bg-[#FFF0F1]"],
  .admin-workspace [role="button"] [class*="bg-[#FFF0F1]"],
  .admin-workspace button[class*="bg-[#FFF0F4]"],
  .admin-workspace button [class*="bg-[#FFF0F4]"],
  .admin-workspace button[class*="bg-[#FBDDE6]"],
  .admin-workspace button [class*="bg-[#FBDDE6]"],
  .admin-workspace button[class*="bg-[#FFF3F6]"],
  .admin-workspace button [class*="bg-[#FFF3F6]"],
  .admin-workspace button[class*="bg-[#FBE1E8]"],
  .admin-workspace button [class*="bg-[#FBE1E8]"],
  .admin-workspace button[class*="bg-[#FFF7F9]"],
  .admin-workspace button [class*="bg-[#FFF7F9]"],
  .admin-workspace a[class*="bg-[#FFF0F4]"],
  .admin-workspace a [class*="bg-[#FFF0F4]"],
  .admin-workspace a[class*="bg-[#FBDDE6]"],
  .admin-workspace a [class*="bg-[#FBDDE6]"],
  .admin-workspace [role="button"] [class*="bg-[#FFF0F4]"],
  .admin-workspace [role="button"] [class*="bg-[#FBDDE6]"] {
    background-color: #F6ECDA !important;
  }

  .admin-workspace button[class*="text-[#B96670]"],
  .admin-workspace button [class*="text-[#B96670]"],
  .admin-workspace a[class*="text-[#B96670]"],
  .admin-workspace a [class*="text-[#B96670]"],
  .admin-workspace [role="button"][class*="text-[#B96670]"],
  .admin-workspace [role="button"] [class*="text-[#B96670]"],
  .admin-workspace button[class*="text-[#C66E82]"],
  .admin-workspace button [class*="text-[#C66E82]"],
  .admin-workspace button[class*="text-[#B85D72]"],
  .admin-workspace button [class*="text-[#B85D72]"],
  .admin-workspace button[class*="text-[#AE756C]"],
  .admin-workspace button [class*="text-[#AE756C]"],
  .admin-workspace button[class*="text-[#B15B70]"],
  .admin-workspace button [class*="text-[#B15B70]"],
  .admin-workspace button[class*="text-[#BC6377]"],
  .admin-workspace button [class*="text-[#BC6377]"],
  .admin-workspace a[class*="text-[#C66E82]"],
  .admin-workspace a [class*="text-[#C66E82]"],
  .admin-workspace a[class*="text-[#B85D72]"],
  .admin-workspace a [class*="text-[#B85D72]"] {
    color: #99784D !important;
  }

  .admin-workspace button[class*="border-[#EFD7DF]"],
  .admin-workspace a[class*="border-[#EFD7DF]"],
  .admin-workspace [role="button"][class*="border-[#EFD7DF]"] {
    border-color: #E4E0F8 !important;
  }

  .admin-workspace button[role="combobox"] {
    border-color: #E7DED1 !important;
    background: #F8FAFC !important;
    color: #59634D !important;
    box-shadow: none !important;
  }

  .admin-workspace button[role="combobox"]:hover {
    border-color: #CBD3DC !important;
    background: #F3F5F8 !important;
  }

  .admin-workspace button[role="combobox"][data-state="open"] {
    border-color: #B69C70 !important;
    background: #FFFFFF !important;
    box-shadow: 0 0 0 3px rgba(103, 92, 186, 0.10) !important;
  }

  [role="listbox"] {
    border: 1px solid #E7DED1 !important;
    border-radius: 10px !important;
    background: #FFFFFF !important;
    padding: 4px !important;
    color: #4F5864 !important;
    box-shadow: 0 14px 30px rgba(52, 61, 75, 0.14) !important;
  }

  [role="option"] {
    min-height: 34px;
    border-radius: 8px !important;
    background: transparent !important;
    color: #535D68 !important;
    transition: background-color 120ms ease, color 120ms ease !important;
  }

  [role="option"][data-highlighted] {
    background: #F8F1E3 !important;
    color: #6E552D !important;
  }

  [role="option"][data-state="checked"] {
    background: #F4E8D3 !important;
    color: #6E552D !important;
    font-weight: 600 !important;
  }

  [role="option"][data-state="checked"][data-highlighted] {
    background: #EBDCBD !important;
    color: #563F22 !important;
  }

  [role="option"] svg {
    color: #99784D !important;
  }
`;

const AdminLayout = () => {
  const location = useLocation();
  const requiredPermission = useMemo(() => permissionForLocation(location.pathname, location.search), [location.pathname, location.search]);
  const [checking, setChecking] = useState(true);
  const [allowed, setAllowed] = useState(false);
  const [authRevision, setAuthRevision] = useState(0);

  useEffect(() => {
    const warmTimer = window.setTimeout(() => {
      void loadPermissionSnapshot().catch((error) => console.error("Admin permission warmup failed:", error));
      prefetchPrimaryAdminRoutes();
    }, 250);

    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        permissionSnapshot = null;
        permissionSnapshotPromise = null;
        setAuthRevision((revision) => revision + 1);
      }
    });

    return () => {
      window.clearTimeout(warmTimer);
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    let active = true;

    const check = async () => {
      setChecking(true);
      try {
        const granted = await resolveAdminPermission(requiredPermission);
        if (active) setAllowed(granted);
      } catch (error) {
        console.error("Admin route permission check failed:", error);
        if (active) setAllowed(false);
      } finally {
        if (active) setChecking(false);
      }
    };

    void check();
    return () => { active = false; };
  }, [requiredPermission, authRevision]);

  if (checking) {
    return <div className="fixed inset-0 grid place-items-center bg-[#F7F6F2]" dir="rtl"><div className="text-center"><Loader2 className="mx-auto h-5 w-5 animate-spin text-[#99784D]" /><p className="mt-2 text-[8px] text-[#8E96A1]">جاري التحقق من صلاحية الصفحة...</p></div></div>;
  }

  if (!allowed) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-[#F7F6F2] px-5" dir="rtl">
        <div className="w-full max-w-[420px] rounded-[18px] border border-[#E5E9EF] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-[#F6ECDA] text-[#99784D]"><LockKeyhole className="h-[19px] w-[19px]" /></div>
          <h1 className="mt-4 text-[13px] font-semibold text-[#404852]">لا تملك صلاحية فتح هذه الصفحة</h1>
          <p className="mt-2 text-[8px] leading-6 text-[#8E96A1]">الصلاحية المطلوبة: <span dir="ltr" className="font-mono">{requiredPermission}</span>. يمكن لمدير الصلاحيات إعادة تفعيلها من مساحة الفريق.</p>
          <Link to={ADMIN_LOGIN_PATH} className="mt-5 inline-flex h-[34px] items-center justify-center rounded-[9px] bg-[#99784D] px-4 text-[8px] font-semibold text-white">العودة إلى تسجيل الدخول</Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{adminInteractiveColorOverrides}</style>
      <div aria-hidden="true" className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-[3px] bg-[#B99A66]" />
      <AdminLayoutBase />
    </>
  );
};

export default AdminLayout;
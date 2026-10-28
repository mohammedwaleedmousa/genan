import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { adminPath } from "@/lib/adminRoutes";
import { ArrowRight, CalendarClock, ShieldCheck, Sparkles } from "lucide-react";
import AdminDashboardBase from "@/pages/admin/AdminDashboardBase";
import AdminOverviewHome from "@/pages/admin/AdminOverviewHome";
import AdminCommandCenterPage from "@/pages/admin/AdminCommandCenterPage";
import AdminOrderPreparationPage from "@/pages/admin/AdminOrderPreparationPage";
import AdminPublishingWorkspacePage from "@/pages/admin/AdminPublishingWorkspacePage";
import AdminTeamPermissionsPage from "@/pages/admin/AdminTeamPermissionsPage";

const AdminDashboard = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const workspace = searchParams.get("workspace");

  const interceptPreparationLinks = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor?.getAttribute("href") !== "/admin/order-preparation") return;
    event.preventDefault();
    navigate(`${adminPath()}?workspace=preparation`);
  };

  if (workspace === "analytics") return <div className="space-y-4"><WorkspaceNav /><AdminDashboardBase /></div>;

  if (workspace === "command-center") {
    return (
      <div className="space-y-3" onClickCapture={interceptPreparationLinks}>
        <WorkspaceNav />
        <AdminCommandCenterPage />
      </div>
    );
  }

  if (workspace === "preparation") {
    return (
      <div className="space-y-3">
        <WorkspaceNav />
        <AdminOrderPreparationPage />
      </div>
    );
  }

  if (workspace === "publishing") {
    return (
      <div className="space-y-3">
        <WorkspaceNav />
        <AdminPublishingWorkspacePage />
      </div>
    );
  }

  if (workspace === "team") {
    return (
      <div className="space-y-3">
        <WorkspaceNav />
        <AdminTeamPermissionsPage />
      </div>
    );
  }

  return <AdminOverviewHome />;
};

const WorkspaceNav = () => (
  <div className="print:hidden flex flex-wrap items-center gap-[6px]">
    <Link to={adminPath()} className="inline-flex h-[31px] items-center gap-[6px] rounded-[8px] border border-[#E3E7EC] bg-white px-[9px] text-[7.5px] font-semibold text-[#747C86] transition hover:bg-[#F8FAFC] hover:text-[#4D5560]"><ArrowRight className="h-[11px] w-[11px]" />لوحة التحكم</Link>
    <Link to={adminPath() + "?workspace=analytics"} className="inline-flex h-[31px] items-center gap-[6px] rounded-[8px] border border-[#E2D5BC] bg-[#F6EDDD] px-[9px] text-[10px] font-semibold text-[#755A33]"><Sparkles className="h-[11px] w-[11px]" />المؤشرات</Link>
    <Link to={`${adminPath()}?workspace=command-center`} className="inline-flex h-[31px] items-center gap-[6px] rounded-[8px] border border-[#E4D7C0] bg-white px-[9px] text-[7.5px] font-semibold text-[#926D3E] transition hover:bg-[#FAF3E7]"><Sparkles className="h-[11px] w-[11px]" />مركز الأدمن</Link>
    <Link to={`${adminPath()}?workspace=publishing`} className="inline-flex h-[31px] items-center gap-[6px] rounded-[8px] border border-[#E3E7EC] bg-white px-[9px] text-[7.5px] font-semibold text-[#747C86] transition hover:bg-[#F8FAFC] hover:text-[#557CA9]"><CalendarClock className="h-[11px] w-[11px]" />النشر والجدولة</Link>
    <Link to={`${adminPath()}?workspace=team`} className="inline-flex h-[31px] items-center gap-[6px] rounded-[8px] border border-[#E3E7EC] bg-white px-[9px] text-[7.5px] font-semibold text-[#747C86] transition hover:bg-[#F8FAFC] hover:text-[#568468]"><ShieldCheck className="h-[11px] w-[11px]" />الفريق والصلاحيات</Link>
  </div>
);

export default AdminDashboard;
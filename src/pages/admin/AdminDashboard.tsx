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

const WorkspaceNav = () => {
  const [params] = useSearchParams();
  const current = params.get("workspace");
  const tabs = [
    { title: "الرئيسية", to: adminPath(), key: null, icon: ArrowRight },
    { title: "المؤشرات", to: adminPath() + "?workspace=analytics", key: "analytics", icon: Sparkles },
    { title: "مركز الإدارة", to: adminPath() + "?workspace=command-center", key: "command-center", icon: Sparkles },
    { title: "النشر", to: adminPath() + "?workspace=publishing", key: "publishing", icon: CalendarClock },
    { title: "الصلاحيات", to: adminPath() + "?workspace=team", key: "team", icon: ShieldCheck },
  ];
  return (
    <nav aria-label="التنقل بين مساحات الإدارة" className="flex max-w-full flex-wrap items-center gap-2 overflow-x-auto rounded-[20px] border border-[#E8DFD2] bg-[#FFFEFA] p-2 shadow-[0_4px_18px_rgba(38,49,40,.035)] [scrollbar-width:thin] print:hidden">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const selected = current === tab.key;
        return (
          <Link key={tab.title} to={tab.to} aria-current={selected ? "page" : undefined}
            className={selected
              ? "flex min-h-[44px] shrink-0 items-center gap-2 rounded-[13px] bg-[#26392F] px-4 text-[12px] font-semibold text-white shadow-[0_4px_12px_rgba(30,52,37,.12)]"
              : "flex min-h-[44px] shrink-0 items-center gap-2 rounded-[13px] px-4 text-[12px] font-medium text-[#586357] transition-colors hover:bg-[#F1ECE4]"}
          >
            <Icon className="h-[15px] w-[15px]" />
            <span>{tab.title}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default AdminDashboard;
import { Navigate, useSearchParams } from "react-router-dom";
import { adminPath } from "@/lib/adminRoutes";
import AdminOverviewHome from "@/pages/admin/AdminOverviewHome";

/** One daily desk. Legacy query-string workspaces now resolve to their
 * actual destination, avoiding parallel dashboards that repeat the sidebar. */
const AdminDashboard = () => {
  const [params] = useSearchParams();
  const workspace = params.get("workspace");

  if (workspace === "analytics") return <Navigate to={adminPath("reports")} replace />;
  if (workspace === "command-center" || workspace === "preparation") return <Navigate to={adminPath("orders")} replace />;
  if (workspace === "publishing") return <Navigate to={adminPath("banners")} replace />;
  if (workspace === "team") return <Navigate to={adminPath("team")} replace />;

  return <AdminOverviewHome />;
};

export default AdminDashboard;

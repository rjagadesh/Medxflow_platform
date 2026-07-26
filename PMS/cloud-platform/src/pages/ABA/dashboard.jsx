import ChartSection from "@/features/ABA/analytics-charts";
import DashboardStats from "@/features/ABA/dashboard-stats";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import { useGetHubMetrics } from "@/hooks/query/droid-studio/metrics";
import UnauthorizedPage from "../unauthorized";

const ABAdashboard = () => {
  const { data: metrics } = useGetHubMetrics();
  const { hasPermission } = usePermissions();

  if (!hasPermission("droidstudio_dashboard_view", "view")) {
    return <UnauthorizedPage />;
  }

  return (
    <>
      <main className="pt-0">
        <DashboardStats metrics={metrics} />
        <ChartSection chartData={metrics} />
      </main>
    </>
  );
};

export default ABAdashboard;

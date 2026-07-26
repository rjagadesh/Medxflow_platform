import { JsonCopyPopover } from "@/components/json-popover/json-popover";
import PatientPerformanceMetrics from "@/features/patient-intake/performance-metrics";
import RecentRequests from "@/features/patient-intake/recent-request";
import PatientStatsCards from "@/features/patient-intake/stats";
import { useGetColumnSettingsByTableName } from "@/hooks/query/admin/useGetColumnSettingsByTableName";

const ClaimsProcessingDashboard = () => {
  const { data = [] } = useGetColumnSettingsByTableName("claim_processing");

  const columnData = data?.[0]?.columns;
  const columnTypes = columnData.reduce((acc, field) => {
    acc[field.id] = "string"; // assuming all values are strings
    return acc;
  }, {});
  return (
    <div className="pt-4">
      <PatientStatsCards />
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mt-6">
        <div className="xl:col-span-2">
          <RecentRequests
            rightAction={<JsonCopyPopover data={columnTypes} />}
          />
        </div>
        <div className="xl:col-span-1">
          <PatientPerformanceMetrics />
        </div>
      </div>{" "}
    </div>
  );
};

export default ClaimsProcessingDashboard;

import { Box, Text } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { ErrorBoundary } from "react-error-boundary";
import FeatureGrid from "@/features/home/home-card";
import { useGetDepartments } from "@/hooks/query/useGetDepartments";
import { useGetAgents } from "@/hooks/query/useGetAgents";
import { atobDepartmentId } from "@/utils/helper";
import UtilsSideBar from "@/layouts/Layout/utilities";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import UnauthorizedPage from "./unauthorized";

/* ---------------- Fallback UI ---------------- */
function Fallback({ error, resetErrorBoundary }) {
  return (
    <Box className="flex flex-col items-center justify-center p-6 bg-droidal-black-300 text-white rounded-lg min-h-[150px]">
      <Text fontSize="lg" fontWeight="bold">
        Something went wrong
      </Text>
      <Text fontSize="sm" mt={2}>
        {error.message}
      </Text>
      <button
        onClick={resetErrorBoundary}
        className="mt-4 px-4 py-2 bg-white text-black rounded"
      >
        Try again
      </button>
    </Box>
  );
}

const HomeApps = ({ customUrl = "", customButtonName = "" }) => {
  const { department_id } = useParams();

  const { data: departments = [] } = useGetDepartments();
  const { hasPermission } = usePermissions();
  const departmentId =
    department_id !== "utilities" ? atobDepartmentId(department_id) : null;
  const {
    data: agents,
    isLoading,
    isPlaceholderData,
  } = useGetAgents({ module_id: departmentId });

  console.log("departments", departments, agents);

  const currentDepartment = departments.find(
    (department) => department.id === Number(departmentId),
  );

  if (!hasPermission("monitoring_dashboard", "view")) {
    return <UnauthorizedPage />;
  }

  return (
    <ErrorBoundary FallbackComponent={Fallback}>
      {/* Content */}
      <div className="mt-0">
        {department_id === "utilities" && <UtilsSideBar />}
        {department_id !== "utilities" && (
          <ErrorBoundary
            FallbackComponent={Fallback}
            onReset={() => window.location.reload()}
          >
            <FeatureGrid
              appName={currentDepartment?.module_name}
              agents={agents}
              departmentId={department_id}
              loading={isLoading || isPlaceholderData}
              customUrl={customUrl}
              customButtonName={customButtonName}
            />
          </ErrorBoundary>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default HomeApps;

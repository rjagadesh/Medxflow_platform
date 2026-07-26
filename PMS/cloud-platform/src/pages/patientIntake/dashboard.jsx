import RecentRequests from "@/features/patient-intake/recent-request";
import PatientStatsCards from "@/features/patient-intake/stats";
import { useGetAPIkey } from "@/hooks/query/agentsapp/useGetAPIkey";
import { useParams } from "react-router-dom";
import { parseAsString, useQueryState } from "nuqs";
import { useGetColumnData } from "@/hooks/query/admin/useGetColumnData";
import { atobAgentId } from "@/utils/helper";
import UnauthorizedPage from "../unauthorized";

const PatientDashboard = () => {
  const { department_id, agent_app } = useParams();
  const agentId = atobAgentId(agent_app);
  const [statusQuery, setStatusQuery] = useQueryState(
    "status",
    parseAsString.withDefault(""),
  );

  const { data: { api_key = "" } = {} } = useGetAPIkey(agentId);
  const { data: selectedAppData = {}, isLoading: headerLoading } =
    useGetColumnData(agentId);
  console.log("selectedAppData", selectedAppData);

  if (department_id === "voice-ai-MTA=") {
    return <UnauthorizedPage />;
  }

  return (
    <div className="pt-4 h-full">
      <PatientStatsCards
        selectedAppData={selectedAppData}
        api_key={api_key}
        onChangeStatus={setStatusQuery}
      />
      <div className="mt-8">
        <RecentRequests
          agent_app={agent_app}
          api_key={api_key}
          status={statusQuery}
          selectedAppData={selectedAppData}
          headerLoading={headerLoading}
        />
      </div>
    </div>
  );
};

export default PatientDashboard;

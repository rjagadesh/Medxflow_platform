import { useQuery } from "@tanstack/react-query";
import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import axios from "axios";

// Custom hook to fetch and download CSV
export const useExportAgentTasks = (agent_id) => {
  return useQuery({
    queryKey: ["export-agent-tasks", agent_id],
    queryFn: async () => {
      const response = await axios(apiRoutes.agentsRequest.export?.url, {
        responseType: "blob",
        params: {
          agent_id,
        },
        headers: {
          Authorization: "Bearer " + localStorage.getItem("access"),
        },
      });
      console.log("response999", response.data);

      // Create a download link dynamically
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "agent_tasks.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      return true; // just return success flag
    },
    enabled: false, // we will trigger manually
  });
};

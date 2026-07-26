import { apiRoutes } from "@/services/api";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

// Custom hook to fetch and download CSV
export const useExportAgentTasks = (agent_id, range) => {
  return useQuery({
    queryKey: ["export-agent-tasks", agent_id],
    queryFn: async () => {
      // ✅ Defensive check to avoid backend 400s
      if (!range || !range[0]?.startDate || !range[0]?.endDate) {
        throw new Error("Please Provide Start And End Date");
      }

      const token = localStorage.getItem("access");

      const response = await axios.get(apiRoutes.agentsRequest.export?.url, {
        responseType: "blob", // expect CSV
        params: {
          agent_id,
          params: JSON.stringify([
            {
              startDate: range[0].startDate,
              endDate: range[0].endDate,
            },
          ]),
          time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // ✅ Handle case where backend returns a plain message
      // (sometimes Django returns a string response)
      if (
        typeof response.data === "string" &&
        response.data.includes("Please Provide Start And End Date")
      ) {
        throw new Error("Please Provide Start And End Date");
      }

      // ✅ Trigger download
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "agent_tasks.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      return true;
    },
    enabled: false, // run manually via refetch()
    retry: false,
  });
};
// apiRoutes.agentsRequest.export?.url

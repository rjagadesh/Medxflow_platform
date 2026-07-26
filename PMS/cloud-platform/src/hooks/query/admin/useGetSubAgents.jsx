import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useSubAgents = ({ app_id, enabled }) => {
  console.log("app_id9999", app_id, "enabled", enabled);
  return useQuery({
    queryKey: [`sub-agents-${app_id}`, app_id],
    enabled: enabled,
    queryFn: () =>
      apiRequest(apiRoutes.sub_agents.all, {
        params: {
          app_id: app_id,
        },
      }),
  });
};

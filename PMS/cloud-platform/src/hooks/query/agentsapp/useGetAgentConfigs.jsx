import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAgentConfigs = (data) => {
  return useQuery({
    queryKey: ["agent-configs"],
    enabled: !!data.app_id && !!data.client_id,
    queryFn: () =>
      apiRequest(apiRoutes.agentConfig.get, {
        payload: data,
      }),
    placeholderData: {
      response: [],
    },
  });
};

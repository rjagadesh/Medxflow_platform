import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAPIkey = (agent_id) => {
  return useQuery({
    queryKey: [`${agent_id}-api-key`, agent_id],
    queryFn: () =>
      apiRequest(apiRoutes.apiKey.appName, {
        params: { agent_id },
      }),
  });
};

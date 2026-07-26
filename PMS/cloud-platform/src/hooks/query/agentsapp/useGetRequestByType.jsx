import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetRequestByType = (agent_id) => {
  return useQuery({
    queryKey: ["request_by_type", agent_id],
    enabled: !!agent_id,
    queryFn: () =>
      apiRequest(apiRoutes.agentsRequest.requestByType, {
        params: { agent_id },
      }),
  });
};

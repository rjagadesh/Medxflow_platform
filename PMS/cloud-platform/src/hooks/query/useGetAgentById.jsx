import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAgentById = (agentId) => {
  return useQuery({
    queryKey: ["agent_by_id + " + agentId],
    enabled: !!agentId,
    staleTime: 10000,
    queryFn: () =>
      apiRequest(apiRoutes.apps.getById, {
        metadata: { id: agentId },
      }),
    placeholderData: {},
  });
};

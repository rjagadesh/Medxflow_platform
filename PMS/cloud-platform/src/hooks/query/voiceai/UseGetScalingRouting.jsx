import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetScalingRouting = (agentVersionId) => {
  return useQuery({
    queryKey: ["uscalingrouting", agentVersionId],
    enabled: !!agentVersionId,
    queryFn: () =>
      apiRequest(apiRoutes.voiceai.getScaling, {
        params: { agent_version: agentVersionId },
      }),
  });
};

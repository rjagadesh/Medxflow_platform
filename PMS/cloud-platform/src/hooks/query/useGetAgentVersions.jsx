import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAgentVersions = (agentId) => {
  return useQuery({
    queryKey: ["agent_versions", agentId],
    enabled: !!agentId,
    queryFn: () =>
      apiRequest(apiRoutes.voiceAI.versions.all, {
        params: { app: agentId },
      }),
    staleTime: 0,
    gcTime: 0,
  });
};

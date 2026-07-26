import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAgentVersionsByApp = (appId) => {
  return useQuery({
    queryKey: ["agent_versions_by_app", appId],
    enabled: !!appId,
    queryFn: () =>
      apiRequest(apiRoutes.voiceAI.versions.all, {
        params: { app: appId },
      }),
  });
};

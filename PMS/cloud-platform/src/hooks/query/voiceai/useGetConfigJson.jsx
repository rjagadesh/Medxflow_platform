import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetConfigJson = (params) => {
  return useQuery({
    queryKey: ["config-json", params.agent_version_id],
    enabled: !!params.agent_version_id,
    retry: false,
    staleTime: 0,
    gcTime: 0,
    queryFn: () =>
      apiRequest(apiRoutes.voiceAI.jsonConfig.get, {
        params,
      }),
  });
};

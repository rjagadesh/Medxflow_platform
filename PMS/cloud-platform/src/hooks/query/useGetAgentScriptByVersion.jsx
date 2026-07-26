import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAgentScriptByVersion = (versionId) => {
  return useQuery({
    queryKey: ["agent_script_by_version", versionId],
    enabled: !!versionId,
    staleTime: 0,
    gcTime: 0,
    queryFn: () =>
      apiRequest(apiRoutes.voiceAI.scripts.getByVersion, {
        params: { version_id: versionId },
      }),
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateAgentVersionStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, version_number, app_id }) =>
      apiRequest(apiRoutes.voiceAI.versions.updateStatus, {
        metadata: { id },
        payload: { status, version_number, app: app_id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent_versions"]);
      queryClient.invalidateQueries(["agent_versions_by_app"]);
    },
  });
};

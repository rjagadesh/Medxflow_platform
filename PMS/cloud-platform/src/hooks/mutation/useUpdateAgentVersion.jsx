import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateAgentVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      apiRequest(apiRoutes.voiceAI.versions.update, {
        metadata: { id },
        payload: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent_versions"]);
      queryClient.invalidateQueries(["agentVersionsByApp"]);
    },
  });
};

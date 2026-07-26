import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateAgentScript = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      apiRequest(apiRoutes.voiceAI.scripts.update, {
        payload: data,
        metadata: { id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent_scripts"]);
      queryClient.invalidateQueries(["agents"]);
    },
  });
};

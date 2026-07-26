import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateAgentPrompt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) =>
      apiRequest(apiRoutes.voiceAI.prompts.update, {
        payload: data,
        metadata: { id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent_prompts"]);
      queryClient.invalidateQueries(["agents"]);
    },
  });
};

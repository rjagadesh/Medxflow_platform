import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateAgentPrompt = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.prompts.create, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent_prompts"]);
      queryClient.invalidateQueries(["agents"]);
    },
  });
};

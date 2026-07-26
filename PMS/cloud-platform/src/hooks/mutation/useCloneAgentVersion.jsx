import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCloneAgentVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.versions.clone, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent_versions"]);
      queryClient.invalidateQueries(["agent_prompts"]);
      queryClient.invalidateQueries(["telephony_settings"]);
    },
  });
};

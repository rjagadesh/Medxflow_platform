import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateAgentScript = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.scripts.create, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent_scripts"]);
      queryClient.invalidateQueries(["agents"]);
    },
  });
};

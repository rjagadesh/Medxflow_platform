import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateAgentVersion = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.versions.create, { payload: data }),
    onSuccess: (data, variables) => {
      if (variables.agent || variables.app) {
        queryClient.invalidateQueries([
          "agent_versions",
          variables.agent || variables.app,
        ]);
      }
    },
  });
};

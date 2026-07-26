import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateAgentConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.agentConfig.update, {
        payload: data,
        metadata: { id: data.id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent-configs"]);
    },
  });
};

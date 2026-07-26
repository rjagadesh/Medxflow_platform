import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateAgentConfig = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.agentConfig.create, {
        payload: data,
        header: {
          ContentType: "multipart/form-data",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["agent-configs"]);
    },
  });
};

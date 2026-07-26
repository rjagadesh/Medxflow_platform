import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateConfigJson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.jsonConfig.create, {
        payload: data,
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["config-json", variables.app]);
    },
  });
};

export const useUpdateConfigJson = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.jsonConfig.update, {
        payload: data,
        metadata: { id: data.id },
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["config-json", variables.app]);
    },
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateRoutingScaling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceai.createScaling, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["usecreaterouting"]);
    },
  });
};

export const useUpdateRoutingScaling = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceai.updateScaling, {
        payload: data,
        metadata: { id: data.id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["useupdaterouting"]);
    },
  });
};

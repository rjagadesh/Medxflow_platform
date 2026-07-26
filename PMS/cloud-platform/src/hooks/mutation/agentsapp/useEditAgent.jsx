import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useEditAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.apps.update, {
        payload: data,
        metadata: { id: data.id },
      }),
    onSuccess: (v) => {
      queryClient.invalidateQueries(["agents", v.module]);
    },
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.apps.delete, {
        metadata: { id: data.id },
      }),
    onSuccess: (v) => {
      queryClient.invalidateQueries(["agents", v.module]);
    },
  });
};

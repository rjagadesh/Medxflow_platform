import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiRequest(apiRoutes.apps.create, { payload: data }),
    onSuccess: (v) => {
      queryClient.invalidateQueries(["agents", v.module]);
    },
  });
};

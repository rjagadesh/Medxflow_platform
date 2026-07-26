import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateQueue = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiRequest(apiRoutes.queue.create, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["pods"]);
    },
  });
};

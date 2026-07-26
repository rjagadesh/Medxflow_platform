import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateAPIkey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.apiKey.create, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["api-keys"]);
    },
  });
};

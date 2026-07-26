import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteRequest = (apikey) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      return apiRequest(apiRoutes.agentsRequest.bulkDelete, {
        params: {
          apikey: apikey,
        },
        data: data,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(apikey);
    },
  });
};

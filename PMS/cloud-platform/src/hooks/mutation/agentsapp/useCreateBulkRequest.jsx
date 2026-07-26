import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateBulkRequest = (apiKey) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.agentsRequest.bulkRequest, {
        payload: data,
        header: {
          ContentType: "multipart/form-data",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries([apiKey]);
    },
  });
};

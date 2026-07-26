import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateRequest = (apikey, id) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.agentsRequest.editData, {
        params: {
          apikey: apikey,
          task_id: id,
        },
        payload: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(apikey);
    },
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => apiRequest(apiRoutes.task.create, { payload: data }),
    onSuccess: (res) => {
      console.log("res", res);
      queryClient.invalidateQueries([`tasks-${res.id}`]);
    },
  });
};

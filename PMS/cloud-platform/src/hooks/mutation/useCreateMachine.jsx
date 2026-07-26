import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateMachine = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiRequest(apiRoutes.machine.create, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["licenses"]);
    },
  });
};

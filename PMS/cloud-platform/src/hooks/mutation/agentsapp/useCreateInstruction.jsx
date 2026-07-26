import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateInstruction = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.instructions.create, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["instruction"]);
    },
  });
};

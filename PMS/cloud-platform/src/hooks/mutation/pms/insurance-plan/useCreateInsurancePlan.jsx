import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateInsurancePlan = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.insurancePlan.create, {
        payload: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["insurance-plan"]);
    },
  });
};

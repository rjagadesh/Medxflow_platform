import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateInsurancePolicy = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.insurancePolicy.create, {
        payload: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["insurance-policies"]);
    },
  });
};

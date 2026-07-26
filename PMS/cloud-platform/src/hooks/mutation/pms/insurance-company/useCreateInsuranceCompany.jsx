import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateInsuranceCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.insuranceCompany.create, {
        payload: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["insurance-companies"]);
    },
  });
};

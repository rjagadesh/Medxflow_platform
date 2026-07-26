import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useMakePatientPayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.paymentsHub.makePatientPayment, {
        payload: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["get-patient-payments"]);
    },
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateLabOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.labOrders.create, {
        payload: data,
      }),
    onSuccess: (res, variables) => {
      const patientId = res?.order?.patient || variables?.patient;
      if (patientId) {
        queryClient.invalidateQueries([`${patientId}-lab-orders`]);
      }
    },
  });
};

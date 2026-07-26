import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateLabOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.labOrders.update, {
        payload: data,
        metadata: { id: data.id },
      }),
    onSuccess: (res, variables) => {
      const patientId = res?.order?.patient || variables?.patient;
      if (patientId) {
        queryClient.invalidateQueries([`${patientId}-lab-orders`]);
      }
    },
  });
};

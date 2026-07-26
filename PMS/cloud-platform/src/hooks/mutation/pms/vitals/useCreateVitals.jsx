import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateVitals = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.vitals.create, {
        payload: data,
      }),
    onSuccess: (res, variables) => {
      const patientId = res?.patient || variables?.patient;
      if (patientId) {
        queryClient.invalidateQueries([`${patientId}-vitals`]);
      }
    },
  });
};

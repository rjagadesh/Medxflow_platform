import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateMedications = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.medications.update, {
        payload: data,
        metadata: { id: data.id },
      }),
    onSuccess: (res, variables) => {
      const patientId = res?.patient || variables?.patient;
      if (patientId) {
        queryClient.invalidateQueries([`${patientId}-medications`]);
      }
    },
  });
};

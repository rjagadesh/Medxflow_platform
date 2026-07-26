import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSavePatientHistory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.patientHistory.save, {
        payload: data,
      }),
    onSuccess: (res, variables) => {
      const first = Array.isArray(variables) ? variables[0] : variables;
      const patientId = first?.patient;
      if (patientId) {
        queryClient.invalidateQueries([`${patientId}-history`]);
      }
    },
  });
};

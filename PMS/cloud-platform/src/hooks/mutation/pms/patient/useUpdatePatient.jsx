import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.patientForAppointments.put, {
        payload: data,
        header: {
          contentType: "multipart/form-data",
        },
        metadata: { id: data.id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["get-patients"]);
    },
  });
};

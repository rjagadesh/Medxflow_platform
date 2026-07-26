import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreatePatient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.patientForAppointments.create, {
        payload: data,
        header: {
          contentType: "multipart/form-data",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["get-patients"]);
    },
  });
};

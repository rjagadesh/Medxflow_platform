import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSaveClinicalNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appointmentId, patientId, data }) =>
      apiRequest(apiRoutes.clinicalNotes.saveByAppointment, {
        metadata: { id: { appointmentId, patientId } },
        payload: data,
      }),
    onSuccess: (data, variables) => {
      const { appointmentId, patientId } = variables;
      queryClient.invalidateQueries({
        queryKey: ["clinical-note", appointmentId, patientId],
      });
    },
  });
};

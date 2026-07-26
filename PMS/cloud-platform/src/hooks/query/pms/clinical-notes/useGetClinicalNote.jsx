import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetClinicalNote = (appointmentId, patientId) => {
  return useQuery({
    queryKey: ["clinical-note", appointmentId, patientId],
    queryFn: () =>
      apiRequest(apiRoutes.clinicalNotes.getByAppointment, {
        metadata: { id: { appointmentId, patientId } },
      }),
    enabled: !!appointmentId && !!patientId,
    retry: false,
  });
};

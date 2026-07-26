import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetClinicalNotesByPatient = (patientId) => {
  return useQuery({
    queryKey: ["clinical-notes-by-patient", patientId],
    queryFn: () =>
      apiRequest(apiRoutes.clinicalNotes.getByPatient, {
        metadata: { id: patientId },
      }),
    placeholderData: {
      notes: [],
      count: 0,
    },
    enabled: !!patientId,
  });
};

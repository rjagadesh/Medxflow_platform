import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetPatientDocumentsById = (id) => {
  return useQuery({
    queryKey: ["get-patient-documents", id],
    queryFn: () =>
      apiRequest(apiRoutes.patient.getPatientDocumentsById, {
        metadata: { id },
      }),
    enabled: !!id,
  });
};

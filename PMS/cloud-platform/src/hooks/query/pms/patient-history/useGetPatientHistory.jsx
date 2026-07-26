import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetPatientHistory = (patientId, type) => {
  return useQuery({
    queryKey: [`${patientId}-history`, type || "all"],
    queryFn: () =>
      apiRequest(apiRoutes.patientHistory.getByPatient, {
        metadata: { id: patientId },
        params: type ? { type } : undefined,
      }),
    placeholderData: { count: 0, history: [] },
    retry: false,
    enabled: !!patientId,
  });
};

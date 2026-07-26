import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetMedications = (patientId) => {
  return useQuery({
    queryKey: [`${patientId}-medications`],
    queryFn: () =>
      apiRequest(apiRoutes.medications.get, { metadata: { id: patientId } }),
    placeholderData: [],
    retry: false,
    enabled: !!patientId,
  });
};

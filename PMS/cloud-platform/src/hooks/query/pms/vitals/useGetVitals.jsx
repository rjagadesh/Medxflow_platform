import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetVitals = (patientId) => {
  return useQuery({
    queryKey: [`${patientId}-vitals`],
    queryFn: () =>
      apiRequest(apiRoutes.vitals.get, { metadata: { id: patientId } }),
    placeholderData: [],
    retry: false,
    enabled: !!patientId,
  });
};

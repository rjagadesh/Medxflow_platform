import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAllergies = (patientId) => {
  return useQuery({
    queryKey: [`${patientId}-allergies`],
    queryFn: () =>
      apiRequest(apiRoutes.allergies.get, { metadata: { id: patientId } }),
    placeholderData: [],
    retry: false,
  });
};

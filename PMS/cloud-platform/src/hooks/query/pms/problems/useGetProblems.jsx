import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetProblems = (patientId) => {
  return useQuery({
    queryKey: [`${patientId}-problems`],
    queryFn: () =>
      apiRequest(apiRoutes.problems.get, { metadata: { id: patientId } }),
    placeholderData: [],
    retry: false,
    enabled: !!patientId,
  });
};

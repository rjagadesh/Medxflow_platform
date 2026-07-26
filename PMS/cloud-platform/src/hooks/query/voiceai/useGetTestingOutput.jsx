import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetTestingOutput = (id, options = {}) => {
  return useQuery({
    queryKey: ["testing-output", id],
    enabled: !!id,
    ...options,
    queryFn: () =>
      apiRequest(apiRoutes.voiceAI.testingOutput.get, {
        metadata: { id },
      }),
  });
};

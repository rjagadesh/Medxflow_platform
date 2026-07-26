import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useSearchAgent = ({ enabled, search } = {}) => {
  return useQuery({
    queryKey: ["searchAgents", search],
    enabled: enabled,
    queryFn: () =>
      apiRequest(apiRoutes.apps.searchAgents, {
        params: { search },
      }),
    retry: false,
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetStatusCount = (api_key) => {
  return useQuery({
    queryKey: [`${api_key}-status-count`, api_key],
    queryFn: () =>
      apiRequest(apiRoutes.agentsRequest.metric, {
        params: { apikey: api_key },
      }),
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetRequestByDay = (params) => {
  return useQuery({
    queryKey: ["request_by_day", params.agent_id],
    enabled: !!params.agent_id,
    queryFn: () =>
      apiRequest(apiRoutes.agentsRequest.requestByDay, {
        params: params,
      }),
  });
};

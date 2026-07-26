import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetRequestStatusByMonth = (params) => {
  return useQuery({
    queryKey: ["request_status_by_month", params.agent_id],
    enabled: !!params.agent_id,
    queryFn: () =>
      apiRequest(apiRoutes.agentsRequest.requestStatusByMonth, {
        params: params,
      }),
  });
};

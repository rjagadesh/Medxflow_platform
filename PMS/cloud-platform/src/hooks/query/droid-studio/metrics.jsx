import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetHubMetrics = () => {
  return useQuery({
    queryKey: ["hub-metrics"],
    queryFn: () => apiRequest(apiRoutes.hub.metrics),
  });
};

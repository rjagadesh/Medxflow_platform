import { useQuery } from "@tanstack/react-query";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";

const fetchAgentNames = async () => {
  const response = await apiRequest(apiRoutes.billing.getAgentNames, {
    method: "GET",
  });
  return response;
};

export const useGetAgentNames = (options) => {
  return useQuery({
    queryKey: ["agentNames"],
    queryFn: fetchAgentNames,
    staleTime: 5 * 60 * 1000,
    ...options,
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAllAgents = () => {
  return useQuery({
    queryKey: ["all-agents"],
    staleTime: 10000,
    queryFn: () => apiRequest(apiRoutes.apps.all),
    placeholderData: [],
  });
};

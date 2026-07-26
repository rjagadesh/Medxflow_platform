import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useSubAgentsAPIKeys = () => {
  return useQuery({
    queryKey: ["sub-agents-keys"],
    queryFn: () => apiRequest(apiRoutes.sub_agents_key.all),
  });
};

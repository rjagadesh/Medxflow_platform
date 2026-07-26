import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useAPIkeys = () => {
  return useQuery({
    queryKey: ["api-keys"],
    queryFn: () => apiRequest(apiRoutes.apiKey.all),
  });
};

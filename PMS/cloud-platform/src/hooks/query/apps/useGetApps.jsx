import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetApps = () => {
  return useQuery({
    queryKey: ["apps"],
    queryFn: () => apiRequest(apiRoutes.apps.all),
  });
};

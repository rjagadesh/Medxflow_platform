import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAgentsMinimal = () => {
  return useQuery({
    queryKey: ["user_app_minimal"],
    queryFn: () => apiRequest(apiRoutes.apiKey.user_app_minimal),
  });
};

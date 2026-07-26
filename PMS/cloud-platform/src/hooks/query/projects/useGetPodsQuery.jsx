import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetPodsQuery = () => {
  return useQuery({
    queryKey: ["pods"],
    queryFn: () => apiRequest(apiRoutes.project.all),
    placeholderData: [],
  });
};

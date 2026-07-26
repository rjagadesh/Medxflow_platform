import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetDepartments = () => {
  return useQuery({
    queryKey: ["modules"],
    staleTime: 10000,
    queryFn: () => apiRequest(apiRoutes.modules.all),
    placeholderData: [],
  });
};

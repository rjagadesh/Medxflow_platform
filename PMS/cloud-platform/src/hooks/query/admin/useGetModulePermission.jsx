import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetModulePermission = () => {
  return useQuery({
    queryKey: ["module-permission"],
    queryFn: () => apiRequest(apiRoutes["module-permission"].all),
    placeholderData: [],
  });
};

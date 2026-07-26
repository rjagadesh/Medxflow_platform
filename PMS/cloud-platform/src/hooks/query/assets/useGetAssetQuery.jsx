import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAssetQuery = () => {
  return useQuery({
    queryKey: ["assets"],
    queryFn: () => apiRequest(apiRoutes.asset.all),
    placeholderData: [],
  });
};

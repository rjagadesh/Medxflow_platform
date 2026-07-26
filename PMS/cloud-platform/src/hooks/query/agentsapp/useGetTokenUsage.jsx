import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetTokenUsage = (parmas) => {
  return useQuery({
    queryKey: ["token-usage", parmas.start_date, parmas.end_date],
    enabled: !!parmas.start_date && !!parmas.end_date,
    queryFn: () =>
      apiRequest(apiRoutes.tokenUsage.get, {
        params: parmas,
      }),
  });
};

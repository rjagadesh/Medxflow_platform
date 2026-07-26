import { useQuery } from "@tanstack/react-query";
import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";

export const useFetchFeeSchedule = (params) => {
  return useQuery({
    queryKey: ["feeSchedule", params],
    queryFn: async () => {
      const response = await apiRequest(apiRoutes.encounter.fetchFeeSchedule, {
        params,
      });
      return response;
    },
    enabled: true,
  });
};

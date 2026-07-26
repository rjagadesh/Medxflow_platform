import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useServiceLocationList = (params = {}) => {
  return useQuery({
    queryKey: ["service location"],
    queryFn: async () => {
      const res = await apiRequest(apiRoutes.provider.location, {
        params: {
          ...params,
        },
      });

      // DRF pagination support
      return {
        results: res.results || [],
      };
    },
    placeholderData: {
      results: [],
    },
  });
};

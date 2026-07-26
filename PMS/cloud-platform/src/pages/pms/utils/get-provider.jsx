import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useProviderList = (params = {}) => {
  return useQuery({
    queryKey: ["providers", params.clicked, params.page, params.page_size],
    queryFn: async () => {
      const res = await apiRequest(apiRoutes.provider.get, {
        params: params.clicked
          ? {
              ...params,
              clicked: undefined,
            }
          : {
              page: params.page,
              page_size: params.page_size,
            },
      });

      // DRF pagination support
      return {
        results: res.results || [],
        count: res.count ?? 0,
        next: res.next,
        previous: res.previous,
      };
    },
    placeholderData: {
      results: [],
      count: 0,
      next: null,
      previous: null,
      page_size: 10,
      page: 1,
    },
  });
};

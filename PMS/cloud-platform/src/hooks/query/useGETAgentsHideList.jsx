import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAgentsHideList = ({ page }) => {
  return useQuery({
    queryKey: ["apps-hide-list", page],
    staleTime: 10000,
    queryFn: () =>
      apiRequest(apiRoutes.apps.hidelist, {
        params: {
          page,
        },
      }),
    placeholderData: {
      results: [],
      count: 0,
      page: 1,
    },
  });
};

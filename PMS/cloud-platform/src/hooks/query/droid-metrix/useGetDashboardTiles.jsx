import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetDashboardTiles = (client_email) => {
  return useQuery({
    queryKey: ["dashboard-tiles", client_email],
    queryFn: ({ queryKey }) =>
      apiRequest(apiRoutes.droidMetrix.dashboard_tiles, {
        params: { client_email: queryKey[1] },
        metadata: {
          isDroidMetrix: true,
        },
      }),
  });
};

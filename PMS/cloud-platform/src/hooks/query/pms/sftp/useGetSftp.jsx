import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetSftp = (params = {}, options = {}) => {
  return useQuery({
    queryKey: ["sftp-settings", params],
    queryFn: () => apiRequest(apiRoutes.sftp.get, { params }),
    placeholderData: {
      count: 0,
      results: [],
      page_size: 10,
      page: 1,
      next: null,
      previous: null,
    },
    ...options, // ✅ allow overrides
  });
};

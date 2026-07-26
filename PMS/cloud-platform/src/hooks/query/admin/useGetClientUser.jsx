import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetClientUser = (options = {}) => {
  return useQuery({
    queryKey: ["client-user-details"],
    queryFn: () => apiRequest(apiRoutes.userrolemanagement.getusers),
    staleTime: 0, // 5 minutes
    cacheTime: 0, // 10 minutes
    retry: 3,
    placeholderData: [],
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    ...options,
  });
};

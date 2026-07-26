import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetProviders = (params = {}) => {
  return useQuery({
    queryKey: ["get-providers", params],
    queryFn: async () => {
      try {
        const response = await apiRequest(
          apiRoutes.providersForAppointments.get,
          {
            params,
          }
        );
        console.log("Providers API response:", response); // Debug log
        return response;
      } catch (error) {
        console.error("Error fetching providers:", error);
        return [];
      }
    },
    placeholderData: {
      count: 0,
      results: [],
      page_size: 10,
      page: 1,
    },
  });
};

export const useGetMinimalProviders = () => {
  return useQuery({
    queryKey: ["minimalProviders"],
    queryFn: () =>
      apiRequest(apiRoutes.providersForAppointments.getminimalProviders),
    placeholderData: [],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetPayments = (params = {}) => {
  return useQuery({
    queryKey: ["get-Payments", params],
    queryFn: async () => {
      try {
        const response = await apiRequest(apiRoutes.paymentPosting.get, {
          params,
        });
        console.log("Payments API response:", response); // Debug log
        return response;
      } catch (error) {
        console.error("Error fetching Payments:", error);
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

export const useGetMinimalPayments = () => {
  return useQuery({
    queryKey: ["minimalPayments"],
    queryFn: () => apiRequest(apiRoutes.paymentPosting.getminimalProviders),
    placeholderData: [],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

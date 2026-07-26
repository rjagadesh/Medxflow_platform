import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetMinimalProvider = () => {
  return useQuery({
    queryKey: ["minimal-providers"],
    queryFn: () => apiRequest(apiRoutes.provider.minimal_provider),
    placeholderData: [],
  });
};

export const useGetProviderAvailability = (params) => {
  return useQuery({
    queryKey: ["provider-availability", params],
    queryFn: () =>
      apiRequest(apiRoutes.providersForAppointments.getProviderAvailability, {
        params,
      }),
    placeholderData: [],
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetProvidersById = (id) => {
  return useQuery({
    queryKey: [`get-providers-id-${id}`],
    queryFn: () =>
      apiRequest(apiRoutes.providerForAppointments.getById, {
        metadata: {
          id,
        },
      }),
    placeholderData: {},
    enabled: !!id,
  });
};

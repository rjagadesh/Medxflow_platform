import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAgents = ({ module_id }) => {
  return useQuery({
    queryKey: ["agents", module_id],
    enabled: !!module_id,
    staleTime: 10000,
    queryFn: () =>
      apiRequest(apiRoutes.apps.id, {
        params: { module_id },
      }),
    select: (data) => {
      return data.filter((item) => !item.is_hide_app);
    },
    placeholderData: [],
  });
};

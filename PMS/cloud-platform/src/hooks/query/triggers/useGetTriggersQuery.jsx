import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetTriggersQuery = () => {
  return useQuery({
    queryKey: ["triggers"],
    queryFn: () => apiRequest(apiRoutes.trigger.all),
  });
};

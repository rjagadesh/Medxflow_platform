import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetTriggerDetails = (trigger_id, params) => {
  return useQuery({
    queryKey: ["status", trigger_id],
    queryFn: () =>
      apiRequest(apiRoutes.triggerdetails.get, {
        metadata: { id: trigger_id },
        params,
      }),
  });
};

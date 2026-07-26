import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetTriggerById = (triggerId, options) => {
  const { enabled = true } = options;
  return useQuery({
    queryKey: ["trigger", triggerId],
    queryFn: () =>
      apiRequest(apiRoutes.trigger.id, { metadata: { id: triggerId } }),
    placeholderData: {},
    enabled: enabled,
  });
};

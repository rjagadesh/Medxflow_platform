import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetQueuesRecord = () => {
  return useQuery({
    queryKey: ["queues-records"],
    queryFn: () => apiRequest(apiRoutes["queue-record"].all),
  });
};

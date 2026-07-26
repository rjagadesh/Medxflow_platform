import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetQueuesQuery = () => {
  return useQuery({
    queryKey: ["queues"],
    queryFn: () => apiRequest(apiRoutes.queue.all),
  });
};

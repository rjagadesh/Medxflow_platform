import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetTaskById = (taskId) => {
  return useQuery({
    queryKey: [`task-${taskId}`, taskId],
    enabled: !!taskId,
    queryFn: () => apiRequest(apiRoutes.task.id, { metadata: { id: taskId } }),
  });
};

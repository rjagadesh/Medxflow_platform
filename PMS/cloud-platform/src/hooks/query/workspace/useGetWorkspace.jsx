import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetWorkspace = (taskId) => {
  return useQuery({
    queryKey: [`workspace-${taskId}`],
    enabled: false,
    queryFn: () =>
      apiRequest(apiRoutes.task.workspaceLoad, { metadata: { id: taskId } }),
  });
};

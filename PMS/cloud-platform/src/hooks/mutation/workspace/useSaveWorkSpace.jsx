import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSaveWorkSpace = (taskId) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.task.workspaceSave, {
        payload: data,
        metadata: { id: taskId },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries([`workspace-${taskId}`]);
    },
  });
};

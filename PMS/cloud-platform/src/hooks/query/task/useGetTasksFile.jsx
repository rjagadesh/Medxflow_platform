import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetTasksFile = (taskId) => {
  return useQuery({
    queryKey: ["task-files", taskId],
    enabled: taskId === "none" ? false : !!taskId,
    queryFn: () =>
      apiRequest({
        ...apiRoutes.task.files, // use the files route
        url: apiRoutes.task.files.url(taskId), // call with taskId
      }),
  });
};

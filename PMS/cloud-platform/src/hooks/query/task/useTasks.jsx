import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetTasksByProjectId = (id) => {
  return useQuery({
    queryKey: [`tasks-${id}`, id],
    queryFn: ({ queryKey: [, id] }) =>
      apiRequest(apiRoutes.task.all, {
        params: { project_id: id },
      }),
    placeholderData: [],
    select: (data) => {
      const parentId = "0.0";
      return [
        ...data.map((item) => {
          return {
            name: item.task_name,
            id: "1." + item.id,
            parent: parentId,
            color: "gray",
            fill: "#fff",
            childId: item.id,
            ...item,
          };
        }),
      ];
    },
  });
};

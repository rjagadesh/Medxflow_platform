import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const usePodsById = (id) => {
  return useQuery({
    queryKey: ["pod", id],
    queryFn: () =>
      apiRequest(apiRoutes.project.id, {
        metadata: { id },
      }),
  });
};

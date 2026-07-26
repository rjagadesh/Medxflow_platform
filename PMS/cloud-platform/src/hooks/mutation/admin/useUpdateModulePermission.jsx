import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateModulePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes["module-permission"].update, {
        payload: data,
        metadata: { id: data.id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["module-permission"]);
    },
  });
};

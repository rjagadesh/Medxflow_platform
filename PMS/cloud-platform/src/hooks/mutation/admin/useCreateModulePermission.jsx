import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateModulePermission = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes["module-permission"].create, {
        payload: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["module-permission"]);
    },
  });
};

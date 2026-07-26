import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useHideAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.apps.hide, {
        payload: data,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries(["apps-hide-list"]);
      queryClient.invalidateQueries(["agents", res.module_id]);
    },
  });
};

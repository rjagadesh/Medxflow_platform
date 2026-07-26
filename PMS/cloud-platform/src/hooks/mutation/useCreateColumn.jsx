import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateColumn = (appName) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes["column-custom"].create, { payload: data }),
    onSuccess: (v) => {
      console.log("v999", v, appName);
      queryClient.invalidateQueries(["column-data", appName]);
    },
  });
};

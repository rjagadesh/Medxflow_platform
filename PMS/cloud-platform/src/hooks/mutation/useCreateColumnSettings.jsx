import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateColumnSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => {
      console.log("data1212", data);
      return apiRequest(apiRoutes.column_settings.create, {
        payload: data,
        metadata: { id: data.id },
      });
    },
    onSuccess: (v) => {
      console.log("v8888", v);
      queryClient.invalidateQueries(["column-data", v.app_name]);
    },
  });
};

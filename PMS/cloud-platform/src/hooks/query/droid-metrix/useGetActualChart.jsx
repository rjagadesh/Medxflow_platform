import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const useGetActualChart = () => {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.droidMetrix.actualSavings, { payload: data }),
  });
};

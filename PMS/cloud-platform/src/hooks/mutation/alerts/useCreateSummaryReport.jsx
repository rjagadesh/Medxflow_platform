import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateSummaryReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiRequest(apiRoutes.summaryReport.create, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["summary-report"]);
    },
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateSummaryReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.summaryReport.update, {
        payload: data,
        metadata: { id: data?.id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["summary-report"]);
    },
  });
};

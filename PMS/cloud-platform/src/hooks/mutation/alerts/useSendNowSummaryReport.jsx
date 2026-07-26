import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useSendNowSummaryReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.summaryReport.send_now, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["summary-report"]);
    },
  });
};

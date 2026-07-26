import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteSummaryReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiRequest(apiRoutes.summaryReport.delete, { metadata: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries(["summary-report"]);
    },
  });
};

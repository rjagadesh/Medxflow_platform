import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateInvoiceReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.invoiceReport.update, {
        payload: data,
        metadata: { id: data?.id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["invoice-report"]);
    },
  });
};

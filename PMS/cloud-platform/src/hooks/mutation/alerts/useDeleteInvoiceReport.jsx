import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useDeleteInvoiceReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => apiRequest(apiRoutes.invoiceReport.delete, { metadata: { id } }),
    onSuccess: () => {
      queryClient.invalidateQueries(["invoice-report"]);
    },
  });
};

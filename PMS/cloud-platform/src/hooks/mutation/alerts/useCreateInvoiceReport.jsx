import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreateInvoiceReport = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiRequest(apiRoutes.invoiceReport.create, { payload: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(["invoice-report"]);
    },
  });
};

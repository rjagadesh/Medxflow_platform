import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetInvoiceReports = (params = {}) => {
  return useQuery({
    queryKey: ["invoice-report", params],
    queryFn: () => apiRequest(apiRoutes.invoiceReport.get, { params }),
    placeholderData: [],
  });
};

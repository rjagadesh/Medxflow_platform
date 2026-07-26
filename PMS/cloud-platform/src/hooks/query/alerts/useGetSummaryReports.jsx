import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetSummaryReports = (params = {}) => {
  return useQuery({
    queryKey: ["summary-report", params],
    queryFn: () => apiRequest(apiRoutes.summaryReport.get, { params }),
    placeholderData: [],
  });
};

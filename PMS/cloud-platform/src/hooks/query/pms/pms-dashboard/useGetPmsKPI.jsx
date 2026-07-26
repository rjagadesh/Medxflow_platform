import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetPmsKPI = () => {
  return useQuery({
    queryKey: ["pms-dashboard-kpi"],
    queryFn: () => apiRequest(apiRoutes.pmsDashboard.analytics),
    placeholderData: {
      patient_count: 0,
      appointment_count: 0,
    },
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetPatients = (params = {}) => {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () => apiRequest(apiRoutes.patientForAppointments.get, { params }),
    placeholderData: {
      count: 0,
      results: [],
      page_size: 10,
      page: 1,
      next: null,
      previous: null,
    },
  });
};

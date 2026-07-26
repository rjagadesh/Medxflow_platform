import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetMinimalPatients = () => {
  return useQuery({
    queryKey: ["minimal-patients"],
    queryFn: () => apiRequest(apiRoutes.patient.minimal_patients),
    placeholderData: [],
  });
};

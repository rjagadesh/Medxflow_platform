import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetLicenseDetails = () => {
  return useQuery({
    queryKey: ["client-license-details"],
    queryFn: () => apiRequest(apiRoutes.license.getlicensedetails),
  });
};

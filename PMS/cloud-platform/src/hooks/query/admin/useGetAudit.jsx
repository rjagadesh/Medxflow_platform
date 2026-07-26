import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAudit = () => {

  return useQuery({
    queryKey: ["audit"],
    queryFn: () => apiRequest(apiRoutes.audit.fetch),
    placeholderData: []
  });
};

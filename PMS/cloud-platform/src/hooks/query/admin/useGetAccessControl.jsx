import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAccessControl = () => {

  return useQuery({
    queryKey: ["access-control"],
    queryFn: () => apiRequest(apiRoutes.accesss_control.get),
    placeholderData: []
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetMachineQuery = () => {
  return useQuery({
    queryKey: ["licenses"],
    queryFn: () => apiRequest(apiRoutes.machine.all),
    placeholderData: [],
  });
};

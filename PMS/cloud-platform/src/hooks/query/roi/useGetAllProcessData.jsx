import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAllProcessData = () => {
  return useQuery({
    queryKey: [`roi_process_data`],
    queryFn: () => apiRequest(apiRoutes.roiProcces.get),
    notifyOnChangeProps: ["data"],
  });
};

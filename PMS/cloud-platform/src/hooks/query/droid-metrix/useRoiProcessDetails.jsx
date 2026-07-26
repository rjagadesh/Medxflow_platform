import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetRoiProcessDetails = (process_name) => {
  return useQuery({
    queryKey: [`roi-${process_name}`, process_name],
    enabled: !!process_name,
    retry: 0,
    queryFn: ({ queryKey }) =>
      apiRequest(apiRoutes.droidMetrix.roi_process_detail, {
        metadata: {
          isDroidMetrix: true,
          id: queryKey[1],
        },
      }),
  });
};

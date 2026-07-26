import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetOutputFiles = (params, options) => {
  return useQuery({
    queryKey: ["agents-output-files", params],
    queryFn: () =>
      apiRequest(apiRoutes.agentsRequest.files, {
        params,
      }),
    ...options,
  });
};

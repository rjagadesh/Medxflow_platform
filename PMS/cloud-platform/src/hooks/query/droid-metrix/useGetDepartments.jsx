import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetDepartments = () => {
  return useQuery({
    queryKey: ["departments"],
    queryFn: () =>
      apiRequest(apiRoutes.droidMetrix.departments, {
        metadata: {
          isDroidMetrix: true,
        },
      }),
  });
};

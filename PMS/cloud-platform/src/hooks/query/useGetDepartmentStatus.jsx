import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetDepartmentsStatus = (departmentId) => {
  return useQuery({
    queryKey: ["departmentStatus", departmentId],
    queryFn: () =>
      apiRequest(apiRoutes.departmentStatus.id, {
        metadata: { id: departmentId },
      }),
    enabled: !!departmentId,
  });
};

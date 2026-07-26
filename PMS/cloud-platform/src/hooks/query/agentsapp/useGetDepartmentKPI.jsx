import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetDepartmentKPI = (module_id) => {
  console.log("module_id999", module_id);
  return useQuery({
    queryKey: ["department_kpi", module_id],
    queryFn: () =>
      apiRequest(apiRoutes.agentsRequest.department_kpi, {
        metadata: {
          id: module_id,
        },
      }),
  });
};

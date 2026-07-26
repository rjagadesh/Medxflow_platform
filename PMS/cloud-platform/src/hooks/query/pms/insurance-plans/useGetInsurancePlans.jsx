import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetInsurancePlans = ({
  page = 1,
  page_size = 10,
  name = "",
} = {}) => {
  return useQuery({
    queryKey: ["insurance-plans", { page, page_size, name }],
    queryFn: () =>
      apiRequest(apiRoutes.insurancePlan.get, {
        params: { page, page_size, plan_name: name },
      }),
    placeholderData: {
      count: 0,
      next: null,
      previous: null,
      results: [],
    },
  });
};

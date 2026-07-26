import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetInsurancePolices = ({
  page = 1,
  page_size = 10,
  name = "",
} = {}) => {
  return useQuery({
    queryKey: ["insurance-policies", { page, page_size, name }],
    queryFn: () =>
      apiRequest(apiRoutes.insurancePolicy.get, {
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

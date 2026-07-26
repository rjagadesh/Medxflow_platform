import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetInsuranceCompaniesPatients = ({
  page = 1,
  page_size = 10,
  name = "",
} = {}) => {
  return useQuery({
    queryKey: ["insurance-companies", { page, page_size, name }],
    queryFn: () =>
      apiRequest(apiRoutes.insuranceCompany.get, {
        params: { page, page_size, name },
      }),
    placeholderData: {
      count: 0,
      next: null,
      previous: null,
      results: [],
    },
  });
};

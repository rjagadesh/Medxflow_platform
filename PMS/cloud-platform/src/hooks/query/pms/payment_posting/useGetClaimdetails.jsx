import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetClaimDetails = (params = {}) => {
  return useQuery({
    queryKey: ["getclaimpatient", params.name, params.type],
    queryFn: () => apiRequest(apiRoutes.paymentPosting.get_claims, { params }),
    placeholderData: {
      count: 0,
      results: [],
      page_size: 10,
      page: 1,
      next: null,
      previous: null,
    },
  });
};

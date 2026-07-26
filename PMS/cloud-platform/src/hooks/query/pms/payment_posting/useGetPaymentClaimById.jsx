import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetPaymentClaimById = (params = {}) => {
  return useQuery({
    queryKey: ["getpaymentclaimpatient", params.name, params.type],
    queryFn: () =>
      apiRequest(apiRoutes.paymentPosting.get_payment_claims, { params }),
    placeholderData: {
      count: 0,
      results: [],
    },
  });
};

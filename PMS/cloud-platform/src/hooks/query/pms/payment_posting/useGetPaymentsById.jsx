import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetPaymentById = (id) => {
  return useQuery({
    queryKey: [`get-payments-id-${id}`],
    queryFn: () =>
      apiRequest(apiRoutes.paymentPosting.get_payment, {
        metadata: {
          id,
        },
      }),
    placeholderData: {},
    enabled: !!id,
  });
};

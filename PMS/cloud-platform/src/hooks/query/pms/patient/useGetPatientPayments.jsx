import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetPatientPayments = (params) => {
  return useQuery({
    queryKey: ["get-patient-payments", params],
    queryFn: () =>
      apiRequest(apiRoutes.paymentsHub.getPatientPayments, {
        params: params,
      }),
  });
};

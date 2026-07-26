import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetLabOrdersByPatient = (patientId, type) => {
  return useQuery({
    queryKey: [`${patientId}-lab-orders`, type || "all"],
    queryFn: () =>
      apiRequest(apiRoutes.labOrders.getByPatient, {
        metadata: { id: patientId },
        params: type ? { type } : undefined,
      }),
    placeholderData: { count: 0, orders: [] },
    retry: false,
    enabled: !!patientId,
  });
};

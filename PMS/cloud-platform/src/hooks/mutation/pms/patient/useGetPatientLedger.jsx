import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetPatientLedger = (id) => {
  return useQuery({
    queryKey: ["get-patient-ledger", id],
    queryFn: () =>
      apiRequest(apiRoutes.patientLedger.ledger, {
        metadata: { id },
      }),
    enabled: !!id,
    
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetPatientById = (id) => {
  return useQuery({
    queryKey: [`get-patients-id-${id}`],
    queryFn: () =>
      apiRequest(apiRoutes.patientForAppointments.getById, {
        metadata: {
          id,
        },
      }),
    placeholderData: {},
    enabled: !!id,
  });
};

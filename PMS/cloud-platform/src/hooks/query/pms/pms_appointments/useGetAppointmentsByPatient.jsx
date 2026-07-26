import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAppointmentsByPatient = (patientId) => {
  return useQuery({
    queryKey: ["appointments-by-patient", patientId],
    queryFn: async () => {
      if (!patientId) return [];

      const route = apiRoutes.appointments.getByPatientId;
      const config = {
        ...route,
        url: route.url(patientId),
      };

      const response = await apiRequest(config);
      return response || [];
    },
    enabled: !!patientId,
    placeholderData: [],
    refetchOnWindowFocus: false,
  });
};

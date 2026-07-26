import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetAllergyProfile = (patientId) => {
  return useQuery({
    queryKey: ["allergy-profile", patientId],
    queryFn: () =>
      apiRequest(apiRoutes.allergies.profileGet, {
        metadata: { id: patientId },
      }),
    enabled: !!patientId,
    retry: false,
  });
};

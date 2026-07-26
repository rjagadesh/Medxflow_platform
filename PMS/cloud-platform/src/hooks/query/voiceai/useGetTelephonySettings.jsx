import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useQuery } from "@tanstack/react-query";

export const useGetTelephonySettings = (id) => {
  return useQuery({
    queryKey: ["telephony-settings", id],
    enabled: !!id,
    queryFn: () =>
      apiRequest(apiRoutes.voiceAI.telephony.id, {
        metadata: { id },
      }),
    retry: false,
    staleTime: 0,
    gcTime: 0,
  });
};

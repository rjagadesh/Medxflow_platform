import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdateTelephonySettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.telephony.update, {
        payload: data,
        metadata: { id: data.id },
      }),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(["telephony-settings", variables.id]);
    },
  });
};

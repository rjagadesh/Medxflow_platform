import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const useCreateTelephonySettings = () => {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.telephony.create, {
        payload: data,
      }),
  });
};

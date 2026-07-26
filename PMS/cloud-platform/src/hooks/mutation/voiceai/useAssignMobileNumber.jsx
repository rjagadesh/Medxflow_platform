import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useAssignMobileNumber = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.mobileNumbers.assign, {
        payload: data,
      }),
    onSuccess: (data, variables) => {
      if (variables.telephony_settings_id) {
        queryClient.invalidateQueries([
          "telephony-settings",
          variables.telephony_settings_id,
        ]);
      }
    },
  });
};

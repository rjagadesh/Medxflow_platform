import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useReleaseMobileNumber = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.voiceAI.mobileNumbers.release, {
        payload: data,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["mobile-numbers"]);
    },
  });
};

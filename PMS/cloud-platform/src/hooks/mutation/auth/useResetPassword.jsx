import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const useResetPassword = () => {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.auth.resetPassword, {
        payload: data,
        metadata: {
          id: data.uid,
          token: data.token,
        },
      }),
  });
};

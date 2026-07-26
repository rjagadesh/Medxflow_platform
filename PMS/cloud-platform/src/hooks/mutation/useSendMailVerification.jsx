import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const useSendMailVerification = () => {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.login.sendVerification, {
        payload: data,
        metadata: {
          isAuthenticated: false,
        },
      }),
  });
};

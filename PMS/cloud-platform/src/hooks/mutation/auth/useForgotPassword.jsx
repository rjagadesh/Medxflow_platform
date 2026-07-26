import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.auth.forgotPassword, { payload: data }),
  });
};

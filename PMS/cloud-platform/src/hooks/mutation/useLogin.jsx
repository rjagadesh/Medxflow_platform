import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const useLogin = () => {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.login.create, {
        payload: data,
        metadata: {
          isAuthenticated: false,
        },
      }),
  });
};

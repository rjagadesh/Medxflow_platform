import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const useRegister = () => {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.signup.create, {
        payload: data,
        metadata: {
          isAuthenticated: false,
        },
      }),
  });
};

import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const usePostSftp = () => {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.sftp.create, {
        payload: data,
        header: {
          contentType: "application/json",
        },
      }),
    retry: false,
  });
};

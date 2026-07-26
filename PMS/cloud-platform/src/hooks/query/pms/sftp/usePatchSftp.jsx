import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation } from "@tanstack/react-query";

export const usePatchSftp = (options = {}) => {
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.sftp.patch, {
        payload: data,
        header: {
          contentType: "application/json",
        },
        metadata: { id: data.id },
      }),
    retry: false,
    ...options,
  });
};

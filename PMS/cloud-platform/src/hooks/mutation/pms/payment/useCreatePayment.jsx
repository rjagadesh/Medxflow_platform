import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.paymentPosting.create, {
        payload: data,
        header: {
          contentType: "multipart/form-data",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["get-payments"]);
    },
  });
};

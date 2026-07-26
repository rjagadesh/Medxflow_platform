import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUpdatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.paymentPosting.put, {
        payload: data,
        header: {
          contentType: "multipart/form-data",
        },
        metadata: { id: data.id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["get-payments"]);
    },
  });
};

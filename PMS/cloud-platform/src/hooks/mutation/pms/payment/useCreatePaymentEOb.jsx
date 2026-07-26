import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useCreatePaymentEob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.paymentPosting.createeob, {
        payload: data,
        header: {
          contentType: "multipart/form-data",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["get-paymenteobs"]);
    },
  });
};

export const useCreatePaymentLedger = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.paymentPosting.createLedger, {
        payload: data,
        header: {
          contentType: "application/json",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["get-payment-ledger"]);
    },
  });
};

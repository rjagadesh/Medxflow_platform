import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toaster } from "@/components/ui/toaster";

export const useClaimSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ids) => {
      const idArray = Array.isArray(ids) ? ids : [ids];
      return apiRequest(apiRoutes.encounter.statusUpdate, {
        payload: { encounter_ids: idArray },
      });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["encounters"] });
      queryClient.invalidateQueries({ queryKey: ["pms-encounters"] });

      const detail =
        response?.data?.detail || "Encounters successfully submitted";
      toaster.success({
        title: "Success",
        description: detail,
        status: "success",
        duration: 3000,
        isClosable: true,
        position: "top-right",
      });
    },
    onError: (error) => {
      const detail =
        error?.response?.detail || "An error occurred during submission";
      toaster.error({
        title: "Error",
        description: detail,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "top-right",
      });
    },
  });
};

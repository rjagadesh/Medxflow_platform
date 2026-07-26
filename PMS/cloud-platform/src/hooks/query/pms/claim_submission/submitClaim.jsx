import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toaster } from "@/components/ui/toaster";

export const useClaimSubmission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (encounterIds = []) =>
      apiRequest(apiRoutes.claimsubmission.postclaim, {
        payload: {
          encounter_id: encounterIds,
        },
      }),

    onSuccess: () => {
      toaster.create({
        title: "Claim submitted",
        description: "The claim was submitted successfully.",
        type: "success",
        duration: 3000,
      });

      queryClient.invalidateQueries(["get-claims"]);
    },

    onError: (error) => {
      toaster.create({
        title: "Submission failed",
        description:
          error?.error || error?.message || "Unable to submit the claim.",
        type: "error",
        duration: 4000,
      });
    },
  });
};

import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";

export const useUserMFA = () => {
  const queryClient = useQueryClient();

  // Enable MFA
  const enableMfaMutation = useMutation({
    mutationFn: () => {
      console.log("Enabling MFA...");
      return apiRequest(apiRoutes.mfa.enable, {});
    },
    onSuccess: (res) => {
      console.log("MFA enabled:", res);
      queryClient.invalidateQueries(["mfa-info"]);
    },
    onError: (err) => {
      console.error("Error enabling MFA:", err);
    },
  });

  // Disable MFA
  const disableMfaMutation = useMutation({
    mutationFn: () => {
      console.log("Disabling MFA...");
      return apiRequest(apiRoutes.mfa.disable, {});
    },
    onSuccess: (res) => {
      console.log("MFA disabled:", res);
      queryClient.invalidateQueries(["mfa-info"]);
    },
    onError: (err) => {
      console.error("Error disabling MFA:", err);
    },
  });

  // Regenerate MFA Secret
  const regenerateMfaMutation = useMutation({
    mutationFn: () => {
      console.log("Regenerating MFA secret...");
      return apiRequest(apiRoutes.mfa.regenerate, {});
    },
    onSuccess: (res) => {
      console.log("MFA secret regenerated:", res);
      queryClient.invalidateQueries(["mfa-info"]);
    },
    onError: (err) => {
      console.error("Error regenerating MFA:", err);
    },
  });

  return {
    enableMfa: enableMfaMutation,
    disableMfa: disableMfaMutation,
    regenerateMfa: regenerateMfaMutation,

    // Loading states
    isEnabling: enableMfaMutation.isPending,
    isDisabling: disableMfaMutation.isPending,
    isRegenerating: regenerateMfaMutation.isPending,

    // Error states
    enableError: enableMfaMutation.error,
    disableError: disableMfaMutation.error,
    regenerateError: regenerateMfaMutation.error,

    // Reset all errors
    resetErrors: () => {
      enableMfaMutation.reset();
      disableMfaMutation.reset();
      regenerateMfaMutation.reset();
    },
  };
};

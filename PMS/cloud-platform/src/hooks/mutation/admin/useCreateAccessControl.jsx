import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUserAccessControl = () => {
  const queryClient = useQueryClient();

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (data) => {
      console.log("Saving the Permission", data);
      return apiRequest(apiRoutes.accesss_control.create, { payload: data });
    },
    onSuccess: (res) => {
      console.log("Permission Saved successfully:", res);
      queryClient.invalidateQueries(["client-access-control"]);
    },
    onError: (error) => {
      console.error("Error saving permissions:", error);
    },
  });

  return {
    createUser: createUserMutation,

    // Loading states
    isCreating: createUserMutation.isPending,

    // Error states
    createError: createUserMutation.error,
    // Reset functions
    resetErrors: () => {
      createUserMutation.reset();
    },
  };
};

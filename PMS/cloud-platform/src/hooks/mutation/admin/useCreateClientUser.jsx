import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUserRoleManagement = () => {
  const queryClient = useQueryClient();

  // Create User Mutation
  const createUserMutation = useMutation({
    mutationFn: (data) => {
      console.log("Creating user with data:", data);
      return apiRequest(apiRoutes.userrolemanagement.create, { payload: data });
    },
    onSuccess: (res) => {
      console.log("User created successfully:", res);
      queryClient.invalidateQueries(["client-user-details"]);
    },
    onError: (error) => {
      console.error("Error creating user:", error);
    },
  });

  // Edit User Mutation with Dynamic URL using Metadata Pattern
  const editUserMutation = useMutation({
    mutationFn: ({ id, ...data }) => {
      console.log("Edit User ID:", id);
      console.log("Edit payload:", data);

      // Create route config with dynamic URL
      const editRoute = {
        ...apiRoutes.userrolemanagement.edituser,
        url: apiRoutes.userrolemanagement.edituser.url(id), // Call function with ID
      };

      console.log("Edit route:", editRoute);

      return apiRequest(editRoute, {
        payload: data,
        metadata: { id }, // Include metadata like your department example
      });
    },
    onSuccess: (res) => {
      console.log("User updated successfully:", res);
      queryClient.invalidateQueries(["client-user-details"]);
    },
    onError: (error) => {
      console.error("Error updating user:", error);
      console.error("Error details:", error.response?.data);
    },
  });

  // Partial Update Mutation (PATCH)
  const patchUserMutation = useMutation({
    mutationFn: ({ id, ...data }) => {
      console.log("Patch User ID:", id);
      console.log("Patch payload:", data);

      // Create route config with dynamic URL
      const patchRoute = {
        ...apiRoutes.userrolemanagement.edituser,
        url: apiRoutes.userrolemanagement.edituser.url(id),
        method: "PATCH",
      };

      return apiRequest(patchRoute, {
        payload: data,
        metadata: { id },
      });
    },
    onSuccess: (res) => {
      console.log("User partially updated successfully:", res);
      queryClient.invalidateQueries(["client-user-details"]);
    },
    onError: (error) => {
      console.error("Error partially updating user:", error);
    },
  });

  // Delete User Mutation with Dynamic URL using Metadata Pattern
  const deleteUserMutation = useMutation({
    mutationFn: (userId) => {
      console.log("Delete User ID:", userId);

      // Create route config with dynamic URL
      const deleteRoute = {
        ...apiRoutes.userrolemanagement.deleteuser,
        url: apiRoutes.userrolemanagement.deleteuser.url(userId), // Call function with ID
      };

      console.log("Delete route:", deleteRoute);

      return apiRequest(deleteRoute, {
        metadata: { id: userId }, // Include metadata like your department example
      });
    },
    onSuccess: (res) => {
      console.log("User deleted successfully:", res);
      queryClient.invalidateQueries(["client-user-details"]);
    },
    onError: (error) => {
      console.error("Error deleting user:", error);
      console.error("Delete error details:", error.response?.data);
    },
  });

  return {
    createUser: createUserMutation,
    editUser: editUserMutation,
    patchUser: patchUserMutation,
    deleteUser: deleteUserMutation,

    // Loading states
    isCreating: createUserMutation.isPending,
    isEditing: editUserMutation.isPending,
    isPatching: patchUserMutation.isPending,
    isDeleting: deleteUserMutation.isPending,

    // Error states
    createError: createUserMutation.error,
    editError: editUserMutation.error,
    patchError: patchUserMutation.error,
    deleteError: deleteUserMutation.error,

    // Reset functions
    resetErrors: () => {
      createUserMutation.reset();
      editUserMutation.reset();
      patchUserMutation.reset();
      deleteUserMutation.reset();
    },
  };
};

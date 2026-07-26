import React, { useMemo, useRef, useState } from "react";
import { useGetClientUser } from "@/hooks/query/admin/useGetClientUser";
import { toaster } from "@/components/ui/toaster";
import { useUserRoleManagement } from "@/hooks/mutation/admin/useCreateClientUser";
import GenericTable from "@/components/table/table";
import {
  Box,
  Center,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Portal,
  Text,
  VStack,
} from "@chakra-ui/react";
import { PlusIcon } from "lucide-react";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import { PasswordInput } from "@/components/ui/password-input";
import CustomSelect from "@/components/ui/select";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import UnauthorizedPage from "@/pages/unauthorized";
import { useAuth } from "@/store/providers/auth-provider";

const UserRoleManagement = () => {
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const formRef = useRef(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    user: null,
  });

  // Add specific loading states for individual operations
  const [loadingUsers, setLoadingUsers] = useState(new Set()); // Track which users are being processed
  const [editingUserId, setEditingUserId] = useState(null); // Track which user is being edited
  const [deletingUserId, setDeletingUserId] = useState(null); // Track which user is being deleted

  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    role: "client",
  });

  // Fetch users with Chakra UI toaster for errors
  const {
    data: users,
    isLoading: isLoadingUsers,
    error: usersError,
    refetch: refetchUsers,
  } = useGetClientUser({
    onError: (error) => {
      console.error("Failed to fetch users:", error);
      toaster.error({
        title: "Failed to Load Users",
        description:
          error.message || "Unable to fetch users. Please try again.",
      });
    },
  });

  // Mutation hooks
  const {
    createUser,
    editUser,
    deleteUser,
    createError,
    editError,
    patchError,
    deleteError,
    resetErrors,
  } = useUserRoleManagement();

  const filteredUserList = useMemo(() => {
    return users?.filter((u) => u.username !== user.username);
  }, [users, user.username]);

  // Helper functions to manage individual loading states
  const addLoadingUser = (userId) => {
    setLoadingUsers((prev) => new Set([...prev, userId]));
  };

  const removeLoadingUser = (userId) => {
    setLoadingUsers((prev) => {
      const newSet = new Set(prev);
      newSet.delete(userId);
      return newSet;
    });
  };

  const isUserLoading = (userId) => {
    return loadingUsers.has(userId);
  };

  // Enhanced form validation with username
  const validateForm = () => {
    const errors = {};

    if (!formData.username?.trim()) {
      errors.username = "Username is required";
    } else if (formData.username.length < 3) {
      errors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      errors.username =
        "Username can only contain letters, numbers, and underscores";
    }

    if (!formData.firstName?.trim()) {
      errors.firstName = "First name is required";
    }

    if (!formData.lastName?.trim()) {
      errors.lastName = "Last name is required";
    }

    if (!formData.email?.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!formData.mobile?.trim()) {
      errors.mobile = "Mobile number is required";
    } else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, ""))) {
      errors.mobile = "Mobile number must be 10 digits";
    }

    if (!editingUser && !formData.password?.trim()) {
      errors.password = "Password is required";
    } else if (!editingUser && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (!formData.role) {
      errors.role = "Please select a role";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setFormData({
      username: "",
      firstName: "",
      lastName: "",
      email: "",
      mobile: "",
      password: "",
      role: "client",
    });
    setFormErrors({});
    setEditingUser(null);
    setEditingUserId(null);
    resetErrors();
  };

  const openUserForm = () => {
    resetForm();
    setShowUserForm(true);
  };

  const closeUserForm = () => {
    setShowUserForm(false);
    resetForm();
  };

  const openEditForm = (user) => {
    console.log("Opening edit form for user:", user);
    setFormData({
      username: user.username || "",
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.mail || user.email || "",
      mobile: user.mobile || "",
      password: "",
      role: user.roles || user.role || "client",
    });
    setEditingUser(user);
    setEditingUserId(user.id); // Set the specific user being edited
    setFormErrors({});
    setShowUserForm(true);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();

    console.log("Form submission started");
    console.log("Current form data:", formData);
    console.log("Editing user:", editingUser);

    if (!validateForm()) {
      console.log("Form validation failed");
      toaster.error({
        title: "Validation Error",
        description: "Please fix the form errors before submitting.",
      });
      return;
    }

    setIsSubmitting(true);

    // Add user to loading state if editing
    if (editingUser) {
      addLoadingUser(editingUser.id);
    }

    try {
      const payload = {
        username: formData.username.trim(),
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        mail: formData.email.trim().toLowerCase(),
        mobile: formData.mobile.trim(),
        roles: formData.role,
      };

      console.log("Prepared payload:", payload);

      if (editingUser) {
        console.log("Calling editUser mutation with ID:", editingUser.id);
        const result = await editUser.mutateAsync({
          id: editingUser.id,
          ...payload,
        });
        console.log("Edit result:", result);

        // Success toast for edit
        toaster.success({
          title: "User Updated",
          description: `${formData.firstName} ${formData.lastName} has been updated successfully!`,
        });
      } else {
        console.log("Calling createUser mutation");
        const result = await createUser.mutateAsync(
          {
            ...payload,
            password: formData.password,
          },
          {
            onSuccess: () => {
              toaster.success({
                title: "User Created",
                description: `${formData.firstName} ${formData.lastName} has been created successfully!`,
              });
            },
            onError: (error) => {
              const values = Object.values(error || {})
                ?.flat()
                ?.toString();
              toaster.error({
                title: "Error",
                description:
                  values || "Failed to create user. Please try again.",
              });
            },
          }
        );

        // Success toast for create
      }

      closeUserForm();
      console.log(`User ${editingUser ? "updated" : "created"} successfully`);
    } catch (error) {
      console.error("Failed to save user:", error);
      console.error("Error response:", error.response);

      // Handle specific error cases for form validation
      if (error.response?.data) {
        const errorData = error.response.data;
        const newFormErrors = {};

        if (errorData.username) {
          newFormErrors.username = Array.isArray(errorData.username)
            ? errorData.username[0]
            : errorData.username;
        }
        if (errorData.mail) {
          newFormErrors.email = Array.isArray(errorData.mail)
            ? errorData.mail[0]
            : errorData.mail;
        }

        if (Object.keys(newFormErrors).length > 0) {
          setFormErrors((prev) => ({ ...prev, ...newFormErrors }));
        }
      }
    } finally {
      setIsSubmitting(false);
      // Remove user from loading state
      if (editingUser) {
        removeLoadingUser(editingUser.id);
      }
    }
  };

  // Open confirmation dialog for delete
  const openDeleteConfirmation = (user) => {
    console.log("Opening delete confirmation for:", user);
    setConfirmDelete({
      isOpen: true,
      user,
    });
  };

  // Close confirmation dialog
  const closeDeleteConfirmation = () => {
    setConfirmDelete({
      isOpen: false,
      user: null,
    });
    setDeletingUserId(null);
  };

  // Handle confirmed delete
  const handleConfirmDelete = async (user) => {
    if (!user) return;

    setDeletingUserId(user.id); // Set the specific user being deleted
    addLoadingUser(user.id);

    try {
      console.log("Calling deleteUser mutation with ID:", user.id);
      const result = await deleteUser.mutateAsync(user.id);
      console.log("Delete result:", result);

      // Success toast for delete
      toaster.success({
        title: "User Deleted",
        description: `${user.first_name} ${user.last_name} has been deleted successfully!`,
      });

      closeDeleteConfirmation();
      console.log("User deleted successfully");
    } catch (error) {
      console.error("Failed to delete user:", error);
      console.error("Delete error response:", error.response);

      // Error toast for delete
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "An error occurred while deleting the user";
      toaster.error({
        title: "Failed to Delete User",
        description: errorMessage,
      });
    } finally {
      removeLoadingUser(user.id);
      setDeletingUserId(null);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Get current mutation error to display
  const getCurrentError = () => {
    if (createError) return createError;
    if (editError) return editError;
    if (patchError) return patchError;
    if (deleteError) return deleteError;
    return null;
  };

  // Styles (keeping your existing styles)
  const buttonStyle = {
    padding: "6px 12px",
    border: "none",
    borderRadius: "5px",
    cursor: "pointer",
  };

  if (usersError) {
    return (
      <div style={{ color: "#f44336", textAlign: "center" }}>
        Error loading users: {usersError.message}
        <button
          onClick={() => {
            refetchUsers();
            toaster.create({
              title: "Refreshing Users",
              description: "Refreshing users list...",
              type: "info",
            });
          }}
          style={{
            ...buttonStyle,
            background: "#2196F3",
            color: "white",
            marginLeft: "10px",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  const columns = [
    {
      title: "Username",
      accessor_key: "username",
    },
    {
      title: "First Name",
      accessor_key: "first_name",
    },
    {
      title: "Last Name",
      accessor_key: "last_name",
    },
    {
      title: "Email",
      accessor_key: "mail",
    },
    {
      title: "Role",
      accessor_key: "role",
      render: (_, user) => (
        <Text textTransform="capitalize">
          {user.roles || user.role || "N/A"}
        </Text>
      ),
    },
    {
      title: "Actions",
      accessor_key: "role",
      render: (_, user) => {
        return (
          <HStack gap="4">
            <CustomButton
              onClick={() => {
                console.log("Edit button clicked for user:", user);
                openEditForm(user);
              }}
            >
              Edit{" "}
            </CustomButton>
            {user.roles !== "client" ? (
              <ConfirmationDialog
                title="Delete User"
                description={`Are you sure you want to delete ${user.first_name} ${user.last_name} (${user.username})? This action cannot be undone and will permanently remove the user from the system.`}
                onConfirm={() => handleConfirmDelete(user)}
                buttonName="Delete"
                isLoading={deletingUserId === user?.id}
                buttonProps={{
                  size: "sm",
                  bgImage:
                    "linear-gradient(2deg,rgba(255, 36, 13, 1) 0%,rgba(193, 0, 8, 1) 100%)",
                  border: "none",
                  transition: "all 0.2s ease-in-out",
                  color: "white",
                  css: {
                    "&:hover": {
                      backgroundColor: "transparent !important",
                    },
                    "&:active": {
                      backgroundColor: "transparent !important",
                    },
                    "&:focus": {
                      backgroundColor: "transparent !important",
                    },
                  },
                }}
              />
            ) : (
              <Center>
                <Text as={"span"} textAlign={"center"}>
                  -
                </Text>
              </Center>
            )}
          </HStack>
        );
      },
    },
  ];

  if (!hasPermission("roles_users", "view")) {
    return <UnauthorizedPage />;
  }

  return (
    <div style={{ color: "#333" }}>
      {/* Confirmation Dialog */}

      <div>
        {/* Display global error if any */}
        {getCurrentError() && (
          <div
            style={{
              backgroundColor: "#ffebee",
              color: "#c62828",
              padding: "10px",
              margin: "10px 0",
              borderRadius: "4px",
              border: "1px solid #f44336",
            }}
          >
            Error: {getCurrentError()?.message || "An error occurred"}
          </div>
        )}

        <Box my={8}>
          <GenericTable
            columns={columns || []}
            data={filteredUserList || []}
            loader={isLoadingUsers}
            rightAction={
              <>
                <CustomButton
                  onClick={() => {
                    openUserForm();
                  }}
                  leftIcon={<PlusIcon />}
                >
                  Add User
                </CustomButton>
              </>
            }
            headerLoading={false}
            pagination={false}
            title={"Roles Management"}
            count={filteredUserList?.length || 0}
          />
        </Box>
      </div>

      <Dialog.Root
        open={showUserForm}
        placement={"center"}
        onOpenChange={(v) => setShowUserForm(v.open)}
        scrollBehavior={"inside"}
      >
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content color="#fff" bgColor={"droidalBlack.300"}>
              {/* <form onSubmit={handleSubmit}> */}
              <Dialog.Header>
                <Dialog.Title my="0px !important">
                  {editingUser ? "Edit User" : "Add New User"}
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body overflowY={"auto !important"}>
                <form ref={formRef} autoComplete="off" onSubmit={handleSubmit}>
                  <VStack gap={"10px"}>
                    <CustomInput
                      label={"Username"}
                      name="username"
                      placeholder={"Enter Username"}
                      value={formData.username}
                      disabled={editingUser?.roles === "client" ? true : false}
                      onChange={handleInputChange}
                      invalid={formErrors.username ? true : false}
                      errorMessage={
                        formErrors.username || "Username is required"
                      }
                      showError={formErrors.username ? true : false}
                    />

                    <CustomInput
                      label={"First Name"}
                      placeholder={"Enter First Name"}
                      value={formData.firstName}
                      onChange={handleInputChange}
                      invalid={formErrors.firstName ? true : false}
                      errorMessage={
                        formErrors.firstName || "First Name is required"
                      }
                      name="firstName"
                      showError={formErrors.firstName ? true : false}
                    />

                    <CustomInput
                      label={"Last Name"}
                      placeholder={"Enter Last Name"}
                      value={formData.lastName}
                      onChange={handleInputChange}
                      invalid={formErrors.lastName ? true : false}
                      errorMessage={
                        formErrors.lastName || "Last Name is required"
                      }
                      name="lastName"
                      showError={formErrors.lastName ? true : false}
                    />
                    <CustomInput
                      label={"Email"}
                      type="email"
                      placeholder={"Enter Email"}
                      value={formData.email}
                      disabled={editingUser ? true : false}
                      onChange={handleInputChange}
                      invalid={formErrors.email ? true : false}
                      errorMessage={formErrors.email || "Email is required"}
                      name="email"
                      showError={formErrors.email ? true : false}
                    />
                    <CustomInput
                      label={"Mobile"}
                      type="tel"
                      placeholder={"Enter Mobile"}
                      value={formData.mobile}
                      onChange={handleInputChange}
                      invalid={formErrors.mobile ? true : false}
                      errorMessage={formErrors.mobile || "Mobile is required"}
                      name="mobile"
                      showError={formErrors.mobile ? true : false}
                    />

                    {!editingUser && (
                      <>
                        <Field.Root invalid={!!formErrors.password} mt={4}>
                          <Field.Label
                            fontWeight={"semibold"}
                            letterSpacing={"widest"}
                            color="white"
                            fontSize={"md"}
                          >
                            Password
                          </Field.Label>
                          <PasswordInput
                            size={"md"}
                            rounded={"10px"}
                            variant="outline"
                            color={"white"}
                            bg={"transparent"}
                            name="password"
                            placeholder="Password (min 6 characters)"
                            value={formData.password}
                            onChange={handleInputChange}
                            _placeholder={{ letterSpacing: "widest" }}
                            letterSpacing="widest"
                            borderColor={"#2f4d78"}
                            borderRadius="4px"
                            bgColor={"transparent"}
                            transition={"all .2s ease-in-out"}
                            _hover={{
                              outlineColor: "transparent",
                              border: "1px solid transparent",
                              bgClip: "padding-box, border-box",
                              backgroundOrigin: "padding-box, border-box",
                              backgroundImage:
                                "linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
                            }}
                          />
                          {formErrors.password && (
                            <Field.ErrorText>
                              {formErrors.password}
                            </Field.ErrorText>
                          )}
                        </Field.Root>
                      </>
                    )}

                    <Field.Root invalid={!!formErrors.role}>
                      <Field.Label color="white">Role</Field.Label>
                      <CustomSelect
                        disabled={editingUser?.roles === "client"}
                        options={[
                          {
                            value: "developer",
                            label: "Developer",
                          },
                          {
                            value: "project_manager",
                            label: "Project Manager",
                          },
                          {
                            value: "owner",
                            label: "Owner",
                          },
                          {
                            value: "analyst",
                            label: "Analyst",
                          },
                          {
                            value: "admin",
                            label: "Admin",
                          },
                          {
                            value: "viewer",
                            label: "Viewer",
                          },
                          {
                            value: "bot_operator",
                            label: "Agent Operator",
                          },
                        ]}
                        placeholder={
                          editingUser?.roles === "client"
                            ? "Client"
                            : "Select Role"
                        }
                        width="full"
                        borderRadius="4px !important"
                        borderColor="#2f4d78"
                        css={{
                          "& button": {
                            height: "44px !important",
                            minHeight: "44px !important",
                            borderRadius: "4px !important",
                            borderColor: "#2f4d78",
                          },
                        }}
                        value={[formData.role]}
                        onValueChange={(e) => {
                          handleInputChange({
                            target: { name: "role", value: e?.[0] },
                          });
                        }}
                      />

                      {formErrors.role && (
                        <Field.ErrorText>{formErrors.role}</Field.ErrorText>
                      )}
                    </Field.Root>
                  </VStack>
                </form>
              </Dialog.Body>
              <Dialog.Footer>
                <Dialog.ActionTrigger asChild>
                  <CustomButton variant="outline" disabled={isSubmitting}>
                    Cancel
                  </CustomButton>
                </Dialog.ActionTrigger>
                <CustomButton
                  type="submit"
                  loading={isSubmitting}
                  disabled={isSubmitting}
                  onClick={() => {
                    formRef.current.requestSubmit(); // cleaner than formRef.current.submit()
                  }}
                >
                  {isSubmitting ? "Saving..." : "Save"}
                </CustomButton>
              </Dialog.Footer>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </div>
  );
};

export default UserRoleManagement;

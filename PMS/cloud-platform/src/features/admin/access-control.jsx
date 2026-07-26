import React, { useRef, useState, useEffect } from "react";
import { toaster } from "@/components/ui/toaster";
// import { useUserRoleManagement } from "@/hooks/mutation/admin/useCreateClientUser";
// import { useUserAccessControl } from "@/hooks/mutation/admin/useUserAccessControl";  // Import the hook
import {
  Box,
  CloseButton,
  Dialog,
  Field,
  HStack,
  Portal,
  VStack,
  Text,
  Center,
  Checkbox,
} from "@chakra-ui/react";
import { PlusIcon, ChevronDown, ChevronUp } from "lucide-react";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import { PasswordInput } from "@/components/ui/password-input";
import CustomSelect from "@/components/ui/select";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import { useUserAccessControl } from "@/hooks/mutation/admin/useCreateAccessControl";
import { useGetAccessControl } from "@/hooks/query/admin/useGetAccessControl"; // Import the GET hook

const AccessControl = () => {
  const formRef = useRef(null);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState({
    isOpen: false,
    user: null,
  });

  const [loadingUsers, setLoadingUsers] = useState(new Set());
  const [editingUserId, setEditingUserId] = useState(null);
  const [deletingUserId, setDeletingUserId] = useState(null);
  const [sort, setSort] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    password: "",
    role: "client",
  });

  // Fetch API data
  const {
    data: apiData,
    isLoading: isFetchingPermissions,
    error: fetchError,
  } = useGetAccessControl();

  console.log("apiData1212", apiData);

  // Default permissions (fallback if API returns no data)
  const DEFAULT_PERMISSIONS = [
    {
      feature: "Monitoring Dashboard",
      owner: true,
      admin: true,
      developer: true,
      projectManager: true,
      analyst: true,
      botOperator: true,
      viewer: true,
    },
    {
      feature: "Create Custom DEPT/Agents",
      owner: true,
      admin: true,
      developer: true,
      projectManager: true,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Edit Department",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Agents - Remove/Edit",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Requests Table - View & Export",
      owner: true,
      admin: true,
      developer: true,
      projectManager: true,
      analyst: true,
      botOperator: true,
      viewer: true,
    },
    {
      feature: "Requests Table - Edit/Process/Delete",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: true,
      viewer: false,
    },
    {
      feature: "Analytics",
      owner: true,
      admin: true,
      developer: true,
      projectManager: true,
      analyst: true,
      botOperator: true,
      viewer: true,
    },
    {
      feature: "DroidStudio - Dashboard (View)",
      owner: true,
      admin: true,
      developer: true,
      projectManager: true,
      analyst: true,
      botOperator: true,
      viewer: true,
    },
    {
      feature: "Create/Edit Pods",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Create/Edit Machines",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Create/Edit Triggers",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Create/Edit Assets",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Start/Stop Agents",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: true,
      viewer: false,
    },
    {
      feature: "View Performance Metrics",
      owner: true,
      admin: true,
      developer: true,
      projectManager: true,
      analyst: true,
      botOperator: true,
      viewer: true,
    },
    {
      feature: "ROI – Estimated",
      owner: true,
      admin: true,
      developer: false,
      projectManager: true,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "ROI – Actual Savings",
      owner: true,
      admin: true,
      developer: false,
      projectManager: true,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "ROI – Modify Calculation Settings",
      owner: true,
      admin: true,
      developer: false,
      projectManager: true,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Roles & Users",
      owner: true,
      admin: true,
      developer: false,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Module Permissions",
      owner: true,
      admin: true,
      developer: false,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Column Settings",
      owner: true,
      admin: true,
      developer: true,
      projectManager: true,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Licensing & Subscription",
      owner: true,
      admin: true,
      developer: false,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Audit Logs (View)",
      owner: true,
      admin: true,
      developer: true,
      projectManager: true,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Audit Logs (Export/Delete)",
      owner: true,
      admin: true,
      developer: false,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Agent Secret Keys",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "AI API Keys",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Notifications",
      owner: true,
      admin: true,
      developer: false,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Data Settings",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Developer Settings",
      owner: true,
      admin: true,
      developer: true,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Billing View",
      owner: true,
      admin: true,
      developer: false,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
    {
      feature: "Payment Overview",
      owner: true,
      admin: true,
      developer: false,
      projectManager: false,
      analyst: false,
      botOperator: false,
      viewer: false,
    },
  ];

  // State for permissions: Initialize with API data if available and non-empty, else default
  const [permissions, setPermissions] = useState(() => {
    if (apiData?.permissions && apiData.permissions.length > 0) {
      return apiData.permissions;
    }
    return DEFAULT_PERMISSIONS;
  });

  // Update permissions state when API data changes (e.g., after refetch or initial load)
  useEffect(() => {
    if (apiData?.permissions && apiData.permissions.length > 0) {
      setPermissions(apiData.permissions);
    } else if (!isFetchingPermissions && !fetchError) {
      // Fallback to default if API returns empty or no data
      setPermissions(DEFAULT_PERMISSIONS);
    }
  }, [apiData, isFetchingPermissions, fetchError]);

  // Handle fetch errors
  useEffect(() => {
    if (fetchError) {
      toaster.error({
        title: "Failed to Load Permissions",
        description: "Using default permissions as fallback.",
      });
      setPermissions(DEFAULT_PERMISSIONS);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchError]);

  const {
    createUser: savePermissionsMutation,
    isCreating: isSaving,
    resetErrors,
  } = useUserAccessControl(); // Use the hook

  const handlePermissionChange = (index, role, value) => {
    const updatedPermissions = [...permissions];
    updatedPermissions[index][role] = value;
    setPermissions(updatedPermissions);
  };

  const handleSortClick = (sortKey) => {
    setSort(sortKey);
  };

  const handleSavePermissions = () => {
    // Wrap permissions in the expected payload structure
    const payload = { permissions };

    savePermissionsMutation.mutate(payload, {
      onSuccess: (res) => {
        toaster.success({
          title: "Permissions Updated",
          description:
            res.message || "Role permissions have been saved successfully!",
        });
        resetErrors(); // Clear any previous errors
      },
      onError: (error) => {
        const errorMessage =
          error?.response?.data?.error || "Failed to save permissions.";
        toaster.error({
          title: "Save Failed",
          description: errorMessage,
        });
        resetErrors();
      },
    });
  };

  const handleResetToDefault = () => {
    setPermissions(DEFAULT_PERMISSIONS);
  };

  // Show loading spinner while fetching
  if (isFetchingPermissions) {
    return (
      <Box p={6}>
        <Center h="200px">
          <Text color="white">Loading permissions...</Text>
        </Center>
      </Box>
    );
  }

  const columns = [
    {
      title: "Feature / Module",
      accessor_key: "feature",
      width: "25%",
      tableProps: { "data-sticky": "start" },
      render: (value) => (
        <Text textAlign="left" letterSpacing="widest">
          {value}
        </Text>
      ),
    },
    {
      title: "Owner",
      accessor_key: "owner",
      width: "10%",
      render: (value, row, index) => (
        <Center>
          <Checkbox.Root
            size="md"
            checked={value}
            onCheckedChange={(changes) =>
              handlePermissionChange(index, "owner", changes.checked)
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control
              _checked={{
                bgImage:
                  "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
              }}
              borderColor="#2f4d78"
              bgColor={"black"}
            />
          </Checkbox.Root>
        </Center>
      ),
    },
    {
      title: "Admin",
      accessor_key: "admin",
      width: "10%",
      render: (value, row, index) => (
        <Center>
          <Checkbox.Root
            size="md"
            checked={value}
            onCheckedChange={(changes) =>
              handlePermissionChange(index, "admin", changes.checked)
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control
              _checked={{
                bgImage:
                  "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
              }}
              borderColor="#2f4d78"
              bgColor={"black"}
            />
          </Checkbox.Root>
        </Center>
      ),
    },
    {
      title: "Developer",
      accessor_key: "developer",
      width: "10%",
      render: (value, row, index) => (
        <Center>
          <Checkbox.Root
            size="md"
            checked={value}
            onCheckedChange={(changes) =>
              handlePermissionChange(index, "developer", changes.checked)
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control
              _checked={{
                bgImage:
                  "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
              }}
              borderColor="#2f4d78"
              bgColor={"black"}
            />
          </Checkbox.Root>
        </Center>
      ),
    },
    {
      title: "Project Manager",
      accessor_key: "projectManager",
      width: "10%",
      render: (value, row, index) => (
        <Center>
          <Checkbox.Root
            size="md"
            checked={value}
            onCheckedChange={(changes) =>
              handlePermissionChange(index, "projectManager", changes.checked)
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control
              _checked={{
                bgImage:
                  "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
              }}
              borderColor="#2f4d78"
              bgColor={"black"}
            />
          </Checkbox.Root>
        </Center>
      ),
    },
    {
      title: "Analyst",
      accessor_key: "analyst",
      width: "10%",
      render: (value, row, index) => (
        <Center>
          <Checkbox.Root
            size="md"
            checked={value}
            onCheckedChange={(changes) =>
              handlePermissionChange(index, "analyst", changes.checked)
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control
              _checked={{
                bgImage:
                  "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
              }}
              borderColor="#2f4d78"
              bgColor={"black"}
            />
          </Checkbox.Root>
        </Center>
      ),
    },
    {
      title: "Agent Operator",
      accessor_key: "botOperator",
      width: "10%",
      render: (value, row, index) => (
        <Center>
          <Checkbox.Root
            size="md"
            checked={value}
            onCheckedChange={(changes) =>
              handlePermissionChange(index, "botOperator", changes.checked)
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control
              _checked={{
                bgImage:
                  "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
              }}
              borderColor="#2f4d78"
              bgColor={"black"}
            />
          </Checkbox.Root>
        </Center>
      ),
    },
    {
      title: "Viewer",
      accessor_key: "viewer",
      width: "10%",
      render: (value, row, index) => (
        <Center>
          <Checkbox.Root
            size="md"
            checked={value}
            onCheckedChange={(changes) =>
              handlePermissionChange(index, "viewer", changes.checked)
            }
          >
            <Checkbox.HiddenInput />
            <Checkbox.Control
              _checked={{
                bgImage:
                  "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
              }}
              borderColor="#2f4d78"
              bgColor={"black"}
            />
          </Checkbox.Root>
        </Center>
      ),
    },
  ];

  return (
    <Box p={6}>
      <VStack spacing={6} align="stretch">
        <HStack justify="space-between">
          <Text fontSize="2xl" fontWeight="bold" color="white">
            Iam Role
          </Text>
          <HStack spacing={3}>
            <CustomButton variant="outline" onClick={handleResetToDefault}>
              Reset to Default
            </CustomButton>
            <CustomButton
              onClick={handleSavePermissions}
              loading={isSaving || isFetchingPermissions}
            >
              Save Permissions
            </CustomButton>
          </HStack>
        </HStack>

        {/* Custom Table Implementation */}
        <Box
          rounded={"2xl"}
          h="full"
          pos={"relative"}
          className="bg-droidalBlack-300 shadow-md"
        >
          <Box overflowX="auto">
            <Box
              css={{
                "& th[data-sticky]": {
                  position: "sticky",
                  zIndex: "10 !important",
                  backgroundColor: "#212121",
                },
                "& [data-sticky]": {
                  position: "sticky",
                  zIndex: 0,
                  backgroundColor: "#272727",
                },
                "& [data-sticky=start]": {
                  left: 0,
                  boxShadow: "4px 0 6px -2px rgba(0,0,0,0.3)",
                },
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  border: "none",
                }}
              >
                <thead>
                  <tr style={{ backgroundColor: "#212121" }}>
                    {columns.map((col) => (
                      <th
                        key={col.accessor_key}
                        style={{
                          padding: "12px",
                          textAlign: "center", // Center header text
                          border: "none",
                          color: sort?.includes(col.accessor_key)
                            ? "#fff"
                            : "#90a6c6",
                          cursor: "pointer",
                          width: col.width,
                          ...(col.tableProps || {}),
                        }}
                        onClick={() => handleSortClick(col.accessor_key)}
                      >
                        <HStack justify="center">
                          <Text letterSpacing={"widest"}>{col.title}</Text>
                          <div>
                            {sort?.includes(col.accessor_key) &&
                              !sort.startsWith("-") && (
                                <ChevronDown size={20} color="#008AB3" />
                              )}
                            {sort?.includes(col.accessor_key) &&
                              sort.startsWith("-") && (
                                <ChevronUp size={20} color="#008AB3" />
                              )}
                          </div>
                        </HStack>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {permissions.map((row, index) => (
                    <tr key={index} style={{ backgroundColor: "#272727" }}>
                      {columns.map((col) => (
                        <td
                          key={col.accessor_key}
                          style={{
                            padding: "12px",
                            borderBottom: "2px solid #000000",
                            color: "#fff",
                            textAlign: "center", // Center all table body content
                            verticalAlign: "middle",
                            ...(col.tableProps || {}),
                          }}
                        >
                          {col.render ? (
                            col.render(row[col.accessor_key], row, index)
                          ) : (
                            <Text textAlign="center">
                              {row[col.accessor_key]}
                            </Text>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </Box>
          </Box>

          <Box
            bgColor={"droidalBlack.300"}
            className="bg-droidal-black-300 w-full py-4 px-4 rounded-b-2xl flex justify-between items-center"
          >
            <Text
              letterSpacing={"widest"}
              fontSize={{
                base: "sm",
                "2xl": "md",
                "3xl": "lg",
              }}
              className="text-sm text-white"
            >
              Showing {permissions.length} of {permissions.length}
            </Text>
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default AccessControl;

import CustomButton from "@/components/button/button";
import CustomSelect from "@/components/ui/select";
import { toaster } from "@/components/ui/toaster";
import { useCreateModulePermission } from "@/hooks/mutation/admin/useCreateModulePermission";
import { useUpdateModulePermission } from "@/hooks/mutation/admin/useUpdateModulePermission";
import { useGetClientUser } from "@/hooks/query/admin/useGetClientUser";
import { useGetAllAgents } from "@/hooks/query/useGetAllAgents";
import { CloseButton, Dialog, Field, Portal } from "@chakra-ui/react";
import { PlusIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";

const PermissionModal = ({
  open,
  onOpenChange,
  initialValues = { user: "", module_permissions: [] },
  mode = "add",
}) => {
  const formRef = useRef(null);
  const { mutate: createModulePermission, isPending: isCreatePending } =
    useCreateModulePermission();
  const { mutate: updateModulePermission, isPending: isUpdatePending } =
    useUpdateModulePermission();
  const {
    data: users,
    isLoading: isLoadingUsers,
    isPlaceholderData: isLoadingUsersPlaceholder,
  } = useGetClientUser();
  const {
    data: agents,
    isLoading: isLoadingAgents,
    isPlaceholderData: isLoadingAgentsPlaceholder,
  } = useGetAllAgents();

  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      user: "",
      module_permissions: [],
    },
  });

  const selectedPermissions = watch("module_permissions");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "module_permissions",
  });

  const onSubmit = (v) => {
    if (initialValues.id) {
      updateModulePermission(
        {
          ...v,
          id: initialValues.id,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            toaster.success({
              title: "Success",
              description: "Permission updated",
            });
            reset({
              user: "",
              module_permissions: [],
            });
          },
          onError: () => {
            toaster.error({
              title: "Error",
              description: "Error updating permission",
            });
          },
        },
      );
    } else {
      createModulePermission(v, {
        onSuccess: () => {
          onOpenChange(false);
          toaster.success({
            title: "Success",
            description: "Permission created",
          });
          reset({
            user: "",
            module_permissions: [],
          });
        },
        onError: () => {
          toaster.error({
            title: "Error",
            description: "Error creating permission",
          });
        },
      });
    }
    console.log("submit", v);
  };

  const agentList = useMemo(() => {
    const result = [
      ...agents
        .sort((a, b) => a.module - b.module)
        .map((agent) => ({
          label: agent.app_name + " - " + agent.module_name,
          value: agent.id,
        })),
      {
        label: "Admin - Role",
        value: "admin-role",
      },
      {
        label: "Admin - column settings",
        value: "admin-column-settings",
      },
      {
        label: "Admin - License Management",
        value: "admin-license-management",
      },
      {
        label: "Admin - Audit Logs",
        value: "admin-audit-logs",
      },
      {
        label: "Admin - Billing",
        value: "admin-billing-view",
      },
      {
        label: "Settings - Data Settings",
        value: "settings-data-settings",
      },
      {
        label: "Settings - Agent Secret Keys",
        value: "settings-agent-secret-keys",
      },
      {
        label: "Settings - API Secret Keys",
        value: "settings-api-secret-key",
      },
      {
        label: "ROI - Estimation",
        value: "roi-estimation",
      },
      {
        label: "ROI - Actual",
        value: "roi-actual",
      },
      {
        label: "ABA - Trigger",
        value: "aba-trigger",
      },
      {
        label: "ABA - Asset",
        value: "aba-asset",
      },
      {
        label: "ABA - workspace",
        value: "aba-workspace",
      },
      {
        label: "ABA - Machine",
        value: "aba-machine",
      },
      {
        label: "Menu - Monitoring(hide)",
        value: "menu-monitoring-hide",
      },
      {
        label: "Menu - AgentFlow(hide)",
        value: "menu-agentFlow-hide",
      },
      {
        label: "Menu - ROI(hide)",
        value: "menu-roi-hide",
      },
      {
        label: "Menu - Admin(hide)",
        value: "menu-admin-hide",
      },
      {
        label: "Menu - Voice AI(hide)",
        value: "menu-voice-ai-hide",
      },
      {
        label: "Menu - Settings(hide)",
        value: "menu-settings-hide",
      },
      {
        label: "Menu - Help(hide)",
        value: "menu-help-hide",
      },
    ];
    return result;
    // return result
    // .filter((item) => {
    //   const isSelected = selectedPermissions.find(
    //     (p) => p.module === Number(item.value)
    //   );
    //   if (!isSelected) return true;
    //   return false;
    // });
  }, [agents]);

  const filterUser = useMemo(() => {
    return users?.filter((user) => !["admin", "client"].includes(user.roles));
  }, [users]);

  console.log("filterUser", filterUser);

  useEffect(() => {
    console.log("initialValues", initialValues);
    if (initialValues && mode === "edit") {
      reset({
        user: initialValues.user_data?.id || "",
        module_permissions: initialValues.module_permissions || [
          { module: "", access: "" },
        ],
      });
    } else if (mode === "add") {
      reset({
        user: "",
        module_permissions: [{ module: "", access: "" }],
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues]);

  console.log("agents1221", agents);
  console.log("selectedPermissions", selectedPermissions);

  return (
    <Dialog.Root
      // scrollBehavior={"inside"}
      placement={"center"}
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v.open);
        reset({
          user: "",
          module_permissions: [],
        });
      }}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="!bg-droidal-black-300 text-white">
            <Dialog.Header my={0}>
              <Dialog.Title my={0}>
                {mode === "add" ? "Add" : "Edit"} Permission
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                <Field.Root invalid={!!errors.user}>
                  <Field.Label color="white">Select User</Field.Label>
                  <Controller
                    name="user"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        options={filterUser?.map((user) => ({
                          label: user.first_name + " " + user.last_name,
                          value: user.id,
                        }))}
                        placeholder="Select User"
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
                        value={[field.value]}
                        onValueChange={(v) => {
                          field.onChange(v[0]);
                        }}
                        isLoading={isLoadingUsers || isLoadingUsersPlaceholder}
                      />
                    )}
                    rules={{
                      required: "User is required",
                    }}
                  />
                  {errors.user && (
                    <Field.ErrorText>{errors.user.message}</Field.ErrorText>
                  )}
                </Field.Root>
                <Field.Root mt="4" invalid={!!errors.module_permissions}>
                  <Field.Label color="white">Permissions</Field.Label>
                  {fields.map((field, index) => (
                    <>
                      <div
                        key={field.id}
                        className="flex items-center gap-3 mb-3 w-full"
                      >
                        {/* Module Select */}
                        <div className="w-full">
                          <Controller
                            className="w-full"
                            name={`module_permissions[${index}].module`}
                            control={control}
                            render={({ field }) => (
                              <CustomSelect
                                options={agentList}
                                placeholder="Select Module"
                                width="full"
                                borderRadius="4px !important"
                                borderColor="#2f4d78"
                                css={{
                                  "& button": {
                                    borderRadius: "4px !important",
                                    borderColor: "#2f4d78",
                                  },
                                  // "& .chakra-select__content": {
                                  //   height: "100px !important",
                                  // },
                                }}
                                positioning={{
                                  placement: "bottom",
                                  flip: false,
                                }}
                                value={[field.value]}
                                onValueChange={(v) => field.onChange(v[0])}
                              />
                            )}
                            isLoading={
                              isLoadingAgents || isLoadingAgentsPlaceholder
                            }
                            rules={{ required: "Module is required" }}
                          />
                          {errors?.module_permissions?.[index]?.module && (
                            <Field.ErrorText>
                              {
                                errors?.module_permissions?.[index]?.module
                                  .message
                              }
                            </Field.ErrorText>
                          )}
                        </div>
                        <CustomButton
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="h-9 w-9"
                          disabled={fields.length === 1}
                          onClick={() => remove(index)}
                        >
                          <Trash2Icon size={16} />
                        </CustomButton>
                      </div>
                    </>
                  ))}
                </Field.Root>
                <CustomButton
                  variant="outline"
                  onClick={() => append({ module: "", access: "" })}
                  leftIcon={<PlusIcon size={16} />}
                  w="full"
                  borderRadius="4px !important"
                >
                  Add Permission
                </CustomButton>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <CustomButton variant="outline">Cancel</CustomButton>
              </Dialog.ActionTrigger>
              <CustomButton
                onClick={() => {
                  formRef.current?.requestSubmit();
                }}
                isLoading={isCreatePending || isUpdatePending}
                disabled={isCreatePending || isUpdatePending}
              >
                Submit
              </CustomButton>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default PermissionModal;

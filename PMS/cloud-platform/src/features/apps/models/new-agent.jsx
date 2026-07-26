"use client";

import {
  Button,
  Dialog,
  Portal,
  Field,
  Input,
  Textarea,
  Stack,
  SimpleGrid,
  VStack,
  CloseButton,
  Icon,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useEffect, useMemo, useState } from "react";
import { CirclePlus, PlusIcon } from "lucide-react";
import { DropzoneUploader } from "@/components/dropzone-uploader/uploader";
import { Text } from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Link, useParams } from "react-router-dom";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import { useCreateAgent } from "@/hooks/mutation/agentsapp/useCreateAgent";
import { atobDepartmentId } from "@/utils/helper";
import { toaster } from "@/components/ui/toaster";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import { useEditAgent } from "@/hooks/mutation/agentsapp/useEditAgent";

export default function AgentForm({
  mode = "add",
  initialValues = {},
  checkPermission = () => true,
  customButtonName = "",
  existingAgentNames = [],
}) {
  const { department_id } = useParams();

  const departmentId =
    mode === "add" ? atobDepartmentId(department_id) : initialValues.module;
  const [open, setOpen] = useState(false);

  const { hasPermission } = usePermissions();

  const {
    handleSubmit,
    formState: { errors },
    control,
    reset,
    setError,
    clearErrors,
  } = useForm({
    defaultValues: {
      app_name: "",
    },
  });

  const { mutate, isPending } = useCreateAgent();
  const { mutate: editAgent, isPending: editPending } = useEditAgent();

  const normalizeAgentName = (value) => value?.trim().toLowerCase();

  const existingAgentNameSet = useMemo(
    () =>
      new Set(
        existingAgentNames
          .map((name) => normalizeAgentName(name))
          .filter(Boolean),
      ),
    [existingAgentNames],
  );

  const getFirstErrorMessage = (value) => {
    if (Array.isArray(value)) {
      return value[0];
    }
    return typeof value === "string" ? value : "";
  };

  const getCreateAgentNameError = (error) => {
    const appNameMessage = getFirstErrorMessage(error?.app_name);
    if (appNameMessage) {
      return appNameMessage;
    }

    const fallbackMessage =
      getFirstErrorMessage(error?.non_field_errors) ||
      error?.detail ||
      error?.error ||
      error?.message ||
      "";

    if (
      /already exists|already exist|duplicate|unique/i.test(fallbackMessage)
    ) {
      return fallbackMessage;
    }

    return "";
  };

  const onSubmit = (data) => {
    if (mode === "edit") {
      editAgent(
        {
          id: initialValues.id,
          ...data,
          module: departmentId,
        },
        {
          onSuccess: () => {
            reset();
            setOpen(false);
            toaster.success({
              title: "Success",
              description: "Agent updated successfully",
            });
          },
          onError: (error) => {
            console.log("error", error);
            toaster.error({
              title: "Error",
              description: error.message || "Error updating agent",
            });
          },
        },
      );
    } else {
      const normalizedName = normalizeAgentName(data.app_name);
      if (existingAgentNameSet.has(normalizedName)) {
        setError("app_name", {
          type: "manual",
          message: "Agent name already exists",
        });
        return;
      }

      mutate(
        {
          ...data,
          module: departmentId,
        },
        {
          onSuccess: () => {
            reset();
            setOpen(false);
            toaster.success({
              title: "Success",
              description: "Agent created successfully",
            });
          },
          onError: (error) => {
            console.log("error", error);
            const appNameError = getCreateAgentNameError(error);

            if (appNameError) {
              setError("app_name", {
                type: "server",
                message: appNameError,
              });
              return;
            }

            toaster.error({
              title: "Error",
              description: error.message || "Error creating agent",
            });
          },
        },
      );
    }
  };

  // FIXED: Handle open attempts with permission check
  const handleOpenChange = (e) => {
    if (e.open) {
      const canCreateAgent = hasPermission(
        "create_custom_dept_agents",
        "create",
      );
      if (!canCreateAgent) {
        return;
      }
    } else {
      setOpen(e.open); // Allow open/close if permitted
    }
  };

  useEffect(() => {
    if (mode === "edit") {
      reset({
        app_name: initialValues.app_name,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues.app_name, mode]);

  return (
    <Dialog.Root
      scrollBehavior="inside"
      size="md"
      open={open}
      placement={"center"}
      onOpenChange={handleOpenChange} // FIXED: Permission check here
      closeOnInteractOutside={false}
      //   onInteractOutside={(e) => {
      //     e.stopImmediatePropagation();
      //     e.stopPropagation();
      //     alert("outside2");
      //   }}
      //   onPointerDownOutside={(e) => {
      //     alert("outside");
      //     e.stopImmediatePropagation();
      //     e.stopPropagation();
      //   }}
    >
      <Dialog.Trigger asChild>
        <>
          {mode === "edit" && (
            <CustomButton
              onClick={() => {
                if (!checkPermission()) {
                  return;
                }

                setOpen(true);
              }}
            >
              Edit
            </CustomButton>
          )}
          {mode !== "edit" && (
            <Link to="#">
              <Box
                bgImage={"var(--bg-blue-gradient2)"}
                h={{
                  base: "140px",
                  "2xl": "160px",
                  "3xl": "180px",
                }}
                role="button"
                onClick={() => {
                  const canCreateAgent = hasPermission(
                    "create_custom_dept_agents",
                    "create",
                  );
                  if (!canCreateAgent) {
                    return;
                  }
                  setOpen(true);
                }}
                className="cursor-pointer rounded-3xl shadow-md px-5 py-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="flex justify-between h-full">
                  <VStack justify={"space-between"} align={"start"}>
                    <Icon
                      height={{
                        base: "50px",
                        "2xl": "60px",
                        "3xl": "74px",
                      }}
                      width={{
                        base: "50px",
                        "2xl": "60px",
                        "3xl": "74px",
                      }}
                      color="tomato"
                    >
                      <CirclePlus color="black" strokeWidth={1} />
                    </Icon>

                    <Text
                      pl={{
                        base: 1,
                        "2xl": 4,
                        "3xl": 6,
                      }}
                      color="black"
                      letterSpacing={"widest"}
                      fontSize={{
                        base: "sm",
                        "2xl": "md",
                        "3xl": "lg",
                      }}
                      whiteSpace={customButtonName ? "normal" : "nowrap"}
                      fontWeight={"medium"}
                    >
                      {customButtonName || "Add a custom agent"}
                    </Text>
                  </VStack>
                </div>
              </Box>
            </Link>
          )}
        </>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="!bg-droidal-black-300 overflow-auto">
            <form onSubmit={handleSubmit(onSubmit)}>
              <Dialog.Header>
                <Dialog.Title
                  letterSpacing={"widest"}
                  m={0}
                  className="text-white"
                >
                  {customButtonName ? "Create Voice Agent" : "Create Agent"}
                </Dialog.Title>
              </Dialog.Header>

              <Dialog.CloseTrigger
                bg={"transparent"}
                _hover={{
                  bg: "transparent",
                }}
                asChild
              >
                <CloseButton color={"white"} size="lg" />
              </Dialog.CloseTrigger>
              <Dialog.Body py={5}>
                <Controller
                  name="app_name"
                  control={control}
                  rules={{
                    required: "Agent Name is required",
                    validate: (value) => {
                      if (mode !== "add") {
                        return true;
                      }

                      const normalizedName = normalizeAgentName(value);
                      if (existingAgentNameSet.has(normalizedName)) {
                        return "Agent name already exists";
                      }

                      return true;
                    },
                  }}
                  render={({ field }) => (
                    <CustomInput
                      label={"Agent Name"}
                      placeholder="Agent Name"
                      value={field.value}
                      onChange={(e) => {
                        clearErrors("app_name");
                        field.onChange(e);
                      }}
                      autoFocus={true}
                      errorMessage={
                        errors.app_name?.message || "Enter the Agent Name"
                      }
                      invalid={errors.app_name ? true : false}
                      showError={errors.app_name ? true : false}
                    />
                  )}
                />
              </Dialog.Body>

              <Dialog.Footer>
                <CustomButton
                  variant={"plain"}
                  mr={3}
                  onClick={() => {
                    setOpen(false);
                    reset();
                  }}
                >
                  Cancel
                </CustomButton>
                <CustomButton type="submit" loading={isPending || editPending}>
                  Submit
                </CustomButton>
              </Dialog.Footer>
            </form>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

"use client";

import { Dialog, Portal, VStack, CloseButton } from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useState } from "react";
import { CirclePlus, PlusIcon } from "lucide-react";
import { DropzoneUploader } from "@/components/dropzone-uploader/uploader";
import { Text } from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Link } from "react-router-dom";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import { toaster } from "@/components/ui/toaster";
import { useCreateDepartment } from "@/hooks/mutation/agentsapp/useCreateDepartment";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions"; // Your hook path

export default function NewDepartmentForm({ showSecondarySidebarShrink }) {
  const [open, setOpen] = useState(false);

  // NEW: Use permissions hook
  const { hasPermission } = usePermissions();
  // const canCreateDepartment = hasPermission("add_edit_department", "create"); // False for analyst
  const canCreateDepartment = false;
  const {
    handleSubmit,
    formState: { errors },
    control,
    reset,
  } = useForm({
    defaultValues: {
      module_name: "",
    },
  });

  const { mutate, isPending } = useCreateDepartment();

  const onSubmit = (data) => {
    mutate(
      {
        ...data,
      },
      {
        onSuccess: () => {
          reset();
          setOpen(false);
          toaster.success({
            title: "Success",
            description: "Department created successfully",
          });
        },
        onError: (error) => {
          console.log("error", error);
          toaster.error({
            title: "Error",
            description: error.message || "Error creating department",
          });
        },
      }
    );
  };

  // FIXED: Handle open attempts with permission check
  const handleOpenChange = (e) => {
    if (e.open) {
      if (hasPermission("create_custom_dept_agents", "create")) setOpen(e.open);
      return; // Don't call setOpen(true)
    }
    setOpen(e.open); // Allow open/close if permitted
  };

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
        {/* FIXED: Always render clickable Box (no hiding/disabling) */}
        <Box
          cursor={"pointer"} // Always looks clickable
          className={
            showSecondarySidebarShrink
              ? "flex px-[15px] py-2 relative justify-center"
              : "flex px-[15px] py-2 relative gap-3 items-center"
          }
          role="button"
        >
          <Box className="relative">
            {/* <Icon size={25} color="#94F219" /> */}
            <CirclePlus color="#818181" />
          </Box>
          {!showSecondarySidebarShrink && (
            <Text
              className="department-text"
              letterSpacing={"widest"}
              color={showSecondarySidebarShrink ? "#fff" : "#818181"}
            >
              ADD DEPARTMENT
            </Text>
          )}
        </Box>
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
                  Create New Department
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
                  name="module_name"
                  control={control}
                  rules={{ required: "Department Name is required" }}
                  render={({ field }) => (
                    <CustomInput
                      label={"Department Name"}
                      placeholder="Department Name"
                      value={field.value}
                      onChange={field.onChange}
                      errorMessage="Enter the Department Name"
                      invalid={errors.module_name ? true : false}
                      showError={errors.module_name ? true : false}
                    />
                  )}
                />
              </Dialog.Body>

              <Dialog.Footer>
                <CustomButton
                  variant={"plain"}
                  mr={3}
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </CustomButton>
                <CustomButton type="submit" loading={isPending}>
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

import { useForm } from "react-hook-form";
import {
  Container,
  Box,
  Text,
  Card,
  Button,
  Field,
  Input,
  Stack,
  Dialog,
  Menu,
  Portal,
  HStack,
} from "@chakra-ui/react";
import { useCreatePods } from "@/hooks/mutation/useCreatePods";
import { toaster } from "@/components/ui/toaster";
import { useNavigate } from "react-router-dom";
import CustomButton from "@/components/button/button";
import { useUpdatePods } from "@/hooks/mutation/aba/useUpdatePods";
import { useEffect } from "react";
import CustomInput from "@/components/input/input";
const PodsModal = ({ mode = "add", initialValues = {}, open, onClose }) => {
  const navigate = useNavigate();
  const { mutate, isPending } = useCreatePods();
  const { mutate: updateMutate, isPending: isUpdatePending } = useUpdatePods();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      project_name: "",
      description: "",
    },
  });

  const onSubmit = (data) => {
    console.log("Form Submitted:", data);
    if (initialValues.id) {
      updateMutate(
        {
          ...data,
          id: initialValues.id,
        },
        {
          onSuccess: () => {
            toaster.success({
              title: "Pods Updated",
              description: "Pods updated successfully",
            });
            onClose();
            reset({
              project_name: "",
              description: "",
            });
          },
          onError: (error) => {
            console.log("error", error);
            toaster.error({
              title: "Error",
              description: error.message || "Error updating pods",
            });
          },
        }
      );
    } else {
      mutate(
        {
          ...data,
        },
        {
          onSuccess: (response) => {
            console.log("response", response);
            const id = response.id;
            toaster.success({
              title: "Pods Created",
              description: "Pods created successfully",
            });
            navigate(`/aba/pods/${id}/create-task/`);
          },
          onError: (error) => {
            console.log("error", error);
            toaster.error({
              title: "Error",
              description: error.message || "Error creating pods",
            });
          },
        }
      );
    }
  };

  useEffect(() => {
    if (initialValues && mode === "edit") {
      reset(initialValues);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, mode]);

  return (
    <Dialog.Root placement={"center"} open={open}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bgColor={"droidalBlack.300"} color={"white"}>
            <Dialog.Title
              fontSize="xl"
              px="6"
              pt="8"
              m={0}
              fontWeight="semibold"
            >
              {mode === "add" ? "Create Pods" : "Edit Pods"}
            </Dialog.Title>

            <Dialog.Body>
              <form onSubmit={handleSubmit(onSubmit)}>
                <Stack gap="4" w="full">
                  {/* Project Name */}
                  <CustomInput
                    label="Name"
                    placeholder="Pods Name"
                    {...register("project_name", {
                      required: "Name is required",
                    })}
                    invalid={!!errors.project_name}
                    showError={!!errors.project_name}
                    errorMessage={errors.project_name?.message}
                  />
                  <CustomInput
                    label="Description"
                    placeholder="Pods Description"
                    {...register("description", {
                      required: "Name is required",
                    })}
                    invalid={!!errors.description}
                    showError={!!errors.description}
                    errorMessage={errors.description?.message}
                  />
                </Stack>

                <HStack justifyContent="flex-end" mt={6}>
                  <CustomButton
                    variant="outline"
                    type="button"
                    onClick={() => {
                      onClose();
                      reset({
                        project_name: "",
                        description: "",
                      });
                    }}
                  >
                    Cancel
                  </CustomButton>
                  <CustomButton
                    loading={isPending || isUpdatePending}
                    type="submit"
                  >
                    Submit
                  </CustomButton>
                </HStack>
              </form>
            </Dialog.Body>

            {/* <Dialog.Footer>
            </Dialog.Footer> */}
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default PodsModal;

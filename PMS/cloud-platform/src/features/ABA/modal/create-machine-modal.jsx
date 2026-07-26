import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  Field,
  Input,
  Button,
  Stack,
  Heading,
  Portal,
  NumberInput,
  Textarea,
} from "@chakra-ui/react";
import { useEffect } from "react";
import { toaster } from "@/components/ui/toaster";
import { useCreateMachine } from "@/hooks/mutation/useCreateMachine";
import { useUpdateMachine } from "@/hooks/mutation/useUpdateMachine";

export function CreateMachineModal({ isOpen, onClose, mode, initialValues }) {
  const { mutate: createMutate, isPending: isCreatePending } =
    useCreateMachine();
  const { mutate: updateMutate, isPending: isUpdatePending } =
    useUpdateMachine();

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      machine_name: "",
      machine_ip: "",
      width: "",
      height: "",
      machine_username: "",
      machine_password: "",
      modules_and_apps: "",
      license_key: "",
    },
  });

  const onSubmit = (formData) => {
    const payload = {
      ...formData,
      // Convert dimensions to numbers
      width: Number(formData.width),
      height: Number(formData.height),
    };

    if (mode === "edit") {
      updateMutate(
        {
          ...payload,
          id: initialValues.id,
        },
        {
          onSuccess: () => {
            toaster.success({
              title: "Machine Updated",
              description: "Machine updated successfully",
            });
            handleClose();
          },
          onError: (error) => {
            toaster.error({
              title: "Update Failed",
              description: error.message || "Error updating machine",
            });
          },
        }
      );
    } else {
      createMutate(payload, {
        onSuccess: () => {
          toaster.success({
            title: "Machine Created",
            description: "Machine created successfully",
          });
          handleClose();
        },
        onError: (error) => {
          toaster.error({
            title: "Creation Failed",
            description: error.message || "Error creating machine",
          });
        },
      });
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (mode === "edit" && initialValues) {
      reset({
        machine_name: initialValues.machine_name,
        machine_ip: initialValues.machine_ip,
        width: initialValues.width,
        height: initialValues.height,
        machine_username: initialValues.machine_username,
        machine_password: initialValues.machine_password,
        modules_and_apps: initialValues.modules_and_apps,
      });
    } else {
      reset({
        machine_name: "",
        machine_ip: "",
        width: "",
        height: "",
        machine_username: "",
        machine_password: "",
        modules_and_apps: "",
        license_key: "",
      });
    }
  }, [mode, initialValues, reset]);

  return (
    <Dialog.Root
      scrollBehavior={"inside"}
      open={isOpen}
      onOpenChange={handleClose}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bgColor={"droidalBlack.300"} color="white" maxW="lg">
            <Dialog.Header my={0}>
              <Dialog.Title my={0} fontSize="xl" fontWeight="semibold">
                {mode === "edit" ? "Edit Machine" : "Create Machine"}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <form
                id="create-machine-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
              >
                <Stack spacing={6}>
                  {/* General Details */}
                  <Stack spacing={4}>
                    <Heading size="sm">General Details</Heading>

                    <Field.Root invalid={!!errors.machine_name}>
                      <Field.Label>Machine Name</Field.Label>
                      <Input
                        placeholder="Enter Name"
                        {...register("machine_name", {
                          required: "Name is required",
                        })}
                      />
                      <Field.ErrorText>
                        {errors.machine_name?.message}
                      </Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.machine_ip}>
                      <Field.Label>IP Address</Field.Label>
                      <Input
                        placeholder="Enter IP Address"
                        {...register("machine_ip", {
                          required: "IP Address is required",
                        })}
                      />
                      <Field.ErrorText>
                        {errors.machine_ip?.message}
                      </Field.ErrorText>
                    </Field.Root>
                  </Stack>

                  {/* Dimensions */}
                  <Stack spacing={4}>
                    <Heading size="sm">Dimensions</Heading>

                    <Field.Root invalid={!!errors.width}>
                      <Field.Label>Width</Field.Label>
                      <Controller
                        name="width"
                        control={control}
                        rules={{
                          required: "Width is required",
                          min: {
                            value: 1,
                            message: "Width must be greater than 0",
                          },
                        }}
                        render={({ field, fieldState }) => (
                          <>
                            <NumberInput.Root>
                              <NumberInput.Input
                                {...field}
                                min={1}
                                placeholder="Enter width"
                              />
                              <NumberInput.Control>
                                <NumberInput.IncrementTrigger />
                                <NumberInput.DecrementTrigger />
                              </NumberInput.Control>
                            </NumberInput.Root>
                            {fieldState.error && (
                              <Field.ErrorText>
                                {fieldState.error.message}
                              </Field.ErrorText>
                            )}
                          </>
                        )}
                      />
                    </Field.Root>

                    <Field.Root invalid={!!errors.height}>
                      <Field.Label>Height</Field.Label>
                      <Controller
                        name="height"
                        control={control}
                        rules={{
                          required: "Height is required",
                          min: {
                            value: 1,
                            message: "Height must be greater than 0",
                          },
                        }}
                        render={({ field, fieldState }) => (
                          <>
                            <NumberInput.Root>
                              <NumberInput.Input
                                {...field}
                                min={1}
                                placeholder="Enter height"
                              />
                              <NumberInput.Control>
                                <NumberInput.IncrementTrigger />
                                <NumberInput.DecrementTrigger />
                              </NumberInput.Control>
                            </NumberInput.Root>
                            {fieldState.error && (
                              <Field.ErrorText>
                                {fieldState.error.message}
                              </Field.ErrorText>
                            )}
                          </>
                        )}
                      />
                    </Field.Root>
                  </Stack>

                  {/* Credentials */}
                  <Stack spacing={4}>
                    <Heading size="sm">Credentials</Heading>

                    <Field.Root invalid={!!errors.machine_username}>
                      <Field.Label>Username</Field.Label>
                      <Input
                        placeholder="Enter Username"
                        {...register("machine_username", {
                          required: "Username is required",
                        })}
                      />
                      <Field.ErrorText>
                        {errors.machine_username?.message}
                      </Field.ErrorText>
                    </Field.Root>

                    <Field.Root invalid={!!errors.machine_password}>
                      <Field.Label>Password</Field.Label>
                      <Input
                        type="password"
                        placeholder="Enter password"
                        {...register("machine_password", {
                          required: "Password is required",
                        })}
                      />
                      <Field.ErrorText>
                        {errors.machine_password?.message}
                      </Field.ErrorText>
                    </Field.Root>
                  </Stack>
                </Stack>
              </form>
            </Dialog.Body>

            <Dialog.Footer>
              <Button
                variant="outline"
                color="#fff"
                borderColor={"#fff"}
                bg="transparent"
                _hover={{
                  bg: "transparent",
                  color: "#fff",
                  borderColor: "#fff",
                }}
                onClick={handleClose}
                mr={3}
              >
                Cancel
              </Button>
              <Button
                colorPalette={"gray"}
                variant="subtle"
                loading={isCreatePending || isUpdatePending}
                type="submit"
                form="create-machine-form"
              >
                {mode === "edit" ? "Update Machine" : "Create Machine"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

export default CreateMachineModal;

import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  Field,
  Input,
  Textarea,
  Button,
  Stack,
  Heading,
  Portal,
  NativeSelect,
  NumberInput,
} from "@chakra-ui/react";
import { useCreateAsset } from "@/hooks/mutation/useCreateAsset";
import { useEffect, useRef } from "react";
import { toaster } from "@/components/ui/toaster";
import { useUpdateAsset } from "@/hooks/mutation/useUpdateAsset";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import CustomTextArea from "@/components/textarea/textarea";

export function CreateAssetsModal({ isOpen, onClose, mode, initialValues }) {
  const { mutate: createMutate, isPending: isCreatePending } = useCreateAsset();
  const { mutate: updateMutate, isPending: isUpdatePending } = useUpdateAsset();
  const formRef = useRef(null);
  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: "",
      asset_type: "",
      value: "",
      label: "",
      description: "",
    },
  });

  const assetType = watch("asset_type");

  const onSubmit = (formData) => {
    const payload = {
      ...formData,
      // Convert value to proper type based on asset type
      value: assetType === "Integer" ? Number(formData.value) : formData.value,
    };

    if (mode === "edit") {
      console.log(initialValues);
      updateMutate(
        {
          ...payload,
          id: initialValues.asset_id,
        },
        {
          onSuccess: () => {
            toaster.success({
              title: "Asset Updated",
              description: "Asset updated successfully",
            });
            handleClose();
          },
          onError: (error) => {
            toaster.error({
              title: "Update Failed",
              description: error.message || "Error updating asset",
            });
          },
        }
      );
    } else {
      createMutate(payload, {
        onSuccess: () => {
          toaster.success({
            title: "Asset Created",
            description: "Asset created successfully",
          });
          handleClose();
        },
        onError: (error) => {
          toaster.error({
            title: "Creation Failed",
            description: error.message || "Error creating asset",
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
      // Convert value to string for form compatibility
      const stringValue = initialValues.value.toString();
      if (initialValues.asset_type === "Credentials") {
        reset({
          name: initialValues.name,
          asset_type: initialValues.asset_type,
          value: "*****",
          label: initialValues.label,
          description: initialValues.description,
        });
      } else {
        reset({
          name: initialValues.name,
          asset_type: initialValues.asset_type,
          value: stringValue,
          label: initialValues.label,
          description: initialValues.description,
        });
      }
    } else {
      // Reset form for create mode
      reset({
        name: "",
        asset_type: "",
        value: "",
        label: "",
        description: "",
      });
    }
  }, [mode, initialValues, reset]);

  const renderValueInput = () => {
    switch (assetType) {
      case "Boolean":
        return (
          <NativeSelect.Root>
            <NativeSelect.Field
              placeholder="Select value"
              {...register("value", {
                required: "Value is required",
              })}
            >
              <option value="true">True</option>
              <option value="false">False</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        );
      case "Integer":
        return (
          <Controller
            name="value"
            control={control}
            rules={{
              required: "Value is required",
              validate: (value) => !isNaN(value) || "Must be a number",
            }}
            render={({ field, fieldState }) => (
              <>
                <NumberInput.Root>
                  <NumberInput.Input
                    {...field}
                    min={0}
                    placeholder="Enter number"
                  />
                  <NumberInput.Control>
                    <NumberInput.IncrementTrigger />
                    <NumberInput.DecrementTrigger />
                  </NumberInput.Control>
                </NumberInput.Root>
                {fieldState.error && (
                  <Field.ErrorText>{fieldState.error.message}</Field.ErrorText>
                )}
              </>
            )}
          />
        );
      case "Credentials":
        // ⭐ Mask everything as *** (password input)
        return (
          <Input
            type="password"
            placeholder="Enter credentials"
            {...register("value", {
              required: "Value is required",
            })}
          />
        );
      default:
        return (
          <Input
            placeholder="Enter text"
            {...register("value", {
              required: "Value is required",
            })}
          />
        );
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      scrollBehavior={"inside"}
      onOpenChange={handleClose}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bgColor={"droidalBlack.300"} color={"#fff"} maxW="lg">
            <Dialog.Header my={0}>
              <Dialog.Title my={0} fontSize="xl" fontWeight="semibold">
                {mode === "edit" ? "Edit Asset" : "Create New Asset"}
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              <form
                id="create-asset-form"
                onSubmit={handleSubmit(onSubmit)}
                noValidate
                ref={formRef}
              >
                <Stack spacing={6}>
                  {/* General Details */}
                  <Stack spacing={4}>
                    <Heading size="sm">General Details</Heading>

                    <CustomInput
                      label="Asset Name"
                      placeholder={"Enter Name"}
                      invalid={!!errors.name}
                      {...register("name", {
                        required: "Name is required",
                      })}
                      showError={!!errors.name}
                      errorMessage={errors.name?.message}
                    />

                    <Field.Root invalid={!!errors.asset_type}>
                      <Field.Label>Asset Type</Field.Label>
                      <Controller
                        name="asset_type"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            options={[
                              {
                                value: "String",
                                label: "String",
                              },
                              {
                                value: "Integer",
                                label: "Integer",
                              },
                              {
                                value: "Boolean",
                                label: "Boolean",
                              },
                              {
                                value: "Credentials",
                                label: "Credentials",
                              },
                            ]}
                            placeholder="Select Alert Type"
                            width="full"
                            css={{
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                            }}
                            borderColor="#2f4d78"
                            value={[field.value]}
                            onValueChange={(v) => field.onChange(v[0])}
                          />
                        )}
                        rules={{
                          required: "Alert Types are required",
                        }}
                      />
                      <Field.ErrorText>
                        {errors.asset_type?.message}
                      </Field.ErrorText>
                    </Field.Root>
                  </Stack>

                  {/* Asset Value */}
                  <Stack spacing={4}>
                    {/* <Heading size="sm">Asset Value</Heading> */}
                    <Field.Root invalid={!!errors.value}>
                      <Field.Label>
                        {assetType ? `${assetType} Value` : "Value"}
                      </Field.Label>
                      {renderValueInput()}
                      {errors.value && (
                        <Field.ErrorText>
                          {errors.value.message}
                        </Field.ErrorText>
                      )}
                    </Field.Root>
                  </Stack>

                  {/* Additional Fields */}
                  <Stack spacing={4}>
                    <Heading size="sm">Additional Information</Heading>

                    <Field.Root>
                      <CustomInput
                        label={"Labels"}
                        placeholder="Enter labels (comma separated)"
                        {...register("label", {
                          required: "Labels are required",
                        })}
                        showError={!!errors.label}
                        errorMessage={errors.label?.message}
                        invalid={!!errors.label}
                      />
                    </Field.Root>

                    <Field.Root invalid={!!errors.description}>
                      <Field.Label>Description</Field.Label>
                      <CustomTextArea
                        placeholder="Enter description"
                        rows={3}
                        {...register("description", {
                          required: "Description is required",
                        })}
                      />
                      <Field.ErrorText>
                        {errors.description?.message}
                      </Field.ErrorText>
                    </Field.Root>
                  </Stack>
                </Stack>
              </form>
            </Dialog.Body>

            <Dialog.Footer>
              <CustomButton variant="outline" onClick={handleClose} mr={3}>
                Cancel
              </CustomButton>
              <CustomButton
                loading={isCreatePending || isUpdatePending}
                type="submit"
                onClick={() => {
                  formRef.current.requestSubmit();
                }}
              >
                Submit
              </CustomButton>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  Field,
  Input,
  Textarea,
  Checkbox,
  Button,
  Stack,
  Heading,
  Portal,
} from "@chakra-ui/react";
import CustomSelect from "@/components/ui/select";
import { useGetPodsQuery } from "@/hooks/query/projects/useGetPodsQuery";
import { useCreateQueue } from "@/hooks/mutation/useCreateQueue";
import { toaster } from "@/components/ui/toaster";
import { useEffect } from "react";
import { useUpdateQueue } from "@/hooks/mutation/useUpdateQueue";

export function CreateQueueModal({
  isOpen,
  onClose,
  mode = "create",
  initialValues,
}) {
  const { data: projectList = [] } = useGetPodsQuery();
  const { mutate, isPending: isCreatePending } = useCreateQueue();
  const { mutate: updateMutate, isPending } = useUpdateQueue();
  console.log("projectList", projectList);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      project: [],
      queue_name: "",
      description: "",
      retry_count: "0",
      truncate_date: null,
    },
  });

  const onSubmit = (data) => {
    console.log("Form Submitted:", data);
    if (mode === "edit") {
      updateMutate(
        {
          ...data,
          project: data.project[0],
          retry_count: data.retry_count[0],
          id: initialValues.id,
        },
        {
          onSuccess: (response) => {
            console.log("response", response);
            toaster.success({
              title: "Queue Updated",
              description: "Queue updated successfully",
            });
            onClose();
          },
          onError: (error) => {
            console.log("error", error);
            toaster.error({
              title: "Error",
              description: error.message || "Error updating queue",
            });
          },
        }
      );
      return;
    }
    if (mode === "create") {
      mutate(
        {
          ...data,
          project: data.project[0],
          retry_count: data.retry_count[0],
        },
        {
          onSuccess: (response) => {
            console.log("response", response);
            toaster.success({
              title: "Queue Created",
              description: "Queue created successfully",
            });
            onClose();
          },
          onError: (error) => {
            console.log("error", error);
            toaster.error({
              title: "Error",
              description: error.message || "Error creating queue",
            });
          },
        }
      );
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  useEffect(() => {
    if (mode === "edit" && initialValues) {
      console.log("initialValues", initialValues);
      reset({
        project: [initialValues.project],
        queue_name: initialValues.queue_name,
        description: initialValues.description,
        retry_count: [
          initialValues.retry_count ? String(initialValues.retry_count) : "0",
        ],
        truncate_date: initialValues.truncate_date,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialValues]);

  return (
    <Dialog.Root open={isOpen} onOpenChange={handleClose}>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="lg">
            <Dialog.Body>
              <form id="create-queue-form" onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={6}>
                  {/* General Details */}
                  <div>
                    <Heading as="h3" size="xl" mb={4}>
                      General Details
                    </Heading>
                    <Stack spacing={4}>
                      <Field.Root invalid={!!errors.project}>
                        <Field.Label htmlFor="name">Project</Field.Label>
                        <Controller
                          name="project"
                          control={control}
                          render={({ field }) => {
                            console.log("field999", field);
                            return (
                              <CustomSelect
                                placeholder="Select Project"
                                value={field.value}
                                options={projectList.map((project) => ({
                                  value: project.id,
                                  label: project.project_name,
                                }))}
                                onValueChange={field.onChange}
                              />
                            );
                          }}
                        />
                        {errors.project && (
                          <Field.ErrorText>
                            {errors.project.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                      <Field.Root invalid={!!errors.queue_name}>
                        <Field.Label htmlFor="queue_name">Name</Field.Label>
                        <Input
                          placeholder="Enter Name"
                          {...register("queue_name", {
                            required: "Name is required",
                          })}
                        />
                        {errors.queue_name && (
                          <Field.ErrorText>
                            {errors.queue_name.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>

                      <Field.Root invalid={!!errors.description}>
                        <Field.Label htmlFor="description">
                          Description
                        </Field.Label>
                        <Textarea
                          id="description"
                          placeholder="Enter Description"
                          rows={3}
                          {...register("description", {
                            required: "Description is required",
                          })}
                        />
                        {errors.description && (
                          <Field.ErrorText>
                            {errors.description.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                    </Stack>
                  </div>

                  {/* Additional Options */}
                  {/* <div>
                    <Heading as="h3" size="sm" mb={4}>
                      Additional Options
                    </Heading>
                    <Stack spacing={3}>
                      <Checkbox.Root variant="outline">
                        <Checkbox.HiddenInput
                          {...register("enforceUniqueReference")}
                        />
                        <Checkbox.Control />
                        <Checkbox.Label>
                          Enforce unique reference
                        </Checkbox.Label>
                      </Checkbox.Root>

                      <Checkbox.Root variant="outline">
                        <Checkbox.HiddenInput
                          {...register("storeEncryptedFormat")}
                        />
                        <Checkbox.Control />
                        <Checkbox.Label>
                          Store in Encrypted Format
                        </Checkbox.Label>
                      </Checkbox.Root>

                      <Checkbox.Root variant="outline">
                        <Checkbox.HiddenInput {...register("autoRetry")} />
                        <Checkbox.Control />
                        <Checkbox.Label>Auto Retry</Checkbox.Label>
                      </Checkbox.Root>
                    </Stack>
                  </div> */}

                  {/* Number of Retry */}
                  <Field.Root>
                    <Field.Label htmlFor="retry_count">No of Retry</Field.Label>
                    <Controller
                      name="retry_count"
                      control={control}
                      render={({ field }) => {
                        console.log("field999", field);
                        return (
                          <CustomSelect
                            // {...field}
                            value={field.value}
                            onValueChange={field.onChange}
                            options={[
                              { label: "No Retry", value: "0" },
                              { label: "1 Retry", value: "1" },
                              { label: "2 Retries", value: "2" },
                              { label: "3 Retries", value: "3" },
                              { label: "5 Retries", value: "5" },
                              { label: "10 Retries", value: "10" },
                            ]}
                          />
                        );
                      }}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label htmlFor="truncate_date">
                      Truncate Date
                    </Field.Label>
                    <Input type="date" {...register("truncate_date")} />
                  </Field.Root>
                </Stack>
              </form>
            </Dialog.Body>

            <Dialog.Footer>
              <Button variant="outline" mr={3} onClick={handleClose}>
                Close
              </Button>
              <Button
                colorScheme="blue"
                loading={isPending || isCreatePending}
                type="submit"
                form="create-queue-form"
              >
                {mode === "create" ? "Create Queue" : "Update Queue"}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

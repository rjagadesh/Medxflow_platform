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
  Center,
  Icon,
  IconButton,
  Separator,
  HStack,
} from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { CirclePlus, EditIcon, PlusIcon } from "lucide-react";
import { DropzoneUploader } from "@/components/dropzone-uploader/uploader";
import { Text } from "@chakra-ui/react";
import { Box } from "@chakra-ui/react";
import { useCreateRequest } from "@/hooks/mutation/useCreateRequest";
import { useGetAPIkey } from "@/hooks/query/agentsapp/useGetAPIkey";
import { Link, useParams } from "react-router-dom";
import { atobAgentId } from "@/utils/helper";
import { useCreateBulkRequest } from "@/hooks/mutation/agentsapp/useCreateBulkRequest";
import { toaster } from "@/components/ui/toaster";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import { useUpdateRequest } from "@/hooks/mutation/agentsapp/useUpdateRequest";
import CustomSelect from "@/components/ui/select";
import { useMemo } from "react";
import { Heading } from "@chakra-ui/react";

export default function RequestForm({
  inputs = [],
  mode = "add",
  initialValues,
  checkPermission,
  children,
  isOpen,
  onClose,
  isVoiceAi = false,
}) {
  const { agent_app } = useParams();
  const activeInputs = inputs.filter(
    (input) => input.active && input.type !== "file",
  );
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const open = isControlled ? isOpen : internalOpen;

  const setOpen = (value) => {
    if (isControlled) {
      if (!value && onClose) {
        onClose();
      }
    } else {
      setInternalOpen(value);
    }
  };

  const agentId = atobAgentId(agent_app);

  const { data: { api_key = "" } = {} } = useGetAPIkey(agentId);
  const { mutate: updateRequest, isPending: updateRequestPending } =
    useUpdateRequest(api_key, initialValues?.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm();

  const [files, setFiles] = useState([]);

  const { mutate, isPending } = useCreateRequest();
  const { mutate: bulkRequest, isPending: bulkRequestPending } =
    useCreateBulkRequest(api_key);

  const handleFileChange = (files) => {
    setFiles(files);
  };

  const handleCancel = () => {
    setFiles([]);
    reset();
    setOpen(false);
  };

  const handleFileSubmit = () => {
    const formData = new FormData();
    formData.append("apikey", api_key);
    formData.append("file", files[0]);

    bulkRequest(formData, {
      onSuccess: (v) => {
        toaster.success({
          title: "Request",
          description: v.message,
        });
        setFiles([]);
        reset();
        setOpen(false);
      },
      onError: (error) => {
        toaster.error({
          title: "Error",
          description: error.error || "Error creating request",
        });
      },
    });
  };

  const onSubmit = (data) => {
    // console.log("Form Data:", data);
    // reset();
    // setOpen(false);
    const objects = Object.entries(data).map(([key, value]) => {
      return [key.replace(/%2E/g, "."), value];
    });
    data = Object.fromEntries(objects);

    if (initialValues?.id) {
      const skipNestedObjects = Object.keys(data).reduce((acc, key) => {
        if (typeof data[key] !== "object") {
          acc[key] = data[key];
        }
        return acc;
      }, {});

      updateRequest(
        {
          data: {
            ...skipNestedObjects,
            Status: undefined,
            status: undefined,
          },
          status: data.status,
        },
        {
          onSuccess: () => {
            reset();
            setOpen(false);
            toaster.success({
              title: "Success",
              description: "Request updated successfully",
            });
          },
          onError: (error) => {
            console.log("error", error);
            toaster.error({
              title: "Error",
              description: error.error || "Error updating request",
            });
          },
        },
      );
    } else {
      mutate(
        {
          apikey: api_key,
          data: data,
          status: "NEW",
        },
        {
          onSuccess: (response) => {
            reset();
            setOpen(false);
            toaster.success({
              title: "Success",
              description: response.message || "Error creating request",
            });
          },
          onError: (error) => {
            console.log("error", error);
            toaster.error({
              title: "Error",
              description: error.error || "Error creating request",
            });
          },
        },
      );
    }
  };

  const activeInputWithFIltered = useMemo(() => {
    return mode === "add"
      ? activeInputs
      : activeInputs.filter((input) => {
          return Boolean(initialValues?.data[input.name]);
        });
  }, [activeInputs, mode, initialValues?.data]);

  console.log("activeInputWithFIltered", activeInputWithFIltered);

  useEffect(() => {
    if (!initialValues?.data) return;
    const objects = Object.entries(initialValues?.data).map(([key, value]) => {
      return [key.replace(/\./g, "%2E"), value];
    });
    const initialValuesUpdated = Object.fromEntries(objects);
    console.log("initialValuesUpdated", objects, initialValuesUpdated);
    reset(initialValuesUpdated);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues?.data]);

  console.log("initialValues", initialValues);

  return (
    <Dialog.Root
      scrollBehavior="inside"
      size="lg"
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      // onClick={(e) => {
      //   e.stopPropagation();
      // }}
    >
      {!isControlled && (
        <Dialog.Trigger
          // onClick={(e) => {
          //   e.stopPropagation();
          // }}
          asChild
        >
          {children ? (
            children
          ) : (
            <>
              {mode === "add" && (
                <Box
                  bgImage={"var(--bg-blue-gradient)"}
                  h={{
                    base: "120px",
                    "2xl": "150px",
                    "3xl": "150px",
                  }}
                  onClick={() => setOpen(true)}
                  className="cursor-pointer rounded-3xl shadow-md px-5 py-4 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
                >
                  <div className="flex justify-between h-full">
                    <VStack justify={"space-between"} align={"start"}>
                      <Icon
                        w={{ base: "40px", "2xl": "50px", "3xl": "74px" }}
                        h={{ base: "40px", "2xl": "50px", "3xl": "74px" }}
                      >
                        <CirclePlus className="text-black" strokeWidth={1} />
                      </Icon>
                      <Text
                        color="black"
                        fontWeight={"medium"}
                        fontSize={{
                          base: "13px",
                          "2xl": "15px",
                          "3xl": "17px",
                        }}
                      >
                        Add a new request
                      </Text>
                    </VStack>
                  </div>
                </Box>
              )}
              {mode === "edit" && (
                <CustomButton
                  size={{
                    base: "xs",
                    "2xl": "xs",
                    "3xl": "xs",
                  }}
                  leftIcon={<EditIcon />}
                  onClick={() => {
                    if (checkPermission()) {
                      setOpen(true);
                    }
                  }}
                >
                  Edit
                </CustomButton>
              )}
            </>
          )}
        </Dialog.Trigger>
      )}

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="!bg-droidal-black-300 h-full overflow-auto">
            <Dialog.Header>
              <Dialog.Title m={0} className="text-white">
                {mode === "edit" ? "Edit Request" : "Create Request"}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <>
                {Boolean(
                  mode === "add" && activeInputWithFIltered?.length > 0,
                ) && (
                  <div className="w-full mb-4">
                    <Field.Root invalid={!!errors.name}>
                      <Field.Label className="!text-white">
                        Bulk Request
                      </Field.Label>

                      <DropzoneUploader
                        value={files}
                        maxFiles={1}
                        onChange={handleFileChange}
                        accept={[
                          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                          "application/vnd.ms-excel",
                          "text/csv",
                        ]}
                      >
                        <Box>
                          <Text color={"gray.300"} fontWeight={"semibold"}>
                            Upload multiple requests at once
                          </Text>
                          <Text color={"gray.400"} fontWeight={"normal"}>
                            Drag & drop or click to upload CSV
                          </Text>
                        </Box>
                      </DropzoneUploader>
                    </Field.Root>
                  </div>
                )}
                {mode === "add" && (
                  <HStack mb={4} mt={2}>
                    <Separator borderColor={"#2f4d78"} flex="1" />
                    <Text flexShrink="0" color="#90a6c6">
                      Or
                    </Text>
                    <Separator borderColor={"#2f4d78"} flex="1" />
                  </HStack>
                )}
                <form id="member-form" onSubmit={handleSubmit(onSubmit)}>
                  <SimpleGrid columns={{ base: 2, md: 3 }} gap="4">
                    {activeInputWithFIltered.map((input) => (
                      <CustomInput
                        key={input.name}
                        label={input.name}
                        invalid={!!errors[input.name]}
                        showError={!!errors[input.name]}
                        errorMessage={errors[input.name]?.message}
                        size={"sm"}
                        {...register(input.name?.replace(/\./g, "%2E"), {
                          required: "This field is required",
                        })}
                      />
                    ))}
                    {activeInputWithFIltered?.length > 0 && (
                      <Field.Root invalid={!!errors.status}>
                        <Field.Label
                          color="white"
                          fontWeight={"light"}
                          fontSize={"md"}
                          letterSpacing={"wider"}
                        >
                          Status
                        </Field.Label>
                        <Controller
                          name="status"
                          control={control}
                          rules={{ required: "Status selection is required" }}
                          render={({ field }) => {
                            console.log("field", field);
                            return (
                              <CustomSelect
                                placeholder="Select Status"
                                value={[field.value]}
                                options={[
                                  {
                                    value: "NEW",
                                    label: "New",
                                  },
                                  // {
                                  //   value: "SUCCESS",
                                  //   label: "Success",
                                  // },
                                  {
                                    value: "PENDING",
                                    label: isVoiceAi
                                      ? "Call In Progress"
                                      : "Pending",
                                  },
                                  {
                                    value: "FAILURE",
                                    label: "Failed",
                                  },
                                  {
                                    value: "NEEDS-ATTENTION",
                                    label: "Needs Attention",
                                  },
                                ]}
                                onValueChange={(v) => field.onChange(v[0])}
                                width="full"
                                borderColor="#2f4d78"
                                color="white"
                                css={{
                                  "& button": {
                                    borderRadius: "4px !important",
                                    borderColor: "#2f4d78",
                                  },
                                }}
                                size="sm"
                              />
                            );
                          }}
                        />
                        <Field.ErrorText>
                          {errors.status?.message}
                        </Field.ErrorText>
                      </Field.Root>
                    )}

                    {/* 
                        <Field.Root invalid={!!errors.date_of_birth}>
                          <Field.Label className="text-white">
                            Date of Birth
                          </Field.Label>
                          <Input
                            color={"white"}
                            size={"sm"}
                            type="date"
                            {...register("date_of_birth", {
                              required: "Date of birth is required",
                            })}
                          />
                          <Field.ErrorText>
                            {errors.date_of_birth?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.postal_code}>
                          <Field.Label className="text-white">
                            Postal Code
                          </Field.Label>
                          <Input
                            color={"white"}
                            size={"sm"}
                            {...register("postal_code")}
                          />
                          <Field.ErrorText>
                            {errors.postal_code?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.phone_number}>
                          <Field.Label className="text-white">
                            Phone Number
                          </Field.Label>
                          <Input
                            color={"white"}
                            size={"sm"}
                            {...register("phone_number")}
                          />
                          <Field.ErrorText>
                            {errors.phone_number?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.ins_provider}>
                          <Field.Label className="text-white">
                            Insurance Provider
                          </Field.Label>
                          <Input
                            color={"white"}
                            size={"sm"}
                            {...register("ins_provider")}
                          />
                          <Field.ErrorText>
                            {errors.ins_provider?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.member_id}>
                          <Field.Label className="text-white">
                            Member ID
                          </Field.Label>
                          <Input
                            color={"white"}
                            size={"sm"}
                            {...register("member_id")}
                          />
                          <Field.ErrorText>
                            {errors.member_id?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.provider_npi}>
                          <Field.Label className="text-white">
                            Provider NPI
                          </Field.Label>
                          <Input
                            color={"white"}
                            size={"sm"}
                            {...register("provider_npi")}
                          />
                          <Field.ErrorText>
                            {errors.provider_npi?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.provider_tax_id}>
                          <Field.Label className="text-white">
                            Provider Tax ID
                          </Field.Label>
                          <Input
                            color={"white"}
                            size={"sm"}
                            {...register("provider_tax_id")}
                          />
                          <Field.ErrorText>
                            {errors.provider_tax_id?.message}
                          </Field.ErrorText>
                        </Field.Root>
                        <Field.Root invalid={!!errors.call_no}>
                          <Field.Label className="text-white">
                            Call Number
                          </Field.Label>
                          <Input
                            color={"white"}
                            size={"sm"}
                            {...register("call_no")}
                          />
                          <Field.ErrorText>
                            {errors.call_no?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.provider_address}>
                          <Field.Label className="text-white">
                            Provider Address
                          </Field.Label>
                          <Textarea
                            size={"sm"}
                            {...register("provider_address")}
                          />
                          <Field.ErrorText>
                            {errors.provider_address?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.provider_name}>
                          <Field.Label className="text-white">
                            Provider Name
                          </Field.Label>
                          <Input
                            color={"white"}
                            size={"sm"}
                            {...register("provider_name")}
                          />
                          <Field.ErrorText>
                            {errors.provider_name?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.fax_no}>
                          <Field.Label className="text-white">
                            Fax No
                          </Field.Label>
                          <Input
                            color={"white"}
                            size={"sm"}
                            {...register("fax_no")}
                          />
                          <Field.ErrorText>
                            {errors.fax_no?.message}
                          </Field.ErrorText>
                        </Field.Root>

                        <Field.Root invalid={!!errors.postal_address}>
                          <Field.Label className="text-white">
                            Postal Address
                          </Field.Label>
                          <Textarea
                            size={"sm"}
                            {...register("postal_address")}
                          />
                          <Field.ErrorText>
                            {errors.postal_address?.message}
                          </Field.ErrorText>
                        </Field.Root> */}
                  </SimpleGrid>
                </form>
              </>
              {activeInputWithFIltered?.length === 0 && (
                <Center
                  flexDirection={"column"}
                  fontWeight={"normal"}
                  flex={1}
                  height={"full"}
                >
                  <Heading
                    color={"white"}
                    fontWeight={"normal"}
                    letterSpacing={"widest"}
                    mb={2}
                    fontSize={"lg"}
                  >
                    No Input found
                  </Heading>
                  <Text
                    color={"white"}
                    fontWeight={"light"}
                    letterSpacing={"widest"}
                  >
                    {mode === "add"
                      ? "Create the input fields on the admin page."
                      : "Update the input fields on the admin page."}
                  </Text>
                  <Link to={isVoiceAi ? "input" : "/admin/column-settings"}>
                    <Button mt="2">Go to Settings</Button>
                  </Link>
                </Center>
              )}
            </Dialog.Body>

            <Dialog.Footer>
              <CustomButton variant="outline" mr={3} onClick={handleCancel}>
                Cancel
              </CustomButton>
              <CustomButton
                type={files.length > 0 ? "button" : "submit"}
                onClick={files.length > 0 ? handleFileSubmit : null}
                form="member-form"
                loading={
                  isPending || bulkRequestPending || updateRequestPending
                }
                disabled={activeInputWithFIltered?.length === 0}
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

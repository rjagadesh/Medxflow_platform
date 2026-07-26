import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import { Button, Card, Field, SimpleGrid, VStack } from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";
import { TagsInput } from "@chakra-ui/react/tags-input";
import { useEffect } from "react";
import { useGetSummaryReports } from "@/hooks/query/alerts/useGetSummaryReports";
import { useCreateSummaryReport } from "@/hooks/mutation/alerts/useCreateSummaryReport";
import { useUpdateSummaryReport } from "@/hooks/mutation/alerts/useUpdateSummaryReport";
import { useGetInvoiceReports } from "@/hooks/query/alerts/useGetInvoiceReports";
import { useCreateInvoiceReport } from "@/hooks/mutation/alerts/useCreateInvoiceReport";
import { useUpdateInvoiceReport } from "@/hooks/mutation/alerts/useUpdateInvoiceReport";
import { toaster } from "@/components/ui/toaster";
import { Box } from "@chakra-ui/react/box";
import { Delete } from "lucide-react";
import { useDeleteSummaryReport } from "@/hooks/mutation/alerts/useDeleteSummaryReport";
import { useSendNowSummaryReport } from "@/hooks/mutation/alerts/useSendNowSummaryReport";
import { useDeleteInvoiceReport } from "@/hooks/mutation/alerts/useDeleteInvoiceReport";

const InvoiceNotificationSettings = () => {
  const {
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      emails: [],
      report_type: null,
      schedule: "",
    },
  });

  const {
    data: invoiceData,
    isLoading: invoiceLoading,
    isPlaceholderData: invoicePlaceholder,
  } = useGetInvoiceReports();
  const { mutate: createInvoice, isPending: creatingInvoice } =
    useCreateInvoiceReport();
  const { mutate: updateInvoice, isPending: updatingInvoice } =
    useUpdateInvoiceReport();
  const { mutate: deleteInvoice, isPending: deletingInvoice } =
    useDeleteInvoiceReport();
  // useEffect(() => {
  //   const fromApi = Array.isArray(invoiceData) ? invoiceData?.[0] : invoiceData;
  //   if (fromApi && fromApi.id) {
  //     reset({
  //       emails: fromApi.emails || [],
  //       schedule: fromApi.schedule || "",
  //     });
  //   }
  // }, [invoiceData, reset]);

  // if (existing?.id) {
  //   updateInvoice(
  //     { id: existing.id, ...v },
  //     {
  //       onSuccess: (res) =>
  //         toaster.success({
  //           title: "Success",
  //           description: res?.message || "Invoice alert updated",
  //         }),
  //       onError: (err) =>
  //         toaster.error({
  //           title: "Error",
  //           description: err?.message || "Failed to update invoice alert",
  //         }),
  //     }
  //   );
  // } else

  const onSubmit = (v) => {
    const existing = Array.isArray(invoiceData)
      ? invoiceData?.[0]
      : invoiceData?.[0] || invoiceData;
    {
      createInvoice(v, {
        onSuccess: (res) =>
          toaster.success({
            title: "Success",
            description: res?.message || "Invoice alert created",
          }),
        onError: (err) =>
          toaster.error({
            title: "Error",
            description: err?.message || "Failed to create invoice alert",
          }),
      });
    }
  };

  const onDelete = (v) => {
    {
      deleteInvoice(v.id, {
        onSuccess: (res) =>
          toaster.success({
            title: "Success",
            description: res?.message || "Summary report alert Deleted",
          }),
        onError: (err) =>
          toaster.error({
            title: "Error",
            description: err?.message || "Failed to Delete summary alert",
          }),
      });
    }
  };
  return (
    <Card.Root w={"full"} bg={"droidalBlack.300"} pb="4" border="none">
      <Card.Header
        color="white"
        letterSpacing={"widest"}
        fontSize={"xl"}
        fontWeight={"semibold"}
      >
        Invoice Alerts
      </Card.Header>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Card.Body>
          <SimpleGrid columns={3} gap={4}>
            <Field.Root invalid={!!errors.emails}>
              <Controller
                name="emails"
                control={control}
                render={({ field }) => (
                  <>
                    {console.log("fieldvalue", field.value)}
                    <TagsInput.Root
                      value={field.value}
                      validate={(e) => {
                        const email = e.inputValue;
                        const emailRegex =
                          /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                        if (email && !emailRegex.test(email)) {
                          return setError("emails", {
                            type: "manual",
                            message: "Invalid email address",
                          });
                        }
                        // check for duplicates
                        const isDuplicate = field.value.some(
                          (item) => item === email
                        );
                        if (isDuplicate) {
                          return false;
                        }
                        return true;
                      }}
                      onValueChange={(v) => field.onChange(v.value)}
                    >
                      <TagsInput.Label
                        color="white"
                        fontWeight={"light"}
                        fontSize={"md"}
                        letterSpacing={"wider"}
                      >
                        Send Report To:
                      </TagsInput.Label>
                      <TagsInput.Control
                        borderColor="#2f4d78"
                        bgColor={"droidalBlack.300"}
                        letterSpacing="widest"
                        transition={"all .2s ease-in-out"}
                        _hover={{
                          outlineColor: "transparent",
                          border: "1px solid transparent",
                          bgClip: "padding-box, border-box",
                          backgroundOrigin: "padding-box, border-box",
                          backgroundImage:
                            "linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
                        }}
                      >
                        {/* <TagsInput.Items bgColor={"droidalBlack.200"} /> */}
                        <TagsInput.Context>
                          {({ value }) =>
                            value.map((tag, index) => (
                              <TagsInput.Item
                                key={index}
                                index={index}
                                value={tag}
                              >
                                <TagsInput.ItemPreview
                                  style={{ backgroundColor: "#2b5187" }}
                                  color={"white"}
                                  _highlighted={{ filter: "brightness(0.9)" }}
                                >
                                  <TagsInput.ItemText>{tag}</TagsInput.ItemText>
                                  <TagsInput.ItemDeleteTrigger />
                                </TagsInput.ItemPreview>
                                <TagsInput.ItemInput />
                              </TagsInput.Item>
                            ))
                          }
                        </TagsInput.Context>

                        <TagsInput.Input
                          placeholder="Enter email..."
                          _placeholder={{
                            color: "#90a6c6",
                            letterSpacing: "widest",
                          }}
                          color="white"
                        />
                      </TagsInput.Control>
                    </TagsInput.Root>
                  </>
                )}
                rules={{
                  required: "At least one email is required",
                  validate: (value) => {
                    if (!value || value.length === 0) {
                      return "At least one email is required";
                    }
                    if (
                      value.some(
                        (email) =>
                          !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
                            email
                          )
                      )
                    ) {
                      return "One or more email addresses are invalid";
                    }
                    return true;
                  },
                }}
              />
              {errors.emails && (
                <Field.ErrorText>{errors.emails.message}</Field.ErrorText>
              )}
            </Field.Root>
            <Field.Root invalid={!!errors.schedule}>
              <Field.Label
                color="white"
                fontWeight={"light"}
                fontSize={"md"}
                letterSpacing={"wider"}
              >
                Schedule Frequency
              </Field.Label>
              <Controller
                name="schedule"
                control={control}
                render={({ field }) => (
                  <CustomSelect
                    options={[
                      {
                        value: "end-of-month",
                        label: "End of the Month",
                      },
                    ]}
                    placeholder="Select Schedule Frequency"
                    width="full"
                    borderRadius="4px !important"
                    borderColor="#2f4d78"
                    css={{
                      "& button": {
                        borderRadius: "4px !important",
                        borderColor: "#2f4d78",
                        color: "white !important",
                      },
                    }}
                    value={[field.value]}
                    onValueChange={(v) => field.onChange(v[0])}
                  />
                )}
                rules={{
                  required: "Schedule Frequency is required",
                }}
              />
              {errors.schedule && (
                <Field.ErrorText>{errors.schedule.message}</Field.ErrorText>
              )}
            </Field.Root>{" "}
          </SimpleGrid>
        </Card.Body>
        <Card.Footer display={"flex"} justifyContent={"flex-end"}>
          <CustomButton
            type="submit"
            disabled={
              creatingInvoice ||
              updatingInvoice ||
              invoiceLoading ||
              invoicePlaceholder
            }
            loading={creatingInvoice || updatingInvoice}
          >
            Save
          </CustomButton>
        </Card.Footer>
      </form>
      {invoiceData?.length > 0 && (
        <Card.Root w="full" bg="droidalBlack.300" p="4" border="none">
          <Card.Header
            color="white"
            letterSpacing="widest"
            fontSize="xl"
            fontWeight="semibold"
          >
            Saved Invoice Reports
          </Card.Header>

          <Card.Body>
            <VStack align="start" spacing={3} w="full">
              {/* Header Row */}
              <Box
                display="grid"
                gridTemplateColumns="1fr 1fr 1fr auto"
                alignItems="center"
                gap="24px"
                fontWeight="bold"
                fontSize="15px"
                color="white"
                w="full"
                mb={2}
              >
                <Box>Emails</Box>
                <Box>Schedule</Box>
                <Box
                  display="flex"
                  justifyContent="flex-end"
                  gap="8px"
                  pr="100px" // <-- Add some space from the edge
                >
                  <Box>Actions</Box>
                </Box>
              </Box>

              {/* Data Rows */}
              {invoiceData.map((item, index) => (
                <Box
                  key={index}
                  p={3}
                  w="full"
                  bg="#3a3a3a"
                  borderRadius="md"
                  color="#cccccc"
                  display="grid"
                  gridTemplateColumns="1fr 1fr 1fr auto"
                  alignItems="center"
                  gap="24px"
                >
                  <Box>
                    {item.emails?.length ? item.emails.join(", ") : "—"}
                  </Box>

                  <Box>{item.schedule || "—"}</Box>

                  <Box display="flex" justifyContent="flex-end" gap="8px">
                    {/* <Button>Edit</Button>  */}
                    <Button onClick={() => onDelete(item)}>Delete</Button>
                    <Button onClick={() => onSendNow(item)}>Send Now</Button>
                  </Box>
                </Box>
              ))}
            </VStack>
          </Card.Body>
        </Card.Root>
      )}
    </Card.Root>
  );
};

const NotificationSettings = () => {
  const {
    handleSubmit,
    control,
    setError,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      emails: [],
      report_type: null,
      schedule: "",
    },
  });

  const {
    data: summaryData,
    isLoading,
    isPlaceholderData,
  } = useGetSummaryReports();
  const { mutate: createSummary, isPending: creating } =
    useCreateSummaryReport();
  const { mutate: updateSummary, isPending: updating } =
    useUpdateSummaryReport();
  const { mutate: deleteSummary, isPending: deleting } =
    useDeleteSummaryReport();
  const { mutate: sendSummary, isPending: summary } = useSendNowSummaryReport();

  // const update_summary =(v)= {
  //       const existing = summaryData
  //     ? summaryData?.[0]
  //     : summaryData?.[0] || summaryData;
  //   updateSummary(
  //       { id: existing.id, ...v },
  //       {
  //         onSuccess: (res) =>
  //           toaster.success({
  //             title: "Success",
  //             description: res?.message || "Summary report alert updated",
  //           }),
  //         onError: (err) =>
  //           toaster.error({
  //             title: "Error",
  //             description: err?.message || "Failed to update summary alert",
  //           }),
  //       }
  //     )
  // }

  const onSendNow = (v) => {
    {
      sendSummary(v, {
        onSuccess: (res) =>
          toaster.success({
            title: "Success",
            description: res?.message || "Summary report alert Sent",
          }),
        onError: (err) =>
          toaster.error({
            title: "Error",
            description: err?.message || "Failed to sent summary alert",
          }),
      });
    }
  };

  const onDelete = (v) => {
    {
      deleteSummary(v.id, {
        onSuccess: (res) =>
          toaster.success({
            title: "Success",
            description: res?.message || "Summary report alert Deleted",
          }),
        onError: (err) =>
          toaster.error({
            title: "Error",
            description: err?.message || "Failed to Delete summary alert",
          }),
      });
    }
  };
  const onSubmit = (v) => {
    const existing = summaryData
      ? summaryData?.[0]
      : summaryData?.[0] || summaryData;
    {
      createSummary(v, {
        onSuccess: (res) =>
          toaster.success({
            title: "Success",
            description: res?.message || "Summary report alert created",
          }),
        onError: (err) =>
          toaster.error({
            title: "Error",
            description: err?.message || "Failed to create summary alert",
          }),
      });
    }
  };
  return (
    <VStack gap={6}>
      <Card.Root w={"full"} bg={"droidalBlack.300"} pb="4" border="none">
        <Card.Header
          color="white"
          letterSpacing={"widest"}
          fontSize={"xl"}
          fontWeight={"semibold"}
        >
          Summary Report
        </Card.Header>
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card.Body>
            <SimpleGrid columns={3} gap={4}>
              <Field.Root invalid={!!errors.emails}>
                <Controller
                  name="emails"
                  control={control}
                  render={({ field }) => (
                    <>
                      {console.log("fieldvalue", field.value)}
                      <TagsInput.Root
                        value={field.value}
                        validate={(e) => {
                          const email = e.inputValue;
                          const emailRegex =
                            /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
                          if (email && !emailRegex.test(email)) {
                            return setError("emails", {
                              type: "manual",
                              message: "Invalid email address",
                            });
                          }
                          // check for duplicates
                          const isDuplicate = field.value.some(
                            (item) => item === email
                          );
                          if (isDuplicate) {
                            return false;
                          }
                          return true;
                        }}
                        onValueChange={(v) => field.onChange(v.value)}
                      >
                        <TagsInput.Label
                          color="white"
                          fontWeight={"light"}
                          fontSize={"md"}
                          letterSpacing={"wider"}
                        >
                          Send Report To:
                        </TagsInput.Label>
                        <TagsInput.Control
                          borderColor="#2f4d78"
                          bgColor={"droidalBlack.300"}
                          letterSpacing="widest"
                          transition={"all .2s ease-in-out"}
                          _hover={{
                            outlineColor: "transparent",
                            border: "1px solid transparent",
                            bgClip: "padding-box, border-box",
                            backgroundOrigin: "padding-box, border-box",
                            backgroundImage:
                              "linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
                          }}
                        >
                          {/* <TagsInput.Items bgColor={"droidalBlack.200"} /> */}
                          <TagsInput.Context>
                            {({ value }) =>
                              value.map((tag, index) => (
                                <TagsInput.Item
                                  key={index}
                                  index={index}
                                  value={tag}
                                >
                                  <TagsInput.ItemPreview
                                    style={{ backgroundColor: "#2b5187" }}
                                    color={"white"}
                                    _highlighted={{ filter: "brightness(0.9)" }}
                                  >
                                    <TagsInput.ItemText>
                                      {tag}
                                    </TagsInput.ItemText>
                                    <TagsInput.ItemDeleteTrigger />
                                  </TagsInput.ItemPreview>
                                  <TagsInput.ItemInput />
                                </TagsInput.Item>
                              ))
                            }
                          </TagsInput.Context>

                          <TagsInput.Input
                            placeholder="Enter email..."
                            _placeholder={{
                              color: "#90a6c6",
                              letterSpacing: "widest",
                            }}
                            color="white"
                          />
                        </TagsInput.Control>
                      </TagsInput.Root>
                    </>
                  )}
                  rules={{
                    required: "At least one email is required",
                    validate: (value) => {
                      if (!value || value.length === 0) {
                        return "At least one email is required";
                      }
                      if (
                        value.some(
                          (email) =>
                            !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(
                              email
                            )
                        )
                      ) {
                        return "One or more email addresses are invalid";
                      }
                      return true;
                    },
                  }}
                />
                {errors.emails && (
                  <Field.ErrorText>{errors.emails.message}</Field.ErrorText>
                )}
              </Field.Root>

              <Field.Root invalid={!!errors.report_type}>
                <Field.Label
                  color="white"
                  fontWeight={"light"}
                  fontSize={"md"}
                  letterSpacing={"wider"}
                >
                  Report Type
                </Field.Label>
                <Controller
                  name="report_type"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      options={[
                        {
                          value: "high-level",
                          label: "High Level Summary",
                        },
                        {
                          value: "detailed",
                          label: "Detailed Report",
                        },
                      ]}
                      placeholder="Select Report Type"
                      width="full"
                      borderRadius="4px !important"
                      borderColor="#2f4d78"
                      css={{
                        "& button": {
                          borderRadius: "4px !important",
                          borderColor: "#2f4d78",
                          color: "white !important",
                        },
                      }}
                      value={[field.value]}
                      onValueChange={(v) => field.onChange(v[0])}
                    />
                  )}
                  rules={{
                    required: "Report Type is required",
                  }}
                />
                {errors.report_type && (
                  <Field.ErrorText>
                    {errors.report_type.message}
                  </Field.ErrorText>
                )}
              </Field.Root>
              <Field.Root invalid={!!errors.schedule}>
                <Field.Label
                  color="white"
                  fontWeight={"light"}
                  fontSize={"md"}
                  letterSpacing={"wider"}
                >
                  Schedule Frequency
                </Field.Label>
                <Controller
                  name="schedule"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      options={[
                        {
                          value: "daily",
                          label: "daily",
                        },
                        {
                          value: "weekly",
                          label: "Weekly",
                        },
                        {
                          value: "biweekly",
                          label: "Biweekly",
                        },
                        {
                          value: "start-of-month",
                          label: "Start of the Month",
                        },
                        {
                          value: "end-of-month",
                          label: "End of the Month",
                        },
                      ]}
                      placeholder="Select Schedule Frequency"
                      width="full"
                      borderRadius="4px !important"
                      borderColor="#2f4d78"
                      css={{
                        "& button": {
                          borderRadius: "4px !important",
                          borderColor: "#2f4d78",
                          color: "white !important",
                        },
                      }}
                      value={[field.value]}
                      onValueChange={(v) => field.onChange(v[0])}
                    />
                  )}
                  rules={{
                    required: "Schedule Frequency is required",
                  }}
                />
                {errors.schedule && (
                  <Field.ErrorText>{errors.schedule.message}</Field.ErrorText>
                )}
              </Field.Root>
            </SimpleGrid>
          </Card.Body>
          <Card.Footer display={"flex"} justifyContent={"flex-end"}>
            <CustomButton
              type="submit"
              disabled={creating || updating || isLoading || isPlaceholderData}
              loading={creating || updating}
            >
              Save
            </CustomButton>
          </Card.Footer>
        </form>
      </Card.Root>
      {summaryData?.length > 0 && (
        <Card.Root w="full" bg="droidalBlack.300" p="4" border="none">
          <Card.Header
            color="white"
            letterSpacing="widest"
            fontSize="xl"
            fontWeight="semibold"
          >
            Saved Summary Reports
          </Card.Header>

          <Card.Body>
            <VStack align="start" spacing={3} w="full">
              {/* Header Row */}
              <Box
                display="grid"
                gridTemplateColumns="1fr 1fr 1fr auto"
                alignItems="center"
                gap="24px"
                fontWeight="bold"
                fontSize="15px"
                color="white"
                w="100%"
                mb={2}
              >
                <Box>Emails</Box>
                <Box>Report Type</Box>
                <Box>Schedule</Box>
                <Box
                  display="flex"
                  justifyContent="flex-end"
                  gap="8px"
                  pr="100px"
                  pl="70px" // <-- Add some space from the edge
                >
                  <Box>Actions</Box>
                </Box>
              </Box>

              {/* Data Rows */}
              {summaryData.map((item, index) => (
                <Box
                  key={index}
                  p={3}
                  w="full"
                  bg="#3a3a3a"
                  borderRadius="md"
                  color="#cccccc"
                  display="grid"
                  gridTemplateColumns="1fr 1fr 1fr auto"
                  alignItems="center"
                  gap="24px"
                >
                  <Box>
                    {item.emails?.length ? item.emails.join(", ") : "—"}
                  </Box>

                  <Box>{item.report_type || "—"}</Box>

                  <Box>{item.schedule || "—"}</Box>

                  <Box display="flex" justifyContent="flex-end" gap="8px">
                    {/* <Button>Edit</Button> */}
                    <Button onClick={() => onDelete(item)}>Delete</Button>
                    <Button onClick={() => onSendNow(item)}>Send Now</Button>
                  </Box>
                </Box>
              ))}
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      <InvoiceNotificationSettings />
    </VStack>
  );
};

export default NotificationSettings;

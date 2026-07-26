import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Flex,
  Separator,
  SimpleGrid,
  IconButton,
  Collapsible,
} from "@chakra-ui/react";
import { LuChevronDown, LuX } from "react-icons/lu";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import CustomButton from "@/components/button/button";
import PatientSearch from "./dental/platform-sub-components/patient-search";
import { useGetProviders } from "@/hooks/query/pms/pms_appointments/useGetProviders";
import serviceTypeOptions from "@/_data/service_code_types";
import { usePatientEligibleCheck } from "@/hooks/query/pms/patient/usePatientEligibleCheck";
import { toaster } from "@/components/ui/toaster";
import JsonViewer from "@/components/viewers/json-viewer";
import { formatDate } from "@/utils/helper";
import { useRef } from "react";
import { useLocation } from "react-router-dom";
import getStatusIcon from "@/utils/status-icon";
import CustomDatePicker from "@/components/date-picker/single-datepicker";

const EligibilityViewer = ({ data }) => {
  if (!data) return null;

  const {
    provider,
    subscriber,
    benefitsInformation,
    payer,
    planDateInformation,
    planStatus,
  } = data;

  const InfoRow = ({ label, value }) => (
    <Flex mb={1} alignItems="flex-start">
      <Text
        fontWeight="light"
        letterSpacing={"widest"}
        color="white"
        w="250px"
        textAlign="right"
        mr={4}
        fontSize={"sm"}
        flexShrink={0}
      >
        {label}:
      </Text>
      <Text
        color="droidalGray.400"
        fontSize={"sm"}
        fontWeight={"light"}
        flex={1}
      >
        {value}
      </Text>
    </Flex>
  );
  const InfoRowWithStatus = ({ label, value }) => (
    <Flex mb={1} alignItems="flex-start">
      <Text
        fontWeight="light"
        letterSpacing={"widest"}
        color="white"
        w="250px"
        textAlign="right"
        mr={4}
        fontSize={"sm"}
        flexShrink={0}
      >
        {label}:
      </Text>
      {value}
    </Flex>
  );

  const CollapsibleSection = ({ title, children, defaultOpen = true }) => (
    <Collapsible.Root defaultOpen={defaultOpen}>
      <Collapsible.Trigger w="full" cursor="pointer" _hover={{ opacity: 0.8 }}>
        <Flex
          borderBottom="1px solid"
          borderColor="droidalGray.300"
          mb={2}
          mt={4}
          pb={1}
          justify="space-between"
          align="center"
        >
          {typeof title === "string" ? (
            <Text color="white" fontWeight="light" fontSize="md">
              {title}
            </Text>
          ) : (
            title
          )}
          <Collapsible.Indicator
            transition="transform 0.2s"
            _open={{ transform: "rotate(180deg)" }}
          >
            <LuChevronDown color="white" />
          </Collapsible.Indicator>
        </Flex>
      </Collapsible.Trigger>
      <Collapsible.Content>{children}</Collapsible.Content>
    </Collapsible.Root>
  );

  const formatDateString = (dateStr) => {
    if (!dateStr || dateStr.length !== 8) return dateStr;
    const formatted = dateStr.replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3");
    return formatDate(formatted);
  };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            #printable-area, #printable-area * {
              visibility: visible;
            }
            #printable-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              margin: 0;
              padding: 20px;
              background-color: white !important;
              color: black !important;
            }
            #printable-area * {
              color: black !important;
            }
            .no-print {
              display: none !important;
            }
          }
        `}
      </style>
      <Box rounded="md" shadow="md" mt={6} id="printable-area">
        <Box
          bg="droidalBlack.400"
          p={4}
          rounded="md"
          shadow="md"
          color="white"
          border={"1px solid"}
          borderColor="droidalGray.300"
          mt={6}
        >
          {/* Information Receiver */}
          <Box mb={4}>
            <CollapsibleSection title="Information Receiver">
              <InfoRow
                label="Type"
                value={[provider?.entityIdentifier, provider?.entityType]
                  .filter(Boolean)
                  .join(", ")}
              />
              <InfoRow label="Name" value={provider?.providerName} />
              <InfoRow
                label="National Provider Identifier (NPI)"
                value={provider?.npi}
              />
            </CollapsibleSection>
          </Box>

          {/* Insured or Subscriber */}
          <Box mb={4}>
            <CollapsibleSection title="Insured or Subscriber">
              <InfoRow
                label="Name"
                value={[subscriber?.lastName, subscriber?.firstName]
                  .filter(Boolean)
                  .join(" ")}
              />
              <InfoRow
                label="Member Identification Number"
                value={subscriber?.memberId}
              />
              <InfoRow label="Group Number" value={subscriber?.groupNumber} />
              <InfoRow label="Description" value={payer?.name} />
              <InfoRow
                label="Address"
                value={[
                  subscriber?.address?.address1,
                  subscriber?.address?.city,
                  subscriber?.address?.state,
                  subscriber?.address?.postalCode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              />
              <InfoRow
                label="Date of Birth"
                value={formatDateString(subscriber?.dateOfBirth)}
              />
              <InfoRow
                label="Gender"
                value={
                  subscriber?.gender === "M"
                    ? "Male"
                    : subscriber?.gender === "F"
                      ? "Female"
                      : subscriber?.gender
                }
              />
              <InfoRow
                label="Plan Effective Start Date"
                value={formatDateString(planDateInformation?.planBegin)}
              />
              <InfoRow
                label="Plan Effective End Date"
                value={formatDateString(
                  planDateInformation?.planEnd
                    ? planDateInformation?.planEnd
                    : "99991231",
                )}
              />
              {planStatus?.map((plan, index) => (
                <Box key={index}>
                  <InfoRowWithStatus
                    label="Plan Status"
                    value={getStatusIcon(plan?.status, {
                      size: "xs",
                      letterSpacing: "widest",
                      px: 2,
                    })}
                  />

                  <InfoRow
                    label="Plan Type"
                    value={formatDateString(plan?.planDetails)}
                  />
                </Box>
              ))}
            </CollapsibleSection>
          </Box>

          {/* Benefits */}
          {benefitsInformation?.map((benefit, index) => (
            <Box key={index} mb={4}>
              <CollapsibleSection
                title={
                  <Flex alignItems="center">
                    <Text
                      fontWeight="light"
                      letterSpacing={"wider"}
                      fontSize="sm"
                      w="250px"
                      textAlign="right"
                      mr={4}
                      className="text-transparent bg-clip-text transition-colors"
                      bgImage="var(--bg-blue-gradient)"
                    >
                      Eligibility or Benefit
                    </Text>
                    <Text
                      color="white"
                      letterSpacing={"wider"}
                      fontWeight="normal"
                    >
                      {benefit.name}
                    </Text>
                  </Flex>
                }
              >
                {benefit.serviceTypes && (
                  <InfoRow
                    label="Service Type"
                    value={benefit.serviceTypes.join(", ")}
                  />
                )}
                {benefit.insuranceType && (
                  <InfoRow
                    label="Insurance Type"
                    value={benefit.insuranceType}
                  />
                )}
                {benefit.planCoverage && (
                  <InfoRow
                    label="Plan Coverage Description"
                    value={benefit.planCoverage}
                  />
                )}
                {benefit.additionalInformation?.map((info, i) => (
                  <InfoRow key={i} label="Message" value={info.description} />
                ))}
                {benefit.timeQualifier && (
                  <InfoRow
                    label="Time Qualifier"
                    value={benefit.timeQualifier}
                  />
                )}
                {benefit.benefitAmount && (
                  <InfoRow
                    label="Benefit Amount"
                    value={benefit.benefitAmount}
                  />
                )}
                {benefit.benefitPercent && (
                  <InfoRow
                    label="Benefit Percent"
                    value={benefit.benefitPercent * 10}
                  />
                )}
                {benefit.inPlanNetworkIndicator && (
                  <InfoRow
                    label="In Plan Network Indicator"
                    value={benefit.inPlanNetworkIndicator}
                  />
                )}
                {benefit.coverageLevel && (
                  <InfoRow
                    label="Coverage Level"
                    value={benefit.coverageLevel}
                  />
                )}
              </CollapsibleSection>
            </Box>
          ))}
        </Box>
      </Box>
      <Flex justify="flex-start" gap={2} my={2} className="no-print">
        <CustomButton
          onClick={() => window.print()}
          size="sm"
          variant="outline"
        >
          Print
        </CustomButton>
        <JsonViewer jsonData={data}>
          <CustomButton size="sm" variant="outline">
            View Raw JSON
          </CustomButton>
        </JsonViewer>
      </Flex>
    </>
  );
};

const EligibilityCheck = () => {
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const { state } = useLocation();
  const [selectedPatient, setSelectedPatient] = useState(state || {});
  const { mutate } = usePatientEligibleCheck();
  const [stediResponse, setStediResponse] = useState(null);
  const formRef = useRef();

  const { data: providersData } = useGetProviders({ page_size: "1000" });
  const providers = providersData?.results || [];

  const providerOptions = providers.map((provider) => {
    const name = `${provider.first_name || ""} ${
      provider.last_name || ""
    }`.trim();
    const details = [
      name,
      provider.practice_name,
      provider.NPI ? `NPI: ${provider.NPI}` : null,
    ]
      .filter(Boolean)
      .join(" - ");

    return {
      label: details || "Unknown Provider",
      value: provider.id,
    };
  });

  const { control, handleSubmit, watch, formState } = useForm({
    defaultValues: {
      case: "",
      policy: "",
      provider: {},
      serviceType: "",
      dateOfService: null,
    },
  });
  const { errors } = formState;
  console.log("errors1212", errors);
  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setShowPatientSearch(false);
  };

  const onSubmit = (values) => {
    if (!selectedPatient?.first_name) {
      toaster.error({
        title: "Required",
        description: "Patient is required",
      });
      return;
    }

    console.log("value", values);
    const payload = {
      subscriber: {
        dateOfBirth: selectedPatient?.dob?.split("-").join(""),
        firstName: selectedPatient.first_name,
        lastName: selectedPatient.last_name,
        memberId: selectedPatient.memberId,
      },
      tradingPartnerServiceId: selectedPatient?.insurance_name?.primaryPayerId,
      encounter: {
        serviceTypeCodes: [values.serviceType],
      },
      externalPatientId: "UAA111222333",
      provider: {
        npi: values.provider["NPI"],
        organizationName: values.provider?.practice_name,
      },
    };

    const id = "eligibility-check";

    console.log("payload11", payload, selectedPatient);
    toaster.loading({
      id,
      title: "Checking",
      description: "Please wait.",
    });
    mutate(payload, {
      onSuccess: (res) => {
        const errors = res.errors;
        if (errors?.length > 0) {
          const error = errors?.[0];

          toaster.error({
            id,
            title: error.followupAction,
            description: error.description,
          });
          setStediResponse(res);
          return;
        }
        toaster.success({
          id,
          title: "Success",
          description: "Fetched successfully",
        });

        setStediResponse(res);
      },
      onError: (res) => {
        toaster.error({
          id,
          title: res.code,
          description: res.message,
        });
        setStediResponse(res);
        return;
      },
    });

    // toaster.promise(promise, {
    //   success: {
    //     title: "Successfully uploaded!",
    //     description: "Looks great",
    //   },
    //   error: {
    //     title: "Upload failed",
    //     description: "Something wrong with the upload",
    //   },
    //   loading: { title: "Checking...", description: "Please wait" },
    // });
  };

  const caseOptions = [];

  const policyOptions = [];

  const provider = watch("provider");
  console.log("provider", provider);

  return (
    <Box
      bg="droidalBlack.300"
      color="white"
      p={4}
      style={{
        height: "calc(100vh - 200px) !important",
      }}
    >
      {/* Header */}
      <Box p={2} mb={4} borderRadius="sm">
        <Text fontSize="md" fontWeight="light" color="white">
          Check Patient Eligibility
        </Text>
      </Box>

      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        {/* Patient Row */}
        <Box mb={6}>
          <HStack>
            <CustomButton
              onClick={() => setShowPatientSearch(!showPatientSearch)}
            >
              Patient
            </CustomButton>
            <Text fontSize="sm" textDecoration="underline" fontWeight="bold">
              {selectedPatient.first_name
                ? selectedPatient.first_name + " " + selectedPatient.last_name
                : "Select a Patient"}
            </Text>
          </HStack>
          <Collapsible.Root
            open={showPatientSearch}
            onOpenChange={(e) => setShowPatientSearch(e.open)}
          >
            <Collapsible.Content>
              <Box
                mt={2}
                position="relative"
                border="1px solid"
                borderColor="gray.600"
                borderRadius="md"
                p={2}
              >
                <Box position="absolute" top={2} right={2} zIndex={5}>
                  <IconButton
                    size="xs"
                    colorScheme={"blackAlpha"}
                    onClick={() => setShowPatientSearch(false)}
                    aria-label="Close search"
                  >
                    <LuX />
                  </IconButton>
                </Box>
                <PatientSearch onSelect={handlePatientSelect} />
              </Box>
            </Collapsible.Content>
          </Collapsible.Root>
        </Box>

        <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8}>
          {/* Left Column - Form Fields */}
          <GridItem>
            <VStack align="stretch" gap={4}>
              {/* Case */}
              <Flex align="center">
                <Text fontSize="sm" w="120px" color="white">
                  Case:(TBD)
                </Text>
                <Box flex={1}>
                  <Controller
                    name="case"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        options={caseOptions}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        placeholder="Select Case"
                        size="xs"
                        w="full"
                        css={{
                          "& button": {
                            borderRadius: "4px !important",
                            borderColor: "#2f4d78",
                            color: "white !important",
                          },
                        }}
                      />
                    )}
                  />
                </Box>
              </Flex>

              {/* Policy */}
              <Flex align="center">
                <Text fontSize="sm" w="120px" color="white">
                  Policy:(TBD)
                </Text>
                <Box flex={1}>
                  <Controller
                    name="policy"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        options={policyOptions}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        placeholder="Select Policy"
                        size="xs"
                        w="full"
                        css={{
                          "& button": {
                            borderRadius: "4px !important",
                            borderColor: "#2f4d78",
                            color: "white !important",
                          },
                        }}
                      />
                    )}
                  />
                </Box>
              </Flex>

              {/* Provider */}
              <Flex align="center">
                <Text fontSize="sm" w="120px" color="white">
                  Provider:
                </Text>
                <Box flex={1}>
                  <Controller
                    name="provider"
                    control={control}
                    rules={{
                      required: "Provider is required",
                      validate: (v) => {
                        if (v.id) {
                          return true;
                        } else {
                          return "Provider is required";
                        }
                      },
                    }}
                    render={({ field }) => (
                      <CustomSelect
                        options={providerOptions}
                        value={field.value?.id ? [field.value.id] : []}
                        onValueChange={(v) => {
                          const selectedProvider = providers.find(
                            (p) => p.id === v[0],
                          );
                          field.onChange(selectedProvider || {});
                        }}
                        placeholder="Select Provider"
                        size="xs"
                        w="full"
                        css={{
                          "& button": {
                            borderRadius: "4px !important",
                            borderColor: "#2f4d78",
                            color: "white !important",
                          },
                        }}
                        invalid={!!errors.provider}
                      />
                    )}
                  />
                  {errors.provider && (
                    <Text color="#ef4444" fontSize="12px">
                      {errors.provider.message}
                    </Text>
                  )}
                </Box>
              </Flex>

              {/* Service Type */}
              <Flex align="center">
                <Text fontSize="sm" w="120px" color="white">
                  Service Type:
                </Text>

                <Box flex={1}>
                  <Controller
                    name="serviceType"
                    control={control}
                    rules={{ required: "Service Type is required" }}
                    render={({ field }) => (
                      <CustomSelect
                        options={serviceTypeOptions}
                        value={[field.value]}
                        onValueChange={(v) => field.onChange(v[0])}
                        placeholder="Select Service Type"
                        size="xs"
                        w="full"
                        css={{
                          "& button": {
                            borderRadius: "4px !important",
                            borderColor: "#2f4d78",
                            color: "white !important",
                          },
                        }}
                        invalid={!!errors.serviceType}
                      />
                    )}
                  />
                  {errors.serviceType && (
                    <Text color="#ef4444" fontSize="12px">
                      {errors.serviceType.message}
                    </Text>
                  )}
                </Box>
              </Flex>

              {/* Date of Service */}
              <Flex align="center">
                <Text fontSize="sm" w="120px" color="white">
                  Date of Service:
                </Text>
                <Box flex={1}>
                  <Controller
                    name="dateOfService"
                    control={control}
                    render={({ field }) => (
                      <CustomDatePicker
                        value={field.value}
                        onValueChange={field.onChange}
                      />
                    )}
                  />
                </Box>
              </Flex>

              {/* Button */}
              <Box mt={4}>
                <CustomButton
                  type="submit"
                  variant="outline"
                  bg="white"
                  color="black"
                  border="1px solid gray"
                  size="sm"
                  _hover={{ bg: "gray.100" }}
                >
                  Check Eligibility Now
                </CustomButton>
              </Box>
            </VStack>
          </GridItem>

          {/* Right Column - Insured Info */}
          <GridItem>
            <VStack align="stretch" gap={4}>
              <Flex align="center" gap={2}>
                <Text fontSize="sm" color="white">
                  Insured
                </Text>
                <Separator flex={1} borderColor="gray.600" />
              </Flex>

              {/* Let's redo the right side layout to match screenshot exactly */}
              <SimpleGrid columns={2} spacing={4}>
                <Box>
                  <HStack align="flex-start">
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.400"
                      minW="60px"
                    >
                      Name:
                    </Text>
                    <Text fontSize="sm">
                      {selectedPatient?.first_name
                        ? selectedPatient?.first_name +
                          " " +
                          selectedPatient.last_name
                        : "N/A"}
                    </Text>
                  </HStack>
                </Box>
                <Box>
                  <HStack align="flex-start">
                    <Text fontSize="sm" fontWeight="bold" color="gray.400">
                      Patient Relationship:
                    </Text>
                    <Text fontSize="sm">Self(TBD)</Text>
                  </HStack>
                </Box>
                <Box>
                  <HStack align="flex-start">
                    <Text
                      fontSize="sm"
                      fontWeight="bold"
                      color="gray.400"
                      minW="60px"
                    >
                      Policy #:
                    </Text>
                    <Text fontSize="sm">TBD</Text>
                  </HStack>
                </Box>
                <Box>
                  <HStack align="flex-start">
                    <Text fontSize="sm" fontWeight="bold" color="gray.400">
                      Date of Birth:
                    </Text>
                    <Text fontSize="sm">
                      {formatDate(selectedPatient?.dob)}
                    </Text>
                  </HStack>
                </Box>
              </SimpleGrid>
            </VStack>
          </GridItem>
        </Grid>
      </form>

      {stediResponse && <EligibilityViewer data={stediResponse} />}
    </Box>
  );
};

export default EligibilityCheck;

import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Grid,
  GridItem,
  Button,
  Portal,
  Checkbox,
} from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react/dialog";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import CustomTextArea from "@/components/textarea/textarea";
import CustomButton from "@/components/button/button";
import AddressModal from "../insurance/modals/AddressModal";
import NameModal from "../insurance/modals/NameModal";
import InsurancePlanSearch from "@/features/pms/pratice-settings/insurance-plan/find-insurance-plan";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import { Heading } from "@chakra-ui/react";
import PatientSearch from "@/pages/pms/dental/platform-sub-components/patient-search";
import { useCreateInsurancePolicy } from "@/hooks/mutation/pms/insurance-policy/useCreateInsurancePolicy";
import { format } from "date-fns";
import { toaster } from "@/components/ui/toaster";

const InsurancePolicy = () => {
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState({});
  const [isInsuranceModalOpen, setIsInsuranceModalOpen] = useState(false);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false); // Claims Address
  const [isAdjusterModalOpen, setIsAdjusterModalOpen] = useState(false);
  const [isInsuredNameModalOpen, setIsInsuredNameModalOpen] = useState(false);
  const [isInsuredAddressModalOpen, setIsInsuredAddressModalOpen] =
    useState(false);
  const { mutate, isPending } = useCreateInsurancePolicy();

  const {
    register,
    control,
    watch,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      insurance_plan: "",
      insurance_company_id: "",
      claimsAddress: {
        street1: "",
        street2: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
      adjuster: {
        prefix: "",
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
      },
      phone: "",
      phoneExt: "",
      fax: "",
      faxExt: "",
      insuranceType: "",
      policyNumber: "",
      groupNumber: "",
      groupName: "",
      copay: "",
      deductible: "",
      effectiveStart: null,
      effectiveEnd: null,
      releaseOfInfo: "",
      notes: "",
      policyThroughEmployer: true,
      employerName: "",
      relationship: "",
      insuredName: {
        prefix: "",
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
      },
      insuredAddress: {
        street1: "",
        street2: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
      insuredId: "",
      ssn: "",
      dob: null,
      gender: "Female",
      active: true,
    },
  });

  console.log("error", errors);

  const claimsAddress = watch("claimsAddress");
  const adjuster = watch("adjuster");
  const insuredName = watch("insuredName");
  const insuredAddress = watch("insuredAddress");
  const policyThroughEmployer = watch("policyThroughEmployer");

  const formatAddress = (addr) => {
    if (!addr) return "";
    const { street1, street2, city, state, zip } = addr;
    return `${street1 || ""}${street2 ? "\n" + street2 : ""}\n${city || ""}, ${
      state || ""
    } ${zip || ""}`.trim();
  };

  const formatName = (n) => {
    if (!n) return "";
    return [n.prefix, n.firstName, n.middleName, n.lastName, n.suffix]
      .filter(Boolean)
      .join(" ");
  };

  const handleSelectInsurance = (plan) => {
    console.log("plan111", plan);
    setValue("insurance_company_id", plan.insurance_company, {
      shouldDirty: true,
    });
    if (plan.id) setValue("insurance_plan", plan.id, { shouldDirty: true });

    const address = {
      street1: plan.address_street1 || "",
      street2: "",
      city: plan.address_city || "",
      state: plan.address_state || "",
      zip: plan.address_zip || "",
      country: "",
    };
    setValue("claimsAddress", address, { shouldDirty: true });

    setIsInsuranceModalOpen(false);
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setShowPatientSearch(false);
  };

  const formatDate = (date) => {
    if (!date) return null;
    return format(new Date(date), "yyyy-MM-dd");
  };

  const onSubmit = (data) => {
    const missingFields = [];
    // if (!data.insuranceCompany) missingFields.push("Insurance Company");
    if (
      !data.claimsAddress?.street1 ||
      !data.claimsAddress?.city ||
      !data.claimsAddress?.state ||
      !data.claimsAddress?.zip
    )
      missingFields.push("Claims Address");
    // if (!data.adjuster?.firstName || !data.adjuster?.lastName)
    //   missingFields.push("Adjuster Name");
    if (!data.insuredName?.firstName || !data.insuredName?.lastName)
      missingFields.push("Insured Name");
    if (
      !data.insuredAddress?.street1 ||
      !data.insuredAddress?.city ||
      !data.insuredAddress?.state ||
      !data.insuredAddress?.zip
    )
      missingFields.push("Insured Address");

    if (missingFields.length > 0) {
      alert(
        `Please fill in the following required fields: ${missingFields.join(
          ", "
        )}`
      );
      return;
    }

    const payload = {
      insurance_plan: data.insurance_plan,
      insurance_company_id: data.insurance_company_id,
      patient: selectedPatient.id,

      claims_street1: data.claimsAddress?.street1,
      claims_street2: data.claimsAddress?.street2,
      claims_city: data.claimsAddress?.city,
      claims_state: data.claimsAddress?.state,
      claims_zip: data.claimsAddress?.zip,
      claims_country: data.claimsAddress?.country,

      adjuster_prefix: data.adjuster?.prefix,
      adjuster_first_name: data.adjuster?.firstName,
      adjuster_middle_name: data.adjuster?.middleName,
      adjuster_last_name: data.adjuster?.lastName,
      adjuster_suffix: data.adjuster?.suffix,

      phone: data.phone,
      phone_ext: data.phoneExt,
      fax: data.fax,
      fax_ext: data.faxExt,

      insurance_type: data.insuranceType,
      policy_number: data.policyNumber,
      group_number: data.groupNumber,
      group_name: data.groupName,

      copay: data.copay,
      deductible: data.deductible,

      effective_start: formatDate(data.effectiveStart),
      effective_end: formatDate(data.effectiveEnd),

      release_of_info: data.releaseOfInfo,
      notes: data.notes,

      policy_through_employer: data.policyThroughEmployer,
      employer_name: data.employerName,

      relationship: data.relationship,

      insured_prefix: data.insuredName?.prefix,
      insured_first_name: data.insuredName?.firstName,
      insured_middle_name: data.insuredName?.middleName,
      insured_last_name: data.insuredName?.lastName,
      insured_suffix: data.insuredName?.suffix,

      insured_street1: data.insuredAddress?.street1,
      insured_street2: data.insuredAddress?.street2,
      insured_city: data.insuredAddress?.city,
      insured_state: data.insuredAddress?.state,
      insured_zip: data.insuredAddress?.zip,
      insured_country: data.insuredAddress?.country,

      insured_id: data.insuredId,
      ssn: data.ssn,
      dob: formatDate(data.dob),
      gender: data.gender,

      active: data.active,
    };

    mutate(payload, {
      onSuccess: () => {
        toaster.success({
          title: "Success",
          description: "Insurance policy created",
        });
        console.log("Insurance policy created successfully");
      },
      onError: (error) => {
        toaster.error({
          title: "Success",
          description:
            error.message || error.detail || "Error creating insurance policy",
        });

        console.error("Error creating insurance policy:", error);
      },
    });
  };

  if (showPatientSearch) {
    return (
      <Box h="full" w="full" position="relative" bg="droidalBlack.300">
        <Box position="absolute" top={4} right={4} zIndex={10}>
          <CustomButton
            onClick={() => setShowPatientSearch(false)}
            variant="outline"
            size="sm"
          >
            Back to Form
          </CustomButton>
        </Box>
        <PatientSearch onSelect={handlePatientSelect} />
      </Box>
    );
  }

  return (
    <Box
      h="full"
      w="full"
      bg="droidalBlack.300"
      color="white"
      p={4}
      overflowY="auto"
    >
      <Heading size="md" letterSpacing={"widest"}>
        New Insurance Policy
      </Heading>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid templateColumns="1fr 1fr" gap={8}>
          {/* Left Column */}
          <VStack align="stretch" gap={3}>
            {/* Patient Selection */}
            <HStack>
              <Button
                size="sm"
                variant="outline"
                color="white"
                borderColor="droidalGray.300"
                minW="120px"
                fontWeight="normal"
                onClick={() => setShowPatientSearch(true)}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Patient
              </Button>
              <Text fontSize="sm" fontWeight="normal">
                {selectedPatient.first_name
                  ? selectedPatient.first_name + " " + selectedPatient.last_name
                  : "Select a Patient"}
              </Text>
            </HStack>

            {/* Insurance Company */}
            <HStack>
              <Button
                size="sm"
                variant="outline"
                color="white"
                borderColor="droidalGray.300"
                minW="120px"
                fontWeight="normal"
                onClick={() => setIsInsuranceModalOpen(true)}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Select Plan
              </Button>
              <Text fontSize="sm" fontWeight="normal">
                {watch("insuranceCompany")}
              </Text>
            </HStack>

            {/* Claims Address */}
            <HStack align="start">
              <Box minW="120px">
                <Text fontSize="sm" fontWeight="light">
                  Send Claims
                </Text>
                <Text fontSize="sm" fontWeight="light">
                  to this Address:
                </Text>
              </Box>
              <Box
                border="1px solid"
                borderColor="droidalGray.300"
                h="80px"
                w="full"
                p={2}
                fontSize="sm"
                bg="whiteAlpha.100"
              >
                {formatAddress(claimsAddress)}
              </Box>
            </HStack>

            {/* Adjuster */}
            <HStack>
              <Button
                size="sm"
                variant="outline"
                color="white"
                borderColor="droidalGray.300"
                minW="120px"
                fontWeight="normal"
                onClick={() => setIsAdjusterModalOpen(true)}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Adjuster(TBD)
              </Button>
              <Text fontSize="sm">{formatName(adjuster)}</Text>
            </HStack>

            {/* Phone */}
            <HStack>
              <Text minW="120px" fontSize="sm" fontWeight="light">
                Phone:
              </Text>
              <CustomInput
                {...register("phone", { required: "Phone is required" })}
                size="sm"
                invalid={!!errors.phone}
                showError={!!errors.phone}
                errorMessage={errors.phone?.message}
              />
              <Text fontSize="sm" fontWeight="light">
                Ext:
              </Text>
              <CustomInput {...register("phoneExt")} size="sm" w="80px" />
            </HStack>

            {/* Fax */}
            <HStack>
              <Text minW="120px" fontSize="sm" fontWeight="light">
                Fax:
              </Text>
              <CustomInput
                {...register("fax", { required: "Fax is required" })}
                size="sm"
                invalid={!!errors.fax}
                showError={!!errors.fax}
                errorMessage={errors.fax?.message}
              />
              <Text fontSize="sm" fontWeight="light">
                Ext:
              </Text>
              <CustomInput {...register("faxExt")} size="sm" w="80px" />
            </HStack>

            {/* Insurance Type */}
            <HStack>
              <Text minW="120px" fontSize="sm" fontWeight="light">
                Insurance Type:
              </Text>
              <Box w="full">
                <Controller
                  control={control}
                  name="insuranceType"
                  rules={{ required: "Insurance Type is required" }}
                  render={({ field }) => (
                    <CustomSelect
                      options={[
                        { value: "None", label: "None" },
                        { value: "HMO", label: "HMO" },
                        { value: "PPO", label: "PPO" },
                      ]}
                      value={[field.value]}
                      onValueChange={(val) => field.onChange(val[0])}
                      size="sm"
                      w="full"
                      invalid={!!errors.insuranceType}
                    />
                  )}
                />
              </Box>
            </HStack>

            {/* Policy # */}
            <HStack>
              <Text minW="120px" fontSize="sm" fontWeight="light">
                Policy #:
              </Text>
              <CustomInput
                {...register("policyNumber", {
                  required: "Policy # is required",
                })}
                size="sm"
                invalid={!!errors.policyNumber}
                showError={!!errors.policyNumber}
                errorMessage={errors.policyNumber?.message}
              />
            </HStack>

            {/* Group # */}
            <HStack>
              <Text minW="120px" fontSize="sm" fontWeight="light">
                Group #:
              </Text>
              <CustomInput
                {...register("groupNumber", {
                  required: "Group # is required",
                })}
                size="sm"
                invalid={!!errors.groupNumber}
                showError={!!errors.groupNumber}
                errorMessage={errors.groupNumber?.message}
              />
            </HStack>

            {/* Group Name */}
            <HStack>
              <Text minW="120px" fontSize="sm" fontWeight="light">
                Group Name:
              </Text>
              <CustomInput {...register("groupName")} size="sm" />
            </HStack>

            {/* Copay */}
            <HStack>
              <Text minW="120px" fontSize="sm" fontWeight="light">
                Copay:
              </Text>
              <CustomInput
                {...register("copay", { required: "Copay is required" })}
                size="sm"
                invalid={!!errors.copay}
                showError={!!errors.copay}
                errorMessage={errors.copay?.message}
                leftAddon="$"
              />
            </HStack>

            {/* Deductible */}
            <HStack>
              <Text minW="120px" fontSize="sm" fontWeight="light">
                Deductible:
              </Text>
              <CustomInput
                {...register("deductible", {
                  required: "Deductible is required",
                })}
                size="sm"
                invalid={!!errors.deductible}
                showError={!!errors.deductible}
                errorMessage={errors.deductible?.message}
                leftAddon="$"
              />
            </HStack>

            {/* Effective Start */}
            <HStack>
              <Text minW="120px" fontSize="sm" fontWeight="light">
                Effective Start:
              </Text>
              <Box w="full">
                <Controller
                  control={control}
                  name="effectiveStart"
                  rules={{ required: "Effective Start is required" }}
                  render={({ field }) => (
                    <CustomDatePicker
                      value={field.value}
                      onValueChange={field.onChange}
                      inputProps={{ placeholder: "None" }}
                      invalid={!!errors.effectiveStart}
                    />
                  )}
                />
              </Box>
            </HStack>

            {/* Effective End */}
            <HStack>
              <Text minW="120px" fontSize="sm" fontWeight="light">
                Effective End:
              </Text>
              <Box w="full">
                <Controller
                  control={control}
                  name="effectiveEnd"
                  rules={{ required: "Effective End is required" }}
                  render={({ field }) => (
                    <CustomDatePicker
                      value={field.value}
                      onValueChange={field.onChange}
                      inputProps={{ placeholder: "None" }}
                      invalid={!!errors.effectiveEnd}
                    />
                  )}
                />
              </Box>
            </HStack>

            {/* Release of Info */}
            <HStack>
              <Text minW="120px" fontSize="sm" fontWeight="light">
                Release of Info:
              </Text>
              <Box w="full">
                <Controller
                  control={control}
                  name="releaseOfInfo"
                  render={({ field }) => (
                    <CustomSelect
                      options={[
                        {
                          value:
                            "Y - Yes, Provider has a signed Statement Permitting Release of Medical Billing Data...",
                          label:
                            "Y - Yes, Provider has a signed Statement Permitting Release of Medical Billing Data...",
                        },
                        { value: "N - No", label: "N - No" },
                      ]}
                      value={[field.value]}
                      onValueChange={(val) => field.onChange(val[0])}
                      size="sm"
                      w="full"
                    />
                  )}
                />
              </Box>
            </HStack>
          </VStack>

          {/* Right Column */}
          <VStack align="stretch" gap={3}>
            {/* Policy through Employer */}
            <HStack>
              <Controller
                control={control}
                name="policyThroughEmployer"
                render={({ field }) => (
                  <Checkbox.Root
                    checked={field.value}
                    onCheckedChange={({ checked }) => field.onChange(checked)}
                  >
                    <Checkbox.HiddenInput />
                    <Checkbox.Control />
                    <Checkbox.Label
                      color="white"
                      fontWeight="light"
                      fontSize="sm"
                    >
                      Policy through Employer:
                    </Checkbox.Label>
                  </Checkbox.Root>
                )}
              />
              <CustomInput
                {...register("employerName", {
                  required: policyThroughEmployer
                    ? "Employer Name is required"
                    : false,
                })}
                size="sm"
                disabled={!policyThroughEmployer}
                invalid={!!errors.employerName}
                showError={!!errors.employerName}
                errorMessage={errors.employerName?.message}
              />
            </HStack>

            {/* Patient Relationship */}
            <HStack>
              <Text minW="200px" fontSize="sm" fontWeight="light">
                Patient Relationship to Insured:
              </Text>
              <Box w="full">
                <Controller
                  control={control}
                  name="relationship"
                  // rules={{ required: "Relationship is required" }}
                  render={({ field }) => (
                    <CustomSelect
                      options={[
                        { value: "Self", label: "Self" },
                        { value: "Spouse", label: "Spouse" },
                        { value: "Child", label: "Child" },
                        { value: "Other", label: "Other" },
                      ]}
                      value={[field.value]}
                      onValueChange={(val) => field.onChange(val[0])}
                      size="sm"
                      w="full"
                      invalid={!!errors.relationship}
                    />
                  )}
                />
              </Box>
            </HStack>

            {/* Insured Section */}
            <Box mt={4}>
              <Text
                fontSize="sm"
                fontWeight="light"
                borderBottom="1px solid"
                borderColor="droidalGray.300"
                mb={3}
              >
                Insured
              </Text>
              <VStack align="stretch" gap={3}>
                {/* Full Name */}
                <HStack>
                  <Button
                    size="sm"
                    variant="outline"
                    color="white"
                    borderColor="droidalGray.300"
                    minW="100px"
                    fontWeight="normal"
                    onClick={() => setIsInsuredNameModalOpen(true)}
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    Full Name
                  </Button>
                  <CustomInput
                    value={formatName(insuredName)}
                    readOnly
                    size="sm"
                    bg="whiteAlpha.100"
                  />
                </HStack>

                {/* Address */}
                <HStack align="start">
                  <Button
                    size="sm"
                    variant="outline"
                    color="white"
                    borderColor="droidalGray.300"
                    minW="100px"
                    fontWeight="normal"
                    onClick={() => setIsInsuredAddressModalOpen(true)}
                    _hover={{ bg: "whiteAlpha.100" }}
                  >
                    Address
                  </Button>
                  <Box
                    border="1px solid"
                    borderColor="droidalGray.300"
                    h="80px"
                    w="full"
                    p={2}
                    fontSize="sm"
                    bg="whiteAlpha.100"
                  >
                    {formatAddress(insuredAddress)}
                  </Box>
                </HStack>

                {/* Insured ID No */}
                <HStack>
                  <Text minW="100px" fontSize="sm" fontWeight="light">
                    Insured ID No:
                  </Text>
                  <CustomInput
                    {...register("insuredId", {
                      required: "Insured ID is required",
                    })}
                    size="sm"
                    bg="whiteAlpha.100"
                    invalid={!!errors.insuredId}
                    showError={!!errors.insuredId}
                    errorMessage={errors.insuredId?.message}
                  />
                </HStack>

                {/* SSN */}
                <HStack>
                  <Text minW="100px" fontSize="sm" fontWeight="light">
                    SSN:
                  </Text>
                  <CustomInput
                    {...register("ssn", { required: "SSN is required" })}
                    size="sm"
                    bg="whiteAlpha.100"
                    invalid={!!errors.ssn}
                    showError={!!errors.ssn}
                    errorMessage={errors.ssn?.message}
                  />
                </HStack>

                {/* Date of Birth */}
                <HStack>
                  <Text minW="100px" fontSize="sm" fontWeight="light">
                    Date of Birth:
                  </Text>
                  <Box w="full">
                    <Controller
                      control={control}
                      name="dob"
                      rules={{ required: "Date of Birth is required" }}
                      render={({ field }) => (
                        <CustomDatePicker
                          value={field.value}
                          onValueChange={field.onChange}
                          inputProps={{ placeholder: "None" }}
                          invalid={!!errors.dob}
                        />
                      )}
                    />
                  </Box>
                </HStack>

                {/* Gender */}
                <HStack>
                  <Text minW="100px" fontSize="sm" fontWeight="light">
                    Gender:
                  </Text>
                  <Box w="full">
                    <Controller
                      control={control}
                      name="gender"
                      rules={{ required: "Gender is required" }}
                      render={({ field }) => (
                        <CustomSelect
                          options={[
                            { value: "Male", label: "Male" },
                            { value: "Female", label: "Female" },
                          ]}
                          value={[field.value]}
                          onValueChange={(val) => field.onChange(val[0])}
                          size="sm"
                          w="full"
                          invalid={!!errors.gender}
                        />
                      )}
                    />
                  </Box>
                </HStack>

                {/* Active */}
                <HStack>
                  <Text minW="100px" fontSize="sm" fontWeight="light">
                    Active:
                  </Text>
                  <Controller
                    control={control}
                    name="active"
                    render={({ field }) => (
                      <Checkbox.Root
                        checked={field.value}
                        onCheckedChange={({ checked }) =>
                          field.onChange(checked)
                        }
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                    )}
                  />
                </HStack>

                {/* Notes */}
                <VStack align="stretch" gap={1}>
                  <Text
                    fontSize="sm"
                    fontWeight="light"
                    borderBottom="1px solid"
                    borderColor="droidalGray.300"
                  >
                    Notes
                  </Text>
                  <CustomTextArea
                    {...register("notes")}
                    h="100px"
                    resize="none"
                  />
                </VStack>
              </VStack>
            </Box>
          </VStack>
        </Grid>
        <Flex justify="flex-end" mt={6}>
          <CustomButton type="submit" isLoading={isPending}>
            Save Policy
          </CustomButton>
        </Flex>
      </form>

      {/* Modals */}
      <Dialog.Root
        placement="center"
        open={isInsuranceModalOpen}
        onOpenChange={(e) => !e.open && setIsInsuranceModalOpen(false)}
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" />
          <Dialog.Positioner>
            <Dialog.Content
              bg="droidalBlack.300"
              color="white"
              borderRadius="md"
              maxW="90vw"
              h="90vh"
              boxShadow="xl"
              p={0}
            >
              <Dialog.Body p={0} h="full">
                <InsurancePlanSearch onSelect={handleSelectInsurance} />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        address={claimsAddress}
        onSave={(data) =>
          setValue("claimsAddress", data, { shouldDirty: true })
        }
      />

      <NameModal
        isOpen={isAdjusterModalOpen}
        onClose={() => setIsAdjusterModalOpen(false)}
        name={adjuster}
        onSave={(data) => setValue("adjuster", data, { shouldDirty: true })}
      />

      <NameModal
        isOpen={isInsuredNameModalOpen}
        onClose={() => setIsInsuredNameModalOpen(false)}
        name={insuredName}
        onSave={(data) => setValue("insuredName", data, { shouldDirty: true })}
      />

      <AddressModal
        isOpen={isInsuredAddressModalOpen}
        onClose={() => setIsInsuredAddressModalOpen(false)}
        address={insuredAddress}
        onSave={(data) =>
          setValue("insuredAddress", data, { shouldDirty: true })
        }
      />
    </Box>
  );
};

export default InsurancePolicy;

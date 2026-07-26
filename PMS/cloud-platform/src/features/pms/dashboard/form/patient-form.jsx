import React from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Text,
  VStack,
  Stack,
  HStack,
  Field,
  Grid,
  Flex,
  Checkbox,
  Link,
  Separator,
  SimpleGrid,
  GridItem,
  Input,
  Image,
  IconButton,
  Icon,
} from "@chakra-ui/react";
import { LuUpload, LuX } from "react-icons/lu";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import CustomTextArea from "@/components/textarea/textarea";
import CustomButton from "@/components/button/button";
import { toaster } from "@/components/ui/toaster";
import { useNavigate, useParams } from "react-router-dom";
import { useCreatePatient } from "@/hooks/mutation/pms/patient/useCreatePatient";
import { useUpdatePatient } from "@/hooks/mutation/pms/patient/useUpdatePatient";
import { useGetPatientById } from "@/hooks/query/pms/pms_appointments/useGetPatientById";
import ProviderSearch from "@/pages/pms/dental/platform-sub-components/provider-search";
import PayerSearch from "./payer-search";
import { useMemo, useEffect } from "react";
import { useGetMinimalProvider } from "@/hooks/query/pms/patient/useGetMinimalProvider";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import { CalendarIcon } from "lucide-react";
import { formatDate } from "@/utils/helper";
// import ProfileUploader from "./Component/profilepicture";

const ProfileUploader = ({ value, onChange }) => {
  const file = Array.isArray(value) ? value[0] : value;
  const [preview, setPreview] = React.useState(null);

  React.useEffect(() => {
    if (file) {
      if (typeof file === "string") {
        setPreview(file);
        return;
      }
      if (file instanceof File || file instanceof Blob) {
        const url = URL.createObjectURL(file);
        setPreview(url);
        return () => URL.revokeObjectURL(url);
      }
    }
    setPreview(null);
  }, [file]);

  console.log("preview1212", preview);

  const previewUrl =
    preview && typeof preview === "string"
      ? preview.startsWith("blob:")
        ? preview
        : `${preview.replace("http:", "https:")}/`
      : "";

  return (
    <Box
      border="1px dashed"
      borderColor="gray.600"
      borderRadius="12px"
      p={2}
      textAlign="center"
      position="relative"
      _hover={{ borderColor: "blue.400" }}
      cursor="pointer"
      onClick={() => document.getElementById("profile-upload-input").click()}
      h="120px"
      display="flex"
      w={"120px"}
      alignItems="center"
      justifyContent="center"
      bg="droidalBlack.300"
    >
      <Input
        type="file"
        id="profile-upload-input"
        display="none"
        accept="image/png, image/jpeg, image/jpg"
        onChange={(e) => {
          const selectedFile = e.target.files[0];
          if (selectedFile) {
            onChange(selectedFile);
          }
        }}
        onClick={(e) => e.stopPropagation()}
      />

      {previewUrl ? (
        <Box
          position="relative"
          w="full"
          h="full"
          display="flex"
          justifyContent="center"
          alignItems="center"
          borderRadius="12px"
        >
          <Image
            src={previewUrl}
            alt="Profile Preview"
            h="100%"
            objectFit="contain"
            borderRadius="12px"
          />
          <IconButton
            aria-label="Remove image"
            size="xs"
            position="absolute"
            top="-8px"
            right="-8px"
            bg="red.500"
            _hover={{ bg: "red.600" }}
            color="white"
            borderRadius="12px"
            onClick={(e) => {
              e.stopPropagation();
              onChange([]);
            }}
          >
            <Icon as={LuX} />
          </IconButton>
        </Box>
      ) : (
        <VStack gap={1}>
          <Icon as={LuUpload} boxSize={5} color="gray.400" />
          <Text fontSize="xs" color="gray.400">
            Upload Profile Picture
          </Text>
        </VStack>
      )}
    </Box>
  );
};

const PatientForm = () => {
  const navigate = useNavigate();
  const { editId } = useParams();
  const { data: patientData } = useGetPatientById(editId ? editId : null);
  const { mutateAsync: updatePatient, isPending: isUpdating } =
    useUpdatePatient();

  const { data: providersData } = useGetMinimalProvider();
  const { mutateAsync, isPending } = useCreatePatient();
  const {
    register,
    handleSubmit,
    control,
    formState: { isSubmitting, errors },
    reset,
    setValue,
    getValues,
    watch,
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      previousName: "Not Found",
      dob: "",
      ssn: "",
      gender: "Unknown",
      pronouns: "",
      mrn: "",
      maritalStatus: "",
      employmentStatus: "",
      referralSource: "Not Specified",
      address: "",
      priorAddress: "Not Found",
      sendEmailNotifications: false,
      homePhone: "",
      homePhoneExt: "",
      workPhone: "",
      workPhoneExt: "",
      mobilePhone: "",
      mobilePhoneExt: "",
      enableAutoReminders: false,
      emergencyName: "",
      emergencyPhone: "",
      emergencyPhoneExt: "",
      pcp: "",
      referringPhysician: "",
      defaultRenderingProvider: "",
      defaultServiceLocation: "Not Specified",
      responsiblePartyDifferent: false,
      responsiblePartyFirstName: "",
      responsiblePartyLastName: "",
      responsiblePartyRelation: "",
      responsiblePartyAddress: "",
      defaultPayerScenario: "",
      memberId: "",
      insurance_name: "",
      serviceTypeCode: "",
      notes: "",
      profilePicture: [],
    },
    mode: "onChange",
  });

  const responsiblePartyDifferent = watch("responsiblePartyDifferent");

  console.log("errors", errors);

  useEffect(() => {
    if (patientData && editId) {
      let insuranceName = "";
      try {
        insuranceName =
          typeof patientData.insurance_name === "string"
            ? JSON.parse(patientData.insurance_name)
            : patientData.insurance_name;
      } catch {
        insuranceName = patientData.insurance_name;
      }

      reset({
        firstName: patientData.first_name || "",
        lastName: patientData.last_name || "",
        previousName: "Not Found",
        email: patientData.email,
        employer: patientData.employer,
        dob: patientData.dob ? new Date(patientData.dob) : "",
        ssn: patientData.ssn || "",
        gender: patientData.gender || "Unknown",
        pronouns: patientData.pronouns || "",
        mrn: patientData.mrn || "",
        maritalStatus: patientData.marital_status || "",
        employmentStatus: patientData.employment_status || "",
        referralSource: patientData.referral_source || "Not Specified",
        address: patientData.address || "",
        priorAddress: "Not Found",
        sendEmailNotifications: patientData.send_email_notifications || false,
        homePhone: patientData.home_phone || "",
        homePhoneExt: patientData.home_phone_ext || "",
        workPhone: patientData.work_phone || "",
        workPhoneExt: patientData.work_phone_ext || "",
        mobilePhone: patientData.mobile_phone || "",
        mobilePhoneExt: patientData.mobile_phone_ext || "",
        enableAutoReminders: patientData.enable_auto_reminders || false,
        emergencyName: patientData.emergency_name || "",
        emergencyPhone: patientData.emergency_phone || "",
        emergencyPhoneExt: patientData.emergency_phone_ext || "",
        pcp: patientData.pcp ? Number(patientData.pcp) : "",
        referringPhysician: patientData.referring_physician
          ? Number(patientData.referring_physician)
          : "",
        defaultRenderingProvider: patientData.default_rendering_provider
          ? Number(patientData.default_rendering_provider)
          : "",
        defaultServiceLocation:
          patientData.default_service_location || "Not Specified",
        responsiblePartyDifferent:
          patientData.responsible_party_different || false,
        responsiblePartyFirstName:
          patientData.responsible_party_first_name || "",
        responsiblePartyLastName: patientData.responsible_party_last_name || "",
        responsiblePartyRelation: patientData.responsible_party_relation || "",
        responsiblePartyAddress: patientData.responsible_party_address || "",
        defaultPayerScenario: patientData.default_payer_scenario || "",
        memberId: patientData.memberId || "",
        insurance_name: insuranceName || "",
        serviceTypeCode: patientData.service_type_code || "",
        notes: patientData.notes || "",
        profilePicture: patientData.profile_picture || [],
      });
    }
  }, [patientData, editId, reset]);

  const providerOptions = useMemo(
    () =>
      providersData.map((provider) => ({
        label:
          `${provider.first_name || ""} ${provider.last_name || ""}`.trim() ||
          `Provider ${provider.id}`,
        value: provider.id,
      })),
    [providersData],
  );

  const [showProviderSearch, setShowProviderSearch] = React.useState(false);
  const [activeProviderField, setActiveProviderField] = React.useState(null);

  const handleFindProvider = (fieldName) => {
    setActiveProviderField(fieldName);
    setShowProviderSearch(true);
  };

  const handleProviderSelect = (provider) => {
    if (activeProviderField) {
      setValue(activeProviderField, provider.id, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    setShowProviderSearch(false);
    setActiveProviderField(null);
  };

  function isValidUrl(value) {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }

  const onSubmit = async (data) => {
    const payload = {
      first_name: data.firstName,
      last_name: data.lastName,
      mrn: data.mrn,
      dob: data.dob ? formatDate(data.dob, "yyyy-MM-dd") : null,
      ssn: data.ssn,
      gender: data.gender,
      pronouns: data.pronouns,
      marital_status: data.maritalStatus,
      referral_source: data.referralSource,
      pcp: data.pcp,
      referring_physician: data.referringPhysician,
      default_rendering_provider: data.defaultRenderingProvider,
      default_service_location: data.defaultServiceLocation,
      employment_status: data.employmentStatus,
      employer: data.employer,
      address: data.address,
      home_phone: data.homePhone,
      home_phone_ext: data.homePhoneExt,
      work_phone: data.workPhone,
      work_phone_ext: data.workPhoneExt,
      mobile_phone: data.mobilePhone,
      mobile_phone_ext: data.mobilePhoneExt,
      enable_auto_reminders: data.enableAutoReminders,
      send_email_notifications: data.sendEmailNotifications,
      emergency_name: data.emergencyName,
      emergency_phone: data.emergencyPhone,
      emergency_phone_ext: data.emergencyPhoneExt,
      responsible_party_different: data.responsiblePartyDifferent,
      responsible_party_first_name: data.responsiblePartyFirstName,
      responsible_party_last_name: data.responsiblePartyLastName,
      responsible_party_relation: data.responsiblePartyRelation,
      responsible_party_address: data.responsiblePartyAddress,
      default_payer_scenario: data.defaultPayerScenario,
      memberId: data.memberId,
      insurance_name: JSON.stringify(data.insurance_name),
      service_type_code: data.serviceTypeCode,
      notes: data.notes,
      ...(!isValidUrl(data.profilePicture) && {
        profile_picture: data.profilePicture,
      }),
      email: data.email,
    };

    console.log("payload999", isValidUrl(data.profilePicture), payload);

    const formData = new FormData();

    Object.keys(payload).forEach((key) => {
      if (key === "dob" && !payload[key]) {
        formData.append(key, "");
      } else {
        formData.append(key, payload[key]);
      }
    });

    try {
      if (editId) {
        formData.id = editId;
        await updatePatient(formData);
        toaster.success({
          title: "Form Submitted",
          description: "Patient data has been updated successfully.",
        });
      } else {
        await mutateAsync(formData);
        toaster.success({
          title: "Form Submitted",
          description: "Patient data has been saved successfully.",
        });
      }
      reset();
      navigate("/pms/home/patients");
    } catch (error) {
      console.log("error", error);
      toaster.error({
        title: "Submission Failed",
        description: "There was an error saving the patient data.",
      });
    }
  };

  const genderOptions = [
    { label: "Unknown", value: "Unknown" },
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ];

  const pronounsOptions = [
    { label: "He/Him", value: "He/Him" },
    { label: "She/Her", value: "She/Her" },
    { label: "They/Them", value: "They/Them" },
  ];

  const maritalStatusOptions = [
    { label: "Single", value: "Single" },
    { label: "Married", value: "Married" },
    { label: "Divorced", value: "Divorced" },
    { label: "Widowed", value: "Widowed" },
  ];

  const employmentStatusOptions = [
    { label: "Employed", value: "Employed" },
    { label: "Unemployed", value: "Unemployed" },
    { label: "Retired", value: "Retired" },
    { label: "Student", value: "Student" },
  ];

  const referralSourceOptions = [
    { label: "Not Specified", value: "Not Specified" },
    { label: "Provider", value: "Provider" },
    { label: "Friend", value: "Friend" },
    { label: "Advertisement", value: "Advertisement" },
  ];

  const serviceLocationOptions = [
    { label: "Not Specified", value: "Not Specified" },
    { label: "Main Office", value: "Main Office" },
    { label: "Satellite Clinic", value: "Satellite Clinic" },
  ];

  const responsiblePartyRelationOptions = [
    { label: "Parent", value: "Parent" },
    { label: "Spouse", value: "Spouse" },
    { label: "Guardian", value: "Guardian" },
    { label: "Other", value: "Other" },
    { label: "Child", value: "Child" },
    { label: "Sibling", value: "Sibling" },
  ];

  const payerScenarioOptions = [
    { label: "Attorney Lien", value: "ATTORNEY_LIEN" },
    { label: "Auto Insurance", value: "AUTO" },
    { label: "BC/BS", value: "BCBS" },
    { label: "BC/BS HMO", value: "BCBS_HMO" },
    { label: "Commercial", value: "COMMERCIAL" },
    { label: "HMO", value: "HMO" },
    { label: "Medicaid", value: "MEDICAID" },
    { label: "Medicaid HMO", value: "MEDICAID_HMO" },
    { label: "Medicare", value: "MEDICARE" },
    { label: "PPO", value: "PPO" },
    { label: "Self Pay", value: "SELF_PAY" },
    { label: "Tricare", value: "TRICARE" },
    { label: "VA", value: "VA" },
    { label: "Workers Comp", value: "WORKERS_COMP" },
    { label: "Workers Comp - Applicant", value: "WC_APPLICANT" },
    { label: "Workers Comp - Defense", value: "WC_DEFENSE" },
  ];

  if (showProviderSearch) {
    return (
      <Box p={6} bg="droidalBlack.400" color="white" h="full" minH="100vh">
        <Box position="relative" w="full" h="full">
          <CustomButton
            onClick={() => setShowProviderSearch(false)}
            position="absolute"
            top={0}
            right={0}
            zIndex={10}
            variant="outline"
            bg="droidalBlack.300"
            color="white"
            border="1px solid gray"
          >
            Back to Form
          </CustomButton>
          <ProviderSearch onSelect={handleProviderSelect} />
        </Box>
      </Box>
    );
  }

  return (
    <Box p={6} bg="droidalBlack.400" color="white">
      <VStack align="start" gap={2} mx="auto">
        <Text fontSize="xl" m={0} fontWeight="light" lettergap="wider">
          Patient Registration
        </Text>

        <form onSubmit={handleSubmit(onSubmit)} style={{ width: "100%" }}>
          <Stack
            position={"relative"}
            gap={6}
            bg="droidalBlack.300"
            p={4}
            borderRadius="md"
          >
            {/* Top Section */}
            <Grid templateColumns={{ base: "1fr", lg: "1fr 1fr" }} gap={8}>
              {/* Left Column */}
              <VStack align="stretch" gap={2}>
                <SimpleGrid
                  placeItems={"center"}
                  columns={{ base: 1, lg: 3 }}
                  gap={2}
                >
                  {/* Profile Picture */}
                  <GridItem placeSelf={"flex-start"} rowSpan={2}>
                    <Box>
                      <Flex align="center" gap={2} mb={2}>
                        <Text fontSize="sm" fontWeight="medium">
                          Profile Picture
                        </Text>
                        <Separator borderColor="gray.600" />
                      </Flex>
                      <Controller
                        name="profilePicture"
                        control={control}
                        render={({ field }) => (
                          <ProfileUploader
                            value={field.value}
                            onChange={field.onChange}
                          />
                        )}
                      />
                    </Box>
                  </GridItem>
                  <CustomInput
                    label={
                      <>
                        First Name{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </>
                    }
                    size="xs"
                    placeholder="First Name..."
                    invalid={!!errors.firstName}
                    showError={!!errors.firstName}
                    errorMessage={errors.firstName?.message}
                    {...register("firstName", {
                      required: "First Name is required",
                      maxLength: {
                        value: 15,
                        message: "Max 15 characters",
                      },
                      pattern: {
                        value: /^[a-zA-Z0-9\s]+$/,
                        message:
                          "Numeric and special characters are not allowed",
                      },
                    })}
                    labelProps={{
                      fontSize: "sm",
                    }}
                  />
                  <CustomInput
                    label={
                      <>
                        Last Name{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </>
                    }
                    size="xs"
                    placeholder="Last Name..."
                    invalid={!!errors.lastName}
                    showError={!!errors.lastName}
                    errorMessage={errors.lastName?.message}
                    {...register("lastName", {
                      required: "Last Name is required",
                      maxLength: {
                        value: 15,
                        message: "Max 15 characters",
                      },
                      pattern: {
                        value: /^[a-zA-Z\s]+$/,
                        message:
                          "Numeric and special characters are not allowed",
                      },
                    })}
                    labelProps={{
                      fontSize: "sm",
                    }}
                  />
                  <CustomInput
                    label={<>Email Id</>}
                    placeholder="Email Id"
                    {...register("email", {
                      validate: (value) => {
                        if (getValues("sendEmailNotifications") && !value) {
                          return "Email is required when notifications are enabled";
                        }
                        if (value) {
                          const emailRegex =
                            /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                          if (!emailRegex.test(value)) {
                            return "Invalid email format";
                          }
                        }
                        return true;
                      },
                    })}
                    size="xs"
                    showError={!!errors.email?.message}
                    invalid={!!errors.email?.message}
                    errorMessage={errors.email?.message}
                  />
                  <CustomInput
                    label="Medical Record Number"
                    size="xs"
                    {...register("mrn")}
                    labelProps={{
                      fontSize: "sm",
                    }}
                  />
                </SimpleGrid>

                <SimpleGrid columns={{ base: 2, lg: 3 }} gap={2}>
                  <Field.Root invalid={!!errors.dob}>
                    <Field.Label
                      color="white"
                      fontSize="sm"
                      fontWeight={300}
                      mb={0}
                      w="180px"
                    >
                      Date of Birth:
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Field.Label>
                    <Controller
                      name="dob"
                      control={control}
                      render={({ field: { onChange, value } }) => (
                        <CustomDatePicker
                          value={value}
                          onValueChange={onChange}
                          endElement={
                            <CalendarIcon className="text-gray-400" />
                          }
                          minDate={new Date("1900-01-01")}
                          maxDate={new Date()}
                          inputProps={{
                            size: "xs",
                          }}
                        />
                      )}
                      rules={{
                        required: "Date of Birth is required",
                      }}
                    />

                    {errors.dob && (
                      <Field.ErrorText>{errors.dob.message}</Field.ErrorText>
                    )}
                  </Field.Root>

                  <CustomInput
                    label="Social Security Number"
                    size="xs"
                    labelProps={{
                      fontSize: "xs",
                      whiteSpace: "nowrap",
                    }}
                    placeholder="___-__-____"
                    invalid={!!errors.ssn}
                    showError={!!errors.ssn}
                    errorMessage={errors.ssn?.message}
                    {...register("ssn", {
                      pattern: {
                        value: /^[0-9]+$/,
                        message: "Only numbers are allowed",
                      },
                    })}
                  />

                  <Field.Root>
                    <Field.Label
                      color="white"
                      fontSize="sm"
                      fontWeight={300}
                      mb={0}
                      w="180px"
                    >
                      Gender:
                    </Field.Label>
                    <Controller
                      name="gender"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          options={genderOptions}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          placeholder="Unknown"
                          css={{
                            "& button": {
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                              color: "white !important",
                            },
                          }}
                          w="full"
                          size="xs"
                        />
                      )}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color="white" fontSize="sm" mb={0} w="180px">
                      Pronouns:
                    </Field.Label>
                    <Controller
                      name="pronouns"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          options={pronounsOptions}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          css={{
                            "& button": {
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                              color: "white !important",
                            },
                          }}
                          size="xs"
                          w="full"
                        />
                      )}
                    />
                  </Field.Root>
                  <Field.Root>
                    <Field.Label
                      size="xs"
                      color="white"
                      fontSize="sm"
                      mb={0}
                      w="180px"
                    >
                      Marital Status:
                    </Field.Label>
                    <Controller
                      name="maritalStatus"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          options={maritalStatusOptions}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          css={{
                            "& button": {
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                              color: "white !important",
                            },
                          }}
                          size="xs"
                          w="full"
                        />
                      )}
                    />
                  </Field.Root>

                  <Field.Root>
                    <Field.Label color="white" fontSize="sm" mb={0} w="180px">
                      Referral Source:
                    </Field.Label>
                    <Controller
                      name="referralSource"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          options={referralSourceOptions}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          placeholder="Not Specified"
                          css={{
                            "& button": {
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                              color: "white !important",
                            },
                          }}
                          w="full"
                          size="xs"
                        />
                      )}
                    />
                  </Field.Root>
                </SimpleGrid>
                <Box>
                  <Flex align="center" gap={2} mb={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      Providers
                    </Text>
                    <Separator borderColor="gray.600" />
                  </Flex>
                  <Grid
                    templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
                    gap={2}
                  >
                    <HStack align="stretch" gap={2}>
                      <Text
                        fontSize="xs"
                        fontWeight={"light"}
                        cursor="pointer"
                        _hover={{
                          textDecoration: "underline",
                          color: "blue.400",
                        }}
                        onClick={() => handleFindProvider("pcp")}
                      >
                        Primary Care Physician:
                      </Text>
                      <Controller
                        name="pcp"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            options={providerOptions}
                            value={[field.value]}
                            onValueChange={(v) => field.onChange(v[0])}
                            placeholder="Select Primary Care Physician"
                            css={{
                              "& button": {
                                borderRadius: "4px !important",
                                borderColor: "#2f4d78",
                                color: "white !important",
                              },
                            }}
                            size="xs"
                            w="full"
                          />
                        )}
                      />
                    </HStack>
                    <HStack align="stretch" gap={2}>
                      <Text
                        fontSize="xs"
                        fontWeight={"light"}
                        cursor="pointer"
                        _hover={{
                          textDecoration: "underline",
                          color: "blue.400",
                        }}
                        onClick={() => handleFindProvider("referringPhysician")}
                      >
                        Referring Physician:
                      </Text>
                      <Controller
                        name="referringPhysician"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            options={providerOptions}
                            value={[field.value]}
                            onValueChange={(v) => field.onChange(v[0])}
                            placeholder="Select Referring Physician"
                            css={{
                              "& button": {
                                borderRadius: "4px !important",
                                borderColor: "#2f4d78",
                                color: "white !important",
                              },
                            }}
                            size="xs"
                            w="full"
                          />
                        )}
                      />
                    </HStack>
                    <HStack align="stretch" gap={2}>
                      <Text
                        fontSize="xs"
                        fontWeight={"light"}
                        cursor="pointer"
                        _hover={{
                          textDecoration: "underline",
                          color: "blue.400",
                        }}
                        onClick={() =>
                          handleFindProvider("defaultRenderingProvider")
                        }
                      >
                        Default Rendering Provider:
                      </Text>
                      <Controller
                        name="defaultRenderingProvider"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            options={providerOptions}
                            value={[field.value]}
                            onValueChange={(v) => field.onChange(v[0])}
                            placeholder="Select Rendering Provider"
                            css={{
                              "& button": {
                                borderRadius: "4px !important",
                                borderColor: "#2f4d78",
                                color: "white !important",
                              },
                            }}
                            size="xs"
                            w="full"
                          />
                        )}
                      />
                    </HStack>
                    <HStack align="stretch" gap={2}>
                      <Text fontSize="xs" fontWeight={"light"}>
                        Default Service Location:
                      </Text>
                      <Controller
                        name="defaultServiceLocation"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            options={serviceLocationOptions}
                            value={[field.value]}
                            onValueChange={(v) => field.onChange(v[0])}
                            placeholder="Select Service Location"
                            css={{
                              "& button": {
                                borderRadius: "4px !important",
                                borderColor: "#2f4d78",
                                color: "white !important",
                              },
                            }}
                            size="xs"
                            w="full"
                          />
                        )}
                      />
                    </HStack>
                  </Grid>
                </Box>
                <Box>
                  <Flex align="center" gap={2} mb={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      Responsible Party
                    </Text>
                    <Separator borderColor="gray.600" />
                  </Flex>
                  <Flex align="center" gap={2}>
                    <Controller
                      name="responsiblePartyDifferent"
                      control={control}
                      render={({ field }) => (
                        <Checkbox.Root
                          size={{
                            base: "sm",
                          }}
                          checked={field.value}
                          onCheckedChange={(v) => {
                            field.onChange(v.checked);
                          }}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control
                            _checked={{
                              bgImage:
                                "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                            }}
                            borderColor="#2f4d78"
                            bgColor={"black"}
                          />
                          <Checkbox.Label
                            color="droidalGray.400"
                            fontWeight={"light"}
                          >
                            Person financially responsible (a.k.a. Responsible
                            Party) is different than patient
                          </Checkbox.Label>
                        </Checkbox.Root>
                      )}
                    />
                  </Flex>
                  {responsiblePartyDifferent && (
                    <SimpleGrid columns={{ base: 1, lg: 2 }} gap={2} mt={2}>
                      <CustomInput
                        label={
                          <>
                            First Name{" "}
                            <Text as="span" color="red.500">
                              *
                            </Text>
                          </>
                        }
                        placeholder="First Name..."
                        size="xs"
                        {...register("responsiblePartyFirstName", {
                          required: "First Name is required",
                        })}
                        invalid={!!errors.responsiblePartyFirstName}
                        showError={!!errors.responsiblePartyFirstName}
                        errorMessage={errors.responsiblePartyFirstName?.message}
                      />
                      <CustomInput
                        label={
                          <>
                            Last Name{" "}
                            <Text as="span" color="red.500">
                              *
                            </Text>
                          </>
                        }
                        placeholder="Last Name..."
                        size="xs"
                        {...register("responsiblePartyLastName", {
                          required: "Last Name is required",
                        })}
                        invalid={!!errors.responsiblePartyLastName}
                        showError={!!errors.responsiblePartyLastName}
                        errorMessage={errors.responsiblePartyLastName?.message}
                      />
                      <Field.Root invalid={!!errors.responsiblePartyRelation}>
                        <Field.Label color="white" fontSize="sm" mb={0}>
                          Relationship:{" "}
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </Field.Label>
                        <Controller
                          name="responsiblePartyRelation"
                          control={control}
                          rules={{ required: "Relationship is required" }}
                          render={({ field }) => (
                            <CustomSelect
                              options={responsiblePartyRelationOptions}
                              value={[field.value]}
                              onValueChange={(v) => field.onChange(v[0])}
                              placeholder="Select Relationship"
                              css={{
                                "& button": {
                                  borderRadius: "4px !important",
                                  borderColor: "#2f4d78",
                                  color: "white !important",
                                },
                              }}
                              size="xs"
                              w="full"
                            />
                          )}
                        />
                        <Field.ErrorText>
                          {errors.responsiblePartyRelation?.message}
                        </Field.ErrorText>
                      </Field.Root>
                      <GridItem colSpan={{ base: 1, lg: 2 }}>
                        <CustomTextArea
                          label={
                            <>
                              Address{" "}
                              <Text as="span" color="red.500">
                                *
                              </Text>
                            </>
                          }
                          placeholder="Address..."
                          {...register("responsiblePartyAddress", {
                            required: "Address is required",
                          })}
                          invalid={!!errors.responsiblePartyAddress}
                          showError={!!errors.responsiblePartyAddress}
                          errorMessage={errors.responsiblePartyAddress?.message}
                          minH="60px"
                        />
                      </GridItem>
                    </SimpleGrid>
                  )}
                </Box>
              </VStack>

              {/* Right Column */}
              <VStack align="stretch" gap={2}>
                <HStack>
                  <Field.Root>
                    <Field.Label color="white" fontSize="sm" mb={0} w="180px">
                      Employment Status:
                    </Field.Label>
                    <Controller
                      name="employmentStatus"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          options={employmentStatusOptions}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          css={{
                            "& button": {
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                              color: "white !important",
                            },
                          }}
                          size="xs"
                          w="full"
                        />
                      )}
                    />
                  </Field.Root>

                  <CustomInput
                    label="Employer"
                    labelProps={{
                      fontSize: "sm",
                    }}
                    size="xs"
                    placeholder="Employer..."
                    {...register("employer")}
                  />
                </HStack>
                <Box>
                  <Flex align="center" gap={2} mb={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      Contact Information{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Separator borderColor="gray.600" />
                  </Flex>

                  <Grid
                    templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
                    gap={8}
                  >
                    <VStack align="stretch" gap={2}>
                      <CustomTextArea
                        placeholder="Address..."
                        invalid={!!errors.address}
                        showError={!!errors.address}
                        errorMessage={errors.address?.message}
                        {...register("address", {
                          required: "Address is required",
                        })}
                        minH="80px"
                        color="#fff"
                      />
                    </VStack>
                    <VStack align="stretch" gap={1}>
                      <HStack>
                        <CustomInput
                          placeholder={"Home Phone..."}
                          invalid={!!errors.homePhone}
                          showError={!!errors.homePhone}
                          errorMessage={errors.homePhone?.message}
                          {...register("homePhone", {
                            maxLength: {
                              value: 15,
                              message: "Max 15 characters",
                            },
                            pattern: {
                              value: /^[0-9]*$/,
                              message: "Only numbers are allowed",
                            },
                          })}
                          size="2xs"
                        />
                        <CustomInput
                          placeholder={"Ext..."}
                          invalid={!!errors.homePhoneExt}
                          showError={!!errors.homePhoneExt}
                          errorMessage={errors.homePhoneExt?.message}
                          {...register("homePhoneExt", {
                            maxLength: {
                              value: 15,
                              message: "Max 15 characters",
                            },
                            pattern: {
                              value: /^[0-9]*$/,
                              message: "Only numbers are allowed",
                            },
                          })}
                          size="2xs"
                        />
                      </HStack>
                      <HStack>
                        <CustomInput
                          placeholder={"Work Phone..."}
                          invalid={!!errors.workPhone}
                          showError={!!errors.workPhone}
                          errorMessage={errors.workPhone?.message}
                          {...register("workPhone", {
                            maxLength: {
                              value: 15,
                              message: "Max 15 characters",
                            },
                            pattern: {
                              value: /^[0-9]*$/,
                              message: "Only numbers are allowed",
                            },
                          })}
                          size="2xs"
                        />
                        <CustomInput
                          placeholder={"Ext..."}
                          invalid={!!errors.workPhoneExt}
                          showError={!!errors.workPhoneExt}
                          errorMessage={errors.workPhoneExt?.message}
                          {...register("workPhoneExt", {
                            maxLength: {
                              value: 15,
                              message: "Max 15 characters",
                            },
                            pattern: {
                              value: /^[0-9]*$/,
                              message: "Only numbers are allowed",
                            },
                          })}
                          size="2xs"
                        />
                      </HStack>
                      <HStack>
                        <CustomInput
                          placeholder={"Mobile Number..."}
                          invalid={!!errors.mobilePhone}
                          showError={!!errors.mobilePhone}
                          errorMessage={errors.mobilePhone?.message}
                          {...register("mobilePhone", {
                            required: "Mobile Number is required",
                            maxLength: {
                              value: 15,
                              message: "Max 15 characters",
                            },
                            pattern: {
                              value: /^[0-9]*$/,
                              message: "Only numbers are allowed",
                            },
                          })}
                          size="xs"
                        />
                        <CustomInput
                          placeholder={"Ext..."}
                          invalid={!!errors.mobilePhoneExt}
                          showError={!!errors.mobilePhoneExt}
                          errorMessage={errors.mobilePhoneExt?.message}
                          {...register("mobilePhoneExt", {
                            maxLength: {
                              value: 15,
                              message: "Max 15 characters",
                            },
                            pattern: {
                              value: /^[0-9]*$/,
                              message: "Only numbers are allowed",
                            },
                          })}
                          size="xs"
                        />
                      </HStack>

                      <Flex align="center" gap={2}>
                        <Controller
                          name="enableAutoReminders"
                          control={control}
                          render={({ field }) => (
                            <Checkbox.Root
                              size={{
                                base: "sm",
                              }}
                              checked={!!field.value}
                              onCheckedChange={({ checked }) =>
                                field.onChange(checked)
                              }
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control
                                _checked={{
                                  bgImage:
                                    "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                                }}
                                borderColor="#2f4d78"
                                bgColor={"black"}
                              />
                              <Checkbox.Label
                                color="droidalGray.400"
                                fontWeight={"light"}
                              >
                                Enable Auto Phone Call Reminders
                              </Checkbox.Label>
                            </Checkbox.Root>
                          )}
                        />
                      </Flex>
                    </VStack>
                    <GridItem colSpan={2}>
                      <SimpleGrid columns={{ base: 2, lg: 4 }} gap={2}>
                        <Controller
                          name="sendEmailNotifications"
                          control={control}
                          render={({ field }) => (
                            <Checkbox.Root
                              size={{
                                base: "sm",
                              }}
                              checked={!!field.value}
                              onCheckedChange={({ checked }) =>
                                field.onChange(checked)
                              }
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control
                                _checked={{
                                  bgImage:
                                    "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                                }}
                                borderColor="#2f4d78"
                                bgColor={"black"}
                              />
                              <Checkbox.Label
                                color="droidalGray.400"
                                fontWeight={"light"}
                              >
                                Send Email Notifications{" "}
                              </Checkbox.Label>
                            </Checkbox.Root>
                          )}
                        />

                        <CustomInput
                          size="xs"
                          placeholder="Emergency Name..."
                          invalid={!!errors.emergencyName}
                          showError={!!errors.emergencyName}
                          errorMessage={errors.emergencyName?.message}
                          {...register("emergencyName", {
                            pattern: {
                              value: /^[a-zA-Z\s]*$/,
                              message: "Only letters and spaces are allowed",
                            },
                          })}
                        />
                        <CustomInput
                          size="xs"
                          placeholder="Emergency Phone..."
                          invalid={!!errors.emergencyPhone}
                          showError={!!errors.emergencyPhone}
                          errorMessage={errors.emergencyPhone?.message}
                          {...register("emergencyPhone", {
                            maxLength: {
                              value: 15,
                              message: "Max 15 characters",
                            },
                            pattern: {
                              value: /^[0-9]*$/,
                              message: "Only numbers are allowed",
                            },
                          })}
                        />
                        <CustomInput
                          size="xs"
                          placeholder="Emergency Phone Ext..."
                          invalid={!!errors.emergencyPhoneExt}
                          showError={!!errors.emergencyPhoneExt}
                          errorMessage={errors.emergencyPhoneExt?.message}
                          {...register("emergencyPhoneExt", {
                            maxLength: {
                              value: 15,
                              message: "Max 15 characters",
                            },
                            pattern: {
                              value: /^[0-9]*$/,
                              message: "Only numbers are allowed",
                            },
                          })}
                        />
                      </SimpleGrid>
                    </GridItem>
                  </Grid>
                </Box>
                {/* Notes */}
                <Box>
                  <Flex align="center" gap={2} mb={2}>
                    <Text fontSize="sm" fontWeight="medium">
                      Notes
                    </Text>
                    <Separator borderColor="gray.600" />
                  </Flex>
                  {/* <Text fontSize="xs" mb={1} color="gray.400">
                    Add a New Note by Rajeshwaran Gunasekar on 12/5/2025 (Today)
                    8:16 AM
                  </Text> */}
                  <CustomTextArea minH="60px" {...register("notes")} />
                </Box>
                {/* Insurance */}
                <Box>
                  <Flex align="center" gap={2} my={2}>
                    <Text fontSize="lg" fontWeight="medium">
                      Insurance
                    </Text>
                    <Separator borderColor="gray.600" />
                  </Flex>
                  <Field.Root>
                    <Field.Label color="white" fontSize="sm" mb={0}>
                      Default Payer Scenario:
                    </Field.Label>
                    <Controller
                      name="defaultPayerScenario"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          options={payerScenarioOptions}
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          css={{
                            "& button": {
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                              color: "white !important",
                            },
                          }}
                          w="full"
                          size="xs"
                        />
                      )}
                    />
                  </Field.Root>

                  <SimpleGrid columns={{ base: 1, lg: 3 }} gap={2} mt={2}>
                    <CustomInput
                      label={
                        <>
                          Member ID{" "}
                          <Text as="span" color="red.500">
                            *
                          </Text>
                        </>
                      }
                      size="xs"
                      {...register("memberId", {
                        required: "Member ID is required",
                        pattern: {
                          value: /^[a-zA-Z0-9]+$/,
                          message: "Only Alphanumeric are allowed",
                        },
                      })}
                      labelProps={{
                        fontSize: "sm",
                      }}
                      invalid={!!errors.memberId?.message}
                      showError={!!errors.memberId?.message}
                      errorMessage={errors.memberId?.message}
                    />
                    <Controller
                      name="insurance_name"
                      control={control}
                      rules={{
                        required: "Insurance name is required",
                      }}
                      render={({ field }) => (
                        <PayerSearch
                          label={
                            <>
                              Insurance Name{" "}
                              <Text as="span" color="red.500">
                                *
                              </Text>
                            </>
                          }
                          size="xs"
                          value={field.value}
                          onChange={(payer) => {
                            field.onChange(payer);
                          }}
                          invalid={!!errors.insurance_name}
                          showError={!!errors.insurance_name}
                          errorMessage={errors.insurance_name?.message}
                          labelProps={{
                            fontSize: "sm",
                          }}
                        />
                      )}
                    />
                    <CustomInput
                      label="Service Type Code"
                      size="xs"
                      {...register("serviceTypeCode")}
                      labelProps={{
                        fontSize: "sm",
                      }}
                    />
                  </SimpleGrid>
                </Box>
              </VStack>
            </Grid>

            {/* Footer Buttons */}
            <HStack
              justify="flex-start"
              position={"absolute"}
              bottom={responsiblePartyDifferent ? "-40px" : "10px"}
              pt={4}
              gap={2}
            >
              <CustomButton
                type="submit"
                loading={isSubmitting || isPending || isUpdating}
                bg="white"
                color="black"
                border="1px solid gray"
              >
                Save
              </CustomButton>
              <CustomButton
                variant="outline"
                bg="white"
                color="black"
                border="1px solid gray"
              >
                Save & Add Policy
              </CustomButton>
              <CustomButton
                variant="outline"
                bg="white"
                color="black"
                border="1px solid gray"
              >
                Save & Add Case
              </CustomButton>
              <CustomButton
                variant="outline"
                onClick={() => {
                  reset();
                  navigate("/pms/home/patients");
                }}
                bg="white"
                color="black"
                border="1px solid gray"
              >
                Cancel
              </CustomButton>
            </HStack>

            {/* Contact Information */}

            {/* Providers */}

            {/* Responsible Party */}
          </Stack>
        </form>
      </VStack>
    </Box>
  );
};

export default PatientForm;

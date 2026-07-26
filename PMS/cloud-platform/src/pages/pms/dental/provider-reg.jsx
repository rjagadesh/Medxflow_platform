import React, { useEffect, useState } from "react";

import {
  Select,
  Box,
  Grid,
  Heading,
  Input,
  Button,
  Text,
  Checkbox,
  Flex,
  HStack,
  Image,
  Float,
  Textarea,
  GridItem,
  Avatar,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  PopoverArrow,
  // PopoverCloseButton,
  Portal,
  Dialog,
  CloseButton,
  createListCollection,
  VStack,
  Wrap,
  WrapItem,
  Accordion,
  Span,
} from "@chakra-ui/react";
import { FileUpload, useFileUploadContext } from "@chakra-ui/react";
import { LuFileImage, LuX } from "react-icons/lu";
import { useCreateProvider, useUpdateProvider } from "../utils/create-provider";

import { useNavigate, useParams } from "react-router-dom";
import ProviderHeader from "./Component/Provider-registration/ProviderHeader";
import ProfileSection from "./Component/Provider-registration/ProfileSection";
import BasicInfoFields from "./Component/Provider-registration/BasicInfoFields";
import AboutQualifications from "./Component/Provider-registration/AboutQualifications";
import { toaster } from "@/components/ui/toaster";
import WeeklyTimeRange from "./Component/Provider-registration/ScheduleSection";
import { useServiceLocationList } from "./getproviderlocations";
import { useGetProvidersById } from "@/hooks/query/pms/pms_appointments/useGetProviderById";
// import ProviderRegistrationAccordionItem from "./demo";

const FileUploadList = () => {
  const fileUpload = useFileUploadContext();
  const files = fileUpload.acceptedFiles;

  const SIZE = "180px"; // 🔑 control size here

  if (files.length > 0) {
    return (
      <FileUpload.ItemGroup>
        {files.map((file) => (
          <FileUpload.Item
            key={file.name}
            file={file}
            width={SIZE}
            height={SIZE}
            borderRadius="lg"
            overflow="hidden"
            p="0"
          >
            <FileUpload.ItemPreviewImage
              width={SIZE}
              height={SIZE}
              objectFit="cover"
            />

            <Float placement="top-end">
              <FileUpload.ItemDeleteTrigger boxSize="6">
                <LuX />
              </FileUpload.ItemDeleteTrigger>
            </Float>
          </FileUpload.Item>
        ))}
      </FileUpload.ItemGroup>
    );
  }

  return (
    <img
      src="/PersonPlaceholder.png"
      width={180}
      height={180}
      style={{
        borderRadius: "12px",
        objectFit: "contain",
      }}
      className="border border-gray-300"
    />
  );
};

const getErrorMessage = (err) => {
  const data = err?.response?.data;

  if (!data) return "Something went wrong.";

  if (typeof data === "string") return data;

  if (typeof data === "object") {
    return Object.values(data).flat().join(", ");
  }

  return "Please review the highlighted fields.";
};
const ProviderRegistration = () => {
  const navigate = useNavigate();
  const [profileResetSignal, setProfileResetSignal] = useState(0);

  const [profileFiles, setProfileFiles] = useState([]);
  const [profileUrl, setProfileUrl] = useState(null);
  const [qualifications, setQualifications] = useState("1. ");
  const [savedServices, setSavedServices] = useState([]);
  let { data, isLoading, isPlaceholderData } = useServiceLocationList();
  const DAYS = (data?.results || []).map(
    (item) => `${item.city}-${item.state}`,
  );

  const [selecteddays, setSelectedDays] = useState([]);

  const SERVICES = [
    "General Consultation",
    "Follow-up Visit",
    "Preventive Care",
    "Chronic Care Management",
    "Diagnostic Services",
    "Minor Procedures",
    "Wellness Counseling",
  ];
  const [providerType, setProviderType] = useState([]);

  const handleQualificationsKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();

      const lines = qualifications.split("\n");
      const nextNumber = lines.length + 1;

      setQualifications((prev) => `${prev}\n${nextNumber}. `);
    }
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    npi: "",
    taxonomy: "",
    practiceName: "",
    address: "",
    city: "",
    zipCode: "",
    email: "",
    // password: "",
    // confirmPassword: "",
    agreeToTerms: false,
    about: "",
    ranges: "",
    qualifications: "",
    service: "",
    state: "",
    country: "",
    week: {},
    taxid_ssn: "",
    taxid_ein: "",
    medicaid_id: "",
    medicare_ptan: "",
    provider_type: "",
    speaciality: "",
    subSpeaciality: "",
    medical_license_number: "",
    organization_name: "",
  });

  // const [open, setOpen] = useState(false);
  const [ranges, setRanges] = useState({});

  const handleQualificationsChange = (e) => {
    setQualifications(e.target.value);
  };

  const [specialty, setSpecialty] = useState("");
  const [subSpecialty, setSubSpecialty] = useState("");
  const { editId } = useParams();
  const [providesTelehealth, setProvidesTelehealth] = useState("False");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: providerData } = useGetProvidersById(editId ? editId : null);
  // const location = normalizeWeekRanges(providerData.week);
  const servicesArray =
    typeof providerData?.service === "string"
      ? providerData?.service
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean)
      : [];

  useEffect(() => {
    if (!providerData) return;

    setFormData({
      firstName: providerData?.first_name,
      lastName: providerData?.last_name,
      dateOfBirth: providerData?.date_of_birth,
      npi: providerData?.NPI,
      taxonomy: providerData?.taxonomy,
      practiceName: providerData.practice_name,
      address: providerData.address,
      city: providerData.city,
      zipCode: providerData.zipcode,
      email: providerData.email,
      // password: providerData.password,
      // confirmPassword: providerData.password,
      agreeToTerms: false,

      services: providerData.service,
      state: providerData.state,
      country: providerData.country,
      medicare_ptan: providerData.medicare_ptan,
      medicaid_id: providerData.medicaid_id,
      taxid_ein: providerData.taxid_ein,
      taxid_ssn: providerData.taxid_ssn,
      about: providerData.about,
      medical_license_number: providerData.medical_license_number,
      organization_name: providerData.organization_name,
    });

    const parsed =
      typeof providerData.week === "string"
        ? JSON.parse(providerData.week)
        : providerData.week;
    const locations = Object.keys(parsed || {});
    setSelectedDays(locations);

    const providerTypeList =
      typeof providerData.provider_type === "string"
        ? providerData.provider_type
            .split(",")
            .map((v) => v.trim())
            .filter(Boolean)
        : providerData.provider_type;
    setRanges(parsed);
    setQualifications(providerData?.qualification);
    setProviderType(providerTypeList);
    setSpecialty(providerData.specialty ?? "");
    setSubSpecialty(providerData.sub_specialty ?? "");
    setSavedServices(servicesArray);
    if (providerData?.profile_picture) {
      setProfileUrl(providerData?.profile_picture + "/");
      setProfileFiles([providerData?.profile_picture + "/"]);
    }

    // {
    //   providerData?.week && setRanges(location);
    // }

    setProvidesTelehealth(providerData.telehealth);
  }, [providerData]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };
  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date)?.toISOString();
  };

  const handleProfilePicUpload = (file) => {
    setProfileFiles([file]); // 👈 EXACTLY what submit expects
  };
  const { mutate: createProvider, isPending } = useCreateProvider();
  const { mutate: providerupdate, isupdatePending } = useUpdateProvider();

  const validateForm = () => {
    const newErrors = {};

    // REGEX DEFINITIONS
    const nameRegex = /^[A-Za-z\s-]+$/; // First & Last name (hyphen allowed)
    const alphaOnlyRegex = /^[A-Za-z\s]+$/; // No special chars at all
    const addressRegex = /^[A-Za-z0-9\s,.\-#/()]+$/;
    const zipRegex = /^\d{5}(-\d{4})?$/; // ZIP / ZIP+4
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const npiRegex = /^\d{10}$/;
    const einRegex = /^\d{2}-\d{7}$/;
    const ssnRegex = /^\d{3}-\d{2}-\d{4}$/;
    const taxonomyRegex = /^[A-Za-z0-9]+$/;
    const passRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    const medical_license_number = /^[A-Za-z0-9]{5,10}$/;

    const MAX_NAME_LENGTH = 50;

    const safeTrim = (value) => {
      if (value === null || value === undefined) return "";
      if (value instanceof Date) return value?.toISOString();
      if (typeof value === "string" && value.trim() === "1.") return "";

      return String(value).trim();
    };

    const hasEIN = !!safeTrim(formData.taxid_ein);
    const hasSSN = !!safeTrim(formData.taxid_ssn);
    // First
    if (!safeTrim(formData.firstName)) {
      newErrors.firstName = "First name is required";
    } else if (formData.firstName.length > MAX_NAME_LENGTH) {
      newErrors.firstName = "First name cannot exceed 50 characters";
    } else if (!nameRegex.test(safeTrim(formData.firstName))) {
      newErrors.firstName = "Only letters, spaces, and hyphen are allowed";
    }

    // Last Name
    if (!safeTrim(formData.lastName)) {
      newErrors.lastName = "Last name is required";
    } else if (formData.lastName.length > MAX_NAME_LENGTH) {
      newErrors.lastName = "Last name cannot exceed 50 characters";
    } else if (!nameRegex.test(safeTrim(formData.lastName))) {
      newErrors.lastName = "Only letters, spaces, and hyphen are allowed";
    }

    // Date of Birth (datetime-aware)
    if (!safeTrim(formData.dateOfBirth)) {
      newErrors.dateOfBirth = "Date of birth is required";
    } else {
      const dob = new Date(formData.dateOfBirth);

      // Invalid datetime check
      if (isNaN(dob.getTime())) {
        newErrors.dateOfBirth = "Invalid date of birth";
      } else {
        const today = new Date();

        // Normalize both to date-only (ignore time)
        dob.setHours(0, 0, 0, 0);
        today.setHours(0, 0, 0, 0);

        if (dob > today) {
          newErrors.dateOfBirth = "Date of birth cannot be a future date";
        }
      }
    }

    // NPI
    if (!safeTrim(formData.npi)) {
      newErrors.npi = "NPI is required";
    } else if (!npiRegex.test(formData.npi)) {
      newErrors.npi = "NPI must be exactly 10 digits";
    }

    // Taxonomy
    if (!safeTrim(formData.taxonomy)) {
      newErrors.taxonomy = "Taxonomy is required";
    } else if (!taxonomyRegex.test(formData.taxonomy)) {
      newErrors.taxonomy =
        "Only letters and numbers are allowed. No spaces or special characters.";
    } else if (formData.taxonomy.length != 10) {
      newErrors.taxonomy = "Taxonomy should be only  10 characters. ";
    }

    if (!hasEIN && !hasSSN) {
      newErrors.taxid_ein = "Either EIN or SSN is required";
      newErrors.taxid_ssn = "Either EIN or SSN is required";
    }

    /* ---------- EIN validation ---------- */
    if (hasEIN && !einRegex.test(formData.taxid_ein)) {
      newErrors.taxid_ein = "Invalid EIN format (12-3456789)";
    }

    /* ---------- SSN validation ---------- */
    if (hasSSN && !ssnRegex.test(formData.taxid_ssn)) {
      newErrors.taxid_ssn = "Invalid SSN format (123-45-6789)";
    }
    // Practice Name
    if (!safeTrim(formData.practiceName)) {
      newErrors.practiceName = "Practice name is required";
    } else if (formData.practiceName.length > MAX_NAME_LENGTH) {
      newErrors.practiceName = "Practice name cannot exceed 50 characters";
    } else if (!alphaOnlyRegex.test(formData.practiceName)) {
      newErrors.practiceName =
        "Only letters and spaces are allowed. No special characters.";
    }

    // Provider Type
    if (!providerType || providerType.length === 0) {
      newErrors.providerType = "Provider type is required";
    }

    // Specialty
    if (!safeTrim(specialty)) {
      newErrors.specialty = "Specialty is required";
    }

    // Address
    if (!safeTrim(formData.address)) {
      newErrors.address = "Address is required";
    } else if (!addressRegex.test(formData.address)) {
      newErrors.address =
        "Only letters and numbers are allowed. No special characters.";
    }

    // City
    if (!safeTrim(formData.city)) {
      newErrors.city = "City is required";
    } else if (!alphaOnlyRegex.test(formData.city)) {
      newErrors.city =
        "Only letters and spaces are allowed. No special characters.";
    }

    // State
    if (!safeTrim(formData.state)) {
      newErrors.state = "State is required";
    } else if (!alphaOnlyRegex.test(formData.state)) {
      newErrors.state =
        "Only letters and spaces are allowed. No special characters.";
    }

    // Country
    if (!safeTrim(formData.country)) {
      newErrors.country = "Country is required";
    } else if (!alphaOnlyRegex.test(formData.country)) {
      newErrors.country =
        "Only letters and spaces are allowed. No special characters.";
    }

    if (!safeTrim(formData.medical_license_number)) {
      newErrors.medical_license_number = "Medical License Number is required";
    } else if (
      formData.medical_license_number &&
      !medical_license_number.test(formData.medical_license_number)
    ) {
      newErrors.medical_license_number =
        "Medical license should be in this ABC12345 format";
    }
    // ZIP Code
    if (!safeTrim(formData.zipCode)) {
      newErrors.zipCode = "ZIP code is required";
    } else if (!zipRegex.test(formData.zipCode)) {
      newErrors.zipCode = "ZIP code must be 12345 or 12345-6789 format";
    }

    // Email

    // Only validate these fields when creating (not editing)
    if (!providerData) {
      // Email
      if (!safeTrim(formData.email)) {
        newErrors.email = "Email is required";
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = "Invalid email address";
      }

      // Organization Name
      if (!safeTrim(formData.organization_name)) {
        newErrors.organization_name = "Organization name is required";
      }

      // Password
      // if (!formData.password) {
      //   newErrors.password = "Password is required";
      // } else if (formData.password.length < 8) {
      //   newErrors.password = "Password must be at least 8 characters";
      // } else if (!passRegex.test(formData.password)) {
      //   newErrors.password =
      //     "Password must contain upper, lower case letters and a number";
      // }

      // Confirm Password
      // if (!formData.confirmPassword) {
      //   newErrors.confirmPassword = "Please confirm password";
      // } else if (formData.confirmPassword !== formData.password) {
      //   newErrors.confirmPassword = "Passwords do not match";
      // }
    }

    // Qualification
    if (!safeTrim(qualifications) && qualifications === "1. ") {
      newErrors.qualification = "Qualification is required";
    }

    // Services
    if (!savedServices || savedServices.length === 0) {
      newErrors.service = "At least one service is required";
    }

    // About
    if (!safeTrim(formData.about)) {
      newErrors.about = "About field is required";
    }

    // Week Availability
    if (!ranges || Object.keys(ranges).length === 0) {
      newErrors.week = "Weekly availability is required";
    } else {
      let hasEnabledDay = false;
      let hasInvalidTime = false;

      Object.entries(ranges).forEach(([location, days]) => {
        Object.entries(days || {}).forEach(([day, config]) => {
          if (config?.enabled) {
            hasEnabledDay = true;

            // ❗ NEW LOGIC FOR MULTI-RANGE
            if (
              !Array.isArray(config.ranges) ||
              config.ranges.length === 0 ||
              config.ranges.some((r) => !r?.start || !r?.end)
            ) {
              hasInvalidTime = true;
            }
          }
        });
      });

      if (!hasEnabledDay) {
        newErrors.week = "At least one day must be enabled";
      } else if (hasInvalidTime) {
        newErrors.week =
          "Please select at least one valid time range for all enabled days";
      }
    }

    setErrors(newErrors);

    return {
      isValid: Object.keys(newErrors).length === 0,
      errors: newErrors,
    };
  };

  const handleSubmit = () => {
    const { isValid, errors: validationErrors } = validateForm();

    if (!isValid) {
      //   toaster.error({
      //     title: "Please fix the following errors",
      //     description: "• " + Object.values(validationErrors).join("\n• "),

      //     duration: 4000,
      //     closable: true,
      //   });
      return;
    }

    const payload = {
      first_name: formData.firstName,
      last_name: formData.lastName,
      date_of_birth: formatDate(formData.dateOfBirth),

      // 🔴 FIXES HERE
      NPI: formData.npi,
      practice_name: formData.practiceName,
      provider_type: providerType.join(", "),
      specialty: specialty,
      sub_specialty: subSpecialty,
      medicare_ptan: formData.medicare_ptan,
      medicaid_id: formData.medicaid_id,
      taxid_ein: formData.taxid_ein,
      taxid_ssn: formData.taxid_ssn,
      telehealth: providesTelehealth,
      address: formData.address,
      city: formData.city,
      zipcode: formData.zipCode,
      email: formData.email,
      // password: formData.password,
      about: formData.about,
      week: JSON.stringify(ranges),
      qualification: qualifications.trim(),
      service: savedServices.join(", "),
      state: formData.state,
      country: formData.country,
      // confirm_password: formData.confirmPassword,
      taxonomy: formData.taxonomy,
      medical_license_number: formData.medical_license_number,
      organization_name: formData.organization_name,
    };

    let finalPayload = payload;

    const hasNewImage =
      Array.isArray(profileFiles) && profileFiles[0] instanceof File;

    if (hasNewImage && profileFiles[0] instanceof File) {
      const fd = new FormData();

      Object.entries(payload).forEach(([k, v]) => {
        if (v !== undefined && v !== null) {
          fd.append(k, v);
        }
      });

      fd.append("profile_picture", profileFiles[0]);

      if (editId) {
        fd.append("id", editId);
      }

      finalPayload = fd;
    } else if (typeof profileFiles[0] === "string") {
      /**
       * CASE 2: Existing image kept (URL string)
       */
      finalPayload = {
        ...payload,
        ...(editId && { id: editId }),
        // ❗ do NOT send profile_picture at all
      };
    } else {
      /**
       * CASE 3: Image removed explicitly
       */
      finalPayload = {
        ...payload,
        ...(editId && { id: editId }),
        profile_picture: null,
      };
    }

    try {
      if (editId) {
        providerupdate(finalPayload);
        toaster.success({
          title: "Form Submitted",
          description: "Provider data has been updated successfully.",
        });
      } else {
        createProvider(finalPayload, {
          onSuccess: (res) => {
            toaster.success({
              title: "Provider created successfully",
              description: res.message || "The provider has been registered.",
              status: "success",
              duration: 3000,
            });

            console.log("Provider created:", res.provider);
            // alert(res.message);

            // Reset form
            setFormData({
              firstName: "",
              lastName: "",
              dateOfBirth: "",
              npi: "",
              taxonomy: "",
              practiceName: "",
              address: "",
              city: "",
              zipCode: "",
              email: "",
              // password: "",
              // confirmPassword: "",
              agreeToTerms: false,

              services: "",
              state: "",
              country: "",
              medicare_ptan: "",
              medicaid_id: "",
              taxid_ein: "",
              taxid_ssn: "",
              about: "",
              medical_license_number: "",
              organization_name: "",
            });
            setSelectedDays([]);
            setQualifications("1. ");
            setProviderType([]);
            setSpecialty(null);
            setSubSpecialty(null);
            setSavedServices([]);
            setProfileResetSignal((v) => v + 1);
            setProfileFiles([]);
            setErrors({});
            setRanges({});
            setProfileUrl(null);
            setProvidesTelehealth("false");
            navigate("/pms/home/providers");
          },
          onError: (err) => {
            if (err.response?.data) {
              setErrors(err.response.data);
              toaster.error({
                title: "Submission failed",
                description: getErrorMessage(err),
                status: "error",
                duration: 4000,
              });
            } else {
              toaster.error({
                title: "Server error",
                description: "Something went wrong. Please try again.",
                status: "error",
                duration: 4000,
              });
            }
          },
        });
      }
    } catch (error) {
      console.log("error", error);
      toaster.error({
        title: "Submission Failed",
        description: "There was an error saving the patient data.",
      });
    }
  };

  return (
    <Box position={"relative"} p={8} bg="#0d2b52" borderRadius="lg">
      <ProviderHeader
        isPending={isPending}
        isSubmitting={isSubmitting}
        onBack={() => navigate("/pms/home/providers")}
        onSubmit={handleSubmit}
        editId={editId}
      />

      <ProfileSection
        imageUrl={profileUrl}
        errors={errors}
        resetSignal={profileResetSignal}
        handleProfilePicUpload={handleProfilePicUpload}
        providerType={providerType}
        setProviderType={setProviderType}
        specialty={specialty}
        setSpecialty={setSpecialty}
        subSpecialty={subSpecialty}
        setSubSpecialty={setSubSpecialty}
        savedServices={savedServices}
        setSavedServices={setSavedServices}
        providesTelehealth={providesTelehealth}
        setProvidesTelehealth={setProvidesTelehealth}
        SERVICES={SERVICES}
        DAYS={DAYS}
        selecteddays={selecteddays}
        setSelectedDays={setSelectedDays}
      />

      <BasicInfoFields
        formData={formData}
        errors={errors}
        handleInputChange={handleInputChange}
        providerData={providerData}
      />

      <AboutQualifications
        about={formData.about}
        qualifications={qualifications}
        errors={errors}
        onAboutChange={handleInputChange}
        onQualificationsChange={handleQualificationsChange}
        onQualificationsKeyDown={handleQualificationsKeyDown}
      />

      <WeeklyTimeRange
        ranges={ranges}
        setRanges={setRanges}
        selectedLocation={selecteddays}
        setSelectedDay={setSelectedDays}
        errors={errors}
      />
    </Box>
  );
};

export default ProviderRegistration;

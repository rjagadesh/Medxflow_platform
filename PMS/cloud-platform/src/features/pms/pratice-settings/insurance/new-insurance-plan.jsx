import React, { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  Button,
  Portal,
} from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react/dialog";
import CustomInput from "@/components/input/input";
import InsuranceCompaniesSearch from "./insurance-companies-search";
import CustomSelect from "@/components/ui/select";
import CustomTextArea from "@/components/textarea/textarea";
import CustomButton from "@/components/button/button";
import AddressModal from "./modals/AddressModal";
import NameModal from "./modals/NameModal";
import { Heading } from "@chakra-ui/react";
import { useCreateInsurancePlan } from "@/hooks/mutation/pms/insurance-plan/useCreateInsurancePlan";
import { toaster } from "@/components/ui/toaster";

const SCOPE_OPTIONS = [
  { value: "practice", label: "Practice Specific" },
  { value: "global", label: "Global" },
];

const NewInsurancePlan = () => {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const { mutate, isPending } = useCreateInsurancePlan();

  const {
    register,
    control,
    watch,
    setValue,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      insuranceCompany: "",
      insuranceCompanyId: "",
      planName: "",
      address: {
        street1: "",
        city: "",
        state: "",
        zip: "",
      },
      contactName: {
        prefix: "",
        firstName: "",
        middleName: "",
        lastName: "",
        suffix: "",
      },
      contactPhone: "",
      contactPhoneExt: "",
      contactFax: "",
      contactFaxExt: "",
      // scope: ["practice"],
      notes: "",
    },
  });

  const address = watch("address");
  const contactName = watch("contactName");

  const getFormattedAddress = () => {
    const { street1, street2, city, state, zip } = address || {};
    return `${street1 || ""}\n${street2 ? street2 + "\n" : ""}${city || ""}, ${
      state || ""
    } ${zip || ""}`;
  };

  const getFormattedName = () => {
    const { prefix, firstName, middleName, lastName, suffix } =
      contactName || {};
    return [prefix, firstName, middleName, lastName, suffix]
      .filter(Boolean)
      .join(" ");
  };

  const handleUpdateAddress = (newAddress) => {
    setValue("address", newAddress, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleUpdateName = (newName) => {
    setValue("contactName", newName, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleSelectInsurance = (company) => {
    setValue("insuranceCompany", company.name, {
      shouldDirty: true,
      shouldValidate: true,
    });
    setValue("insuranceCompanyId", company.id, { shouldDirty: true });
    setIsSearchModalOpen(false);
  };

  const onSubmit = (data) => {
    const payload = {
      insurance_company: data.insuranceCompanyId,
      plan_name: data.planName,
      address_street1: data.address?.street1,
      address_city: data.address?.city,
      address_state: data.address?.state,
      address_zip: data.address?.zip,
      contact_prefix: data.contactName?.prefix,
      contact_first_name: data.contactName?.firstName,
      contact_middle_name: data.contactName?.middleName,
      contact_last_name: data.contactName?.lastName,
      contact_suffix: data.contactName?.suffix,
      contact_phone: data.contactPhone,
      contact_phone_ext: data.contactPhoneExt,
      contact_fax: data.contactFax,
      contact_fax_ext: data.contactFaxExt,
      notes: data.notes,
    };

    mutate(payload, {
      onSuccess: () => {
        reset({
          insuranceCompany: "",
          planName: "",
          address: {
            street1: "",
            city: "",
            state: "",
            zip: "",
          },
          contactName: {
            prefix: "",
            firstName: "",
            middleName: "",
            lastName: "",
            suffix: "",
          },
          contactPhone: "",
          contactPhoneExt: "",
          contactFax: "",
          contactFaxExt: "",
          notes: "",
        });
        toaster.success({
          title: "Success",
          description: "Insurance plan created",
        });
        console.log("Insurance plan created successfully");
      },
      onError: (error) => {
        toaster.error({
          title: "Error",
          description:
            error.detail || error.message || "Failed to create insurance plan",
        });
        console.error("Error creating insurance plan:", error);
      },
    });
  };

  return (
    <Box h="full" w="full" bg="droidalBlack.300" color="white" p={4}>
      <Heading letterSpacing={"widest"}>New Insurance Plan</Heading>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Box overflowY="auto">
          {/* Top Section: Insurance Company & Plan Name */}
          <VStack align="stretch" gap={4} mb={6}>
            <HStack>
              <Button
                size="sm"
                variant="outline"
                color="white"
                borderColor="droidalGray.300"
                minW="160px"
                fontWeight="normal"
                justifyContent="space-between"
                _hover={{ bg: "whiteAlpha.100" }}
                onClick={() => setIsSearchModalOpen(true)}
              >
                Insurance Company
              </Button>
              <CustomInput
                {...register("insuranceCompany", {
                  required: "Insurance Company is required",
                })}
                placeholder="Click 'Insurance Company' button to search..."
                readOnly
                invalid={!!errors.insuranceCompany}
                showError={!!errors.insuranceCompany}
                errorMessage={errors.insuranceCompany?.message}
              />
            </HStack>
            <HStack>
              <Text
                minW="160px"
                fontSize="sm"
                fontWeight="light"
                letterSpacing="wider"
                pl={4} // Align with button text roughly
              >
                Plan Name:
              </Text>
              <VStack align="stretch" w="full" gap={0}>
                <CustomInput
                  {...register("planName", {
                    required: "Plan Name is required",
                    onChange: (e) => {
                      const value = e.target.value.replace(/[^a-zA-Z ]/g, "");
                      if (e.target.value !== value) {
                        e.target.value = value;
                        setValue("planName", value);
                      }
                    },
                  })}
                  helperText="(Examples: PPO 140, POS Saver, HMO Plan, etc.)"
                  invalid={!!errors.planName}
                  showError={!!errors.planName}
                  errorMessage={errors.planName?.message}
                />
              </VStack>
            </HStack>
          </VStack>

          {/* Middle Section: Address & Contact */}
          <SimpleGrid columns={2} gap={8} mb={6}>
            {/* Address Column */}
            <VStack align="stretch" gap={2}>
              <input
                type="hidden"
                {...register("address.street1", { required: true })}
              />
              <input
                type="hidden"
                {...register("address.city", { required: true })}
              />
              <input
                type="hidden"
                {...register("address.state", { required: true })}
              />
              <input
                type="hidden"
                {...register("address.zip", { required: true })}
              />
              <Text
                fontSize="sm"
                borderBottom="1px solid"
                borderColor="droidalGray.300"
                mb={2}
              >
                Send Claims to this Address
              </Text>
              <HStack align="start">
                <Button
                  size="sm"
                  variant="outline"
                  w="120px"
                  color="white"
                  borderColor="droidalGray.300"
                  fontWeight="normal"
                  onClick={() => setIsAddressModalOpen(true)}
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  Address
                </Button>
                <Box
                  border="1px solid"
                  borderColor={errors.address ? "red.500" : "droidalGray.300"}
                  h="100px"
                  w="full"
                  p={2}
                  fontSize="sm"
                  whiteSpace="pre-wrap"
                  bg="transparent"
                >
                  {getFormattedAddress()}
                </Box>
              </HStack>
              {errors.address && (
                <Text color="red.500" fontSize="xs">
                  Address details are required
                </Text>
              )}
            </VStack>

            {/* Contact Column */}
            <VStack align="stretch" gap={2}>
              <input
                type="hidden"
                {...register("contactName.firstName", { required: true })}
              />
              <input
                type="hidden"
                {...register("contactName.lastName", { required: true })}
              />
              <Text
                fontSize="sm"
                borderBottom="1px solid"
                borderColor="droidalGray.300"
                mb={2}
              >
                Contact for Questions about Claims or Coverage
              </Text>
              <HStack>
                <Button
                  size="sm"
                  variant="outline"
                  w="100px"
                  color="white"
                  borderColor="droidalGray.300"
                  fontWeight="normal"
                  onClick={() => setIsNameModalOpen(true)}
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  Full Name
                </Button>
                <CustomInput
                  value={getFormattedName()}
                  readOnly
                  h="32px"
                  borderColor={
                    errors.contactName ? "red.500" : "droidalGray.300"
                  }
                />
              </HStack>
              {(errors.contactName?.firstName ||
                errors.contactName?.lastName) && (
                <Text color="red.500" fontSize="xs">
                  Contact Name is required
                </Text>
              )}

              <HStack>
                <Text minW="100px" fontSize="sm" fontWeight="light">
                  Phone:
                </Text>
                <CustomInput
                  {...register("contactPhone", {
                    required: "Phone is required",
                    onChange: (e) => {
                      const value = e.target.value
                        .replace(/[^0-9]/g, "")
                        .slice(0, 15);
                      if (e.target.value !== value) {
                        e.target.value = value;
                        setValue("contactPhone", value);
                      }
                    },
                  })}
                  h="32px"
                  borderColor="droidalGray.300"
                  invalid={!!errors.contactPhone}
                  showError={!!errors.contactPhone}
                  errorMessage={errors.contactPhone?.message}
                />
                <Text fontSize="sm" fontWeight="light">
                  Ext:
                </Text>
                <CustomInput
                  {...register("contactPhoneExt")}
                  h="32px"
                  w="80px"
                  borderColor="droidalGray.300"
                />
              </HStack>

              <HStack>
                <Text minW="100px" fontSize="sm" fontWeight="light">
                  Fax:
                </Text>
                <CustomInput
                  {...register("contactFax", { required: "Fax is required" })}
                  h="32px"
                  borderColor="droidalGray.300"
                  invalid={!!errors.contactFax}
                  showError={!!errors.contactFax}
                  errorMessage={errors.contactFax?.message}
                />
                <Text fontSize="sm" fontWeight="light">
                  Ext:
                </Text>
                <CustomInput
                  {...register("contactFaxExt")}
                  h="32px"
                  w="80px"
                  borderColor="droidalGray.300"
                />
              </HStack>
            </VStack>
          </SimpleGrid>

          <HStack gap={8}>
            {/* Notes Section */}
            <VStack align="stretch" gap={2} mb={4} flex="1">
              <Text
                fontSize="sm"
                borderBottom="1px solid"
                borderColor="droidalGray.300"
              >
                Notes
              </Text>
              <CustomTextArea
                {...register("notes")}
                h="full"
                minH="150px"
                resize="none"
              />
            </VStack>
            {/* Administration Section */}
            <VStack align="stretch" gap={4} mb={6} flex={1}>
              <Text
                fontSize="sm"
                borderBottom="1px solid"
                borderColor="droidalGray.300"
                mb={0}
              >
                List Administration (TBD)
              </Text>
              <HStack>
                <Text minW="160px" fontSize="sm" fontWeight="light">
                  Scope:
                </Text>
                <Box w="300px">
                  <Controller
                    control={control}
                    name="scope"
                    render={({ field }) => (
                      <CustomSelect
                        options={SCOPE_OPTIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                        w="full"
                        size="sm"
                      />
                    )}
                  />
                </Box>
              </HStack>
              <HStack>
                <Text minW="160px" fontSize="sm" fontWeight="light">
                  Created By:
                </Text>
                {/* Assuming N/A or empty for new plan */}
              </HStack>
            </VStack>
          </HStack>
        </Box>
        <HStack justify={"flex-end"} pt={4} gap={4}>
          <CustomButton variant="outline" w="100px">
            Cancel
          </CustomButton>
          <CustomButton type="submit" w="100px" isLoading={isPending}>
            Save
          </CustomButton>
        </HStack>

        {/* Footer Buttons */}
      </form>

      <AddressModal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        address={address}
        onSave={handleUpdateAddress}
      />

      <NameModal
        isOpen={isNameModalOpen}
        onClose={() => setIsNameModalOpen(false)}
        name={contactName}
        onSave={handleUpdateName}
      />

      <Dialog.Root
        placement="center"
        open={isSearchModalOpen}
        onOpenChange={(e) => !e.open && setIsSearchModalOpen(false)}
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
                <InsuranceCompaniesSearch onSelect={handleSelectInsurance} />
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
};

export default NewInsurancePlan;

import React, { useState } from "react";
import { Controller } from "react-hook-form";
import {
  Box,
  Text,
  VStack,
  HStack,
  SimpleGrid,
  GridItem,
  Button,
} from "@chakra-ui/react";
import { Checkbox } from "@chakra-ui/react";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import CustomTextArea from "@/components/textarea/textarea";
import AddressModal from "../modals/AddressModal";
import NameModal from "../modals/NameModal";

// Mock Data
const INSURANCE_PROGRAM_OPTIONS = [
  { value: "CI", label: "CI - Commercial Insurance Co." },
  { value: "MC", label: "MC - Medicare" },
];

const DEFAULT_ADJUSTMENT_OPTIONS = [
  { value: "none", label: "None" },
  { value: "writeoff", label: "Write Off" },
];

const SCOPE_OPTIONS = [
  { value: "practice", label: "Practice Specific" },
  { value: "global", label: "Global" },
];

const GeneralTab = ({ register, control, watch, setValue }) => {
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isNameModalOpen, setIsNameModalOpen] = useState(false);

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
    setValue("address", newAddress, { shouldDirty: true });
  };

  const handleUpdateName = (newName) => {
    setValue("contactName", newName, { shouldDirty: true });
  };

  return (
    <>
      <SimpleGrid columns={2} gap={8}>
        {/* Left Column */}
        <VStack align="stretch" gap={4}>
          <HStack align="center">
            <Text
              letterSpacing={"wider"}
              fontWeight={"light"}
              minW="80px"
              fontSize="sm"
            >
              Name:
            </Text>
            <CustomInput {...register("name")} h="30px" />
          </HStack>

          <HStack align="start">
            <Button
              size="xs"
              variant="subtle"
              w="100px"
              bgColor={"transparent"}
              _hover={{
                bgColor: "droidalGray.400",
              }}
              color={"white"}
              borderColor="droidalGray.300"
              onClick={() => setIsAddressModalOpen(true)}
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
              whiteSpace="pre-wrap"
            >
              {getFormattedAddress()}
            </Box>
          </HStack>

          <Box mt={4}>
            <Text
              fontSize="sm"
              mb={2}
              borderBottom="1px solid"
              letterSpacing={"wider"}
              fontWeight={"light"}
              borderColor={"droidalGray.300"}
            >
              Claim Processing
            </Text>
            <GridItem mb={2}>
              <HStack>
                <Text
                  letterSpacing={"wider"}
                  fontWeight={"light"}
                  fontSize="sm"
                  minW="130px"
                >
                  Insurance Program:
                </Text>
                <Box w="full">
                  <Controller
                    control={control}
                    name="insuranceProgram"
                    render={({ field }) => (
                      <CustomSelect
                        options={INSURANCE_PROGRAM_OPTIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder="Select Program"
                        w="full"
                        size="sm"
                      />
                    )}
                  />
                </Box>
              </HStack>
            </GridItem>
            <GridItem mb={2}>
              <HStack>
                <Text
                  letterSpacing={"wider"}
                  fontWeight={"light"}
                  fontSize="sm"
                  minW="130px"
                >
                  Default Adjustment:
                </Text>
                <Box w="full">
                  <Controller
                    control={control}
                    name="defaultAdjustment"
                    render={({ field }) => (
                      <CustomSelect
                        options={DEFAULT_ADJUSTMENT_OPTIONS}
                        value={field.value}
                        onValueChange={field.onChange}
                        placeholder=""
                        w="full"
                        size="sm"
                      />
                    )}
                  />
                </Box>
              </HStack>
            </GridItem>
            <HStack mt={2} justify="flex-start" pl="130px">
              <Controller
                control={control}
                name="autoBillSecondary"
                render={({ field }) => (
                  <Checkbox.Root
                    checked={field.value}
                    onCheckedChange={(e) => field.onChange(!!e.checked)}
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
                    <Checkbox.Label fontSize="sm">
                      Automatically bills secondary insurance
                    </Checkbox.Label>
                  </Checkbox.Root>
                )}
              />
            </HStack>
          </Box>
        </VStack>

        {/* Right Column */}
        <VStack align="stretch" gap={4}>
          <Box>
            <Text
              fontSize="sm"
              mb={2}
              borderBottom="1px solid"
              borderColor="droidalGray.300"
            >
              Contact
            </Text>
            <HStack mb={2}>
              <Button
                size="xs"
                variant="subtle"
                bgColor={"transparent"}
                _hover={{
                  bgColor: "droidalGray.400",
                }}
                color={"white"}
                borderColor="droidalGray.300"
                w="120px"
                onClick={() => setIsNameModalOpen(true)}
              >
                Full Name
              </Button>
              <CustomInput
                value={getFormattedName()}
                readOnly
                h="30px"
                borderColor="droidalGray.300"
              />
            </HStack>
            <HStack mb={2}>
              <Text
                letterSpacing={"wider"}
                fontWeight={"light"}
                fontSize="sm"
                minW="80px"
              >
                Phone:
              </Text>
              <CustomInput
                {...register("contactPhone")}
                h="30px"
                borderColor="droidalGray.300"
              />
              <Text letterSpacing={"wider"} fontWeight={"light"} fontSize="sm">
                Ext:
              </Text>
              <CustomInput
                {...register("contactPhoneExt")}
                h="30px"
                w="80px"
                borderColor="droidalGray.300"
              />
            </HStack>
            <HStack mb={2}>
              <Text
                letterSpacing={"wider"}
                fontWeight={"light"}
                fontSize="sm"
                minW="80px"
              >
                Fax:
              </Text>
              <CustomInput
                {...register("contactFax")}
                h="30px"
                borderColor="droidalGray.300"
              />
              <Text letterSpacing={"wider"} fontWeight={"light"} fontSize="sm">
                Ext:
              </Text>
              <CustomInput
                {...register("contactFaxExt")}
                h="30px"
                w="80px"
                borderColor="droidalGray.300"
              />
            </HStack>
          </Box>

          <Box mt={4}>
            <Text
              fontSize="sm"
              mb={2}
              borderColor="droidalGray.300"
              borderBottom="1px solid"
            >
              List Administration
            </Text>
            <HStack mb={2}>
              <Text
                letterSpacing={"wider"}
                fontWeight={"light"}
                fontSize="sm"
                minW="80px"
              >
                Scope:
              </Text>
              <Box w="full">
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
              <Text
                letterSpacing={"wider"}
                fontWeight={"light"}
                fontSize="sm"
                minW="80px"
              >
                Added By:
              </Text>
              <Text letterSpacing={"wider"} fontWeight={"light"}>
                {/* Healing Place (17) */}
                N/A
              </Text>
            </HStack>
          </Box>
        </VStack>
      </SimpleGrid>

      <Box mt={4}>
        <Text
          fontSize="sm"
          mb={2}
          borderBottom="1px solid"
          borderColor={"droidalGray.300"}
        >
          Notes
        </Text>
        <CustomTextArea {...register("notes")} />
      </Box>

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
    </>
  );
};

export default GeneralTab;

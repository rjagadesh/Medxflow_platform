import React from "react";
import { Controller } from "react-hook-form";
import { Box, Text, VStack, HStack } from "@chakra-ui/react";
import { Checkbox } from "@chakra-ui/react";
import CustomSelect from "@/components/ui/select";

const INSURED_FORMAT_OPTIONS = [{ value: "default", label: "Default" }];
const CMS_1500_FIELD_24G_OPTIONS = [{ value: "units", label: "Units" }];
const BILLING_FORM_OPTIONS = [
  { value: "cms1500_0212", label: "CMS 1500 Form - Version 02/12 - CMS" },
];
const INSTITUTIONAL_BILLING_FORM_OPTIONS = [
  { value: "ub04", label: "UB-04 Form" },
];

const PaperClaimsTab = ({ control }) => {
  return (
    <VStack align="stretch" gap={6}>
      {/* Professional Claim Format Settings */}
      <Box>
        <Text
          fontSize="sm"
          mb={4}
          borderBottom="1px solid"
          borderColor="droidalGray.300"
          letterSpacing={"wider"}
          fontWeight={"light"}
        >
          Professional Claim Format Settings
        </Text>
        <VStack align="stretch" gap={4} pl={2}>
          <HStack>
            <Text
              letterSpacing={"wider"}
              fontWeight={"light"}
              fontSize="sm"
              minW="200px"
            >
              Insured Format:
            </Text>
            <Box w="300px">
              <Controller
                control={control}
                name="paperClaims.insuredFormat"
                render={({ field }) => (
                  <CustomSelect
                    options={INSURED_FORMAT_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    w="full"
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
              minW="200px"
            >
              CMS-1500 field 24g:
            </Text>
            <Box w="300px">
              <Controller
                control={control}
                name="paperClaims.cms1500Field24g"
                render={({ field }) => (
                  <CustomSelect
                    options={CMS_1500_FIELD_24G_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    w="full"
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
              minW="200px"
            >
              CMS-1500 field 32b:
            </Text>
            <Controller
              control={control}
              name="paperClaims.cms1500Field32b"
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
                  <Checkbox.Label fontSize="sm" color="droidalGray.400">
                    Use Facility ID
                  </Checkbox.Label>
                </Checkbox.Root>
              )}
            />
          </HStack>

          <HStack>
            <Text
              letterSpacing={"wider"}
              fontWeight={"light"}
              fontSize="sm"
              minW="200px"
            >
              Primary Billing Form:
            </Text>
            <Box w="300px">
              <Controller
                control={control}
                name="paperClaims.primaryBillingForm"
                render={({ field }) => (
                  <CustomSelect
                    options={BILLING_FORM_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    w="full"
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
              minW="200px"
            >
              Secondary Billing Form:
            </Text>
            <Box w="300px">
              <Controller
                control={control}
                name="paperClaims.secondaryBillingForm"
                render={({ field }) => (
                  <CustomSelect
                    options={BILLING_FORM_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    w="full"
                  />
                )}
              />
            </Box>
          </HStack>
        </VStack>
      </Box>

      {/* Institutional Claim Format Settings */}
      <Box>
        <Text
          fontSize="sm"
          mb={4}
          borderBottom="1px solid"
          borderColor="droidalGray.300"
          letterSpacing={"wider"}
          fontWeight={"light"}
        >
          Institutional Claim Format Settings
        </Text>
        <VStack align="stretch" gap={4} pl={2}>
          <HStack>
            <Text
              letterSpacing={"wider"}
              fontWeight={"light"}
              fontSize="sm"
              minW="200px"
            >
              Primary Billing Form:
            </Text>
            <Box w="300px">
              <Controller
                control={control}
                name="paperClaims.institutionalPrimaryBillingForm"
                render={({ field }) => (
                  <CustomSelect
                    options={INSTITUTIONAL_BILLING_FORM_OPTIONS}
                    value={field.value}
                    onValueChange={field.onChange}
                    w="full"
                  />
                )}
              />
            </Box>
          </HStack>
        </VStack>
      </Box>
    </VStack>
  );
};

export default PaperClaimsTab;

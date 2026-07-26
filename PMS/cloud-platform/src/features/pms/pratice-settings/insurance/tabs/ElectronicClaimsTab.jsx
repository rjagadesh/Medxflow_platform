import React from "react";
import { Controller } from "react-hook-form";
import { Box, Flex, Text, VStack, HStack, Button } from "@chakra-ui/react";
import { Checkbox } from "@chakra-ui/react";
import { X } from "lucide-react";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import GenericTable from "@/components/table/table";

const CLEARINGHOUSE_OPTIONS = [
  { value: "gateway_edi", label: "Gateway EDI" },
  { value: "trizetto", label: "TriZetto" },
];

const ENROLLMENT_STATUS_DATA = [
  {
    id: 1,
    practiceName: "A Place for Healing",
    status: "Practice not enrolled",
  },
  { id: 2, practiceName: "Healing Corner", status: "Enrolled (live)" },
];

const ENROLLMENT_STATUS_COLUMNS = [
  { title: "Practice Name", accessor_key: "practiceName" },
  { title: "Status", accessor_key: "status" },
];

const ElectronicClaimsTab = ({ control, watch, setValue }) => {
  const electronicClaims = watch("electronicClaims");

  return (
    <VStack align="stretch" height={"full"} gap={6}>
      <HStack>
        <Controller
          control={control}
          name="electronicClaims.acceptsElectronicClaims"
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
                This payer accepts electronic claims
              </Checkbox.Label>
            </Checkbox.Root>
          )}
        />
      </HStack>

      <Box>
        <Text
          fontSize="sm"
          mb={2}
          borderBottom="1px solid"
          borderColor="droidalGray.300"
          letterSpacing={"wider"}
          fontWeight={"light"}
        >
          Electronic Payer Connection
        </Text>
        <Text fontSize="xs" mb={4} color="droidalGray.400">
          Select the clearinghouse you use, then select an electronic payer
          connection.
        </Text>

        <Flex gap={8}>
          <VStack align="stretch" gap={3} flex={1}>
            <HStack>
              <Text
                fontSize="sm"
                minW="180px"
                letterSpacing={"wider"}
                fontWeight={"light"}
              >
                Clearinghouse:
              </Text>
              <Box w="full">
                <Controller
                  control={control}
                  name="electronicClaims.clearinghouse"
                  render={({ field }) => (
                    <CustomSelect
                      options={CLEARINGHOUSE_OPTIONS}
                      value={field.value}
                      onValueChange={field.onChange}
                      w="full"
                    />
                  )}
                />
              </Box>
            </HStack>

            <HStack>
              <Button
                size="xs"
                variant="outline"
                minW="180px"
                justifyContent="flex-start"
                borderColor="gray.300"
                bg="white"
                fontWeight="normal"
                fontSize="sm"
              >
                Electronic Payer Connection...
              </Button>
              <Flex w="full" position="relative" align="center">
                <CustomInput
                  value={electronicClaims?.electronicPayerConnection || ""}
                  readOnly
                  h="30px"
                />
                {electronicClaims?.electronicPayerConnection && (
                  <Box
                    position="absolute"
                    right={2}
                    cursor="pointer"
                    onClick={() =>
                      setValue(
                        "electronicClaims.electronicPayerConnection",
                        "",
                        { shouldDirty: true }
                      )
                    }
                  >
                    <X size={14} color="gray" />
                  </Box>
                )}
              </Flex>
            </HStack>

            <HStack>
              <Text
                fontSize="sm"
                minW="180px"
                letterSpacing={"wider"}
                fontWeight={"light"}
              >
                Clearinghouse Payer ID:
              </Text>
              <Text fontSize="sm" fontWeight="semibold">
                {electronicClaims?.clearinghousePayerID}
              </Text>
            </HStack>
          </VStack>

          <VStack align="start" gap={2} flex={1} pt={1}>
            <Controller
              control={control}
              name="electronicClaims.requiresAuth"
              render={({ field }) => (
                <Checkbox.Root checked={field.value} disabled>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control
                    border="1px solid gray"
                    bg="gray.100"
                    mr={2}
                  />
                  <Checkbox.Label fontSize="sm" color="droidalGray.400">
                    Requires authorization or enrollment
                  </Checkbox.Label>
                </Checkbox.Root>
              )}
            />
            <Controller
              control={control}
              name="electronicClaims.supportsEligibility"
              render={({ field }) => (
                <Checkbox.Root checked={field.value} disabled>
                  <Checkbox.HiddenInput />
                  <Checkbox.Control
                    border="1px solid gray"
                    bg="gray.100"
                    mr={2}
                  />
                  <Checkbox.Label fontSize="sm" color="droidalGray.400">
                    Supports patient eligibility requests
                  </Checkbox.Label>
                </Checkbox.Root>
              )}
            />
          </VStack>
        </Flex>
      </Box>

      <Box>
        <Text
          fontSize="sm"
          mb={4}
          borderBottom="1px solid"
          borderColor="droidalGray.300"
          letterSpacing={"wider"}
          fontWeight={"light"}
        >
          Enrollment Status by Practice
        </Text>
        <Box h="200px">
          <GenericTable
            columns={ENROLLMENT_STATUS_COLUMNS}
            data={ENROLLMENT_STATUS_DATA}
            count={ENROLLMENT_STATUS_DATA.length}
            pagination={true}
            selection={{ selectable: false }}
            bodyHeight="300px"
          />
        </Box>
      </Box>
    </VStack>
  );
};

export default ElectronicClaimsTab;

import React from "react";
import { Controller } from "react-hook-form";
import { Box, Text, VStack, HStack } from "@chakra-ui/react";
import { Checkbox } from "@chakra-ui/react";
import CustomSelect from "@/components/ui/select";
import CustomDatePicker from "@/components/date-picker/single-datepicker";

const PRACTICE_ENROLLMENT_STATUS_OPTIONS = [
  { value: "enrolled_live", label: "Enrolled in live mode" },
  { value: "enrolled_test", label: "Enrolled in test mode" },
  { value: "not_enrolled", label: "Not enrolled" },
];

const PracticeSettingsTab = ({ control }) => {
  return (
    <VStack align="stretch" gap={6}>
      <Box>
        <Text fontSize="sm" mb={4} color="droidalGray.400">
          These settings apply to the currently opened practice:
        </Text>
        <HStack mb={4}>
          <Text
            letterSpacing={"wider"}
            fontWeight={"light"}
            fontSize="sm"
            minW="130px"
          >
            Enrollment Status:
          </Text>
          <Box w="300px">
            <Controller
              control={control}
              name="practiceSettings.enrollmentStatus"
              render={({ field }) => (
                <CustomSelect
                  options={PRACTICE_ENROLLMENT_STATUS_OPTIONS}
                  value={field.value}
                  onValueChange={field.onChange}
                  w="full"
                />
              )}
            />
          </Box>
        </HStack>

        <VStack align="start" gap={2} pl="130px">
          <Controller
            control={control}
            name="practiceSettings.disableElectronicClaims"
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
                  Disable electronic claims for this payer
                </Checkbox.Label>
              </Checkbox.Root>
            )}
          />

          <Controller
            control={control}
            name="practiceSettings.useElectronicBillingSecondary"
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
                  Use electronic billing when this payer is secondary
                </Checkbox.Label>
              </Checkbox.Root>
            )}
          />

          <Controller
            control={control}
            name="practiceSettings.sendCOB"
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
                  Send Coordination of Benefits (COB) information
                </Checkbox.Label>
              </Checkbox.Root>
            )}
          />

          <Controller
            control={control}
            name="practiceSettings.acceptsAssignment"
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
                  Provider accepts assignment of benefits
                </Checkbox.Label>
              </Checkbox.Root>
            )}
          />

          <Controller
            control={control}
            name="practiceSettings.excludePatientPayments"
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
                  Exclude patient payments from claims sent to insurance
                </Checkbox.Label>
              </Checkbox.Root>
            )}
          />

          <Controller
            control={control}
            name="practiceSettings.allowZeroBalanceTransfers"
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
                  Allow zero balance transfers on claims
                </Checkbox.Label>
              </Checkbox.Root>
            )}
          />
        </VStack>
      </Box>

      <Box mt={8}>
        <HStack mb={2}>
          <Text
            letterSpacing={"wider"}
            fontWeight={"light"}
            fontSize="sm"
            minW="130px"
          >
            ICD-10 Date:
          </Text>
          <Box w="150px">
            <Controller
              control={control}
              name="practiceSettings.icd10Date"
              render={({ field }) => (
                <CustomDatePicker
                  value={field.value}
                  onValueChange={field.onChange}
                  inputProps={{
                    h: "30px",
                    borderColor: "droidalGray.300",
                  }}
                />
              )}
            />
          </Box>
        </HStack>
        <Text fontSize="xs" color="droidalGray.400" ml="130px" maxW="500px">
          Claims with a date of service on or after this date will require
          ICD-10 diagnosis codes. Please note that for electronic connections,
          this date will automatically be set and cannot be edited.
        </Text>
      </Box>
    </VStack>
  );
};

export default PracticeSettingsTab;

import React from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Image,
  Badge,
  IconButton,
  Separator,
  Grid,
} from "@chakra-ui/react";
import {
  CornerUpLeft,
  Trash2,
  Printer,
  Share2,
  Paperclip,
  ChevronDown,
} from "lucide-react";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import CustomTextArea from "@/components/textarea/textarea";
import { Link, useParams } from "react-router-dom";
import { useGetPatientById } from "@/hooks/query/pms/pms_appointments/useGetPatientById";
import { useUpdateLabOrder } from "@/hooks/mutation/pms/lab-orders/useUpdateLabOrder";
import { toaster } from "@/components/ui/toaster";
import { format } from "date-fns";

// Mock Data
const LAB_META_DATA = {
  enteredBy: "Diana Hudson",
  enteredDate: "12/12/2025",
  performedBy: "Diana Hudson",
  performedDate: "12/12/2025",
  icdCodes: "R05",
};

const LAB_DATA = {
  title: "Comprehensive Metabolic Panel (CMP)",
  status: "NEEDS RESULTS",
  requestedDate: "12/12/2025 2:59pm",
};

const COMPONENT_OPTIONS = [
  { label: "Glucose", value: "glucose" },
  { label: "Calcium", value: "calcium" },
  { label: "Sodium", value: "sodium" },
  { label: "Potassium", value: "potassium" },
];

const RANGE_OPTIONS = [
  { label: "Normal", value: "normal" },
  { label: "High", value: "high" },
  { label: "Low", value: "low" },
];

const ViewEditLabs = ({ orderId: orderIdProp } = {}) => {
  const { patient_id, order_id } = useParams();
  const orderId = orderIdProp || order_id;
  const { data: patient } = useGetPatientById(patient_id);

  const { mutate: updateLabOrder, isPending: isSaving } = useUpdateLabOrder();

  const { control, register, watch, handleSubmit } = useForm({
    defaultValues: {
      staffNotes: "",
      internalComments: "",
      patientComments: "",
      results: [
        { component: null, value: "", range: null, comments: "" }, // Initial empty row
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "results",
  });

  const patientComments = watch("patientComments", "");
  const REMAINING_CHARS = 4000 - (patientComments?.length || 0);

  const onSubmit = (data) => {
    if (!orderId) {
      // This screen is not yet reached with a lab-order id in the route, and
      // the per-component result rows have no backend model yet, so there is
      // nothing to persist. Surface an honest message instead of a fake toast.
      // TODO: route here as /pms/.../lab-orders/:order_id and add a
      // LabResult model to persist the result rows below.
      toaster.error({
        title: "Cannot save",
        description: "No lab order is associated with this screen yet.",
      });
      return;
    }
    // Persist the order-level fields that the backend supports today.
    updateLabOrder(
      {
        id: orderId,
        patient: patient_id,
        notes: data.staffNotes,
        status: "completed",
      },
      {
        onSuccess: () => {
          toaster.success({
            title: "Saved",
            description: "Lab order has been updated successfully",
          });
        },
        onError: (error) => {
          toaster.error({
            title: "Error",
            description: error?.detail || "Failed to save the lab order",
          });
        },
      }
    );
  };

  return (
    <Box bg="droidalBlack.300" minH="100vh" p={4} color="white">
      {/* Header / Breadcrumb */}
      <HStack mb={4} gap={2} align="center">
        <Link to="/pms/encounter-notes">
          <HStack
            color="droidalGray.400"
            _hover={{ color: "white" }}
            cursor="pointer"
            gap={1}
          >
            <CornerUpLeft size={16} />
            <Text fontSize="sm" fontWeight="medium">
              Lab List
            </Text>
          </HStack>
        </Link>
        <Text fontSize="lg" fontWeight="semibold" ml={2}>
          {LAB_DATA.title}
        </Text>
      </HStack>

      {/* Main Content Card */}
      <Box bg="#1A1A1A" borderRadius="lg" p={6} border="1px solid #333">
        {/* Patient Info Section */}
        <Flex
          direction={{ base: "column", md: "row" }}
          gap={6}
          align="start"
          mb={6}
        >
          <Image
            src={patient?.profile_picture}
            alt="Patient Avatar"
            boxSize="60px"
            borderRadius="full"
            fallbackSrc="https://via.placeholder.com/60"
          />
          <VStack align="start" gap={1} flex={1}>
            <HStack gap={4} align="baseline">
              <Text fontSize="lg" fontWeight="bold">
                {patient?.full_name}
              </Text>
              <Text fontSize="sm" color="droidalGray.400">
                {patient?.age} y/o {patient?.gender} (
                {patient?.dob
                  ? format(new Date(patient.dob), "MM/dd/yyyy")
                  : ""}
                )
              </Text>
              <HStack gap={1} color="droidalGray.400">
                <Box as="span">📱</Box> {/* Using emoji or icon */}
                <Text fontSize="sm">{patient?.mobile_phone}</Text>
              </HStack>
            </HStack>

            <Grid
              templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
              gap={8}
              w="full"
            >
              <Box>
                <Text fontSize="xs" color="droidalGray.400">
                  Entered by
                </Text>
                <Text fontSize="sm">
                  {LAB_META_DATA.enteredBy} on {LAB_META_DATA.enteredDate}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="droidalGray.400">
                  Performed by
                </Text>
                <Text fontSize="sm">
                  {LAB_META_DATA.performedBy} on {LAB_META_DATA.performedDate}
                </Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="droidalGray.400">
                  Mapped ICD Codes
                </Text>
                <Text fontSize="sm">{LAB_META_DATA.icdCodes}</Text>
              </Box>
            </Grid>
          </VStack>
        </Flex>

        {/* Office Staff Notes */}
        <Box mb={6}>
          <Text fontSize="sm" fontWeight="bold" mb={2}>
            Office Staff Notes:
          </Text>
          <CustomTextArea
            {...register("staffNotes")}
            placeholder="Add a comment..."
            bg="#262626"
            border="none"
            minH="60px"
          />
        </Box>

        <Separator borderColor="gray.700" mb={6} />

        {/* Lab Details Header */}
        <Flex justify="space-between" align="center" mb={2}>
          <HStack gap={3}>
            <Text fontSize="lg" fontWeight="bold">
              {LAB_DATA.title}
            </Text>
            <Badge
              colorPalette="gray"
              variant="solid"
              bg="droidalGray.500"
              color="black"
              fontSize="xs"
              px={2}
              py={0.5}
              borderRadius="full"
            >
              {LAB_DATA.status}
            </Badge>
          </HStack>
          <HStack gap={2}>
            <CustomButton
              variant="outline"
              size="sm"
              borderRadius="full"
              color="teal.400"
              borderColor="teal.400"
              _hover={{ bg: "whiteAlpha.100" }}
            >
              Mark as Added
            </CustomButton>
            {/* Arrow connecting buttons visual - skipped for simple buttons */}
            <CustomButton
              variant="ghost"
              size="sm"
              color="droidalGray.500"
              fontWeight="normal"
            >
              Sign Off
            </CustomButton>
          </HStack>
        </Flex>

        <Text fontSize="sm" color="droidalGray.400" mb={4}>
          Date Requested: {LAB_DATA.requestedDate}
        </Text>

        <Text fontSize="sm" color="droidalGray.400" mb={4} fontStyle="italic">
          In order to get credit for Quality Measure Reporting, please fill out
          the following results for this lab.
        </Text>

        {/* Results Table */}
        <Box mb={6} bg="#2C3E50" borderRadius="md" overflow="hidden">
          {/* Table Header */}
          <Grid
            templateColumns="1.5fr 1fr 1fr 2fr 40px"
            bg="#3C5060" // Muted teal-gray
            p={2}
            gap={4}
            alignItems="center"
          >
            <Text fontSize="xs" fontWeight="bold">
              Component
              <Text as="span" color="red.500">
                *
              </Text>
            </Text>
            <Text fontSize="xs" fontWeight="bold">
              Value
              <Text as="span" color="red.500">
                *
              </Text>
            </Text>
            <Text fontSize="xs" fontWeight="bold">
              Range
            </Text>
            <Text fontSize="xs" fontWeight="bold">
              Lab Comments
            </Text>
            <Box />
          </Grid>

          {/* Rows */}
          <VStack gap={0} align="stretch" bg="#F5F5F5" p={2}>
            {fields.map((field, index) => (
              <Grid
                key={field.id}
                templateColumns="1.5fr 1fr 1fr 2fr 40px"
                gap={4}
                mb={2}
                alignItems="start"
              >
                <Controller
                  name={`results.${index}.component`}
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      options={COMPONENT_OPTIONS}
                      value={field.value ? [field.value] : []}
                      onValueChange={(val) => field.onChange(val[0])}
                      placeholder="--Select Component--"
                      size="sm"
                      selectProps={{
                        bg: "white",
                        color: "black",
                        borderColor: "gray.300",
                      }}
                      // CustomSelect styles might be locked to dark mode, might need tweaks
                    />
                  )}
                />
                <CustomInput
                  {...register(`results.${index}.value`)}
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  size="sm"
                  _placeholder={{ color: "gray.400" }}
                />
                <Controller
                  name={`results.${index}.range`}
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      options={RANGE_OPTIONS}
                      value={field.value ? [field.value] : []}
                      onValueChange={(val) => field.onChange(val[0])}
                      placeholder="--Select Range--"
                      size="sm"
                      selectProps={{
                        bg: "white",
                        color: "black",
                        borderColor: "gray.300",
                      }}
                    />
                  )}
                />
                <CustomInput
                  {...register(`results.${index}.comments`)}
                  bg="white"
                  color="black"
                  borderColor="gray.300"
                  size="sm"
                  _placeholder={{ color: "gray.400" }}
                />
                <IconButton
                  aria-label="Delete row"
                  icon={<Trash2 size={16} />}
                  variant="ghost"
                  color="red.500"
                  size="xs"
                  onClick={() => remove(index)}
                  _hover={{ bg: "red.50" }}
                />
              </Grid>
            ))}
            <CustomButton
              variant="ghost"
              size="sm"
              color="teal.600"
              justifyContent="flex-start"
              onClick={() =>
                append({
                  component: null,
                  value: "",
                  range: null,
                  comments: "",
                })
              }
              leftIcon={<span>+</span>}
              _hover={{ bg: "teal.50" }}
              w="fit-content"
              px={0}
            >
              Add Row
            </CustomButton>
          </VStack>
        </Box>

        {/* Internal Comments */}
        <Box mb={6}>
          <Text fontSize="md" fontWeight="bold" mb={1}>
            Internal Comments
          </Text>
          <Text fontSize="xs" color="droidalGray.400" mb={2}>
            Results typed below will not be shared with patients.
          </Text>
          <Flex gap={2}>
            <CustomInput
              {...register("internalComments")}
              placeholder="Add a comment"
              flex={1}
            />
            <CustomButton variant="outline" size="sm" color="droidalGray.400">
              Add Comment
            </CustomButton>
          </Flex>
        </Box>

        {/* Shared Comments */}
        <Box mb={8}>
          <Text fontSize="md" fontWeight="bold" mb={1}>
            Comments Shared with Patient
          </Text>
          <Text fontSize="xs" color="droidalGray.400" mb={2}>
            Results typed below will be shared with patients in the patient
            portal once a provider signs the results.
          </Text>
          <CustomTextArea
            {...register("patientComments")}
            placeholder="Add a comment..."
            minH="100px"
            maxLength={4000}
          />
          <Text fontSize="xs" color="droidalGray.400" textAlign="right" mt={1}>
            {REMAINING_CHARS} characters left
          </Text>
        </Box>
      </Box>
      {/* Footer */}
      <Flex
        justify="space-between"
        align="center"
        mt={4}
        py={4}
        borderTop="1px solid"
        borderColor="gray.800"
      >
        <HStack gap={4}>
          <CustomButton
            bg="#FF7F50"
            color="white"
            _hover={{ bg: "#FF6347" }}
            size="sm"
          >
            Mark All as Added
          </CustomButton>
          <CustomButton
            variant="outline"
            size="sm"
            color="teal.400"
            borderColor="teal.400"
            leftIcon={<Paperclip size={16} />}
          >
            Attachments (0)
          </CustomButton>
          <HStack gap={0}>
            <CustomButton
              variant="outline"
              size="sm"
              borderRightRadius={0}
              loading={isSaving}
              onClick={handleSubmit(onSubmit)}
            >
              Save and Close
            </CustomButton>
            <IconButton
              variant="outline"
              size="sm"
              borderLeftRadius={0}
              borderLeft="none"
              icon={<ChevronDown size={16} />}
              aria-label="More options"
            />
          </HStack>
        </HStack>

        <HStack gap={2}>
          <IconButton
            variant="outline"
            size="sm"
            icon={<Printer size={16} />}
            aria-label="Print"
            color="teal.400"
            borderColor="teal.400"
          />
          <CustomButton
            variant="outline"
            size="sm"
            leftIcon={<Share2 size={16} />}
            color="teal.400"
            borderColor="teal.400"
          >
            Share (1)
          </CustomButton>
        </HStack>
      </Flex>

      <Text fontSize="xs" color="droidalGray.500" mt={2}>
        Last Edit: 12/19/2025 at 2:59pm by Diana Hudson
      </Text>
    </Box>
  );
};

export default ViewEditLabs;

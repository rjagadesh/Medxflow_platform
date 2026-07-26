import React, { useState, useMemo, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  Portal,
  HStack,
  VStack,
  CloseButton,
  RadioGroup,
  Text,
  Box,
  Checkbox,
  Flex,
  IconButton,
} from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import CustomSelect from "@/components/ui/select";
import CustomInput from "@/components/input/input";
import CustomTextArea from "@/components/textarea/textarea";
import { useParams } from "react-router-dom";
import { useGetMinimalProvider } from "@/hooks/query/pms/patient/useGetMinimalProvider";
import { useGetPatientById } from "@/hooks/query/pms/pms_appointments/useGetPatientById";
import { useCreateLabOrder } from "@/hooks/mutation/pms/lab-orders/useCreateLabOrder";
import { toaster } from "@/components/ui/toaster";
import { mockICD10 } from "@/_data/icd";
import { X } from "lucide-react";

// Mock Lab Data
const mockLabs = [
  { label: "Comprehensive Metabolic Panel (CMP)", value: "cmp" },
  { label: "Glucose", value: "glucose" },
  { label: "Hemoglobin A1C", value: "hba1c" },
  { label: "Lipid Panel", value: "lipid" },
  { label: "CBC", value: "cbc" },
  { label: "Urinalysis", value: "ua" },
];

const AddEditLabsStudies = ({ isOpen, onClose, initialData }) => {
  const { patient_id: patientId } = useParams();
  const { data: patientDetails } = useGetPatientById(patientId);
  const { data: providersData = [] } = useGetMinimalProvider();

  // Internal open state if not controlled (though usually controlled)
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const finalOpen = isControlled ? isOpen : internalOpen;
  const finalOnClose = isControlled ? onClose : () => setInternalOpen(false);

  // Selected Items State
  const [selectedDiagnoses, setSelectedDiagnoses] = useState([]);
  const [selectedLabs, setSelectedLabs] = useState([]);

  const { control, handleSubmit, register, reset } = useForm({
    defaultValues: {
      type: "Labs",
      eLab: false,
      orderingProvider: "",
      processingProvider: "",
      notes: "",
      stat: "No",
    },
  });

  useEffect(() => {
    if (finalOpen) {
      if (initialData) {
        // Populate form if editing
        reset({
          type: initialData.type || "Labs",
          eLab: initialData.eLab || false,
          orderingProvider: initialData.orderingProvider || "",
          processingProvider: initialData.processingProvider || "",
          notes: initialData.notes || "",
          stat: initialData.stat || "No",
        });
        setSelectedDiagnoses(initialData.diagnoses || []);
        setSelectedLabs(initialData.labs || []);
      } else {
        // Reset to defaults
        reset({
          type: "Labs",
          eLab: false,
          orderingProvider: "",
          processingProvider: "",
          notes: "",
          stat: "No",
        });
        setSelectedDiagnoses([]);
        setSelectedLabs([]);
      }
    }
  }, [finalOpen, initialData, reset]);

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

  const icdOptions = useMemo(() => {
    return mockICD10.map((item) => ({
      label: `${item.code} - ${item.description}`,
      value: item.code,
      description: item.description, // Store description for display
    }));
  }, []);

  const labOptions = useMemo(() => mockLabs, []);

  const handleAddDiagnosis = (code) => {
    const diagnosis = icdOptions.find((d) => d.value === code);
    if (diagnosis && !selectedDiagnoses.find((d) => d.value === code)) {
      setSelectedDiagnoses([...selectedDiagnoses, diagnosis]);
    }
    // Clear the select input is handled by not binding value or resetting it
  };

  const handleRemoveDiagnosis = (code) => {
    setSelectedDiagnoses(selectedDiagnoses.filter((d) => d.value !== code));
  };

  const handleAddLab = (value) => {
    const lab = labOptions.find((l) => l.value === value);
    if (lab && !selectedLabs.find((l) => l.value === value)) {
      setSelectedLabs([...selectedLabs, lab]);
    }
  };

  const handleRemoveLab = (value) => {
    setSelectedLabs(selectedLabs.filter((l) => l.value !== value));
  };

  const { mutate: createLabOrder, isPending: isSubmitting } =
    useCreateLabOrder();

  const onSubmit = (data) => {
    const payload = {
      patient: patientId,
      order_type: data.type,
      is_elab: data.eLab,
      ordering_provider: data.orderingProvider || null,
      processing_provider: data.processingProvider || null,
      notes: data.notes,
      stat: data.stat,
      diagnoses: selectedDiagnoses.map((d) => ({
        icd_code: d.value,
        description: d.description || d.label || "",
      })),
      items: selectedLabs.map((l) => ({ code: l.value, name: l.label })),
    };

    createLabOrder(payload, {
      onSuccess: () => {
        toaster.success({
          title: "Order Placed",
          description: `${data.type} order has been created successfully`,
        });
        finalOnClose();
      },
      onError: (error) => {
        toaster.error({
          title: "Error",
          description:
            error?.detail || "Something went wrong while placing the order",
        });
      },
    });
  };

  return (
    <Dialog.Root
      open={finalOpen}
      onOpenChange={(e) => !e.open && finalOnClose()}
      placement="center"
      motionPreset="slide-in-bottom"
      size="xl"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bgColor="droidalBlack.300"
            color="white"
            minW={{ base: "90%", lg: "800px" }}
            borderRadius="md"
          >
            <Dialog.Header
              borderBottom="1px solid"
              borderColor="droidalGray.300"
              py={3}
            >
              <Dialog.Title fontSize="lg" mb={0} fontWeight="medium">
                Create Order
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                size="sm"
                pos="absolute"
                top="3"
                right="3"
                color="droidalGray.300"
                onClick={finalOnClose}
              />
            </Dialog.CloseTrigger>

            <Dialog.Body py={6}>
              <form onSubmit={handleSubmit(onSubmit)}>
                <VStack gap={6} align="stretch">
                  {/* Row 1: Patient & Order Type */}
                  <Flex gap={6} direction={{ base: "column", md: "row" }}>
                    <Box flex={1}>
                      <Text
                        fontSize="sm"
                        color="droidalGray.400"
                        mb={2}
                        fontWeight="normal"
                      >
                        Who is this order for?
                      </Text>
                      <CustomInput
                        value={patientDetails?.full_name || ""}
                        readOnly
                        bg="transparent"
                        border="1px solid"
                        borderColor="droidalGray.300"
                        _hover={{ borderColor: "droidalGray.300" }}
                        _focus={{ borderColor: "droidalGray.300" }}
                      />
                    </Box>
                    <Box flex={1}>
                      <Flex justify="space-between" align="center" mb={2}>
                        <Text
                          fontSize="sm"
                          color="droidalGray.400"
                          fontWeight="normal"
                        >
                          What type of order is this?
                        </Text>
                        <Controller
                          name="eLab"
                          control={control}
                          render={({ field: { value, onChange, ...rest } }) => (
                            <Checkbox.Root
                              checked={value}
                              onCheckedChange={(e) => onChange(e.checked)}
                              {...rest}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control
                                borderColor="#2f4d78"
                                size="sm"
                              />
                              <Checkbox.Label color="white" fontSize="sm">
                                eLab
                              </Checkbox.Label>
                            </Checkbox.Root>
                          )}
                        />
                      </Flex>
                      <Controller
                        name="type"
                        control={control}
                        render={({ field }) => (
                          <RadioGroup.Root
                            value={field.value}
                            onValueChange={(e) => field.onChange(e.value)}
                            display="flex"
                          >
                            <HStack gap={0} w="full">
                              <RadioGroup.Item value="Labs" w="50%">
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemControl display="none" />
                                <Box
                                  as="span"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  w="full"
                                  h="40px"
                                  bg={
                                    field.value === "Labs"
                                      ? "var(--bg-blue-gradient)"
                                      : "transparent"
                                  } // Dark teal for selected
                                  border="1px solid"
                                  borderColor={
                                    field.value === "Labs"
                                      ? "#00BBF2"
                                      : "droidalGray.300"
                                  }
                                  borderRightWidth={0}
                                  borderTopLeftRadius="md"
                                  borderBottomLeftRadius="md"
                                  color="white"
                                  cursor="pointer"
                                  _hover={{
                                    bg:
                                      field.value === "Labs"
                                        ? "var(--bg-blue-gradient)"
                                        : "whiteAlpha.100",
                                  }}
                                >
                                  {field.value === "Labs" && (
                                    <Box as="span" mr={2}>
                                      ✓
                                    </Box>
                                  )}
                                  Labs
                                </Box>
                              </RadioGroup.Item>
                              <RadioGroup.Item value="Studies/Imaging" w="50%">
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemControl display="none" />
                                <Box
                                  as="span"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  w="full"
                                  h="40px"
                                  bg={
                                    field.value === "Studies/Imaging"
                                      ? "var(--bg-blue-gradient)"
                                      : "transparent"
                                  }
                                  border="1px solid"
                                  borderColor={
                                    field.value === "Studies/Imaging"
                                      ? "#00BBF2"
                                      : "droidalGray.300"
                                  }
                                  borderTopRightRadius="md"
                                  borderBottomRightRadius="md"
                                  color="white"
                                  cursor="pointer"
                                  _hover={{
                                    bg:
                                      field.value === "Studies/Imaging"
                                        ? "var(--bg-blue-gradient)"
                                        : "whiteAlpha.100",
                                  }}
                                >
                                  {field.value === "Studies/Imaging" && (
                                    <Box as="span" mr={2}>
                                      ✓
                                    </Box>
                                  )}
                                  Studies/Imaging
                                </Box>
                              </RadioGroup.Item>
                            </HStack>
                          </RadioGroup.Root>
                        )}
                      />
                    </Box>
                  </Flex>

                  {/* Row 2: Providers */}
                  <Flex gap={6} direction={{ base: "column", md: "row" }}>
                    <Box flex={1}>
                      <Text
                        fontSize="sm"
                        color="droidalGray.400"
                        mb={2}
                        fontWeight="normal"
                      >
                        Who is the ordering Provider?
                      </Text>
                      <Controller
                        name="orderingProvider"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            options={providerOptions}
                            value={field.value ? [field.value] : []}
                            onValueChange={(val) => field.onChange(val[0])}
                            placeholder="Select Provider"
                          />
                        )}
                      />
                    </Box>
                    <Box flex={1}>
                      <Text
                        fontSize="sm"
                        color="droidalGray.400"
                        mb={2}
                        fontWeight="normal"
                      >
                        Who is responsible for processing the order?
                      </Text>
                      <Controller
                        name="processingProvider"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            options={providerOptions}
                            value={field.value ? [field.value] : []}
                            onValueChange={(val) => field.onChange(val[0])}
                            placeholder="Select Provider"
                          />
                        )}
                      />
                    </Box>
                  </Flex>

                  {/* Row 3: Notes & Stat */}
                  <Flex gap={6} direction={{ base: "column", md: "row" }}>
                    <Box flex={1}>
                      <Text
                        fontSize="sm"
                        color="droidalGray.400"
                        mb={2}
                        fontWeight="normal"
                      >
                        Notes to Office Staff
                      </Text>
                      <CustomTextArea
                        {...register("notes")}
                        placeholder=""
                        minH="80px"
                        resize="vertical"
                      />
                    </Box>
                    <Box flex={1}>
                      <Text
                        fontSize="sm"
                        color="droidalGray.400"
                        mb={2}
                        fontWeight="normal"
                      >
                        Stat?
                      </Text>
                      <Controller
                        name="stat"
                        control={control}
                        render={({ field }) => (
                          <RadioGroup.Root
                            value={field.value}
                            onValueChange={(e) => field.onChange(e.value)}
                            display="flex"
                          >
                            <HStack gap={0}>
                              <RadioGroup.Item value="Yes">
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemControl display="none" />
                                <Box
                                  as="span"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  w="60px"
                                  h="32px"
                                  bg={
                                    field.value === "Yes"
                                      ? "var(--bg-blue-gradient)"
                                      : "transparent"
                                  }
                                  border="1px solid"
                                  borderColor={
                                    field.value === "Yes"
                                      ? "#00BBF2"
                                      : "droidalGray.300"
                                  }
                                  borderRightWidth={0}
                                  borderTopLeftRadius="md"
                                  borderBottomLeftRadius="md"
                                  color="white"
                                  fontSize="sm"
                                  cursor="pointer"
                                >
                                  {field.value === "Yes" && (
                                    <Box as="span" mr={1}>
                                      ✓
                                    </Box>
                                  )}
                                  Yes
                                </Box>
                              </RadioGroup.Item>
                              <RadioGroup.Item value="No">
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemControl display="none" />
                                <Box
                                  as="span"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="center"
                                  w="60px"
                                  h="32px"
                                  bg={
                                    field.value === "No"
                                      ? "var(--bg-blue-gradient)"
                                      : "transparent"
                                  }
                                  border="1px solid"
                                  borderColor={
                                    field.value === "No"
                                      ? "#00BBF2"
                                      : "droidalGray.300"
                                  }
                                  borderTopRightRadius="md"
                                  borderBottomRightRadius="md"
                                  color="white"
                                  fontSize="sm"
                                  cursor="pointer"
                                >
                                  {field.value === "No" && (
                                    <Box as="span" mr={1}>
                                      ✓
                                    </Box>
                                  )}
                                  No
                                </Box>
                              </RadioGroup.Item>
                            </HStack>
                          </RadioGroup.Root>
                        )}
                      />
                    </Box>
                  </Flex>

                  {/* Diagnoses Section */}
                  <Box>
                    <Text fontSize="sm" color="droidalGray.400" mb={2}>
                      Diagnoses
                    </Text>
                    {/* List of selected diagnoses */}
                    <VStack align="stretch" gap={0} mb={2}>
                      {selectedDiagnoses.map((item, index) => (
                        <Flex
                          key={item.value}
                          justify="space-between"
                          align="center"
                          py={2}
                          borderBottom="1px solid"
                          borderColor="whiteAlpha.100"
                        >
                          <Text
                            fontSize="sm"
                            color="#00BBF2"
                            fontWeight="medium"
                          >
                            {index + 1}. {item.value} - {item.description}
                          </Text>
                          <IconButton
                            variant="ghost"
                            size="xs"
                            color="droidalGray.400"
                            _hover={{ color: "red.400", bg: "transparent" }}
                            onClick={() => handleRemoveDiagnosis(item.value)}
                          >
                            <X size={16} />
                          </IconButton>
                        </Flex>
                      ))}
                    </VStack>
                    {/* Input to add new diagnosis */}
                    <CustomSelect
                      options={icdOptions}
                      placeholder="Add a diagnosis..."
                      value={[]} // Always empty so it acts as an adder
                      onValueChange={(val) => handleAddDiagnosis(val[0])}
                    />
                  </Box>

                  {/* Labs/Studies Section */}
                  <Box>
                    <Text fontSize="sm" color="droidalGray.400" mb={2}>
                      {/* Dynamic label based on type selected? Image just says "Labs" but if Studies selected? */}
                      Labs
                    </Text>
                    {/* List of selected labs */}
                    <VStack align="stretch" gap={0} mb={2}>
                      {selectedLabs.map((item, index) => (
                        <Flex
                          key={item.value}
                          justify="space-between"
                          align="center"
                          py={2}
                          borderBottom="1px solid"
                          borderColor="whiteAlpha.100"
                        >
                          <Text
                            fontSize="sm"
                            color="#00BBF2"
                            fontWeight="medium"
                          >
                            {index + 1}. {item.label}
                          </Text>
                          <IconButton
                            variant="ghost"
                            size="xs"
                            color="droidalGray.400"
                            _hover={{ color: "red.400", bg: "transparent" }}
                            onClick={() => handleRemoveLab(item.value)}
                          >
                            <X size={16} />
                          </IconButton>
                        </Flex>
                      ))}
                    </VStack>
                    <CustomSelect
                      options={labOptions}
                      placeholder="Search Labs"
                      value={[]}
                      onValueChange={(val) => handleAddLab(val[0])}
                    />
                  </Box>
                </VStack>
              </form>
            </Dialog.Body>

            <Dialog.Footer
              borderTop="1px solid"
              borderColor="droidalGray.300"
              py={4}
            >
              <Flex justify="flex-end" gap={4} w="full">
                <CustomButton
                  variant="plain"
                  onClick={finalOnClose}
                  color="droidalGray.400"
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  bg="#FF7F50" // Coral color from image
                  _hover={{ bg: "#FF6347" }}
                  color="white"
                  loading={isSubmitting}
                  onClick={handleSubmit(onSubmit)}
                >
                  Create Lab Order
                </CustomButton>
              </Flex>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default AddEditLabsStudies;

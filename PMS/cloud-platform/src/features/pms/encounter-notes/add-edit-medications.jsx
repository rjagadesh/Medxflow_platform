import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  Portal,
  Stack,
  HStack,
  Text,
  Box,
  Flex,
  RadioGroup,
  Checkbox,
  Link,
  CloseButton,
  Field,
  Alert,
  Button,
} from "@chakra-ui/react";
import { CalendarIcon } from "lucide-react";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import CustomTextArea from "@/components/textarea/textarea";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import { useState, useMemo, useEffect } from "react";
import { toaster } from "@/components/ui/toaster";
import { mockICD10 } from "@/_data/icd";
import { useGetMinimalProvider } from "@/hooks/query/pms/patient/useGetMinimalProvider";
import { formatDate } from "@/utils/helper";
import { useCreateMedications } from "@/hooks/mutation/pms/medications/useCreateMedications";
import { useUpdateMedications } from "@/hooks/mutation/pms/medications/useUpdateMedications";
import { useParams } from "react-router-dom";

const samplePayload = {
  drug_name: "",
  reason_for_rx_icd10_code: "",
  reason_for_rx_icd10_name: "",
  status: "active",
  patient_instructions: "",
  quantity: 0,
  refills: 0,
  allow_substitution: true,
  days_supply: 0,
  prescriber: null,
  started_on: null,
  administered_during_visit: false,
};

const MedicationModal = ({
  isOpen,
  onClose,
  mode = "add",
  initialData = null,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const finalOpen = isControlled ? isOpen : internalOpen;
  const finalOnClose = isControlled ? onClose : () => setInternalOpen(false);

  const { patient_id: patientId } = useParams();
  const { data: providersData = [] } = useGetMinimalProvider();
  const [showMoreDetails, setShowMoreDetails] = useState(false);

  const { mutate: createMedication, isPending: isCreating } =
    useCreateMedications();
  const { mutate: updateMedication, isPending: isUpdating } =
    useUpdateMedications();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: samplePayload.status,
      drug: samplePayload.drug_name,
      favorites: [],
      advancedSearch: false,
      ptInstructions: samplePayload.patient_instructions,
      quantity: String(samplePayload.quantity),
      refill: String(samplePayload.refills),
      allowSubstitution: samplePayload.allow_substitution,
      daysSupply: samplePayload.days_supply,
      reasonForRx: samplePayload.reason_for_rx_icd10_code,
      prescriber: samplePayload.prescriber,
      startedOn: null,
      administeredDuringVisit: samplePayload.administered_during_visit,
    },
  });

  useEffect(() => {
    if (finalOpen) {
      if (mode === "edit" && initialData) {
        reset({
          status: initialData.status || "active",
          drug: initialData.drug_name || "",
          favorites: [],
          advancedSearch: false,
          ptInstructions: initialData.patient_instructions || "",
          quantity: String(initialData.quantity || 0),
          refill: String(initialData.refills || 0),
          allowSubstitution: initialData.allow_substitution || false,
          daysSupply: initialData.days_supply || 0,
          reasonForRx: initialData.reason_for_rx_icd10_code || "",
          prescriber: initialData.prescriber || null,
          startedOn: initialData.started_on
            ? new Date(initialData.started_on)
            : null,
          administeredDuringVisit:
            initialData.administered_during_visit || false,
        });
        setShowMoreDetails(true);
      } else {
        reset({
          status: samplePayload.status,
          drug: samplePayload.drug_name,
          favorites: [],
          advancedSearch: false,
          ptInstructions: samplePayload.patient_instructions,
          quantity: String(samplePayload.quantity),
          refill: String(samplePayload.refills),
          allowSubstitution: samplePayload.allow_substitution,
          daysSupply: samplePayload.days_supply,
          reasonForRx: samplePayload.reason_for_rx_icd10_code,
          prescriber: samplePayload.prescriber,
          startedOn: null,
          administeredDuringVisit: samplePayload.administered_during_visit,
        });
        setShowMoreDetails(false);
      }
    }
  }, [finalOpen, mode, initialData, reset]);

  const onSubmit = (data) => {
    const selectedICD = mockICD10.find(
      (item) => item.code === data.reasonForRx
    );

    const payload = {
      patient: patientId,
      drug_name: data.drug,
      reason_for_rx_icd10_code: data.reasonForRx,
      reason_for_rx_icd10_name: selectedICD ? selectedICD.description : "",
      status: data.status,
      patient_instructions: data.ptInstructions,
      quantity: Number(data.quantity),
      refills: Number(data.refill),
      allow_substitution: data.allowSubstitution,
      days_supply: Number(data.daysSupply),
      prescriber: data.prescriber,
      started_on: data.startedOn
        ? formatDate(data.startedOn, "yyyy-MM-dd")
        : null,
      administered_during_visit: data.administeredDuringVisit,
    };

    const onSuccess = () => {
      toaster.success({
        title: mode === "edit" ? "Medication Updated" : "Medication Added",
        description: `Medication has been ${
          mode === "edit" ? "updated" : "added"
        } successfully`,
      });
      finalOnClose();
    };

    if (mode === "edit" && initialData?.id) {
      updateMedication({ ...payload, id: initialData.id }, { onSuccess });
    } else {
      createMedication(payload, { onSuccess });
    }
  };

  const handleClose = () => {
    reset();
    finalOnClose();
  };

  const quantityOptions = [
    { label: "30", value: "30" },
    { label: "60", value: "60" },
    { label: "90", value: "90" },
  ];

  const refillOptions = [
    { label: "0", value: "0" },
    { label: "1", value: "1" },
    { label: "2", value: "2" },
  ];

  const prescriberOptions = useMemo(
    () =>
      providersData.map((provider) => ({
        label:
          `${provider.first_name || ""} ${provider.last_name || ""}`.trim() ||
          `Provider ${provider.id}`,
        value: provider.id,
      })),
    [providersData]
  );

  const icdOptions = mockICD10.map((item) => ({
    label: item.description,
    value: item.code,
  }));

  const ptInstructionsValue = watch("ptInstructions") || "";
  const maxChars = 140; // Assuming a max limit
  const remainingChars = maxChars - ptInstructionsValue.length;

  return (
    <Dialog.Root
      placement="center"
      motionPreset="slide-in-bottom"
      open={finalOpen}
      onOpenChange={(e) => {
        if (!e.open) handleClose();
        else if (!isControlled) setInternalOpen(true);
      }}
      size={"xl"}
      scrollBehavior={"inside"}
    >
      {!isControlled && (
        <Dialog.Trigger asChild>
          <CustomButton size="sm" onClick={() => setInternalOpen(true)}>
            + Add Med
          </CustomButton>
        </Dialog.Trigger>
      )}
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bgColor="droidalBlack.300"
            color="white"
            my="0"
            minW="600px"
          >
            <Dialog.Header>
              <Dialog.Title my={0} letterSpacing="wider" fontWeight="medium">
                {mode === "edit" ? "Edit Medication" : "Add to Med List"}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form id="medication-form" onSubmit={handleSubmit(onSubmit)}>
                <Stack gap={6}>
                  {/* Info Banner */}
                  <Alert.Root className="dark" status="info" mb={3}>
                    <Alert.Indicator />
                    <Alert.Title>
                      <Text
                        fontSize="sm"
                        letterSpacing={"wider"}
                        fontWeight="light"
                      >
                        Safely and securely deliver your patients' prescriptions
                        by signing up to ePrescribe.{" "}
                        <Link
                          color="blue.400"
                          href="#"
                          textDecoration="underline"
                        >
                          Enroll Now
                        </Link>
                        <br />
                        <Link
                          color="blue.400"
                          href="#"
                          textDecoration="underline"
                        >
                          Learn More
                        </Link>
                      </Text>
                    </Alert.Title>
                  </Alert.Root>

                  {/* Status */}
                  <Field.Root invalid={!!errors.status}>
                    <HStack gap={4}>
                      <Field.Label
                        color="white"
                        fontWeight="light"
                        fontSize="md"
                        letterSpacing="wider"
                        mb={0}
                        width="60px"
                      >
                        Status:
                      </Field.Label>
                      <Controller
                        name="status"
                        control={control}
                        render={({ field }) => (
                          <RadioGroup.Root
                            value={field.value}
                            onValueChange={(e) => field.onChange(e.value)}
                            colorPalette="blue"
                          >
                            <HStack gap={4}>
                              <RadioGroup.Item value="active">
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemControl />
                                <RadioGroup.ItemText color="white">
                                  Active
                                </RadioGroup.ItemText>
                              </RadioGroup.Item>
                              <RadioGroup.Item value="discontinued">
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemControl />
                                <RadioGroup.ItemText color="white">
                                  Discontinued
                                </RadioGroup.ItemText>
                              </RadioGroup.Item>
                              <RadioGroup.Item value="not_administered">
                                <RadioGroup.ItemHiddenInput />
                                <RadioGroup.ItemControl />
                                <RadioGroup.ItemText color="white">
                                  Not Administered
                                </RadioGroup.ItemText>
                              </RadioGroup.Item>
                            </HStack>
                          </RadioGroup.Root>
                        )}
                      />
                    </HStack>
                  </Field.Root>

                  {/* Drug & Favorites */}
                  <Flex align="center" gap={2}>
                    <Text
                      color="white"
                      fontWeight="light"
                      fontSize="md"
                      letterSpacing="wider"
                      mb={0}
                      width="60px"
                    >
                      Drug:
                    </Text>
                    <Box flex={1}>
                      <CustomInput
                        placeholder="Start typing a drug"
                        {...register("drug", { required: "Drug is required" })}
                        invalid={!!errors.drug}
                        errorMessage={errors.drug?.message}
                        showError={!!errors.drug}
                        labelProps={{
                          color: "white",
                          width: "60px",
                          display: "inline-block",
                          mr: 4,
                        }}
                      />
                    </Box>
                    <Box width="150px">
                      <Button
                        size="sm"
                        variant="outline"
                        color="white"
                        borderColor="droidalGray.300"
                        fontWeight="normal"
                        onClick={() => {}}
                        _hover={{ bg: "whiteAlpha.100" }}
                      >
                        Favorites
                      </Button>
                    </Box>
                  </Flex>

                  {/* Advanced Search Checkbox */}
                  <Box pl="70px">
                    {" "}
                    {/* Indent to align with input */}
                    <Controller
                      name="advancedSearch"
                      control={control}
                      render={({ field: { value, onChange, ...rest } }) => (
                        <Checkbox.Root
                          checked={value}
                          onCheckedChange={(e) => onChange(e.checked)}
                          {...rest}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control
                            bg="black"
                            borderColor="#2f4d78"
                            _checked={{
                              bgImage:
                                "linear-gradient(0deg, rgba(0,91,127,1) 0%, rgba(0,187,242,1) 72%)",
                            }}
                          />
                          <Checkbox.Label color="droidalGray.400">
                            Advanced search
                          </Checkbox.Label>
                        </Checkbox.Root>
                      )}
                    />
                  </Box>

                  {/* Add more details link */}
                  {!showMoreDetails && (
                    <Box>
                      <Link
                        color="teal.400"
                        fontSize="sm"
                        onClick={() => setShowMoreDetails(true)}
                        cursor="pointer"
                      >
                        Add more details...
                      </Link>
                      <Text fontSize="xs" color="droidalGray.400" mt={1}>
                        More details such as quantity, dispense form, etc. are
                        required for renewal
                      </Text>
                    </Box>
                  )}

                  {showMoreDetails && (
                    <Stack gap={4}>
                      {/* Pt. Instructions */}
                      <Flex gap={4} align="center">
                        <Box flex={1}>
                          <CustomTextArea
                            label="Patient Instructions:"
                            placeholder="Patient Instructions"
                            {...register("ptInstructions")}
                            labelProps={{
                              color: "white",
                              width: "120px",
                              display: "inline-block",
                              mr: 2,
                              verticalAlign: "top",
                              mt: 2,
                            }}
                          />
                          <Text
                            fontSize="xs"
                            color="gray.400"
                            textAlign="right"
                            mt={1}
                          >
                            {remainingChars} characters remaining
                          </Text>
                        </Box>
                        <CustomButton variant="outline" size="sm" mt={0}>
                          Build Instructions
                        </CustomButton>
                      </Flex>

                      {/* Quantity */}
                      <HStack gap={2} align="center">
                        <Text
                          color="white"
                          fontWeight="light"
                          fontSize="md"
                          letterSpacing="wider"
                          width="120px"
                        >
                          Quantity:
                        </Text>
                        <Box width="100px">
                          <Controller
                            name="quantity"
                            control={control}
                            render={({ field }) => (
                              <CustomSelect
                                options={quantityOptions}
                                value={field.value ? [field.value] : []}
                                onValueChange={(val) => field.onChange(val[0])}
                                placeholder="30"
                              />
                            )}
                          />
                        </Box>
                        <Text color="white" fontSize="sm">
                          tablet
                        </Text>
                      </HStack>

                      {/* Refill */}
                      <HStack gap={4} align="center">
                        <HStack gap={2}>
                          <Text
                            color="white"
                            fontWeight="light"
                            fontSize="md"
                            letterSpacing="wider"
                            width="120px"
                          >
                            Refill:
                          </Text>
                          <Box width="100px">
                            <Controller
                              name="refill"
                              control={control}
                              render={({ field }) => (
                                <CustomSelect
                                  options={refillOptions}
                                  value={field.value ? [field.value] : []}
                                  onValueChange={(val) =>
                                    field.onChange(val[0])
                                  }
                                  placeholder="0"
                                />
                              )}
                            />
                          </Box>
                        </HStack>
                        <Controller
                          name="allowSubstitution"
                          control={control}
                          render={({ field: { value, onChange, ...rest } }) => (
                            <Checkbox.Root
                              checked={value}
                              onCheckedChange={(e) => onChange(e.checked)}
                              {...rest}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control borderColor="#2f4d78" />
                              <Checkbox.Label color="white">
                                Allow Substitution
                              </Checkbox.Label>
                            </Checkbox.Root>
                          )}
                        />
                      </HStack>

                      {/* Days Supply */}
                      <HStack gap={2} align="center">
                        <Text
                          color="white"
                          fontWeight="light"
                          fontSize="md"
                          letterSpacing="wider"
                          width="120px"
                        >
                          Days supply:
                        </Text>
                        <Box width="150px">
                          <CustomInput
                            {...register("daysSupply")}
                            placeholder=""
                          />
                        </Box>
                      </HStack>

                      {/* Reason For Rx */}
                      <Flex gap={4} align="center">
                        <Text
                          color="white"
                          fontWeight="light"
                          fontSize="md"
                          letterSpacing="wider"
                          width="110px"
                        >
                          Reason for Rx:
                        </Text>

                        <Box flex={1}>
                          <Controller
                            name="reasonForRx"
                            control={control}
                            render={({ field }) => (
                              <CustomSelect
                                options={icdOptions}
                                value={field.value ? [field.value] : []}
                                onValueChange={(val) => field.onChange(val[0])}
                                placeholder="Select Reason"
                              />
                            )}
                          />
                        </Box>
                        <CustomButton variant="outline" size="sm">
                          Browse
                        </CustomButton>
                        {/* <Link color="orange.400" fontSize="sm" href="#">
                          Add Another Reason
                        </Link> */}
                      </Flex>

                      {/* Prescriber */}
                      <HStack gap={2} align="center">
                        <Text
                          color="white"
                          fontWeight="light"
                          fontSize="md"
                          letterSpacing="wider"
                          width="120px"
                        >
                          Prescriber
                        </Text>
                        <Box flex={1}>
                          <Controller
                            name="prescriber"
                            control={control}
                            render={({ field }) => (
                              <CustomSelect
                                options={prescriberOptions}
                                value={field.value ? [field.value] : []}
                                onValueChange={(val) => field.onChange(val[0])}
                                placeholder="Select Prescriber"
                              />
                            )}
                          />
                        </Box>
                      </HStack>

                      {/* Started On */}
                      <HStack gap={2} align="center">
                        <Text
                          color="white"
                          fontWeight="light"
                          fontSize="md"
                          letterSpacing="wider"
                          width="120px"
                        >
                          Started On
                        </Text>
                        <Box width="200px">
                          <Controller
                            name="startedOn"
                            control={control}
                            render={({ field }) => (
                              <CustomDatePicker
                                value={field.value}
                                onValueChange={field.onChange}
                                endElement={<CalendarIcon size={16} />}
                              />
                            )}
                          />
                        </Box>
                      </HStack>

                      {/* Administered During Visit */}
                      <Box pl="128px">
                        <Controller
                          name="administeredDuringVisit"
                          control={control}
                          render={({ field: { value, onChange, ...rest } }) => (
                            <Checkbox.Root
                              checked={value}
                              onCheckedChange={(e) => onChange(e.checked)}
                              {...rest}
                            >
                              <Checkbox.HiddenInput />
                              <Checkbox.Control borderColor="#2f4d78" />
                              <Checkbox.Label color="white">
                                Administered During Visit
                              </Checkbox.Label>
                            </Checkbox.Root>
                          )}
                        />
                      </Box>
                    </Stack>
                  )}
                </Stack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <CustomButton variant="plain" onClick={handleClose}>
                Cancel
              </CustomButton>
              <CustomButton variant="outline" onClick={() => reset()}>
                Clear
              </CustomButton>
              <CustomButton
                variant="outline"
                onClick={handleSubmit((data) => {
                  onSubmit(data);
                  // In real app, we might keep modal open for 'Add Another'
                  if (!isControlled) setInternalOpen(true);
                })}
              >
                Save & Add Another
              </CustomButton>
              <CustomButton
                onClick={handleSubmit(onSubmit)}
                isLoading={isCreating || isUpdating}
              >
                Save & Close
              </CustomButton>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" onClick={handleClose} />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default MedicationModal;

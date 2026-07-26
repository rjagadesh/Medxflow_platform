import {
  Dialog,
  Portal,
  Stack,
  HStack,
  Text,
  SimpleGrid,
  CloseButton,
  Flex,
  Box,
} from "@chakra-ui/react";
import { useForm, Controller } from "react-hook-form";
import { useState, useEffect } from "react";
import CustomInput from "@/components/input/input";
import CustomTextArea from "@/components/textarea/textarea";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import CustomButton from "@/components/button/button";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { useCreateVitals } from "@/hooks/mutation/pms/vitals/useCreateVitals";
import { useUpdateVitals } from "@/hooks/mutation/pms/vitals/useUpdateVitals";
import { useParams } from "react-router-dom";
import { toaster } from "@/components/ui/toaster";

const VitalModal = ({ isOpen, onClose, mode = "add", initialData = null }) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = isOpen !== undefined;
  const finalOpen = isControlled ? isOpen : internalOpen;
  const finalOnClose = isControlled ? onClose : () => setInternalOpen(false);

  const { patient_id: patientId } = useParams();

  const { mutate: createVitals, isPending: isCreating } = useCreateVitals();
  const { mutate: updateVitals, isPending: isUpdating } = useUpdateVitals();

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      recordedDate: new Date(),
      recordedTime: format(new Date(), "HH:mm"),
      bpSystolic: "",
      bpDiastolic: "",
      heightFt: "",
      heightIn: "",
      headCirc: "",
      heartRate: "",
      weightLbs: "",
      weightOz: "",
      temperature: "",
      respRate: "",
      bmi: "",
      spo2: "",
      inhaledO2: "",
      comments: "",
    },
    mode: "onChange",
  });

  const heightFt = watch("heightFt");
  const heightIn = watch("heightIn");
  const weightLbs = watch("weightLbs");
  const weightOz = watch("weightOz");

  useEffect(() => {
    const hFt = parseFloat(heightFt) || 0;
    const hIn = parseFloat(heightIn) || 0;
    const wLbs = parseFloat(weightLbs) || 0;
    const wOz = parseFloat(weightOz) || 0;

    const totalHeightIn = hFt * 12 + hIn;
    const totalWeightLbs = wLbs + wOz / 16;

    if (totalHeightIn > 0 && totalWeightLbs > 0) {
      const bmiVal = (703 * totalWeightLbs) / (totalHeightIn * totalHeightIn);
      setValue("bmi", bmiVal.toFixed(1));
    } else {
      // Don't clear BMI if we are just loading initial data which might trigger this
      // But actually if fields change to 0 or empty, we should clear.
      // With react-hook-form setValue, it might be tricky.
      // For now, let's keep it simple: if invalid height/weight, bmi is empty.
      setValue("bmi", "");
    }
  }, [heightFt, heightIn, weightLbs, weightOz, setValue]);

  useEffect(() => {
    if (finalOpen) {
      if (mode === "edit" && initialData) {
        const heightInTotal = initialData.height_in || 0;
        const heightFt = Math.floor(heightInTotal / 12);
        const heightInRemainder = heightInTotal % 12;

        reset({
          recordedDate: initialData.recorded_at
            ? new Date(initialData.recorded_at)
            : new Date(),
          recordedTime: initialData.recorded_at
            ? format(new Date(initialData.recorded_at), "HH:mm")
            : format(new Date(), "HH:mm"),
          bpSystolic: initialData.systolic_bp || "",
          bpDiastolic: initialData.diastolic_bp || "",
          heightFt: heightFt || "",
          heightIn: heightInRemainder || "",
          headCirc: initialData.head_circumference_in || "",
          heartRate: initialData.heart_rate || "",
          weightLbs: initialData.weight_lbs || "",
          weightOz: initialData.weight_oz || "",
          temperature: initialData.temperature_f || "",
          respRate: initialData.respiratory_rate || "",
          bmi: initialData.bmi || "",
          spo2: initialData.spo2 || "",
          inhaledO2: initialData.inhaled_o2 || "",
          comments: initialData.comments || "",
        });
      } else {
        reset({
          recordedDate: new Date(),
          recordedTime: format(new Date(), "HH:mm"),
          bpSystolic: "",
          bpDiastolic: "",
          heightFt: "",
          heightIn: "",
          headCirc: "",
          heartRate: "",
          weightLbs: "",
          weightOz: "",
          temperature: "",
          respRate: "",
          bmi: "",
          spo2: "",
          inhaledO2: "",
          comments: "",
        });
      }
    }
  }, [finalOpen, mode, initialData, reset]);

  const handleClose = () => {
    finalOnClose();
    reset();
  };

  const onSubmit = (data) => {
    let recordedAt = null;
    if (data.recordedDate && data.recordedTime) {
      const date = new Date(data.recordedDate);
      const [hours, minutes] = data.recordedTime.split(":");
      date.setHours(parseInt(hours), parseInt(minutes));
      recordedAt = date.toISOString();
    }

    const totalHeightIn =
      (parseFloat(data.heightFt) || 0) * 12 + (parseFloat(data.heightIn) || 0);

    const payload = {
      patient: patientId,
      recorded_at: recordedAt,
      systolic_bp: data.bpSystolic,
      diastolic_bp: data.bpDiastolic,
      height_in: totalHeightIn > 0 ? totalHeightIn : null,
      head_circumference_in: data.headCirc,
      heart_rate: data.heartRate,
      weight_lbs: data.weightLbs,
      weight_oz: data.weightOz,
      temperature_f: data.temperature,
      respiratory_rate: data.respRate,
      bmi: data.bmi,
      spo2: data.spo2,
      inhaled_o2: data.inhaledO2,
      comments: data.comments,
    };

    const onSuccess = () => {
      toaster.success({
        title: mode === "edit" ? "Vitals Updated" : "Vitals Added",
        description: `Vitals have been ${
          mode === "edit" ? "updated" : "added"
        } successfully`,
      });
      handleClose();
    };
    console.log("payload18834", payload);
    if (mode === "edit" && initialData?.id) {
      updateVitals({ ...payload, id: initialData.id }, { onSuccess });
    } else {
      createVitals(payload, { onSuccess });
    }
  };

  return (
    <Dialog.Root
      open={finalOpen}
      onOpenChange={(e) => {
        if (!e.open) handleClose();
        else if (!isControlled) setInternalOpen(true);
      }}
      placement="center"
      size="cover"
      scrollBehavior="inside"
    >
      {!isControlled && (
        <Dialog.Trigger asChild>
          <CustomButton onClick={() => setInternalOpen(true)}>
            + Add Vitals
          </CustomButton>
        </Dialog.Trigger>
      )}
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            maxW={"9/12"}
            bgColor="droidalBlack.300"
            color="white"
          >
            <Dialog.Header
              my={0}
              borderBottom={"1px solid"}
              borderColor={"droidalGray.300"}
            >
              <Dialog.Title fontSize="lg" my={0} fontWeight="semibold">
                {mode === "edit" ? "Edit Vitals" : "New Vitals"}
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                size="sm"
                pos="absolute"
                top="2"
                right="2"
                onClick={handleClose}
              />
            </Dialog.CloseTrigger>

            <Dialog.Body>
              <form onSubmit={handleSubmit(onSubmit)}>
                {/* Header Row */}
                <Flex
                  justify="space-between"
                  align="center"
                  mb={8}
                  borderBottom="1px solid"
                  borderColor="gray.700"
                  pb={4}
                >
                  <HStack gap={4} my={2}>
                    <Text fontWeight="medium">
                      Recorded:{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Box w="150px">
                      <Controller
                        name="recordedDate"
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <CustomDatePicker
                            value={field.value}
                            onValueChange={field.onChange}
                            inputProps={{
                              size: "sm",
                              isInvalid: !!errors.recordedDate,
                            }}
                            endElement={<CalendarIcon />}
                          />
                        )}
                      />
                    </Box>
                    <Box w="130px">
                      <CustomInput
                        type="time"
                        {...register("recordedTime", { required: true })}
                        className="custom-time-icon"
                        isInvalid={!!errors.recordedTime}
                      />
                    </Box>
                  </HStack>
                  <Text color="droidalGray.400">Created by: N/A</Text>
                </Flex>

                {/* Vitals Grid */}
                <SimpleGrid columns={{ base: 1, lg: 3 }} gap={8} mb={8}>
                  {/* Column 1 */}
                  <Stack gap={5}>
                    <Flex align="center" justify="flex-end" gap={2}>
                      <Text width={"120px"}>
                        Blood Pressure:{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Text>
                      <CustomInput
                        {...register("bpSystolic", {
                          required: "Systolic blood pressure is required",
                          pattern: {
                            value: /^(?:[1-9]\d|[1-2]\d{2})$/,
                            message: "Enter a valid systolic BP (50–250 mmHg)",
                          },
                          min: {
                            value: 50,
                            message: "Systolic BP is too low",
                          },
                          max: {
                            value: 250,
                            message: "Systolic BP is too high",
                          },
                        })}
                        invalid={!!errors.bpSystolic}
                        showError={!!errors.bpSystolic}
                        errorMessage={errors.bpSystolic?.message}
                      />
                      <Text>/</Text>
                      <CustomInput
                        {...register("bpDiastolic", {
                          required: "Diastolic blood pressure is required",
                          pattern: {
                            value: /^(?:[1-9]\d|1\d{2})$/,
                            message: "Enter a valid diastolic BP (30–150 mmHg)",
                          },
                          min: {
                            value: 30,
                            message: "Diastolic BP is too low",
                          },
                          max: {
                            value: 150,
                            message: "Diastolic BP is too high",
                          },
                        })}
                        invalid={!!errors.bpDiastolic}
                        showError={!!errors.bpDiastolic}
                        errorMessage={errors.bpDiastolic?.message}
                      />
                      <Text color="droidalGray.400" fontSize="sm">
                        mmHg
                      </Text>
                    </Flex>
                    <Flex align="center" justify="flex-end" gap={2}>
                      <Text whiteSpace="nowrap">
                        Heart Rate:{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Text>
                      <CustomInput
                        {...register("heartRate", {
                          required: "Heart rate is required",
                          pattern: {
                            value: /^(?:[1-9]\d|1\d{2}|2\d{2})$/,
                            message: "Enter a valid heart rate (20–250 bpm)",
                          },
                          min: {
                            value: 20,
                            message: "Heart rate is too low",
                          },
                          max: {
                            value: 250,
                            message: "Heart rate is too high",
                          },
                        })}
                        invalid={!!errors.heartRate}
                        showError={!!errors.heartRate}
                        errorMessage={errors.heartRate?.message}
                      />
                      <Text color="droidalGray.400" fontSize="sm">
                        bpm
                      </Text>
                    </Flex>
                    <Flex align="center" justify="flex-end" gap={2}>
                      <Text whiteSpace="nowrap">
                        Respiratory Rate:{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Text>
                      <CustomInput
                        {...register("respRate", {
                          required: "Respiratory rate is required",
                          pattern: {
                            value: /^(?:[1-9]|[1-5]\d|6[0-9])$/,
                            message:
                              "Enter a valid respiratory rate (5–60 rpm)",
                          },
                          min: {
                            value: 5,
                            message: "Respiratory rate is too low",
                          },
                          max: {
                            value: 60,
                            message: "Respiratory rate is too high",
                          },
                        })}
                        invalid={!!errors.respRate}
                        showError={!!errors.respRate}
                        errorMessage={errors.respRate?.message}
                      />
                      <Text color="droidalGray.400" fontSize="sm">
                        rpm
                      </Text>
                    </Flex>
                  </Stack>

                  {/* Column 2 */}
                  <Stack gap={5}>
                    <Flex align="center" justify="flex-end" gap={2}>
                      <Text whiteSpace="nowrap">
                        Height/Length:{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Text>
                      <CustomInput
                        {...register("heightFt", {
                          required: "Height (feet) is required",
                          pattern: {
                            value: /^[0-9]$/,
                            message: "Enter feet between 0 and 9",
                          },
                        })}
                        rightAddon="ft"
                        invalid={!!errors.heightFt}
                        showError={!!errors.heightFt}
                        errorMessage={errors.heightFt?.message}
                      />

                      <CustomInput
                        {...register("heightIn", {
                          required: "Height (inches) is required",
                          pattern: {
                            value: /^(?:[0-9]|1[01])$/,
                            message: "Inches must be between 0 and 11",
                          },
                        })}
                        invalid={!!errors.heightIn}
                        showError={!!errors.heightIn}
                        errorMessage={errors.heightIn?.message}
                      />
                      <Text color="droidalGray.400" fontSize="sm">
                        in
                      </Text>
                    </Flex>
                    <Flex align="center" justify="flex-end" gap={2}>
                      <Text whiteSpace="nowrap">
                        Weight:{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Text>
                      <CustomInput
                        {...register("weightLbs", {
                          required: "Weight (lbs) is required",
                          pattern: {
                            value: /^\d{1,3}$/,
                            message: "Enter a valid weight in pounds",
                          },
                        })}
                        invalid={!!errors.weightLbs}
                        showError={!!errors.weightLbs}
                        errorMessage={errors.weightLbs?.message}
                      />
                      <Text color="droidalGray.400" fontSize="sm">
                        lbs
                      </Text>
                      <CustomInput
                        {...register("weightOz", {
                          pattern: {
                            value: /^(?:[0-9]|1[0-5])$/,
                            message: "Ounces must be between 0 and 15",
                          },
                        })}
                        invalid={!!errors.weightOz}
                        showError={!!errors.weightOz}
                        errorMessage={errors.weightOz?.message}
                      />
                      <Text color="droidalGray.400" fontSize="sm">
                        oz
                      </Text>
                    </Flex>
                    <Flex align="center" justify="flex-end" gap={2}>
                      <Text whiteSpace="nowrap">BMI:</Text>
                      <Box textAlign="left" pl={2}>
                        <Text fontWeight="bold">{watch("bmi") || "-"}</Text>
                      </Box>
                    </Flex>
                  </Stack>

                  {/* Column 3 */}
                  <Stack gap={5}>
                    <Flex align="center" justify="flex-end" gap={2}>
                      <Text whiteSpace="nowrap">
                        Head Circ:{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Text>
                      <CustomInput
                        {...register("headCirc", {
                          required: "Head circumference is required",
                          pattern: {
                            value: /^\d{1,2}(\.\d{1,2})?$/,
                            message: "Enter a valid head circumference",
                          },
                        })}
                        invalid={!!errors.headCirc}
                        showError={!!errors.headCirc}
                        errorMessage={errors.headCirc?.message}
                      />
                      <Text color="droidalGray.400" fontSize="sm">
                        in
                      </Text>
                    </Flex>
                    <Flex align="center" justify="flex-end" gap={2}>
                      <Text whiteSpace="nowrap">
                        Temperature:{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Text>
                      <CustomInput
                        {...register("temperature", {
                          required: "Temperature is required",
                          pattern: {
                            value: /^(?:\d{2,3})(?:\.\d)?$/,
                            message: "Enter a valid temperature in °F",
                          },
                          min: {
                            value: 90,
                            message: "Temperature too low",
                          },
                          max: {
                            value: 110,
                            message: "Temperature too high",
                          },
                        })}
                        invalid={!!errors.temperature}
                        showError={!!errors.temperature}
                        errorMessage={errors.temperature?.message}
                      />
                      <Text color="droidalGray.400" fontSize="sm">
                        °F
                      </Text>
                    </Flex>
                    <Flex align="center" justify="flex-end" gap={2}>
                      <Text whiteSpace="nowrap">
                        SpO2:{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Text>
                      <CustomInput
                        {...register("spo2", {
                          required: "SpO₂ is required",
                          pattern: {
                            value: /^(?:100|[1-9]?\d)$/,
                            message: "Enter a valid SpO₂ (0–100%)",
                          },
                          min: {
                            value: 50,
                            message: "SpO₂ too low",
                          },
                          max: {
                            value: 100,
                            message: "SpO₂ cannot exceed 100%",
                          },
                        })}
                        invalid={!!errors.spo2}
                        showError={!!errors.spo2}
                        errorMessage={errors.spo2?.message}
                      />
                      <Text color="droidalGray.400" fontSize="sm">
                        %
                      </Text>
                    </Flex>
                    <Flex align="center" justify="flex-end" gap={2}>
                      <Text whiteSpace="nowrap">
                        Inhaled O2:{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </Text>
                      <CustomInput
                        {...register("inhaledO2", {
                          required: "Inhaled O₂ is required",
                          pattern: {
                            value: /^(?:100|[1-9]?\d)$/,
                            message: "Enter a value between 0 and 100%",
                          },
                        })}
                        invalid={!!errors.inhaledO2}
                        showError={!!errors.inhaledO2}
                        errorMessage={errors.inhaledO2?.message}
                      />
                      <Text color="droidalGray.400" fontSize="sm">
                        %
                      </Text>
                    </Flex>
                  </Stack>
                </SimpleGrid>

                {/* Comments */}
                <Box mb={4}>
                  <CustomTextArea
                    label={
                      <span>
                        Comments:{" "}
                        <Text as="span" color="red.500">
                          *
                        </Text>
                      </span>
                    }
                    placeholder=""
                    {...register("comments", {
                      required: "Comments are required",
                      maxLength: {
                        value: 1000,
                        message: "Maximum 1000 characters allowed",
                      },
                    })}
                    invalid={!!errors.comments}
                    showError={!!errors.comments}
                    errorMessage={errors.comments?.message}
                    minH="100px"
                  />
                </Box>
                <Text fontSize="sm" color="droidalGray.400" fontStyle="italic">
                  These vitals are editable until this encounter note is signed.
                </Text>

                {/* Footer Actions */}
                <Flex justify="flex-end" mt={8} gap={4}>
                  <CustomButton
                    variant="outline"
                    onClick={handleClose}
                    type="button"
                  >
                    Cancel
                  </CustomButton>
                  <CustomButton
                    type="submit"
                    isLoading={isCreating || isUpdating}
                  >
                    Save
                  </CustomButton>
                </Flex>
              </form>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default VitalModal;

import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  HStack,
  VStack,
  Card,
  SimpleGrid,
  Flex,
  Grid,
  GridItem,
  IconButton,
  Bleed,
  Stack,
} from "@chakra-ui/react";
import {
  Heart,
  Activity,
  Thermometer,
  Droplet,
  Scale,
  Calendar,
  Clock,
  Plus,
  ArrowLeft,
  Edit,
} from "lucide-react";
import CustomButton from "@/components/button/button";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import CustomInput from "@/components/input/input";
import CustomTextArea from "@/components/textarea/textarea";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { format } from "date-fns";
import { useCreateVitals } from "@/hooks/mutation/pms/vitals/useCreateVitals";
import { useUpdateVitals } from "@/hooks/mutation/pms/vitals/useUpdateVitals";
import { useGetVitals } from "@/hooks/query/pms/vitals/useGetVitals";
import { toaster } from "@/components/ui/toaster";

// Mock Data for the Chart (kept as is for now, could be replaced with real data)
const bpData = [
  { date: "Feb 26", systolic: 125, diastolic: 85 },
  { date: "Apr 5", systolic: 122, diastolic: 82 },
  { date: "Apr 12", systolic: 120, diastolic: 80 },
  { date: "Apr 20", systolic: 118, diastolic: 78 },
];

const VitalCard = ({
  title,
  icon: IconComponent,
  color,
  date,
  time,
  children,
  onEdit,
  mode,
  editModes,
}) => {
  console.log("editModes1212", editModes);
  return (
    <Card.Root
      bg="droidalBlack.300"
      borderColor="droidalGray.300"
      h="full"
      variant="outline"
      overflow="hidden"
      position="relative"
      borderRadius={"24px"}
    >
      {/* Background Gradient Effect */}
      <Box
        position="absolute"
        top="-50px"
        right="-50px"
        w="150px"
        h="150px"
        bg={`radial-gradient(circle, ${color}20 0%, transparent 70%)`}
        filter="blur(40px)"
        zIndex={0}
      />

      <Card.Body
        p={5}
        zIndex={1}
        display="flex"
        flexDirection="column"
        justifyContent="space-between"
        h="full"
      >
        <Flex justify="space-between" align="start" mb={4}>
          <HStack gap={3}>
            <Flex
              p={2}
              rounded="xl"
              bg={`${color}15`}
              color={color}
              align="center"
              justify="center"
              boxShadow={`0 0 15px ${color}30`}
            >
              <IconComponent size={24} strokeWidth={2.5} />
            </Flex>
            <Text fontSize="lg" fontWeight="medium" color="white">
              {title}
            </Text>
          </HStack>
          {!editModes && (
            <>
              <IconButton
                size="sm"
                variant="ghost"
                color="droidalGray.400"
                _hover={{ color: "white", bg: "whiteAlpha.200" }}
                onClick={onEdit}
              >
                <Edit size={16} />
              </IconButton>
            </>
          )}
        </Flex>

        <Box mb={4}>{children}</Box>

        <Flex
          mt="auto"
          pt={4}
          borderTop="1px dashed"
          borderColor="droidalGray.300"
          justify="space-between"
          align="center"
        >
          <HStack color="droidalGray.400" fontSize="xs">
            <Text whiteSpace={"nowrap"}>
              {mode === "edit" ? "Last Update:" : "Date:"}
            </Text>
            <HStack bg="blackAlpha.400" px={2} py={1} rounded="md" gap={2}>
              <Text color="white">{date || "--"}</Text>
              <Calendar size={12} />
            </HStack>
          </HStack>

          <HStack color="droidalGray.400" fontSize="xs">
            <Text>Time:</Text>
            <HStack bg="blackAlpha.400" px={2} py={1} rounded="md" gap={2}>
              <Text color="white">{time || "--"}</Text>
              <Clock size={12} />
            </HStack>
          </HStack>
        </Flex>
      </Card.Body>
    </Card.Root>
  );
};

const defaultFormValues = {
  recordedDate: new Date(),
  recordedTime: new Date().toTimeString().slice(0, 5),
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
};

const VitalEncounterView = () => {
  const navigate = useNavigate();
  const { patient_id: patientId } = useParams();
  const [selectedVitalId, setSelectedVitalId] = useState(null);
  const [mode, setMode] = useState("add");
  const [editModes, setEditModes] = useState(false);

  const { mutate: createVitals, isPending: isCreating } = useCreateVitals();
  const { mutate: updateVitals, isPending: isUpdating } = useUpdateVitals();
  const { data: vitalsRes } = useGetVitals(patientId);

  const vitalsList = vitalsRes?.vitals || [];

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultFormValues,
    mode: "onChange",
  });

  const heightFt = watch("heightFt");
  const heightIn = watch("heightIn");
  const weightLbs = watch("weightLbs");
  const weightOz = watch("weightOz");
  const recordedDate = watch("recordedDate");
  const recordedTime = watch("recordedTime");

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
      setValue("bmi", "");
    }
  }, [heightFt, heightIn, weightLbs, weightOz, setValue]);

  // When date changes or vitals load, find matching vital
  // useEffect(() => {
  //   if (vitalsList && recordedDate) {
  //     const selectedDateStr = format(new Date(recordedDate), "yyyy-MM-dd");

  //     const matchingVital = vitalsList.find((v) => {
  //       if (!v.recorded_at) return false;
  //       const vDate = format(new Date(v.recorded_at), "yyyy-MM-dd");
  //       return vDate === selectedDateStr;
  //     });

  //     if (matchingVital) {
  //       setSelectedVitalId(matchingVital.id);
  //       const heightInTotal = matchingVital.height_in || 0;
  //       const heightFt = Math.floor(heightInTotal / 12);
  //       const heightInRemainder = heightInTotal % 12;

  //       reset({
  //         recordedDate: matchingVital.recorded_at
  //           ? new Date(matchingVital.recorded_at)
  //           : new Date(recordedDate),
  //         recordedTime: matchingVital.recorded_at
  //           ? format(new Date(matchingVital.recorded_at), "HH:mm")
  //           : format(new Date(), "HH:mm"),
  //         bpSystolic: matchingVital.systolic_bp || "",
  //         bpDiastolic: matchingVital.diastolic_bp || "",
  //         heightFt: heightFt || "",
  //         heightIn: heightInRemainder || "",
  //         headCirc: matchingVital.head_circumference_in || "",
  //         heartRate: matchingVital.heart_rate || "",
  //         weightLbs: matchingVital.weight_lbs || "",
  //         weightOz: matchingVital.weight_oz || "",
  //         temperature: matchingVital.temperature_f || "",
  //         respRate: matchingVital.respiratory_rate || "",
  //         bmi: matchingVital.bmi || "",
  //         spo2: matchingVital.spo2 || "",
  //         inhaledO2: matchingVital.inhaled_o2 || "",
  //         comments: matchingVital.comments || "",
  //       });
  //     } else {
  //       setSelectedVitalId(null);
  //       reset({
  //         recordedDate: new Date(recordedDate),
  //         recordedTime: format(new Date(), "HH:mm"),
  //         bpSystolic: "",
  //         bpDiastolic: "",
  //         heightFt: "",
  //         heightIn: "",
  //         headCirc: "",
  //         heartRate: "",
  //         weightLbs: "",
  //         weightOz: "",
  //         temperature: "",
  //         respRate: "",
  //         bmi: "",
  //         spo2: "",
  //         inhaledO2: "",
  //         comments: "",
  //       });
  //     }
  //   }
  // }, [recordedDate, vitalsList, reset]);

  const handleAutoPopulate = (vitalsRecord) => {
    setMode("edit");
    setSelectedVitalId(vitalsRecord.id);

    const heightInTotal = vitalsRecord.height_in || 0;
    const heightFt = Math.floor(heightInTotal / 12);
    const heightInRemainder = heightInTotal % 12;

    reset({
      recordedDate: vitalsRecord.recorded_at
        ? new Date(vitalsRecord.recorded_at)
        : null,
      recordedTime: vitalsRecord.recorded_at
        ? format(new Date(vitalsRecord.recorded_at), "HH:mm")
        : "",
      bpSystolic: vitalsRecord.systolic_bp || "",
      bpDiastolic: vitalsRecord.diastolic_bp || "",
      heightFt: heightFt || "",
      heightIn: heightInRemainder || "",
      headCirc: vitalsRecord.head_circumference_in || "",
      heartRate: vitalsRecord.heart_rate || "",
      weightLbs: vitalsRecord.weight_lbs || "",
      weightOz: vitalsRecord.weight_oz || "",
      temperature: vitalsRecord.temperature_f || "",
      respRate: vitalsRecord.respiratory_rate || "",
      bmi: vitalsRecord.bmi || "",
      spo2: vitalsRecord.spo2 || "",
      inhaledO2: vitalsRecord.inhaled_o2 || "",
      comments: vitalsRecord.comments || "",
    });
  };

  const handleAddMode = () => {
    setMode("add");
    setSelectedVitalId(null);
    reset(defaultFormValues);
    setEditModes(false);
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
      // Optionally reset edit modes here
      setEditModes(false);
    };

    if (mode === "edit" && selectedVitalId) {
      updateVitals({ ...payload, id: selectedVitalId }, { onSuccess });
    } else {
      createVitals(payload, { onSuccess });
    }
  };

  const toggleEdit = () => {
    setEditModes(true);
  };

  const formattedDate = recordedDate
    ? format(new Date(recordedDate), "MMM dd, yyyy")
    : "--";
  const formattedTime = recordedTime || "--";

  // Render helpers
  const renderValueOrInput = (key, renderInput, renderValue) => {
    if (editModes) {
      return renderInput();
    }
    return (
      <Box
        cursor="pointer"
        onClick={() => toggleEdit(key)}
        min
        display="flex"
        alignItems="center"
        justifyContent="center"
        w="full"
      >
        {renderValue()}
      </Box>
    );
  };

  return (
    <Bleed inline={4}>
      <form
        onSubmit={handleSubmit(onSubmit)}
        style={{ height: "100%", display: "flex", flexDirection: "column" }}
      >
        <Box flex={1} p={6} height="full" bg="transparent" overflowY="auto">
          {/* Top Header */}
          <Card.Root bg="transparent" borderColor={"transparent"} mb={6}>
            <Card.Body py={3} px={0}>
              <Flex
                justify="space-between"
                align="center"
                flexWrap="wrap"
                gap={4}
              >
                <HStack gap={4}>
                  <IconButton
                    onClick={() => navigate(-1)}
                    variant="ghost"
                    color="white"
                    colorScheme={"blackAlpha"}
                    p={0}
                    _hover={{
                      bg: "transparent",
                    }}
                  >
                    <ArrowLeft />
                  </IconButton>
                  <Text
                    fontSize="2xl"
                    letterSpacing={"wider"}
                    fontWeight="medium"
                    color="white"
                  >
                    Vitals
                  </Text>
                </HStack>

                <HStack gap={3}>
                  <Text flexShrink={0} color="droidalGray.400" fontSize="sm">
                    Select Recording Date
                  </Text>

                  <Box w="180px">
                    <Controller
                      name="recordedDate"
                      control={control}
                      rules={{ required: "Date is required" }}
                      render={({ field }) => (
                        <CustomDatePicker
                          value={field.value}
                          onValueChange={field.onChange}
                          inputProps={{
                            size: "sm",
                            isInvalid: !!errors.recordedDate,
                          }}
                        />
                      )}
                    />
                  </Box>
                  <Box w="150px">
                    <CustomInput
                      type="time"
                      {...register("recordedTime", {
                        required: "Time is required",
                      })}
                      invalid={!!errors.recordedTime}
                    />
                  </Box>
                </HStack>
              </Flex>
            </Card.Body>
          </Card.Root>

          <Grid templateColumns={{ base: "1fr", lg: "1fr 380px" }} gap={6}>
            {/* Main Vitals Grid */}
            <GridItem>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={5}>
                {/* Heart Rate */}
                <VitalCard
                  title="Heart Rate"
                  unit="bpm"
                  icon={Heart}
                  color="#ef4444"
                  date={formattedDate}
                  time={formattedTime}
                  onEdit={() => toggleEdit("heartRate")}
                  mode={mode}
                  editModes={editModes}
                >
                  {renderValueOrInput(
                    "heartRate",
                    () => (
                      <HStack align="baseline">
                        <CustomInput
                          placeholder="--"
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
                          textAlign="center"
                          fontSize="2xl"
                          fontWeight="bold"
                          autoFocus
                        />
                        <Text fontSize="md" color="droidalGray.400">
                          bpm
                        </Text>
                      </HStack>
                    ),
                    () => (
                      <Text fontSize="4xl" fontWeight="bold" color="white">
                        {watch("heartRate") || "--"}{" "}
                        <Text as="span" fontSize="lg" color="droidalGray.400">
                          bpm
                        </Text>
                      </Text>
                    ),
                  )}
                  {errors.heartRate && (
                    <Text fontSize="xs" color="red.400">
                      {errors.heartRate.message}
                    </Text>
                  )}
                </VitalCard>

                {/* Blood Pressure */}
                <VitalCard
                  title="Blood Pressure"
                  unit="mmHg"
                  icon={Activity}
                  color="#3b82f6"
                  date={formattedDate}
                  time={formattedTime}
                  onEdit={() => toggleEdit("bp")}
                  editModes={editModes}
                  mode={mode}
                >
                  {renderValueOrInput(
                    "bp",
                    () => (
                      <VStack>
                        <HStack gap={2} align="center">
                          <CustomInput
                            placeholder="Sys"
                            {...register("bpSystolic", {
                              required: "Systolic blood pressure is required",
                              pattern: {
                                value: /^(?:[1-9]\d|[1-2]\d{2})$/,
                                message:
                                  "Enter a valid systolic BP (50–250 mmHg)",
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
                            textAlign="center"
                            fontSize="xl"
                            fontWeight="bold"
                            autoFocus
                          />
                          <Text fontSize="2xl" color="droidalGray.400">
                            /
                          </Text>
                          <CustomInput
                            placeholder="Dia"
                            {...register("bpDiastolic", {
                              required: "Diastolic blood pressure is required",
                              pattern: {
                                value: /^(?:[1-9]\d|1\d{2})$/,
                                message:
                                  "Enter a valid diastolic BP (30–150 mmHg)",
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
                            textAlign="center"
                            fontSize="xl"
                            fontWeight="bold"
                          />
                        </HStack>
                        {(errors.bpSystolic || errors.bpDiastolic) && (
                          <VStack gap={0} align="center">
                            {errors.bpSystolic && (
                              <Text fontSize="xs" color="red.400">
                                {errors.bpSystolic.message}
                              </Text>
                            )}
                            {errors.bpDiastolic && (
                              <Text fontSize="xs" color="red.400">
                                {errors.bpDiastolic.message}
                              </Text>
                            )}
                          </VStack>
                        )}
                      </VStack>
                    ),
                    () => (
                      <Text fontSize="4xl" fontWeight="bold" color="white">
                        {watch("bpSystolic") || "--"}/
                        {watch("bpDiastolic") || "--"}{" "}
                        <Text as="span" fontSize="lg" color="droidalGray.400">
                          mmHg
                        </Text>
                      </Text>
                    ),
                  )}
                </VitalCard>

                {/* Respiratory Rate */}
                <VitalCard
                  title="Respiratory Rate"
                  unit="rpm"
                  icon={Activity}
                  color="#10b981"
                  date={formattedDate}
                  time={formattedTime}
                  onEdit={() => toggleEdit("respRate")}
                  editModes={editModes}
                  mode={mode}
                >
                  {renderValueOrInput(
                    "respRate",
                    () => (
                      <HStack align="baseline">
                        <CustomInput
                          placeholder="--"
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
                          textAlign="center"
                          fontSize="2xl"
                          fontWeight="bold"
                          autoFocus
                        />
                        <Text fontSize="md" color="droidalGray.400">
                          rpm
                        </Text>
                      </HStack>
                    ),
                    () => (
                      <Text fontSize="4xl" fontWeight="bold" color="white">
                        {watch("respRate") || "--"}{" "}
                        <Text as="span" fontSize="lg" color="droidalGray.400">
                          rpm
                        </Text>
                      </Text>
                    ),
                  )}
                  {errors.respRate && (
                    <Text fontSize="xs" color="red.400">
                      {errors.respRate.message}
                    </Text>
                  )}
                </VitalCard>

                {/* SpO2 */}
                <VitalCard
                  title="SpO2"
                  unit="%"
                  icon={Droplet}
                  color="#1a5dad"
                  date={formattedDate}
                  time={formattedTime}
                  onEdit={() => toggleEdit("spo2")}
                  editModes={editModes}
                  mode={mode}
                >
                  {renderValueOrInput(
                    "spo2",
                    () => (
                      <VStack>
                        <HStack gap={2} align="stretch">
                          <HStack align="baseline">
                            <CustomInput
                              placeholder="--"
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
                              textAlign="center"
                              fontSize="2xl"
                              fontWeight="bold"
                              autoFocus
                            />
                            <Text fontSize="md" color="droidalGray.400">
                              %
                            </Text>
                          </HStack>
                          <HStack>
                            <CustomInput
                              placeholder="Inhaled O2 %"
                              {...register("inhaledO2", {
                                required: "Inhaled O₂ is required",
                                pattern: {
                                  value: /^(?:100|[1-9]?\d)$/,
                                  message: "Enter a value between 0 and 100%",
                                },
                              })}
                              invalid={!!errors.inhaledO2}
                              size="sm"
                            />
                          </HStack>
                        </HStack>
                        {(errors.spo2 || errors.inhaledO2) && (
                          <VStack gap={0} align="center">
                            {errors.spo2 && (
                              <Text fontSize="xs" color="red.400">
                                {errors.spo2.message}
                              </Text>
                            )}
                            {errors.inhaledO2 && (
                              <Text fontSize="xs" color="red.400">
                                {errors.inhaledO2.message}
                              </Text>
                            )}
                          </VStack>
                        )}
                      </VStack>
                    ),
                    () => (
                      <HStack gap={2} align="center">
                        <Text fontSize="4xl" fontWeight="bold" color="white">
                          {watch("spo2") || "--"}{" "}
                          <Text as="span" fontSize="lg" color="droidalGray.400">
                            %
                          </Text>
                        </Text>
                        {watch("inhaledO2") && (
                          <Text fontSize="sm" color="droidalGray.400">
                            Inhaled O2: {watch("inhaledO2")}%
                          </Text>
                        )}
                      </HStack>
                    ),
                  )}
                </VitalCard>

                {/* Temperature */}
                <VitalCard
                  title="Temperature"
                  unit="°F"
                  icon={Thermometer}
                  color="#f97316"
                  date={formattedDate}
                  time={formattedTime}
                  onEdit={() => toggleEdit("temperature")}
                  editModes={editModes}
                  mode={mode}
                >
                  {renderValueOrInput(
                    "temperature",
                    () => (
                      <HStack align="baseline">
                        <CustomInput
                          placeholder="--"
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
                          textAlign="center"
                          fontSize="2xl"
                          fontWeight="bold"
                          autoFocus
                        />
                        <Text fontSize="md" color="droidalGray.400">
                          °F
                        </Text>
                      </HStack>
                    ),
                    () => (
                      <Text fontSize="4xl" fontWeight="bold" color="white">
                        {watch("temperature") || "--"}{" "}
                        <Text as="span" fontSize="lg" color="droidalGray.400">
                          °F
                        </Text>
                      </Text>
                    ),
                  )}
                  {errors.temperature && (
                    <Text fontSize="xs" color="red.400">
                      {errors.temperature.message}
                    </Text>
                  )}
                </VitalCard>

                {/* Height */}
                <VitalCard
                  title="Height"
                  icon={Scale}
                  color="#a855f7"
                  date={formattedDate}
                  time={formattedTime}
                  editModes={editModes}
                  mode={mode}
                  onEdit={() => toggleEdit("height")}
                >
                  {renderValueOrInput(
                    "height",
                    () => (
                      <VStack>
                        <HStack gap={2}>
                          <CustomInput
                            placeholder="ft"
                            {...register("heightFt", {
                              required: "Height (feet) is required",
                              pattern: {
                                value: /^[0-9]$/,
                                message: "Enter feet between 0 and 9",
                              },
                            })}
                            invalid={!!errors.heightFt}
                            textAlign="center"
                            autoFocus
                          />
                          <Text color="droidalGray.400">ft</Text>
                          <CustomInput
                            placeholder="in"
                            {...register("heightIn", {
                              required: "Height (inches) is required",
                              pattern: {
                                value: /^(?:[0-9]|1[01])$/,
                                message: "Inches must be between 0 and 11",
                              },
                            })}
                            invalid={!!errors.heightIn}
                            textAlign="center"
                          />
                          <Text color="droidalGray.400">in</Text>
                        </HStack>
                        {(errors.heightFt || errors.heightIn) && (
                          <VStack gap={0} align="center">
                            {errors.heightFt && (
                              <Text fontSize="xs" color="red.400">
                                {errors.heightFt.message}
                              </Text>
                            )}
                            {errors.heightIn && (
                              <Text fontSize="xs" color="red.400">
                                {errors.heightIn.message}
                              </Text>
                            )}
                          </VStack>
                        )}
                      </VStack>
                    ),
                    () => (
                      <Text fontSize="4xl" fontWeight="bold" color="white">
                        {watch("heightFt") || "--"}
                        <Text as="span" fontSize="lg" color="droidalGray.400">
                          ft
                        </Text>{" "}
                        {watch("heightIn") || "--"}
                        <Text as="span" fontSize="lg" color="droidalGray.400">
                          in
                        </Text>
                      </Text>
                    ),
                  )}
                </VitalCard>

                {/* Weight */}
                <VitalCard
                  title="Weight"
                  icon={Scale}
                  color="#ec4899"
                  date={formattedDate}
                  time={formattedTime}
                  onEdit={() => toggleEdit("weight")}
                  editModes={editModes}
                  mode={mode}
                >
                  {renderValueOrInput(
                    "weight",
                    () => (
                      <VStack>
                        <HStack gap={2}>
                          <CustomInput
                            placeholder="lbs"
                            {...register("weightLbs", {
                              required: "Weight (lbs) is required",
                              pattern: {
                                value: /^\d{1,3}$/,
                                message: "Enter a valid weight in pounds",
                              },
                            })}
                            invalid={!!errors.weightLbs}
                            textAlign="center"
                            autoFocus
                          />
                          <Text color="droidalGray.400">lbs</Text>
                          <CustomInput
                            placeholder="oz"
                            {...register("weightOz", {
                              required: "Weight (oz) is required",
                              pattern: {
                                value: /^(?:[0-9]|1[0-5])$/,
                                message: "Ounces must be between 0 and 15",
                              },
                            })}
                            invalid={!!errors.weightOz}
                            textAlign="center"
                          />
                          <Text color="droidalGray.400">oz</Text>
                        </HStack>
                        {(errors.weightLbs || errors.weightOz) && (
                          <VStack gap={0} align="center">
                            {errors.weightLbs && (
                              <Text fontSize="xs" color="red.400">
                                {errors.weightLbs.message}
                              </Text>
                            )}
                            {errors.weightOz && (
                              <Text fontSize="xs" color="red.400">
                                {errors.weightOz.message}
                              </Text>
                            )}
                          </VStack>
                        )}
                      </VStack>
                    ),
                    () => (
                      <Text fontSize="4xl" fontWeight="bold" color="white">
                        {watch("weightLbs") || "--"}
                        <Text as="span" fontSize="lg" color="droidalGray.400">
                          lbs
                        </Text>{" "}
                        {watch("weightOz") || "--"}
                        <Text as="span" fontSize="lg" color="droidalGray.400">
                          oz
                        </Text>
                      </Text>
                    ),
                  )}
                </VitalCard>

                {/* BMI */}
                <VitalCard
                  title="BMI"
                  unit=""
                  icon={Scale}
                  color="#84cc16"
                  date={formattedDate}
                  time={formattedTime}
                  editModes={editModes}
                  mode={mode}
                >
                  <HStack align="baseline" justify="center">
                    <Text fontSize="4xl" fontWeight="bold" color="white">
                      {watch("bmi") || "--"}
                    </Text>
                  </HStack>
                </VitalCard>

                {/* Head Circumference */}
                <VitalCard
                  title="Head Circ."
                  unit="in"
                  icon={Activity}
                  color="#6366f1"
                  date={formattedDate}
                  time={formattedTime}
                  onEdit={() => toggleEdit("headCirc")}
                  editModes={editModes}
                  mode={mode}
                >
                  {renderValueOrInput(
                    "headCirc",
                    () => (
                      <HStack align="baseline">
                        <CustomInput
                          placeholder="--"
                          {...register("headCirc", {
                            required: "Head circumference is required",
                            pattern: {
                              value: /^\d{1,2}(\.\d{1,2})?$/,
                              message: "Enter a valid head circumference",
                            },
                          })}
                          invalid={!!errors.headCirc}
                          textAlign="center"
                          fontSize="2xl"
                          fontWeight="bold"
                          autoFocus
                        />
                        <Text fontSize="md" color="droidalGray.400">
                          in
                        </Text>
                      </HStack>
                    ),
                    () => (
                      <Text fontSize="4xl" fontWeight="bold" color="white">
                        {watch("headCirc") || "--"}{" "}
                        <Text as="span" fontSize="lg" color="droidalGray.400">
                          in
                        </Text>
                      </Text>
                    ),
                  )}
                  {errors.headCirc && (
                    <Text fontSize="xs" color="red.400">
                      {errors.headCirc.message}
                    </Text>
                  )}
                </VitalCard>
              </SimpleGrid>
            </GridItem>

            {/* Right Sidebar */}
            <GridItem display="flex" flexDirection="column" gap={6}>
              {/* Actions */}
              <VStack>
                <Text
                  fontSize="lg"
                  fontWeight="light"
                  textAlign={"left"}
                  color="white"
                  flex={1}
                  alignSelf={"flex-start"}
                >
                  Actions
                </Text>

                <CustomTextArea
                  placeholder="Add comments here..."
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
                />
                {/* Save Button */}
                <HStack w="full" gap={2}>
                  <CustomButton
                    type="submit"
                    flex={1}
                    isLoading={isCreating || isUpdating}
                  >
                    {mode === "edit" ? "Update Vitals" : "Save Vitals"}
                  </CustomButton>
                  {mode === "edit" && (
                    <CustomButton
                      type="button"
                      onClick={handleAddMode}
                      w="fit-content"
                      px={3}
                      variant="outline"
                    >
                      + Vitals
                    </CustomButton>
                  )}
                </HStack>
              </VStack>

              {/* Trend Chart */}
              <Box>
                <Text fontSize="lg" fontWeight="light" color="white" mb={4}>
                  Vitals Trends
                </Text>
                <Card.Root
                  bg="droidalBlack.300"
                  borderColor="droidalGray.300"
                  p={4}
                >
                  <Card.Body p={0}>
                    <HStack mb={6} gap={4}>
                      <HStack gap={2}>
                        <Box w="12px" h="12px" bg="#3b82f6" rounded="sm" />
                        <Text fontSize="xs" color="droidalGray.400">
                          Systolic
                        </Text>
                      </HStack>
                      <HStack gap={2}>
                        <Box w="12px" h="12px" bg="#1a5dad" rounded="sm" />
                        <Text fontSize="xs" color="droidalGray.400">
                          Diastolic BP
                        </Text>
                      </HStack>
                    </HStack>

                    <Box h="200px" w="100%">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          margin={{
                            left: -20,
                            right: 20,
                          }}
                          data={bpData}
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="#333"
                          />
                          <XAxis
                            dataKey="date"
                            tick={{ fontSize: 12, fill: "#666" }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <YAxis
                            tick={{ fontSize: 12, fill: "#666" }}
                            axisLine={false}
                            tickLine={false}
                            domain={[60, 160]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "#111",
                              border: "1px solid #333",
                            }}
                            itemStyle={{ fontSize: "12px" }}
                          />
                          <Line
                            type="monotone"
                            dataKey="systolic"
                            stroke="#3b82f6"
                            strokeWidth={2}
                            dot={{ fill: "#3b82f6", r: 4 }}
                          />
                          <Line
                            type="monotone"
                            dataKey="diastolic"
                            stroke="#1a5dad"
                            strokeWidth={2}
                            dot={{ fill: "#1a5dad", r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </Card.Body>
                </Card.Root>
              </Box>

              {/* Earlier Dates (List of previous vitals) */}
              <Box>
                <Text fontSize="lg" fontWeight="light" color="white" mb={4}>
                  History
                </Text>
                <VStack align="stretch" gap={0} maxH="300px" overflowY="auto">
                  {vitalsList &&
                    vitalsList.map((vital, index) => (
                      <HStack
                        key={vital.id || index}
                        py={3}
                        px={2}
                        cursor="pointer"
                        color={
                          selectedVitalId === vital.id
                            ? "white"
                            : "droidalGray.400"
                        }
                        bg={
                          selectedVitalId === vital.id
                            ? "whiteAlpha.200"
                            : "transparent"
                        }
                        _hover={{ color: "white", bg: "whiteAlpha.100" }}
                        borderBottom="1px solid"
                        borderColor="droidalGray.300"
                        _last={{ borderBottom: "none" }}
                        onClick={() => handleAutoPopulate(vital)}
                      >
                        <Box
                          w="6px"
                          h="6px"
                          rounded="full"
                          bg={
                            selectedVitalId === vital.id
                              ? "cyan.400"
                              : "gray.600"
                          }
                        />
                        <Text fontSize="sm">
                          {vital.recorded_at
                            ? format(
                                new Date(vital.recorded_at),
                                "MMM dd, yyyy HH:mm",
                              )
                            : "Unknown Date"}
                        </Text>
                      </HStack>
                    ))}
                </VStack>
              </Box>
            </GridItem>
          </Grid>
        </Box>
      </form>
    </Bleed>
  );
};

export default VitalEncounterView;

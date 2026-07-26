import React, { useState, useMemo, useEffect, useRef } from "react";
import { useForm, Controller, useWatch } from "react-hook-form";
import {
  Dialog,
  Portal,
  HStack,
  VStack,
  CloseButton,
  RadioGroup,
  Text,
  Box,
  Icon,
} from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import CustomSelect from "@/components/ui/select";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import CustomTextArea from "@/components/textarea/textarea";
import { mockICD10, mockSNOMED } from "@/_data/icd";
import { Calendar as CalendarIcon, ChevronDown, ChevronUp } from "lucide-react";
import { useCreateProblems } from "@/hooks/mutation/pms/problems/useCreateProblems";
import { useUpdateProblems } from "@/hooks/mutation/pms/problems/useUpdateProblems";
import { useParams } from "react-router-dom";

const AddEditProblems = ({ isOpen, onClose, problem }) => {
  const { patient_id: patientId } = useParams();
  const formRef = useRef();
  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      status: "Active",
      icdValue: [],
      snomedValue: [],
      type: "Acute",
      startDate: new Date(),
      endDate: null,
      comments: "",
    },
  });

  const icdValue = useWatch({ control, name: "icdValue" });
  const comments = useWatch({ control, name: "comments" });

  const { mutate: createProblem, isPending: isCreating } = useCreateProblems();
  const { mutate: updateProblem, isPending: isUpdating } = useUpdateProblems();

  // Details State
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  useEffect(() => {
    if (isOpen && problem) {
      reset({
        status:
          problem.status.charAt(0).toUpperCase() + problem.status.slice(1),
        icdValue: [problem.icd10_code],
        snomedValue: [problem.snomed_code],
        type:
          problem.problem_type.charAt(0).toUpperCase() +
          problem.problem_type.slice(1),
        startDate: problem.start_date
          ? new Date(problem.start_date)
          : new Date(),
        endDate: problem.end_date ? new Date(problem.end_date) : null,
        comments: problem.comments || "",
      });
      setIsDetailsOpen(true); // Open details if editing? Optional.
    } else if (isOpen) {
      reset({
        status: "Active",
        icdValue: [],
        snomedValue: [],
        type: "Acute",
        startDate: new Date(),
        endDate: null,
        comments: "",
      });
      setIsDetailsOpen(false);
    }
  }, [isOpen, problem, reset]);

  // Prepare ICD options
  const icdOptions = useMemo(() => {
    return mockICD10.map((item) => ({
      label: `${item.code} - ${item.description}`,
      value: item.code,
    }));
  }, []);

  // Prepare SNOMED options based on selected ICD
  const snomedOptions = useMemo(() => {
    const selectedCode = icdValue?.[0];
    if (!selectedCode || !mockSNOMED[selectedCode]) return [];

    return mockSNOMED[selectedCode].map((item) => ({
      label: `${item.code} - ${item.description}`,
      value: item.code,
    }));
  }, [icdValue]);

  const handleClose = () => {
    reset({
      status: "Active",
      icdValue: [],
      snomedValue: [],
      type: "Acute",
      startDate: new Date(),
      endDate: null,
      comments: "",
    });
    setIsDetailsOpen(false);
    onClose();
  };

  const onSubmit = (data) => {
    const icdCode = data.icdValue[0];
    const icdObj = mockICD10.find((i) => i.code === icdCode);
    const icdName = icdObj ? icdObj.description : "";

    const snomedCode = data.snomedValue[0];
    // Need to find snomed name. Since options are generated based on icdCode:
    const currentSnomedOptions = mockSNOMED[icdCode] || [];
    const snomedObj = currentSnomedOptions.find((s) => s.code === snomedCode);
    const snomedName = snomedObj ? snomedObj.description : "";

    const formatDate = (date) =>
      date ? date.toISOString().split("T")[0] : null;

    const payload = {
      patient: patientId,
      icd_name: icdName,
      snomed_name: snomedName,
      icd10_code: icdCode,
      snomed_code: snomedCode,
      status: data.status.toLowerCase(),
      problem_type: data.type.toLowerCase(),
      start_date: formatDate(data.startDate),
      end_date: formatDate(data.endDate),
      comments: data.comments,
    };

    // console.log("payload", payload);

    if (problem?.id) {
      updateProblem(
        { ...payload, id: problem.id },
        {
          onSuccess: () => {
            handleClose();
          },
        }
      );
    } else {
      createProblem(payload, {
        onSuccess: () => {
          handleClose();
        },
      });
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => !details.open && handleClose()}
      placement="center"
      motionPreset="slide-in-bottom"
      size="lg"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bgColor="droidalBlack.300"
            color="white"
            borderRadius="md"
            minW="600px"
          >
            <Dialog.Header
              borderBottom="1px solid"
              borderColor="droidalGray.300"
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Dialog.Title fontSize="xl" my={0} fontWeight="light">
                Add to Problem List
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                size="lg"
                pos="absolute"
                top="2"
                right="2"
                color="droidalGray.300"
                _hover={{ color: "white", bgColor: "transparent" }}
                onClick={handleClose}
              />
            </Dialog.CloseTrigger>

            <Dialog.Body py={6}>
              <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
                <VStack align="stretch" gap={6}>
                  {/* Status Radio Group */}
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <RadioGroup.Root
                        value={field.value}
                        onValueChange={(e) => field.onChange(e.value)}
                        display="inline-flex"
                      >
                        <HStack gap={4}>
                          <RadioGroup.Item value="Active" cursor="pointer">
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemControl
                              borderColor="#00BBF2"
                              _checked={{
                                bg: "var(--bg-blue-gradient)",
                                borderColor: "#00BBF2",
                              }}
                            />
                            <RadioGroup.ItemText
                              fontSize="sm"
                              fontWeight={"light"}
                              letterSpacing={"wide"}
                              color="droidalGray.100"
                            >
                              Active
                            </RadioGroup.ItemText>
                          </RadioGroup.Item>
                          <RadioGroup.Item value="Inactive" cursor="pointer">
                            <RadioGroup.ItemHiddenInput />
                            <RadioGroup.ItemControl
                              borderColor="#00BBF2"
                              _checked={{
                                bg: "var(--bg-blue-gradient)",
                                borderColor: "#00BBF2",
                              }}
                            />
                            <RadioGroup.ItemText
                              fontSize="sm"
                              fontWeight={"light"}
                              letterSpacing={"wide"}
                              color="droidalGray.100"
                            >
                              Inactive
                            </RadioGroup.ItemText>
                          </RadioGroup.Item>
                        </HStack>
                      </RadioGroup.Root>
                    )}
                  />

                  {/* ICD-10 Select */}
                  <HStack align="start" gap={4}>
                    <Text
                      width="80px"
                      textAlign="right"
                      fontSize="sm"
                      color="droidalGray.100"
                      fontWeight={"light"}
                      letterSpacing={"wide"}
                    >
                      ICD-10{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <HStack flex={1} align="start" gap={2}>
                      <Box flex={1}>
                        <Controller
                          name="icdValue"
                          control={control}
                          rules={{ required: "ICD-10 is required" }}
                          render={({ field }) => (
                            <CustomSelect
                              options={icdOptions}
                              value={field.value}
                              onValueChange={(val) => {
                                field.onChange(val);
                                setValue("snomedValue", []);
                              }}
                              placeholder="Search for problem or ICD-10 code"
                            />
                          )}
                        />
                        {errors.icdValue && (
                          <Text color="red.500" fontSize="xs" mt={1}>
                            {errors.icdValue.message}
                          </Text>
                        )}
                      </Box>
                      <CustomButton variant="outline" size="sm" width="80px">
                        Browse
                      </CustomButton>
                    </HStack>
                  </HStack>

                  {/* SNOMED Select */}
                  <HStack align="start" gap={4}>
                    <Text
                      width="80px"
                      textAlign="right"
                      fontSize="sm"
                      color="droidalGray.100"
                      fontWeight={"light"}
                      letterSpacing={"wide"}
                    >
                      SNOMED{" "}
                      <Text as="span" color="red.500">
                        *
                      </Text>
                    </Text>
                    <Box flex={1}>
                      <Controller
                        name="snomedValue"
                        control={control}
                        rules={{ required: "SNOMED is required" }}
                        render={({ field }) => (
                          <CustomSelect
                            options={snomedOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Search for problem or SNOMED code"
                            disabled={snomedOptions.length === 0}
                          />
                        )}
                      />
                      {errors.snomedValue && (
                        <Text color="red.500" fontSize="xs" mt={1}>
                          {errors.snomedValue.message}
                        </Text>
                      )}
                    </Box>
                  </HStack>

                  <HStack
                    justify="flex-end"
                    cursor="pointer"
                    onClick={() => setIsDetailsOpen(!isDetailsOpen)}
                  >
                    <Text
                      fontSize="sm"
                      letterSpacing={"wider"}
                      color="primary.300"
                    >
                      Details
                    </Text>
                    <Icon color="primary.300">
                      {isDetailsOpen ? (
                        <ChevronUp size={16} />
                      ) : (
                        <ChevronDown size={16} />
                      )}
                    </Icon>
                  </HStack>

                  {isDetailsOpen && (
                    <VStack align="stretch" gap={4}>
                      {/* Type Radio Group */}
                      <HStack align="center" gap={4}>
                        <Text
                          width="80px"
                          textAlign="right"
                          fontSize="sm"
                          color="droidalGray.100"
                        >
                          Type
                        </Text>
                        <Controller
                          name="type"
                          control={control}
                          render={({ field }) => (
                            <RadioGroup.Root
                              value={field.value}
                              onValueChange={(e) => field.onChange(e.value)}
                              display="inline-flex"
                            >
                              <HStack gap={4}>
                                <RadioGroup.Item value="Acute" cursor="pointer">
                                  <RadioGroup.ItemHiddenInput />
                                  <RadioGroup.ItemControl
                                    borderColor="#00BBF2"
                                    _checked={{
                                      bg: "var(--bg-blue-gradient)",
                                      borderColor: "#00BBF2",
                                    }}
                                  />
                                  <RadioGroup.ItemText
                                    fontSize="sm"
                                    color="droidalGray.100"
                                  >
                                    Acute
                                  </RadioGroup.ItemText>
                                </RadioGroup.Item>
                                <RadioGroup.Item
                                  value="Chronic"
                                  cursor="pointer"
                                >
                                  <RadioGroup.ItemHiddenInput />
                                  <RadioGroup.ItemControl
                                    borderColor="#00BBF2"
                                    _checked={{
                                      bg: "var(--bg-blue-gradient)",
                                      borderColor: "#00BBF2",
                                    }}
                                  />
                                  <RadioGroup.ItemText
                                    fontSize="sm"
                                    color="droidalGray.100"
                                  >
                                    Chronic
                                  </RadioGroup.ItemText>
                                </RadioGroup.Item>
                              </HStack>
                            </RadioGroup.Root>
                          )}
                        />
                      </HStack>

                      {/* Start Date & End Date */}
                      <HStack gap={4}>
                        <HStack align="center" gap={4} flex={1}>
                          <Text
                            width="80px"
                            textAlign="right"
                            fontSize="sm"
                            color="droidalGray.100"
                          >
                            Start Date
                          </Text>
                          <Box flex={1}>
                            <Controller
                              name="startDate"
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
                        <HStack align="center" gap={4} flex={1}>
                          <Text
                            width="60px"
                            textAlign="right"
                            fontSize="sm"
                            color="droidalGray.100"
                          >
                            End Date
                          </Text>
                          <Box flex={1}>
                            <Controller
                              name="endDate"
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
                      </HStack>

                      {/* Comments */}
                      <HStack align="start" gap={4}>
                        <Text
                          width="80px"
                          textAlign="right"
                          fontSize="sm"
                          color="droidalGray.100"
                          mt={2}
                        >
                          Comments
                        </Text>
                        <VStack flex={1} align="stretch" gap={1}>
                          <Controller
                            name="comments"
                            control={control}
                            render={({ field }) => (
                              <CustomTextArea
                                {...field}
                                maxLength={255}
                                resize="none"
                                height="80px"
                              />
                            )}
                          />
                          <Text
                            fontSize="xs"
                            color="droidalGray.100"
                            textAlign="right"
                          >
                            {255 - (comments || "").length} characters remaining
                          </Text>
                        </VStack>
                      </HStack>
                    </VStack>
                  )}
                </VStack>
              </form>
            </Dialog.Body>

            <Dialog.Footer
              borderTop="1px solid"
              borderColor="droidalGray.300"
              py={4}
            >
              <HStack gap={4} justify="flex-end" width="full">
                <CustomButton variant="outline" onClick={handleClose}>
                  Cancel
                </CustomButton>
                <CustomButton
                  variant="outline"
                  onClick={() =>
                    reset({
                      status: "Active",
                      icdValue: [],
                      snomedValue: [],
                      type: "Acute",
                      startDate: new Date(),
                      endDate: null,
                      comments: "",
                    })
                  }
                >
                  Clear
                </CustomButton>
                <CustomButton variant="outline">
                  Save and Add Another
                </CustomButton>
                <CustomButton
                  type="submit"
                  onClick={() => {
                    formRef.current.requestSubmit();
                  }}
                  isLoading={isCreating || isUpdating}
                >
                  Save
                </CustomButton>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default AddEditProblems;

import React from "react";
import { useForm, Controller } from "react-hook-form";
import {
  Dialog,
  Portal,
  Stack,
  HStack,
  Text,
  Field,
  CloseButton,
  Icon,
} from "@chakra-ui/react";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import CustomTextArea from "@/components/textarea/textarea";
import CustomButton from "@/components/button/button";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import { toaster } from "@/components/ui/toaster";
import { CalendarIcon } from "lucide-react";
import { useCreateAllergies } from "@/hooks/mutation/pms/allergies/useCreateAllergies";
import { format } from "date-fns";
import { Span } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import { useRef } from "react";

const AllergiesModal = ({ isOpen, onClose }) => {
  const formRef = useRef(null);
  const { patient_id } = useParams();
  const { mutate, isPending } = useCreateAllergies();
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      allergen: "",
      reaction: "",
      severity: "",
      dateOfOnset: null,
      comments: "",
    },
    mode: "onChange",
  });

  const comments = watch("comments", "");
  const remainingChars = 255 - (comments?.length || 0);

  const onSubmit = (data) => {
    const payload = {
      allergen: data.allergen,
      severity: data.severity.toLowerCase(),
      reactions: data.reaction,
      date_of_onset: data.dateOfOnset
        ? format(new Date(data.dateOfOnset), "yyyy-MM-dd")
        : null,
      comments: data.comments,
      status: "active",
      patient: patient_id,
    };

    console.log("payload1212", payload);

    mutate(payload, {
      onSuccess: () => {
        toaster.success({
          title: "Allergen Added",
          description: "Allergen has been added successfully",
        });
        onClose();
        reset();
      },
      onError: (error) => {
        toaster.error({
          title: "Error",
          description: "Failed to add allergen",
        });
        console.error("Error adding allergen:", error);
      },
    });
  };

  const handleSaveAndAddAnother = (data) => {
    const payload = {
      allergen: data.allergen,
      severity: data.severity.toLowerCase(),
      reactions: data.reaction,
      date_of_onset: data.dateOfOnset
        ? format(new Date(data.dateOfOnset), "yyyy-MM-dd")
        : null,
      comments: data.comments,
      status: "active",
      patient: 1,
    };

    mutate(payload, {
      onSuccess: () => {
        toaster.success({
          title: "Allergen Added",
          description: "Allergen has been added successfully",
        });
        reset({
          allergen: "",
          reaction: "",
          severity: "",
          dateOfOnset: null,
          comments: "",
        });
      },
      onError: (error) => {
        toaster.error({
          title: "Error",
          description: "Failed to add allergen",
        });
        console.error("Error adding allergen:", error);
      },
    });
  };

  const SEVERITY_OPTIONS = [
    { label: "Mild", value: "Mild" },
    { label: "Moderate", value: "Moderate" },
    { label: "Severe", value: "Severe" },
  ];

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => !details.open && onClose()}
      placement="center"
      motionPreset="slide-in-bottom"
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
              borderBottom={"1px solid"}
              py={3}
              borderColor={"droidalGray.300"}
            >
              <Dialog.Title fontSize="lg" my={0} fontWeight="semibold">
                New Allergen
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form
                ref={formRef}
                id="allergies-form"
                onSubmit={handleSubmit(onSubmit)}
              >
                <Stack spacing={4}>
                  <Field.Root invalid={!!errors.allergen}>
                    <HStack align="center" width="full">
                      <Field.Label
                        minW="120px"
                        fontSize="sm"
                        color="droidalGray.400"
                        fontWeight="normal"
                      >
                        Allergen
                        <Span as="span" color="red.500" ml={1}>
                          *
                        </Span>
                      </Field.Label>
                      <CustomInput
                        placeholder=""
                        {...register("allergen", {
                          required: "Allergen is required",
                        })}
                        invalid={!!errors.allergen}
                      />
                    </HStack>
                    <Field.ErrorText>
                      {errors.allergen?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.reaction}>
                    <HStack align="center" width="full">
                      <Field.Label
                        minW="120px"
                        fontSize="sm"
                        color="droidalGray.400"
                        fontWeight="normal"
                      >
                        Reaction(s)
                        <Span as="span" color="red.500" ml={1}>
                          *
                        </Span>
                      </Field.Label>
                      <CustomInput
                        placeholder="Start typing a reaction"
                        {...register("reaction", {
                          required: "Reaction is required",
                        })}
                        invalid={!!errors.reaction}
                      />
                    </HStack>
                    <Field.ErrorText>
                      {errors.reaction?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.severity}>
                    <HStack align="center" width="full">
                      <Field.Label
                        minW="120px"
                        fontSize="sm"
                        color="droidalGray.400"
                        fontWeight="normal"
                      >
                        Allergy severities
                        <Span as="span" color="red.500" ml={1}>
                          *
                        </Span>
                      </Field.Label>

                      <Controller
                        name="severity"
                        control={control}
                        rules={{ required: "Severity is required" }}
                        render={({ field }) => (
                          <CustomSelect
                            options={SEVERITY_OPTIONS}
                            value={field.value ? [field.value] : []}
                            onValueChange={(val) => field.onChange(val[0])}
                            placeholder="Select severity"
                            width="full"
                          />
                        )}
                      />
                    </HStack>
                    <Field.ErrorText>
                      {errors.severity?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.dateOfOnset}>
                    <HStack align="center" width="full">
                      <Field.Label
                        minW="120px"
                        fontSize="sm"
                        color="droidalGray.400"
                        fontWeight="normal"
                      >
                        Date of Onset
                        <Span as="span" color="red.500" ml={1}>
                          *
                        </Span>
                      </Field.Label>
                      <Controller
                        name="dateOfOnset"
                        control={control}
                        rules={{ required: "Date of Onset is required" }}
                        render={({ field }) => (
                          <CustomDatePicker
                            value={field.value}
                            onValueChange={field.onChange}
                            inputProps={{ placeholder: "MM/DD/YYYY" }}
                            endElement={
                              <Icon
                                color={"droidalGray.300"}
                                _hover={{
                                  color: "white",
                                }}
                              >
                                <CalendarIcon />
                              </Icon>
                            }
                          />
                        )}
                      />
                    </HStack>
                    <Field.ErrorText>
                      {errors.dateOfOnset?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <Field.Root invalid={!!errors.comments}>
                    <HStack align="start" width="full">
                      <Field.Label
                        minW="120px"
                        fontSize="sm"
                        color="droidalGray.400"
                        mt={2}
                        fontWeight="normal"
                      >
                        Comments
                      </Field.Label>
                      <Stack width="full" spacing={1}>
                        <CustomTextArea
                          {...register("comments", {
                            maxLength: {
                              value: 255,
                              message: "Max length is 255 characters",
                            },
                          })}
                          placeholder=""
                          minH="100px"
                        />
                        <Text
                          fontSize="xs"
                          color="droidalGray.400"
                          textAlign="left"
                        >
                          {remainingChars} characters remaining
                        </Text>
                      </Stack>
                    </HStack>
                    <Field.ErrorText>
                      {errors.comments?.message}
                    </Field.ErrorText>
                  </Field.Root>
                </Stack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <HStack spacing={4} justify="flex-end" width="full">
                <CustomButton
                  variant="ghost"
                  color="white"
                  onClick={onClose}
                  fontWeight="normal"
                  _hover={{ bg: "transparent", color: "droidalBlue.500" }}
                >
                  Cancel
                </CustomButton>
                <CustomButton
                  variant="outline"
                  onClick={handleSubmit(handleSaveAndAddAnother)}
                  loading={isPending}
                >
                  Save & Add Another
                </CustomButton>
                <CustomButton
                  onClick={() => {
                    formRef.current.requestSubmit();
                  }}
                  type="submit"
                  loading={isPending}
                >
                  Save
                </CustomButton>
              </HStack>
            </Dialog.Footer>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                size="sm"
                pos="absolute"
                top="2"
                right="2"
                color="droidalGray.300"
                _hover={{ color: "white", bgColor: "transparent" }}
                onClick={onClose}
              />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default AllergiesModal;

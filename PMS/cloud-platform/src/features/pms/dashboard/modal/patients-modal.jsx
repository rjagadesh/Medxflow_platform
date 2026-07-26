import { useForm, Controller } from "react-hook-form";
import {
  Stack,
  Heading,
  Dialog,
  Portal,
  CloseButton,
  Button,
  Text,
  Flex,
  Box,
  Input,
  Field,
  HStack,
} from "@chakra-ui/react";
import { useRef, useState } from "react";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import { toaster } from "@/components/ui/toaster";

const inputStyles = {
  color: "white",
  _placeholder: { letterSpacing: "widest", color: "#90a6c6" },
  letterSpacing: "widest",
  borderColor: "#2f4d78",
  transition: "all .2s ease-in-out",
  borderRadius: "4px",
  height: "44px",
  _hover: {
    outlineColor: "transparent",
    border: "1px solid transparent",
    bgClip: "padding-box, border-box",
    backgroundOrigin: "padding-box, border-box",
    backgroundImage:
      "linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
  },
};

const FormRow = ({
  label,
  children,
  helperText,
  align = "center",
  required,
  ...props
}) => (
  <Flex
    direction={{ base: "column", md: "row" }}
    align={align}
    mb={5}
    {...props}
  >
    <Box
      w={{ base: "100%", md: "200px" }}
      mb={{ base: 2, md: 0 }}
      flexShrink={0}
    >
      <Text fontWeight="medium" color="white" fontSize="sm">
        {label}
        {required && (
          <Text as="span" color="red.500" ml={1}>
            *
          </Text>
        )}
      </Text>
    </Box>
    <Box flex={1} w="full">
      {children}
      {helperText && (
        <Text fontSize="xs" color="gray.400" mt={1}>
          {helperText}
        </Text>
      )}
    </Box>
  </Flex>
);

const sexOptions = [
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

const stateOptions = [
  { value: "AL", label: "Alabama" },
  { value: "AK", label: "Alaska" },
  { value: "AZ", label: "Arizona" },
  { value: "CA", label: "California" },
  { value: "CO", label: "Colorado" },
  { value: "FL", label: "Florida" },
  { value: "NY", label: "New York" },
  { value: "TX", label: "Texas" },
];

const PatientsModal = () => {
  const [open, setOpen] = useState(false);
  const formRef = useRef();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      firstName: "",
      lastName: "",
      dob: "",
      sex: [],
      mobilePhone: "",
      email: "",
      address: {
        street: "",
        apt: "",
        city: "",
        state: [],
        zip: "",
      },
    },
  });

  const onSubmit = (data) => {
    console.log("Form Data:", data);
    toaster.success({
      title: "Patient Created",
      description: "Successfully created new patient.",
    });
    setOpen(false);
    reset();
  };

  const handleClose = () => {
    setOpen(false);
    reset();
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      placement="center"
      size="md"
      scrollBehavior="inside"
    >
      <Dialog.Trigger asChild>
        {/* <CustomButton>Create Patient</CustomButton> */}
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bgColor="droidalBlack.300" color="white" maxH="90vh">
            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" onClick={handleClose} />
            </Dialog.CloseTrigger>
            <Dialog.Header
              borderBottom="1px solid"
              borderColor="whiteAlpha.200"
              my={0}
            >
              <Dialog.Title my={0} fontSize="xl" fontWeight="bold">
                New Patient
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body py={6}>
              <form
                id="patient-form"
                ref={formRef}
                onSubmit={handleSubmit(onSubmit)}
              >
                {/* Basic Info */}
                <Stack spacing={2}>
                  <Heading
                    mb={4}
                    textTransform="capitalize"
                    color="white"
                    size={{
                      base: "sm",
                      "2xl": "md",
                    }}
                    fontWeight="300"
                  >
                    Basic Information (required)
                  </Heading>
                  <CustomInput
                    label="First Name"
                    placeholder=""
                    {...register("firstName", {
                      required: "First Name is required",
                    })}
                    {...inputStyles}
                    borderColor={errors.firstName ? "red.500" : "#2f4d78"}
                  />
                  <CustomInput
                    label="Last Name"
                    placeholder=""
                    {...register("lastName", {
                      required: "Last Name is required",
                    })}
                    {...inputStyles}
                    borderColor={errors.lastName ? "red.500" : "#2f4d78"}
                  />
                  <HStack>
                    <CustomInput
                      label={"Date of Birth"}
                      type="date"
                      placeholder="mm/dd/yyyy"
                      {...register("dob")}
                      {...inputStyles}
                      w="200px"
                      css={{
                        "&::-webkit-calendar-picker-indicator": {
                          filter: "invert(1)",
                          cursor: "pointer",
                        },
                      }}
                    />
                    <Field.Root invalid={!!errors.schedule}>
                      <Field.Label
                        color="white"
                        fontWeight={"light"}
                        fontSize={"md"}
                        letterSpacing={"wider"}
                      >
                        Gender
                      </Field.Label>
                      <Controller
                        name="gender"
                        control={control}
                        render={({ field }) => (
                          <CustomSelect
                            options={sexOptions}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder=""
                            borderRadius="4px !important"
                            borderColor="#2f4d78"
                            css={{
                              "& button": {
                                borderRadius: "4px !important",
                                borderColor: "#2f4d78",
                                color: "white !important",
                              },
                            }}
                          />
                        )}
                      />
                      {errors.schedule && (
                        <Field.ErrorText>
                          {errors.schedule.message}
                        </Field.ErrorText>
                      )}
                    </Field.Root>{" "}
                  </HStack>
                  <Flex align="center">
                    <CustomInput
                      label="Mobile Number"
                      placeholder="(___) ___-____"
                      {...register("mobilePhone")}
                      {...inputStyles}
                    />
                    {/* <Button
                      variant="ghost"
                      color="cyan.400"
                      ml={4}
                      fontSize="sm"
                      fontWeight="normal"
                      _hover={{ textDecoration: "underline" }}
                    >
                      Show More
                    </Button> */}
                  </Flex>
                </Stack>

                {/* Billing Profile */}
                <Stack spacing={2} mt={8}>
                  <Flex justify="space-between" align="center" mb={2}>
                    <Heading
                      mb={4}
                      textTransform="capitalize"
                      color="white"
                      size={{
                        base: "sm",
                        "2xl": "md",
                      }}
                      fontWeight="300"
                    >
                      Billing Profile (optional)
                    </Heading>
                    <Button
                      variant="ghost"
                      color="cyan.400"
                      size="sm"
                      fontWeight="normal"
                    >
                      Edit
                    </Button>
                  </Flex>
                  <Text color="gray.400" fontSize="sm">
                    No insurance or self pay information added yet.
                  </Text>
                </Stack>

                {/* Additional Contact */}
                <Stack spacing={2} mt={8}>
                  <Heading
                    mb={4}
                    textTransform="capitalize"
                    color="white"
                    size={{
                      base: "sm",
                      "2xl": "md",
                    }}
                    fontWeight="300"
                  >
                    Additional Contact Information (optional)
                  </Heading>

                  <CustomInput
                    label="Email"
                    type="email"
                    {...register("email")}
                    {...inputStyles}
                  />

                  <Stack spacing={4}>
                    <Flex gap={4}>
                      <Box flex={2}>
                        <CustomInput
                          label="Street Address"
                          {...register("address.street")}
                        />
                      </Box>
                      <Box flex={1}>
                        <CustomInput
                          label="Apt/Suite"
                          {...register("address.apt")}
                        />
                      </Box>
                    </Flex>
                    <Flex gap={4}>
                      <Box flex={2}>
                        <CustomInput
                          label="City"
                          {...register("address.city")}
                        />
                      </Box>
                      <Box flex={1}>
                        <Field.Root>
                          <Field.Label
                            color="white"
                            fontWeight="light"
                            fontSize={{
                              base: "xs",
                              "2xl": "sm",
                              "3xl": "md",
                            }}
                            letterSpacing="wider"
                          >
                            State
                          </Field.Label>
                          <Controller
                            name="address.state"
                            control={control}
                            render={({ field }) => (
                              <CustomSelect
                                options={stateOptions}
                                value={field.value}
                                onValueChange={field.onChange}
                                borderRadius="4px !important"
                                borderColor="#2f4d78"
                                css={{
                                  "& button": {
                                    borderRadius: "4px !important",
                                    borderColor: "#2f4d78",
                                    color: "white !important",
                                  },
                                }}
                              />
                            )}
                          />
                        </Field.Root>
                      </Box>
                      <Box flex={1}>
                        <CustomInput
                          label="Zip"
                          placeholder="______-____"
                          {...register("address.zip")}
                        />
                      </Box>
                    </Flex>
                  </Stack>
                </Stack>
              </form>
            </Dialog.Body>
            <Dialog.Footer pt={4}>
              <CustomButton variant="outline">Cancel</CustomButton>
              <CustomButton
                onSubmit={() => {
                  formRef.current.requestSubmit();
                }}
              >
                Submit
              </CustomButton>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default PatientsModal;

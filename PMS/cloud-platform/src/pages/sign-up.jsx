import Logo from "@/assets/logo/droidal-logo.svg";
import BgImage from "@/assets/img/ready_to_launch.png";
import "@/styles/login.css";
import {
  HStack,
  Field,
  Input,
  Text,
  VStack,
  Grid,
  GridItem,
  Button,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  PasswordInput,
  PasswordStrengthMeter,
} from "@/components/ui/password-input";
import CustomSelect from "@/components/ui/select";
import { useForm, Controller } from "react-hook-form";
import { useRegister } from "@/hooks/mutation/useRegister";
import { Box } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";
import DroidalAILogo from "@/assets/logo/DroidalAI-logo.svg?react";

const TARGET_DATE = new Date("2025-09-29T23:59:59"); // Set your target date/time here

const CustomInput = (props) => {
  return (
    <Input
      variant="outline"
      size={{
        base: "xs",
        "2xl": "md",
        "3xl": "lg",
      }}
      rounded={"10px"}
      borderColor={"none"}
      bg="white"
      _hover={{
        outlineColor: "primary.400",
      }}
      _focus={{
        outlineColor: "primary.400",
      }}
      _placeholder={{
        color: "gray.300",
      }}
      color={"black"}
      {...props}
    />
  );
};

function getTimeLeft(target) {
  const now = new Date();
  const diff = target - now;
  if (diff <= 0) return "00 days, 00H:00M:00S";
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return `${days} days, ${String(hours).padStart(2, "0")}H:${String(
    minutes
  ).padStart(2, "0")}M:${String(seconds).padStart(2, "0")}S`;
}

const SignUp = () => {
  const navigate = useNavigate();
  const { mutate, isPending } = useRegister();
  const [timeLeft, setTimeLeft] = useState(getTimeLeft(TARGET_DATE));
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [passwordValue, setPasswordValue] = useState("");

  // Add password strength calculation
  function getPasswordScore(password) {
    let score = 0;
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 3;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 2;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    return score; // max score: 5
  }

  const {
    register,
    handleSubmit,

    formState: { errors },
  } = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      password: "",
      username: "",
      mobile: "",
      organization: "",
      country: "",
    },
  });

  console.log("errors1212", errors);

  const onSubmit = (data) => {
    console.log("Form submitted", data);
    const payload = { ...data };
    mutate(payload, {
      onSuccess: (res) => {
        toaster.success({
          title: "Registration Successful",
          description: "Your account has been created successfully",
        });

        // toaster.success({
        //   title: "Welcome! Please Verify Your Email Address",
        //   description: "You're almost there—verify your mail to continue.",
        //   action: {
        //     label: "Undo",
        //     onClick: () => console.log("Undo"),
        //   },
        // });
        navigate("/login");
        // reset({
        //   first_name: "",
        //   last_name: "",
        //   mail: "",
        //   password: "",
        //   username: "",
        //   mobile: "",
        //   organization: "",
        //   country: "",
        // });
      },
      onError: (error) => {
        console.log("error", error);
        const errorMessage = Object.values(error)?.[0] || "Error creating user";
        toaster.error({
          title: "Error",
          description: errorMessage,
        });
      },
    });
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(getTimeLeft(TARGET_DATE));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <Box
      pt={{
        base: "30px",
        "2xl": "40px",
        "3xl": "180px",
      }}
      className="flex justify-center login-container"
    >
      <Box
        data-state="open"
        animationDuration="slowest"
        animationStyle={{
          _open: "scale-fade-in",
        }}
      >
        <Box
          w={{
            base: "460px",
            "2xl": "580px",
            "3xl": "660px",
          }}
        >
          <Box
            height={{
              base: "70px",
              "2xl": "90px",
              "3xl": "101px",
            }}
          >
            <DroidalAILogo height={"100%"} width={"100%"} />
          </Box>
          <Text
            fontWeight={"semibold"}
            fontSize={{
              base: "md",
              "2xl": "2xl",
            }}
            m={0}
            my={{
              base: "16px",
              "2xl": "25px",
              "3xl": "40px",
            }}
            p={0}
            color="white"
            letterSpacing={"widest"}
          >
            Enter your details to get started
          </Text>
          <Box
            px={{
              base: "28px",
              "2xl": "36px",
              "3xl": "40px",
            }}
            className="relative rounded-[20px] flex justify-center !m-0 bg-[#a0dff8] py-4"
          >
            <div className="w-full mx-auto !py-4 3xl:py-6">
              <div>
                <form onSubmit={handleSubmit(onSubmit)}>
                  <Grid
                    templateRows="repeat(2, auto)"
                    templateColumns={"repeat(2, 1fr)"}
                    gap={{
                      base: 2,
                      "2xl": 3,
                      "3xl": 4,
                    }}
                  >
                    <GridItem colSpan={2}>
                      <Field.Root invalid={!!errors.mail?.message}>
                        <Field.Label
                          fontWeight={"semibold"}
                          letterSpacing={"widest"}
                          color="white"
                          fontSize={{
                            base: "sm",
                            "2xl": "sm",
                            "3xl": "md",
                          }}
                        >
                          Email Id
                        </Field.Label>
                        <CustomInput
                          placeholder="Email Id"
                          {...register("mail", {
                            required: "Enter Email",
                            pattern: {
                              value:
                                /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                              message: "Invalid email format",
                            },
                          })}
                        />
                        {errors.mail && (
                          <Field.ErrorText>
                            {errors.mail?.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                    </GridItem>
                    <GridItem colSpan={1}>
                      <Field.Root invalid={!!errors.first_name?.message}>
                        <Field.Label
                          fontWeight={"semibold"}
                          letterSpacing={"widest"}
                          color="white"
                          fontSize={{
                            base: "sm",
                            "2xl": "sm",
                            "3xl": "md",
                          }}
                        >
                          First Name
                        </Field.Label>
                        <CustomInput
                          placeholder="First Name"
                          {...register("first_name", {
                            required: "Enter first name",
                            maxLength: {
                              value: 15,
                              message: "Max 15 characters",
                            },
                            pattern: {
                              value: /^[A-Za-z]+$/,
                              message:
                                "Numeric and special characters are not allowed",
                            },
                          })}
                        />
                        {errors.first_name && (
                          <Field.ErrorText>
                            {errors.first_name?.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                    </GridItem>
                    <GridItem colSpan={1}>
                      <Field.Root invalid={!!errors.last_name?.message}>
                        <Field.Label
                          fontWeight={"semibold"}
                          letterSpacing={"widest"}
                          color="white"
                          fontSize={{
                            base: "sm",
                            "2xl": "sm",
                            "3xl": "md",
                          }}
                        >
                          Last Name
                        </Field.Label>
                        <CustomInput
                          placeholder="Last Name"
                          {...register("last_name", {
                            required: "Enter last name",
                            maxLength: {
                              value: 15,
                              message: "Max 15 characters",
                            },
                            pattern: {
                              value: /^[A-Za-z]+$/,
                              message:
                                "Numeric and special characters are not allowed",
                            },
                          })}
                        />
                        {errors.last_name && (
                          <Field.ErrorText>
                            {errors.last_name?.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                    </GridItem>

                    <GridItem colSpan={1}>
                      <Field.Root invalid={!!errors.username?.message}>
                        <Field.Label
                          fontWeight={"semibold"}
                          letterSpacing={"widest"}
                          color="white"
                          fontSize={{
                            base: "sm",
                            "2xl": "sm",
                            "3xl": "md",
                          }}
                        >
                          Username
                        </Field.Label>
                        <CustomInput
                          placeholder="Username"
                          {...register("username", {
                            required: "Enter username",
                            maxLength: {
                              value: 25,
                              message: "Max 25 characters",
                            },
                          })}
                        />
                        {errors.username && (
                          <Field.ErrorText>
                            {errors.username?.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                    </GridItem>

                    {/* <GridItem colSpan={1}>
                      <Field.Root invalid={!!errors.mobile_number?.message}>
                        <CustomInput
                          placeholder="Mobile Number"
                          {...register("mobile_number", {
                            required: "Enter mobile number",
                          })}
                        />
                        {errors.mobile_number && (
                          <Field.ErrorText>
                            {errors.mobile_number?.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                    </GridItem> */}
                    <GridItem colSpan={1}>
                      <Field.Root invalid={!!errors.organization?.message}>
                        <Field.Label
                          fontWeight={"semibold"}
                          letterSpacing={"widest"}
                          color="white"
                          fontSize={{
                            base: "sm",
                            "2xl": "sm",
                            "3xl": "md",
                          }}
                        >
                          Mobile Number
                        </Field.Label>
                        <CustomInput
                          placeholder="mobile"
                          {...register("mobile", {
                            required: "Enter mobile number",
                          })}
                        />
                        {errors.organization && (
                          <Field.ErrorText>
                            {errors.organization?.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                    </GridItem>

                    <GridItem colSpan={1}>
                      <Field.Root invalid={!!errors.password?.message}>
                        <Field.Label
                          fontWeight={"semibold"}
                          letterSpacing={"widest"}
                          color="white"
                          fontSize={{
                            base: "sm",
                            "2xl": "sm",
                            "3xl": "md",
                          }}
                        >
                          Password
                        </Field.Label>
                        <PasswordInput
                          placeholder="Password"
                          {...register("password", {
                            required: "Enter password",
                            pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                              message:
                                "Password must contain uppercase, lowercase, and a number",
                            },
                          })}
                          onFocus={() => setPasswordFocused(true)}
                          onBlur={() => setPasswordFocused(false)}
                          onChange={(e) => {
                            setPasswordValue(e.target.value);
                            // Call react-hook-form's onChange
                            if (
                              typeof register("password").onChange ===
                              "function"
                            ) {
                              register("password").onChange(e);
                            }
                          }}
                          value={passwordValue}
                          rounded={"10px"}
                          variant="outline"
                          _hover={{
                            outlineColor: "primary.400",
                          }}
                          _focus={{
                            outlineColor: "primary.400",
                          }}
                          _placeholder={{
                            color: "gray.300",
                          }}
                          color={"black"}
                          borderColor={"none"}
                          bg={"transparent"}
                          size={{
                            base: "xs",
                            "2xl": "md",
                            "3xl": "lg",
                          }}
                        />

                        {passwordFocused && (
                          <PasswordStrengthMeter
                            width="100%"
                            max={10}
                            value={getPasswordScore(passwordValue)}
                          />
                        )}
                        {errors.password && (
                          <Field.ErrorText>
                            {errors.password?.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                    </GridItem>
                    <GridItem colSpan={1}>
                      <Field.Root invalid={!!errors.confirm_password?.message}>
                        <Field.Label
                          fontWeight={"semibold"}
                          letterSpacing={"widest"}
                          color="white"
                          fontSize={{
                            base: "sm",
                            "2xl": "sm",
                            "3xl": "md",
                          }}
                        >
                          Confirm Password
                        </Field.Label>
                        <PasswordInput
                          placeholder="Confirm Password"
                          {...register("confirm_password", {
                            required: "Enter password",
                            validate: (value) => {
                              if (value !== passwordValue) {
                                return "Passwords do not match";
                              }
                            },
                          })}
                          size={{
                            base: "xs",
                            "2xl": "md",
                            "3xl": "lg",
                          }}
                          rounded={"10px"}
                          variant="outline"
                          _hover={{
                            outlineColor: "primary.400",
                          }}
                          _focus={{
                            outlineColor: "primary.400",
                          }}
                          _placeholder={{
                            color: "gray.300",
                          }}
                          color={"black"}
                          borderColor={"none"}
                          bg={"transparent"}
                        />
                        {errors.confirm_password && (
                          <Field.ErrorText>
                            {errors.confirm_password?.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>{" "}
                    </GridItem>
                  </Grid>
                  <HStack justify="space-between" mt={4}>
                    <Button
                      fontSize={{
                        base: "14px",
                        "2xl": "18px",
                        "3xl": "20px",
                      }}
                      rounded={"10px"}
                      className="bg-gradient-to-r text-white"
                      w={{
                        base: "80px",
                        "2xl": "100px",
                        "3xl": "110px",
                      }}
                      letterSpacing={"widest"}
                      textAlign={"center"}
                      onClick={() => navigate("/login")}
                      css={{
                        bg: "rgba(16, 116, 147, 0.5)",
                        "&:hover": {
                          bg: "rgba(16, 116, 147, 1) !important",
                        },
                      }}
                      size={{
                        base: "sm",
                        "2xl": "md",
                        "3xl": "lg",
                      }}
                    >
                      Back
                    </Button>
                    <Button
                      loading={isPending}
                      type="submit"
                      colorScheme="primary"
                      rounded={"10px"}
                      fontSize={{
                        base: "14px",
                        "2xl": "18px",
                        "3xl": "20px",
                      }}
                      letterSpacing={"widest"}
                      w={{
                        base: "80px",
                        "2xl": "100px",
                        "3xl": "110px",
                      }}
                      size={{
                        base: "sm",
                        "2xl": "md",
                        "3xl": "lg",
                      }}
                      textAlign={"center"}
                    >
                      Sign Up
                    </Button>
                  </HStack>
                </form>
              </div>
            </div>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default SignUp;

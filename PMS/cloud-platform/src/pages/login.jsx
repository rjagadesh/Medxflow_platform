import Logo from "@/assets/logo/droidal-logo.svg";
import BgImage from "@/assets/img/ready_to_launch.png";
import "@/styles/login.css";
import { HStack, Field, Input, Text, VStack, Button } from "@chakra-ui/react";
// import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Box } from "@chakra-ui/react";
import { useForm } from "react-hook-form";
import { useAuth } from "@/store/providers/auth-provider";
import DroidalAILogo from "@/assets/logo/DroidalAI-logo.svg?react";
import { useForgotPassword } from "@/hooks/mutation/auth/useForgotPassword";
import { toaster } from "@/components/ui/toaster";
import { useResetPassword } from "@/hooks/mutation/auth/useResetPassword";
import {
  PasswordInput,
  PasswordStrengthMeter,
} from "@/components/ui/password-input";
import { useLayoutEffect, useState } from "react";
import { parseAsBoolean, useQueryState } from "nuqs";

// const TARGET_DATE = new Date("2025-09-29T23:59:59"); // Set your target date/time here

// function getTimeLeft(target) {
//   const now = new Date();
//   const diff = target - now;
//   if (diff <= 0) return "00 days, 00H:00M:00S";
//   const days = Math.floor(diff / (1000 * 60 * 60 * 24));
//   const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
//   const minutes = Math.floor((diff / (1000 * 60)) % 60);
//   const seconds = Math.floor((diff / 1000) % 60);
//   return `${days} days, ${String(hours).padStart(2, "0")}H:${String(
//     minutes
//   ).padStart(2, "0")}M:${String(seconds).padStart(2, "0")}S`;
// }

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

const ForgotPasswordForm = ({ loading, form }) => {
  const { errors } = form.formState;
  const navigate = useNavigate();
  return (
    <>
      <Field.Root mb={0} invalid={!!errors.mail?.message}>
        <Field.Label
          color={"white"}
          letterSpacing={"widest"}
          fontWeight={"semibold"}
          fontSize={"md"}
        >
          Email
        </Field.Label>

        <Input
          {...form.register("mail", {
            required: "Email is required",
            pattern: {
              value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
              message: "Invalid email format",
            },
          })}
          variant="outline"
          size={"lg"}
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
          placeholder="example@company.com"
        />
        {errors.mail && (
          <Field.ErrorText>{errors.mail.message}</Field.ErrorText>
        )}
      </Field.Root>
      <HStack justify="space-between" mt={4}>
        <Button
          // colorScheme="primary"
          // bg={"primary.400"}
          fontSize={{
            base: "16px",
            "2xl": "18px",
            "3xl": "20px",
          }}
          rounded={"10px"}
          className="bg-gradient-to-r text-white"
          css={{
            bg: "rgba(16, 116, 147, 0.5)",
            "&:hover": {
              bg: "rgba(16, 116, 147, 1) !important",
            },
          }}
          w={{
            base: "90px",
            "2xl": "100px",
            "3xl": "110px",
          }}
          letterSpacing={"widest"}
          textAlign={"center"}
          onClick={() => {
            navigate("/login");
          }}
        >
          Back
        </Button>
        <Button
          loading={loading}
          type="submit"
          colorScheme="primary"
          rounded={"10px"}
          fontSize={{
            base: "16px",
            "2xl": "18px",
            "3xl": "20px",
          }}
          letterSpacing={"widest"}
          w={{
            base: "90px",
            "2xl": "100px",
            "3xl": "110px",
          }}
          textAlign={"center"}
        >
          Submit
        </Button>
      </HStack>
    </>
  );
};
const ResetPasswordForm = ({ loading, form }) => {
  const { errors } = form.formState;
  const { register } = form;
  const navigate = useNavigate();
  const [passwordFocused, setPasswordFocused] = useState(false);

  console.log("form12123", errors);

  const passwordValue = form.watch("new_password");

  return (
    <>
      <Field.Root height={"90px"} invalid={!!errors.new_password?.message}>
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
          New Password
        </Field.Label>
        <PasswordInput
          placeholder="New Password"
          {...register("new_password", {
            required: "Enter new password",
            pattern: {
              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
              message:
                "Password must contain uppercase, lowercase, and a number",
            },
          })}
          onFocus={() => setPasswordFocused(true)}
          onBlur={() => setPasswordFocused(false)}
          onChange={(e) => {
            if (typeof register("new_password").onChange === "function") {
              register("new_password").onChange(e);
            }
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
          size={{
            base: "sm",
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
        {errors.new_password && (
          <div className="absolute bottom-[-6px] w-full">
            <Field.ErrorText>{errors.new_password?.message}</Field.ErrorText>
          </div>
        )}
      </Field.Root>
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
            required: "Enter confirm password",
            validate: (value) =>
              value === passwordValue || "Passwords don't match",
          })}
          onChange={(e) => {
            if (typeof register("confirm_password").onChange === "function") {
              register("confirm_password").onChange(e);
            }
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
          size={{
            base: "sm",
            "2xl": "md",
            "3xl": "lg",
          }}
        />

        {errors.confirm_password && (
          <Field.ErrorText>{errors.confirm_password?.message}</Field.ErrorText>
        )}
      </Field.Root>

      <HStack justify="space-between" mt={4}>
        <Button
          // colorScheme="primary"
          // bg={"primary.400"}
          fontSize={{
            base: "16px",
            "2xl": "18px",
            "3xl": "20px",
          }}
          rounded={"10px"}
          className="bg-gradient-to-r text-white"
          css={{
            bg: "rgba(16, 116, 147, 0.5)",
            "&:hover": {
              bg: "rgba(16, 116, 147, 1) !important",
            },
          }}
          w={{
            base: "90px",
            "2xl": "100px",
            "3xl": "110px",
          }}
          letterSpacing={"widest"}
          textAlign={"center"}
          onClick={() => {
            navigate("/login");
          }}
        >
          Back
        </Button>
        <Button
          loading={loading}
          type="submit"
          colorScheme="primary"
          rounded={"10px"}
          fontSize={{
            base: "16px",
            "2xl": "18px",
            "3xl": "20px",
          }}
          letterSpacing={"widest"}
          w={{
            base: "90px",
            "2xl": "100px",
            "3xl": "110px",
          }}
          textAlign={"center"}
        >
          Submit
        </Button>
      </HStack>
    </>
  );
};

const Login = ({ formType = "login" }) => {
  const navigate = useNavigate();
  const [verifyStatus, setVerifyStatus] = useQueryState(
    "verified-status",
    parseAsBoolean.withDefault(false)
  );
  const { uid, token } = useParams();
  const { login, loading } = useAuth();
  const [mfaRequired, setMfaRequired] = useState(false);
  const [mfaUserId, setMfaUserId] = useState(null);
  const [mfaFormData, setMfaFormData] = useState(null);
  const form = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
  });
  const forgotPasswordForm = useForm({
    defaultValues: {
      mail: "",
    },
  });
  const resetPasswordForm = useForm({
    defaultValues: {
      new_password: "",
      confirm_password: "",
    },
  });

  const { isPending: forgotPasswordPending, mutate } = useForgotPassword();
  const { isPending: resetPasswordPending, mutate: resetPassword } =
    useResetPassword();
  const {
    formState: { errors },
  } = form;

  const handleForgotPassword = (data) => {
    console.log("Form submitted", data);
    mutate(data, {
      onSuccess: () => {
        toaster.success({
          title: "Success",
          description: "Password reset link sent successfully",
          duration: 5000,
        });
      },
      onError: (err) => {
        toaster.error({
          title: "Error",
          description: err.error,
          duration: 5000,
        });
      },
    });
  };
  const handleResetPassword = (data) => {
    resetPassword(
      {
        ...data,
        uid,
        token,
      },
      {
        onSuccess: () => {
          navigate("/login");
          toaster.success({
            title: "Success",
            description: "Password reset successfully",
            duration: 5000,
          });
        },
      }
    );
  };

  const onSubmit = (data) => {
    console.log("Form submitted", data);
    login(data);
  };

  useLayoutEffect(() => {
    if (verifyStatus === true) {
      toaster.success({
        title: "Email Verified",
        description: "You can now login",
        duration: 5000,
      });
      setVerifyStatus(null);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verifyStatus]);

  // const [timeLeft, setTimeLeft] = useState(getTimeLeft(TARGET_DATE));
  // useEffect(() => {
  //   const timer = setInterval(() => {
  //     setTimeLeft(getTimeLeft(TARGET_DATE));
  //   }, 1000);
  //   return () => clearInterval(timer);
  // }, []);

  return (
    <Box
      pt={{
        base: "80px",
        "2xl": "90px",
        // "3xl": "180px",
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
              "2xl": "94px",
              "3xl": "101px",
            }}
          >
            <DroidalAILogo height={"100%"} width={"100%"} />
          </Box>
          <Text
            fontWeight={"semibold"}
            fontSize={{
              base: "xl",
              "2xl": "2xl",
            }}
            m={0}
            my={{
              base: "20px",
              "2xl": "25px",
              "3xl": "32px",
            }}
            p={0}
            color="white"
            letterSpacing={"widest"}
          >
            {formType === "forgotPassword"
              ? "Forgot Password"
              : formType === "resetPassword"
              ? "Reset Password"
              : "Welcome back"}
          </Text>
          <Box
            px={{
              base: "30px",
              "2xl": "30px",
              "3xl": "40px",
            }}
            className="relative rounded-[20px] flex justify-center !m-0 bg-[#a0dff8] py-4"
          >
            <div className="w-full mx-auto py-3 2xl:py-4 3xl:py-6">
              <div>
                <form
                  onSubmit={
                    formType === "forgotPassword"
                      ? forgotPasswordForm.handleSubmit(handleForgotPassword)
                      : formType === "resetPassword"
                      ? resetPasswordForm.handleSubmit(handleResetPassword)
                      : form.handleSubmit(onSubmit)
                  }
                >
                  {formType === "login" && (
                    <>
                      <Field.Root mb={0} invalid={!!errors.username?.message}>
                        <Field.Label
                          color={"white"}
                          letterSpacing={"widest"}
                          fontWeight={"semibold"}
                          fontSize={"md"}
                        >
                          Username
                        </Field.Label>

                        <Input
                          {...form.register("username", {
                            required: "First name is required",
                          })}
                          variant="outline"
                          size={{
                            base: "sm",
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
                          placeholder="Username"
                        />
                        {errors.username && (
                          <Field.ErrorText>
                            {errors.username.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                      <Field.Root
                        invalid={!!errors.confirm_password?.message}
                        mt={{
                          base: 1,
                          "2xl": 2,
                          "3xl": 4,
                        }}
                      >
                        <Field.Label
                          fontWeight={"semibold"}
                          letterSpacing={"widest"}
                          color="white"
                          fontSize={"md"}
                        >
                          Password
                        </Field.Label>
                        <PasswordInput
                          {...form.register("password", {
                            required: "Password is required",
                          })}
                          size={{
                            base: "sm",
                            "2xl": "md",
                            "3xl": "lg",
                          }}
                          rounded={"10px"}
                          placeholder="Password"
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
                            {errors.confirm_password.message}
                          </Field.ErrorText>
                        )}
                      </Field.Root>
                      <Button
                        variant={"plain"}
                        p={0}
                        className="!text-droidal-blue-400"
                        fontSize={"sm"}
                        onClick={() => navigate("/forgot-password")}
                      >
                        Forgotten password?
                      </Button>
                      <HStack justify="space-between" mt={2}>
                        <Button
                          // colorScheme="primary"
                          // bg={"primary.400"}
                          fontSize={{
                            base: "16px",
                            "2xl": "18px",
                            "3xl": "20px",
                          }}
                          rounded={"10px"}
                          className="bg-gradient-to-r text-white"
                          css={{
                            bg: "rgba(16, 116, 147, 0.5)",
                            "&:hover": {
                              bg: "rgba(16, 116, 147, 1) !important",
                            },
                          }}
                          w={{
                            base: "90px",
                            "2xl": "100px",
                            "3xl": "110px",
                          }}
                          size={{
                            base: "sm",
                            "2xl": "md",
                            "3xl": "lg",
                          }}
                          letterSpacing={"widest"}
                          textAlign={"center"}
                          onClick={() => navigate("/sign-up")}
                        >
                          Sign Up{" "}
                        </Button>
                        <Button
                          loading={loading}
                          type="submit"
                          colorScheme="primary"
                          rounded={"10px"}
                          fontSize={{
                            base: "16px",
                            "2xl": "18px",
                            "3xl": "20px",
                          }}
                          size={{
                            base: "sm",
                            "2xl": "md",
                            "3xl": "lg",
                          }}
                          letterSpacing={"widest"}
                          w={{
                            base: "90px",
                            "2xl": "100px",
                            "3xl": "110px",
                          }}
                          textAlign={"center"}
                        >
                          Log In
                        </Button>
                      </HStack>
                    </>
                  )}
                  {formType === "forgotPassword" && (
                    <ForgotPasswordForm
                      loading={forgotPasswordPending}
                      form={forgotPasswordForm}
                    />
                  )}
                  {formType === "resetPassword" && (
                    <ResetPasswordForm
                      loading={resetPasswordPending}
                      form={resetPasswordForm}
                    />
                  )}
                </form>
              </div>
            </div>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default Login;

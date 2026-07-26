import React, { useState, useRef } from "react";
import { Box, HStack, VStack, Button, Text } from "@chakra-ui/react";
import { useAuth } from "@/store/providers/auth-provider"; // Update this path as per your project
import { useNavigate } from "react-router-dom";
import DroidalAILogo from "@/assets/logo/DroidalAI-logo.svg?react";
import "@/styles/login.css";

const MfaInput = ({ value, onChange, onSubmit }) => {
  const inputsRef = useRef([]);

  const handleChange = (e, idx) => {
    const val = e.target.value;
    if (/^\d$/.test(val)) {
      const newValue = value.split("");
      newValue[idx] = val;
      onChange(newValue.join(""));
      if (idx < 5) inputsRef.current[idx + 1]?.focus();
    } else if (val === "") {
      const newValue = value.split("");
      newValue[idx] = "";
      onChange(newValue.join(""));
    }
  };

  const handleKeyDown = (e, idx) => {
  if (e.key === "Enter") {
      e.preventDefault();
      if (value.length === 6 && /^\d{6}$/.test(value)) {
        onSubmit?.();
      }
    } else if (e.key === "Backspace") {
    if (value[idx] !== "") {
      // If there's a value in current input, clear it
      const newValue = value.split("");
      newValue[idx] = "";
      onChange(newValue.join(""));
      // Move to previous input after clearing
      if (idx > 0) {
        inputsRef.current[idx - 1]?.focus();
      }
    } else if (idx > 0) {
      // If current input is empty, move focus to previous input and clear it
      const newValue = value.split("");
      newValue[idx - 1] = "";
      onChange(newValue.join(""));
      inputsRef.current[idx - 1]?.focus();
    }
  }
};

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteText = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pasteText)) {
      onChange(pasteText);
      inputsRef.current[5]?.focus();
    }
  };

  const digitsArray = value.padEnd(6, " ").split("");

  return (
    <HStack spacing={3} justify="center" w="full">
      {digitsArray.map((digit, idx) => (
        <input
          key={idx}
          ref={(el) => (inputsRef.current[idx] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={digit === " " ? "" : digit}
          onChange={(e) => handleChange(e, idx)}
          onKeyDown={(e) => handleKeyDown(e, idx)}
          onPaste={handlePaste}
          style={{
            width: 50,
            height: 60,
            fontSize: 24,
            fontWeight: "bold",
            textAlign: "center",
            borderRadius: 10,
            border: "2px solid #e0e0e0",
            backgroundColor: "white",
            color: "black",
            transition: "all 0.2s ease",
          }}
          onFocus={(e) => {
            e.target.style.borderColor = "#107493";
            e.target.style.boxShadow = "0 0 0 3px rgba(16, 116, 147, 0.1)";
          }}
          onBlur={(e) => {
            e.target.style.borderColor = "#e0e0e0";
            e.target.style.boxShadow = "none";
          }}
          autoComplete="one-time-code"
        />
      ))}
    </HStack>
  );
};

const MfaVerificationForm = () => {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const { verifyMfa, cancelMfa, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (code.length === 6) {
      setError("");
      try {
        await verifyMfa(code);
        // Navigation and success notification handled in verifyMfa
      } catch (err) {
        setError(err.message || "Invalid MFA code");
      }
    } else {
      setError("Please enter a 6-digit code");
    }
  };

  return (
    <Box
      pt={{
        base: "80px",
        "2xl": "90px",
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
            <Box
              w="100%"
              h="100%"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
              fontSize="2xl"
              fontWeight="bold"
              color="primary.500"
            >
              <DroidalAILogo height={"100%"} width={"100%"} />
            </Box>
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
            textAlign={"center"}
          >
            Verify Identity
          </Text>
          <Box
            px={{
              base: "30px",
              "2xl": "30px",
              "3xl": "40px",
            }}
            className="relative rounded-[20px] flex justify-center !m-0 bg-[#a0dff8] py-8"
          >
            <VStack w="full" spacing={6} align="center">
              <VStack spacing={6} align="center" w="full">
                <Text
                  fontSize={{
                    base: "sm",
                    "2xl": "md",
                  }}
                  color="gray.700"
                  textAlign="center"
                >
                  Enter the 6-digit code from your authenticator app
                </Text>

                <MfaInput value={code} onChange={setCode} onSubmit={handleSubmit} />

                {error && (
                  <Text fontSize="sm" color="red.600" fontWeight="medium">
                    {error}
                  </Text>
                )}

                <HStack justify="space-between" w="full" mt={4}>
                  <Button
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
                      cancelMfa();
                      navigate("/login");
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    isLoading={loading}
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
                    isDisabled={code.length !== 6}
                    onClick={handleSubmit}
                  >
                    Verify
                  </Button>
                </HStack>
              </VStack>
            </VStack>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default MfaVerificationForm;

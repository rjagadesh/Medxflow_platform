import { Box, Text, Input, Grid, IconButton } from "@chakra-ui/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { color } from "highcharts";

const PasswordField = ({
  label,
  name,
  value,
  onChange,
  error,
  helperText,
  required = false,
  inputProps = {},
}) => {
  const [show, setShow] = useState(false);

  return (
    <Box w="100%">
      <Grid
        templateColumns="170px 1fr" // 🔥 SAME AS FormField
        alignItems="center"
        columnGap="4px"
        className="dark-form-field"
      >
        {/* LABEL */}
        <Text
          fontSize="13px"
          color="#9ca3af"
          letterSpacing="0.8px"
          textAlign="left"
          whiteSpace="nowrap"
        >
          {label}
          {required && (
            <Text as="span" color="red" ml="2px">
              *
            </Text>
          )}
          :
        </Text>

        {/* INPUT + EYE */}
        <Box position="relative" w="100%">
          <Input
            borderRadius={"0px"}
            // pr="16px"
            borderBottom="1px solid"
            width={"10.4vw"}
            borderColor={error ? "#ef4444" : "#575B67"}
            name={name}
            type={show ? "text" : "password"}
            value={value}
            onChange={onChange}
            variant="unstyled"
            fontSize="15px"
            color="whiteAlpha.800"
            _placeholder={{ color: "#6b7280" }}
            _focus={{ outline: "none" }}
            {...inputProps}
          />

          {/* TOGGLE ICON */}
          <IconButton
            aria-label={show ? "Hide password" : "Show password"}
            variant="ghost"
            size="sm"
            color="#9ca3af"
            _hover={{ color: "#686868ff" }}
            position="absolute"
            right="0"
            top="50%"
            transform="translateY(-40%)"
            zIndex={1}
            onClick={() => setShow((v) => !v)}
          >
            <AnimatePresence mode="wait" initial={false}>
              {show ? (
                <motion.span
                  key="eye-off"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <EyeOff size={16} />
                </motion.span>
              ) : (
                <motion.span
                  key="eye"
                  initial={{ scale: 0.85, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.85, opacity: 0 }}
                  transition={{ duration: 0.12 }}
                >
                  <Eye size={16} />
                </motion.span>
              )}
            </AnimatePresence>
          </IconButton>
        </Box>
      </Grid>

      {/* HELPER / ERROR */}
      {helperText && !error && (
        <Text
          fontSize="12px"
          color="#6b7280"
          mt="4px"
          textAlign={"right"}
          pr="5px"
        >
          {helperText}
        </Text>
      )}

      {error && (
        <Text
          fontSize="12px"
          color="#ef4444"
          mt="4px"
          textAlign={"right"}
          pr="5px"
        >
          {error}
        </Text>
      )}
    </Box>
  );
};

export default PasswordField;

import { Box, Text, Input, Grid, IconButton, Flex } from "@chakra-ui/react";
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CustomDatePicker from "@/components/date-picker/single-datepicker";

const FormField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  helperText,
  required = false,
  inputProps = {},
}) => {
  const isPassword = type === "password";
  const [show, setShow] = useState(false);
  const resolvedInputProps = {
    ...inputProps,
    ...(isPassword && { width: "10px" }),
  };

  return (
    <Box w="100%">
      <Grid
        templateColumns="170px 1fr"
        alignItems="center"
        columnGap="5px"
        className="dark-form-field"
        pt="5px"
      >
        {/* LABEL */}
        <Text
          fontSize="13px"
          color="#9ca3af"
          letterSpacing="0.8px"
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

        {/* INPUT WRAPPER */}
        <Box position="relative" w="200px">
          {type !== "date" ? (
            <Flex
              align="center"
              borderBottom="1px solid"
              borderColor={error ? "#ef4444" : "#575B67"}
              h="30px"
            >
              <Input
                flex="1"
                borderRadius="0px"
                border="none"
                name={name}
                type={isPassword && !show ? "password" : "text"}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                variant="unstyled"
                fontSize="17px"
                color="whiteAlpha.800"
                _placeholder={{ color: "#6b7280" }}
                _focus={{ outline: "none" }}
                {...resolvedInputProps}
              />

              {isPassword && (
                <IconButton
                  aria-label={show ? "Hide password" : "Show password"}
                  variant="ghost"
                  size="sm"
                  minW="auto"
                  h="auto"
                  px="2"
                  color="#9ca3af"
                  _hover={{ color: "#686868ff" }}
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
              )}
            </Flex>
          ) : (
            <CustomDatePicker
              value={value ? new Date(value) : null}
              minDate={new Date("1900-01-01")}
              maxDate={new Date()}
              onValueChange={(v) =>
                onChange({
                  target: { name, value: v },
                })
              }
              size={{ base: "sm", "3xl": "md" }}
            />
          )}
        </Box>
      </Grid>

      {/* HELPER / ERROR */}
      {helperText && !error && (
        <Text fontSize="12px" color="#6b7280" mr="40px" textAlign="right">
          {helperText}
        </Text>
      )}

      {error && (
        <Text fontSize="12px" color="#ef4444" mr="40px" textAlign="right">
          {error}
        </Text>
      )}
    </Box>
  );
};

export default FormField;

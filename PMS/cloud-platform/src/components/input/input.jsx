import { Field, Input, Group, InputAddon } from "@chakra-ui/react";

const CustomInput = ({
  label,
  placeholder,
  invalid,
  showError,
  errorMessage = "",
  labelProps = {},
  helperText = "",
  leftAddon,
  required,
  ...rest
}) => {
  const inputElement = (
    <Input
      placeholder={placeholder}
      color="white"
      _placeholder={{ letterSpacing: "widest", color: "#90a6c6" }}
      letterSpacing="widest"
      borderColor={"#2f4d78"}
      transition={"all .2s ease-in-out"}
      _hover={{
        outlineColor: "transparent",
        border: "1px solid transparent",
        bgClip: "padding-box, border-box",
        backgroundOrigin: "padding-box, border-box",
        backgroundImage:
          "linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
      }}
      {...rest}
    />
  );

  return (
    <Field.Root invalid={invalid}>
      {label && (
        <Field.Label
          color="white"
          fontWeight={"light"}
          fontSize={{
            base: "xs",
            "2xl": "sm",
            "3xl": "md",
          }}
          letterSpacing={"wider"}
          {...labelProps}
        >
          {label}
          {required && (
            <span style={{ color: "red", marginLeft: "1px" }}>*</span>
          )}
        </Field.Label>
      )}

      {leftAddon ? (
        <Group attached w="full">
          <InputAddon bg="droidalBlack.300" color="white" borderColor="#2f4d78">
            {leftAddon}
          </InputAddon>
          {inputElement}
        </Group>
      ) : (
        inputElement
      )}

      {}

      {helperText && (
        <Field.HelperText color={"droidalGray.400"}>
          {helperText}
        </Field.HelperText>
      )}
      {showError && <Field.ErrorText>{errorMessage}</Field.ErrorText>}
    </Field.Root>
  );
};

export default CustomInput;

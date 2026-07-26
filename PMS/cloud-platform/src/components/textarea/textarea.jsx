import { Field, Textarea } from "@chakra-ui/react";

const CustomTextArea = ({
  label,
  placeholder,
  invalid,
  showError,
  errorMessage = "",
  ...rest
}) => {
  return (
    <Field.Root invalid={invalid}>
      <Field.Label
        color="white"
        fontWeight={"light"}
        fontSize={{
          base: "xs",
          "2xl": "sm",
          "3xl": "md",
        }}
        letterSpacing={"wider"}
      >
        {label}
      </Field.Label>

      <Textarea
        placeholder={placeholder}
        color="white"
        _placeholder={{ letterSpacing: "widest" }}
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
      {showError && <Field.ErrorText>{errorMessage}</Field.ErrorText>}
    </Field.Root>
  );
};

export default CustomTextArea;

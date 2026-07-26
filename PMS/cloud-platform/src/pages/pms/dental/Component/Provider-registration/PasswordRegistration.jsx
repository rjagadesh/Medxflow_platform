import { Box, HStack } from "@chakra-ui/react";
import PasswordField from "../../password-field";

export default function PasswordSection({
  formData,
  errors,
  handleInputChange,
}) {
  return (
    <Box w="100%">
      <HStack
        w="100%"
        spacing={4}
        align="flex-start"
        flexWrap="wrap" // ✅ allows wrapping
      ></HStack>
    </Box>
  );
}

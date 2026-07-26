import { Box, Text, Textarea, Flex } from "@chakra-ui/react";

export default function AboutQualifications({
  about,
  qualifications,
  onAboutChange,
  onQualificationsChange,
  onQualificationsKeyDown,
  errors,
}) {
  return (
    <Box gridColumn="1 / -1">
      <Flex gap={6} align="flex-start">
        {/* ABOUT */}
        <Box flex="1">
          <Text color="white">
            About{" "}
            <Text as="span" color="red">
              *
            </Text>
          </Text>

          <Textarea
            fontSize="18px"
            color="white"
            name="about"
            value={about}
            onChange={onAboutChange}
            minH="100px"
          />

          {errors?.about && (
            <Text fontSize="12px" color="#ef4444" mt="4px" textAlign={"left"}>
              {errors.about}
            </Text>
          )}
        </Box>

        {/* QUALIFICATIONS */}
        <Box flex="1">
          <Text color="white">
            Qualifications{" "}
            <Text as="span" color="red">
              *
            </Text>
          </Text>

          <Textarea
            fontSize="18px"
            color="white"
            value={qualifications}
            onChange={onQualificationsChange}
            onKeyDown={onQualificationsKeyDown}
            minH="100px"
          />

          {errors?.qualification && (
            <Text fontSize="12px" color="#ef4444" mt="4px" textAlign={"left"}>
              {errors.qualification}
            </Text>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

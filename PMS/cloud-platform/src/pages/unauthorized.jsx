import { Center, Text } from "@chakra-ui/react";

const UnauthorizedPage = () => {
  return (
    <Center height={"100%"}>
      <Text
        fontSize={{
          base: "md",
          "2xl": "lg",
          "3xl": "xl",
        }}
        letterSpacing={"wider"}
        className="text-transparent bg-clip-text transition-colors"
        bgImage="var(--bg-blue-gradient)"
      >
        Access Denied
      </Text>
    </Center>
  );
};

export default UnauthorizedPage;

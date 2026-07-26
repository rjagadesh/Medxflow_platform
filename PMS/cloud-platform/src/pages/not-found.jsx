import { Center, Text } from "@chakra-ui/react";

const NotFoundPage = () => {
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
        Page not found
      </Text>
    </Center>
  );
};

export default NotFoundPage;

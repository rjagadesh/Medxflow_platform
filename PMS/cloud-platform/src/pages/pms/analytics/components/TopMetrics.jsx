import { Box, Flex, Text } from "@chakra-ui/react";
import { cardStyles } from "../styles";

export default function TopMetrics({ data }) {
  return (
    <Flex gap={4} direction={{ base: "column", md: "row" }}>
      {data.map((metric) => {
        const isNegative = metric.delta < 0;
        return (
          <Box
            key={metric.label}
            flex="1"
            {...cardStyles}
            p={4}
            transition="transform 0.2s ease-out, box-shadow 0.2s ease-out"
            _hover={{
              transform: "translateY(-4px)",
              boxShadow: "0 28px 70px rgba(0,0,0,0.85)",
            }}
          >
            <Text
              fontSize="xs"
              textTransform="uppercase"
              letterSpacing="0.16em"
              color="rgba(255,255,255,0.6)"
              mb={2}
            >
              {metric.label}
            </Text>

            <Text fontSize="3xl" fontWeight="semibold" color="#E9FBFF">
              {metric.value}
            </Text>

            <Text
              mt={2}
              fontSize="xs"
              color={isNegative ? "#ff6b81" : "#4ade80"}
            >
              {isNegative ? "↓" : "↑"} {Math.abs(metric.delta).toLocaleString()}
              <Text as="span" ml={1} color="rgba(255,255,255,0.55)">
                {metric.deltaLabel}
              </Text>
            </Text>
          </Box>
        );
      })}
    </Flex>
  );
}

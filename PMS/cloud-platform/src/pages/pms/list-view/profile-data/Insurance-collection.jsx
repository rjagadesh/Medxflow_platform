import { Flex, Box, Text, Button } from "@chakra-ui/react";

export default function InsuranceCollectionProfile({ item = {} }) {
  return (
    <Flex flex="1" direction="column" gap={6}>
      {/* TOP SECTION */}
      <Flex justify="space-between" align="center">
        <Box>
          <Text fontSize="sm" opacity={0.7}>
            DoS {item.dos || "--"}
          </Text>
          <Text fontSize="xl" fontWeight="600">
            {item.last_name}, {item.first_name}
          </Text>
        </Box>

        <Flex gap={10}>
          <Box textAlign="right">
            <Text fontSize="lg" fontWeight="600">
              ${item.balance || "0.00"}
            </Text>
            <Text fontSize="xs" opacity={0.6}>
              Balance
            </Text>
          </Box>

          <Box textAlign="right">
            <Text fontSize="lg" fontWeight="600">
              ${item.unapplied || "0.00"}
            </Text>
            <Text fontSize="xs" opacity={0.6}>
              Unapplied
            </Text>
          </Box>

          <Box textAlign="right">
            <Text fontSize="lg" fontWeight="600">
              {item.procedures || "0"}
            </Text>
            <Text fontSize="xs" opacity={0.6}>
              Procedures
            </Text>
          </Box>
        </Flex>
      </Flex>

      {/* MIDDLE STATS */}
      <Flex
        bg="rgba(255,255,255,0.05)"
        border="1px solid rgba(255,255,255,0.12)"
        p={6}
        borderRadius="10px"
        justify="space-around"
        align="center"
      >
        <Box textAlign="center">
          <Text fontSize="4xl" fontWeight="700">
            {item.days_since_statement || 0}
          </Text>
          <Text opacity={0.7}>Days since last statement</Text>
        </Box>

        <Box textAlign="center">
          <Text fontSize="4xl" fontWeight="700">
            {item.statements_sent || 0}
          </Text>
          <Text opacity={0.7}>Statements sent</Text>
        </Box>

        <Button
          bg="#E89A72"
          color="white"
          borderRadius="full"
          px={6}
          py={5}
          _hover={{ bg: "#d28660" }}
        >
          Collect Payment
        </Button>
      </Flex>
    </Flex>
  );
}

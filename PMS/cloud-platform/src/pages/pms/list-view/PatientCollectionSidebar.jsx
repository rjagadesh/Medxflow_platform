// src/pages/PatientCollectionSidebar.jsx
import { Box, Flex, Text } from "@chakra-ui/react";
import { FiUsers } from "react-icons/fi";

export default function PatientCollectionSidebar({ selected, setSelected }) {
  const buckets = [
    { label: "All Patient Balances", value: "ALL", count: 89 },
    { label: "0 Statements Sent", value: "0", count: 65 },
    { label: "1 Statement Sent", value: "1", count: 5 },
    { label: "2 Statements Sent", value: "2", count: 0 },
    { label: "3+ Statements Sent", value: "3+", count: 19 },
  ];

  return (
    <Box w="100%" p={4} bg="#0f0f0f">
      <Flex gap={4} w="100%" wrap="wrap">
        {buckets.map((b) => {
          const isActive = selected === b.value;

          return (
            <Box
              key={b.value}
              flex="1"
              minW="260px"
              p={5}
              borderRadius="16px"
              bg="#2b2b2b"
              border="2px solid"
              borderColor={isActive ? "#7CFF00" : "rgba(124,255,0,0.35)"}
              cursor="pointer"
              transition="all 0.2s ease"
              _hover={{
                borderColor: "#7CFF00",
                transform: "translateY(-2px)",
              }}
              onClick={() => setSelected(b.value)}
            >
              {/* ICON */}
              <Box color="#7CFF00" fontSize="22px" mb={4}>
                <FiUsers />
              </Box>

              {/* LABEL */}
              <Text fontSize="lg" color={"white"} opacity={0.8} mb={1}>
                {b.label}
              </Text>

              {/* COUNT */}
              <Text fontSize="3xl" color={"white"} fontWeight="500">
                {b.count}
              </Text>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}

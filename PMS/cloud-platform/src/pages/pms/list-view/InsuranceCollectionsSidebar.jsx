// src/pages/InsuranceCollectionsSidebar.jsx

import { Box, Flex, Text } from "@chakra-ui/react";
import { FiFileText } from "react-icons/fi";

export default function InsuranceCollectionsSidebar({ selected, setSelected }) {
  const buckets = [
    { label: "All Insurance Claims", value: "ALL", count: 194 },
    { label: "Rejected Claims", value: "REJECTED", count: 7 },
    { label: "Denied Claims", value: "DENIED", count: 18 },
    {
      label: "Waiting for Adjudication",
      value: "WAITING",
      count: 110,
    },
    {
      label: "Needs Investigation",
      value: "NEEDS_INVESTIGATION",
      count: 59,
    },
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
                <FiFileText />
              </Box>

              {/* LABEL */}
              <Text fontSize="lg" color="white" opacity={0.8} mb={1}>
                {b.label}
              </Text>

              {/* COUNT */}
              <Text fontSize="3xl" color="white" fontWeight="500">
                {b.count}
              </Text>
            </Box>
          );
        })}
      </Flex>
    </Box>
  );
}

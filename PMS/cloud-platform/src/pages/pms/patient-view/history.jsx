import React from "react";
import { Box, Flex, Text, IconButton, HStack } from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const HistoryItem = ({ title, content, isLast, path }) => (
  <Link to={path ? path : "#"}>
    <Box
      py={4}
      borderBottomWidth={isLast ? "0px" : "1p, HStackx"}
      borderColor="droidalGray.300"
    >
      <Text
        fontWeight="extralight"
        textDecoration={"underline"}
        fontSize="md"
        color="white"
        mb={1}
      >
        {title}
      </Text>
      <Text fontSize="sm" color="droidalGray.400">
        {content}
      </Text>
    </Box>
  </Link>
);

const History = () => {
  const navigate = useNavigate();
  const historyItems = [
    {
      title: "Past Medical History (PMHx)",
      content: "No past medical history has been documented for this patient",
      path: "past-medical-history",
    },
    {
      title: "Past Surgical History (PSHx)",
      content: "No past surgical history has been documented for this patient",
      path: "past-surgical-history",
    },
    {
      title: "Family History (FHx)",
      content: "No Family history has been documented for this patient",
      path: "family-history",
    },
    {
      title: "Social History (SHx)",
      content: "No social history has been documented for this patient",
      path: "social-history",
    },
    {
      title: "Hospitalizations / Procedures",
      content:
        "No hospitalizations / procedures have been documented for this patient",
    },
    {
      title: "Long Term Care Facility",
      content:
        "No Long Term Care Facilities have been documented for this patient",
    },
    {
      title: "Hospice",
      content: "No hospices have been documented for this patient",
    },
    {
      title: "Implantable Devices",
      content: "No implantable devices have been documented for this patient",
    },
  ];

  return (
    <Box flex={1} height={"full"} p={6} bg="droidalBlack.400">
      <HStack mb={6}>
        <IconButton
          onClick={() => navigate(-1)}
          variant="ghost"
          color="white"
          colorScheme={"blackAlpha"}
          _hover={{
            bg: "transparent",
          }}
        >
          <ArrowLeft />
        </IconButton>
        <Text fontSize="3xl" fontWeight="light" color="white">
          History
        </Text>{" "}
      </HStack>

      <Box
        bg="droidalBlack.300"
        borderRadius="md"
        borderWidth="1px"
        borderColor="droidalGray.300"
        overflow="hidden"
      >
        {/* Header */}
        <Flex
          bg="droidalGray.600"
          p={4}
          justify="space-between"
          align="center"
          borderBottomWidth="1px"
          borderColor="droidalGray.300"
        >
          <Text letterSpacing={"widest"} color="white">
            Detail
          </Text>
          <Text fontWeight="light" color="white">
            Last Updated
          </Text>
        </Flex>

        {/* List */}
        <Box px={4}>
          {historyItems.map((item, index) => (
            <HistoryItem
              key={index}
              title={item.title}
              path={item.path}
              content={item.content}
              isLast={index === historyItems.length - 1}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default History;

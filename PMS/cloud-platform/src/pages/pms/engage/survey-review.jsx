import React, { useState } from "react";
import {
  Box,
  Text,
  Table,
  Flex,
  Input,
  InputGroup,
  HStack,
  Card,
  NativeSelect,
} from "@chakra-ui/react";

const PatientReviewActivity = () => {
  const [viewAs, setViewAs] = useState("patient");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortBy, setSortBy] = useState("date");

  // Mock data for patient reviews
  const mockReviews = [
    {
      id: 1,
      patientName: "John Doe",
      review: "Excellent service and very professional staff!",
      rating: 5,
      date: "2025-12-05",
    },
    {
      id: 2,
      patientName: "Jane Smith",
      review: "Good experience, but wait time was a bit long.",
      rating: 4,
      date: "2025-12-03",
    },
    {
      id: 3,
      patientName: "Mike Johnson",
      review: "Highly recommend! The doctor was thorough.",
      rating: 5,
      date: "2025-12-01",
    },
    {
      id: 4,
      patientName: "Emily Davis",
      review: "Friendly team, but billing was confusing.",
      rating: 3,
      date: "2025-11-28",
    },
    {
      id: 5,
      patientName: "Chris Wilson",
      review: "Outstanding care, will come back again.",
      rating: 5,
      date: "2025-11-25",
    },
  ];

  // Filter and sort logic (simplified)
  const filteredReviews = mockReviews
    .filter((review) => {
      const reviewDate = new Date(review.date);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      if (start && reviewDate < start) return false;
      if (end && reviewDate > end) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.date) - new Date(a.date);
      } else if (sortBy === "rating") {
        return b.rating - a.rating;
      }
      return 0;
    });

  return (
    <Box py={{ base: "16px", md: "24px" }}>
      <Card.Root
        bg="droidalBlack.300"
        border="1px solid"
        borderColor="#2f4d78"
        borderRadius="12px"
        p={6}
        mb={8}
      >
        {/* Top left: View As */}
        <Flex justify="flex-start" align="center" mb={6}>
          <HStack spacing={4}>
            <Text color="white" fontSize="sm" fontWeight="medium">
              View As:
            </Text>
            <NativeSelect.Root
              size="sm"
              color="white"
              borderColor="#575B67"
              _placeholder={{ color: "#9ca3af" }}
              w="auto"
            >
              <NativeSelect.Field
                value={viewAs}
                onChange={(e) => setViewAs(e.target.value)}
              >
                <option value="patient">Patient</option>
              </NativeSelect.Field>
              <NativeSelect.Indicator />
            </NativeSelect.Root>
          </HStack>
        </Flex>

        {/* Title */}
        <Text fontSize="xl" fontWeight="bold" color="white" mb={6}>
          Patient Review Activity
        </Text>

        {/* Filters: Date Range and Sort */}
        <Flex justify="flex-start" align="center" mb={6} wrap="wrap" gap={4}>
          <InputGroup size="sm" w={{ base: "full", md: "auto" }}>
            <Input
              type="date"
              placeholder="Start Date"
              fontSize="sm"
              color="white"
              borderColor="#575B67"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              _placeholder={{ color: "#9ca3af" }}
            />
          </InputGroup>
          <Input
            type="date"
            placeholder="End Date"
            fontSize="sm"
            color="white"
            borderColor="#575B67"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            w={{ base: "auto", md: "auto" }}
            _placeholder={{ color: "#9ca3af" }}
          />
          <NativeSelect.Root
            value={sortBy}
            size="sm"
            color="white"
            borderColor="#575B67"
            w="auto"
            _placeholder={{ color: "#9ca3af" }}
          >
            <NativeSelect.Field
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="date">Sort by Date</option>
              <option value="rating">Sort by Rating</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </Flex>

        {/* Table */}
        <Table.Root variant="simple" colorScheme="whiteAlpha">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader color="white">Patient Name</Table.ColumnHeader>
              <Table.ColumnHeader color="white">Review</Table.ColumnHeader>
              <Table.ColumnHeader color="white">Rating</Table.ColumnHeader>
              <Table.ColumnHeader color="white">Date</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {filteredReviews.map((review) => (
              <Table.Row key={review.id}>
                <Table.Cell color="white">{review.patientName}</Table.Cell>
                <Table.Cell color="white">{review.review}</Table.Cell>
                <Table.Cell color="white">{review.rating}/5</Table.Cell>
                <Table.Cell color="white">{review.date}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Card.Root>
    </Box>
  );
};

export default PatientReviewActivity;
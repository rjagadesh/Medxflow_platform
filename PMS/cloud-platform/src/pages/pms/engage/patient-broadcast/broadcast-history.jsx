import React from 'react';
import { Box, Text, VStack, HStack } from '@chakra-ui/react';

const BroadcastHistory = () => {
  const broadcasts = [
    {
      id: 1,
      date: '2025-12-05',
      provider: 'Dr. John Smith',
      message: 'Your appointment has been rescheduled to next week due to unforeseen circumstances.',
      recipients: 'All patients with upcoming appointments from 2025-12-10 to 2025-12-15',
      sent: 25
    },
    {
      id: 2,
      date: '2025-12-03',
      provider: 'Dr. Jane Johnson',
      message: 'Reminder: Your annual check-up is tomorrow. Please arrive 15 minutes early.',
      recipients: 'All upcoming appointments',
      sent: 18
    },
    {
      id: 3,
      date: '2025-11-28',
      provider: 'Dr. Bob Lee',
      message: 'Office closure notice: We will be closed on December 24th and 25th for the holidays.',
      recipients: 'All patients with appointments from 2025-12-20 to 2025-12-31',
      sent: 42
    }
  ];

  return (
    <Box minH="full" bg="droidalBlack.600">
      {/* Main Container */}
      <Box maxW="full" mx="auto" px={8} py={8}>
        <VStack align="stretch" gap={6}>
          {/* Header */}
          <Box>
            <Text fontSize="2xl" fontWeight="lg" color="white" mb={2}>
              Broadcast History
            </Text>
            <Text fontSize="sm" color="gray.600" lineHeight="tall">
              View past patient broadcasts, including details on messages sent and recipients.
            </Text>
          </Box>

          {/* History List */}
          <VStack align="stretch" gap={4}>
            {broadcasts.map((broadcast) => (
              <Box
                key={broadcast.id}
                bg="droidalBlack.300"
                borderRadius="lg"
                border="1px"
                borderColor="gray.200"
                p={6}
              >
                <HStack justify="space-between" align="start" mb={4}>
                  <VStack align="start" gap={1}>
                    <Text fontSize="lg" fontWeight="medium" color="white">
                      {broadcast.message}
                    </Text>
                    <HStack gap={4}>
                      <Text fontSize="sm" color="gray.400">
                        From: {broadcast.provider}
                      </Text>
                      <Text fontSize="sm" color="gray.400">
                        Sent: {broadcast.date}
                      </Text>
                    </HStack>
                  </VStack>
                  <Text fontSize="sm" fontWeight="medium" color="gray.500">
                    Delivered to {broadcast.sent} patients
                  </Text>
                </HStack>
                <Text fontSize="sm" color="gray.500">
                  Recipients: {broadcast.recipients}
                </Text>
              </Box>
            ))}
          </VStack>

          {broadcasts.length === 0 && (
            <Box textAlign="center" py={8}>
              <Text color="gray.500">No broadcasts sent yet.</Text>
            </Box>
          )}
        </VStack>
      </Box>
    </Box>
  );
};

export default BroadcastHistory;
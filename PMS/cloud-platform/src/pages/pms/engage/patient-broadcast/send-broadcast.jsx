import React, { useState } from 'react';
import { Box, Text, VStack, HStack, Textarea, Button, Input, Stack } from '@chakra-ui/react';
import { NativeSelect } from "@chakra-ui/react";
import { User } from 'lucide-react';
import CustomButton from "@/components/button/button";

const SendBroadcast = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [message, setMessage] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const maxChars = 140;

  const providers = [
    'Dr. John Smith',
    'Dr. Jane Johnson',
    'Dr. Bob Lee',
    'Dr. Alice Wong'
  ];

  const steps = [
    { number: 1, title: 'WRITE A MESSAGE' },
    { number: 2, title: 'SPECIFY RECIPIENTS' },
    { number: 3, title: 'REVIEW AND SEND' }
  ];

  const isStep1Valid = message.trim() && selectedProvider;
  const isStep2Valid = true; // For simplicity, always valid; can add date validation if needed

  const getRecipientSummary = () => {
    if (dateFrom && dateTo) {
      return `Patients with appointments from ${dateFrom} to ${dateTo} for ${selectedProvider}`;
    }
    return `All patients with upcoming appointments for ${selectedProvider}`;
  };

  return (
    <Box minH="full" bg="droidalBlack.600">
      {/* Main Container */}
      <Box maxW="full" mx="auto" px={8} py={8}>
        <HStack align="start" gap={8}>
          {/* Main Content */}
          <Box flex="1">
            <VStack align="stretch" gap={6}>
              {/* Header */}
              <Box>
                <Text fontSize="2xl" fontWeight="lg" color="white" mb={2}>
                  Send a Patient Broadcast
                </Text>
                <Text fontSize="sm" color="gray.600" lineHeight="tall">
                  Broadcast a quick message to patients who have an upcoming appointment. This is handy for
                  situations such as needing to reschedule a provider's upcoming appointments.
                </Text>
              </Box>

              {/* Step Indicators */}
              <HStack gap={6} py={4}>
                {steps.map((step) => (
                  <HStack key={step.number} gap={2}>
                    <Box
                      w="32px"
                      h="32px"
                      borderRadius="full"
                      border={currentStep === step.number ? '#69A914 1px solid' : undefined}
                      bg={currentStep === step.number ? 'transparent' : 'gray.300'}
                      color={currentStep === step.number ? '#69A914' : 'gray.600'}
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      fontWeight="semibold"
                      fontSize="sm"
                    >
                      {step.number}
                    </Box>
                    <Text fontSize="sm" fontWeight="medium" color={currentStep === step.number ? "#69A914" : "gray.400"}>
                      {step.title}
                    </Text>
                  </HStack>
                ))}
              </HStack>

              {/* Form */}
              <Box borderRadius="lg" border="1px" borderColor="gray.200" bgColor={'droidalBlack.300'} p={8}>
                {currentStep === 1 && (
                  <VStack align="stretch" gap={6}>
                    {/* Provider Selection */}
                    <Box>
                      <Text fontSize="sm" fontWeight="lighter" color="gray.200" mb={3}>
                        Who would you like the message to come from?
                      </Text>
                      <Box position="relative">
                        <NativeSelect.Root>
                          <NativeSelect.Field
                            value={selectedProvider}
                            onChange={(e) => setSelectedProvider(e.target.value)}
                            size="lg"
                            bg="droidalBlack.600"
                            border="1px"
                            color={'white'}
                            letterSpacing={'2px'}
                            borderColor="gray.300"
                            _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                          >
                            <option value="">Choose provider</option>
                            {providers.map((provider) => (
                              <option key={provider} value={provider}>
                                {provider}
                              </option>
                            ))}
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                        <Box position="absolute" left={3} top="50%" transform="translateY(-50%)" pointerEvents="none">
                        </Box>
                      </Box>
                    </Box>

                    {/* Message Input */}
                    <Box>
                      <Text fontSize="sm" fontWeight="lighter" color="gray.200" mb={3}>
                        What do you want to tell your patients?
                      </Text>
                      <Textarea
                        placeholder="Type message here..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        maxLength={maxChars}
                        rows={6}
                        color={'white'}
                        bg="droidalBlack.600"
                        letterSpacing={'2px'}
                        border="1px"
                        borderColor="gray.300"
                        _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                        resize="none"
                      />
                      <Text fontSize="xs" color="gray.500" mt={2}>
                        {message.length}/{maxChars} characters
                      </Text>
                    </Box>

                    {/* Next Button */}
                    <Box pt={4}>
                      <CustomButton
                        onClick={() => setCurrentStep(2)}
                      >
                        Next: Specify Recipients
                      </CustomButton>
                    </Box>
                  </VStack>
                )}

                {currentStep === 2 && (
                  <VStack align="stretch" gap={6}>
                    {/* Date Range Selection */}
                    <Box>
                      <Text fontSize="sm" fontWeight="lighter" color="gray.200" mb={3}>
                        Select the appointment date range for recipients
                      </Text>
                      <HStack gap={4}>
                        <Input
                          type="date"
                          value={dateFrom}
                          onChange={(e) => setDateFrom(e.target.value)}
                          size="lg"
                          bg="droidalBlack.600"
                          border="1px"
                          color={'white'}
                          letterSpacing={'2px'}
                          borderColor="gray.300"
                          _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                          placeholder="From"
                        />
                        <Input
                          type="date"
                          value={dateTo}
                          onChange={(e) => setDateTo(e.target.value)}
                          size="lg"
                          bg="droidalBlack.600"
                          border="1px"
                          color={'white'}
                          letterSpacing={'2px'}
                          borderColor="gray.300"
                          _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                          placeholder="To"
                        />
                      </HStack>
                      <Text fontSize="xs" color="gray.500" mt={1}>
                        Leave blank for all upcoming appointments
                      </Text>
                    </Box>

                    {/* Navigation Buttons */}
                    <HStack justify="space-between" pt={4}>
                      <CustomButton
                        onClick={() => setCurrentStep(1)}
                      >
                        Back
                      </CustomButton>
                      <CustomButton
                        onClick={() => setCurrentStep(3)}
                      >
                        Next: Review and Send
                      </CustomButton>
                    </HStack>
                  </VStack>
                )}

                {currentStep === 3 && (
                  <VStack align="stretch" gap={6}>
                    {/* Review Summary */}
                    <Box>
                      <Text fontSize="lg" fontWeight="bold" color="white" mb={4}>
                        Review Your Broadcast
                      </Text>
                      <VStack align="stretch" gap={4} bg="droidalBlack.600" p={4} borderRadius="md">
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.400" mb={1}>
                            From:
                          </Text>
                          <Text fontSize="md" color="white">
                            {selectedProvider}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.400" mb={1}>
                            Message:
                          </Text>
                          <Text fontSize="md" color="white">
                            {message}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="sm" fontWeight="medium" color="gray.400" mb={1}>
                            Recipients:
                          </Text>
                          <Text fontSize="md" color="white">
                            {getRecipientSummary()}
                          </Text>
                        </Box>
                      </VStack>
                    </Box>

                    {/* Navigation Buttons */}
                    <HStack justify="space-between" pt={4}>
                      <CustomButton
                        onClick={() => setCurrentStep(2)}
                      >
                        Back
                      </CustomButton>
                      <CustomButton
                      >
                        Send Broadcast
                      </CustomButton>
                    </HStack>
                  </VStack>
                )}
              </Box>
            </VStack>
          </Box>
        </HStack>
      </Box>
    </Box>
  );
};

export default SendBroadcast;
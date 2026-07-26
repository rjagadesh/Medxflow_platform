import React, { useState, useMemo } from 'react';
import { Box, Text, VStack, HStack, Input, Button, Table, Portal } from '@chakra-ui/react';
import { NativeSelect, MenuContent, MenuItem, MenuRoot, MenuTrigger, MenuPositioner } from "@chakra-ui/react";
import { Settings, User, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import CustomButton from "@/components/button/button";

const PendingReview = () => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [searchPatient, setSearchPatient] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [sortOrder, setSortOrder] = useState('asc');

  const providers = [
    'Dr. John Smith',
    'Dr. Jane Johnson',
    'Dr. Bob Lee',
    'Dr. Alice Wong'
  ];

  const tabs = [
    { id: 'pending', label: 'Pending Review', count: null },
    { id: 'not-submitted', label: 'Not Submitted by Patient', count: 58 },
    { id: 'merged', label: 'Merged', count: null }
  ];

  const pendingPatients = [
    { 
      date: '12/09/2025', 
      name: 'PATRICIA MOORE', 
      submittedDate: '12/09/2025 09:15 AM',
      provider: 'Dr. John Smith',
      formType: 'New Patient Intake'
    },
    { 
      date: '12/09/2025', 
      name: 'THOMAS GARCIA', 
      submittedDate: '12/09/2025 08:45 AM',
      provider: 'Dr. Jane Johnson',
      formType: 'Annual Health Update'
    },
    { 
      date: '12/08/2025', 
      name: 'LINDA RODRIGUEZ', 
      submittedDate: '12/08/2025 04:30 PM',
      provider: 'Dr. John Smith',
      formType: 'New Patient Intake'
    },
    { 
      date: '12/08/2025', 
      name: 'WILLIAM JACKSON', 
      submittedDate: '12/08/2025 02:15 PM',
      provider: 'Dr. Bob Lee',
      formType: 'Pre-Appointment Form'
    },
    { 
      date: '12/08/2025', 
      name: 'MARIA HERNANDEZ', 
      submittedDate: '12/08/2025 11:20 AM',
      provider: 'Dr. Alice Wong',
      formType: 'New Patient Intake'
    },
    { 
      date: '12/07/2025', 
      name: 'JAMES LOPEZ', 
      submittedDate: '12/07/2025 03:45 PM',
      provider: 'Dr. John Smith',
      formType: 'Annual Health Update'
    },
    { 
      date: '12/07/2025', 
      name: 'BARBARA WILSON', 
      submittedDate: '12/07/2025 01:30 PM',
      provider: 'Dr. Jane Johnson',
      formType: 'New Patient Intake'
    },
    { 
      date: '12/07/2025', 
      name: 'RICHARD MARTINEZ', 
      submittedDate: '12/07/2025 10:00 AM',
      provider: 'Dr. Bob Lee',
      formType: 'Pre-Appointment Form'
    }
  ];

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filteredPatients = useMemo(() => {
    return pendingPatients.filter((patient) => {
      const matchesProvider = !selectedProvider || patient.provider.includes(selectedProvider);
      const matchesSearch = !searchPatient || patient.name.toLowerCase().includes(searchPatient.toLowerCase());
      return matchesProvider && matchesSearch;
    }).sort((a, b) => {
      const dateA = new Date(a.submittedDate);
      const dateB = new Date(b.submittedDate);
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [selectedProvider, searchPatient, sortOrder]);

  return (
    <Box minH="100vh" bg="droidalBlack.600">
      {/* Main Container */}
      <Box maxW="full" mx="auto" px={8} py={6}>
        {/* Header */}
        <HStack justify="space-between" mb={6}>
          <HStack gap={3}>
            <Text fontSize="2xl" fontWeight="semibold" color="white">
              Patient Intake
            </Text>
            <Button
              variant="ghost"
              size="sm"
              color="gray.400"
              _hover={{ color: "gray.300" }}
              leftIcon={<Settings size={16} />}
            >
              Settings
            </Button>
          </HStack>
          <CustomButton>
            SEND FORMS
          </CustomButton>
        </HStack>

        {/* Tabs and Filters */}
        <HStack justify="space-between" mb={6}>

          {/* Right Filters */}
          <HStack gap={4}>
            <Box w="200px">
              <NativeSelect.Root>
                <NativeSelect.Field
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  size="md"
                  bg="droidalBlack.300"
                  border="1px"
                  color="white"
                  borderColor="gray.600"
                  _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
                >
                  <option value="">Provider</option>
                  {providers.map((provider) => (
                    <option key={provider} value={provider}>
                      {provider}
                    </option>
                  ))}
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Box>

            <Input
              placeholder="Patient"
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              size="md"
              w="200px"
              bg="droidalBlack.300"
              border="1px"
              color="white"
              borderColor="gray.600"
              _placeholder={{ color: 'gray.500' }}
              _focus={{ borderColor: "teal.500", boxShadow: "0 0 0 1px teal.500" }}
            />
          </HStack>
        </HStack>

        {/* Info Banner */}
        <Box
          bg="droidalGray.600"
          border="1px"
          borderColor="gray.500"
          borderRadius="md"
          p={4}
          mb={6}
        >
          <HStack gap={2}>
            <Clock size={20} color="#F59E0B" />
            <Text color="gray.300" fontSize="sm">
              These patient intake forms have been submitted and are awaiting review. Please review and merge them into patient records as soon as possible.
            </Text>
          </HStack>
        </Box>

        {/* Table */}
        <Box
          bg="droidalBlack.600"
          borderRadius="lg"
          overflow="hidden"
        >
          <Table.Root size="md" variant="outline">
            <Table.Header bg="droidalGray.600">
              <Table.Row>
                <Table.ColumnHeader color="gray.300" fontWeight="semibold" fontSize="sm" py={4}>
                  <HStack 
                    gap={1} 
                    cursor="pointer" 
                    onClick={toggleSort}
                    _hover={{ color: "gray.100" }}
                  >
                    <Text>Submitted Date</Text>
                    {sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </HStack>
                </Table.ColumnHeader>
                <Table.ColumnHeader color="gray.300" fontWeight="semibold" fontSize="sm" py={4}>
                  <HStack gap={1}>
                    <User size={16} />
                    <Text>Patient</Text>
                  </HStack>
                </Table.ColumnHeader>
                <Table.ColumnHeader color="gray.300" fontWeight="semibold" fontSize="sm" py={4}>
                  Provider
                </Table.ColumnHeader>
                <Table.ColumnHeader color="gray.300" fontWeight="semibold" fontSize="sm" py={4}>
                  Form Type
                </Table.ColumnHeader>
                <Table.ColumnHeader color="gray.300" fontWeight="semibold" fontSize="sm" py={4}>
                  Status
                </Table.ColumnHeader>
                <Table.ColumnHeader color="gray.300" fontWeight="semibold" fontSize="sm" py={4} textAlign="right">
                  Actions
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredPatients.map((patient, index) => (
                <Table.Row key={index} _hover={{ bg: "droidalGray.600" }}>
                  <Table.Cell color="gray.300" py={4}>
                    {patient.submittedDate}
                  </Table.Cell>
                  <Table.Cell color="gray.300" py={4} fontWeight="medium">
                    {patient.name}
                  </Table.Cell>
                  <Table.Cell color="gray.300" py={4}>
                    {patient.provider}
                  </Table.Cell>
                  <Table.Cell color="gray.300" py={4}>
                    {patient.formType}
                  </Table.Cell>
                  <Table.Cell py={4}>
                    <HStack gap={2}>
                      <Clock size={16} color="#F59E0B" />
                      <Text color="yellow.400" fontWeight="medium" fontSize="sm">
                        Pending Review
                      </Text>
                    </HStack>
                  </Table.Cell>
                  <Table.Cell py={4} textAlign="right">
                    <MenuRoot>
                      <MenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          borderColor="gray.300"
                          color="gray.300"
                          _hover={{ bg: "droidalGray.600" }}
                          px={4}
                        >
                          Review
                          <ChevronDown size={16} />
                        </Button>
                      </MenuTrigger>
                      <Portal>
                        <MenuPositioner>
                          <MenuContent bg="droidalGray.600" border="1px" borderColor="gray.200">
                            <MenuItem value="review" color="gray.200" _hover={{ bg: "gray.600" }}>
                              Review & Merge
                            </MenuItem>
                            <MenuItem value="view" color="gray.200" _hover={{ bg: "gray.600" }}>
                              View Form Details
                            </MenuItem>
                            <MenuItem value="print" color="gray.200" _hover={{ bg: "gray.600" }}>
                              Print Form
                            </MenuItem>
                            <MenuItem value="request-changes" color="gray.200" _hover={{ bg: "gray.600" }}>
                              Request Changes
                            </MenuItem>
                            <MenuItem value="reject" color="red.600" _hover={{ bg: "red.200" }}>
                              Reject Form
                            </MenuItem>
                          </MenuContent>
                        </MenuPositioner>
                      </Portal>
                    </MenuRoot>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Box>

        {/* Summary Footer */}
        <Box mt={6} p={4} bg="droidalBlack.300" borderRadius="md">
          <HStack justify="space-between">
            <Text color="gray.400" fontSize="sm">
              Showing {filteredPatients.length} of {pendingPatients.length} pending forms
            </Text>
            <HStack gap={4}>
              <Button
                size="sm"
                variant="ghost"
                color="gray.400"
                _hover={{ color: "white" }}
              >
                Previous
              </Button>
              <HStack gap={1}>
                <Button size="sm" bg="#69A914" color="white" _hover={{ bg: "#5a8f12" }}>
                  1
                </Button>
                <Button size="sm" variant="ghost" color="gray.400" _hover={{ bg: "droidalBlack.400" }}>
                  2
                </Button>
                <Button size="sm" variant="ghost" color="gray.400" _hover={{ bg: "droidalBlack.400" }}>
                  3
                </Button>
              </HStack>
              <Button
                size="sm"
                variant="ghost"
                color="gray.400"
                _hover={{ color: "white" }}
              >
                Next
              </Button>
            </HStack>
          </HStack>
        </Box>
      </Box>
    </Box>
  );
};

export default PendingReview;
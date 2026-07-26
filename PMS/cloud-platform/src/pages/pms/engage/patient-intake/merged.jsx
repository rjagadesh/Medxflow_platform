import React, { useState, useMemo } from 'react';
import { Box, Text, VStack, HStack, Input, Button, Table, Portal } from '@chakra-ui/react';
import { NativeSelect, MenuContent, MenuItem, MenuRoot, MenuTrigger, MenuPositioner } from "@chakra-ui/react";
import { Settings, User, ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import CustomButton from "@/components/button/button";

const MergedRequest = () => {
  const [selectedProvider, setSelectedProvider] = useState('');
  const [searchPatient, setSearchPatient] = useState('');
  const [activeTab, setActiveTab] = useState('merged');
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

  const mergedPatients = [
    { 
      date: '12/08/2025', 
      name: 'SARAH THOMPSON', 
      mergedBy: 'Dr. John Smith',
      originalDate: '11/15/2025',
      status: 'Completed'
    },
    { 
      date: '12/07/2025', 
      name: 'ROBERT MARTINEZ', 
      mergedBy: 'Dr. Jane Johnson',
      originalDate: '11/20/2025',
      status: 'Completed'
    },
    { 
      date: '12/06/2025', 
      name: 'EMILY HENDERSON', 
      mergedBy: 'Dr. John Smith',
      originalDate: '11/18/2025',
      status: 'Completed'
    },
    { 
      date: '12/05/2025', 
      name: 'MICHAEL ANDERSON', 
      mergedBy: 'Dr. Bob Lee',
      originalDate: '11/22/2025',
      status: 'Completed'
    },
    { 
      date: '12/04/2025', 
      name: 'JESSICA WILLIAMS', 
      mergedBy: 'Dr. Alice Wong',
      originalDate: '11/25/2025',
      status: 'Completed'
    },
    { 
      date: '12/03/2025', 
      name: 'DAVID BROWN', 
      mergedBy: 'Dr. John Smith',
      originalDate: '11/28/2025',
      status: 'Completed'
    },
    { 
      date: '12/02/2025', 
      name: 'AMANDA TAYLOR', 
      mergedBy: 'Dr. Jane Johnson',
      originalDate: '11/29/2025',
      status: 'Completed'
    },
    { 
      date: '12/01/2025', 
      name: 'CHRISTOPHER DAVIS', 
      mergedBy: 'Dr. Bob Lee',
      originalDate: '11/30/2025',
      status: 'Completed'
    }
  ];

  const toggleSort = () => {
    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
  };

  const filteredPatients = useMemo(() => {
    return mergedPatients.filter((patient) => {
      const matchesProvider = !selectedProvider || patient.mergedBy.includes(selectedProvider);
      const matchesSearch = !searchPatient || patient.name.toLowerCase().includes(searchPatient.toLowerCase());
      return matchesProvider && matchesSearch;
    }).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
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
            <CheckCircle size={20} color="#10B981" />
            <Text color="gray.300" fontSize="sm">
              These patient intake forms have been successfully merged into patient records. All data has been integrated and is now part of the patient's medical history.
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
                    <Text>Merged Date</Text>
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
                  Merged By
                </Table.ColumnHeader>
                <Table.ColumnHeader color="gray.300" fontWeight="semibold" fontSize="sm" py={4}>
                  Original Sent Date
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
                    {patient.date}
                  </Table.Cell>
                  <Table.Cell color="gray.300" py={4} fontWeight="medium">
                    {patient.name}
                  </Table.Cell>
                  <Table.Cell color="gray.300" py={4}>
                    {patient.mergedBy}
                  </Table.Cell>
                  <Table.Cell color="gray.300" py={4}>
                    {patient.originalDate}
                  </Table.Cell>
                  <Table.Cell py={4}>
                    <HStack gap={2}>
                      <CheckCircle size={16} color="#10B981" />
                      <Text color="green.400" fontWeight="medium" fontSize="sm">
                        {patient.status}
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
                          View
                          <ChevronDown size={16} />
                        </Button>
                      </MenuTrigger>
                      <Portal>
                        <MenuPositioner>
                          <MenuContent bg="droidalGray.600" border="1px" borderColor="gray.200">
                            <MenuItem value="view-record" color="gray.200" _hover={{ bg: "gray.600" }}>
                              View Patient Record
                            </MenuItem>
                            <MenuItem value="view-form" color="gray.200" _hover={{ bg: "gray.600" }}>
                              View Original Form
                            </MenuItem>
                            <MenuItem value="history" color="gray.200" _hover={{ bg: "gray.600" }}>
                              View Merge History
                            </MenuItem>
                            <MenuItem value="export" color="gray.200" _hover={{ bg: "gray.600" }}>
                              Export Data
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
              Showing {filteredPatients.length} of {mergedPatients.length} merged records
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

export default MergedRequest;
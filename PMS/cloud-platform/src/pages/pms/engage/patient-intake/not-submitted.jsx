import React, { useState, useMemo } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Input,
  Button,
  Table,
  Portal,
} from "@chakra-ui/react";
import {
  NativeSelect,
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
  MenuPositioner,
} from "@chakra-ui/react";
import { Settings, User, ChevronDown, ChevronUp } from "lucide-react";
import CustomButton from "@/components/button/button";

const NotSubmittedRequest = () => {
  const [selectedProvider, setSelectedProvider] = useState("");
  const [searchPatient, setSearchPatient] = useState("");
  const [activeTab, setActiveTab] = useState("not-submitted");
  const [sortOrder, setSortOrder] = useState("asc");

  const providers = [
    "Dr. John Smith",
    "Dr. Jane Johnson",
    "Dr. Bob Lee",
    "Dr. Alice Wong",
  ];

  const tabs = [
    { id: "pending", label: "Pending Review", count: null },
    { id: "not-submitted", label: "Not Submitted by Patient", count: 58 },
    { id: "merged", label: "Merged", count: null },
  ];

  const patients = [
    { date: "11/13/2025", name: "SHELBEY BELLYBARRA", appointment: "", provider: "Dr. John Smith" },
    { date: "11/10/2025", name: "JULIANNA CHEN", appointment: "", provider: "Dr. Jane Johnson" },
    { date: "11/17/2025", name: "JARED NUFFER", appointment: "", provider: "Dr. Bob Lee" },
    { date: "11/17/2025", name: "KIMBERLY BARNETT-WHITE", appointment: "", provider: "Dr. Alice Wong" },
    { date: "11/24/2025", name: "MEGAN ARGABRIGHT", appointment: "", provider: "Dr. John Smith" },
    { date: "11/25/2025", name: "VERNICLE ROBINSON", appointment: "", provider: "Dr. Jane Johnson" },
    { date: "11/26/2025", name: "ALEJANDRO CARLOS", appointment: "", provider: "Dr. Bob Lee" },
    { date: "11/26/2025", name: "MEGAN ARGABRIGHT", appointment: "", provider: "Dr. Alice Wong" },
    { date: "11/26/2025", name: "HADLEY ARGABRIGHT", appointment: "", provider: "Dr. John Smith" },
    { date: "12/02/2025", name: "BRENTLEY HILL", appointment: "", provider: "Dr. Jane Johnson" },
  ];

  const toggleSort = () => {
    setSortOrder(sortOrder === "asc" ? "desc" : "asc");
  };

  const filteredPatients = useMemo(() => {
    return patients.filter((patient) => {
      const matchesProvider = !selectedProvider || patient.provider.includes(selectedProvider);
      const matchesSearch = !searchPatient || patient.name.toLowerCase().includes(searchPatient.toLowerCase());
      return matchesProvider && matchesSearch;
    }).sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
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
          </HStack>
          <CustomButton>SEND FORMS</CustomButton>
        </HStack>

        {/* Tabs and Filters */}
        <HStack justify="space-between" mb={6}>
          {/* Left Tabs */}

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
                  _focus={{
                    borderColor: "teal.500",
                    boxShadow: "0 0 0 1px teal.500",
                  }}
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
              _placeholder={{ color: "gray.500" }}
              _focus={{
                borderColor: "teal.500",
                boxShadow: "0 0 0 1px teal.500",
              }}
            />
          </HStack>
        </HStack>

        {/* Table */}
        <Box bg="droidalBlack.600" borderRadius="lg" overflow="hidden">
          <Table.Root size="md" variant="outline">
            <Table.Header bg="droidalGray.600">
              <Table.Row>
                <Table.ColumnHeader
                  color="gray.300"
                  fontWeight="semibold"
                  fontSize="sm"
                  py={4}
                >
                  First Sent
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="gray.300"
                  fontWeight="semibold"
                  fontSize="sm"
                  py={4}
                >
                  <HStack gap={1}>
                    <User size={16} />
                    <Text>Patient</Text>
                  </HStack>
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="gray.300"
                  fontWeight="semibold"
                  fontSize="sm"
                  py={4}
                >
                  <HStack
                    gap={1}
                    cursor="pointer"
                    onClick={toggleSort}
                    _hover={{ color: "gray.100" }}
                  >
                    <Text>Appointment</Text>
                    {sortOrder === "asc" ? (
                      <ChevronUp size={16} />
                    ) : (
                      <ChevronDown size={16} />
                    )}
                  </HStack>
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="gray.300"
                  fontWeight="semibold"
                  fontSize="sm"
                  py={4}
                  textAlign="right"
                >
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
                    {patient.appointment || "-"}
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
                          Resend
                          <ChevronDown size={16} />
                        </Button>
                      </MenuTrigger>
                      <Portal>
                        <MenuPositioner>
                          <MenuContent
                            bg="droidalGray.600"
                            border="1px"
                            borderColor="gray.200"
                          >
                            <MenuItem
                              value="resend"
                              color="gray.200"
                              _hover={{ bg: "gray.600" }}
                            >
                              Resend Form
                            </MenuItem>
                            <MenuItem
                              value="view"
                              color="gray.200"
                              _hover={{ bg: "gray.600" }}
                            >
                              View Details
                            </MenuItem>
                            <MenuItem
                              value="delete"
                              color="red.600"
                              _hover={{ bg: "red.200" }}
                            >
                              Delete Request
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
              Showing {filteredPatients.length} of {patients.length} not submitted requests
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

export default NotSubmittedRequest;
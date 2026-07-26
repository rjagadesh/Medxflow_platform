import React, { useState } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Grid,
  SimpleGrid,
  Tabs,
  Checkbox,
  Flex,
  IconButton,
  Separator,
  Accordion,
  Textarea,
} from "@chakra-ui/react";
import { LuX, LuChevronRight, LuChevronLeft } from "react-icons/lu";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import CustomButton from "@/components/button/button";
import GenericTable from "@/components/table/table";
import { LucideHelpCircle } from "lucide-react";
import PatientSearch from "@/pages/pms/dental/platform-sub-components/patient-search";

const InputGroupWithX = ({ placeholder, label, value, onClick, onClear }) => {
  return (
    <Box w="full">
      {label && (
        <Text
          fontSize="xs"
          mb={1}
          color="white"
          letterSpacing={"wide"}
          fontWeight={"light"}
        >
          {label}
        </Text>
      )}
      <HStack spacing={1} w="full">
        <Box
          flex={1}
          bg="droidalBlack.300"
          border="1px solid #2f4d78"
          rounded="md"
          px={3}
          py={1}
          cursor="pointer"
          _hover={{ borderColor: "#00BBF2" }}
          onClick={onClick}
          h="32px"
          display="flex"
          alignItems="center"
        >
          <Text fontSize="sm" color={value ? "white" : "#90a6c6"} isTruncated>
            {value || placeholder}
          </Text>
        </Box>
        <IconButton
          aria-label="Clear"
          size="xs"
          variant="ghost"
          color="white"
          _hover={{ bg: "red.500" }}
          onClick={onClear}
          h="32px"
          minW="32px"
          border="1px solid #2f4d78"
          rounded="md"
        >
          <LuX size={14} />
        </IconButton>
      </HStack>
    </Box>
  );
};

const PROCEDURE_COLUMNS = [
  { title: "From", accessor_key: "from" },
  { title: "To", accessor_key: "to" },
  { title: "Procedure", accessor_key: "procedure" },
  { title: "Mod 1", accessor_key: "mod1" },
  { title: "Units", accessor_key: "units" },
  { title: "Unit Charge", accessor_key: "unitCharge" },
  { title: "Total Charge", accessor_key: "totalCharge" },
  { title: "Diag 1", accessor_key: "diag1" },
  { title: "Diag 2", accessor_key: "diag2" },
  { title: "Diag 3", accessor_key: "diag3" },
  { title: "Diag 4", accessor_key: "diag4" },
  { title: "Apply Payment", accessor_key: "applyPayment" },
  { title: "Mod 2", accessor_key: "mod2" },
  { title: "Start Time", accessor_key: "startTime" },
  { title: "End Time", accessor_key: "endTime" },
];

const AMBULANCE_CERTIFICATIONS = [
  "01 - Patient was admitted to a hospital",
  "02 - Patient was bed confined before the ambulance service",
  "03 - Patient was bed confined after the ambulance service",
  "04 - Patient was moved by stretcher",
  "05 - Patient was unconscious or in shock",
  "06 - Patient was transported in an emergency situation",
  "07 - Patient had to be physically restrained",
  "08 - Patient had visible hemorrhaging",
  "09 - Ambulance service was medically necessary",
];

const EncounterModal = () => {
  const [tabValue, setTabValue] = useState("general");
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  // Ambulance Certification State
  const [availableCerts, setAvailableCerts] = useState(
    AMBULANCE_CERTIFICATIONS
  );
  const [selectedCerts, setSelectedCerts] = useState([]);
  const [selectedAvailable, setSelectedAvailable] = useState([]);
  const [selectedSelected, setSelectedSelected] = useState([]);

  const handleFindPatient = () => {
    setShowPatientSearch(true);
  };

  const handlePatientSelect = (patient) => {
    setSelectedPatient(patient);
    setShowPatientSearch(false);
  };

  const moveRight = () => {
    const newSelected = [...selectedCerts, ...selectedAvailable];
    const newAvailable = availableCerts.filter(
      (item) => !selectedAvailable.includes(item)
    );
    setSelectedCerts(newSelected);
    setAvailableCerts(newAvailable);
    setSelectedAvailable([]);
  };

  const moveLeft = () => {
    const newAvailable = [...availableCerts, ...selectedSelected];
    const newSelected = selectedCerts.filter(
      (item) => !selectedSelected.includes(item)
    );
    setAvailableCerts(newAvailable);
    setSelectedCerts(newSelected);
    setSelectedSelected([]);
  };

  if (showPatientSearch) {
    return (
      <Box h="full" w="full" position="relative" bg="droidalBlack.400">
        <Box position="absolute" top={4} right={4} zIndex={10}>
          <CustomButton
            onClick={() => setShowPatientSearch(false)}
            variant="outline"
            size="sm"
          >
            Back to Form
          </CustomButton>
        </Box>
        <PatientSearch onSelect={handlePatientSelect} />
      </Box>
    );
  }

  return (
    <>
      <Box
        bg="droidalBlack.400"
        w="full"
        color="white"
        border="1px solid #2f4d78"
        borderRadius={"md"}
        overflowY="auto"
        style={{
          height: "calc(100vh - 140px)",
        }}
      >
        {/* Header */}
        <Flex px={4} py={2} justify="space-between" align="center">
          <Text fontWeight="light" fontSize="lg">
            New Encounter
          </Text>
          <HStack spacing={2}>
            <IconButton
              aria-label="Help"
              icon={<LucideHelpCircle />}
              variant="ghost"
              size="xs"
              color="white"
            />
            <IconButton
              aria-label="Close"
              icon={<LuX />}
              variant="ghost"
              size="xs"
              color="white"
            />
          </HStack>
        </Flex>

        {/* Tabs */}
        <Tabs.Root
          value={tabValue}
          onValueChange={(e) => setTabValue(e.value)}
          variant="line"
        >
          <Tabs.List
            bg="droidalBlack.300"
            px={4}
            borderBottom="1px solid #2f4d78"
            css={{
              "& [data-selected]::before": {
                backgroundColor: "#00BBF2 !important",
              },
            }}
          >
            <Tabs.Trigger
              value="general"
              color="white"
              letterSpacing={"wide"}
              fontWeight={"light"}
              _selected={{ color: "#00BBF2" }}
            >
              General
            </Tabs.Trigger>
            <Tabs.Trigger
              value="log"
              color="white"
              fontWeight={"light"}
              letterSpacing={"wide"}
              _selected={{ color: "#00BBF2", borderColor: "#00BBF2" }}
            >
              Log
            </Tabs.Trigger>
            <Tabs.Trigger
              value="documents"
              letterSpacing={"wide"}
              color="white"
              fontWeight={"light"}
              _selected={{ color: "#00BBF2", borderColor: "#00BBF2" }}
            >
              Documents (New)
            </Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="general" p={2}>
            <VStack spacing={4} align="stretch">
              <Accordion.Root defaultValue={["patient"]}>
                {/* Patient Section */}
                <Accordion.Item
                  value="patient"
                  borderBottom="1px solid #2f4d78"
                  borderTop="none"
                >
                  <Accordion.ItemTrigger
                    py={3}
                    px={4}
                    _hover={{ bg: "droidalBlack.300" }}
                  >
                    <Text
                      fontSize="md"
                      fontWeight="light"
                      flex="1"
                      textAlign="left"
                    >
                      Patient
                    </Text>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Box p={4}>
                      <Grid
                        templateColumns={{ base: "1fr", md: "2fr 1fr" }}
                        gap={6}
                      >
                        <VStack gap={3} align="stretch">
                          <InputGroupWithX
                            placeholder="Appointment..."
                            onClick={() => console.log("Find Appointment")}
                          />
                          <InputGroupWithX
                            placeholder="Patient..."
                            value={selectedPatient ? selectedPatient.name : ""}
                            onClick={handleFindPatient}
                            onClear={() => setSelectedPatient(null)}
                          />
                          <InputGroupWithX
                            placeholder="Case..."
                            onClick={() => console.log("Find Case")}
                          />
                          <InputGroupWithX
                            placeholder="Prior Authorization..."
                            onClick={() => console.log("Find Prior Auth")}
                          />
                        </VStack>
                        <VStack align="start" gap={4}>
                          <Box w="full">
                            <Text fontSize="xs" mb={1} color="white">
                              Primary Insurance:
                            </Text>
                            <Box
                              h="32px"
                              borderBottom="1px solid #2f4d78"
                              w="full"
                            />
                          </Box>
                          <Checkbox.Root>
                            <Checkbox.HiddenInput />
                            <Checkbox.Control border="1px solid #2f4d78" />
                            <Checkbox.Label color="white" fontSize="sm">
                              Do not send claim electronically
                            </Checkbox.Label>
                          </Checkbox.Root>
                        </VStack>
                      </Grid>
                    </Box>
                  </Accordion.ItemContent>
                </Accordion.Item>

                {/* Dates Section */}
                <Accordion.Item value="dates" borderBottom="1px solid #2f4d78">
                  <Accordion.ItemTrigger
                    py={3}
                    px={4}
                    _hover={{ bg: "droidalBlack.300" }}
                  >
                    <Text
                      fontSize="md"
                      fontWeight="light"
                      flex="1"
                      textAlign="left"
                    >
                      Dates
                    </Text>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Box p={4}>
                      <Grid
                        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                        gap={6}
                      >
                        <VStack gap={3} align="stretch">
                          <HStack>
                            <Text
                              fontSize="xs"
                              letterSpacing={"wide"}
                              fontWeight={"light"}
                              w="100px"
                            >
                              From Date:
                            </Text>
                            <CustomInput type="date" w="full" h="32px" />
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="xs"
                              letterSpacing={"wide"}
                              fontWeight={"light"}
                              w="100px"
                            >
                              Through Date:
                            </Text>
                            <CustomInput type="date" w="full" h="32px" />
                          </HStack>
                        </VStack>
                        <VStack gap={3} align="stretch">
                          <HStack>
                            <Text
                              fontSize="xs"
                              letterSpacing={"wide"}
                              fontWeight={"light"}
                              w="100px"
                            >
                              Post Date:
                            </Text>
                            <CustomInput type="date" w="full" h="32px" />
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="xs"
                              letterSpacing={"wide"}
                              fontWeight={"light"}
                              w="100px"
                            >
                              Batch #:
                            </Text>
                            <CustomInput h="32px" w="full" />
                          </HStack>
                        </VStack>
                      </Grid>
                    </Box>
                  </Accordion.ItemContent>
                </Accordion.Item>

                {/* Provider Section */}
                <Accordion.Item
                  value="provider"
                  borderBottom="1px solid #2f4d78"
                >
                  <Accordion.ItemTrigger
                    py={3}
                    px={4}
                    _hover={{ bg: "droidalBlack.300" }}
                  >
                    <Text
                      fontSize="md"
                      fontWeight="light"
                      flex="1"
                      textAlign="left"
                    >
                      Provider
                    </Text>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Box p={4}>
                      <Grid
                        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                        gap={6}
                      >
                        <VStack gap={3} align="stretch">
                          <HStack>
                            <InputGroupWithX
                              label="Scheduling Provider:"
                              onClick={() => console.log("Find Referring")}
                            />
                          </HStack>
                          <HStack>
                            <InputGroupWithX
                              label="Rendering Provider:"
                              onClick={() => console.log("Find Referring")}
                            />
                          </HStack>
                          <HStack>
                            <InputGroupWithX
                              label="Supervising Provider:"
                              onClick={() => console.log("Find Supervising")}
                            />
                          </HStack>
                        </VStack>
                        <VStack gap={3} align="stretch">
                          <HStack>
                            <InputGroupWithX
                              label="Referring Provider..."
                              onClick={() => console.log("Find Referring")}
                            />
                          </HStack>
                          <HStack>
                            <Text fontSize="xs" w="100px">
                              Location:
                            </Text>
                            <CustomSelect
                              options={[]}
                              placeholder="None"
                              w="full"
                            />
                          </HStack>
                          <HStack>
                            <Text fontSize="xs" w="100px">
                              Place Of Service:
                            </Text>
                            <CustomSelect
                              options={[]}
                              value={["11 - Office"]}
                              w="full"
                            />
                          </HStack>
                          <HStack>
                            <Text fontSize="xs" w="100px">
                              Encounter Mode:
                            </Text>
                            <CustomSelect
                              options={[]}
                              placeholder=""
                              w="full"
                            />
                          </HStack>
                        </VStack>
                      </Grid>
                    </Box>
                  </Accordion.ItemContent>
                </Accordion.Item>

                {/* Payment Section */}
                <Accordion.Item
                  value="payment"
                  borderBottom="1px solid #2f4d78"
                >
                  <Accordion.ItemTrigger
                    py={3}
                    px={4}
                    _hover={{ bg: "droidalBlack.300" }}
                  >
                    <Text
                      fontSize="md"
                      fontWeight="light"
                      flex="1"
                      textAlign="left"
                    >
                      Payment
                    </Text>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Box p={4}>
                      <Grid
                        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                        gap={6}
                      >
                        <VStack gap={3} align="stretch">
                          <HStack>
                            <Text
                              fontSize="xs"
                              fontWeight={"light"}
                              letterSpacing={"wide"}
                              w="100px"
                            >
                              Copay Due:
                            </Text>
                            <Text
                              fontSize="xs"
                              fontWeight={"light"}
                              letterSpacing={"wide"}
                            >
                              $0.00
                            </Text>
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="xs"
                              w="100px"
                              fontWeight={"light"}
                              letterSpacing={"wide"}
                            >
                              Payment Amount:
                            </Text>
                            <CustomInput value="$0.00" h="32px" w="full" />
                          </HStack>
                        </VStack>
                      </Grid>
                    </Box>
                  </Accordion.ItemContent>
                </Accordion.Item>

                {/* Procedure Section */}
                <Accordion.Item
                  value="procedure"
                  borderBottom="1px solid #2f4d78"
                >
                  <Accordion.ItemTrigger
                    py={3}
                    px={4}
                    _hover={{ bg: "droidalBlack.300" }}
                  >
                    <Text
                      fontSize="md"
                      fontWeight="light"
                      flex="1"
                      textAlign="left"
                    >
                      Procedure
                    </Text>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Box p={4}>
                      <Flex justify="space-between" mb={3} align="center">
                        <HStack>
                          <Text fontSize="xs">Mode:</Text>
                          <CustomSelect
                            value={["ICD-10"]}
                            w="150px"
                            options={[{ label: "ICD-10", value: "ICD-10" }]}
                          />
                        </HStack>
                        <CustomButton size="sm" variant="outline">
                          Customize
                        </CustomButton>
                      </Flex>
                      <Box
                        border="1px solid #2f4d78"
                        rounded="md"
                        overflow="hidden"
                        h="200px"
                      >
                        <GenericTable
                          columns={PROCEDURE_COLUMNS}
                          data={[]}
                          emptyState={{ title: "", description: "" }}
                          selection={{ selectable: false }}
                          pagination={false}
                        />
                      </Box>
                      <Flex
                        bg="droidalBlack.300"
                        p={2}
                        mt={1}
                        justify="space-between"
                        rounded="md"
                      >
                        <Text fontSize="xs">Total: 0</Text>
                        <Text fontSize="xs">0.00</Text>
                        <Text fontSize="xs">$0.00</Text>
                        <Text fontSize="xs">$0.00</Text>
                      </Flex>
                    </Box>
                  </Accordion.ItemContent>
                </Accordion.Item>

                {/* Hospitalization Dates Section */}
                <Accordion.Item
                  value="hospitalization"
                  borderBottom="1px solid #2f4d78"
                >
                  <Accordion.ItemTrigger
                    py={3}
                    px={4}
                    _hover={{ bg: "droidalBlack.300" }}
                  >
                    <Text
                      fontSize="md"
                      fontWeight="light"
                      flex="1"
                      textAlign="left"
                    >
                      Hospitalization Dates
                    </Text>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Box p={4}>
                      <Grid
                        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                        gap={6}
                      >
                        <HStack>
                          <Text fontSize="xs" w="100px">
                            Start Date:
                          </Text>
                          <CustomInput type="date" w="full" h="32px" />
                        </HStack>
                        <HStack>
                          <Text fontSize="xs" w="100px">
                            End Date:
                          </Text>
                          <CustomInput type="date" w="full" h="32px" />
                        </HStack>
                      </Grid>
                    </Box>
                  </Accordion.ItemContent>
                </Accordion.Item>

                {/* Miscellaneous (CMS-1500) Section */}
                <Accordion.Item
                  value="miscellaneous"
                  borderBottom="1px solid #2f4d78"
                >
                  <Accordion.ItemTrigger
                    py={3}
                    px={4}
                    _hover={{ bg: "droidalBlack.300" }}
                  >
                    <Text
                      fontSize="md"
                      fontWeight="light"
                      flex="1"
                      textAlign="left"
                    >
                      Miscellaneous (CMS-1500)
                    </Text>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Box p={4}>
                      <Grid
                        templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                        gap={6}
                      >
                        <VStack gap={3} align="stretch">
                          <HStack>
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              Submit Reason:
                            </Text>
                            <CustomSelect
                              options={[{ label: "1", value: "1" }]}
                              value={["1"]}
                              w="full"
                            />
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              Payer Doc Ctrl #:
                            </Text>
                            <CustomInput h="32px" w="full" />
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              Claim Code (Box 10d):
                            </Text>
                            <CustomInput h="32px" w="full" />
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              Add'l Claim Info (Box 19):
                            </Text>
                            <CustomInput h="32px" w="full" />
                          </HStack>
                        </VStack>
                        <VStack gap={3} align="stretch">
                          <HStack>
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              E-Claim Note Type:
                            </Text>
                            <CustomSelect
                              options={[{ label: "None", value: "None" }]}
                              value={["None"]}
                              w="full"
                            />
                          </HStack>
                          <HStack align="start">
                            <Text fontSize="xs" w="150px" mt={2}>
                              E-Claim Note:
                            </Text>
                            <Textarea
                              bg="droidalBlack.300"
                              border="1px solid #2f4d78"
                              _focus={{
                                borderColor: "#00BBF2",
                                outline: "none",
                              }}
                              rows={4}
                              fontSize="sm"
                            />
                          </HStack>
                        </VStack>
                      </Grid>
                    </Box>
                  </Accordion.ItemContent>
                </Accordion.Item>

                {/* Ambulance Section */}
                <Accordion.Item
                  value="ambulance"
                  borderBottom="1px solid #2f4d78"
                >
                  <Accordion.ItemTrigger
                    py={3}
                    px={4}
                    _hover={{ bg: "droidalBlack.300" }}
                  >
                    <Text
                      fontSize="md"
                      fontWeight="light"
                      letterSpacing={"wide"}
                      flex="1"
                      textAlign="left"
                    >
                      Ambulance
                    </Text>
                    <Accordion.ItemIndicator />
                  </Accordion.ItemTrigger>
                  <Accordion.ItemContent>
                    <Box p={4}>
                      <Grid
                        templateColumns={{ base: "1fr", xl: "1fr 1fr" }}
                        gap={6}
                      >
                        {/* Left Column */}
                        <VStack gap={3} align="stretch">
                          <HStack>
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              Emergency?
                            </Text>
                            <Checkbox.Root>
                              <Checkbox.HiddenInput />
                              <Checkbox.Control border="1px solid #2f4d78" />
                            </Checkbox.Root>
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              Patient Weight:
                            </Text>
                            <CustomInput h="32px" w="full" />
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              Transport Distance:
                            </Text>
                            <CustomInput h="32px" w="full" />
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              Transport Code:
                            </Text>
                            <CustomSelect
                              options={[]}
                              placeholder=""
                              w="full"
                            />
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              Transport Reason Code:
                            </Text>
                            <CustomSelect
                              options={[]}
                              placeholder=""
                              w="full"
                            />
                          </HStack>
                          <InputGroupWithX placeholder="Pick Up Address..." />
                          <InputGroupWithX placeholder="Drop Off Location..." />

                          <HStack>
                            <Text fontSize="xs" w="100px">
                              Time of Service:
                            </Text>
                            <CustomSelect
                              options={[
                                { label: "12:00 AM", value: "12:00 AM" },
                              ]}
                              value={["12:00 AM"]}
                              w="full"
                            />
                            <Text fontSize="xs">to:</Text>
                            <CustomSelect
                              options={[
                                { label: "12:00 AM", value: "12:00 AM" },
                              ]}
                              value={["12:00 AM"]}
                              w="full"
                            />
                          </HStack>

                          <Text
                            fontSize="xs"
                            mt={2}
                            fontWeight="light"
                            letterSpacing={"wide"}
                          >
                            Ambulance Certification:
                          </Text>
                          {/* Transfer List */}
                          <Grid
                            templateColumns="1fr auto 1fr"
                            gap={2}
                            h="150px"
                          >
                            <Box
                              border="1px solid #2f4d78"
                              rounded="md"
                              overflowY="auto"
                              bg="droidalBlack.300"
                            >
                              <VStack align="stretch" spacing={0}>
                                <Box
                                  px={2}
                                  py={1}
                                  borderBottom="1px solid #2f4d78"
                                >
                                  <Text
                                    fontSize="sm"
                                    fontWeight="light"
                                    letterSpacing={"wide"}
                                  >
                                    Available
                                  </Text>
                                </Box>
                                {availableCerts.map((cert) => (
                                  <Box
                                    key={cert}
                                    px={2}
                                    py={1}
                                    cursor="pointer"
                                    bg={
                                      selectedAvailable.includes(cert)
                                        ? "#00BBF2"
                                        : "transparent"
                                    }
                                    onClick={() => {
                                      if (selectedAvailable.includes(cert))
                                        setSelectedAvailable(
                                          selectedAvailable.filter(
                                            (c) => c !== cert
                                          )
                                        );
                                      else
                                        setSelectedAvailable([
                                          ...selectedAvailable,
                                          cert,
                                        ]);
                                    }}
                                  >
                                    <Text
                                      fontSize="xs"
                                      isTruncated
                                      title={cert}
                                    >
                                      {cert}
                                    </Text>
                                  </Box>
                                ))}
                              </VStack>
                            </Box>

                            <VStack justify="center" spacing={2}>
                              <IconButton
                                size="xs"
                                variant="outline"
                                onClick={moveRight}
                                icon={<LuChevronRight />}
                                disabled={selectedAvailable.length === 0}
                              />
                              <IconButton
                                size="xs"
                                variant="outline"
                                onClick={moveLeft}
                                icon={<LuChevronLeft />}
                                disabled={selectedSelected.length === 0}
                              />
                            </VStack>

                            <Box
                              border="1px solid #2f4d78"
                              rounded="md"
                              overflowY="auto"
                              bg="droidalBlack.300"
                            >
                              <VStack align="stretch" spacing={0}>
                                <Box
                                  px={2}
                                  py={1}
                                  borderBottom="1px solid #2f4d78"
                                >
                                  <Text
                                    fontSize="sm"
                                    fontWeight="light"
                                    letterSpacing={"wide"}
                                  >
                                    Selected
                                  </Text>
                                </Box>
                                {selectedCerts.map((cert) => (
                                  <Box
                                    key={cert}
                                    px={2}
                                    py={1}
                                    cursor="pointer"
                                    bg={
                                      selectedSelected.includes(cert)
                                        ? "#00BBF2"
                                        : "transparent"
                                    }
                                    onClick={() => {
                                      if (selectedSelected.includes(cert))
                                        setSelectedSelected(
                                          selectedSelected.filter(
                                            (c) => c !== cert
                                          )
                                        );
                                      else
                                        setSelectedSelected([
                                          ...selectedSelected,
                                          cert,
                                        ]);
                                    }}
                                  >
                                    <Text
                                      fontSize="xs"
                                      isTruncated
                                      title={cert}
                                      fontWeight="light"
                                      letterSpacing={"wide"}
                                    >
                                      {cert}
                                    </Text>
                                  </Box>
                                ))}
                              </VStack>
                            </Box>
                          </Grid>
                        </VStack>

                        {/* Right Column */}
                        <VStack gap={3} align="stretch">
                          <HStack align="start">
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              Round Trip Description:
                            </Text>
                            <Textarea
                              bg="droidalBlack.300"
                              border="1px solid #2f4d78"
                              rows={4}
                              fontSize="sm"
                              w="full"
                            />
                          </HStack>
                          <HStack align="start">
                            <Text
                              fontSize="xs"
                              w="150px"
                              fontWeight="light"
                              letterSpacing={"wide"}
                            >
                              Stretcher Purpose:
                            </Text>
                            <Textarea
                              bg="droidalBlack.300"
                              border="1px solid #2f4d78"
                              rows={4}
                              fontSize="sm"
                              w="full"
                            />
                          </HStack>
                        </VStack>
                      </Grid>
                    </Box>
                  </Accordion.ItemContent>
                </Accordion.Item>
              </Accordion.Root>
            </VStack>
          </Tabs.Content>
        </Tabs.Root>
      </Box>
      {/* Footers */}
      <HStack justify="flex-start" mt={2} spacing={4}>
        <CustomButton variant="outline">Save as Draft</CustomButton>
        <CustomButton variant="outline">Save for Review</CustomButton>
        <CustomButton variant="outline">Approve</CustomButton>
        <CustomButton variant="outline">Cancel</CustomButton>
        <CustomButton variant="outline">Check Codes</CustomButton>
      </HStack>
    </>
  );
};

export default EncounterModal;

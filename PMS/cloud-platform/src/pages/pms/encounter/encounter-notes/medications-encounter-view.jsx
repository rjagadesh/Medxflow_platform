import React, { useState, useMemo } from "react";
import {
  Box,
  Flex,
  Text,
  HStack,
  VStack,
  Button,
  Input,
  Badge,
  Grid,
  GridItem,
  Image,
  IconButton,
  Icon,
  Bleed,
  Tabs,
} from "@chakra-ui/react";
import {
  Search,
  Plus,
  AlertTriangle,
  Check,
  Bell,
  RefreshCw,
  X,
  Calendar,
  User,
  Pill,
  ChevronRight,
  NotebookTabs,
} from "lucide-react";
import { useParams } from "react-router-dom";
import { useGetMedications } from "@/hooks/query/pms/medications/useGetMedications";
import { useUpdateMedications } from "@/hooks/mutation/pms/medications/useUpdateMedications";
import { useMarkMedicationAsError } from "@/hooks/mutation/pms/medications/useMarkMedicationAsError";
import { useGetAllergies } from "@/hooks/query/pms/allergies/useGetAllergies";
import MedicationModal from "@/features/pms/encounter-notes/add-edit-medications";
import { toaster } from "@/components/ui/toaster";
import CustomButton from "@/components/button/button";
import { formatDate } from "@/utils/helper";
import getStatusIcon from "@/utils/status-icon";

const StatBadge = ({ label, count }) => (
  <HStack
    bg="whiteAlpha.100"
    px={3}
    py={1.5}
    borderRadius="md"
    border="1px solid"
    borderColor="whiteAlpha.200"
  >
    <Text color="white" fontWeight="medium">
      {count}
    </Text>
    <Text color="gray.400" fontSize="sm">
      {label}
    </Text>
  </HStack>
);

const Medications = () => {
  const { patient_id } = useParams();

  // Data Fetching
  const { data: medicationsData } = useGetMedications(patient_id);
  const { data: allergiesData } = useGetAllergies(patient_id);
  const { mutate: updateMedication } = useUpdateMedications();
  const { mutate: markAsError } = useMarkMedicationAsError();

  const medications = medicationsData?.medications || [];
  const allergies = allergiesData || [];

  // State
  const [selectedMedId, setSelectedMedId] = useState(null);
  const [filter, setFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "add",
    data: null,
  });

  // Derived State
  const activeCount = medications.filter((m) => m.status === "active").length;
  // Assuming we might determine PRN from instructions or a field, for now defaulting/mocking logic or checking strings
  const prnCount = medications.filter(
    (m) =>
      m.drug_name?.toLowerCase().includes("prn") ||
      m.patient_instructions?.toLowerCase().includes("prn") ||
      m.patient_instructions?.toLowerCase().includes("as needed"),
  ).length;
  const expiredCount = medications.filter(
    (m) => m.status === "expired" || m.status === "discontinued",
  ).length;

  const filteredMedications = useMemo(() => {
    let result = medications;

    // Filter by Tab
    if (filter === "Active") {
      result = result.filter((m) => m.status === "active");
    } else if (filter === "PRN") {
      result = result.filter(
        (m) =>
          m.drug_name?.toLowerCase().includes("prn") ||
          m.patient_instructions?.toLowerCase().includes("prn") ||
          m.patient_instructions?.toLowerCase().includes("as needed"),
      );
    } else if (filter === "Expired") {
      result = result.filter(
        (m) => m.status === "expired" || m.status === "discontinued",
      );
    }

    // Filter by Search
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (m) =>
          m.drug_name?.toLowerCase().includes(q) ||
          m.patient_instructions?.toLowerCase().includes(q),
      );
    }

    return result;
  }, [medications, filter, searchQuery]);

  const selectedMedication = useMemo(
    () =>
      medications.find((m) => m.id === selectedMedId) || filteredMedications[0],
    [medications, selectedMedId, filteredMedications],
  );

  // Handlers
  const handleEdit = (medication) => {
    setModalState({
      isOpen: true,
      mode: "edit",
      data: medication,
    });
  };

  const handleDiscontinue = (medication) => {
    updateMedication(
      {
        id: medication.id,
        status: "discontinued",
        patient: medication.patient || patient_id,
      },
      {
        onSuccess: () => {
          toaster.success({
            title: "Medication Discontinued",
            description: "The medication has been marked as discontinued.",
          });
        },
      },
    );
  };

  const handleMarkAsError = (medication) => {
    markAsError(
      {
        id: medication.id,
        patient: medication.patient || patient_id,
      },
      {
        onSuccess: () => {
          toaster.success({
            title: "Medication Marked as Error",
            description:
              "The medication status has been updated to Not Administered.",
          });
        },
      },
    );
  };

  const handleCloseModal = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleOpenAdd = () => {
    setModalState({
      isOpen: true,
      mode: "add",
      data: null,
    });
  };

  console.log("selectedMedication", selectedMedication);

  return (
    <Bleed height={"full"} inline={4}>
      <Box h="full" bg="droidalBlack.500" p={6} color="white">
        {/* Top Header & Stats */}
        <Flex justify="space-between" align="center" mb={6}>
          <HStack gap={6}>
            <Text fontSize="2xl" fontWeight="light">
              Medications
            </Text>
          </HStack>
          <HStack gap={3}>
            <CustomButton onClick={handleOpenAdd} leftIcon={<Plus size={16} />}>
              Add Medication
            </CustomButton>
          </HStack>
        </Flex>

        {/* Filter & Search Bar */}
        <Flex justify="space-between" align="center" mb={6} gap={4}>
          <Tabs.Root
            variant="line"
            colorPalette="blue"
            value={filter}
            onValueChange={(e) => setFilter(e.value)}
          >
            <Tabs.List borderBottomColor="whiteAlpha.200">
              {["All", "Active", "PRN", "Expired", "History"].map((tab) => (
                <Tabs.Trigger
                  key={tab}
                  value={tab}
                  color="gray.400"
                  _selected={{ color: "white", borderColor: "blue.400" }}
                  px={4}
                  pb={3}
                >
                  {tab}
                  {tab === "Active" && ` (${activeCount})`}
                  {tab === "PRN" && ` (${prnCount})`}
                  {tab === "Expired" && ` (${expiredCount})`}
                </Tabs.Trigger>
              ))}
            </Tabs.List>
          </Tabs.Root>

          <Flex
            align="center"
            bg="droidalBlack.300"
            borderRadius="md"
            px={3}
            border="1px solid"
            borderColor="whiteAlpha.200"
            w="300px"
          >
            <Search size={16} color="gray" />
            <Input
              placeholder="Search items..."
              variant="unstyled"
              ml={2}
              color="white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </Flex>
        </Flex>

        {/* Main Content Grid */}
        <Grid templateColumns="1fr 650px" gap={6} h="calc(100% - 140px)">
          {/* Left Column: Medication List */}
          <GridItem overflowY="auto" className="custom-scrollbar" pr={2}>
            <VStack gap={3} align="stretch">
              {filteredMedications.map((med) => {
                const isSelected = selectedMedication?.id === med.id;
                const isPRN =
                  med.drug_name?.toLowerCase().includes("prn") ||
                  med.patient_instructions?.toLowerCase().includes("prn") ||
                  med.patient_instructions?.toLowerCase().includes("as needed");
                const isExpired =
                  med.status === "expired" || med.status === "discontinued";

                return (
                  <Box
                    key={med.id}
                    bg={isSelected ? "whiteAlpha.100" : "droidalBlack.300"}
                    p={4}
                    borderRadius="lg"
                    cursor="pointer"
                    border="1px solid"
                    borderColor={isSelected ? "blue.500" : "transparent"}
                    onClick={() => setSelectedMedId(med.id)}
                    _hover={{ bg: "whiteAlpha.100" }}
                    transition="all 0.2s"
                    pos={"relative"}
                  >
                    <Box className="absolute top-2 right-2">
                      {getStatusIcon(med.status)}
                    </Box>
                    <Flex justify="space-between" align="start">
                      <HStack align="start" gap={3}>
                        <Image
                          src="/medications.png"
                          boxSize="32px"
                          objectFit="contain"
                          alt="Medication"
                        />
                        <Box>
                          <Text
                            fontWeight="semibold"
                            fontSize="md"
                            color="white"
                          >
                            {med.drug_name}
                          </Text>
                          <Text fontSize="sm" color="gray.400" mt={0.5}>
                            {med.quantity} {med.unit || "tablets"}
                          </Text>
                          <Text fontSize="xs" color="gray.500" mt={1}>
                            {med.patient_instructions}
                          </Text>

                          <HStack mt={3} gap={4} fontSize="xs" color="gray.400">
                            <HStack gap={1}>
                              <User size={12} />
                              <Text>{med.provider_name || "N/A"}</Text>
                              {/* Placeholder provider if not in data */}
                            </HStack>
                            <HStack gap={1}>
                              <Calendar size={12} />
                              <Text>
                                {med.started_on
                                  ? new Date(
                                      med.started_on,
                                    ).toLocaleDateString()
                                  : "N/A"}
                              </Text>
                            </HStack>
                          </HStack>
                        </Box>
                      </HStack>

                      <VStack align="end">
                        {isPRN && (
                          <Badge
                            colorScheme="teal"
                            variant="solid"
                            fontSize="10px"
                          >
                            PRN
                          </Badge>
                        )}
                        {isExpired && (
                          <Badge
                            colorScheme="red"
                            variant="solid"
                            fontSize="10px"
                          >
                            {med.status.toUpperCase()}
                          </Badge>
                        )}
                      </VStack>
                    </Flex>

                    {/* Footer Stats inside Card */}
                    <Flex
                      mt={3}
                      justify="space-between"
                      align="center"
                      borderTop="1px solid"
                      borderColor="whiteAlpha.100"
                      pt={2}
                    >
                      <HStack fontSize="xs" color="gray.400" gap={4}>
                        <Text>
                          {med.days_supply ? `${med.days_supply}` : "N/A"}{" "}
                        </Text>
                      </HStack>
                      <ChevronRight size={14} color="gray" />
                    </Flex>
                  </Box>
                );
              })}
            </VStack>
          </GridItem>

          {/* Right Column: Detail View */}
          <GridItem>
            {selectedMedication ? (
              <Box
                bg="droidalBlack.300" // Slightly lighter bg for card
                // bgImage="linear-gradient(to bottom, rgba(255,255,255,0.05), rgba(0,0,0,0))"
                borderRadius="xl"
                p={8}
                h="full"
                border="1px solid"
                borderColor="whiteAlpha.100"
                overflowY="auto"
              >
                <Flex gap={6} mb={8}>
                  <Image
                    src="/medications.png"
                    boxSize="80px"
                    objectFit="contain"
                    alt={selectedMedication.drug_name}
                  />
                  <Box flex={1}>
                    <Flex justify="space-between" align="start">
                      <Box>
                        <Text fontSize="3xl" fontWeight="light" color="white">
                          {selectedMedication.drug_name}
                        </Text>
                        <Text fontSize="lg" color="gray.300" mt={1}>
                          {selectedMedication.patient_instructions}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                </Flex>

                <VStack align="stretch" gap={6}>
                  {/* Info Grid */}
                  <Grid templateColumns="repeat(2, 1fr)" gap={6}>
                    <Box>
                      <Text color="gray.500" fontSize="sm" mb={1}>
                        Reason
                      </Text>
                      <Text color="white">Hypertension</Text>{" "}
                      {/* Placeholder */}
                    </Box>
                    <Box>
                      <Text color="gray.500" fontSize="sm" mb={1}>
                        Prescribed By
                      </Text>
                      <Text color="white">
                        {selectedMedication.provider_name || "N/A"}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500" fontSize="sm" mb={1}>
                        Started
                      </Text>
                      <Text color="white">
                        {selectedMedication.started_on
                          ? formatDate(selectedMedication.started_on)
                          : "N/A"}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500" fontSize="sm" mb={1}>
                        Modified
                      </Text>
                      <Text color="white">
                        {selectedMedication.updated_at
                          ? formatDate(selectedMedication.updated_at)
                          : "N/A"}
                      </Text>
                    </Box>
                    <Box>
                      <Text color="gray.500" fontSize="sm" mb={1}>
                        Pills Remaining
                      </Text>
                      <HStack color="white">
                        <Pill size={16} />
                        <Text>{selectedMedication.quantity || "0"}</Text>
                      </HStack>
                    </Box>
                  </Grid>

                  {/* Notes / Warnings */}
                  <Box>
                    <Text fontSize="lg" mb={3} color="white">
                      Notes / Warnings
                    </Text>
                    <HStack
                      bg="orange.900" // Dark orange/brown
                      border="1px solid"
                      borderColor="orange.700"
                      p={4}
                      borderRadius="md"
                      color="orange.200"
                      gap={3}
                    >
                      <AlertTriangle size={20} />
                      <VStack align="start" gap={0}>
                        <Text fontWeight="bold">
                          Caution: Monitor blood pressure closely
                        </Text>
                        <Text fontSize="sm">May cause dizziness</Text>
                      </VStack>
                    </HStack>
                  </Box>

                  {/* Action Buttons */}
                  <Flex wrap="wrap" gap={3} mt={2}>
                    <Box w="full" h="0" /> {/* Break line */}
                    <CustomButton
                      onClick={() => handleEdit(selectedMedication)}
                    >
                      Edit
                    </CustomButton>
                    <CustomButton
                      variant="outline"
                      onClick={() => handleDiscontinue(selectedMedication)}
                    >
                      Discontinue
                    </CustomButton>
                    <CustomButton
                      variant="danger"
                      onClick={() => handleMarkAsError(selectedMedication)}
                    >
                      Mark As Error
                    </CustomButton>
                  </Flex>
                </VStack>
              </Box>
            ) : (
              <Box
                h="full"
                bg="droidalBlack.300"
                borderRadius="xl"
                display="flex"
                alignItems="center"
                justifyContent="center"
                color="gray.500"
              >
                <Text>Select a medication to view details</Text>
              </Box>
            )}
          </GridItem>
        </Grid>

        {/* Modals */}
        <MedicationModal
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
          mode={modalState.mode}
          initialData={modalState.data}
        />
      </Box>
    </Bleed>
  );
};

export default Medications;

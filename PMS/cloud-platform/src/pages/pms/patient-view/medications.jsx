import React, { useState } from "react";
import {
  Box,
  Text,
  HStack,
  Badge,
  Card,
  Checkbox,
  SegmentGroup,
  VStack,
  EmptyState,
  Spinner,
  Center,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import { OctagonAlertIcon } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import MedicationModal from "@/features/pms/encounter-notes/add-edit-medications";
import { useGetMedications } from "@/hooks/query/pms/medications/useGetMedications";
import { useUpdateMedications } from "@/hooks/mutation/pms/medications/useUpdateMedications";
import CustomButton from "@/components/button/button";
import CustomSelect from "@/components/ui/select";
import { Heading } from "@chakra-ui/react";
import { toaster } from "@/components/ui/toaster";

const MedicationItem = ({ medication, onEdit, onDiscontinue }) => {
  const {
    drug_name,
    status,
    patient_instructions,
    quantity,
    refills,
    days_supply,
    allow_substitution,
    started_on,
    administered_during_visit,
    created_at,
  } = medication;

  // Format date
  const dateStr = started_on
    ? new Date(started_on).toLocaleDateString()
    : "Not specified";

  const createdDateStr = created_at
    ? new Date(created_at).toLocaleDateString()
    : "";

  const statusColorScheme =
    status === "active" ? "green" : status === "discontinued" ? "red" : "gray";

  return (
    <Box
      p={4}
      borderBottomWidth="1px"
      borderColor="droidalGray.400"
      _last={{ borderBottomWidth: 0 }}
      _hover={{ bgColor: "whiteAlpha.50" }}
      role="group"
      transition="background-color 0.2s"
    >
      {/* Header */}
      <Flex justify="space-between" align="start">
        <Box>
          <Text fontSize="lg" fontWeight="semibold" color="white">
            {drug_name}
          </Text>
          <Text fontSize="xs" color="droidalGray.400">
            Started: {dateStr}
          </Text>
        </Box>

        <Badge
          variant="solid"
          colorPalette={statusColorScheme}
          px={2}
          py={0.5}
          textTransform={"capitalize"}
          borderRadius="full"
        >
          {status.replace("_", " ")}
        </Badge>
      </Flex>

      {/* Instructions */}
      {patient_instructions && (
        <Text mt={2} fontSize="sm" color="droidalGray.400">
          {patient_instructions}
        </Text>
      )}

      {/* Details grid */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mt={4} fontSize="sm">
        <Box>
          <Text
            color="gray.500"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Quantity
          </Text>
          <Text fontWeight="medium" color="white">
            {quantity || "-"}
          </Text>
        </Box>

        <Box>
          <Text
            color="gray.500"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Refills
          </Text>
          <Text fontWeight="medium" color="white">
            {refills}
          </Text>
        </Box>

        <Box>
          <Text
            color="gray.500"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Days Supply
          </Text>
          <Text fontWeight="medium" color="white">
            {days_supply || "-"}
          </Text>
        </Box>

        <Box>
          <Text
            color="gray.500"
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="wide"
          >
            Substitution
          </Text>
          <Text fontWeight="medium" color="white">
            {allow_substitution ? "Allowed" : "Not allowed"}
          </Text>
        </Box>
      </SimpleGrid>

      {/* Flags */}
      <HStack gap={3} mt={4} fontSize="xs">
        {administered_during_visit && (
          <Badge colorPalette="blue" variant="subtle">
            Given during visit
          </Badge>
        )}

        <Badge
          colorPalette="gray"
          variant="subtle"
          bgColor="whiteAlpha.200"
          color="droidalGray.400"
        >
          Added {createdDateStr}
        </Badge>
      </HStack>

      {/* Actions */}
      <HStack justify="flex-end" gap={2} mt={4}>
        <CustomButton
          size="xs"
          variant="outline"
          onClick={() => onEdit(medication)}
        >
          Edit
        </CustomButton>

        {status === "active" && (
          <CustomButton
            size="xs"
            variant="danger"
            onClick={() => onDiscontinue(medication)}
          >
            Discontinue
          </CustomButton>
        )}
      </HStack>
    </Box>
  );
};

const MedicationsView = () => {
  const navigate = useNavigate();
  const { patient_id } = useParams();
  const { data, isLoading, isPlaceholderData } = useGetMedications(patient_id);
  const { mutate: updateMedication } = useUpdateMedications();

  const medicationList = data?.medications || [];

  const [segmentValue, setSegmentValue] = useState("Active");
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "add",
    data: null,
  });

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
        patient: medication.patient || patient_id, // Ensure patient ID is present
      },
      {
        onSuccess: () => {
          toaster.success({
            title: "Medication Discontinued",
            description: "The medication has been marked as discontinued.",
          });
        },
        onError: () => {
          toaster.error({
            title: "Error",
            description: "Failed to discontinue medication.",
          });
        },
      }
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

  // Filter medications based on segment value
  const filteredMedications = medicationList.filter((med) => {
    if (segmentValue === "Active") return med.status === "active";
    if (segmentValue === "Discontinued") return med.status === "discontinued";
    if (segmentValue === "Not Administered")
      return med.status === "not_administered";
    return true;
  });

  if (isLoading || isPlaceholderData) {
    return (
      <Box flex={1} height="full" bg="droidalBlack.400">
        <Center height="full">
          <Spinner color="white" />
        </Center>
      </Box>
    );
  }

  return (
    <Box flex={1} p={6} height="full" bg="droidalBlack.400">
      <HStack my={6} justify="space-between">
        <Text fontSize="3xl" fontWeight="light" color="white">
          Medications
        </Text>
        <CustomButton size="sm" onClick={handleOpenAdd}>
          + Add Med
        </CustomButton>
      </HStack>
      <VStack align="start" gap={4} mb={6}>
        <SegmentGroup.Root
          size={{
            base: "sm",
          }}
          position={"relative"}
          top={"3px"}
          bgColor={"#000"}
          value={segmentValue}
          css={{
            '& [data-state="checked"]': {
              bgImage: "var(--bg-blue-gradient)",
              color: "#fff",
            },
          }}
          onValueChange={(v) => {
            setSegmentValue(v.value);
          }}
        >
          <SegmentGroup.Indicator />
          <SegmentGroup.Items
            cursor={"pointer"}
            color="white"
            fontWeight={"light"}
            items={["Active", "Discontinued", "Not Administered"]}
          />
        </SegmentGroup.Root>
        <Checkbox.Root
          size={{
            base: "sm",
            "2xl": "md",
            "3xl": "lg",
          }}
          aria-label="Select all rows"
          onCheckedChange={() => {}}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control
            _checked={{
              bgImage:
                "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
            }}
            borderColor="#2f4d78"
            bgColor={"black"}
          />
          <Checkbox.Label color="white" fontWeight={"light"}>
            No known medications
          </Checkbox.Label>
        </Checkbox.Root>
        <HStack>
          <Text letterSpacing={"widest"} color="white">
            Medication reconciliation:
          </Text>
          <CustomSelect
            options={[
              {
                value: "performed",
                label: "Performed",
              },
              {
                value: "expected-medical-contraindication",
                label: "Expected - Medical Contraindication",
              },
            ]}
            placeholder="Select Report Type"
            width="230px"
            borderRadius="4px !important"
            borderColor="#2f4d78"
            css={{
              "& button": {
                borderRadius: "4px !important",
                borderColor: "#2f4d78",
                color: "white !important",
              },
            }}
          />
        </HStack>
      </VStack>
      <Heading mt="2" color="white" fontWeight={"light"}>
        {segmentValue} Medications
      </Heading>
      {filteredMedications.length === 0 && (
        <EmptyState.Root
          bgColor={"droidalBlack.300"}
          borderColor={"droidalGray.400"}
          width="full"
          height={"300px"}
          borderRadius="12px !important"
          display={"flex"}
          justifyContent={"center"}
          alignItems={"center"}
        >
          <EmptyState.Content>
            <EmptyState.Indicator>
              <OctagonAlertIcon />
            </EmptyState.Indicator>
            <VStack textAlign="center">
              <EmptyState.Title color="white">
                No {segmentValue} Medications
              </EmptyState.Title>
              <EmptyState.Description color="gray.400">
                You have no {segmentValue.toLowerCase()} medications
              </EmptyState.Description>
            </VStack>
          </EmptyState.Content>
        </EmptyState.Root>
      )}
      {filteredMedications.length > 0 && (
        <Card.Root
          bgColor={"droidalBlack.300"}
          borderColor={"droidalGray.400"}
          width="full"
        >
          <Card.Body gap="0" p={0}>
            {filteredMedications.map((medication) => (
              <MedicationItem
                key={medication.id}
                medication={medication}
                onEdit={handleEdit}
                onDiscontinue={handleDiscontinue}
              />
            ))}
          </Card.Body>
        </Card.Root>
      )}
      <HStack justifyContent="flex-end" mt={6} gap={4}>
        {filteredMedications.length > 0 && (
          <CustomButton variant="danger">Mark as Error</CustomButton>
        )}
        <CustomButton
          onClick={() => {
            navigate(-1);
          }}
          variant="outline"
        >
          Cancel
        </CustomButton>
      </HStack>

      {/* Controlled Modal */}
      <MedicationModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        initialData={modalState.data}
      />
    </Box>
  );
};

export default MedicationsView;

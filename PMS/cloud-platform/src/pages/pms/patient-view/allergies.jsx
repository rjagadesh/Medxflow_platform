import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  HStack,
  VStack,
  Text,
  Checkbox,
  ButtonGroup,
  Button,
  Spinner,
  Center,
  SegmentGroup,
} from "@chakra-ui/react";
import GenericTable from "@/components/table/table";
import CustomButton from "@/components/button/button";
import { Heading } from "@chakra-ui/react";
import { useNavigate, useParams } from "react-router-dom";
import AllergiesModal from "@/features/pms/encounter-notes/add-edit-allergies";
import { useGetAllergies } from "@/hooks/query/pms/allergies/useGetAllergies";
import { useGetAllergyProfile } from "@/hooks/query/pms/allergies/useGetAllergyProfile";
import { useCreateAllergyProfile } from "@/hooks/mutation/pms/allergies/useCreateAllergyProfile";

const Allergies = ({ showClose = false }) => {
  const [activeTab, setActiveTab] = useState("Active");
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState("add");
  const { patient_id: patientId } = useParams();
  const { data: allergies, isPending, isLoading } = useGetAllergies(patientId);
  const {
    data: allergyProfile,
    isLoading: isLoadingProfile,
    isPlaceholderData: isProfilePlaceholder,
  } = useGetAllergyProfile(patientId);
  const { mutate: createProfile } = useCreateAllergyProfile();

  const [filters, setFilters] = useState({
    noKnownAllergies: false,
    noKnownMedicationAllergies: false,
    reconciliationPerformed: false,
  });

  useEffect(() => {
    if (allergyProfile) {
      setFilters({
        noKnownAllergies: allergyProfile.no_known_allergies || false,
        noKnownMedicationAllergies:
          allergyProfile.no_known_medication_allergies || false,
        reconciliationPerformed:
          allergyProfile.reconciliation_performed || false,
      });
    }
  }, [allergyProfile]);

  const handleFilterChange = (key, checked) => {
    const newFilters = { ...filters, [key]: checked };
    setFilters(newFilters);

    const payload = {
      id: patientId,
      no_known_allergies: newFilters.noKnownAllergies,
      no_known_medication_allergies: newFilters.noKnownMedicationAllergies,
    };

    console.log("Payload:", payload);

    createProfile(payload);
  };

  const hasAllergies = allergies && allergies.count > 0;

  console.log("hasAllergies1212", allergies, hasAllergies);

  const emptyState = useMemo(() => {
    if (filters.noKnownAllergies) {
      return {
        title: "No known allergies",
        description: "Patient has no known allergies",
      };
    }
    if (filters.noKnownMedicationAllergies) {
      return {
        title: "No known medication allergies",
        description: "Patient has no known medication allergies",
      };
    }
    return {
      title: "No allergies found",
      description: "No allergies recorded for this patient",
    };
  }, [filters]);

  const navigate = useNavigate();

  const onClose = () => setIsOpen(false);

  const columns = [
    {
      title: "Allergen",
      accessor_key: "allergen",
      render: (item) => (
        <Text
          color="white"
          fontWeight={
            item === "Product containing sulfonamide" ? "bold" : "normal"
          }
          colorPalette={
            item === "Product containing sulfonamide" ? "red" : "white"
          } // Example logic, assuming red for severe
          style={
            item.includes("sulfonamide")
              ? { color: "#C05621" }
              : { color: "white" }
          }
        >
          {item}
        </Text>
      ),
    },
    {
      title: "Severity",
      accessor_key: "severity",
      render: (item) => (
        <Text whiteSpace="pre-line" color="white">
          {item}
        </Text>
      ),
    },
    {
      title: "Reaction",
      accessor_key: "reactions",
      render: (item) => <Text color="white">{item}</Text>,
    },
    {
      title: "Date of Onset",
      accessor_key: "date_of_onset",
      render: (item) => <Text color="white">{item}</Text>,
    },
    {
      title: "Updated",
      accessor_key: "updated_at",
      render: (item) => (
        <Text whiteSpace="pre-line" color="white" fontSize="xs">
          {item}
        </Text>
      ),
    },
    {
      title: "Expand All",
      accessor_key: "actions",
      render: () => (
        <HStack gap={4}>
          <CustomButton
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            Edit
          </CustomButton>
        </HStack>
      ),
    },
  ];

  if (isLoadingProfile || isProfilePlaceholder) {
    return (
      <Center w="full" color={"white"} h="full" p={4}>
        <Spinner />
      </Center>
    );
  }

  return (
    <Box w="full" color={"white"} h="full" p={4}>
      <Heading mb={4} size="xl" letterSpacing={"widest"}>
        Allergies
      </Heading>
      <VStack gap={6} align="stretch">
        {/* Header Section: Tabs and Add Button */}
        <HStack justify="space-between" align="center">
          <SegmentGroup.Root
            size={{
              base: "sm",
            }}
            position={"relative"}
            top={"3px"}
            bgColor={"#000"}
            value={activeTab}
            css={{
              '& [data-state="checked"]': {
                bgImage: "var(--bg-blue-gradient)",
                color: "#fff",
              },
            }}
            onValueChange={(v) => {
              setActiveTab(v.value);
            }}
          >
            <SegmentGroup.Indicator />
            <SegmentGroup.Items
              cursor={"pointer"}
              color={"#fff"}
              items={["Active", "Inactive", "Marked as Error"]}
            />
          </SegmentGroup.Root>

          <CustomButton
            variant="outline"
            onClick={() => {
              setIsOpen(true);
              setMode("add");
            }}
            size="sm"
            disabled={
              filters.noKnownAllergies || filters.noKnownMedicationAllergies
            }
          >
            + Allergy
          </CustomButton>
        </HStack>

        {/* Checkboxes Section */}
        <VStack align="start" gap={2}>
          <Checkbox.Root
            disabled={hasAllergies}
            checked={filters.noKnownAllergies}
            onCheckedChange={(e) =>
              handleFilterChange("noKnownAllergies", e.checked)
            }
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
            <Checkbox.Label color="#90a6c6" fontSize="sm">
              No known allergies
            </Checkbox.Label>
          </Checkbox.Root>
          <Checkbox.Root
            disabled={hasAllergies}
            checked={filters.noKnownMedicationAllergies}
            onCheckedChange={(e) =>
              handleFilterChange("noKnownMedicationAllergies", e.checked)
            }
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
            <Checkbox.Label color="#90a6c6" fontSize="sm">
              No known medication allergies
            </Checkbox.Label>
          </Checkbox.Root>
          <Checkbox.Root
            disabled={!hasAllergies}
            checked={filters.reconciliationPerformed}
            onCheckedChange={(e) =>
              handleFilterChange("reconciliationPerformed", e.checked)
            }
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
            <Checkbox.Label color="#90a6c6" fontSize="sm">
              Allergies reconciliation performed
            </Checkbox.Label>
          </Checkbox.Root>
        </VStack>

        {/* Table Section */}
        <GenericTable
          title="Allergies"
          columns={columns}
          data={allergies?.allergies || []}
          loader={isLoading || isPending}
          pagination={false}
          selection={{
            selectable: true,
          }}
          count={allergies?.count || 0}
          emptyState={emptyState}
        />
        {showClose && (
          <>
            <HStack justify="flex-end">
              <CustomButton onClick={() => {}} variant="outline" size="sm">
                Include
              </CustomButton>
              <CustomButton
                onClick={() => {
                  navigate(-1);
                }}
                variant="outline"
                size="sm"
              >
                Close
              </CustomButton>
            </HStack>
          </>
        )}
      </VStack>
      <AllergiesModal isOpen={isOpen} onClose={onClose} />
    </Box>
  );
};

export default Allergies;

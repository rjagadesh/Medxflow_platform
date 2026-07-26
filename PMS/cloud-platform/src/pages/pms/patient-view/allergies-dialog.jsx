import React, { useState, useEffect, useMemo, useContext } from "react";

import {
  HStack,
  VStack,
  Text,
  Checkbox,
  Spinner,
  Center,
  SegmentGroup,
  Dialog,
  Portal,
  CloseButton,
  Button,
} from "@chakra-ui/react";
import GenericTable from "@/components/table/table";
import CustomButton from "@/components/button/button";
import { useParams } from "react-router-dom";
import AllergiesModal from "@/features/pms/encounter-notes/add-edit-allergies";
import { useGetAllergies } from "@/hooks/query/pms/allergies/useGetAllergies";
import { useGetAllergyProfile } from "@/hooks/query/pms/allergies/useGetAllergyProfile";
import { useCreateAllergyProfile } from "@/hooks/mutation/pms/allergies/useCreateAllergyProfile";
import { EncounterNotesContext } from "../encounter/encounter-notes/encounter-notes-context";

const AllergiesDialog = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("Active");
  const [isAddAllergyOpen, setIsAddAllergyOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const encounterContext = useContext(EncounterNotesContext);
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

  const onAddAllergyClose = () => setIsAddAllergyOpen(false);

  const handleInclude = () => {
    if (encounterContext) {
      const newIds = selectedIds;
      const allergyMap = new Map(
        (allergies?.allergies || []).map((a) => [a.id, a])
      );

      const formatAllergy = (item) => {
        const parts = [item.allergen];
        if (item.reactions) parts.push(`Reaction: ${item.reactions}`);
        if (item.severity) parts.push(`Severity: ${item.severity}`);
        return parts.join(", ");
      };

      const selectedItems = newIds
        .map((id) => allergyMap.get(id))
        .filter(Boolean);

      const generatedNote = selectedItems.map(formatAllergy).join("\n");

      encounterContext.updateSectionData("Allergies", {
        generated_note: generatedNote,
        selected_ids: newIds,
      });
    }
  };

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

  return (
    <Dialog.Root
      // open={isOpen}
      // onOpenChange={(details) => !details.open && onClose()}
      placement="center"
      size="cover"
      motionPreset="slide-in-bottom"
      closeOnInteractOutside={false}
    >
      <Dialog.Trigger>
        <Button
          to="allergies"
          size="xs"
          variant="outline"
          color="white"
          borderColor="droidalGray.300"
          fontWeight="normal"
          _hover={{ bg: "whiteAlpha.100" }}
        >
          Allergies
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bgColor="droidalBlack.300"
            color="white"
            borderRadius="md"
            w={"full"}
            maxH="85vh"
            display="flex"
            flexDirection="column"
          >
            <Dialog.Header
              borderBottom={"1px solid"}
              py={3}
              borderColor={"droidalGray.300"}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Dialog.Title fontSize="lg" my={0} fontWeight="semibold">
                Allergies
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton
                  size="sm"
                  color="droidalGray.300"
                  _hover={{ color: "white", bgColor: "transparent" }}
                  onClick={onClose}
                />
              </Dialog.CloseTrigger>
            </Dialog.Header>
            <Dialog.Body p={4} overflowY="auto" flex="1">
              {isLoadingProfile || isProfilePlaceholder ? (
                <Center w="full" color={"white"} h="full" p={4}>
                  <Spinner />
                </Center>
              ) : (
                <VStack gap={6} align="stretch">
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
                        setIsAddAllergyOpen(true);
                      }}
                      size="sm"
                      disabled={
                        filters.noKnownAllergies ||
                        filters.noKnownMedicationAllergies
                      }
                    >
                      + Allergy
                    </CustomButton>
                  </HStack>

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
                        handleFilterChange(
                          "noKnownMedicationAllergies",
                          e.checked
                        )
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

                  <GenericTable
                    title="Allergies"
                    columns={columns}
                    data={allergies?.allergies || []}
                    loader={isLoading || isPending}
                    pagination={false}
                    selection={{
                      selectable: true,
                      onSelectChange: setSelectedIds,
                      defaultSelected: selectedIds,
                    }}
                    count={allergies?.count || 0}
                    emptyState={emptyState}
                  />
                </VStack>
              )}
            </Dialog.Body>
            <Dialog.Footer>
              <HStack>
                <Dialog.ActionTrigger asChild>
                  <CustomButton size="sm" onClick={handleInclude}>
                    Include
                  </CustomButton>
                </Dialog.ActionTrigger>
                <Dialog.ActionTrigger asChild>
                  <CustomButton variant="outline" onClick={onClose} size="sm">
                    Close
                  </CustomButton>
                </Dialog.ActionTrigger>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
      <AllergiesModal isOpen={isAddAllergyOpen} onClose={onAddAllergyClose} />
    </Dialog.Root>
  );
};

export default AllergiesDialog;

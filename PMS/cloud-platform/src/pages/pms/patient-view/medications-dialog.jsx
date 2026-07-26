import React, { useState, useMemo, useContext } from "react";
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
  Badge,
} from "@chakra-ui/react";
import GenericTable from "@/components/table/table";
import CustomButton from "@/components/button/button";
import CustomSelect from "@/components/ui/select";
import { useParams } from "react-router-dom";
import MedicationModal from "@/features/pms/encounter-notes/add-edit-medications";
import { useGetMedications } from "@/hooks/query/pms/medications/useGetMedications";
import { useUpdateMedications } from "@/hooks/mutation/pms/medications/useUpdateMedications";
import { EncounterNotesContext } from "../encounter/encounter-notes/encounter-notes-context";
import { toaster } from "@/components/ui/toaster";

const MedicationsDialog = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState("Active");
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: "add",
    data: null,
  });
  const [selectedIds, setSelectedIds] = useState([]);
  const encounterContext = useContext(EncounterNotesContext);
  const { patient_id: patientId } = useParams();

  const { data, isLoading, isPending } = useGetMedications(patientId);
  const { mutate: updateMedication } = useUpdateMedications();

  const medicationList = data?.medications || [];

  const [filters, setFilters] = useState({
    noKnownMedications: false,
    reconciliationPerformed: false,
    reconciliationType: "",
  });

  const hasMedications = medicationList.length > 0;

  // Filter medications based on segment value
  const filteredMedications = useMemo(() => {
    return medicationList.filter((med) => {
      if (activeTab === "Active") return med.status === "active";
      if (activeTab === "Discontinued") return med.status === "discontinued";
      if (activeTab === "Not Administered")
        return med.status === "not_administered";
      return true;
    });
  }, [medicationList, activeTab]);

  const emptyState = useMemo(() => {
    if (filters.noKnownMedications) {
      return {
        title: "No known medications",
        description: "Patient has no known medications",
      };
    }
    return {
      title: `No ${activeTab} medications`,
      description: `You have no ${activeTab.toLowerCase()} medications`,
    };
  }, [filters.noKnownMedications, activeTab]);

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
        patient: medication.patient || patientId,
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

  const handleInclude = () => {
    if (encounterContext) {
      const newIds = selectedIds;
      const medicationMap = new Map(medicationList.map((m) => [m.id, m]));

      const formatMedication = (item) => {
        let line = `${item.drug_name}`;
        if (item.patient_instructions)
          line += ` - ${item.patient_instructions}`;
        if (item.quantity) line += ` (Qty: ${item.quantity})`;
        if (item.status && item.status !== "active")
          line += ` [${item.status}]`;
        return line;
      };

      const selectedItems = newIds
        .map((id) => medicationMap.get(id))
        .filter(Boolean);

      let parts = [];

      if (filters.noKnownMedications) {
        parts.push("No known medications.");
      }

      if (filters.reconciliationPerformed) {
        parts.push(
          filters.reconciliationType === "expected-medical-contraindication"
            ? "Medication reconciliation: Expected - Medical Contraindication"
            : "Medication reconciliation: Performed",
        );
      }

      const medsNote = selectedItems.map(formatMedication).join("\n");
      if (medsNote) {
        parts.push(medsNote);
      }

      const generatedNote = parts.join("\n\n");

      encounterContext.updateSectionData("Medications", {
        generated_note: generatedNote,
        selected_ids: newIds,
      });
    }
  };

  const columns = [
    {
      title: "Drug Name",
      accessor_key: "drug_name",
      render: (item) => (
        <VStack align="start" gap={0}>
          <Text color="white" fontWeight="semibold">
            {item}
          </Text>
        </VStack>
      ),
    },
    {
      title: "Status",
      accessor_key: "status",
      render: (item) => {
        const statusColorScheme =
          item === "active"
            ? "green"
            : item === "discontinued"
              ? "red"
              : "gray";
        return (
          <Badge
            variant="solid"
            colorPalette={statusColorScheme}
            px={2}
            py={0.5}
            textTransform={"capitalize"}
            borderRadius="full"
          >
            {item.replace("_", " ")}
          </Badge>
        );
      },
    },
    {
      title: "Instructions",
      accessor_key: "patient_instructions",
      render: (item) => (
        <Text color="white" noOfLines={2}>
          {item || "-"}
        </Text>
      ),
    },
    {
      title: "Started",
      accessor_key: "started_on",
      render: (item) => (
        <Text color="white" fontSize="sm">
          {item ? new Date(item).toLocaleDateString() : "-"}
        </Text>
      ),
    },
    {
      title: "Actions",
      render: (_, row) => (
        <HStack gap={2}>
          <CustomButton
            size="xs"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            Edit
          </CustomButton>
          {row.status === "active" && (
            <CustomButton
              size="xs"
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                handleDiscontinue(row);
              }}
            >
              Discontinue
            </CustomButton>
          )}
        </HStack>
      ),
    },
  ];

  return (
    <Dialog.Root
      placement="center"
      size="cover"
      motionPreset="slide-in-bottom"
      closeOnInteractOutside={false}
    >
      <Dialog.Trigger>
        <Button
          size="xs"
          variant="outline"
          color="white"
          borderColor="droidalGray.300"
          fontWeight="normal"
          _hover={{ bg: "whiteAlpha.100" }}
        >
          Medications
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
                Medications
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
              {isLoading || isPending ? (
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
                        items={["Active", "Discontinued", "Not Administered"]}
                      />
                    </SegmentGroup.Root>

                    <CustomButton
                      variant="outline"
                      onClick={handleOpenAdd}
                      size="sm"
                      disabled={filters.noKnownMedications}
                    >
                      + Add Med
                    </CustomButton>
                  </HStack>

                  <VStack align="start" gap={2}>
                    <Checkbox.Root
                      disabled={hasMedications}
                      checked={filters.noKnownMedications}
                      onCheckedChange={(e) =>
                        setFilters((prev) => ({
                          ...prev,
                          noKnownMedications: e.checked,
                        }))
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
                        No known medications
                      </Checkbox.Label>
                    </Checkbox.Root>

                    <HStack>
                      <Text
                        letterSpacing={"widest"}
                        color="white"
                        fontSize="sm"
                      >
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
                        value={
                          filters.reconciliationType
                            ? [filters.reconciliationType]
                            : []
                        }
                        onValueChange={(v) => {
                          const val = v[0];
                          setFilters((prev) => ({
                            ...prev,
                            reconciliationType: val,
                            reconciliationPerformed: !!val,
                          }));
                        }}
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

                  <GenericTable
                    title={`${activeTab} Medications`}
                    columns={columns}
                    data={filteredMedications}
                    loader={isLoading || isPending}
                    pagination={false}
                    selection={{
                      selectable: true,
                      onSelectChange: setSelectedIds,
                      defaultSelected: selectedIds,
                    }}
                    count={filteredMedications.length}
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

      <MedicationModal
        isOpen={modalState.isOpen}
        onClose={handleCloseModal}
        mode={modalState.mode}
        initialData={modalState.data}
      />
    </Dialog.Root>
  );
};

export default MedicationsDialog;

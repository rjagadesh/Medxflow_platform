import React, { useState, useContext } from "react";
import {
  Dialog,
  Portal,
  HStack,
  CloseButton,
  SegmentGroup,
  Checkbox,
  VStack,
  Heading,
} from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import ProblemsTable from "./problems-table";
import AddEditProblems from "./add-edit-problems";
import { useGetProblems } from "@/hooks/query/pms/problems/useGetProblems";
import { useParams } from "react-router-dom";
import { EncounterNotesContext } from "@/pages/pms/encounter/encounter-notes/encounter-notes-context";

const ProblemsModal = ({ isOpen, onClose }) => {
  const { patient_id: patientId } = useParams();
  const [activeTab, setActiveTab] = useState("Active");
  const [selectedIds, setSelectedIds] = useState([]);
  const [reconciliationPerformed, setReconciliationPerformed] = useState(false);
  const [isAddProblemOpen, setIsAddProblemOpen] = useState(false);

  const encounterContext = useContext(EncounterNotesContext);

  const { data } = useGetProblems(patientId);

  const problems = data?.problems || [];

  const problemsData = (problems || [])
    .filter((item) => item.status.toLowerCase() === activeTab.toLowerCase())
    .map((item) => ({
      id: item.id,
      problem: item.snomed_name,
      diagnosisDescription: item.icd_name,
      icd10: item.icd10_code,
      icd9: item.snomed_code, // Assuming snomed code maps to this or generic code column
      startDate: item.start_date,
      comments: item.comments,
      lastEdited: new Date(item.updated_at).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
      // originalItem: item, // Keep original item if needed for edit
    }));

  const handleInclude = () => {
    if (encounterContext) {
      const problemsMap = new Map((problems || []).map((p) => [p.id, p]));

      const formatProblem = (item) => {
        let text = item.snomed_name || item.icd_name || "Unknown Problem";
        if (item.icd10_code) text += ` (${item.icd10_code})`;
        if (item.comments) text += ` - ${item.comments}`;
        return text;
      };

      const selectedItems = selectedIds
        .map((id) => problemsMap.get(id))
        .filter(Boolean);

      const noteParts = [];
      if (reconciliationPerformed) {
        noteParts.push("Problem reconciliation performed");
      }

      if (selectedItems.length > 0) {
        noteParts.push(selectedItems.map(formatProblem).join("\n"));
      }

      const generatedNote = noteParts.join("\n\n");

      encounterContext.updateSectionData("Assessment", {
        generated_note: generatedNote,
        selected_ids: selectedIds,
      });

      onClose();
    }
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => !details.open && onClose()}
      placement="center"
      motionPreset="slide-in-bottom"
      size={"full"}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bgColor="droidalBlack.300"
            color="white"
            borderRadius="md"
          >
            <Dialog.Header
              borderBottom={"1px solid"}
              borderColor={"droidalGray.300"}
              display="flex"
              justifyContent="space-between"
              alignItems="center"
            >
              <Dialog.Title fontSize="xl" my={0} fontWeight="light">
                Include Problems
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.CloseTrigger asChild>
              <CloseButton
                size="lg"
                pos="absolute"
                top="2"
                right="2"
                color="droidalGray.300"
                _hover={{ color: "white", bgColor: "transparent" }}
                onClick={onClose}
              />
            </Dialog.CloseTrigger>

            <Dialog.Body>
              <VStack align="stretch" gap={4} py={4}>
                <HStack justify="space-between" align="center">
                  <SegmentGroup.Root
                    size="sm"
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v.value)}
                    bgColor="#000"
                    css={{
                      '& [data-state="checked"]': {
                        bgImage: "var(--bg-blue-gradient)",
                        color: "#fff",
                      },
                    }}
                  >
                    <SegmentGroup.Indicator />
                    <SegmentGroup.Items
                      cursor="pointer"
                      color="#fff"
                      items={["Active", "Inactive", "Marked as Error"]}
                    />
                  </SegmentGroup.Root>

                  <CustomButton
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddProblemOpen(true)}
                  >
                    + Problem
                  </CustomButton>
                </HStack>

                <AddEditProblems
                  isOpen={isAddProblemOpen}
                  onClose={() => setIsAddProblemOpen(false)}
                  patientId={patientId}
                />

                <Checkbox.Root
                  checked={reconciliationPerformed}
                  onCheckedChange={(e) => setReconciliationPerformed(e.checked)}
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control
                    _checked={{
                      bgImage:
                        "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                    }}
                    borderColor="#2f4d78"
                    bgColor="black"
                  />
                  <Checkbox.Label color="#90a6c6" fontSize="sm">
                    Problem reconciliation performed
                  </Checkbox.Label>
                </Checkbox.Root>

                <Heading size="lg" fontWeight="light">
                  {activeTab} Problems
                </Heading>

                <ProblemsTable
                  data={problemsData}
                  selection={{
                    defaultSelected: selectedIds,
                    selectable: true,
                    showSelectAll: false,
                    onSelectChange: (ids) => setSelectedIds(ids),
                  }}
                  showActionBar={false}
                  count={problemsData.length}
                />
              </VStack>
            </Dialog.Body>

            <Dialog.Footer
              borderTop="1px solid"
              borderColor="droidalGray.300"
              py={4}
            >
              <HStack spacing={4} justify="flex-end" width="full">
                <CustomButton variant="outline" onClick={onClose}>
                  Cancel
                </CustomButton>
                <CustomButton variant="danger">Mark as Error</CustomButton>
                <CustomButton variant="outline">Deactivate</CustomButton>
                <CustomButton
                  bg="orange.400"
                  _hover={{ bg: "orange.500" }}
                  onClick={handleInclude}
                >
                  Include
                </CustomButton>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default ProblemsModal;

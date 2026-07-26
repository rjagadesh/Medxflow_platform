import React, { useState, useEffect } from "react";
import { Table, Flex, Text, IconButton, Portal, Checkbox } from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react/dialog";
import { LuTrash2, LuX } from "react-icons/lu";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import CustomButton from "@/components/button/button";
import { Tooltip } from "@/components/ui/tooltip";

const ProcedureConfirmDialog = ({ open, onClose, procedures, onRemove, onConfirm }) => {
  console.log("Procedures in dialog:", procedures);
  const [selectedIndices, setSelectedIndices] = useState(new Set());

  useEffect(() => {
    if (open) {
      setSelectedIndices(new Set());
    }
  }, [open]);

  const handleToggleSelectAll = (checked) => {
    if (checked) {
      setSelectedIndices(new Set(procedures.map((_, i) => i)));
    } else {
      setSelectedIndices(new Set());
    }
  };

  const handleToggleRow = (index, checked) => {
    const newIndices = new Set(selectedIndices);
    if (checked) {
      newIndices.add(index);
    } else {
      newIndices.delete(index);
    }
    setSelectedIndices(newIndices);
  };

  const handleConfirmAction = () => {
    if (selectedIndices.size > 0) {
      const selectedProcedures = procedures.filter((_, i) => selectedIndices.has(i));
      onConfirm(selectedProcedures);
    } else {
      onConfirm(procedures);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(details) => onClose(details.open)}
      size="xl"
      motionPreset="scale"
      placement="center"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="droidalBlack.300" borderColor="#2f4d78">
            <Dialog.Header borderBottom="1px solid #2f4d78" pb={3}>
              <Flex justify="space-between" align="center">
                <Dialog.Title color="white" fontSize="lg">
                  Confirm Procedures for Autofill
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <IconButton variant="ghost" color="white" size="sm" onClick={() => onClose(false)}>
                    <LuX />
                  </IconButton>
                </Dialog.CloseTrigger>
              </Flex>
            </Dialog.Header>

            <Dialog.Body py={4} maxH="400px" overflowY="auto">
              {procedures.length === 0 ? (
                <Text color="white" textAlign="center">No procedures to add.</Text>
              ) : (
                <Table.Root size="sm" variant="simple" showColumnBorder>
                  <Table.Header bg="droidalBlack.400">
                    <Table.Row>
                      <Table.ColumnHeader color="white" width="40px">
                        <Checkbox.Root
                          checked={procedures.length > 0 && selectedIndices.size === procedures.length}
                          onCheckedChange={(e) => handleToggleSelectAll(!!e.checked)}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control border="1px solid #2f4d78">
                            <Checkbox.Indicator />
                          </Checkbox.Control>
                        </Checkbox.Root>
                      </Table.ColumnHeader>
                      <Table.ColumnHeader color="white">CPT</Table.ColumnHeader>
                      <Table.ColumnHeader color="white">Modifier</Table.ColumnHeader>
                      <Table.ColumnHeader color="white">Charge</Table.ColumnHeader>
                      <Table.ColumnHeader color="white">Diagnosis</Table.ColumnHeader>
                      <Table.ColumnHeader color="white" width="50px">Status</Table.ColumnHeader>
                      <Table.ColumnHeader color="white" width="50px">Action</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {procedures.map((proc, index) => (
                      <Table.Row key={index} _hover={{ bg: "droidalBlack.400" }}>
                        <Table.Cell>
                          <Checkbox.Root
                            checked={selectedIndices.has(index)}
                            onCheckedChange={(e) => handleToggleRow(index, !!e.checked)}
                          >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control border="1px solid #2f4d78">
                              <Checkbox.Indicator />
                            </Checkbox.Control>
                          </Checkbox.Root>
                        </Table.Cell>
                        <Table.Cell color="white" fontSize="xs">{proc.cpt}</Table.Cell>
                        <Table.Cell color="white" fontSize="xs">{proc.modifier}</Table.Cell>
                        <Table.Cell color="white" fontSize="xs">${proc.charge}</Table.Cell>
                        <Table.Cell color="white" fontSize="xs">
                          {Array.isArray(proc.dignose_code) 
                            ? proc.dignose_code.join(", ") 
                            : proc.dignose_code}
                        </Table.Cell>
                        <Table.Cell>
                          {proc.is_fee === false ? (
                            <Tooltip content="This CPT code is currently unavailable. Please contact admin if needed.">
                              <span>
                                <AlertTriangle color="#ECCA48" size={18} />
                              </span>
                            </Tooltip>
                          ) : (
                            <CheckCircle2 color="#48BB78" size={18} />
                          )}
                        </Table.Cell>
                        <Table.Cell>
                          <IconButton
                            aria-label="Remove"
                            variant="ghost"
                            colorPalette="red"
                            size="xs"
                            onClick={() => onRemove(index)}
                          >
                            <LuTrash2 />
                          </IconButton>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              )}
            </Dialog.Body>

            <Dialog.Footer borderTop="1px solid #2f4d78" pt={3}>
              <Dialog.ActionTrigger asChild>
                <CustomButton variant="outline" onClick={() => onClose(false)}>
                  Cancel
                </CustomButton>
              </Dialog.ActionTrigger>
              <CustomButton
                ml={3}
                isDisabled={procedures.length === 0}
                onClick={handleConfirmAction}
              >
                Add to Procedure
              </CustomButton>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default ProcedureConfirmDialog;

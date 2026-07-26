import React, { useState, useMemo } from "react";
import {
  Box,
  HStack,
  Text,
  VStack,
  Grid,
  Textarea,
  Portal,
} from "@chakra-ui/react";
import { Dialog } from "@chakra-ui/react/dialog";
import { CloseButton } from "@chakra-ui/react/button";
import GenericTable from "@/components/table/table";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import { Calendar1Icon } from "lucide-react";

const PriorAuthSearch = ({ onSelect, onClose }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  // Mock data
  const [data, setData] = useState([
    {
      id: 1,
      auth_number: "AUTH001",
      visits: 10,
      visits_used: 2,
      valid_from: "2024-01-01",
      valid_to: "2024-12-31",
      plan: "PPO Basic",
      notes: "Routine checkups",
    },
  ]);

  const columns = useMemo(
    () => [
      { title: "Auth#", accessor_key: "auth_number" },
      { title: "#of visits", accessor_key: "visits" },
      { title: "#of visits used", accessor_key: "visits_used" },
      { title: "Valid From", accessor_key: "valid_from" },
      { title: "Valid To", accessor_key: "valid_to" },
      { title: "Plan", accessor_key: "plan" },
      { title: "Notes", accessor_key: "notes" },
      {
        title: "Action",
        accessor_key: "action",
        render: (_, row) => (
          <CustomButton
            size="sm"
            onClick={() => onSelect && onSelect(row.original)}
          >
            Select
          </CustomButton>
        ),
      },
    ],
    [onSelect],
  );

  const tableData = useMemo(
    () => data.map((d) => ({ ...d, original: d })),
    [data],
  );

  // Form State
  const [formData, setFormData] = useState({
    policy: "",
    authNumber: "",
    effectiveFrom: null,
    effectiveTo: null,
    contactName: "",
    contactPhone: "",
    notes: "",
  });

  const handleSave = () => {
    // Add to data
    const newItem = {
      id: data.length + 1,
      auth_number: formData.authNumber,
      visits: 0, // Default
      visits_used: 0,
      valid_from: formData.effectiveFrom
        ? formData.effectiveFrom.toISOString().split("T")[0]
        : "",
      valid_to: formData.effectiveTo
        ? formData.effectiveTo.toISOString().split("T")[0]
        : "",
      plan: formData.policy,
      notes: formData.notes,
    };
    setData([...data, newItem]);
    setIsAddOpen(false);
    setFormData({
      policy: "",
      authNumber: "",
      effectiveFrom: null,
      effectiveTo: null,
      contactName: "",
      contactPhone: "",
      notes: "",
    });
  };

  return (
    <Box
      w="100%"
      h="100%"
      p={6}
      borderRadius="8px"
      bg="#202020c2"
      color="white"
      display="flex"
      flexDirection="column"
    >
      <Text fontSize="xl" fontWeight="semibold" mb={6}>
        Prior Authorization Search
      </Text>

      <Box flex={1} minH={0} mb={4}>
        <GenericTable columns={columns} data={tableData} pagination={false} />
      </Box>

      <HStack spacing={4} justify="flex-end">
        <CustomButton onClick={() => setIsAddOpen(true)}>Add New</CustomButton>
        <CustomButton variant="outline" onClick={onClose}>
          Cancel
        </CustomButton>
      </HStack>

      {/* Add New Dialog */}
      <Dialog.Root open={isAddOpen} onOpenChange={(e) => setIsAddOpen(e.open)}>
        <Portal>
          <Dialog.Backdrop />
          <Dialog.Positioner>
            <Dialog.Content bg="gray.900" color="white" maxW="900px">
              <Dialog.Header>
                <Dialog.Title color="white">
                  Add New Prior Authorization
                </Dialog.Title>
                <Dialog.CloseTrigger asChild>
                  <CloseButton size="sm" color="white" />
                </Dialog.CloseTrigger>
              </Dialog.Header>
              <Dialog.Body>
                <VStack spacing={4} align="stretch">
                  <Grid templateColumns="1fr 1fr" gap={4}>
                    <Box>
                      <Text mb={1} fontSize="sm">
                        Policy
                      </Text>
                      <CustomSelect
                        options={[
                          { label: "Policy A", value: "Policy A" },
                          { label: "Policy B", value: "Policy B" },
                        ]}
                        value={formData.policy ? [formData.policy] : []}
                        onValueChange={(v) =>
                          setFormData({ ...formData, policy: v[0] })
                        }
                      />
                    </Box>
                    <Box>
                      <Text mb={1} fontSize="sm">
                        Auth#
                      </Text>
                      <CustomInput
                        value={formData.authNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            authNumber: e.target.value,
                          })
                        }
                        h="32px"
                      />
                    </Box>
                    <Box>
                      <Text mb={1} fontSize="sm">
                        Effective From
                      </Text>
                      <CustomDatePicker
                        value={formData.effectiveFrom}
                        onValueChange={(d) =>
                          setFormData({ ...formData, effectiveFrom: d })
                        }
                        endElement={
                          <Calendar1Icon className="text-gray-400" size={16} />
                        }
                      />
                    </Box>
                    <Box>
                      <Text mb={1} fontSize="sm">
                        Effective To
                      </Text>
                      <CustomDatePicker
                        value={formData.effectiveTo}
                        onValueChange={(d) =>
                          setFormData({ ...formData, effectiveTo: d })
                        }
                        endElement={
                          <Calendar1Icon className="text-gray-400" size={16} />
                        }
                      />
                    </Box>
                  </Grid>{" "}
                  <Text marginTop={6}  fontWeight="bold">Authorization Contact</Text>
                  <Grid templateColumns="1fr 1fr" gap={4}>
                    <Box>
                      <Text mb={1} fontSize="sm">
                        Full Name
                      </Text>
                      <CustomInput
                        value={formData.contactName}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactName: e.target.value,
                          })
                        }
                        h="32px"
                      />
                    </Box>
                    <Box>
                      <Text mb={1} fontSize="sm">
                        Ph no
                      </Text>
                      <CustomInput
                        value={formData.contactPhone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            contactPhone: e.target.value,
                          })
                        }
                        h="32px"
                      />
                    </Box>
                  </Grid>
                  <Box>
                    <Text mb={1} fontSize="sm">
                      Notes
                    </Text>
                    <Textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      bg="droidalBlack.300"
                      borderColor="#2f4d78"
                      _focus={{
                        borderColor: "#00BBF2",
                        boxShadow: "0 0 0 2px #00BBF2",
                      }}
                    />
                  </Box>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer>
                <CustomButton
                  variant="outline"
                  onClick={() => setIsAddOpen(false)}
                >
                  Cancel
                </CustomButton>
                <CustomButton onClick={handleSave}>Save</CustomButton>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
};

export default PriorAuthSearch;

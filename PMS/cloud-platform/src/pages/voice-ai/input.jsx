import React, { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  Center,
  Heading,
  HStack,
  Text,
  VStack,
  Grid,
  GridItem,
  Badge,
  Flex,
  Checkbox,
} from "@chakra-ui/react";
import {
  ChevronRight,
  ChevronDown,
  GripVerticalIcon,
  XIcon,
  EyeIcon,
  Loader,
  Settings,
} from "lucide-react";

import { useUpdateColumnSettings } from "@/hooks/mutation/useUpdateColumnSettings";
import { useCreateColumnSettings } from "@/hooks/mutation/useCreateColumnSettings";
import { useGetColumnData } from "@/hooks/query/admin/useGetColumnData";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import TablePreviewDialog from "@/components/table/tablePreview";
import CustomColumn from "@/features/admin/modal/custom-column";
import { toaster } from "@/components/ui/toaster";
import { atobAgentId } from "@/utils/helper";
import EmptyStateIcon from "@/assets/icons/empty-state.svg?react";
import VoiceAiHeader from "./components/voice-ai-header";
import CustomButton from "@/components/button/button";

const VoiceAiInput = () => {
  const navigate = useNavigate();
  const { agent_app } = useParams();
  const agentId = useMemo(
    () => (agent_app ? atobAgentId(agent_app) : ""),
    [agent_app],
  );

  const [openPreview, setOpenPreview] = useState(false);
  const [selectedColumns, setSelectedColumns] = useState(new Set());
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [columnOrder, setColumnOrder] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  const { mutate: saveSettings, isPending: isUpdatePending } =
    useUpdateColumnSettings();
  const { mutate: createColumnSettings, isPending: isCreatePending } =
    useCreateColumnSettings();

  const {
    data: selectedAppData = { columns: [] },
    isLoading: columnSettingsLoading,
  } = useGetColumnData(agentId, true);

  // Group columns by section
  const groupedColumns = useMemo(() => {
    if (!selectedAppData?.columns) return {};

    const groups = {};
    selectedAppData.columns.forEach((column) => {
      const section = column.section || "General";
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(column);
    });
    return groups;
  }, [selectedAppData]);

  // Sync state with fetched data
  useEffect(() => {
    if (!selectedAppData?.columns) return;

    const activeColumns =
      selectedAppData.columns.filter((col) => col.active) || [];
    const activeColumnIds = new Set(activeColumns.map((col) => col.id));

    // Only update if there's a difference to avoid loop
    const currentOrderSet = new Set(columnOrder);
    const hasDifference =
      activeColumns.length !== columnOrder.length ||
      activeColumns.some((col) => !currentOrderSet.has(col.id));

    if (hasDifference || columnOrder.length === 0) {
      setSelectedColumns(activeColumnIds);
      setColumnOrder(activeColumns.map((col) => col.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppData]);

  const handleColumnToggle = (columnId) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnId)) {
      newSelected.delete(columnId);
      setColumnOrder((prev) => prev.filter((id) => id !== columnId));
    } else {
      newSelected.add(columnId);
      setColumnOrder((prev) => [...prev, columnId]);
    }
    setSelectedColumns(newSelected);
  };

  const toggleSection = (section) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(section)) {
      newCollapsed.delete(section);
    } else {
      newCollapsed.add(section);
    }
    setCollapsedSections(newCollapsed);
  };

  const handleSelectAll = (sectionColumns) => {
    const newSelected = new Set(selectedColumns);
    const newOrder = [...columnOrder];

    sectionColumns.forEach((col) => {
      if (!newSelected.has(col.id)) {
        newSelected.add(col.id);
        newOrder.push(col.id);
      }
    });

    setSelectedColumns(newSelected);
    setColumnOrder(newOrder);
  };

  const handleDeselectAll = (sectionColumns) => {
    const newSelected = new Set(selectedColumns);
    sectionColumns.forEach((col) => newSelected.delete(col.id));

    setSelectedColumns(newSelected);
    setColumnOrder((prev) =>
      prev.filter((id) => !sectionColumns.find((col) => col.id === id)),
    );
  };

  const getSectionStats = (sectionColumns) => {
    const selected = sectionColumns.filter((col) =>
      selectedColumns.has(col.id),
    ).length;
    const total = sectionColumns.length;
    return { selected, total };
  };

  // Drag and drop handlers
  const handleDragStart = (e, columnId) => {
    setDraggedItem(columnId);
    e.dataTransfer.effectAllowed = "move";
    // Set a transparent image or style if needed
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();

    if (draggedItem && draggedItem !== targetColumnId) {
      const newOrder = [...columnOrder];
      const draggedIndex = newOrder.indexOf(draggedItem);
      const targetIndex = newOrder.indexOf(targetColumnId);

      if (draggedIndex > -1 && targetIndex > -1) {
        newOrder.splice(draggedIndex, 1);
        newOrder.splice(targetIndex, 0, draggedItem);
        setColumnOrder(newOrder);
      }
    }
    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const getOrderedSelectedColumns = useCallback(() => {
    if (!selectedAppData?.columns) return [];

    const columnMap = new Map(
      selectedAppData.columns.map((col) => [col.id, col]),
    );

    // First, get the ordered active columns
    const orderedActive = columnOrder
      .map((id) => {
        const col = columnMap.get(id);
        return col ? { ...col, active: true } : null;
      })
      .filter(Boolean);

    // Then find inactive columns
    const inactiveColumns = selectedAppData.columns
      .filter((col) => !selectedColumns.has(col.id))
      .map((col) => ({ ...col, active: false }));

    return [...orderedActive, ...inactiveColumns];
  }, [selectedAppData, selectedColumns, columnOrder]);

  const handleSave = () => {
    const updatedColumns = getOrderedSelectedColumns();

    if (!updatedColumns || updatedColumns.length === 0) {
      toaster.warning({
        title: "Warning",
        description: "No columns are selected",
      });
      return false;
    }

    const payload = {
      app_name: agentId, // Using the decoded agent ID as app_name
      columns: updatedColumns,
    };

    const callbacks = {
      onSuccess: () => {
        toaster.success({
          title: "Success",
          description: "Column settings updated successfully",
        });
      },
      onError: (error) => {
        console.error("Save error:", error);
        toaster.error({
          title: "Error",
          description: error.message || "Error updating column settings",
        });
      },
    };

    if (selectedAppData.id) {
      saveSettings({ ...payload, id: selectedAppData.id }, callbacks);
    } else {
      createColumnSettings(payload, callbacks);
    }
    return true;
  };

  return (
    <Flex direction="column" h="full">
      <VoiceAiHeader />
      <Box
        p={{ base: 4, md: 6 }}
        bg="droidalBlack.400"
        borderRadius="2xl"
        flex="0.99"
        color="white"
        overflow="hidden"
        className="flex flex-col"
      >
        <Card.Root
          border="none"
          bg="transparent"
          w="full"
          h="full"
          display="flex"
          flexDirection="column"
        >
          <Card.Header px={0} pt={0} pb={4}>
            <Box
              border="1px solid"
              borderColor="#2f4d78"
              borderRadius="xl"
              p={{ base: 4, md: 5 }}
              pt={0}
            >
              <Flex
                justifyContent="space-between"
                alignItems={{ base: "flex-start", lg: "center" }}
                gap={4}
                flexWrap="wrap"
              >
                <VStack align="start" gap={3}>
                  <HStack gap={3}>
                    <Center
                      boxSize="11"
                      bg="blackAlpha.400"
                      border="1px solid"
                      borderColor="whiteAlpha.300"
                      borderRadius="lg"
                    >
                      <Settings size={20} color="white" />
                    </Center>
                    <VStack align="start" gap={0}>
                      <Heading
                        size="lg"
                        margin={0}
                        color="white"
                        fontWeight="normal"
                        letterSpacing={"widest"}
                      >
                        Input Configuration for{" "}
                        {selectedAppData.app_data?.app_name}
                      </Heading>
                    </VStack>
                  </HStack>
                </VStack>

                <CustomColumn
                  initialValues={selectedAppData}
                  selectedAgent={agentId}
                />
              </Flex>
            </Box>
          </Card.Header>

          <Card.Body
            px={0}
            pt={0}
            flex="1"
            overflow="hidden"
            display="flex"
            flexDirection="column"
            minH={0}
            pb={0}
          >
            {columnSettingsLoading ? (
              <Center py={20}>
                <Loader className="animate-spin" size={32} />
              </Center>
            ) : !selectedAppData?.columns?.length ? (
              <Center py={20} flexDirection="column" gap={4}>
                <EmptyStateIcon width={200} height={200} />
                <Text
                  color="gray.300"
                  letterSpacing={"wider"}
                  fontWeight={"light"}
                >
                  No columns found for this agent.
                </Text>
              </Center>
            ) : (
              <VStack
                color={"white"}
                align="stretch"
                gap={6}
                flex="1"
                minH={0}
                overflow="hidden"
              >
                <Grid
                  templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
                  gap={6}
                  flex="1"
                  minH={0}
                >
                  {/* Left Column: Available Columns */}
                  <GridItem display="flex" minH={0}>
                    <Box
                      border="1px solid"
                      borderColor="#2f4d78"
                      borderRadius="xl"
                      bg="droidalBlack.300"
                      p={4}
                      display="flex"
                      flexDirection="column"
                      h="full"
                      w="full"
                      minH={0}
                    >
                      <HStack
                        justify="space-between"
                        mb={4}
                        position="sticky"
                        top={0}
                        zIndex={1}
                        bg="droidalBlack.300"
                        pb={2}
                      >
                        <Text
                          fontSize="lg"
                          letterSpacing={"widest"}
                          fontWeight="light"
                        >
                          Available Columns
                        </Text>
                        <Badge
                          variant="solid"
                          borderRadius="md"
                          className="dark"
                          bgColor={"primary.400"}
                          letterSpacing={"wider"}
                        >
                          {selectedAppData.columns.length} Total
                        </Badge>
                      </HStack>

                      <VStack
                        gap={4}
                        align="stretch"
                        flex="1"
                        minH={0}
                        pr={1}
                        overflowY="auto"
                      >
                        {Object.entries(groupedColumns).map(
                          ([section, sectionColumns]) => {
                            const { selected, total } =
                              getSectionStats(sectionColumns);
                            const isCollapsed = collapsedSections.has(section);

                            return (
                              <Box
                                key={section}
                                border="1px solid"
                                borderColor="#2f4d78"
                                borderRadius="md"
                                bg="blackAlpha.300"
                              >
                                <Box
                                  p={3}
                                  cursor="pointer"
                                  onClick={() => toggleSection(section)}
                                  display="flex"
                                  justifyContent="space-between"
                                  alignItems="center"
                                  _hover={{ bg: "whiteAlpha.100" }}
                                >
                                  <HStack gap={2}>
                                    {isCollapsed ? (
                                      <ChevronRight size={16} />
                                    ) : (
                                      <ChevronDown size={16} />
                                    )}
                                    <Text
                                      fontWeight="normal"
                                      fontSize="sm"
                                      letterSpacing={"wider"}
                                    >
                                      {section}
                                    </Text>
                                    <Text
                                      fontSize="xs"
                                      color="gray.400"
                                      letterSpacing={"wider"}
                                      fontWeight={"light"}
                                    >
                                      ({selected}/{total})
                                    </Text>
                                  </HStack>

                                  {!isCollapsed && (
                                    <HStack
                                      gap={2}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Button
                                        size="sm"
                                        color="primary.400"
                                        _hover={{
                                          color: "primary.300",
                                        }}
                                        bgColor={"transparent"}
                                        height="auto"
                                        py={1}
                                        onClick={() =>
                                          handleSelectAll(sectionColumns)
                                        }
                                        letterSpacing={"widest"}
                                        fontWeight="light"
                                      >
                                        Select All
                                      </Button>
                                      <Button
                                        size="sm"
                                        height="auto"
                                        py={1}
                                        onClick={() =>
                                          handleDeselectAll(sectionColumns)
                                        }
                                        letterSpacing={"widest"}
                                        fontWeight="light"
                                      >
                                        Deselect
                                      </Button>
                                    </HStack>
                                  )}
                                </Box>

                                {!isCollapsed && (
                                  <Box
                                    p={3}
                                    borderTop="1px solid"
                                    borderColor="#2f4d78"
                                    bg="blackAlpha.400"
                                  >
                                    <VStack align="stretch" gap={2}>
                                      {sectionColumns.map((column) => (
                                        <HStack
                                          key={column.id}
                                          gap={3}
                                          p={2}
                                          borderRadius="md"
                                          _hover={{ bg: "whiteAlpha.100" }}
                                        >
                                          <Checkbox.Root
                                            size={{
                                              base: "sm",
                                              "2xl": "md",
                                              "3xl": "lg",
                                            }}
                                            aria-label="Select all rows"
                                            checked={selectedColumns.has(
                                              column.id,
                                            )}
                                            onCheckedChange={() =>
                                              handleColumnToggle(column.id)
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
                                            <Checkbox.Label
                                              htmlFor={`col-${column.id}`}
                                              className="flex-1 text-sm cursor-pointer select-none hover:text-blue-300 transition-colors"
                                            >
                                              {column.name}
                                            </Checkbox.Label>
                                          </Checkbox.Root>
                                        </HStack>
                                      ))}
                                    </VStack>
                                  </Box>
                                )}
                              </Box>
                            );
                          },
                        )}
                      </VStack>
                    </Box>
                  </GridItem>

                  {/* Right Column: Selected Order */}
                  <GridItem display="flex" minH={0}>
                    <Box
                      w="full"
                      border="1px solid"
                      borderColor="#2f4d78"
                      borderRadius="xl"
                      bg="droidalBlack.300"
                      p={4}
                      display="flex"
                      flexDirection="column"
                      h="full"
                      minH={0}
                    >
                      <HStack justify="space-between" mb={4}>
                        <Text
                          fontWeight="normal"
                          letterSpacing={"wider"}
                          fontSize="lg"
                        >
                          Active Columns Order
                        </Text>
                        <HStack>
                          <Badge
                            colorPalette="green"
                            variant="solid"
                            borderRadius="md"
                            letterSpacing={"wider"}
                          >
                            {selectedColumns.size} Active
                          </Badge>
                        </HStack>
                      </HStack>

                      <Box
                        p={4}
                        bg="blackAlpha.300"
                        borderRadius="lg"
                        border="1px solid"
                        borderColor="#2f4d78"
                        flex="1"
                        minH={0}
                        display="flex"
                        flexDirection="column"
                      >
                        {selectedColumns.size === 0 ? (
                          <Center
                            h="100%"
                            flexDirection="column"
                            color="gray.500"
                            py={10}
                          >
                            <Text
                              letterSpacing={"wider"}
                              fontWeight={"normal"}
                              fontSize={"md"}
                            >
                              No columns selected.
                            </Text>
                            <Text
                              fontSize="sm"
                              letterSpacing={"wider"}
                              fontWeight={"light"}
                            >
                              Select columns from the left to configure.
                            </Text>
                          </Center>
                        ) : (
                          <VStack
                            align="stretch"
                            gap={2}
                            flex="1"
                            minH={0}
                            overflowY="auto"
                            pr={1}
                          >
                            <Text
                              fontSize="sm"
                              color="blue.300"
                              mb={2}
                              letterSpacing={"wider"}
                              fontWeight={"light"}
                            >
                              Drag and drop items to reorder columns in the
                              table.
                            </Text>

                            {columnOrder.map((colId) => {
                              const col = selectedAppData.columns.find(
                                (c) => c.id === colId,
                              );
                              if (!col) return null;

                              return (
                                <Box
                                  key={col.id}
                                  draggable
                                  onDragStart={(e) =>
                                    handleDragStart(e, col.id)
                                  }
                                  onDragOver={handleDragOver}
                                  onDrop={(e) => handleDrop(e, col.id)}
                                  onDragEnd={handleDragEnd}
                                  p={3}
                                  bg={
                                    draggedItem === col.id
                                      ? "whiteAlpha.200"
                                      : "droidalBlack.300"
                                  }
                                  border="1px solid"
                                  borderColor={
                                    draggedItem === col.id
                                      ? "blue.500"
                                      : "whiteAlpha.300"
                                  }
                                  borderRadius="md"
                                  display="flex"
                                  alignItems="center"
                                  justifyContent="space-between"
                                  cursor="grab"
                                  _hover={{
                                    borderColor: "blue.400",
                                    transform: "translateY(-1px)",
                                    shadow: "md",
                                  }}
                                  transition="all 0.2s"
                                  opacity={draggedItem === col.id ? 0.5 : 1}
                                >
                                  <HStack gap={3}>
                                    <GripVerticalIcon
                                      size={16}
                                      color="#718096"
                                    />
                                    <VStack align="start" gap={0}>
                                      <Text
                                        fontSize="sm"
                                        fontWeight="normal"
                                        letterSpacing={"wider"}
                                      >
                                        {col.name}
                                      </Text>
                                      {col.condition && (
                                        <Text
                                          fontSize="xs"
                                          color="gray.500"
                                          fontStyle="italic"
                                          letterSpacing={"wider"}
                                        >
                                          {col.condition}
                                        </Text>
                                      )}
                                    </VStack>
                                  </HStack>
                                  <Button
                                    size="xs"
                                    variant="ghost"
                                    colorPalette="red"
                                    className="dark"
                                    onClick={() => handleColumnToggle(col.id)}
                                    p={1}
                                    h="auto"
                                  >
                                    <XIcon size={16} />
                                  </Button>
                                </Box>
                              );
                            })}
                          </VStack>
                        )}
                      </Box>
                    </Box>
                  </GridItem>
                </Grid>
                <HStack justify="flex-end">
                  <HStack>
                    <CustomButton
                      variant="outline"
                      onClick={() => {
                        navigate(
                          `/voice-ai/voice-ai-MTA=/${agent_app}/dashboard/`,
                        );
                      }}
                    >
                      Cancel
                    </CustomButton>
                    <ConfirmationDialog
                      title="Save Changes"
                      description="Are you sure you want to update the voice input column configuration?"
                      onConfirm={handleSave}
                      buttonName="Save"
                      loading={isUpdatePending || isCreatePending}
                    />
                  </HStack>
                </HStack>
              </VStack>
            )}

            <TablePreviewDialog
              open={openPreview}
              getActiveColumns={getOrderedSelectedColumns}
              onClose={() => setOpenPreview(false)}
            />
          </Card.Body>
        </Card.Root>
      </Box>
    </Flex>
  );
};

export default VoiceAiInput;

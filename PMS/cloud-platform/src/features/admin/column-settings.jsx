import React, { useEffect, useState } from "react";
import { useMemo } from "react";
import { ChevronRight, Loader } from "lucide-react";
import { ChevronDown } from "lucide-react";
import { GripVerticalIcon } from "lucide-react";
import { XIcon } from "lucide-react";
import { useUpdateColumnSettings } from "@/hooks/mutation/useUpdateColumnSettings";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import { useCreateColumnSettings } from "@/hooks/mutation/useCreateColumnSettings";
import { EyeIcon } from "lucide-react";
import {
  Box,
  Button,
  Card,
  Center,
  Field,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/react";
import TablePreviewDialog from "@/components/table/tablePreview";
import { useCallback } from "react";
import CustomColumn from "./modal/custom-column";
import { useGetDepartments } from "@/hooks/query/useGetDepartments";
import { useGetAgents } from "@/hooks/query/useGetAgents";
import CustomSelect from "@/components/ui/select";
import { useGetColumnData } from "@/hooks/query/admin/useGetColumnData";
import { toaster } from "@/components/ui/toaster";
import EmptyStateIcon from "@/assets/icons/empty-state.svg?react";
import UnauthorizedPage from "@/pages/unauthorized";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";

const ColumnSettings = () => {
  const [open, setOpen] = useState(false);
  const { hasPermission } = usePermissions();
  // const { data: settings = [] } = useGetColumnSettings();
  const { mutate: saveSettings, isPending } = useUpdateColumnSettings();
  const { mutate: createColumnSettings, isPending: createLoading } =
    useCreateColumnSettings();
  const [selectedDepartments, setSelectedDepartments] = useState();
  const [selectedAgents, setSelectedAgents] = useState();
  const { data: departments = [] } = useGetDepartments();
  const { data: agents = [] } = useGetAgents({
    module_id: selectedDepartments?.[0],
  });
  const {
    data: selectedAppData = {
      columns: [],
    },
    isLoading: columnSettingsLoading,
  } = useGetColumnData(selectedAgents?.[0]);
  const [selectedColumns, setSelectedColumns] = useState(new Set());
  const [collapsedSections, setCollapsedSections] = useState(new Set());
  const [columnOrder, setColumnOrder] = useState([]);
  const [draggedItem, setDraggedItem] = useState(null);

  const removeColumn = (columnId) => {
    const newSelected = new Set(selectedColumns);
    newSelected.delete(columnId);
    setSelectedColumns(newSelected);
    setColumnOrder((prev) => prev.filter((id) => id !== columnId));
  };

  // Group columns by section
  const groupedColumns = useMemo(() => {
    if (!selectedAppData) return {};

    const groups = {};
    selectedAppData?.columns?.forEach((column) => {
      const section = column.section || "General";
      if (!groups[section]) {
        groups[section] = [];
      }
      groups[section].push(column);
    });
    return groups;
  }, [selectedAppData]);

  useEffect(() => {
    if (!selectedAppData) return;

    const activeColumns =
      selectedAppData.columns?.filter((col) => col.active) || [];
    const activeColumnIds = new Set(activeColumns?.map((col) => col.id));

    if (
      activeColumns.length !== columnOrder.length ||
      activeColumns.some((col, i) => col.id !== columnOrder[i])
    ) {
      setSelectedColumns(activeColumnIds);
      setColumnOrder(activeColumns.map((col) => col.id));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAppData]);

  const handleColumnToggle = (columnId) => {
    const newSelected = new Set(selectedColumns);
    if (newSelected.has(columnId)) {
      newSelected.delete(columnId);
    } else {
      newSelected.add(columnId);
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
    sectionColumns.forEach((col) => newSelected.add(col.id));
    setSelectedColumns(newSelected);
  };

  const handleDeselectAll = (sectionColumns) => {
    const newSelected = new Set(selectedColumns);
    sectionColumns.forEach((col) => newSelected.delete(col.id));
    setSelectedColumns(newSelected);
  };

  const getSectionStats = (sectionColumns) => {
    const selected = sectionColumns.filter((col) =>
      selectedColumns.has(col.id)
    ).length;
    const total = sectionColumns.length;
    return { selected, total };
  };

  const handleDrop = (e, targetColumnId) => {
    e.preventDefault();

    if (draggedItem && draggedItem !== targetColumnId) {
      const newOrder = [...columnOrder];
      const draggedIndex = newOrder.indexOf(draggedItem);
      const targetIndex = newOrder.indexOf(targetColumnId);

      // Remove dragged item and insert at target position
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedItem);

      setColumnOrder(newOrder);
    }

    setDraggedItem(null);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e, columnId) => {
    setDraggedItem(columnId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const getOrderedSelectedColumns = useCallback(() => {
    if (!selectedAppData) return [];

    const columnMap = new Map(
      selectedAppData.columns?.map((col) => [col.id, col])
    );
    const inActiveColumns = selectedAppData.columns?.filter(
      (col) => !col.active
    );
    console.log("selectedColumns", selectedColumns.values());
    const data = columnOrder
      .map((id) => {
        return {
          ...columnMap.get(id),
          active: selectedColumns.has(id) ? true : false,
        };
      })
      .filter(Boolean);
    const updateInactiveColumns = inActiveColumns.map((col) => ({
      ...col,
      active: selectedColumns.has(col.id) ? true : false,
    }));
    return [...data, ...updateInactiveColumns];
  }, [selectedAppData, selectedColumns, columnOrder]);

  const getActiveColumns = useCallback(() => {
    return getOrderedSelectedColumns();
  }, [getOrderedSelectedColumns]);

  const handleSave = () => {
    const updatedColumns = getOrderedSelectedColumns();
    console.log("updatedColumns", updatedColumns);
    if (!updatedColumns || updatedColumns?.length === 0) {
      toaster.warning({
        title: "Error",
        description: "No columns are found or selected",
      });
      return false;
    }
    if (selectedAppData.id) {
      saveSettings(
        {
          app_name: selectedAppData.app_name,
          id: selectedAppData.id,
          columns: updatedColumns,
        },
        {
          onSuccess: () => {
            toaster.success({
              title: "Success",
              description: "Column settings updated successfully",
            });
          },
          onError: (error) => {
            console.log("error", error);
            toaster.error({
              title: "Error",
              description: error.message || "Error updating column settings",
            });
          },
        }
      );
      return true;
    } else {
      createColumnSettings({
        app_name: selectedAgents?.[0],
        columns: updatedColumns,
      });
      return true;
    }
  };

  const handlePreview = () => {
    setOpen(true);
  };

  if (!hasPermission("column_settings", "view")) {
    return <UnauthorizedPage />;
  }

  console.log("getOrderedSelectedColumns", getOrderedSelectedColumns());

  return (
    <>
      <Card.Root mt="8" w={"full"} bg={"droidalBlack.300"} pb="4" border="none">
        <Card.Header
          as="div"
          display={"flex"}
          justifyContent={"space-between"}
          flexDirection={"row"}
          alignItems={"center"}
          px="4"
        >
          <Text
            color="white"
            letterSpacing={"widest"}
            fontSize={"xl"}
            fontWeight={"semibold"}
          >
            Agent Column Settings
          </Text>
          {selectedAgents && (
            <CustomColumn
              initialValues={selectedAppData}
              selectedAgent={selectedAgents?.[0]}
            />
          )}
        </Card.Header>
        <Card.Body>
          <div className="max-w-full p-6 text-white grid grid-cols-2 gap-4">
            <Field.Root>
              <Field.Label color="white">Department</Field.Label>
              <CustomSelect
                width="full"
                borderRadius="4px !important"
                borderColor="#2f4d78"
                css={{
                  "& button": {
                    height: "44px !important",
                    minHeight: "44px !important",
                    borderRadius: "4px !important",
                    borderColor: "#2f4d78",
                  },
                }}
                options={departments.map((app) => ({
                  label: app.module_name,
                  value: app.id,
                }))}
                placeholder="Select Department"
                value={selectedDepartments}
                onValueChange={setSelectedDepartments}
              />
            </Field.Root>
            <Field.Root>
              <Field.Label color="white">Agent</Field.Label>
              <CustomSelect
                width="full"
                borderRadius="4px !important"
                borderColor="#2f4d78"
                css={{
                  "& button": {
                    height: "44px !important",
                    minHeight: "44px !important",
                    borderRadius: "4px !important",
                    borderColor: "#2f4d78",
                  },
                }}
                options={agents.map((app) => ({
                  label: app.app_name,
                  value: app.id,
                }))}
                placeholder="Select Agent"
                value={selectedAgents}
                onValueChange={setSelectedAgents}
              />
            </Field.Root>
          </div>
          {(!selectedDepartments || !selectedAgents) && (
            <Center color="white">
              <VStack gap={2}>
                <EmptyStateIcon width={300} height={300} />
                <Text letterSpacing={"widest"}>
                  Select your Department and Agent to view their columns
                </Text>
              </VStack>
            </Center>
          )}
          {columnSettingsLoading ? (
            <Center>
              <Loader size={24} className="animate-spin" />
            </Center>
          ) : (
            <>
              {selectedAppData?.columns?.length === 0 && selectedAgents && (
                <Center color="white">
                  <VStack gap={2}>
                    <EmptyStateIcon width={300} height={300} />
                    <Center flexDirection={"column"} gap="2">
                      <Text fontWeight="bold" letterSpacing={"widest"}>
                        No Columns found
                      </Text>
                      <Text fontSize="sm" letterSpacing={"widest"}>
                        You can add your first column by clicking 'Create
                        Column'.{" "}
                      </Text>
                    </Center>
                  </VStack>
                </Center>
              )}
            </>
          )}
          {selectedAppData?.columns?.length > 0 && (
            <div className="gap-y-4 px-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg !mb-2 font-semibold text-white">
                  Configure Columns for {selectedAppData.app_data?.app_name}
                </h2>
                <div className="text-sm text-white">
                  {selectedColumns.size} of {selectedAppData.columns?.length}{" "}
                  columns selected
                </div>
              </div>

              {Object.entries(groupedColumns).map(
                ([section, sectionColumns]) => {
                  const { selected, total } = getSectionStats(sectionColumns);
                  const isCollapsed = collapsedSections.has(section);

                  return (
                    <Box
                      borderRadius="4px !important"
                      borderColor="#2f4d78"
                      key={section}
                      className="border  rounded-lg overflow-hidden"
                    >
                      {/* Section Header */}
                      <div className="bg-droidal-black-200 text-white px-4 py-3 border-b border-[#2f4d78]">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => toggleSection(section)}
                            className="flex items-center gap-x-2 text-left"
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            )}
                            <h3 className="font-medium text-white">
                              {section}
                            </h3>
                            <span className="text-sm text-gray-500">
                              ({selected}/{total})
                            </span>
                          </button>

                          {!isCollapsed && (
                            <div className="flex gap-x-2">
                              <button
                                onClick={() => handleSelectAll(sectionColumns)}
                                className="text-xs !text-droid-primary-400 tracking-widest hover:text-blue-800"
                              >
                                Select All
                              </button>
                              <button
                                onClick={() =>
                                  handleDeselectAll(sectionColumns)
                                }
                                className="text-xs text-gray-200 tracking-widest hover:text-gray-800"
                              >
                                Deselect All
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Section Content */}
                      {!isCollapsed && (
                        <div className="p-4 gap-y-3">
                          {sectionColumns.map((column) => (
                            <div
                              key={column.id}
                              className="flex items-start gap-x-3"
                            >
                              <div className="flex items-center h-5">
                                <input
                                  type="checkbox"
                                  id={column.id}
                                  checked={selectedColumns.has(column.id)}
                                  onChange={() => handleColumnToggle(column.id)}
                                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <label
                                  htmlFor={column.id}
                                  className="block text-sm font-medium text-gray-200  cursor-pointer"
                                >
                                  {column.name}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Box>
                  );
                }
              )}

              {/* Selected Columns Summary with Drag & Drop */}
              {selectedColumns.size > 0 && (
                <div className="mt-8 p-4 bg-droidal-black-300 border border-[#2f4d78] rounded-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-gray-200 mb-4">
                      Selected Columns ({selectedColumns.size}):
                    </h3>
                    <Button size="xs" onClick={handlePreview}>
                      <EyeIcon />
                      Preview
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {getOrderedSelectedColumns().map((col) => (
                      <>
                        {col.active && (
                          <div
                            key={col.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, col.id)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, col.id)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center justify-between p-3 bg-droidal-black-300 border border-[#2f4d78] rounded-md shadow-sm transition-all duration-200 cursor-move ${
                              draggedItem === col.id
                                ? "opacity-50 transform rotate-2"
                                : "hover:shadow-md hover:border-blue-300"
                            }`}
                          >
                            <div className="flex items-center gap-x-3">
                              <GripVerticalIcon className="w-4 h-4 text-white" />
                              <div>
                                <span className="text-sm font-medium text-gray-200">
                                  {col.name}
                                </span>

                                {col.condition && (
                                  <div className="text-xs text-gray-500 italic mt-1">
                                    {col.condition}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => removeColumn(col.id)}
                                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                title="Remove column"
                              >
                                <XIcon className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        )}
                        {!col.active && null}
                      </>
                    ))}
                  </div>
                  <div className="mt-4 p-3 bg-blue-100 rounded-md">
                    <p className="text-sm text-blue-800">
                      💡 <strong>Tip:</strong> Drag and drop the columns above
                      to reorder them. The order here will determine the column
                      sequence in your final configuration.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
          {selectedAgents && (
            <Box my="4">
              <ConfirmationDialog
                title="Confirmation"
                description="Are you sure you want to save the changes?"
                onConfirm={handleSave}
                buttonName="Save"
                loading={isPending || createLoading}
              />
            </Box>
          )}
          <TablePreviewDialog
            open={open}
            getActiveColumns={getActiveColumns}
            onClose={() => setOpen(false)}
          />
        </Card.Body>
      </Card.Root>
    </>
  );
};

export default ColumnSettings;

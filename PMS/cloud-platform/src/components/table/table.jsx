import { Text } from "@chakra-ui/react/text";
import { useState, useMemo, useRef, useEffect } from "react";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { Pagination } from "@chakra-ui/react/pagination";
import { ButtonGroup, IconButton, Button } from "@chakra-ui/react/button";
import { Tooltip } from "@/components/ui/tooltip";

import { usePaginationContext } from "@chakra-ui/react";
import {
  ArrowBigDownDash,
  ChevronDown,
  ChevronUp,
  DeleteIcon,
  FolderXIcon,
  Loader,
  Trash2,
  Undo2Icon,
} from "lucide-react";
import { Box } from "@chakra-ui/react/box";
import { Center } from "@chakra-ui/react/center";
import { HStack, Stack, VStack } from "@chakra-ui/react/stack";
import { Skeleton } from "@chakra-ui/react/skeleton";
import { Table } from "@chakra-ui/react/table";
import { EmptyState } from "@chakra-ui/react/empty-state";
import { LuShoppingCart } from "react-icons/lu";
import { Checkbox } from "@chakra-ui/react/checkbox";
import { ActionBar } from "@chakra-ui/react/action-bar";
import { Portal } from "@chakra-ui/react/portal";
import { Kbd } from "@chakra-ui/react/kbd";
import ConfirmationDialog from "../confirmation-dialog/confirmation-dialog";
import { useClaimSubmission } from "@/hooks/query/pms/claim_submission/submitClaim";
import CustomSelect from "../ui/select";

const PaginationLink = (props) => {
  const { page, ...rest } = props;
  const pagination = usePaginationContext();
  const pageValue = () => {
    if (page === "prev") return pagination.previousPage;
    if (page === "next") return pagination.nextPage;
    return page;
  };
  return (
    <IconButton asChild {...rest}>
      <a href={`?page=${pageValue()}`}>{props.children}</a>
    </IconButton>
  );
};

export default function GenericTable({
  title,
  columns,
  columnSettings,
  data = [],
  rightAction,
  count = 0,
  claimSubmission,
  enableClaimSubmission = false,
  onPageChange = () => {},
  onRowClick = () => {},
  onPageSizeChange = () => {},
  pageSize = 10,
  showPageSize = false,
  page = 1,
  loader = false,
  headerLoading = false,
  sort = "",
  onSortClick = () => {},
  pagination = true,
  emptyState = {
    title: "No data found",
    description: "No data available to display.",
  },
  selection = {
    defaultSelected: [],
    selectable: false,
    showSelectAll: false,
    checkboxProps: {},
    onSelectAllChange: () => {},
    onSelectChange: () => {},
    onConfirm: () => {},
    checkPermission: () => {},
  },
  selectedRow = null,
  bodyHeight,
  minWidth,
  showActionBar = true,
  tableProps,
  containerProps,
  isFiltered = false,
  onResetFilters = null,
  resetFiltersLabel = "Reset Filters",
}) {
  selection.defaultSelected = selection.defaultSelected || [];
  const [search] = useState("");
  const tableRef = useRef(null);
  const [stickyEndWidth, setStickyEndWidth] = useState(0);

  const [selectionData, setSelectionData] = useState(
    selection.defaultSelected || [],
  );
  const [selectedRowId, setSelectedRowId] = useState(null);

  console.log(
    "selection23239999",
    selectionData,
    selection.defaultSelected,
    selection,
  );

  useEffect(() => {
    if (selection.selectable) {
      setSelectionData(selection.defaultSelected);
    }
  }, [selection.defaultSelected, selection.selectable]);

  const getEncountersByRowId = (rows = [], ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) return [];

    const encounterIds = rows
      .filter((row) => ids.includes(row.id))
      .map((row) => row.encounter_id)
      .filter(Boolean); // removes undefined/null

    console.log("ENCOUNTERS", encounterIds);
    return encounterIds;
  };

  const isAllSelected = useMemo(() => {
    return (
      data?.length > 0 && data.every((row) => selectionData.includes(row.id))
    );
  }, [data, selectionData]);

  const claimMutation = useClaimSubmission();
  // Apply column settings filter
  const visibleColumns = useMemo(() => {
    if (!columnSettings || !columnSettings.columns) return columns;

    return columns.filter(
      (col) =>
        ["Action", "Status", "Output", "Document"].includes(col.title) ||
        columnSettings.columns?.find((i) => i.name === col.title)?.active,
    );
  }, [columns, columnSettings]);

  console.log("visibleColumns", visibleColumns, columnSettings);

  // Apply search across visible columns
  const filteredData = useMemo(() => {
    if (!search) return data;
    return data.filter((row) =>
      visibleColumns.some((col) => {
        const value = row[col.accessor_key];
        return (
          value && value.toString().toLowerCase().includes(search.toLowerCase())
        );
      }),
    );
  }, [search, data, visibleColumns]);

  console.log("sort1212", sort, sort.startsWith("-"));

  useEffect(() => {
    if (tableRef.current) {
      const stickyEnd = tableRef.current.querySelector('[data-sticky="end"]');
      if (stickyEnd) {
        setStickyEndWidth(stickyEnd.getBoundingClientRect().width);
      }
    }
  }, [visibleColumns, data]);

  const hasSelection = selectionData.length > 0;
  const canResetFilters = isFiltered && typeof onResetFilters === "function";

  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, count);

  return (
    <Box
      rounded={"2xl"}
      // h="full"
      pos={"relative"}
      display={"flex"}
      flexDirection={"column"}
      className="bg-droidal-black-300 shadow-md"
      {...containerProps}
    >
      {/* Header */}
      {(title || rightAction) && (
        <Box
          color="white"
          className="flex justify-between px-5 py-4 items-center"
        >
          {title && (
            <Text
              letterSpacing={"widest"}
              as="h3"
              fontSize={{
                base: "13px",
                "2xl": "15px",
                "3xl": "17px",
              }}
              fontWeight={"semibold"}
              className="!m-0"
            >
              {title}
            </Text>
          )}

          <div className="flex items-center gap-x-4">
            {rightAction && rightAction}
          </div>
        </Box>
      )}

      {(loader || headerLoading) && (
        <Box className="relative">
          <Skeleton
            height={"100%"}
            maxHeight={{
              base: "calc(100vh - 200px)",
              "2xl": "calc(100vh - 450px)",
              "3xl": "calc(100vh - 500px)",
            }}
            minHeight={{
              base: "calc(100vh - 200px)",
              "2xl": "calc(100vh - 450px)",
              "3xl": "calc(100vh - 500px)",
            }}
            className="dark"
            variant={"shine"}
          />

          <Center className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-full">
            <Loader color="#fff" size={"24px"} className="animate-spin" />
          </Center>

          <Skeleton height={"60px"} roundedBottom={"2xl"} className="dark" />
        </Box>
      )}

      {data?.length === 0 && !loader && !headerLoading && (
        <Center flex="1">
          <EmptyState.Root
            size={{
              base: "sm",
              "2xl": "md",
            }}
          >
            <EmptyState.Content>
              <EmptyState.Indicator>
                <FolderXIcon />
              </EmptyState.Indicator>
              <VStack textAlign="center">
                <EmptyState.Title letterSpacing={"wider"} color="white">
                  {emptyState.title || "No data found"}
                </EmptyState.Title>
                <EmptyState.Description color="gray.400">
                  {emptyState.description ||
                    "Explore our products and add items to your cart"}
                </EmptyState.Description>
                {canResetFilters && (
                  <Button
                    size="sm"
                    mt={2}
                    variant="outline"
                    color="white"
                    borderColor="whiteAlpha.400"
                    _hover={{ bg: "white", color: "black" }}
                    onClick={onResetFilters}
                  >
                    {resetFiltersLabel}
                  </Button>
                )}
              </VStack>
            </EmptyState.Content>
          </EmptyState.Root>
        </Center>
      )}

      {!loader && !headerLoading && data.length > 0 && (
        <>
          <ScrollArea.Root className="flex-1 min-h-0 w-full">
            {/* <ScrollArea.Viewport style={{ transform: "none" }}> */}
            <Table.ScrollArea
              height={bodyHeight}
              // maxHeight={{
              //   base: "calc(100vh - 200px)",
              //   "2xl": "calc(100vh - 450px)",
              //   "3xl": "calc(100vh - 500px)",
              // }}
              // minHeight={{
              //   base: "calc(100vh - 200px)",
              //   "2xl": "calc(100vh - 450px)",
              //   "3xl": "calc(100vh - 500px)",
              // }}
            >
              <Table.Root
                ref={tableRef}
                variant={"line"}
                stickyHeader
                css={{
                  "& th[data-sticky]": {
                    position: "sticky",
                    zIndex: "10 !important", // keep above normal cells
                    backgroundColor: "#212121", // give sticky column its own background
                  },
                  "& [data-sticky]": {
                    position: "sticky",
                    zIndex: 0, // keep above normal cells
                    backgroundColor: "#272727", // give sticky column its own background
                  },

                  "& [data-sticky=end0]": {
                    right: stickyEndWidth, // stick to right
                    boxShadow: "-4px 0 6px -2px rgba(0,0,0,0.3)", // subtle shadow on left
                  },
                  "& [data-sticky=end]": {
                    right: 0, // stick to right
                    boxShadow: "-4px 0 6px -2px rgba(0,0,0,0.3)", // subtle shadow on left
                  },

                  // "& [data-sticky='end']": {
                  //   position: "sticky",
                  //   right: 0, // stick to right side
                  //   zIndex: 1, // make sure they stay on top of other columns
                  //   backgroundColor: "#272727", // background color for sticky columns
                  //   boxShadow: "-4px 0 6px -2px rgba(0,0,0,0.3)", // subtle shadow for distinction
                  // },

                  "& [data-sticky=start]": {
                    left: 0, // stick to left
                    boxShadow: "4px 0 6px -2px rgba(0,0,0,0.3)", // subtle shadow on right
                  },
                }}
                border={"none"}
                size={
                  tableProps?.size || {
                    base: "sm",
                    "2xl": "md",
                    "3xl": "lg",
                  }
                }
              >
                <Table.Header>
                  <Table.Row bg="#212121">
                    {selection.selectable && (
                      <Table.ColumnHeader border="none" width={"50px"}>
                        <Center>
                          <Checkbox.Root
                            size={{
                              base: "sm",
                              "2xl": "md",
                              "3xl": "lg",
                            }}
                            aria-label="Select all rows"
                            onCheckedChange={(changes) => {
                              if (changes.checked) {
                                setSelectionData(["All"]);
                              } else {
                                setSelectionData([]);
                              }
                            }}
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
                          </Checkbox.Root>
                        </Center>
                      </Table.ColumnHeader>
                    )}
                    {visibleColumns.map((col) => (
                      <Table.ColumnHeader
                        letterSpacing={"wider"}
                        color={
                          sort?.includes(col.accessor_key) ? "#fff" : "#90a6c6"
                        }
                        key={col.accessor_key}
                        border="none"
                        {...(col.tableProps || {})}
                        cursor={"pointer"}
                        onClick={() => {
                          onSortClick(
                            sort?.startsWith("-")
                              ? col.accessor_key
                              : `-${col.accessor_key}`,
                          );
                        }}
                      >
                        <HStack>
                          {typeof col.title === "string" ? (
                            <Text letterSpacing={"widest"}>{col.title} </Text>
                          ) : (
                            col.title
                          )}
                          <div>
                            {sort?.includes(col.accessor_key) &&
                              !sort.startsWith("-") && (
                                <ChevronDown size={20} color="#008AB3" />
                              )}
                            {sort?.includes(col.accessor_key) &&
                              sort.startsWith("-") && (
                                <ChevronUp size={20} color="#008AB3" />
                              )}
                          </div>
                        </HStack>
                      </Table.ColumnHeader>
                    ))}
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredData.length > 0 ? (
                    filteredData.map((row, idx) => {
                      const isSelected =
                        selectedRow && selectedRow.id === row.id;
                      return (
                        <Table.Row
                          key={idx}
                          onClick={() => onRowClick && onRowClick(row)}
                          cursor={onRowClick ? "pointer" : undefined}
                        >
                          {selection.selectable && (
                            <Table.Cell
                              bg={isSelected ? "primary.700" : "#272727"}
                              borderColor="#000000"
                              borderBottomWidth={"2px !important"}
                              color={"#fff"}
                              width={"50px"}
                            >
                              <Center>
                                <Checkbox.Root
                                  size={{
                                    base: "sm",
                                    "2xl": "md",
                                    "3xl": "lg",
                                  }}
                                  aria-label="Select row"
                                  checked={selectionData.includes(row.id)}
                                  onCheckedChange={(changes) => {
                                    setSelectionData((prev) =>
                                      changes.checked
                                        ? [...prev, row.id]
                                        : selectionData.filter(
                                            (id) => id !== row.id,
                                          ),
                                    );
                                  }}
                                  {...selection.checkboxProps}
                                  disabled={
                                    selection.checkboxProps?.disabled
                                      ? selection.checkboxProps.disabled(row)
                                      : false
                                  }
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control
                                    _checked={{
                                      bgImage:
                                        "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                                    }}
                                    bgColor={"black"}
                                    borderColor="#2f4d78"
                                  />
                                </Checkbox.Root>
                              </Center>
                            </Table.Cell>
                          )}
                          {visibleColumns.map((col) => (
                            <Table.Cell
                              bg={isSelected ? "primary.700" : "#272727"}
                              borderColor="#000000"
                              borderBottomWidth={"2px !important"}
                              color={"#fff"}
                              key={col.accessor_key}
                              {...(col.tableProps || {})}
                            >
                              {col.render
                                ? col.render(row[col.accessor_key], row)
                                : row[col.accessor_key]}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={
                          visibleColumns.length + (selection.selectable ? 1 : 0)
                        }
                        className="text-center py-4"
                      >
                        <VStack gap={2}>
                          <Text color="gray.300">No data found</Text>
                          {canResetFilters && (
                            <Button
                              size="xs"
                              variant="outline"
                              color="white"
                              borderColor="whiteAlpha.400"
                              _hover={{ bg: "white", color: "black" }}
                              onClick={onResetFilters}
                            >
                              {resetFiltersLabel}
                            </Button>
                          )}
                        </VStack>
                      </td>
                    </tr>
                  )}
                </Table.Body>
              </Table.Root>
            </Table.ScrollArea>
            {/* </ScrollArea.Viewport> */}
            <ScrollArea.Scrollbar
              orientation="horizontal"
              className="flex select-none touch-none p-0.5 bg-black/20 w-2"
            >
              <ScrollArea.Thumb className="flex-1 bg-gray-500 rounded-full relative" />
            </ScrollArea.Scrollbar>
            <ScrollArea.Corner />
          </ScrollArea.Root>
          <div
            bgColor={"droidalBlack.300"}
            className="bg-droidal-black-300 w-full py-4 px-4 rounded-b-2xl flex justify-between items-center"
          >
            <HStack gap={4}>
              <Text
                letterSpacing={"widest"}
                fontSize={{
                  base: "sm",
                  "2xl": "md",
                  "3xl": "lg",
                }}
                className="text-sm text-white"
              >
                Showing {startIndex} - {endIndex} of {count}
              </Text>

              {showPageSize && (
                <HStack gap={2}>
                  <Text
                    letterSpacing={"widest"}
                    fontSize={{
                      base: "sm",
                      "2xl": "md",
                      "3xl": "lg",
                    }}
                    className="text-sm text-white"
                    whiteSpace="nowrap"
                  >
                    Show
                  </Text>
                  <Box width="100px">
                    <CustomSelect
                      value={[String(pageSize)]}
                      options={[
                        { label: "10", value: "10" },
                        { label: "25", value: "25" },
                        { label: "50", value: "50" },
                        { label: "75", value: "75" },
                        { label: "100", value: "100" },
                      ]}
                      onValueChange={(val) => onPageSizeChange(Number(val[0]))}
                    />
                  </Box>
                </HStack>
              )}
            </HStack>
            {pagination && (
              <HStack>
                <Text
                  letterSpacing={"widest"}
                  fontSize={{
                    base: "sm",
                    "2xl": "md",
                    "3xl": "lg",
                  }}
                  className="text-sm text-white"
                  color="#fff"
                >
                  {page} of {Math.ceil(count / pageSize)}
                </Text>

                <Pagination.Root
                  count={count}
                  pageSize={pageSize}
                  defaultPage={1}
                  onPageChange={() => {}}
                >
                  <ButtonGroup variant="ghost" size="sm">
                    <Button
                      className="hover:bg-white text-white hover:text-black"
                      border={"1px solid #fff"}
                      px={4}
                      borderColor="#fff"
                      color="#fff"
                      disabled={Number(page) === 1}
                      bg={"transparent"}
                      _hover={{ bg: "#fff", color: "#000" }}
                      _selected={{ border: "1px solid #fff", color: "#fff" }}
                      onClick={() => onPageChange(page - 1)}
                    >
                      Prev
                    </Button>

                    {console.log("page1212", page, Math.ceil(count / pageSize))}

                    <Button
                      page="next"
                      className="hover:bg-white text-white hover:text-black"
                      border={"1px solid #fff"}
                      px={4}
                      borderColor="#fff"
                      color="#fff"
                      disabled={Number(page) === Math.ceil(count / pageSize)}
                      bg={"transparent"}
                      _hover={{ bg: "#fff", color: "#000" }}
                      _selected={{ border: "1px solid #fff", color: "#fff" }}
                      onClick={() => onPageChange(Number(page) + 1)}
                    >
                      Next
                    </Button>
                  </ButtonGroup>
                </Pagination.Root>
              </HStack>
            )}
          </div>
        </>
      )}
      <ActionBar.Root open={hasSelection && showActionBar}>
        <Portal>
          <ActionBar.Positioner>
            <ActionBar.Content bgColor={"droidalBlack.300"}>
              <ActionBar.SelectionTrigger
                borderRadius={"12px"}
                color={"white"}
                borderColor={"white"}
              >
                {selectionData?.[0] === "All"
                  ? "All items selected"
                  : `${selectionData.length} selected`}{" "}
              </ActionBar.SelectionTrigger>
              <ActionBar.Separator />

              <ConfirmationDialog
                title="Confirmation"
                description="Are you sure you want to delete the selected items?"
                onConfirm={async () => {
                  if (selection.checkPermission()) {
                    const res = await selection.onConfirm(
                      selectionData?.[0] === "All" ? [] : selectionData,
                    );
                    if (res) {
                      setSelectionData([]);
                      return true;
                    }
                    return false;
                  }
                }}
                buttonName="Delete"
                buttonProps={{
                  leftIcon: <Trash2 color="white" size={16} />,
                  variant: "danger",
                }}
                // loading={}
              />

              {(title === "CLAIM SUBMISSION" || enableClaimSubmission) && (
                <>
                  <ActionBar.Separator />
                  <Button
                    color="white"
                    _hover={{ bgColor: "droidalBlack.200" }}
                    variant="outline"
                    size="sm"
                    borderRadius="12px"
                    leftIcon={<ArrowBigDownDash size={16} />}
                    isLoading={claimSubmission?.isLoading}
                    loadingText="Submitting..."
                    onClick={() => {
                      const row = getEncountersByRowId(data, selectionData);
                      if (!row) return; // safety guard
                      claimMutation.mutate(row, {
                        onSuccess: (res) => {
                          const responseData = res; // string or object

                          const text =
                            typeof responseData === "string"
                              ? responseData
                              : JSON.stringify(responseData, null, 2);

                          const blob = new Blob([text], {
                            type: "text/plain;charset=utf-8",
                          });
                          const url = URL.createObjectURL(blob);

                          const a = document.createElement("a");
                          a.href = url;
                          a.download = "response.txt";
                          a.click();

                          URL.revokeObjectURL(url);
                        },
                      });
                      const selectedRows = data.filter((row) =>
                        selectionData.includes(row.id),
                      );

                      const encountersToSubmit = selectedRows.map(
                        (row) => row.encounter || row,
                      );

                      claimSubmission.onSubmit(encountersToSubmit);
                    }}
                  >
                    Submit Claim{selectionData.length > 1 ? "s" : ""}
                  </Button>
                </>
              )}
              <ActionBar.Separator />

              <Button
                color="white"
                _hover={{
                  bgColor: "droidalBlack.200",
                }}
                variant="outline"
                size="sm"
                borderRadius={"12px"}
                onClick={() => setSelectionData([])}
              >
                <Undo2Icon />
                deselect
              </Button>
            </ActionBar.Content>
          </ActionBar.Positioner>
        </Portal>
      </ActionBar.Root>
    </Box>
  );
}

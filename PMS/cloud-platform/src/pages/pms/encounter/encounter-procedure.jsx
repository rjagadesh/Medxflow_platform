// ProcedureSection.jsx
"use client";

import React, {
  useRef,
  useMemo,
  useState,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Box,
  Text,
  HStack,
  Flex,
  Table,
  Input,
  Menu,
  Portal,
  Button,
  Checkbox,
  List,
  Spinner,
} from "@chakra-ui/react";
import { useCheckboxGroup } from "@chakra-ui/react";
import ProcedureConfirmDialog from "./procedure-confirm-dialog";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import CustomButton from "@/components/button/button";
import CustomSelect from "@/components/ui/select";
import CustomAmountInput from "@/components/input/amountInput";
import { toaster } from "@/components/ui/toaster";
import { Columns } from "lucide-react";
import { useFetchFeeSchedule } from "@/hooks/query/pms/encounter/useFetchFeeSchedule";
import { useDebounce } from "@/hooks/useDebounce";

const HighlightText = ({ text, highlight }) => {
  if (!highlight || !highlight.trim()) {
    return <span>{text}</span>;
  }
  const regex = new RegExp(`(${highlight})`, "gi");
  const parts = text.split(regex);
  return (
    <span>
      {parts.map((part, i) =>
        regex.test(part) ? (
          <span key={i} style={{ color: "#eb1000", fontWeight: "bold" }}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </span>
  );
};

const ProcedureSearchInput = ({
  value,
  onChange,
  onKeyDown,
  inputRef,
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState(value || "");
  const [isOpen, setIsOpen] = useState(false);
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const dropdownRef = useRef(null);

  const { data: responseData, isLoading } = useFetchFeeSchedule({
    search: debouncedSearchTerm,
    page_size: 20,
  });

  const options = useMemo(() => {
    const data = Array.isArray(responseData)
      ? responseData
      : responseData?.results;
    if (!data) return [];
    return data.map((item) => ({
      value: item.procedure_code,
      label: item.description
        ? `${item.procedure_code} - ${item.description}`
        : item.procedure_code,
      charge: item.par_amount || item.charge,
    }));
  }, [responseData]);

  useEffect(() => {
    setSearchTerm(value || "");
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    setSearchTerm(val);
    onChange(val);
    setIsOpen(true);
  };

  const handleSelect = (option) => {
    setSearchTerm(option.value);
    onChange(option.value, option.charge);
    setIsOpen(false);
  };

  return (
    <Box position="relative" w="full" ref={dropdownRef}>
      <HStack w="full" position="relative">
        <Input
          ref={inputRef}
          value={searchTerm}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Procedure..."
          autoComplete="off"
          _focus={{
            borderColor: "#00BBF2",
            boxShadow: "0 0 0 2px #00BBF2",
          }}
          {...props}
        />
        {isLoading && (
          <Box position="absolute" right="10px">
            <Spinner size="xs" color="#eb1000" />
          </Box>
        )}
      </HStack>

      {isOpen && (options.length > 0 || isLoading) && (
        <Portal>
          <Box
            position="fixed"
            top={`${
              dropdownRef.current?.getBoundingClientRect().bottom +
              window.scrollY
            }px`}
            left={`${
              dropdownRef.current?.getBoundingClientRect().left + window.scrollX
            }px`}
            width={`${dropdownRef.current?.offsetWidth}px`}
            bg="droidalBlack.600"
            border="1px solid #2f4d78"
            borderRadius="md"
            boxShadow="lg"
            zIndex={2000}
            maxH="250px"
            overflowY="auto"
          >
            {isLoading ? (
              <Box p={3} textAlign="center">
                <Spinner size="sm" color="#eb1000" />
              </Box>
            ) : options.length > 0 ? (
              <List.Root variant="none">
                {options.map((opt, idx) => (
                  <List.Item
                    key={idx}
                    px={3}
                    py={2}
                    cursor="pointer"
                    color="white"
                    fontSize="sm"
                    _hover={{ bg: "white", color: "black" }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSelect(opt);
                    }}
                  >
                    <HighlightText text={opt.label} highlight={searchTerm} />
                  </List.Item>
                ))}
              </List.Root>
            ) : (
              <Box p={3} color="gray.400" fontSize="sm">
                No procedures found. Press Tab to continue.
              </Box>
            )}
          </Box>
        </Portal>
      )}
    </Box>
  );
};

const ALL_COLUMNS = [
  {
    key: "from",
    title: "From",
    visible: true,
    inputType: "date",
    width: "170px",
  },
  { key: "to", title: "To", visible: true, inputType: "date", width: "170px" },
  {
    key: "procedure",
    title: "Procedure",
    visible: true,
    inputType: "text",
    width: "160px",
  },
  {
    key: "mod1",
    title: "Mod 1",
    visible: true,
    inputType: "text",
    width: "80px",
  },
  {
    key: "mod2",
    title: "Mod 2",
    visible: true,
    inputType: "text",
    width: "80px",
  },
  {
    key: "mod3",
    title: "Mod 3",
    visible: true,
    inputType: "text",
    width: "80px",
  },
  {
    key: "mod4",
    title: "Mod 4",
    visible: false,
    inputType: "text",
    width: "120px",
  },
  {
    key: "units",
    title: "Units",
    visible: true,
    inputType: "number",
    width: "80px",
    inputProps: { onwheel: (e) => e.target.blur() },
  },
  {
    key: "unitCharge",
    title: "Unit Charge",
    visible: true,
    inputType: "currencyEditable",
    width: "120px",
  },
  {
    key: "totalCharge",
    title: "Total Charge",
    visible: true,
    inputType: "currency",
    width: "120px",
  },
  {
    key: "diag1",
    title: "Diag 1",
    visible: true,
    inputType: "diag",
    width: "100px",
  },
  {
    key: "diag2",
    title: "Diag 2",
    visible: true,
    inputType: "diag",
    width: "100px",
  },
  {
    key: "diag3",
    title: "Diag 3",
    visible: true,
    inputType: "diag",
    width: "100px",
  },
  {
    key: "diag4",
    title: "Diag 4",
    visible: false,
    inputType: "diag",
    width: "100px",
  },
  {
    key: "applyPayment",
    title: "Apply Payment",
    visible: true,
    inputType: "currencyEditable",
    width: "140px",
  },
  {
    key: "concProc",
    title: "Concurrent Procedure",
    visible: false,
    inputType: "checkbox",
    width: "180px",
  },
  {
    key: "startTime",
    title: "Start Time",
    visible: false,
    inputType: "time",
    width: "120px",
  },
  {
    key: "endTime",
    title: "End Time",
    visible: false,
    inputType: "time",
    width: "120px",
  },
  {
    key: "minutes",
    title: "Minutes",
    visible: false,
    inputType: "number",
    width: "100px",
    inputProps: { onwheel: (e) => e.target.blur() },
  },
  {
    key: "tos",
    title: "TOS",
    visible: false,
    inputType: "select",
    width: "120px",
  },
  { key: "ndc", title: "NDC", visible: false, inputType: "text", width: "150px" },
  {
    key: "provider",
    title: "Provider",
    visible: false,
    inputType: "text",
    width: "180px",
  },
  {
    key: "refCode",
    title: "Ref. Code",
    visible: false,
    inputType: "text",
    width: "150px",
  },
  {
    key: "lineNote",
    title: "Line Note",
    visible: false,
    inputType: "text",
    width: "200px",
  },
];

const defaultVisibleKeys = ALL_COLUMNS.filter((col) => col.visible).map(
  (col) => col.key
);

const ProcedureSection = forwardRef(({ initialRows }, ref) => {
  const [rows, setRows] = useState(initialRows || []);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [stagedProcedures, setStagedProcedures] = useState([]);

  const { value: visibleKeys, toggleValue } = useCheckboxGroup({
    defaultValue: defaultVisibleKeys,
  });

  const visibleColumns = ALL_COLUMNS.filter((col) =>
    visibleKeys.includes(col.key)
  );
  const displayColumns = [
    { key: "select", title: "", width: "40px" },
    ...visibleColumns,
  ];
  const inputRefs = useRef([]);

  useEffect(() => {
    if (initialRows) {
      setRows(initialRows);
    }
  }, [initialRows]);

  const addNewRow = () => {
    setRows((prev) => [
      ...prev,
      {
        from: null,
        to: null,
        procedure: "",
        mod1: "",
        mod2: "",
        mod3: "",
        mod4: "",
        units: 0,
        unitCharge: "",
        totalCharge: 0,
        diag1: "",
        diag2: "",
        diag3: "",
        diag4: "",
        applyPayment: "",
        isVoided: false,
      },
    ]);
  };

  const handleNumberWheel = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const input = e.currentTarget;
    input.blur();

    requestAnimationFrame(() => {
      input.focus();
    });
  };

  const handleKeyDown = (e, rowIndex, colIndex) => {
    const isLastColumn = colIndex === displayColumns.length - 1;
    const isFirstColumn = colIndex === 0;

    if (e.key === "Tab" && !e.shiftKey && isLastColumn) {
      e.preventDefault();
      addNewRow();
    }

    if (
      (e.key === "Delete" || e.key === "Backspace") &&
      isFirstColumn &&
      rows.length > 1
    ) {
      e.preventDefault();
      setRows((prev) => prev.filter((_, i) => i !== rowIndex));
    }
  };

  const parseCurrency = (value) =>
    !value
      ? 0
      : parseFloat(value.toString().replace(/[^0-9.-]/g, "")) || 0;

  const updateRow = (rowIndex, key, value, charge = null) => {
    setRows((prev) =>
      prev.map((row, i) => {
        if (i !== rowIndex) return row;
        const updated = { ...row, [key]: value };

        if (key === "procedure" && charge !== null) {
          updated.unitCharge = charge;
        }

        if (
          key === "units" ||
          key === "unitCharge" ||
          (key === "procedure" && charge !== null)
        ) {
          const units = parseFloat(updated.units) || 0;
          const unitCharge = parseCurrency(updated.unitCharge);
          updated.totalCharge = (units * unitCharge).toFixed(2);
        }
        return updated;
      })
    );
  };

  const footerTotals = useMemo(() => {
    let totalUnits = 0;
    let grandTotalCharge = 0;
    let totalApplied = 0;

    rows.forEach((row) => {
      if (row.isVoided) return;
      totalUnits += parseFloat(row.units) || 0;
      grandTotalCharge += parseFloat(row.totalCharge) || 0;
      totalApplied += parseCurrency(row.applyPayment);
    });

    return {
      totalUnits: totalUnits.toFixed(2),
      grandTotalCharge: grandTotalCharge.toFixed(2),
      totalApplied: totalApplied.toFixed(2),
    };
  }, [rows]);

  const populateFromAutoFill = (cptCodes) => {
    if (!Array.isArray(cptCodes)) return;
    setStagedProcedures(cptCodes);
    setIsConfirmOpen(true);
  };

  const handleConfirmProcedures = (confirmedProcedures) => {
    const proceduresToAdd = Array.isArray(confirmedProcedures)
      ? confirmedProcedures
      : stagedProcedures;
    const newRows = proceduresToAdd.map((code) => {
      let diagCodes = [];
      if (Array.isArray(code.dignose_code)) {
        diagCodes = code.dignose_code;
      } else if (typeof code.dignose_code === "string") {
        diagCodes = [code.dignose_code];
      }

      return {
        from: code.from_date || null,
        to: code.to_date || null,
        procedure: code.cpt,
        mod1: code.modifier || "",
        mod2: "",
        mod3: "",
        mod4: "",
        units: 1,
        unitCharge: code.charge || "",
        totalCharge: (parseFloat(code.charge || 0) * 1).toFixed(2),
        diag1: diagCodes[0] || "",
        diag2: diagCodes[1] || "",
        diag3: diagCodes[2] || "",
        diag4: diagCodes[3] || "",
        applyPayment: "",
        isVoided: false,
      };
    });

    setRows(newRows);
    setIsConfirmOpen(false);
    setStagedProcedures([]);
    toaster.create({
      title: "Success",
      description: "Procedures added successfully",
      type: "success",
    });
  };

  const handleRemoveStagedProcedure = (index) => {
    setStagedProcedures((prev) => prev.filter((_, i) => i !== index));
  };

  useImperativeHandle(
    ref,
    () => ({
      getRows: () => rows,
      getTotals: () => footerTotals,
      populateFromAutoFill,
    }),
    [rows, footerTotals]
  );

  const renderInput = (col, rowIndex, colIndex) => {
    if (col.key === "select") {
      return (
        <Checkbox.Root
          checked={selectedRows.has(rowIndex)}
          onCheckedChange={({ checked }) => {
            setSelectedRows((prev) => {
              const next = new Set(prev);
              if (checked) next.add(rowIndex);
              else next.delete(rowIndex);
              return next;
            });
          }}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control
            border="1px solid #2f4d78"
            _checked={{ bg: "#00BBF2", borderColor: "#00BBF2" }}
          >
            <Checkbox.Indicator />
          </Checkbox.Control>
        </Checkbox.Root>
      );
    }

    const inputIndex = rowIndex * displayColumns.length + colIndex;
    const row = rows[rowIndex];

    const commonProps = {
      size: "md",
      variant: "filled",
      height: "35px",
      fontSize: "md",
      bg: "droidalBlack.200",
      border: "1px solid #2f4d78",
      _hover: { borderColor: "#00BBF2" },
      _focus: {
        borderColor: "#00BBF2",
        boxShadow: "0 0 0 2px #00BBF2",
        bg: "droidalBlack.100",
      },
      color: "white",
    };

    if (col.inputType === "date") {
      const minDate = col.key === "to" ? row["from"] : null;
      return (
        <CustomDatePicker
          value={row[col.key] || null}
          minDate={minDate ? new Date(minDate) : null}
          onValueChange={(date) => {
            const formatted = date.toISOString();
            if (col.key === "to" && row["from"]) {
              if (new Date(date) < new Date(row["from"])) {
                toaster.create({
                  title: "Invalid Date",
                  description: "To Date cannot be before From Date",
                  type: "error",
                });
                return;
              }
            }
            updateRow(rowIndex, col.key, formatted);
          }}
          inputProps={{
            ref: (el) => (inputRefs.current[inputIndex] = el),
            onKeyDown: (e) => handleKeyDown(e, rowIndex, colIndex),
          }}
          endElement={false}
        />
      );
    }

    if (col.key === "procedure") {
      return (
        <ProcedureSearchInput
          inputRef={(el) => (inputRefs.current[inputIndex] = el)}
          value={row.procedure ? row.procedure.split(" - ")[0] : ""}
          onChange={(val, charge) =>
            updateRow(rowIndex, "procedure", val, charge)
          }
          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
          {...commonProps}
        />
      );
    }

    switch (col.inputType) {
      case "number":
        return (
          <Input
            ref={(el) => (inputRefs.current[inputIndex] = el)}
            type="number"
            min="0"
            step="1"
            value={row[col.key] || ""}
            onChange={(e) => updateRow(rowIndex, col.key, e.target.value)}
            {...commonProps}
            {...(col.inputProps || {})}
            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
            onWheel={handleNumberWheel}
          />
        );

      case "currencyEditable":
        return (
          <CustomAmountInput
            ref={(el) => (inputRefs.current[inputIndex] = el)}
            value={row[col.key]}
            onChange={(e) => updateRow(rowIndex, col.key, e.target.value)}
            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
            leftAddon={null}
            {...commonProps}
          />
        );

      case "currency":
        return (
          <CustomAmountInput
            isReadOnly
            value={row.totalCharge}
            readOnly
            leftAddon={null}
            {...commonProps}
            bg="droidalBlack.300"
          />
        );

      case "diag":
      case "text":
        return (
          <Input
            ref={(el) => (inputRefs.current[inputIndex] = el)}
            value={row[col.key] || ""}
            onChange={(e) => {
              let val = e.target.value;
              if (/^(mod[1-4]|diag[1-4])$/.test(col.key)) {
                val = val.replace(/[^a-zA-Z0-9\.]/g, "");
              }
              updateRow(rowIndex, col.key, val);
            }}
            {...commonProps}
            onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
          />
        );

      default:
        return null;
    }
  };

  return (
    <Box>
      <ProcedureConfirmDialog
        open={isConfirmOpen}
        onClose={setIsConfirmOpen}
        procedures={stagedProcedures}
        onRemove={handleRemoveStagedProcedure}
        onConfirm={handleConfirmProcedures}
      />

      <Flex justify="space-between" mb={3} align="center">
        <HStack>
          <Text fontSize="xs" color="white">
            Mode:
          </Text>
          <CustomSelect
            value={["ICD-10"]}
            w="150px"
            options={[{ label: "ICD-10", value: "ICD-10" }]}
          />
        </HStack>

        <HStack>
          {selectedRows.size > 0 && (
            <Button
              size="sm"
              variant="outline"
              colorPalette="red"
              color="red.400"
              borderColor="red.400"
              _hover={{ bg: "red.900/20" }}
              onClick={() => {
                setRows((prev) =>
                  prev.map((r, i) =>
                    selectedRows.has(i) ? { ...r, isVoided: true } : r
                  )
                );
                setSelectedRows(new Set());
              }}
            >
              Move to Void
            </Button>
          )}

          <Menu.Root>
            <Menu.Trigger asChild>
              <CustomButton leftIcon={<Columns />}>Columns</CustomButton>
            </Menu.Trigger>
            <Portal>
              <Menu.Positioner>
                <Menu.Content
                  bg="droidalBlack.600"
                  borderColor="#2f4d78"
                  maxH="400px"
                  overflowY="auto"
                >
                  <Menu.ItemGroup>
                    <Menu.ItemGroupLabel color="white" fontSize="sm">
                      Visible Columns
                    </Menu.ItemGroupLabel>
                    {ALL_COLUMNS.map((col) => (
                      <Menu.CheckboxItem
                        key={col.key}
                        value={col.key}
                        checked={visibleKeys.includes(col.key)}
                        onCheckedChange={() => toggleValue(col.key)}
                        color="white"
                        fontSize="sm"
                      >
                        {col.title}
                        <Menu.ItemIndicator />
                      </Menu.CheckboxItem>
                    ))}
                  </Menu.ItemGroup>
                </Menu.Content>
              </Menu.Positioner>
            </Portal>
          </Menu.Root>
        </HStack>
      </Flex>

      <Box
        border="1px solid #2f4d78"
        borderRadius="md"
        overflow="hidden"
        h="300px"
        bg="droidalBlack.300"
      >
        <Box overflowX="auto" overflowY="auto" h="full">
          <Table.Root
            size="md"
            variant="simple"
            showColumnBorder
            stickyHeader
            h="100%"
            width="full"
          >
            <Table.Header
              bg="droidalBlack.400"
              position="sticky"
              top={0}
              zIndex={1}
            >
              <Table.Row>
                {displayColumns.map((col) => (
                  <Table.ColumnHeader
                    key={col.key}
                    color="white"
                    fontSize="sm"
                    fontWeight="medium"
                    textTransform="uppercase"
                    letterSpacing="wider"
                    py={3}
                    width={col.width || "150px"}
                    whiteSpace="nowrap"
                  >
                    {col.key === "select" ? (
                      <Checkbox.Root
                        checked={
                          rows.length > 0 && selectedRows.size === rows.length
                        }
                        onCheckedChange={({ checked }) => {
                          if (checked)
                            setSelectedRows(new Set(rows.map((_, i) => i)));
                          else setSelectedRows(new Set());
                        }}
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control
                          border="1px solid #2f4d78"
                          _checked={{ bg: "#00BBF2", borderColor: "#00BBF2" }}
                        >
                          <Checkbox.Indicator />
                        </Checkbox.Control>
                      </Checkbox.Root>
                    ) : (
                      col.title
                    )}
                  </Table.ColumnHeader>
                ))}
              </Table.Row>
            </Table.Header>

            <Table.Body>
              {rows.map((row, rowIndex) => (
                <Table.Row
                  key={rowIndex}
                  _hover={{ bg: "gray.700" }}
                  bg={row.isVoided ? "red.900" : "transparent"}
                  opacity={row.isVoided ? 0.7 : 1}
                >
                  {displayColumns.map((col, colIndex) => (
                    <Table.Cell
                      key={col.key}
                      p={2}
                      width={col.width || "150px"}
                      whiteSpace="nowrap"
                    >
                      {renderInput(col, rowIndex, colIndex)}
                    </Table.Cell>
                  ))}
                </Table.Row>
              ))}
              <Table.Row
                height="100%"
                bg="transparent"
                _hover={{ bg: "transparent" }}
              >
                <Table.Cell colSpan={displayColumns.length} border="none" p={0} />
              </Table.Row>
            </Table.Body>

            <Box
              as="tfoot"
              position="sticky"
              bottom={0}
              zIndex={1}
              bg="droidalBlack.300"
            >
              <Table.Row>
                {displayColumns.map((col) => {
                  let content = null;
                  if (col.key === "from") {
                    content = `Total: ${rows.length} row${
                      rows.length > 1 ? "s" : ""
                    }`;
                  } else if (col.key === "totalCharge") {
                    content = (
                      <CustomAmountInput
                        value={footerTotals.grandTotalCharge}
                        readOnly
                        isReadOnly
                        leftAddon={null}
                        size="md"
                        variant="filled"
                        height="35px"
                        fontSize="md"
                        bg="droidalBlack.300"
                        border="1px solid #2f4d78"
                        color="white"
                        _hover={{ borderColor: "#00BBF2" }}
                        _focus={{
                          borderColor: "#00BBF2",
                          boxShadow: "0 0 0 2px #00BBF2",
                          bg: "droidalBlack.100",
                        }}
                      />
                    );
                  } else if (col.key === "applyPayment") {
                    content = (
                      <CustomAmountInput
                        value={footerTotals.totalApplied}
                        readOnly
                        isReadOnly
                        leftAddon={null}
                        size="md"
                        variant="filled"
                        height="35px"
                        fontSize="md"
                        bg="droidalBlack.300"
                        border="1px solid #2f4d78"
                        color="white"
                        _hover={{ borderColor: "#00BBF2" }}
                        _focus={{
                          borderColor: "#00BBF2",
                          boxShadow: "0 0 0 2px #00BBF2",
                          bg: "droidalBlack.100",
                        }}
                      />
                    );
                  }

                  return (
                    <Table.Cell
                      key={col.key}
                      p={2}
                      width={col.width || "150px"}
                      whiteSpace="nowrap"
                      color="white"
                      fontWeight={col.key === "totalCharge" ? "bold" : "medium"}
                      textAlign="start"
                      borderTop="1px solid #2f4d78"
                    >
                      {content}
                    </Table.Cell>
                  );
                })}
              </Table.Row>
            </Box>
          </Table.Root>
        </Box>
      </Box>
    </Box>
  );
});

export default ProcedureSection;

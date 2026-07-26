import React, { useState } from "react";
import {
  Box,
  Grid,
  Heading,
  Text,
  Image,
  Stack,
  Input,
  NativeSelect,
  Table,
  Span,
  Accordion,
} from "@chakra-ui/react";
import { Plus, Trash2 } from "lucide-react";

const ChargesSettings = () => {
  const [diagnosisRows, setDiagnosisRows] = useState([{ id: 1 }]);
  const [procedureRows, setProcedureRows] = useState([{ id: 1, dx: 1 }]);

  const addDiagnosisRow = () => {
    if (diagnosisRows.length < 12) {
      setDiagnosisRows([...diagnosisRows, { id: Date.now() }]);
    }
  };

  const deleteDiagnosisRow = (id) => {
    setDiagnosisRows(diagnosisRows.filter((row) => row.id !== id));
  };

  const addProcedureRow = () => {
    const newDx = procedureRows.length + 1;
    setProcedureRows([...procedureRows, { id: Date.now(), dx: newDx }]);
  };

  const deleteProcedureRow = (id) => {
    setProcedureRows(procedureRows.filter((row) => row.id !== id));
  };

  const handleNumericChange = (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, '');
  };

  const items = [
    {
      value: "patient",
      title: "Patient Information",
      content: (
        <Box pb={4} bg="#2A2929" borderRadius="md" px={4}>
          <Grid templateColumns="repeat(4, 1fr)" gap={6}>
            {/* Profile Picture */}
            <Box textAlign="center">
              <Image
                src="https://rosboro.com/wp-content/uploads/2017/09/PersonPlaceholder.png"
                alt="Patient Profile"
                w="80px"
                h="80px"
                borderRadius="full"
                objectFit="cover"
                mx="auto"
                border="1px solid #575B67"
              />
            </Box>
            {/* Patient Details */}
            <Stack spacing={3}>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Patient Name
                </Text>
                <Input
                  placeholder="Enter patient name"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Date of Birth
                </Text>
                <Input
                  type="date"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Gender
                </Text>
                <NativeSelect.Root
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                >
                  <NativeSelect.Field>
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Box>
            </Stack>
            {/* Insurance Details */}
            <Stack spacing={3}>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Insurance Case
                </Text>
                <Input
                  placeholder="Enter insurance case"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Primary
                </Text>
                <Input
                  placeholder="Enter primary"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Secondary
                </Text>
                <Input
                  placeholder="Enter secondary"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
            </Stack>
            {/* Additional Patient Details */}
            <Stack spacing={3}>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Billing NPI
                </Text>
                <Input
                  placeholder="Enter billing NPI"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Medical Record Number
                </Text>
                <Input
                  placeholder="Enter medical record number"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Patient ID
                </Text>
                <Input
                  placeholder="Enter patient ID"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
            </Stack>
          </Grid>
        </Box>
      ),
    },
    {
      value: "visit",
      title: "Visit & Provider Information",
      content: (
        <Box pb={4} bg="#2A2929" borderRadius="md" px={4}>
          <Grid templateColumns="repeat(2, 1fr)" gap={6}>
            {/* Visit Details */}
            <Stack spacing={3}>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Date of Service
                </Text>
                <Input
                  type="date"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Service Location
                </Text>
                <Input
                  placeholder="Enter service location"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Place of Service
                </Text>
                <Input
                  placeholder="Enter place of service"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Visit Mode
                </Text>
                <NativeSelect.Root
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                >
                  <NativeSelect.Field>
                    <option value="">Select visit mode</option>
                    <option value="in-person">In-Person</option>
                    <option value="telehealth">Telehealth</option>
                  </NativeSelect.Field>
                  <NativeSelect.Indicator />
                </NativeSelect.Root>
              </Box>
            </Stack>
            {/* Provider Details */}
            <Stack spacing={3}>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Rendering Provider
                </Text>
                <Input
                  placeholder="Enter rendering provider"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Scheduling Provider
                </Text>
                <Input
                  placeholder="Enter scheduling provider"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Referring Provider
                </Text>
                <Input
                  placeholder="Enter referring provider"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
              <Box>
                <Text
                  fontWeight="300"
                  color="white"
                  fontSize="14px"
                  mb={1}
                  letterSpacing="1px"
                >
                  Supervising Provider
                </Text>
                <Input
                  placeholder="Enter supervising provider"
                  fontSize="14px"
                  letterSpacing="1px"
                  color="white"
                  borderColor="#575B67"
                  _placeholder={{ color: "#9ca3af" }}
                />
              </Box>
            </Stack>
          </Grid>
        </Box>
      ),
    },
    {
      value: "diagnosis",
      title: "Diagnosis Codes (Max 12)",
      content: (
        <Box pb={4} bg="#2A2929" borderRadius="md" px={4}>
          <Table.Root variant="simple" colorScheme="whiteAlpha">
            <Table.Header bg="#353434">
              <Table.Row>
                <Table.ColumnHeader
                  color="white"
                  fontSize="14px"
                  letterSpacing="1px"
                >
                  Rank
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="white"
                  fontSize="14px"
                  letterSpacing="1px"
                >
                  From Date
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="white"
                  fontSize="14px"
                  letterSpacing="1px"
                >
                  To Date
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="white"
                  fontSize="14px"
                  letterSpacing="1px"
                >
                  Diagnosis Code
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="white"
                  fontSize="14px"
                  letterSpacing="1px"
                >
                  Charge Amount
                </Table.ColumnHeader>
                <Table.ColumnHeader
                  color="white"
                  fontSize="14px"
                  letterSpacing="1px"
                >
                  Actions
                </Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {diagnosisRows.map((row, index) => (
                <Table.Row
                  key={row.id}
                  bg={index % 2 === 0 ? "transparent" : "rgba(255,255,255,0.05)"}
                >
                  <Table.Cell color="white" fontSize="14px">
                    {index + 1}
                  </Table.Cell>
                  <Table.Cell>
                    <Input
                      type="date"
                      placeholder="From Date"
                      fontSize="14px"
                      letterSpacing="1px"
                      color="white"
                      borderColor="#575B67"
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Input
                      type="date"
                      placeholder="To Date"
                      fontSize="14px"
                      letterSpacing="1px"
                      color="white"
                      borderColor="#575B67"
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Input
                      placeholder={`Enter diagnosis code ${index + 1}`}
                      fontSize="14px"
                      letterSpacing="1px"
                      color="white"
                      borderColor="#575B67"
                      _placeholder={{ color: "#9ca3af" }}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <Input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      placeholder="Charge Amount"
                      fontSize="14px"
                      letterSpacing="1px"
                      color="white"
                      borderColor="#575B67"
                      onChange={handleNumericChange}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <button
                      onClick={() => deleteDiagnosisRow(row.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500 text-white rounded-md border border-red-600 transition-colors focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor =
                          "rgba(239, 68, 68, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "#dc2626";
                      }}
                      aria-label="Delete row"
                    >
                      <Trash2 size={14} />
                    </button>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
          <Box mt={4} textAlign="right">
            <button
              onClick={addDiagnosisRow}
              disabled={diagnosisRows.length >= 12}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 text-white rounded-md border border-gray-600 transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              onMouseEnter={(e) => {
                if (diagnosisRows.length < 12) {
                  e.currentTarget.style.backgroundColor =
                    "rgba(255, 255, 255, 0.05)";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#374151";
              }}
              aria-label="Add diagnosis"
            >
              <Plus size={14} />
              Add Diagnosis
            </button>
          </Box>
        </Box>
      ),
    },
    {
      value: "procedure",
      title: "Procedure Codes",
      content: (
        <Box pb={4} bg="#2A2929" borderRadius="md" px={4}>
          <Box overflowX="auto">
            <Table.Root variant="simple" colorScheme="whiteAlpha">
              <Table.Header bg="#353434">
                <Table.Row>
                  <Table.ColumnHeader
                    color="white"
                    fontSize="14px"
                    letterSpacing="1px"
                    whiteSpace="nowrap"
                  >
                    Procedure Code
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    color="white"
                    fontSize="14px"
                    letterSpacing="1px"
                  >
                    Mod 1
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    color="white"
                    fontSize="14px"
                    letterSpacing="1px"
                  >
                    Mod 2
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    color="white"
                    fontSize="14px"
                    letterSpacing="1px"
                  >
                    Mod 3
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    color="white"
                    fontSize="14px"
                    letterSpacing="1px"
                  >
                    Mod 4
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    color="white"
                    fontSize="14px"
                    letterSpacing="1px"
                  >
                    Units
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    color="white"
                    fontSize="14px"
                    letterSpacing="1px"
                  >
                    Charge
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    color="white"
                    fontSize="14px"
                    letterSpacing="1px"
                  >
                    Total
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    color="white"
                    fontSize="14px"
                    letterSpacing="1px"
                  >
                    Diagnosis
                  </Table.ColumnHeader>
                  <Table.ColumnHeader
                    color="white"
                    fontSize="14px"
                    letterSpacing="1px"
                  >
                    Actions
                  </Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {procedureRows.map((row, index) => (
                  <Table.Row key={row.id} bg="rgba(255,255,255,0.05)">
                    <Table.Cell>
                      <Input
                        placeholder="Enter procedure code"
                        fontSize="12px"
                        color="white"
                        borderColor="#575B67"
                        minW="150px"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Input
                        placeholder="Mod 1"
                        fontSize="12px"
                        color="white"
                        borderColor="#575B67"
                        minW="80px"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Input
                        placeholder="Mod 2"
                        fontSize="12px"
                        color="white"
                        borderColor="#575B67"
                        minW="80px"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Input
                        placeholder="Mod 3"
                        fontSize="12px"
                        color="white"
                        borderColor="#575B67"
                        minW="80px"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Input
                        placeholder="Mod 4"
                        fontSize="12px"
                        color="white"
                        borderColor="#575B67"
                        minW="80px"
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Units"
                        fontSize="12px"
                        color="white"
                        borderColor="#575B67"
                        minW="80px"
                        onChange={handleNumericChange}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Charge"
                        fontSize="12px"
                        color="white"
                        borderColor="#575B67"
                        minW="100px"
                        onChange={handleNumericChange}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <Input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        placeholder="Total"
                        fontSize="12px"
                        color="white"
                        borderColor="#575B67"
                        minW="100px"
                        onChange={handleNumericChange}
                      />
                    </Table.Cell>
                    <Table.Cell>
                      <NativeSelect.Root
                        fontSize="12px"
                        color="white"
                        borderColor="#575B67"
                        minW="90px"
                      >
                        <NativeSelect.Field defaultValue={row.dx?.toString() || ""}>
                          <option value="">Select Dx</option>
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={(i + 1).toString()}>
                              Dx {i + 1}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                    </Table.Cell>
                    <Table.Cell>
                      <button
                        onClick={() => deleteProcedureRow(row.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-500 text-white rounded-md border border-red-600 transition-colors focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor =
                            "rgba(239, 68, 68, 0.1)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = "#dc2626";
                        }}
                        aria-label="Delete row"
                      >
                        <Trash2 size={14} />
                      </button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Box>
          <Box mt={4} textAlign="right">
            <button
              onClick={addProcedureRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 text-white rounded-md border border-gray-600 transition-colors focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(255, 255, 255, 0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#374151";
              }}
              aria-label="Add procedure"
            >
              <Plus size={14} />
              Add Procedure
            </button>
          </Box>
        </Box>
      ),
    },
  ];

  return (
    <Box
      maxW="full"
      mx="auto"
      p={8}
      bg="#0d2b52"
      borderRadius="lg"
      boxShadow="lg"
      minH="100vh"
    >
      <Heading
        textAlign="start"
        color="white"
        mb={8}
        fontSize="20px"
        fontWeight="500"
        letterSpacing="1px"
      >
        Charges Settings
      </Heading>
      <Accordion.Root multiple defaultValue={["patient"]}>
        {items.map((item, index) => (
          <Accordion.Item
            borderBottomColor={"droidalGray.300"}
            key={index}
            value={item.value}
          >
            <Accordion.ItemTrigger
              bg="#2A2929"
              color="white"
              _hover={{ bg: "#353434" }}
              px={4}
              py={3}
              borderRadius="md"
              fontSize="14px"
              letterSpacing="1px"
            >
              <Span flex="1" textAlign="left" fontWeight="300">
                {item.title}
              </Span>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>{item.content}</Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Item>
        ))}
      </Accordion.Root>
    </Box>
  );
};

export default ChargesSettings;
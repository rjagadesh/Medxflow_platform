import { Box, Table, Text } from "@chakra-ui/react";

export default function ClaimTransactionsSteps({ claim }) {
  let transactions = claim?.transactions || [];
  transactions = [
    {
      date: "2025-12-18",
      status: "Created",
      description: "Service line created from encounter #6940 with ICD-10",
      amount: 1440.0,
      patient_responsibility: 0.0,
      balance: 1440.0,
    },
  ];

  return (
    <Box
      bg="#1c1c1c"
      borderRadius="sm"
      minW="70vw"
      maxW="70vw"
      minH="43vh"
      maxH="43vh"
      overflow="auto" // 👈 scroll lives HERE
    >
      <Table.Root size="sm" bg="#1c1c1c" w="100%">
        {/* Optional header – remove if not needed */}
        <Table.Header>
          <Table.Row bg="#1c1c1c" borderBottom="1px solid #2a2a2a">
            <Table.ColumnHeader
              color="#9ca3af"
              style={{ fontSize: "20px" }}
              p={"15px"}
            >
              Date
            </Table.ColumnHeader>

            <Table.ColumnHeader color="#9ca3af" style={{ fontSize: "20px" }}>
              Status
            </Table.ColumnHeader>
            <Table.ColumnHeader color="#9ca3af" style={{ fontSize: "20px" }}>
              Description
            </Table.ColumnHeader>
            <Table.ColumnHeader
              color="#9ca3af"
              textAlign="end"
              style={{ fontSize: "20px" }}
            >
              Transaction
            </Table.ColumnHeader>

            <Table.ColumnHeader
              color="#9ca3af"
              textAlign="end"
              style={{ fontSize: "20px" }}
            >
              Pat Res
            </Table.ColumnHeader>
            <Table.ColumnHeader
              color="#9ca3af"
              textAlign="end"
              style={{ fontSize: "20px" }}
            >
              Total Balance
            </Table.ColumnHeader>
          </Table.Row>
        </Table.Header>

        <Table.Body>
          {transactions.map((tx, idx) => (
            <Table.Row
              key={idx}
              bg="#242424" // 👈 uniform row color
              borderBottom="1px solid #1f1f1f"
              _hover={{ bg: "#333333" }} // 👈 hover only
              transition="background 0.15s ease"
              cursor="pointer"
            >
              <Table.Cell color="#ffffff">{tx.date}</Table.Cell>

              <Table.Cell>
                <Text fontSize="13px" fontWeight="500" color="#ffffff">
                  {tx.status || "Unknown"}
                </Text>
              </Table.Cell>

              <Table.Cell color="#e5e7eb">
                {tx.description || "Unknown"}
              </Table.Cell>

              <Table.Cell textAlign="end" color="#ffffff">
                ${Number(tx.amount || 0).toFixed(2)}
              </Table.Cell>

              <Table.Cell textAlign="end" color="#ffffff">
                ${Number(tx.patient_responsibility || 0).toFixed(2)}
              </Table.Cell>

              <Table.Cell textAlign="end" color="#ffffff">
                ${Number(tx.balance || 0).toFixed(2)}
              </Table.Cell>
            </Table.Row>
          ))}
        </Table.Body>
      </Table.Root>
    </Box>
  );
}

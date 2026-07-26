// src/pages/InsuranceCollections.jsx

import { Flex, Box } from "@chakra-ui/react";
import { useState, useMemo } from "react";

import InsuranceCollectionsSidebar from "./InsuranceCollectionsSidebar";
import ListLayout from "./Components/ListLayout";

const MOCK_ROWS = [
  {
    id: "6689Z100613",
    date: "11/12/2025",
    patient: "JEFFERSON, JOHN",
    provider: "VELLAICHAMY, MUTHUKUMAR, M.D.",
    amount: "$1,200.00",
    procedures: 1,
    payer: "Blue Cross and Blue Shield of Kansas",
    status: "NEEDS_INVESTIGATION",
  },
  {
    id: "6688Z100613",
    date: "11/10/2025",
    patient: "Maples, Hubert",
    provider: "HERRIGES, MICHAEL, ARNP-C",
    amount: "$75.00",
    procedures: 1,
    payer: "Blue Cross and Blue Shield of Kansas",
    status: "WAITING",
  },
  {
    id: "6657Z100613",
    date: "11/10/2025",
    patient: "Maples, Hubert",
    provider: "HERRIGES, MICHAEL, ARNP-C",
    amount: "$220.00",
    procedures: 1,
    payer: "Blue Cross and Blue Shield of Kansas",
    status: "DENIED",
  },
  {
    id: "6653Z100613",
    date: "11/08/2025",
    patient: "Hubbard, Brenyn",
    provider: "VELLAICHAMY, MUTHUKUMAR, M.D.",
    amount: "$150.00",
    procedures: 1,
    payer: "United Healthcare Community Plan - KS",
    status: "REJECTED",
  },
];

export default function InsuranceCollections() {
  const [status, setStatus] = useState("ALL");

  // controlled filters for ListLayout
  const [filters, setFilters] = useState({
    provider: "ALL",
    location: "ALL",
    since: "ALL",
    search: "",
  });

  const columns = [
    { accessor_key: "date", title: "Date" },
    { accessor_key: "patient", title: "Patient" },
    { accessor_key: "amount", title: "Amount" },
    { accessor_key: "procedures", title: "Procedures" },
    { accessor_key: "payer", title: "Payer" },
  ];

  const fetchData = ({ filters }) => {
    return MOCK_ROWS.filter((row) => {
      if (status !== "ALL" && row.status !== status) return false;
      if (filters.search) {
        const q = filters.search.toLowerCase();
        const text =
          `${row.patient} ${row.payer} ${row.provider} ${row.id}`.toLowerCase();
        if (!text.includes(q)) return false;
      }
      return true;
    });
  };

  const filterDefs = [{ key: "search", label: "Search…" }];

  const filteredData = fetchData({ filters });

  return (
    <Flex direction="column" w="100%" h="100%">
      {/* TOP BUCKET BAR */}
      <Box w="100%">
        <InsuranceCollectionsSidebar
          selected={status}
          setSelected={setStatus}
        />
      </Box>

      {/* MAIN CONTENT */}
      <Box flex="1" p={6} minW={0}>
        <ListLayout
          title="INSURANCE COLLECTIONS"
          data={filteredData}
          columns={columns}
          filters={filterDefs}
          controlledFilters={filters}
          onFiltersChange={setFilters}
        />
      </Box>
    </Flex>
  );
}

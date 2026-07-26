// src/pages/PatientCollections.jsx

import { Flex, Box, VStack } from "@chakra-ui/react";
import { useState } from "react";

import PatientCollectionSidebar from "./PatientCollectionSidebar";
import ListLayout from "./Components/ListLayout";

export default function PatientCollections() {
  const [bucket, setBucket] = useState("ALL");

  // Controlled filters just like Insurance Collections
  const [filters, setFilters] = useState({
    name: "",
    dos: "",
  });

  const columns = [
    { accessor_key: "dos", title: "DoS" },
    { accessor_key: "name", title: "Patient" },
    { accessor_key: "balance", title: "Balance" },
    { accessor_key: "unapplied", title: "Unapplied" },
    { accessor_key: "procedures", title: "Procedures" },
  ];

  // Filter bar definitions (shown above table)
  const filterDefs = [
    { key: "name", label: "Search Name" },
    { key: "dos", label: "Date of Service" },
  ];

  // --------------------------------------------------------
  // FETCH DATA WITH ALL FILTER LOGIC APPLIED
  // --------------------------------------------------------
  const fetchData = ({ filters }) => {
    const data = [
      {
        dos: "10/29/2025",
        name: "ALBADAWI, MAHMOUD",
        balance: "$75.00",
        unapplied: "$0.00",
        procedures: 1,
        statements: 0,
      },
      {
        dos: "06/06/2025",
        name: "ARGABRIGHT, HADLEY",
        balance: "$85.42",
        unapplied: "$0.00",
        procedures: 1,
        statements: 3,
      },
      {
        dos: "02/14/2025",
        name: "JOHNSON, EMILY",
        balance: "$120.00",
        unapplied: "$0.00",
        procedures: 2,
        statements: 1,
      },
      {
        dos: "01/10/2025",
        name: "SMITH, DAVID",
        balance: "$45.25",
        unapplied: "$10.00",
        procedures: 1,
        statements: 2,
      },
      {
        dos: "09/09/2025",
        name: "BROWN, WILLIAM",
        balance: "$99.00",
        unapplied: "$0.00",
        procedures: 1,
        statements: 0,
      },
      {
        dos: "05/21/2025",
        name: "TAYLOR, OLIVIA",
        balance: "$180.00",
        unapplied: "$0.00",
        procedures: 3,
        statements: 3,
      },
      {
        dos: "03/03/2025",
        name: "MARTINEZ, ALEX",
        balance: "$62.50",
        unapplied: "$5.00",
        procedures: 1,
        statements: 1,
      },
      {
        dos: "07/17/2025",
        name: "HENDERSON, LUCAS",
        balance: "$150.00",
        unapplied: "$0.00",
        procedures: 2,
        statements: 2,
      },
      {
        dos: "04/11/2025",
        name: "CARTER, SOPHIA",
        balance: "$210.00",
        unapplied: "$0.00",
        procedures: 4,
        statements: 0,
      },
      {
        dos: "08/29/2025",
        name: "JAMES, MICHAEL",
        balance: "$320.00",
        unapplied: "$20.00",
        procedures: 3,
        statements: 3,
      },
    ];

    let result = [...data];

    // -------------------------
    // 1️⃣ BUCKET FILTER (sidebar)
    // -------------------------
    if (bucket === "3+") {
      result = result.filter((r) => r.statements >= 3);
    } else if (bucket !== "ALL") {
      result = result.filter((r) => r.statements == Number(bucket));
    }

    // -------------------------
    // 2️⃣ TEXT FILTERS (search fields)
    // -------------------------
    if (filters.name) {
      const q = filters.name.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }

    if (filters.dos) {
      const q = filters.dos.toLowerCase();
      result = result.filter((r) => r.dos.toLowerCase().includes(q));
    }

    return result;
  };
  const filteredData = fetchData({ filters });

  return (
    <Flex direction="column" w="100%" h="100%">
      {/* TOP BUCKET BAR */}
      <Box w="100%">
        <PatientCollectionSidebar selected={bucket} setSelected={setBucket} />
      </Box>

      {/* MAIN CONTENT */}
      <Box flex="1" p={6} minW={0}>
        <ListLayout
          title="PATIENT COLLECTIONS"
          data={filteredData}
          columns={columns}
          profile={[]}
          filters={filterDefs}
          controlledFilters={filters}
          onFiltersChange={setFilters}
        />
      </Box>
    </Flex>
  );
}

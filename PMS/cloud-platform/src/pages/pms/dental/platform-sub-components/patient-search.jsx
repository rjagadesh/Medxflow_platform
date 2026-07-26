import { useState, useMemo, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Box, HStack, Text } from "@chakra-ui/react";
import GenericTable from "@/components/table/table";

import { useGetPatients } from "@/hooks/query/pms/pms_appointments/useGetPatients";
import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs";
import ProfilePreviewCard from "../../list-view/Components/ProfilePreviewCard";
import { useDebounce } from "@/hooks/useDebounce";

const PatientSearch = ({ onSelect }) => {
  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsString.withDefault("1"),
    page_size: parseAsString.withDefault("10"),
    search: parseAsString,
    name: parseAsString,
    address: parseAsString,
    dob: parseAsString,
    ssn: parseAsString,
    home_phone: parseAsString,
    mobile_phone: parseAsString,
    mrn: parseAsString,
    emergency_name: parseAsString,
  });

  // Determine initial search mode based on active query params
  const getInitialMode = () => {
    const keys = ['name', 'address', 'dob', 'ssn', 'home_phone', 'mobile_phone', 'mrn', 'emergency_name'];
    const found = keys.find(k => queryParams[k]);
    return found || 'all';
  };

  const [searchIn, setSearchIn] = useState(getInitialMode);
  // Initial search term is the value of the active param
  const [searchTerm, setSearchTerm] = useState(() => {
    const mode = getInitialMode();
    return queryParams[mode === 'all' ? 'search' : mode] || "";
  });

  const [selectedPatient, setSelectedPatient] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data: responseData = {},
    isLoading,
    isPlaceholderData,
  } = useGetPatients(queryParams);
  const patientsData = responseData?.results || [];
  const totalCount = responseData?.count || 0;

  const columns = [
    { title: "ID", accessor_key: "id", tableProps:{width:'100px'} },
    { title: "Name", accessor_key: "name", tableProps:{width:'200px'} },
    { title: "Address", accessor_key: "address", tableProps:{width:'200px'} },
    { title: "DOB", accessor_key: "dob" },
    { title: "SSN", accessor_key: "ssn", tableProps:{width:'200px'} },
    { title: "Home Phone", accessor_key: "home_phone" },
    { title: "Mobile Number", accessor_key: "mobile_phone" },
    { title: "Medical Record #", accessor_key: "medical_record_number" },
    { title: "Guarantor", accessor_key: "guarantor" },
    {
      title: "Action",
      accessor_key: "action",
      tableProps: { "data-sticky": "end" },
      render: (_, row) => (
        <HStack spacing={2}>
          <button
            onClick={() => {
              setSelectedPatient(row.original);
              if (onSelect) onSelect(row.original);
            }}
            className="px-4 py-2 bg-[#1e4270] hover:bg-[#424141] text-white rounded-lg text-sm transition-colors border border-[#424141]"
          >
            Select
          </button>
          <button
            onClick={() => setSelectedPatient(row.original)}
            className="px-3 py-2 bg-[#00afef88] hover:bg-[#00afefbb] text-white rounded-lg text-sm transition-colors"
          >
            Preview
          </button>
        </HStack>
      ),
    },
  ];

  const data = useMemo(() => {
    return patientsData.map((patient) => ({
      id: patient.id,
      name: `${patient.first_name || ""} ${patient.last_name || ""}`.trim(),
      address: patient.address || "",
      dob: patient.dob ? new Date(patient.dob).toLocaleDateString() : "",
      ssn: patient.ssn || "",
      home_phone: patient.home_phone || "",
      mobile_phone: patient.mobile_phone || "",
      medical_record_number: patient.medical_record_number || "",
      guarantor: patient.guarantor || "",
      original: patient,
    }));
  }, [patientsData]);

  // Sync searchTerm with URL when searchIn mode changes (one-way sync for UX)
  // When user switches dropdown, we populate input with that param's current value
  useEffect(() => {
    const key = searchIn === 'all' ? 'search' : searchIn;
    setSearchTerm(queryParams[key] || "");
  }, [searchIn]); 
  // We do NOT depend on queryParams here to avoid loop/conflict while typing.
  // The input drives the URL, not vice-versa, except on mode switch.

  const filterKeys = useMemo(
    () => [
      "search",
      "name",
      "address",
      "dob",
      "ssn",
      "home_phone",
      "mobile_phone",
      "mrn",
      "emergency_name",
    ],
    []
  );

  // Update URL when debounced search term changes and ensure single filter is active
  useEffect(() => {
    const activeKey = searchIn === "all" ? "search" : searchIn;
    let needsUpdate = false;
    const updates = {};

    // Check active key
    if ((queryParams[activeKey] || "") !== debouncedSearchTerm) {
      updates[activeKey] = debouncedSearchTerm || null;
      updates.page = "1"; // Reset page on search
      needsUpdate = true;
    }

    // Check and clear other keys to ensure single filter mode
    filterKeys.forEach((k) => {
      if (
        k !== activeKey &&
        queryParams[k] !== null &&
        queryParams[k] !== undefined
      ) {
        updates[k] = null;
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      setQueryParams((prev) => ({
        ...prev,
        ...updates,
      }));
    }
  }, [debouncedSearchTerm, searchIn, queryParams, filterKeys, setQueryParams]);

  // Cleanup on unmount to reset query params
  useEffect(() => {
    return () => {
      const updates = { page: "1" };
      filterKeys.forEach((k) => (updates[k] = null));
      setQueryParams(updates);
    };
  }, [filterKeys, setQueryParams]);

  const handleClear = () => {
    setSearchTerm("");
    setSearchIn("all");
    setSelectedPatient(null);
    setQueryParams({
        page: "1",
        page_size: "10",
        search: null,
        name: null,
        address: null,
        dob: null,
        ssn: null,
        home_phone: null,
        mobile_phone: null,
        mrn: null,
        emergency_name: null,
    });
  };

  const handlePageChange = (newPage) => {
    setQueryParams((prev) => ({ ...prev, page: newPage }));
  };

  // Define profile fields for preview card
  const patientProfileFields = [
    { label: "DOB", key: "dob" },
    { label: "Gender", key: "gender" },
    { label: "Address", key: "address" },
    { label: "Home Phone", key: "home_phone" },
    { label: "Mobile", key: "mobile_phone" },
    { label: "Email", key: "email" },
  ];

  return (
    <Box
      w="100%"
      h="100%"
      p={6}
      borderRadius="8px"
      color="white"
      display="flex"
      flexDirection="column"
      gap={4}
    >
      {/* HEADER */}
      <HStack justify="space-between" align="center">
        <Text fontSize="xl" fontWeight="semibold">
          Patient Search Results
        </Text>

        <HStack spacing={4} flex={1} maxW="1000px" justify="center">
          <Box flex={1} position="relative" maxW="400px">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search by ${searchIn === 'all' ? 'all fields' : searchIn.replace('_', ' ')}...`}
              className="w-full pl-10 pr-4 py-2.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none transition-colors"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#90a6c6]"
              size={18}
            />
          </Box>

          <select
            value={searchIn}
            onChange={(e) => setSearchIn(e.target.value)}
            className="px-4 py-2.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none transition-colors"
          >
            <option value="all">All Fields</option>
            <option value="name">Name</option>
            <option value="address">Address</option>
            <option value="dob">DOB</option>
            <option value="ssn">SSN</option>
            <option value="home_phone">Home Phone</option>
            <option value="mobile_phone">Mobile Number</option>
            <option value="mrn">Medical Record #</option>
            <option value="emergency_name">Guarantor</option>
          </select>

          <button
            onClick={handleClear}
            className="px-6 py-2.5 border border-[#1e4270] hover:bg-[#0d2b52] rounded-lg text-white flex items-center gap-2 transition-colors font-medium"
          >
            <X size={18} />
            Clear
          </button>
        </HStack>
      </HStack>

      {/* PROFILE PREVIEW CARD - Shown when patient selected for preview */}
      {selectedPatient && (
        <ProfilePreviewCard
          title="Patients"
          item={selectedPatient}
          profile={patientProfileFields}
          onClose={() => setSelectedPatient(null)}
          showScheduleButton={false}
        />
      )}

      {/* TABLE */}
      <Box flex={1} minH={0}>
        <GenericTable
          columns={columns}
          data={data}
          pagination={true}
          bodyHeight={{
            base: selectedPatient
              ? "calc(100vh - 560px)"
              : "calc(100vh - 300px)",
            lg: selectedPatient ? "calc(100vh - 540px)" : "calc(100vh - 300px)",
          }}
          count={totalCount}
          loader={isLoading || isPlaceholderData}
          page={queryParams.page}
          onPageChange={handlePageChange}
          emptyState={{
            title: "No patients found",
            description: "Try adjusting your search criteria.",
          }}
          onRowClick={(row) => setSelectedPatient(row.original)}
        />
      </Box>
    </Box>
  );
};

export default PatientSearch;

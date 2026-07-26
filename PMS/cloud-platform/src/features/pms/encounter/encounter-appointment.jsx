import { useState, useMemo, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Box, HStack, Text } from "@chakra-ui/react";
import GenericTable from "@/components/table/table";

import { useGetCheckInAppointments } from "@/hooks/query/pms/pms_appointments/useGetAppointments";
import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs";
import { useDebounce } from "@/hooks/useDebounce";

const AppointmentSearch = ({ onSelect }) => {
  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsString.withDefault("1"),
    page_size: parseAsString.withDefault("10"),
    id: parseAsString,
    patient_name: parseAsString,
    provider_name: parseAsString,
    date: parseAsString,
    time: parseAsString,
    duration: parseAsString,
    type: parseAsString,
    status: parseAsString,
  });

  // Determine initial search mode based on active query params
  const getInitialMode = () => {
    const keys = [
      "id",
      "patient_name",
      "provider_name",
      "date",
      "time",
      "duration",
      "type",
      "status",
    ];
    const found = keys.find((k) => queryParams[k]);
    return found || "patient_name";
  };

  const [searchIn, setSearchIn] = useState(getInitialMode);

  // Initial search term is the value of the active param
  const [searchTerm, setSearchTerm] = useState(() => {
    const mode = getInitialMode();
    return queryParams[mode] || "";
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const {
    data: responseData = {},
    isLoading,
    isPlaceholderData,
  } = useGetCheckInAppointments(queryParams);

  const appointments = responseData?.appointments || [];
  const totalCount = responseData?.count || 0;

  // Transform raw appointment data for the table
  const data = useMemo(() => {
    return appointments.map((appt) => ({
      id: appt.id,
      patient_name: appt.patient_name || "",
      provider_name: appt.provider_name || "",
      date: appt.date || "",
      time: appt.time?.slice(0, 5) || "", // Show only HH:MM
      duration: appt.duration || "",
      type: appt.type || "",
      status: appt.confirmationstatus || "",
      original: appt, // Keep full object for onSelect
    }));
  }, [appointments]);

  // Sync searchTerm with URL when searchIn mode changes
  useEffect(() => {
    setSearchTerm(queryParams[searchIn] || "");
  }, [searchIn]);

  const filterKeys = useMemo(
    () => [
      "id",
      "patient_name",
      "provider_name",
      "date",
      "time",
      "duration",
      "type",
      "status",
    ],
    []
  );

  // Update URL when debounced search term changes
  useEffect(() => {
    const activeKey = searchIn;
    let needsUpdate = false;
    const updates = {};

    if ((queryParams[activeKey] || "") !== debouncedSearchTerm) {
      updates[activeKey] = debouncedSearchTerm || null;
      updates.page = "1";
      needsUpdate = true;
    }

    // Clear other keys
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

  // Cleanup
  useEffect(() => {
    return () => {
      const updates = { page: "1" };
      filterKeys.forEach((k) => (updates[k] = null));
      setQueryParams(updates);
    };
  }, [filterKeys, setQueryParams]);

  const handleClear = () => {
    setSearchTerm("");
    setSearchIn("patient_name");
    setQueryParams({
      page: "1",
      page_size: "10",
      id: null,
      patient_name: null,
      provider_name: null,
      date: null,
      time: null,
      duration: null,
      type: null,
      status: null,
    });
  };

  const columns = [
    { title: "ID", accessor_key: "id" },
    { title: "Patient Name", accessor_key: "patient_name" },
    { title: "Provider Name", accessor_key: "provider_name" },
    { title: "Appt Date", accessor_key: "date" },
    { title: "Appt Time", accessor_key: "time" },
    { title: "Duration (mins)", accessor_key: "duration" },
    { title: "Type", accessor_key: "type" },
    { title: "Status", accessor_key: "status" },
    {
      title: "Action",
      accessor_key: "action",
      tableProps: { "data-sticky": "end" },
      render: (_, row) => (
        <button
          onClick={() => onSelect && onSelect(row.original)}
          className="px-4 py-2 bg-[#1e4270] hover:bg-[#424141] text-white rounded-lg text-sm transition-colors border border-[#424141]"
        >
          Select
        </button>
      ),
    },
  ];

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
      <HStack justify="space-between" mb={6} align="center">
        <Text fontSize="xl" fontWeight="semibold">
          Appointment Search Results
        </Text>

        <HStack spacing={4} flex={1} maxW="800px" mr="auto">
          <Box flex={1} position="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search by ${searchIn.replace('_', ' ')}...`}
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
            <option value="patient_name">Patient Name</option>
            <option value="provider_name">Provider Name</option>
            <option value="id">ID</option>
            <option value="date">Appt Date</option>
            <option value="time">Appt Time</option>
            <option value="duration">Duration (mins)</option>
            <option value="type">Type</option>
            <option value="status">Status</option>
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

      <Box flex={1} minH={0}>
        <GenericTable
          columns={columns}
          data={data}
          pagination={true}
          bodyHeight={{
            base: "calc(100vh - 300px)",
            "2xl": "calc(100vh - 300px)",
            "3xl": "calc(100vh - 300px)",
          }}
          count={totalCount}
          loader={isLoading || isPlaceholderData}
          page={queryParams.page}
          onPageChange={(page) =>
            setQueryParams((prev) => ({ ...prev, page: String(page) }))
          }
          emptyState={{
            title: "No appointments found",
            description: "Try adjusting your search criteria.",
          }}
        />
      </Box>
    </Box>
  );
};

export default AppointmentSearch;

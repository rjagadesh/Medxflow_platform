import { useState, useMemo, useEffect } from "react";
import { Search, X } from "lucide-react";
import { Box, HStack, Text } from "@chakra-ui/react";
import GenericTable from "@/components/table/table";
import ProfilePreviewCard from "../../list-view/Components/ProfilePreviewCard";
import { useGetProviders } from "@/hooks/query/pms/pms_appointments/useGetProviders";
import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs";
import { useDebounce } from "@/hooks/useDebounce";

const ProviderSearch = ({ onSelect }) => {
  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsString.withDefault("1"),
    page_size: parseAsString.withDefault("10"),
    search: parseAsString,
    name: parseAsString,
    specialty: parseAsString,
    sub_specialty: parseAsString,
    provider_type: parseAsString,
    practice_name: parseAsString,
    organization_name: parseAsString,
    npi: parseAsString,
    medical_license_number: parseAsString,
    city: parseAsString,
    state: parseAsString,
    email: parseAsString,
  });

  const filterKeys = useMemo(
    () => [
      "search",
      "name",
      "specialty",
      "sub_specialty",
      "provider_type",
      "practice_name",
      "organization_name",
      "npi",
      "medical_license_number",
      "city",
      "state",
      "email",
    ],
    []
  );

  // Determine initial search mode based on active query params
  const getInitialMode = () => {
    const found = filterKeys.find((k) => queryParams[k] && k !== "search");
    return found || "all";
  };

  const [searchIn, setSearchIn] = useState(getInitialMode);
  
  const [searchTerm, setSearchTerm] = useState(() => {
    const mode = getInitialMode();
    return queryParams[mode === "all" ? "search" : mode] || "";
  });

  const [selectedProvider, setSelectedProvider] = useState(null);

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const { data: providerResponse, isLoading } = useGetProviders(queryParams);
  const providersData = providerResponse?.results || [];
  const totalCount = providerResponse?.count || 0;

  // Sync searchTerm with URL when searchIn mode changes (one-way sync for UX)
  useEffect(() => {
    const key = searchIn === "all" ? "search" : searchIn;
    setSearchTerm(queryParams[key] || "");
  }, [searchIn]); // Depend only on searchIn

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
    const updates = { page: "1" };
    filterKeys.forEach(k => updates[k] = null);
    setQueryParams(updates);
  };

  // Columns definition
  const columns = [
    { title: "ID", accessor_key: "id" },
    { title: "Name", accessor_key: "name" },
    { title: "Service", accessor_key: "service", tableProps:{width:'200px'} },
    { title: "NPI", accessor_key: "NPI" },
    { title: "Practice Name", accessor_key: "practice_name" },
    { title: "Email", accessor_key: "email", tableProps:{width:'200px'} },
    { title: "City", accessor_key: "city" },
    {
      title: "Action",
      accessor_key: "action",
      tableProps: { "data-sticky": "end" },
      render: (_, row) => (
        <HStack spacing={2}>
          <button
            onClick={() => {
              setSelectedProvider(row.original);
              if (onSelect) onSelect(row.original);
            }}
            className="px-4 py-2 bg-[#1e4270] hover:bg-[#424141] text-white rounded-lg text-sm transition-colors border border-[#424141]"
          >
            Select
          </button>
          <button
            onClick={() => setSelectedProvider(row.original)}
            className="px-3 py-2 bg-[#00afef88] hover:bg-[#00afefbb] text-white rounded-lg text-sm transition-colors"
          >
            Preview
          </button>
        </HStack>
      ),
    },
  ];

  const data = useMemo(() => {
    return providersData.map((provider) => ({
      id: provider.id,
      name: `${provider.first_name || ""} ${provider.last_name || ""}`.trim(),
      service: provider.service || provider.specialty || "",
      NPI: provider.NPI || "",
      practice_name: provider.practice_name || "",
      email: provider.email || "",
      city: provider.city || "",
      // Pass the original provider object
      original: provider,
    }));
  }, [providersData]);

  const providerProfileFields = [
    { label: "NPI", key: "NPI" },
    { label: "Specialty", key: "specialty" },
    // { label: "Email", key: "email" },
    { label: "Practice", key: "practice_name" },
    { label: "Address", key: "address" },
    { label: "City", key: "city" },
    { label: "State", key: "state" },
    { label: "Zip Code", key: "zipcode" },
    { label: "Country", key: "country" },
  ];

  return (
    <Box
      w="100%"
      h="full"
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
          Provider Search Results
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
            <option value="specialty">Service</option>
            {/* <option value="sub_specialty">Sub-Specialty</option> */}
            {/* <option value="provider_type">Provider Type</option> */}
            <option value="practice_name">Practice Name</option>
            {/* <option value="organization_name">Organization</option> */}
            <option value="npi">NPI</option>
            {/* <option value="medical_license_number">Medical License</option> */}
            <option value="city">City</option>
            {/* <option value="state">State</option> */}
            <option value="email">Email</option>
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

      {selectedProvider && (
        <ProfilePreviewCard
          title="PROVIDER"
          item={selectedProvider}
          profile={providerProfileFields}
          onClose={() => setSelectedProvider(null)}
          showScheduleButton={false}
        />
      )}

      {/* TABLE */}
      <Box flex={1} minH={0}>
        <GenericTable
          columns={columns}
          page={queryParams.page}
          onPageChange={(page) => {
            setQueryParams((prev) => ({ ...prev, page }));
          }}
          data={data}
          pagination={true}
          count={totalCount}
          loader={isLoading}
          bodyHeight={{
            base: selectedProvider
              ? "calc(100vh - 560px)"
              : "calc(100vh - 300px)",
            lg: selectedProvider ? "calc(100vh - 540px)" : "calc(100vh - 300px)",
          }}
          emptyState={{
            title: "No providers found",
            description: "Try adjusting your search criteria.",
          }}
          onRowClick={(row) => setSelectedProvider(row.original)}
        />
      </Box>
    </Box>
  );
};

export default ProviderSearch;

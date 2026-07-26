import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Box, HStack, Text } from "@chakra-ui/react";
import GenericTable from "@/components/table/table";
import { useGetInsurancePlans } from "@/hooks/query/pms/insurance-plans/useGetInsurancePlans";
import { useQueryStates, parseAsString } from "nuqs";
import { useDebounce } from "@/hooks/useDebounce";

const InsurancePlanSearch = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsString.withDefault("1"),
    page_size: parseAsString.withDefault("10"),
    name: parseAsString.withDefault(""),
  });

  const debouncedName = useDebounce(searchTerm, 500);

  const {
    data: insurancePlans = {},
    isLoading,
    isPlaceholderData,
  } = useGetInsurancePlans({
    page: queryParams.page,
    page_size: queryParams.page_size,
    name: debouncedName,
  });

  const columns = [
    {
      title: "Plan Name",
      accessor_key: "plan_name",
      tableProps: { width: "25%" },
    },
    {
      title: "Address",
      accessor_key: "address_street1",
      render: (_, row) => (
        <Text>
          {[
            row.address_street1,
            row.address_city,
            row.address_state,
            row.address_zip,
          ]
            .filter(Boolean)
            .join(", ")}
        </Text>
      ),
    },
    {
      title: "Contact Person",
      accessor_key: "contact_first_name",
      render: (_, row) => (
        <Text>
          {[
            row.contact_prefix,
            row.contact_first_name,
            row.contact_middle_name,
            row.contact_last_name,
            row.contact_suffix,
          ]
            .filter(Boolean)
            .join(" ")}
        </Text>
      ),
    },
    {
      title: "Phone",
      accessor_key: "contact_phone",
      render: (value) => <Text>{value || "N/A"}</Text>,
    },
    {
      title: "Action",
      accessor_key: "action",
      tableProps: { "data-sticky": "end" },
      render: (_, row) => (
        <button
          onClick={() => onSelect && onSelect(row)}
          className="px-4 py-2 bg-[#1e4270] hover:bg-[#424141] text-white rounded-lg text-sm transition-colors border border-[#424141]"
        >
          Select
        </button>
      ),
    },
  ];

  const handleClear = () => {
    setSearchTerm("");
    setQueryParams((prev) => ({ ...prev, page: 1 }));
  };

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
          Insurance Plan Search Results
        </Text>

        <HStack spacing={4} flex={1} maxW="800px" mr="auto">
          <Box flex={1} position="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search insurance plans..."
              className="w-full pl-10 pr-4 py-2.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none transition-colors"
            />
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[#90a6c6]"
              size={18}
            />
          </Box>

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
          data={insurancePlans.results || []}
          pagination={true}
          bodyHeight={{
            base: "calc(100vh - 300px)",
            "2xl": "calc(100vh - 300px)",
            "3xl": "calc(100vh - 300px)",
          }}
          count={insurancePlans.count}
          loader={isLoading || isPlaceholderData}
          page={queryParams.page}
          onPageChange={(page) => {
            setQueryParams((prev) => ({ ...prev, page }));
          }}
          emptyState={{
            title: "No insurance plans found",
            description: "Try adjusting your search criteria.",
          }}
        />
      </Box>
    </Box>
  );
};

export default InsurancePlanSearch;

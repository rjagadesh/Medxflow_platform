import React, { useState } from "react";
import { Search, X } from "lucide-react";
import { Box, HStack, Text, Avatar } from "@chakra-ui/react";
import GenericTable from "@/components/table/table";
import { useGetInsuranceCompaniesPatients } from "@/hooks/query/pms/insurance-companies/useGetInsuranceCompanies";
import { useQueryStates, parseAsString } from "nuqs";
import { useDebounce } from "@/hooks/useDebounce";
import getStatusIcon from "@/utils/status-icon";

const InsuranceCompaniesSearch = ({ onSelect }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsString.withDefault("1"),
    page_size: parseAsString.withDefault("10"),
    name: parseAsString.withDefault(""),
  });

  const debouncedName = useDebounce(searchTerm, 500);

  const {
    data: insuranceCompanies = {},
    isLoading,
    isPlaceholderData,
  } = useGetInsuranceCompaniesPatients({
    page: queryParams.page,
    page_size: queryParams.page_size,
    name: debouncedName,
  });

  const columns = [
    {
      title: "Insurance #",
      accessor_key: "id",
      tableProps: { width: "15%" },
    },
    {
      title: "Insurance Name",
      accessor_key: "name",
      tableProps: { width: "35%" },
      render: (value, row) => {
        const item = row.stedi_response;
        return (
          <HStack gap={2}>
            {item && (
              <Avatar.Root shape="rounded" size="2xs">
                <Avatar.Image
                  src={item.payer?.avatarUrl}
                  alt={item.matches?.displayName || item.payer?.displayName}
                />
                <Avatar.Fallback
                  name={item.matches?.displayName || item.payer?.displayName}
                />
              </Avatar.Root>
            )}
            <Text>{value}</Text>
          </HStack>
        );
      },
    },
    {
      title: "Claims",
      accessor_key: "claims",
      render: (value) => (
        <Text
          color={value === "Approved" ? "green.400" : "gray.500"}
          fontWeight="medium"
        >
          {value ? value : "N/A"}
        </Text>
      ),
    },
    {
      title: "Eligibility",
      accessor_key: "eligibility",
      render: () =>
        getStatusIcon("approved", {
          size: "sm",
        }),
    },
    {
      title: "ERAs",
      accessor_key: "eras",
      render: (value) => (
        <Box>
          {value === "Request Received" ? (
            <Box
              bg="gray.700"
              px={2}
              py={1}
              rounded="md"
              display="inline-block"
            >
              <Text fontSize="xs" color="gray.300">
                {value ? value : "N/A"}
              </Text>
            </Box>
          ) : (
            <Text color="gray.500" fontWeight="medium">
              {value ? value : "N/A"}
            </Text>
          )}
        </Box>
      ),
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
          Insurance Company Search Results
        </Text>

        <HStack spacing={4} flex={1} maxW="800px" mr="auto">
          <Box flex={1} position="relative">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search insurance companies..."
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
          data={insuranceCompanies.results || []}
          pagination={true}
          bodyHeight={{
            base: "calc(100vh - 300px)",
            "2xl": "calc(100vh - 300px)",
            "3xl": "calc(100vh - 300px)",
          }}
          count={insuranceCompanies.count}
          loader={isLoading || isPlaceholderData}
          page={queryParams.page}
          onPageChange={(page) => {
            setQueryParams((prev) => ({ ...prev, page }));
          }}
          emptyState={{
            title: "No insurance companies found",
            description: "Try adjusting your search criteria.",
          }}
        />
      </Box>
    </Box>
  );
};

export default InsuranceCompaniesSearch;

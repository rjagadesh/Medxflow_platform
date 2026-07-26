import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Text,
  SegmentGroup,
  HStack,
  VStack,
  Spinner,
  Alert,
} from "@chakra-ui/react";
import GenericTable from "@/components/table/table";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import { Link, useNavigate } from "react-router-dom";
import getStatusIcon from "@/utils/status-icon";
import { useGetEncounters } from "@/hooks/query/pms/encounter/useGetEncounters";
import { AlertCircle } from "lucide-react";
import { useQueryStates } from "nuqs";
import { parseAsString } from "nuqs";
import { useQueryClient } from "@tanstack/react-query";
import { useClaimSubmission } from "@/hooks/mutation/pms/encounter/useClaimSubmit";
import { formatDate } from "@/utils/helper";
import { useDebounce } from "@/hooks/useDebounce";

const EncounterDashboard = () => {
  const navigate = useNavigate();

  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsString.withDefault("1"),
    page_size: parseAsString.withDefault("10"),
    status: parseAsString,
    encounter_number: parseAsString,
    batch_number: parseAsString,
    service_date: parseAsString,
    patient_name: parseAsString,
    provider_name: parseAsString,
    primary_insurance: parseAsString,
    total_charges: parseAsString,
    all: parseAsString,
  });

  // Helper to map status to segment label
  const getSegmentFromStatus = (status) => {
    if (!status) return "All";
    if (status === "draft") return "Draft";
    if (status === "ready") return "Review";
    if (status === "accepted") return "Approved";
    if (status === "rejected") return "Rejected";
    if (status === "unpayable") return "Un Payable";
    if (status === "not_started") return "Not Started";
    return "All";
  };

  // Helper to map segment label to backend status
  const getStatusFromSegment = (segment) => {
    if (segment === "All") return null;
    if (segment === "Draft") return "draft";
    if (segment === "Review") return "ready";
    if (segment === "Approved") return "accepted";
    if (segment === "Rejected") return "rejected";
    if (segment === "Un Payable") return "unpayable";
    if (segment === "Not Started") return "not_started";
    return null;
  };

  const [activeSegment, setActiveSegment] = useState(() =>
    getSegmentFromStatus(queryParams.status)
  );

  // Sync activeSegment with URL status
  useEffect(() => {
    setActiveSegment(getSegmentFromStatus(queryParams.status));
  }, [queryParams.status]);

  const handleSegmentChange = (value) => {
    setActiveSegment(value);
    const status = getStatusFromSegment(value);
    setQueryParams((prev) => ({ ...prev, status, page: "1" }));
  };

  const getInitialMode = () => {
    const keys = [
      "encounter_number",
      "batch_number",
      "service_date",
      "patient_name",
      "provider_name",
      "primary_insurance",
      "total_charges",
      "all",
    ];
    const found = keys.find((k) => queryParams[k]);
    return found || "all";
  };

  const [searchIn, setSearchIn] = useState([getInitialMode()]);

  const [searchTerm, setSearchTerm] = useState(() => {
    const mode = getInitialMode();
    return queryParams[mode] || "";
  });

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  const filterKeys = useMemo(
    () => [
      "encounter_number",
      "batch_number",
      "service_date",
      "patient_name",
      "provider_name",
      "primary_insurance",
      "total_charges",
      "all",
    ],
    []
  );

  // Update URL when debounced search term changes
  useEffect(() => {
    const activeKey = searchIn[0];
    if (!activeKey) return;

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
      setQueryParams((prev) => ({ ...prev, ...updates }));
    }
  }, [debouncedSearchTerm, searchIn, queryParams, filterKeys, setQueryParams]);

  // Sync searchTerm with URL when searchIn mode changes
  useEffect(() => {
    const activeKey = searchIn[0];
    if (activeKey) {
      setSearchTerm(queryParams[activeKey] || "");
    }
  }, [searchIn]);

  const { data, isLoading, isError, error } = useGetEncounters(queryParams);
  const claimMutation = useClaimSubmission();
  const queryClient = useQueryClient();

  const encounters = data?.results || [];
  const totalCount = data?.count || 0;

  console.log("Encounters data", encounters.length);

  // Helper function to map status values to display labels (for table)
  const getStatusLabel = (status) => {
    if (!status) return "unknown";
    const statusLower = status.toLowerCase();
    if (statusLower === "ready") return "Reviewed";
    if (statusLower === "accepted") return "Approved";
    if (statusLower === "draft") return "Draft";
    if (statusLower === "unpayable") return "Un Payable";
    if (statusLower === "not_started") return "Not Started";
    return status;
  };

  const COLUMNS = [
    {
      title: "ID #",
      accessor_key: "encounter_number",
      render: (encounter_number) =>
        encounter_number ? encounter_number : "—",
    },
    {
      title: "Batch #",
      accessor_key: "batch_number",
      render: (batch_number) => (batch_number ? batch_number : "—"),
    },
    {
      title: "Date of Service",
      accessor_key: "encounter_from_date",
      render: (encounter_from_date) =>
        encounter_from_date ? formatDate(encounter_from_date) : "—",
    },
    {
      title: "Patient",
      accessor_key: "patient",
      render: (patient) =>
        patient
          ? `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
            "Unknown Patient"
          : "—",
    },
    {
      title: "Provider",
      accessor_key: "rendering_provider",
      render: (provider) =>
        provider
          ? `${provider.first_name || ""} ${provider.last_name || ""}`.trim() ||
            "—"
          : "—",
    },
    {
      title: "Primary Insurance",
      accessor_key: "primary_insurance",
      render: (ins) => (ins?.name ? ins.name : "—"),
    },
    {
      title: "Total Charges",
      accessor_key: "total_charges",
      render: (amount) =>
        amount ? `$${parseFloat(amount).toFixed(2)}` : "$0.00",
    },
    {
      title: "Status",
      accessor_key: "status",
      render: (status) =>
        getStatusIcon(getStatusLabel(status) || "unknown", {
          size: {
            base: "sm",
            "2xl": "md",
            "3xl": "lg",
          },
        }),
    },
    {
      title: "Actions",
      render: (_, row) => (
        <CustomButton
          size="xs"
          variant="outline"
          colorScheme="blue"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/pms/encounter/edit/${row.id}`);
          }}
        >
          Edit
        </CustomButton>
      ),
    },
  ];

  const segments = ["All", "Not Started", "Draft", "Review", "Approved", "Rejected", "Un Payable"];

  const handleClear = () => {
    setSearchTerm("");
    setSearchIn(["all"]);
    setQueryParams({
      page: "1",
      encounter_number: null,
      batch_number: null,
      service_date: null,
      patient_name: null,
      provider_name: null,
      primary_insurance: null,
      total_charges: null,
      all: null,
    });
  };

  return (
    <>
      <Box
        display="flex"
        flexDirection="column"
        p={6}
        bg="droidalBlack.400"
        gap={4}
        border="1px solid #2f4d78"
        borderRadius="md"
        style={{ height: "calc(100vh - 140px)" }}
      >
        <VStack align="start" gap={4} w="full">
          <Box bg="droidalBlack.300" w="full" px={4} py={2} rounded="md">
            <Text color="white" fontWeight="light" fontSize="lg" mb={2}>
              Find Encounter
            </Text>
            <SegmentGroup.Root
              value={activeSegment}
              onValueChange={(e) => handleSegmentChange(e.value)}
              size="sm"
              css={{
                '& [data-state="checked"]': {
                  bgImage: "var(--bg-blue-gradient)",
                  color: "#fff",
                },
              }}
              bgColor="transparent"
            >
              <SegmentGroup.Items
                items={segments}
                cursor="pointer"
                color="white"
                fontWeight="light"
                bg="black"
                p={4}
                rounded="md"
                mr={2}
                letterSpacing="widest"
                _before={{ display: "none !important" }}
              />
            </SegmentGroup.Root>
          </Box>
        </VStack>

        <Box
          bg="droidalBlack.300"
          p={4}
          display="flex"
          alignItems="center"
          gap={4}
          rounded="md"
          w="full"
        >
          <Text
            color="white"
            fontSize="sm"
            whiteSpace="nowrap"
            fontWeight="light"
          >
            Look For:
          </Text>
          <Box flex={1}>
            <CustomInput
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={`Search by ${
                searchIn[0] === "all"
                  ? "all fields"
                  : (searchIn[0] || "").replace("_", " ")
              }...`}
              h="40px"
            />
          </Box>
          <Text
            color="white"
            fontSize="sm"
            whiteSpace="nowrap"
            fontWeight="light"
          >
            Search In:
          </Text>
          <Box w="200px">
            <CustomSelect
              value={searchIn}
              onValueChange={(val) => {
                if (val && val.length > 0) setSearchIn(val);
                else setSearchIn(["all"]);
              }}
              options={[
                { label: "All fields", value: "all" },
                { label: "Encounter #", value: "encounter_number" },
                { label: "Batch #", value: "batch_number" },
                { label: "Date of Service", value: "service_date" },
                { label: "Patient Name", value: "patient_name" },
                { label: "Provider Name", value: "provider_name" },
                { label: "Insurance", value: "primary_insurance" },
                { label: "Total Charges", value: "total_charges" },
              ]}
              placeholder="All fields"
            />
          </Box>
          <CustomButton
            h="40px"
            onClick={() => {
              // Optional manual trigger logic if needed
            }}
          >
            Find Now
          </CustomButton>
          <CustomButton variant="outline" h="40px" onClick={handleClear}>
            Clear
          </CustomButton>
        </Box>

        <Box flex={1} overflow="hidden">
          {isLoading ? (
            <VStack h="full" justify="center">
              <Spinner size="xl" color="#00BBF2" thickness="4px" />
              <Text color="white" mt={4}>
                Loading encounters...
              </Text>
            </VStack>
          ) : isError ? (
            <Alert status="error" variant="subtle" borderRadius="md">
              <AlertCircle className="h-5 w-5" />
              <Text ml={3}>
                Error loading encounters: {error?.message || "Unknown error"}
              </Text>
            </Alert>
          ) : encounters.length === 0 ? (
            <VStack h="full" justify="center">
              <Text color="white" fontSize="lg">
                No encounters found
              </Text>
            </VStack>
          ) : (
            <GenericTable
              columns={COLUMNS}
              data={encounters}
              selection={{
                selectable: true,
                showSelectAll: true,
                onSelectAllChange: (rows) => rows.map((r) => r.id),
                onConfirm: async (ids) => {
                  console.log("Selected for bulk action:", ids);
                  return true;
                },
                checkPermission: () => true,
              }}
              pagination={true}
              count={totalCount}
              page={queryParams.page}
              onPageChange={(p) => {
                setQueryParams((prev) => ({ ...prev, page: String(p) }));
              }}
              showPageSize={true}
              pageSize={Number(queryParams.page_size)}
              onPageSizeChange={(size) => {
                setQueryParams((prev) => ({
                  ...prev,
                  page_size: String(size),
                  page: "1",
                }));
              }}
              bodyHeight="calc(100vh - 450px)"
              enableClaimSubmission={true}
              claimSubmission={{
                onSubmit: (encounters) => {
                  if (encounters.length > 0) {
                    const ids = encounters.map((e) => e.id);
                    claimMutation.mutate(ids, {
                      onSuccess: () => {
                        queryClient.invalidateQueries({
                          queryKey: ["pms-encounterList"],
                        });
                      },
                    });
                  }
                },
                isLoading: claimMutation.isPending,
              }}
            />
          )}
        </Box>
      </Box>

      <HStack spacing={4} mt="2">
        <Link to="/pms/encounter/create">
          <CustomButton variant="outline">New</CustomButton>
        </Link>
        <CustomButton variant="outline">Open</CustomButton>
      </HStack>
    </>
  );
};

export default EncounterDashboard;

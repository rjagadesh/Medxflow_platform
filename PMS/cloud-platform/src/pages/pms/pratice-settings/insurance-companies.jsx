import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  Button,
  HStack,
  Input,
  InputGroup,
  Menu,
  Portal,
  Center,
  Avatar,
} from "@chakra-ui/react";
import { HelpCircle, Search, ChevronDown, Plus } from "lucide-react";
import GenericTable from "@/components/table/table";
import PlatformSettingsSidebar from "@/layouts/sidebar/platform-settings-sidebar";
import CustomButton from "@/components/button/button";
import AddNewInsurance from "@/features/pms/pratice-settings/insurance/add-new-insurance";
import { useNavigate } from "react-router-dom";
import { ArrowLeftIcon } from "lucide-react";
import { useGetInsuranceCompaniesPatients } from "@/hooks/query/pms/insurance-companies/useGetInsuranceCompanies";
import { parseAsString } from "nuqs";
import { useQueryStates } from "nuqs";
import { useDebounce } from "@/hooks/useDebounce";
import CustomInput from "@/components/input/input";
import getStatusIcon from "@/utils/status-icon";

const MOCK_DATA = [
  {
    id: "60054",
    name: "Aetna",
    claims: "Approved",
    eligibility: "Approved",
    eras: "Request Received",
  },
  {
    id: "78909",
    name: "Altius",
    claims: "N/A",
    eligibility: "N/A",
    eras: "N/A",
  },
  {
    id: "89876",
    name: "Anthem NEW",
    claims: "N/A",
    eligibility: "N/A",
    eras: "N/A",
  },
  {
    id: "47198",
    name: "Blue Cross of California",
    claims: "Approved",
    eligibility: "Approved",
    eras: "Request Received",
  },
  {
    id: "94036",
    name: "Blue Shield of California",
    claims: "Approved",
    eligibility: "Approved",
    eras: "Request Received",
  },
];

const InsuranceCompanies = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [queryParams, setQueryParams] = useQueryStates({
    page: parseAsString.withDefault(1),
    page_size: parseAsString.withDefault(10),
    name: parseAsString.withDefault(""),
  });
  const debouncedName = useDebounce(queryParams.name, 500);
  const {
    data: insuranceCompanies,
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
              <Avatar.Root shape="rounded" size="xs">
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
      title: "",
      accessor_key: "action",
      render: () => <ChevronDown size={16} color="gray" />,
      tableProps: { width: "50px" },
    },
  ];

  const FilterDropdown = ({ label, value }) => (
    <HStack gap={1} cursor="pointer">
      <Text color="gray.500" fontSize="sm">
        {label}:
      </Text>
      <Menu.Root>
        <Menu.Trigger asChild>
          <HStack gap={1} as="button">
            <Text color="white" fontSize="sm">
              {value}
            </Text>
            <ChevronDown size={14} color="gray" />
          </HStack>
        </Menu.Trigger>
        <Portal>
          <Menu.Positioner>
            <Menu.Content bg="droidalBlack.300" borderColor="gray.700">
              <Menu.Item
                value="show-all"
                bg="droidalBlack.300"
                _hover={{ bg: "droidalBlack.200" }}
                color="white"
              >
                Show All
              </Menu.Item>
              {/* Add more options as needed */}
            </Menu.Content>
          </Menu.Positioner>
        </Portal>
      </Menu.Root>
    </HStack>
  );

  return (
    <Center w="full">
      <Flex h="full" w="full" bg="droidalBlack.400">
        <Box flex={1} p={4} overflow="hidden">
          <Box
            bg="droidalBlack.300"
            rounded="2xl"
            display="flex"
            flexDirection="column"
          >
            {/* Custom Header Area matching functionality of screenshot but in Dark Mode */}
            <Box p={5} borderBottom="1px solid" borderColor="whiteAlpha.200">
              <Flex justify="space-between" align="center" mb={6}>
                <HStack gap={2}>
                  <Text
                    fontSize="lg"
                    fontWeight="semibold"
                    color="white"
                    letterSpacing="wide"
                  >
                    Insurance Company
                  </Text>
                  <HelpCircle size={16} color="#A0AEC0" />
                </HStack>
                <HStack gap={6}>
                  <Text
                    fontSize="sm"
                    color="blue.400"
                    cursor="pointer"
                    _hover={{ textDecoration: "underline" }}
                  >
                    Enroll
                  </Text>
                  <Text
                    fontSize="sm"
                    color="blue.400"
                    cursor="pointer"
                    _hover={{ textDecoration: "underline" }}
                  >
                    Draft Enrollment (1)
                  </Text>
                  <CustomButton
                    size="sm"
                    color="white"
                    leftIcon={<Plus size={16} />}
                    rounded="md" // Changed to md to match app style usually
                    px={4}
                    onClick={() => setOpen(true)}
                  >
                    Add Insurance
                  </CustomButton>
                </HStack>
              </Flex>

              <Flex justify="space-between" align="center">
                <HStack gap={6}>
                  <FilterDropdown label="Enrolled to" value="Group" />
                  <FilterDropdown label="Scope" value="Show All" />
                  <FilterDropdown label="Status" value="Show All" />
                  <Text fontSize="sm" color="blue.400" cursor="pointer">
                    Clear
                  </Text>
                </HStack>

                <InputGroup
                  size="sm"
                  width="250px"
                  endElement={<Search size={14} color="#A0AEC0" />}
                >
                  <CustomInput
                    placeholder="Search insurance"
                    borderRadius="md"
                    bg="blackAlpha.400"
                    borderColor="whiteAlpha.300"
                    _hover={{ borderColor: "whiteAlpha.400" }}
                    _focus={{ borderColor: "blue.500", boxShadow: "none" }}
                    color="white"
                    onChange={(v) => {
                      setQueryParams((prev) => ({ ...prev, name: v }));
                    }}
                  />
                </InputGroup>
              </Flex>
            </Box>

            {/* The GenericTable */}
            <Box flex={1} overflow="hidden">
              <GenericTable
                columns={columns}
                data={insuranceCompanies.results}
                loader={isLoading || isPlaceholderData}
                count={insuranceCompanies.count}
                selection={{ selectable: false }}
                onRowClick={() => {
                  navigate("/pms/platform-settings/insurance/1");
                }}
                page={queryParams.page}
                onPageChange={(pageNumber) => {
                  setQueryParams((prev) => ({ ...prev, page: pageNumber }));
                }}
                bodyHeight={{
                  base: "calc(100vh - 300px)",
                  "2xl": "calc(100vh - 350px)",
                  "3xl": "calc(100vh - 350px)",
                }}
              />
            </Box>
          </Box>
        </Box>
        <AddNewInsurance isOpen={open} onClose={() => setOpen(false)} />
      </Flex>
    </Center>
  );
};

export default InsuranceCompanies;

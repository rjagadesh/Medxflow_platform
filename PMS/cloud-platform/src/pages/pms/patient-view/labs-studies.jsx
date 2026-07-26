import React, { useMemo, useState } from "react";
import {
  Box,
  Flex,
  HStack,
  VStack,
  Text,
  Badge,
  Heading,
  Spinner,
  Center,
} from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import { ChevronDown } from "lucide-react";
import CustomSelect from "@/components/ui/select";
import PlatformSettingsSidebar from "@/layouts/sidebar/platform-settings-sidebar";
import AddEditLabsStudies from "@/features/pms/encounter-notes/add-labs-studies";
import { useParams } from "react-router-dom";
import { useGetLabOrdersByPatient } from "@/hooks/query/pms/lab-orders/useGetLabOrdersByPatient";
import { useGetPatientById } from "@/hooks/query/pms/pms_appointments/useGetPatientById";
import { format } from "date-fns";

const fmt = (value) => {
  if (!value) return "-";
  try {
    return format(new Date(value), "MM/dd/yyyy");
  } catch {
    return "-";
  }
};

// Which backend statuses belong to each sidebar tab
const TAB_STATUSES = {
  results_available: ["completed"],
  pending: ["ordered", "in_progress", "draft"],
  recently_signed: ["cancelled"],
};

const LabsStudies = () => {
  const { patient_id: patientId } = useParams();
  const [activeTab, setActiveTab] = useState("pending");
  const [orderType, setOrderType] = useState("all");
  const [isOpen, setIsopen] = useState(false);

  const { data: patient } = useGetPatientById(patientId);
  const { data, isLoading } = useGetLabOrdersByPatient(
    patientId,
    orderType === "all" ? undefined : orderType
  );

  const orders = useMemo(() => {
    const list = data?.orders || [];
    return list.map((o) => ({
      id: o.id,
      patientName: patient?.full_name || "",
      testName:
        (o.items || []).map((i) => i.name).join("; ") || o.order_type,
      status: (o.status || "").replace(/_/g, " ").toUpperCase(),
      rawStatus: o.status,
      type: o.is_elab ? "eLab" : o.order_type,
      orderedBy: o.ordering_provider_name || "-",
      date: fmt(o.created_at),
      updated: fmt(o.updated_at),
      action: o.status === "completed" ? "Open" : "Create eLab",
    }));
  }, [data, patient]);

  const visibleOrders = useMemo(
    () =>
      orders.filter((o) =>
        (TAB_STATUSES[activeTab] || []).includes(o.rawStatus)
      ),
    [orders, activeTab]
  );

  const sidebarItems = [
    {
      label: "Results Available",
      count: orders.filter((o) =>
        TAB_STATUSES.results_available.includes(o.rawStatus)
      ).length,
      id: "results_available",
    },
    {
      label: "Pending",
      count: orders.filter((o) => TAB_STATUSES.pending.includes(o.rawStatus))
        .length,
      id: "pending",
    },
    {
      label: "Recently Signed",
      count: orders.filter((o) =>
        TAB_STATUSES.recently_signed.includes(o.rawStatus)
      ).length,
      id: "recently_signed",
    },
  ];

  // Options for selects
  const sortOptions = [{ label: "Last Update", value: "last_update" }];
  const userOptions = [{ label: "Diana Hudson", value: "diana_hudson" }];
  const orderTypeOptions = [
    { label: "All", value: "all" },
    { label: "Labs", value: "Labs" },
    { label: "Studies", value: "Studies" },
    { label: "Imaging", value: "Imaging" },
  ];

  return (
    <Flex h="full" bgColor={"droidalBlack.300"}>
      <PlatformSettingsSidebar.Root>
        {sidebarItems.map((item) => (
          <PlatformSettingsSidebar.Item
            key={item.id}
            label={item.label}
            isActive={activeTab === item.id}
            onItemClick={() => setActiveTab(item.id)}
            badge={
              <Badge
                borderRadius="full"
                px={2}
                py={0.5}
                colorScheme={item.count > 0 ? "orange" : "gray"}
                bg={item.count > 0 ? "orange.200" : "gray.200"}
                color={item.count > 0 ? "orange.800" : "gray.500"}
              >
                {item.count}
              </Badge>
            }
          />
        ))}
      </PlatformSettingsSidebar.Root>

      <Box flex={1} p={6} color="white" overflowY="auto">
        {/* Header */}
        <Flex justify="space-between" align="center" mb={8}>
          <Heading size="lg" fontWeight="bold">
            Labs/Studies
          </Heading>
          <HStack>
            <CustomButton
              color="white"
              onClick={() => {
                setIsopen(true);
              }}
              rightIcon={<ChevronDown size={16} />}
            >
              + Create Order
            </CustomButton>
          </HStack>
        </Flex>

        {/* Filters */}
        <HStack gap={4} mb={6}>
          <Box w="150px">
            <CustomSelect
              label="Sort by:"
              options={sortOptions}
              value={["last_update"]}
              onValueChange={() => {}}
              placeholder="Sort by"
            />
          </Box>
          <Box w="150px">
            <CustomSelect
              label="User:"
              options={userOptions}
              value={["diana_hudson"]}
              onValueChange={() => {}}
              placeholder="User"
            />
          </Box>
          <Box w="100px">
            <CustomSelect
              label="Order Type:"
              options={orderTypeOptions}
              value={[orderType]}
              onValueChange={(val) =>
                setOrderType(Array.isArray(val) ? val[0] : val)
              }
              placeholder="All"
            />
          </Box>
        </HStack>

        {/* List */}
        {isLoading ? (
          <Center py={10}>
            <Spinner color="droidalBlue.500" />
          </Center>
        ) : visibleOrders.length === 0 ? (
          <Center py={10}>
            <Text color="gray.500">No orders found.</Text>
          </Center>
        ) : (
        <VStack gap={4} align="stretch">
          {visibleOrders.map((order) => (
            <Box
              key={order.id}
              border="1px solid"
              borderColor="droidalGray.300"
              borderRadius="lg"
              p={4}
              bg="droidalBlack.300"
              _hover={{ borderColor: "droidalBlue.500" }}
            >
              <Flex justify="space-between" align="start">
                <VStack align="start" gap={1}>
                  <HStack>
                    <Text fontWeight="bold" fontSize="lg">
                      {order.patientName}
                    </Text>
                    <Text fontWeight="bold" fontSize="lg" color="gray.400">
                      {order.testName}
                    </Text>
                  </HStack>

                  <HStack gap={3} mt={1} wrap="wrap">
                    <Badge
                      colorScheme={"orange"}
                      fontSize="xs"
                      px={2}
                      py={1}
                      borderRadius="md"
                      className="dark"
                      textTransform="uppercase"
                    >
                      {order.status}
                    </Badge>
                    <Text fontSize="sm" color="gray.400">
                      {order.type}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      Ordered by: {order.orderedBy}
                    </Text>
                    <Text fontSize="sm" color="gray.500">
                      on: {order.date} (updated: {order.updated})
                    </Text>
                  </HStack>
                </VStack>

                <CustomButton
                  variant="outline"
                  size="sm"
                  borderRadius="full"
                  rightIcon={
                    order.action.includes("Create") ? (
                      <ChevronDown size={14} />
                    ) : null
                  }
                  borderColor="gray.500"
                  color="white"
                  _hover={{ bg: "whiteAlpha.200" }}
                >
                  {order.action}
                </CustomButton>
              </Flex>
            </Box>
          ))}
        </VStack>
        )}
      </Box>
      <AddEditLabsStudies isOpen={isOpen} onClose={() => setIsopen(false)} />
    </Flex>
  );
};

export default LabsStudies;

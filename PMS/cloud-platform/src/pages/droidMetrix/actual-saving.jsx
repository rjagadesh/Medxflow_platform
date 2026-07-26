import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

function BreakEvenChart({ actualData = {} }) {
  const breakPoint = useMemo(() => {
    function findIntersection(costData, savingsData) {
      for (let i = 0; i < costData.length - 1; i++) {
        // Check if the lines cross between point i and i+1
        if (
          (costData[i] <= savingsData[i] &&
            costData[i + 1] >= savingsData[i + 1]) ||
          (costData[i] >= savingsData[i] &&
            costData[i + 1] <= savingsData[i + 1])
        ) {
          // Simple linear interpolation to find more precise intersection
          const x1 = i;
          const x2 = i + 1;
          const y1Cost = costData[i];
          const y2Cost = costData[i + 1];
          const y1Savings = savingsData[i];
          const y2Savings = savingsData[i + 1];

          // Calculate the intersection point using linear interpolation
          const slope1 = (y2Cost - y1Cost) / (x2 - x1);
          const slope2 = (y2Savings - y1Savings) / (x2 - x1);
          const b1 = y1Cost - slope1 * x1;
          const b2 = y1Savings - slope2 * x1;

          const xIntersect = (b2 - b1) / (slope1 - slope2);

          return xIntersect;
        }
      }
      return null; // No intersection found
    }
    return findIntersection(
      actualData.cumulative_cost,
      actualData.cumulative_saving
    );
  }, [actualData.cumulative_cost, actualData.cumulative_saving]);
  const options = {
    chart: {
      backgroundColor: "transparent",
      height: 450,
    },
    title: { text: null },
    credits: { enabled: false },
    xAxis: {
      categories: actualData.xaxis,
      labels: {
        style: { color: "#aaa" },
      },
      plotLines: [
        {
          color: "#fff",
          width: 1,
          // value: actualData.xaxis?.[Math.round(breakPoint)] || 0,
          value: Math.round(breakPoint) ? Math.round(breakPoint) : null,
          zIndex: 5,
          label: {
            text: "Break-even point",
            rotation: 0,
            align: "left",
            y: 10,
            style: { color: "#fff", fontWeight: "bold" },
          },
        },
      ],
    },
    yAxis: {
      title: { text: null },
      gridLineColor: "#828898",
      gridLineDashStyle: "Dash",
      labels: { style: { color: "#aaa" } },
      min: -100000,
    },
    tooltip: {
      shared: true,
      backgroundColor: "#222",
      borderColor: "#444",
      style: { color: "#fff" },
      xDateFormat: "%e %b %Y",
      valuePrefix: "$",
      valueDecimals: 0,
    },
    legend: {
      enabled: false,
      itemStyle: { color: "#fff" },
      itemHoverStyle: { color: "#fff" },
    },

    series: [
      {
        name: "Manual cost",
        data: actualData.manual_cost,
        color: "#D73C2C",
        dashStyle: "Dash", // dashed line
        // marker: { enabled: true, symbol: "circle" },
      },
      {
        name: "Cumulative cost",
        data: actualData.cumulative_cost,
        color: "#F3D020",
        // marker: { enabled: true, symbol: "circle" },
      },
      {
        name: "Cumulative savings",
        data: actualData.cumulative_saving,
        color: "#8BC34A",
        // marker: { enabled: true, symbol: "circle" },
      },
    ],
  };
  console.log("breakPoint", breakPoint);

  return <HighchartsReact highcharts={Highcharts} options={options} />;
}
import {
  Box,
  Card,
  Center,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { CircleIcon, Loader2, ShieldIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { LucideGradientIcon } from "@/features/home/home-card";
import CustomSelect from "@/components/ui/select";
import { useAuth } from "@/store/providers/auth-provider";
import { useGetDepartments } from "@/hooks/query/useGetDepartments";
import { useGetAgents } from "@/hooks/query/useGetAgents";
import ApiConstant from "@/services/constant";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/axios-instance";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import UnauthorizedPage from "../unauthorized";

const ActualSavings = () => {
  const { user } = useAuth();
  const { data: departments } = useGetDepartments();
  const { hasPermission } = usePermissions();

  const [selectedDepartment, setSelectedDepartment] = useState("All");
  const { data: agents } = useGetAgents({
    module_id: selectedDepartment !== "All" ? selectedDepartment : null,
  });
  const [selectedAgents, setSelectedAgents] = useState(["All"]);
  console.log("user1212", user?.mail, user);
  const {
    data: actualData,
    isLoading: loading,
    isPlaceholderData,
  } = useQuery({
    queryKey: [
      "actual-savings",
      user?.mail,
      selectedDepartment,
      selectedAgents,
    ],
    enabled: !!user?.mail,
    queryFn: ({ signal }) =>
      fetchActualsChartData(
        selectedDepartment,
        selectedAgents,
        signal,
        user?.mail
      ),
    placeholderData: {
      xaxis: [],
      manual_cost: [],
      cumulative_cost: [],
      cumulative_saving: [],
    },
    select: (data) => {
      console.log("data9989898", data);
      const status = data.status;
      if (status === "success") {
        return {
          xaxis: data.datelist,
          manual_cost: data.human_cost,
          cumulative_cost: data.cumulativecost,
          cumulative_saving: data.cumulativesaving,
        };
      } else {
        return {
          xaxis: [],
          manual_cost: [],
          cumulative_cost: [],
          cumulative_saving: [],
        };
      }
    },
  });
  // const { data: agents = [] } = useGetAgents({
  //   module_id: selectedDepartment?.[0],
  // });

  const fetchActualsChartData = async (
    selectedDepartment,
    selectedAgents,
    signal,
    mail
  ) => {
    const payload = {
      department: selectedDepartment,
      email: mail,
      agent: selectedAgents?.[0],
    };
    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "application/json");
    myHeaders.append(
      "Authorization",
      "Bearer " + localStorage.getItem("access")
    );

    return api({
      url: `${ApiConstant.BASE_URL}/app/roi/fetch-effort-data-rest/`,
      method: "POST",
      headers: myHeaders,
      data: payload,
      signal,
    });
  };

  const handleDepartmentClick = (id) => {
    setSelectedDepartment(id);
  };

  const savingAmount =
    actualData.cumulative_saving?.[actualData.xaxis?.length - 1];
  const formattedCurrency = parseFloat(savingAmount || 0).toLocaleString(
    "en-US",
    {
      style: "currency",
      currency: "USD",
    }
  );

  if (!hasPermission("roi_actual_savings", "view")) return <UnauthorizedPage />;

  console.log("actualData112", loading, actualData);

  return (
    <VStack gap={6} my="8" align="stretch">
      <Card.Root bg="droidalBlack.300" color="white" border="none">
        <Card.Header
          as={"div"}
          display={"flex"}
          alignItems={"center"}
          flexDirection={"row"}
          justifyContent={"space-between"}
        >
          <Text letterSpacing={"widest"} fontSize={"lg"} fontWeight="normal">
            Actual cost savings{" "}
          </Text>
          <HStack gap={4}>
            <Text
              fontSize={"xs"}
              letterSpacing={"widest"}
              display={"inline-flex"}
              alignItems={"center"}
            >
              <CircleIcon
                fill="#E00000"
                size="14"
                color="#E00000"
                className="mr-2"
              />
              Manual Cost
            </Text>
            <Text
              fontSize={"xs"}
              letterSpacing={"widest"}
              display={"inline-flex"}
              alignItems={"center"}
            >
              <CircleIcon
                fill="#FFB95A"
                size="14"
                color="#FFB95A"
                className="mr-2"
              />
              Cumulative Cost
            </Text>
            <Text
              fontSize={"xs"}
              letterSpacing={"widest"}
              display={"inline-flex"}
              alignItems={"center"}
            >
              <CircleIcon
                fill="#94F219"
                size="14"
                color="#94F219"
                className="mr-2"
              />
              Cumulative Savings
            </Text>
          </HStack>
        </Card.Header>
        <Card.Body>
          <Flex justifyContent={"flex-end"}>
            <Text fontSize={"2xl"} className="font-extralight">
              SAVING{" "}
              <Text as={"span"} className="font-bold">
                {formattedCurrency}
              </Text>
            </Text>
          </Flex>
          {loading ||
            (isPlaceholderData && (
              <Center height={"400px"}>
                <Loader2 className="animate-spin" size={28} strokeWidth={2} />
              </Center>
            ))}

          {!loading && !isPlaceholderData && actualData.xaxis?.length === 0 && (
            <Center height={"400px"}>
              <Text color="white" fontSize={"lg"} letterSpacing={"widest"}>
                No data available
              </Text>
            </Center>
          )}

          {!loading && !isPlaceholderData && actualData.xaxis?.length > 0 && (
            <BreakEvenChart actualData={actualData} />
          )}
        </Card.Body>
      </Card.Root>
      <Card.Root bg="droidalBlack.300" color="white" border="none">
        <Card.Header
          letterSpacing={"widest"}
          fontSize={"lg"}
          fontWeight="normal"
        >
          Calculate actual ROI
        </Card.Header>
        <Card.Body className="relative">
          <Box className="w-1/2">
            {departments && departments.length > 0 && (
              <SimpleGrid columns={{ base: 1, md: 2 }}>
                <Box
                  cursor="pointer"
                  bg={selectedDepartment === "All" ? "#24406a" : "transparent"}
                  color={selectedDepartment === "All" ? "#fff" : "#818181"}
                  onClick={() => handleDepartmentClick("All")}
                  key={"All"}
                >
                  <HStack gap={2} px={2} my={2}>
                    <LucideGradientIcon IconComponent={ShieldIcon} size="24" />
                    <Text fontSize={"md"} color="inherit" fontWeight="semibold">
                      All
                    </Text>
                  </HStack>
                </Box>
                {departments.map((dept) => (
                  <Box
                    cursor="pointer"
                    bg={
                      selectedDepartment === dept.id ? "#24406a" : "transparent"
                    }
                    color={selectedDepartment === dept.id ? "#fff" : "#818181"}
                    onClick={() => handleDepartmentClick(dept.id)}
                    key={dept.id}
                  >
                    <HStack gap={2} px={2} my={2}>
                      <LucideGradientIcon
                        IconComponent={ShieldIcon}
                        size="24"
                      />
                      <Text
                        fontSize={"md"}
                        color="inherit"
                        fontWeight="semibold"
                      >
                        {dept.module_name}
                      </Text>
                    </HStack>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Box>
          <Box className="absolute top-4 right-4">
            <CustomSelect
              options={[
                {
                  label: "All",
                  value: "All",
                },
                ...agents.map((app) => ({
                  label: app.app_name,
                  value: app.id,
                })),
              ]}
              placeholder="All Agents"
              value={selectedAgents}
              onValueChange={setSelectedAgents}
              backgroundColor="#fff"
              color="#000"
              w={"300px"}
              bg="#fff"
              borderRadius="5px"
              css={{
                "& button": {
                  height: "30px !important",
                  minHeight: "30px !important",
                  borderRadius: "5px !important",
                },
              }}
            />
          </Box>
        </Card.Body>
      </Card.Root>
    </VStack>
  );
};

export default ActualSavings;

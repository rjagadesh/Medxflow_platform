import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { useGetRequestByType } from "@/hooks/query/agentsapp/useGetRequestByType";
import { Box } from "@chakra-ui/react/box";
import { Text } from "@chakra-ui/react/text";

const legendData = [
  { name: "New", value: 35, color: "#6ACEF6" },
  { name: "Success", value: 25, color: "#144B79" },
  { name: "Failure", value: 30, color: "#2280BA" },
  { name: "Pending", value: 10, color: "#21A3E3" },
];

const CustomLegend = ({ payload }) => {
  return (
    <div className="flex flex-col gap-6">
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-slate-300">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <Text color={"white"} className="text-sm">
            {entry.value}
          </Text>
        </div>
      ))}
    </div>
  );
};

export const RequestTypeChart = ({ agentId }) => {
  const { data: chartData = {} } = useGetRequestByType(agentId);

  let data = [
    { name: "Failure", y: chartData["FAILURE"] || 0 },
    { name: "Pending", y: chartData["PENDING"] || 0 },
    { name: "New", y: chartData["NEW"] || 0 },
    { name: "Success", y: chartData["SUCCESS"] || 0 },
  ];

  // Check if all values are 0
  const allZero = data.every((item) => item.y === 0);

  if (allZero) {
    data = [
      {
        name: "No Data",
        y: 1, // dummy value so pie renders
        color: "gray", // light grey for empty state
        dataLabels: {
          enabled: true,
          format: "No Data",
          style: { color: "#aaa", fontSize: "14px", fontWeight: "bold" },
        },
      },
    ];
  }

  const options = {
    chart: {
      type: "pie",
      backgroundColor: "transparent", // Dark background like your example
    },
    title: { text: "" }, // Remove title
    subtitle: { text: "" }, // Remove subtitle
    tooltip: {
      pointFormat: "{point.name}: <b>{point.percentage:.0f}%</b>",
    },
    legend: {
      enabled: false,
    },
    plotOptions: {
      pie: {
        size: "75%",
        innerSize: "70%",
        borderWidth: 0,
        borderRadius: 0,
        dataLabels: {
          enabled: true,
          distance: 20, // ✅ pushes labels outside the chart
          connectorColor: "gray", // ✅ matches arc color
          connectorWidth: 2,
          style: {
            color: "#fff",
            fontSize: "14px",
            fontWeight: "normal",
          },
          formatter: function () {
            // ✅ Skip labels (and connectors) when value is 0
            if (this.y === 0) {
              return null;
            }
            return this.point.name + " " + this.percentage.toFixed(0) + "%";
          },
        },
      },
    },
    colors: ["#2280BA", "#21A3E3", "#6ACEF6", "#144B79"], // Custom palette like your image
    series: [
      {
        name: "Categories",
        colorByPoint: true,
        data: data,
      },
    ],
  };

  return (
    <div className="relative bg-droidal-black-300 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6 absolute top-0 left-0">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-y-4 lg:gap-y-0">
          <Text
            letterSpacing={"widest"}
            fontSize={"xl"}
            className="font-semibold text-white"
          >
            Requests by type
          </Text>
        </div>
      </div>
      <Box w="100%" minH={{ sm: "200px" }}>
        <Box position="absolute" bottom="100px" left="24px">
          <CustomLegend
            payload={legendData.map((item) => ({
              value: item.name,
              color: item.color,
            }))}
          />
        </Box>
        <Box width="80%" marginLeft={"auto"}>
          <HighchartsReact highcharts={Highcharts} options={options} />
        </Box>
      </Box>
    </div>
  );
};

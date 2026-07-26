import { useGetRequestStatusByDay } from "@/hooks/query/agentsapp/useGetRequestStatusByDay";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { Box } from "@chakra-ui/react/box";
import { Text } from "@chakra-ui/react/text";

export const DailyCaseDistribution = ({ agent_id }) => {
  const { data: chartData = [] } = useGetRequestStatusByDay({
    agent_id,
    from_date: "2025-09-01",
    to_date: "2025-09-30",
  });

  // Helper: Get last N days data
  function getLastNDaysData(data, days = 30) {
    const today = new Date();
    const startDate = new Date();
    startDate.setDate(today.getDate() - days + 1); // include today

    return data.filter((item) => {
      const itemDate = new Date(item.date);
      return itemDate >= startDate && itemDate <= today;
    });
  }

  function groupByRanges(data) {
    const ranges = [
      { label: "1-3", min: 1, max: 3 },
      { label: "4-6", min: 4, max: 6 },
      { label: "7-9", min: 7, max: 9 },
      { label: "10-12", min: 10, max: 12 },
      { label: "13-15", min: 13, max: 15 },
      { label: "16-18", min: 16, max: 18 },
      { label: "19-21", min: 19, max: 21 },
      { label: "22-24", min: 22, max: 24 },
      { label: "25-27", min: 25, max: 27 },
      { label: "28-30", min: 28, max: 30 },
    ];

    const today = new Date();

    // Initialize output with 0 values
    const result = ranges.map((r) => ({
      range: r.label,
      Total: 0,
      Success: 0,
      Failure: 0,
    }));

    data.forEach((item) => {
      const itemDate = new Date(item.date);
      const diffDays =
        Math.floor((today - itemDate) / (1000 * 60 * 60 * 24)) + 1;
      // +1 so that today = 1, yesterday = 2, etc.

      const rangeIndex = ranges.findIndex(
        (r) => diffDays >= r.min && diffDays <= r.max
      );
      if (rangeIndex >= 0) {
        result[rangeIndex].Total +=
          item.NEW + item.PENDING + item.SUCCESS + item.FAILURE;
        result[rangeIndex].Success += item.SUCCESS;
        result[rangeIndex].Failure += item.FAILURE;
      }
    });

    return result;
  }

  const last30Days = getLastNDaysData(chartData, 30);
  const groupedData = groupByRanges(last30Days);

  console.log("groupedData", chartData, groupedData);

  // Build dynamic categories and series data
  const categories = groupedData.map((item) => item.range);
  const totalData = groupedData.map((item) => item.Total);
  const successData = groupedData.map((item) => item.Success);
  const failureData = groupedData.map((item) => item.Failure);

  const options = {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      height: 250,
    },
    title: { text: "" },
    xAxis: {
      categories: categories,
      labels: {
        style: { color: "#ccc", fontSize: "14px" },
      },
      lineColor: "#444",
      tickColor: "#444",
    },
    yAxis: {
      min: 0,
      title: { text: "" },
      gridLineColor: "#333",
      gridLineWidth: 0,
      labels: { style: { color: "#ccc" } },
      tickAmount: 6,
    },
    legend: { enabled: false },
    plotOptions: {
      column: {
        pointPadding: 0.05,
        groupPadding: 0.1,
        borderWidth: 0,
        borderRadius: 8, // top corners only, we'll override below for full radius
      },
    },
    tooltip: {
      shared: true,
      backgroundColor: "#2a2a2a",
      borderColor: "#444",
      style: { color: "#fff" },
      pointFormat:
        "<span style='color:{series.color}'>●</span> {series.name}: <b>{point.y}</b><br/>",
    },
    series: [
      {
        name: "Total",
        data: totalData,
        color: "#9e9e9e",
      },
      {
        name: "Failure",
        data: failureData,
        color: {
          linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
          stops: [
            [0, "rgba(255, 36, 13, 1)"], // bottom
            [1, "rgba(193, 0, 8, 1)"], // top
          ],
        },
      },
      {
        name: "Success",
        data: successData,
        color: {
          linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
          stops: [
            [0, "rgba(90, 147, 16, 1)"], // bottom
            [1, "rgba(148, 242, 25, 1)"], // top
          ],
        },
      },
    ],
  };

  return (
    <div className="bg-droidal-black-300 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-y-4 lg:gap-y-0">
          <Text
            letterSpacing={"widest"}
            className="text-xl font-semibold text-white"
          >
            Daily Case Distribution
          </Text>
        </div>
      </div>
      <Box w="85%" mx="auto" minH={{ sm: "230px" }}>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </Box>
    </div>
  );
};

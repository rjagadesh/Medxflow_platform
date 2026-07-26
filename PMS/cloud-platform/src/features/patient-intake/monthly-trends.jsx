import { useGetRequestStatusByMonth } from "@/hooks/query/agentsapp/useGetRequestStatusByMonth";
import { Box } from "@chakra-ui/react/box";
import { Text } from "@chakra-ui/react/text";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

export const MonthlyTrends = ({ agent_id }) => {
  const { data: chartData = [] } = useGetRequestStatusByMonth({
    agent_id,
    from_date: "2025-01-01",
    to_date: "2025-12-30",
  });

  function getMonthlyData(data) {
    const currentYear = new Date().getFullYear();

    // All months short names in order
    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    // Initialize array with 0 values for each month
    const result = monthLabels.map((m) => ({
      month: m,
      Overall: 0,
      Success: 0,
      Failure: 0,
    }));

    data.forEach((item) => {
      const [year, month] = item.month.split("-");
      if (parseInt(year) === currentYear) {
        const monthIndex = parseInt(month) - 1; // 0-based index
        result[monthIndex].Overall =
          item.NEW + item.PENDING + item.SUCCESS + item.FAILURE;
        result[monthIndex].Success = item.SUCCESS;
        result[monthIndex].Failure = item.FAILURE;
      }
    });

    return result;
  }

  const data = getMonthlyData(chartData);

  // Extract arrays for x-axis and series
  const categories = data.map((d) => d.month);
  const overallData = data.map((d) => d.Overall);
  const successData = data.map((d) => d.Success);
  const failureData = data.map((d) => d.Failure);

  const options = {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      height: 250,
    },
    title: { text: "" },
    xAxis: {
      categories,
      labels: {
        style: { color: "#ccc", fontSize: "13px" },
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
        groupPadding: 0.1,
        pointPadding: 0.05,
        borderWidth: 0,
        borderRadius: 8, // we'll override below for full radius
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
        name: "Overall",
        data: overallData,
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
            Monthly Trends
          </Text>
        </div>
      </div>
      <Box w="85%" mx="auto" minH={{ sm: "280px" }}>
        <HighchartsReact highcharts={Highcharts} options={options} />
      </Box>
    </div>
  );
};

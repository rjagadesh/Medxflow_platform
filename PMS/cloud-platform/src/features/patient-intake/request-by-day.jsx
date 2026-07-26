import { useGetRequestByDay } from "@/hooks/query/agentsapp/useGetRequestByDay";
import { getTime, parseISO } from "date-fns";
import { Box } from "@chakra-ui/react/box";
import { Text } from "@chakra-ui/react/text";
import { Center } from "@chakra-ui/react/center";
import React from "react";
import ReactApexChart from "react-apexcharts";

class LineChart extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      chartData: [],
      chartOptions: {},
    };
  }

  componentDidMount() {
    const { lineChartData, lineChartOptions } = this.props;

    this.setState({
      chartData: lineChartData,
      chartOptions: lineChartOptions,
    });
  }

  render() {
    return (
      <ReactApexChart
        options={this.state.chartOptions}
        series={this.state.chartData}
        type="area"
        width="100%"
        height="100%"
      />
    );
  }
}

export const RequestByDay = ({ agent_id }) => {
  const fromData = "2025-09-01";
  const toDate = "2025-09-30";
  const { data: chartData = [] } = useGetRequestByDay({
    from_date: fromData,
    to_date: toDate,
    agent_id: agent_id,
  });

  const lineChartOptionsDashboard = {
    chart: {
      toolbar: {
        show: false,
      },
    },
    tooltip: {
      theme: "dark",
      shared: true,
      intersect: false,
      // Remove the conflicting x format and use custom formatter instead
      x: {
        formatter: function (val) {
          const date = new Date(val);
          return date.toLocaleDateString("en-US", {
            month: "short",
            day: "2-digit",
            year: "numeric",
          });
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    stroke: {
      curve: "smooth",
    },
    xaxis: {
      type: "datetime",
      labels: {
        style: {
          colors: "gray",
          fontSize: "12px",
        },
        formatter: function (value, timestamp) {
          const date = new Date(timestamp || value);
          return date.toLocaleDateString("en-US", {
            day: "2-digit",
            month: "short",
          });
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          colors: "gray",
          fontSize: "12px",
        },
      },
    },
    legend: {
      show: true,
      position: "top",
      horizontalAlign: "right",
    },
    grid: {
      strokeDashArray: 5,
      borderColor: "#ababbd",
    },
    colors: ["#6ACEF6"],
    fill: {
      type: "gradient",
      gradient: {
        shade: "dark",
        type: "vertical",
        shadeIntensity: 0.5,
        inverseColors: true,
        opacityFrom: 0.8,
        opacityTo: 0,
        stops: [],
        gradientToColors: ["#364522"],
      },
    },
  };

  // Convert into [timestamp, value] pairs with validation
  const requestsData = chartData
    .filter((item) => item.date && item.count !== undefined) // Filter out invalid data
    .map((item) => {
      try {
        const timestamp = getTime(parseISO(item.date));
        return [timestamp, item.count];
      } catch (error) {
        console.warn("Invalid date format:", item.date);
        return null;
      }
    })
    .filter(Boolean); // Remove null values

  console.log("requestsData", requestsData);

  const lineChartDataDashboard = [
    {
      name: "Requests",
      data: requestsData,
    },
  ];

  return (
    <div className="bg-droidal-black-300 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-y-4 lg:gap-y-0">
          <Text
            letterSpacing={"widest"}
            fontSize={"xl"}
            className="font-semibold text-white"
          >
            Requests by Day
          </Text>
        </div>
      </div>
      <Box w="90%" mx="auto" minH={{ sm: "300px", px: 10 }}>
        {requestsData.length > 0 && (
          <LineChart
            lineChartData={lineChartDataDashboard}
            lineChartOptions={lineChartOptionsDashboard}
          />
        )}
        {requestsData.length === 0 && (
          <Center minHeight={"280px"}>
            <Text color="white" fontSize="lg" letterSpacing={"widest"}>
              No Data Found
            </Text>
          </Center>
        )}
      </Box>
    </div>
  );
};

"use client";

import { Box, Center, HStack, SegmentGroup, Text } from "@chakra-ui/react";
import {
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Area,
  AreaChart,
  Tooltip,
} from "recharts";
import ResourceDistributionChart from "./donut-chart";
import { useGetTokenUsage } from "@/hooks/query/agentsapp/useGetTokenUsage";
import DateRangeCalendar from "@/components/data-range-picker/date-range-picker";
import { eachDayOfInterval, format } from "date-fns";
import { useMemo, useState } from "react";
import { Loader } from "lucide-react";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";

const BarChartComponent = ({ data }) => {
  const xAxis = data.map((d) => d.date);
  const tokens = data.map((d) => d.token);
  const requests = data.map((d) => d.request);
  const costs = data.map((d) => d.cost);

  const options = {
    chart: {
      type: "column",
      backgroundColor: "transparent",
      height: 320,
    },
    title: { text: "" },
    xAxis: {
      categories: xAxis,
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
        name: "Token",
        data: tokens,
        color: {
          linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
          stops: [
            [0, "rgba(0, 91, 127, 1)"], // bottom
            [1, "rgba(0, 187, 242, 1)"], // top
          ],
        },
      },
      {
        name: "Request",
        data: requests,
        color: {
          linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
          stops: [
            [0, "rgba(90, 147, 16, 1)"], // bottom
            [1, "rgba(148, 242, 25, 1)"], // top
          ],
        },
      },
      {
        name: "Cost",
        data: costs,
        color: {
          linearGradient: { x1: 0, y1: 1, x2: 0, y2: 0 },
          stops: [
            [0, "rgba(255, 137, 3, 1)"], // bottom
            [1, "rgba(255, 72, 16, 1)"], // top
          ],
        },
      },
    ],
  };
  return <HighchartsReact highcharts={Highcharts} options={options} />;
};

export default function ChartSection({ chartData = {} }) {
  const [dateRange, setDateRange] = useState({
    startDate: new Date("2025-10-01"),
    endDate: new Date("2025-10-30"),
  });
  const [chartType, setChartType] = useState("Line");
  const { data: tokenUsage, isLoading: loading } = useGetTokenUsage({
    start_date: format(dateRange.startDate, "yyyy-MM-dd"),
    end_date: format(dateRange.endDate, "yyyy-MM-dd"),
    group_by: "day",
  });

  const breakdown = tokenUsage?.results?.breakdown;

  console.log("tokenUsage1212", tokenUsage, loading);
  const total =
    chartData.projects_count +
    chartData.tasks_count +
    chartData.triggers_count +
    chartData.queues_count +
    chartData.machines_count;

  const barData = [
    { name: "Project", value: chartData.projects_count, color: "#3B82F6" },
    { name: "Machine", value: chartData.machines_count, color: "#10B981" },
    { name: "Queues", value: chartData.queues_count, color: "#F59E0B" },
    { name: "Trigger", value: chartData.triggers_count, color: "#EF4444" },
    { name: "Tasks", value: chartData.tasks_count, color: "#8B5CF6" },
  ].map((item) => ({
    ...item,
    value: total > 0 ? (item.value / total) * 100 : 0, // convert to percentage
  }));

  const tokenChartsData = useMemo(() => {
    const dateList = eachDayOfInterval({
      start: dateRange.startDate,
      end: dateRange.endDate,
    }).map((item) => format(item, "yyyy-MM-dd"));
    console.log("dates999", dateRange.startDate, dateRange.endDate, dateList);
    const breakdown = tokenUsage?.results?.breakdown || [];
    const dataList = dateList.map((item) => {
      const find = breakdown.find((i) => i.period === item);
      if (find) {
        return {
          date: item,
          token: find.total_tokens,
          request: find.total_requests,
          cost: find.total_cost,
        };
      }
      return {
        date: item,
        token: 0,
        request: 0,
        cost: 0,
      };
    });

    return dataList;
  }, [dateRange.endDate, dateRange.startDate, tokenUsage]);

  console.log("tokenChartsData", tokenChartsData);

  return (
    <div className="space-y-8 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-droidal-black-300 shadow-md rounded-2xl p-8 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <Text
              letterSpacing={"widest"}
              className="font-bold text-white"
              fontSize={{
                base: "13px",
                "2xl": "15px",
                "3xl": "xl",
              }}
            >
              Resource Distribution
            </Text>
          </div>
          <div className="h-[300px]">
            <ResourceDistributionChart chartData={chartData} />
          </div>
        </div>

        <div className="bg-droidal-black-300 shadow-md rounded-2xl p-8 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-6">
            <h3
              fontSize={{
                base: "13px",
                "2xl": "15px",
                "3xl": "xl",
              }}
              className="font-bold text-white"
            >
              Performance Metrics
            </h3>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 0, right: 30, left: 0, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  horizontal={true}
                  vertical={true}
                  stroke="#5A5A5A"
                />

                <defs>
                  <linearGradient
                    id="processGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#00BBF2" stopOpacity={1} />
                    <stop offset="72%" stopColor="#005B7F" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 8, fill: "#90a6c6" }}
                  axisLine={{ stroke: "#90a6c6" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#90a6c6" }}
                  axisLine={{ stroke: "#90a6c6" }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={52}>
                  <Cell fill="url(#processGradient)" />
                  <Cell fill="url(#processGradient)" />
                  <Cell fill="url(#processGradient)" />
                  <Cell fill="url(#processGradient)" />
                  <Cell fill="url(#processGradient)" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-droidal-black-300 shadow-md mt-6 rounded-2xl p-8 hover:shadow-lg transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-white">Studio token usage</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#00BBF2] rounded-full"></div>
              <span className="text-sm text-[#90a6c6]">Token</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#5a9310] rounded-full"></div>
              <span className="text-sm text-[#90a6c6]">Requests</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#ff8903] rounded-full"></div>
              <span className="text-sm text-[#90a6c6]">Cost</span>
            </div>
          </div>
        </div>
        <div id="token-chart" className="h-80 pt-4 relative">
          <Box position={"absolute"} top="-5" right="0">
            <HStack alignItems={"center"} justifyContent={"center"} gap={2}>
              <DateRangeCalendar
                inputProps={{
                  size: {
                    base: "2xs",
                    "2xl": "xs",
                    "3xl": "sm",
                  },
                }}
                date={dateRange}
                onChange={setDateRange}
              />
              <SegmentGroup.Root
                size={{
                  base: "sm",
                }}
                position={"relative"}
                top={"3px"}
                bgColor={"#000"}
                value={chartType}
                css={{
                  '& [data-state="checked"]': {
                    bgImage: "var(--bg-blue-gradient)",
                    color: "#fff",
                  },
                }}
                onValueChange={(v) => {
                  setChartType(v.value);
                }}
              >
                <SegmentGroup.Indicator />
                <SegmentGroup.Items
                  cursor={"pointer"}
                  color={"#fff"}
                  items={["Bar", "Line"]}
                />
              </SegmentGroup.Root>
            </HStack>
          </Box>
          {loading && (
            <Center h="full">
              <Loader className="text-white animate-spin" />
            </Center>
          )}
          {!loading && breakdown?.length === 0 && (
            <Center h="full">
              <Text color={"white"}> No data found</Text>
            </Center>
          )}
          {!loading && breakdown?.length > 0 && (
            <>
              {chartType === "Line" && (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={tokenChartsData}
                    margin={{ top: 20, right: 0, left: 10, bottom: 5 }}
                  >
                    <defs>
                      <linearGradient
                        id="greenGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#5a9310"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#94f219"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                      <linearGradient
                        id="redGradient"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#ff8903"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="#ff4810"
                          stopOpacity={0.05}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#2f4d78" />
                    <XAxis
                      dataKey="date"
                      axisLine={{ stroke: "#90a6c6" }}
                      tickLine={false}
                      tick={{
                        fill: "#90a6c6",
                        fontSize: "10px !important",
                        fontWeight: 500,
                      }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      tickFormatter={(value) =>
                        value.length > 10 ? value.slice(0, 10) + "..." : value
                      }
                    />
                    <YAxis
                      tick={{ fontSize: 8, fill: "#90a6c6" }}
                      axisLine={{ stroke: "#90a6c6" }}
                      // label={{
                      //   value: "Token",
                      //   angle: -90,
                      //   position: "insideLeft",
                      // }}
                      width="auto"
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#1e1e1e",
                        border: "1px solid #333",
                        borderRadius: "8px",
                        color: "#fff",
                        fontSize: "12px",
                      }}
                      labelStyle={{ color: "#00BBF2", fontWeight: "bold" }}
                      formatter={(value, name) => {
                        if (name === "token") return [value, "Token"];
                        if (name === "request") return [value, "Request"];
                        if (name === "cost") return [`$${value}`, "Cost"];
                        return [value, name];
                      }}
                    />

                    <Area
                      type="monotone"
                      dataKey="token"
                      stackId="1"
                      stroke="#00BBF2"
                      fill="url(#processGradient)"
                      strokeWidth={3}
                    />
                    <Area
                      type="monotone"
                      dataKey="request"
                      stackId="2"
                      stroke="#5a9310"
                      fill="url(#greenGradient)"
                      strokeWidth={3}
                    />

                    <Area
                      type="monotone"
                      dataKey="cost"
                      stackId="3"
                      stroke="#ff8903"
                      fill="url(#redGradient)"
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
              {chartType === "Bar" && (
                <BarChartComponent data={tokenChartsData} />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

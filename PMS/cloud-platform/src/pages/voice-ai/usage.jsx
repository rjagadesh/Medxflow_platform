import { MetricCard } from "@/features/voice-ai/MetricCard";
import { Flex, HStack } from "@chakra-ui/react";
import { CheckCircle2 } from "lucide-react";
import { DatabaseIcon } from "lucide-react";
import { PhoneCall } from "lucide-react";
import React, { useState, useEffect, useCallback } from "react";
import { FiPhoneCall } from "react-icons/fi";
import { MdError, MdSync } from "react-icons/md";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Legend,
  CartesianGrid,
} from "recharts";
import VoiceAiHeader from "./components/voice-ai-header";
import { Box, Spinner, Center } from "@chakra-ui/react";
import CustomBreadcrumb from "@/components/breadcrumb/breadcrumb";
import UserMenu from "@/components/user-popover/user-popover";
import { useParams } from "react-router-dom";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";
import { atobDepartmentId } from "@/utils/helper";
import { TimerIcon } from "lucide-react";
import DateRangeCalendar from "@/components/data-range-picker/date-range-picker";
import { format } from "date-fns";
import { Span } from "@chakra-ui/react";

const DEFAULT_ANALYTICS_DATA = {
  metrics: {
    totalCalls: "0",
    recordsCreated: "0",
    completedCalls: "0",
    failedCalls: "0",
    inProgress: "0",
    totalDurationSeconds: "0",
  },
  statusData: [],
  durationData: [],
};

const STATUS_COLOR_MAP = {
  completed: "#00bbf2",
  failed: "#ef4444",
  "in progress": "#a855f7",
};

const toNumber = (value) => {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value === "string") {
    const parsed = Number(value.replaceAll(",", "").trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
};

const normalizeStatusData = (statusData) => {
  if (!Array.isArray(statusData)) return [];

  return statusData.map((entry) => {
    const statusName = entry?.name?.toLowerCase?.() || "";

    return {
      ...entry,
      value: toNumber(entry?.value),
      color: entry?.color || STATUS_COLOR_MAP[statusName] || "#6b7280",
    };
  });
};

const normalizeAnalyticsData = (response) => {
  const payload = response?.data ?? response;

  if (!payload || typeof payload !== "object") {
    return DEFAULT_ANALYTICS_DATA;
  }

  return {
    metrics: {
      ...DEFAULT_ANALYTICS_DATA.metrics,
      ...(payload.metrics || {}),
    },
    statusData: normalizeStatusData(payload.statusData),
    durationData: Array.isArray(payload.durationData)
      ? payload.durationData
      : [],
  };
};

const PERIOD_LABELS = {
  "24h": "Last 24 Hours",
  "1w": "Last 1 Week",
  "1m": "Last 30 Days",
  all: "All Time",
  custom: "Custom",
};

const getCurrentMonthName = () => {
  return new Date().toLocaleString("default", { month: "long" });
};

const getDefaultCustomRange = () => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 7);
  return { startDate, endDate };
};

const AnalyticsView = ({ app }) => {
  const [currentMonth] = useState(getCurrentMonthName());
  const [period, setPeriod] = useState(currentMonth); // Default current month
  const [customRange, setCustomRange] = useState(getDefaultCustomRange);
  const { department_id } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(DEFAULT_ANALYTICS_DATA);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    const departmentId = atobDepartmentId(department_id);
    let params = { period };

    if (period === currentMonth) {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      params = {
        period: "custom",
        start_date: format(startDate, "yyyy-MM-dd"),
        end_date: format(endDate, "yyyy-MM-dd"),
      };
    } else if (
      period === "custom" &&
      customRange?.startDate &&
      customRange?.endDate
    ) {
      params.start_date = format(customRange.startDate, "yyyy-MM-dd");
      params.end_date = format(customRange.endDate, "yyyy-MM-dd");
    }

    try {
      const response = await apiRequest(apiRoutes.voiceAI.analytics.get, {
        metadata: { id: departmentId },
        params,
      });
      if (response) {
        setData(normalizeAnalyticsData(response));
      }
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }, [department_id, period, customRange?.startDate, customRange?.endDate]);

  useEffect(() => {
    if (department_id) {
      if (period === "custom") {
        if (!customRange?.startDate || !customRange?.endDate) return;
      }
      fetchAnalytics();
    }
  }, [
    department_id,
    period,
    customRange?.startDate,
    customRange?.endDate,
    fetchAnalytics,
  ]);

  const { metrics, statusData, durationData } = data;
  const totalStatusCalls = statusData.reduce(
    (total, item) => total + toNumber(item?.value),
    0,
  );
  const completedCount = toNumber(
    statusData.find(
      (item) =>
        item?.name?.toLowerCase?.() === "completed" ||
        item?.name?.toLowerCase?.() === "success",
    )?.value,
  );
  const completedPercentage =
    totalStatusCalls > 0
      ? Math.round((completedCount / totalStatusCalls) * 100)
      : 0;

  return (
    <Flex direction="column" w="full">
      <style>
        {`
          body {
        margin: 0;
        overflow: hidden; /* Prevent full page scroll, handle inside containers */
      }
      
      .neon-gradient-btn {
        background: linear-gradient(180deg, rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%);
        box-shadow: 0 0 15px rgba(0, 187, 242, 0.4);
        transition: all 0.3s ease;
      }
      .neon-gradient-btn:hover {
        box-shadow: 0 0 25px rgba(0, 187, 242, 0.6);
        transform: translateY(-1px);
      }

      .card-glow {
          border-width: 2px;
          border-color: #2f4d78;
          transition: all 0.3s ease;
      }
      
      .card-glow:hover {
        border-width: 2px;
        border-color: rgba(0, 187, 242, 0.3);
        box-shadow: 0 0 50px rgba(0, 187, 242, 0.05);
      }
      
      .sidebar-active {
        background: rgba(0, 187, 242, 0.1);
        color: #00bbf2;
        border-right: 3px solid #00bbf2;
      }
      
      /* Custom Scrollbar */
      .custom-scrollbar::-webkit-scrollbar {
        width: 4px;
        height: 4px;
      }
      .custom-scrollbar::-webkit-scrollbar-track {
        background: #000000;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb {
        background: #1A1A1A;
        border-radius: 10px;
      }
      .custom-scrollbar::-webkit-scrollbar-thumb:hover {
        background: #333;
      }
        `}
      </style>
      {app ? (
        <VoiceAiHeader hideVersionSelector={true} />
      ) : (
        <HStack justify={"space-between"} py={3}>
          <CustomBreadcrumb
            sidebarItems={[
              {
                name: "Agents",
                to: `/voice-ai/${department_id}`,
                end: true,
              },
              {
                name: "Analytics",
                to: `/voice-ai/${department_id}/analytics`,
              },
              {
                name: "Billing",
                to: `/voice-ai/${department_id}/billing`,
              },
            ]}
            suffix={`/voice-ai/${department_id}/`}
            search={location.search}
            fontSize={{
              base: "sm",
            }}
          />
          <div className="flex items-center gap-4">
            <UserMenu />
          </div>
        </HStack>
      )}
      <Box
        bgColor={"droidalBlack.300"}
        borderRadius={"12px"}
        className=" flex flex-col p-6 gap-y-8 animate-in fade-in duration-500"
      >
        {/* Header & Filter */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold text-white">
              Analytics Overview
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              Real-time performance metrics and call insights
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {period === "custom" && (
              <DateRangeCalendar
                date={customRange}
                onChange={setCustomRange}
                inputProps={{
                  size: "xs",
                  w: "230px",
                }}
              />
            )}
            <div className="flex bg-card-dark shrink-0 border border-border-dark rounded-lg p-1">
              {Object.keys({
                [currentMonth]: currentMonth,
                ...PERIOD_LABELS,
              }).map((p) => (
                <button
                  key={p}
                  onClick={() => setPeriod(p)}
                  className={`px-4 py-2 text-xs font-bold rounded-md transition-all ${
                    period === p
                      ? " neon-gradient-btn text-white shadow-lg shadow-primary/20"
                      : "text-gray-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {p === currentMonth ? p : PERIOD_LABELS[p]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Metrics Grid */}
        {loading ? (
          <Center h="200px">
            <Spinner color="primary.400" size="xl" />
          </Center>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <MetricCard
              title="Total Calls"
              value={toNumber(metrics.totalCalls)}
              change="+12%"
              changeLabel="vs prev"
              icon={<FiPhoneCall size={24} />}
              iconColorClass="text-[var(--chakra-colors-primary-400)]"
              iconBgClass="bg-primary/10"
            />
            <MetricCard
              title="Records Created"
              value={toNumber(metrics.recordsCreated)}
              change="+8.5%"
              changeLabel="vs prev"
              icon={<DatabaseIcon size={24} />}
              iconColorClass="text-[var(--chakra-colors-primary-400)]"
              iconBgClass="bg-neon-cyan/10"
            />
            <MetricCard
              title="Total Duration (min)"
              value={
                toNumber(metrics.totalDurationMinutes)
                  ? toNumber(metrics.totalDurationMinutes)
                  : 0
              }
              change="+8.5%"
              changeLabel="vs prev"
              icon={<TimerIcon size={24} />}
              iconColorClass="text-[var(--chakra-colors-primary-400)]"
              iconBgClass="bg-neon-cyan/10"
            />
            <MetricCard
              title="Completed"
              value={toNumber(metrics.completedCalls)}
              change="+14%"
              changeLabel="success rate"
              icon={<CheckCircle2 size={24} />}
              iconColorClass="text-[var(--chakra-colors-primary-400)]"
              iconBgClass="bg-green-500/10"
            />
            <MetricCard
              title="Failed"
              value={toNumber(metrics.failedCalls)}
              change="-2%"
              changeLabel="failure rate"
              icon={<MdError size={24} />}
              iconColorClass="text-red-500"
              iconBgClass="bg-red-500/10"
            />
            <MetricCard
              title="In Progress"
              value={toNumber(metrics.inProgress)}
              change="Live"
              changeLabel="active now"
              icon={<MdSync size={24} />}
              iconColorClass="text-[var(--chakra-colors-primary-400)]"
              iconBgClass="bg-purple-500/10"
            />
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Call Status - Pie Chart */}
          <div className="bg-card-dark border border-border-dark border-[#2f4d78] rounded-xl p-6 flex flex-col">
            <h4 className="text-lg font-bold text-white mb-2">
              Call Status Distribution
            </h4>
            <p className="text-xs text-gray-500 mb-6">
              Ratio of completed vs failed vs active calls
            </p>

            <div className="flex-1 min-h-[250px] relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0A0A0A",
                      borderColor: "#1A1A1A",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    itemStyle={{ color: "#fff" }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Center Text Overlay */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-4 text-center pointer-events-none">
                <div className="text-2xl font-bold text-white">
                  {completedPercentage}%
                </div>
                <div className="text-[10px] text-gray-500 uppercase tracking-widest">
                  Success
                </div>
              </div>
            </div>
          </div>

          {/* Call Duration Chart */}
          <div className="bg-card-dark border border-border-dark border-[#2f4d78] rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-lg font-bold text-white">Call Duration</h4>
                <p className="text-xs text-gray-500">
                  Average call duration (min)
                </p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Span
                    bg={"var(--bg-blue-gradient)"}
                    className="size-2 rounded-full bg-slate-700"
                  ></Span>{" "}
                  Duration
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={durationData}
                  margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="barGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#00bbf2" stopOpacity={0.8} />
                      <stop
                        offset="100%"
                        stopColor="#00bbf2"
                        stopOpacity={0.2}
                      />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1A1A1A"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    label={{
                      value: "Duration",
                      angle: -90,
                      position: "insideLeft",
                      fill: "#4b5563",
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "#ffffff05" }}
                    contentStyle={{
                      backgroundColor: "#0A0A0A",
                      borderColor: "#1A1A1A",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#9ca3af" }}
                    formatter={(value, name, entry) => {
                      const labelColor = "var(--bg-blue-gradient)";
                      return [
                        <span>
                          <span
                            style={{
                              background: labelColor,
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              display: "inline-block",
                              marginRight: "5px",
                            }}
                            className="w-2 h-2 rounded-full"
                          >
                            {" "}
                          </span>
                          {entry.name} : {entry.value}
                        </span>,
                      ];
                    }}
                  />
                  <Bar
                    dataKey="duration"
                    fill="url(#barGradient)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                    name="Avg Duration (min)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Call Volume Chart */}
          <div className="bg-card-dark border border-border-dark border-[#2f4d78] rounded-xl p-6 flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h4 className="text-lg font-bold text-white">Call Volume</h4>
                <p className="text-xs text-gray-500">Total Calls</p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 text-[10px] text-gray-400">
                  <Span
                    bg={"var(--bg-green-gradient)"}
                    className="w-2 h-2 rounded-full"
                  ></Span>{" "}
                  Volume
                </span>
              </div>
            </div>

            <div className="flex-1 min-h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={durationData}
                  margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="totalCallsGradient"
                      x1="0"
                      y1="1"
                      x2="0"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="rgba(90, 147, 16, 1)" />
                      <stop offset="100%" stopColor="rgba(148, 242, 25, 1)" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#1A1A1A"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }}
                    dy={10}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#6b7280", fontSize: 10 }}
                    label={{
                      value: "Volume",
                      angle: -90,
                      position: "insideLeft", // Changed from insideRight to insideLeft since it's now on the left
                      fill: "#4b5563",
                      fontSize: 10,
                    }}
                  />
                  <Tooltip
                    cursor={{ fill: "#ffffff05" }}
                    contentStyle={{
                      backgroundColor: "#0A0A0A",
                      borderColor: "#1A1A1A",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                    labelStyle={{ color: "#9ca3af" }}
                    formatter={(value, name, entry) => {
                      const labelColor = "var(--bg-green-gradient)";
                      return [
                        <span>
                          <span
                            style={{
                              background: labelColor,
                              width: "10px",
                              height: "10px",
                              borderRadius: "50%",
                              display: "inline-block",
                              marginRight: "5px",
                            }}
                            className="w-2 h-2 rounded-full"
                          >
                            {" "}
                          </span>
                          {entry.name} : {entry.value}
                        </span>,
                      ];
                    }}
                  />
                  <Bar
                    dataKey="calls"
                    fill="url(#totalCallsGradient)"
                    radius={[4, 4, 0, 0]}
                    barSize={20}
                    name="Total Volume/Calls"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Box>
    </Flex>
  );
};

export default AnalyticsView;

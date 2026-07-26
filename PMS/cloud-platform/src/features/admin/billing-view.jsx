import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Area,
  BarChart,
  Bar,
} from "recharts";
import { DateRangePicker } from "react-date-range";
import moment from "moment";
import {
  Calendar as CalendarIcon,
  Download,
  Users as AgentsIcon,
} from "lucide-react";
import { useGetBillingData } from "@/hooks/query/settings/useGetBilling";
import { useGETMe } from "@/hooks/query/useMe";
import { apiRoutes } from "@/services/api";
import { useGetAgentNames } from "@/hooks/query/settings/useGetAgentNames";
import { Box, Card, HStack, Text, VStack } from "@chakra-ui/react";
import GenericTable from "@/components/table/table";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import UnauthorizedPage from "@/pages/unauthorized";
import DateRangeCalendar from "@/components/data-range-picker/date-range-picker";

// --- Prediction Utility Functions ---
function calculateLinearRegression(data) {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: 0 };
  let sumX = 0,
    sumY = 0,
    sumXY = 0,
    sumX2 = 0;
  for (const point of data) {
    const x = moment(point.date).valueOf(); // Use timestamp for x
    const y = point.cost;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
  }
  const denominator = n * sumX2 - sumX * sumX;
  if (denominator === 0) return { slope: 0, intercept: sumY / n };
  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;
  return { slope, intercept };
}

function calculateIQR(data) {
  const n = data.length;
  if (n < 4) return 0;
  const sortedData = [...data].sort((a, b) => a - b);
  const q1Index = Math.floor(n / 4);
  const q3Index = Math.floor((3 * n) / 4);
  return sortedData[q3Index] - sortedData[q1Index];
}

function generateInterquartilePrediction(historicalData, endDate) {
  if (!historicalData || historicalData.length < 2) return [];
  
  const { slope, intercept } = calculateLinearRegression(historicalData);
  const errors = historicalData
    .map((d) => d.cost - (slope * moment(d.date).valueOf() + intercept))
    .sort((a, b) => a - b);
  const iqr = calculateIQR(errors);
  const errorMargin = iqr * 1.5;
  const predictions = [];
  
  const lastHistoricalDate = moment(historicalData[historicalData.length - 1].date);
  const predictionEndDate = moment(endDate);
  
  // Calculate number of days to predict (from day after last historical data to end date)
  const numPoints = predictionEndDate.diff(lastHistoricalDate, 'days');
  
  if (numPoints <= 0) return [];

  for (let i = 1; i <= numPoints; i++) {
    const futureDate = lastHistoricalDate.clone().add(i, "days");
    const futureTimestamp = futureDate.valueOf();
    const centralPrediction = slope * futureTimestamp + intercept;
    
    predictions.push({
      date: futureDate.format("YYYY-MM-DD"),
      prediction: parseFloat(Math.max(0, centralPrediction).toFixed(2)),
      predictionRange: [
        parseFloat(Math.max(0, centralPrediction - errorMargin).toFixed(2)),
        parseFloat((centralPrediction + errorMargin).toFixed(2)),
      ],
    });
  }
  return predictions;
}

// Helper function to check if date range covers full month
function isFullMonthRange(startDate, endDate) {
  const start = moment(startDate);
  const end = moment(endDate);
  
  return start.date() === 1 && end.isSame(end.endOf('month'), 'day');
}

// Helper function to get end of selected month
function getEndOfSelectedMonth(dateRange) {
  const endDate = moment(dateRange.endDate);
  return endDate.endOf('month').toDate();
}

// --- Styles ---
const styles = {
  cardBox: {
    background: "#1e4270",
    padding: "15px",
    borderRadius: "8px",
    color: "white",
    flexShrink: 0,
  },
  flexBox: {
    display: "flex",
    gap: "20px",
    flexWrap: "wrap",
    alignItems: "center",
  },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "10px" },
  tableCell: { border: "1px solid #ddd", padding: "10px", textAlign: "left" },
  tableHeader: {
    border: "1px solid #ddd",
    padding: "10px",
    textAlign: "left",
    background: "#1e4270",
  },
  datePickerWrapper: { position: "relative" },
  datePickerButton: {
    padding: "8px 12px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    background: "#1e4270",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "white",
  },
  popover: {
    position: "absolute",
    top: "calc(100% + 5px)",
    right: 0,
    zIndex: 10,
    background: "white",
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    borderRadius: "8px",
  },
  invoiceSection: {
    display: "flex",
    alignItems: "center",
    gap: "15px",
    marginTop: "20px",
    marginBottom: "20px",
  },
  dropdown: {
    padding: "8px 12px",
    border: "1px solid #ccc",
    borderRadius: "4px",
    background: "#1e4270",
    color: "white",
    cursor: "pointer",
    minWidth: "120px",
  },
  downloadButton: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "4px",
    background: "#2196f3",
    color: "white",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  chartToggle: { display: "flex", marginBottom: "10px", marginTop: "10px" },
  chartButton: {
    padding: "8px 15px",
    border: "1px solid #2196f3",
    background: "transparent",
    color: "#2196f3",
    cursor: "pointer",
  },
  chartButtonActive: { background: "#2196f3", color: "white" },
  tabsContainer: {
    display: "flex",
    marginBottom: "20px",
    borderBottom: "1px solid #555",
  },
  tabButton: {
    padding: "10px 20px",
    border: "none",
    background: "transparent",
    color: "#aaa",
    cursor: "pointer",
    fontSize: "1rem",
    borderBottom: "3px solid transparent",
  },
  tabButtonActive: { color: "white", borderBottom: "3px solid #2196f3" },
  topControls: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "20px",
    flexGrow: 1,
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modalContent: {
    background: "#1e4270",
    padding: "20px",
    borderRadius: "8px",
    color: "white",
    maxWidth: "400px",
    width: "100%",
    textAlign: "center",
  },
  modalButton: {
    padding: "8px 16px",
    border: "none",
    borderRadius: "4px",
    background: "#2196f3",
    color: "white",
    cursor: "pointer",
    marginTop: "15px",
  },
};

const datePickerStyles = `
    .custom-date-picker-popover .rdrCalendarWrapper {
        background-color: #282c34;
        color: #e0e6f1;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 10px 20px rgba(0,0,0,0.25);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    }
    .custom-date-picker-popover .rdrMonthAndYearWrapper {
        background-color: #21252b;
        padding: 10px 0;
    }
    .custom-date-picker-popover .rdrMonthAndYearPickers select {
        color: #e0e6f1;
        background-color: #3a3f48;
        border: 1px solid #4a4f58;
        border-radius: 4px;
        padding: 4px 8px;
    }
    .custom-date-picker-popover .rdrNextPrevButton {
        background-color: #3a3f48;
        border-radius: 50%;
        width: 28px;
        height: 28px;
    }
    .custom-date-picker-popover .rdrNextPrevButton:hover {
        background-color: #4a4f58;
    }
    .custom-date-picker-popover .rdrWeekDay {
        color: #8a92a0;
        font-weight: 500;
    }
    .custom-date-picker-popover .rdrDayNumber {
        transition: background-color 0.2s ease, color 0.2s ease;
    }
    .custom-date-picker-popover .rdrDayNumber span {
        color: #d1d9e6;
    }
    .custom-date-picker-popover .rdrDay:not(.rdrDayPassive) .rdrDayNumber:hover {
        background-color: #3a3f48;
        border-radius: 50%;
    }
    .custom-date-picker-popover .rdrDayPassive .rdrDayNumber span {
        color: #525864;
    }
    .custom-date-picker-popover .rdrDayToday .rdrDayNumber span:after {
        background: #2196f3;
        bottom: 2px;
        transform: translateX(-50%);
    }
    .custom-date-picker-popover .rdrSelected, .custom-date-picker-popover .rdrInRange, .custom-date-picker-popover .rdrStartEdge, .custom-date-picker-popover .rdrEndEdge {
      background: rgba(33, 150, 243, 0.2);
    }
    .custom-date-picker-popover .rdrStartEdge, .custom-date-picker-popover .rdrEndEdge {
      background: #2196f3;
    }
    .custom-date-picker-popover .rdrDay:not(.rdrDayPassive) .rdrInRange ~ .rdrDayNumber span,
    .custom-date-picker-popover .rdrDay:not(.rdrDayPassive) .rdrStartEdge ~ .rdrDayNumber span,
    .custom-date-picker-popover .rdrDay:not(.rdrDayPassive) .rdrEndEdge ~ .rdrDayNumber span {
        color: #fff;
        font-weight: 600;
    }
 
    /* --- NEW STYLES FOR PREDEFINED RANGES --- */
    .custom-date-picker-popover .rdrStaticRanges {
        border-right: 1px solid #3a3f48;
        background-color: #21252b; /* Darker sidebar background */
    }
    .custom-date-picker-popover .rdrStaticRange {
        border: 0;
        padding: 0;
        background: transparent;
    }
    .custom-date-picker-popover .rdrStaticRangeLabel {
        display: block;
        width: auto;
        padding: 8px 16px;
        margin: 6px 12px;
        border-radius: 6px;
        color: #d1d9e6;
        font-weight: 500;
        transition: background-color 0.2s ease, color 0.2s ease;
    }
    .custom-date-picker-popover .rdrStaticRange:hover .rdrStaticRangeLabel {
        background: #3a3f48;
    }
    .custom-date-picker-popover .rdrStaticRange-selected .rdrStaticRangeLabel {
        background: #2196f3;
        color: #fff;
    }
`;

// Helper function to format numbers as currency with commas and two decimal places
const formatCurrency = (value) => {
  if (value === null || value === undefined) return "$0.00";
  const numValue = Number(value);
  return numValue.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Helper function to format numbers with commas and no decimal places
const formatNumberWithCommas = (value) => {
  if (value === null || value === undefined) return "0";
  const numValue = Number(value);
  return numValue.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload;
    if (dataPoint.isZeroPoint) return null;

    return (
      <div
        style={{
          background: "#1e4270",
          border: "1px solid #555",
          color: "white",
          padding: "10px",
          borderRadius: "5px",
        }}
      >
        <p style={{ margin: 0, marginBottom: "5px", fontWeight: "bold" }}>
          {moment(label).format("DD MMM YYYY")}
        </p>

        {dataPoint.cost !== undefined && (
          <p style={{ margin: 0, color: "#3b82f6" }}>
            Actual Cost : {formatCurrency(dataPoint.cost)}
          </p>
        )}

        {dataPoint.prediction !== undefined && !dataPoint.cost && (
          <>
            <p style={{ margin: 0, color: "#8884d8" }}>
              Predicted Cost : {formatCurrency(dataPoint.prediction)}
            </p>
            <p style={{ margin: 0, color: "#8884d8" }}>
              Prediction Range : {formatCurrency(dataPoint.predictionRange[0])}{" "}
              - {formatCurrency(dataPoint.predictionRange[1])}
            </p>
          </>
        )}
      </div>
    );
  }
  return null;
};

const BillingTabContent = ({
  title,
  chartData,
  tableData,
  chartType,
  tabIdentifier,
  showPrediction,
}) => {
  const isOverallTab = tabIdentifier === "overall";

  console.log("BillingTabContent received:", {
    title,
    chartDataLength: chartData?.length,
    chartData,
    tableDataLength: tableData?.length,
    chartType,
    tabIdentifier,
    isOverallTab,
    showPrediction,
  });

  return (
    <>
      {chartData && chartData.length > 0 && (
        <div
          style={{
            width: "100%",
            height: 300,
            marginTop: 10,
            marginBottom: 10,
          }}
        >
          <ResponsiveContainer>
            {chartType === "line" ? (
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#444"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) =>
                    tick === "0" ? "0" : moment(tick).format("DD MMM")
                  }
                  stroke="#888"
                  tick={{ fill: "#888" }}
                />
                <YAxis
                  domain={[0, "dataMax + 20"]}
                  tickFormatter={formatCurrency}
                  stroke="#888"
                  tick={{ fill: "#888" }}
                  width={100}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="cost"
                  name="Actual Cost"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={true}
                  activeDot={{ r: 8 }}
                />
                {isOverallTab && showPrediction && (
                  <Line
                    type="monotone"
                    dataKey="prediction"
                    name="Predicted Cost"
                    stroke="#8884d8"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    activeDot={{ r: 8 }}
                    connectNulls
                  />
                )}
                {isOverallTab && showPrediction && (
                  <Area
                    type="monotone"
                    dataKey={(data) => data.predictionRange || [0, 0]}
                    name="Prediction Range"
                    stroke={false}
                    fill="#8884d8"
                    fillOpacity={0.1}
                    connectNulls
                  />
                )}
              </LineChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#444"
                />
                <XAxis
                  dataKey="date"
                  tickFormatter={(tick) =>
                    tick === "0" ? "0" : moment(tick).format("DD MMM")
                  }
                  stroke="#888"
                  tick={{ fill: "#888" }}
                />
                <YAxis
                  domain={[0, "dataMax + 20"]}
                  tickFormatter={formatCurrency}
                  stroke="#888"
                  tick={{ fill: "#888" }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="cost" name="Actual Cost" fill="#2196f3" />
                {isOverallTab && showPrediction && (
                  <Bar
                    dataKey="prediction"
                    name="Predicted Cost"
                    fill="#8884d8"
                  />
                )}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </>
  );
};

const BillingView = () => {
  const [dateRange, setDateRange] = useState(
    {
      startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: new Date(),
    },
  );
  const { hasPermission } = usePermissions();
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [totalCost, setTotalCost] = useState(0);
  const [forecastedCost, setForecastedCost] = useState(0);
  const [chartType, setChartType] = useState("line");
  const [activeTab, setActiveTab] = useState("Overall");
  const [mainView, setMainView] = useState("Overall");
  const [selectedAgent, setSelectedAgent] = useState("all");
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isDownloading, setIsDownloading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const datePickerRef = useRef(null);
  const { data: userData, isLoading: userLoading } = useGETMe();

  // Validate dates before passing to hook
  const startDate = moment(dateRange.startDate).isValid()
    ? moment(dateRange.startDate).format("YYYY-MM-DD")
    : moment().subtract(30, "days").format("YYYY-MM-DD");
  const endDate = moment(dateRange.endDate).isValid()
    ? moment(dateRange.endDate).format("YYYY-MM-DD")
    : moment().format("YYYY-MM-DD");

  const { data: billingData, isLoading: billingLoading } = useGetBillingData({
    start_date: startDate,
    end_date: endDate,
  });
  const {
    data: agentNamesData,
    isLoading: agentNamesLoading,
    error: agentNamesError,
  } = useGetAgentNames({
    enabled: mainView === "Agents",
  });

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: moment().month(i).format("MMMM"),
  }));
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Calculate end of selected month for prediction
  const getEndOfSelectedMonth = () => {
    return moment(dateRange.endDate).endOf('month').toDate();
  };

  // Check if current date range covers full month
  const isFullMonth = useMemo(() => {
    return isFullMonthRange(dateRange.startDate, dateRange.endDate);
  }, [dateRange.startDate, dateRange.endDate]);

  // Check if we need to show prediction
  const showPrediction = useMemo(() => {
    // Only show prediction for Overall tab and when it's not a full month range
    return mainView === "Overall" && activeTab === "Overall" && !isFullMonth;
  }, [mainView, activeTab, isFullMonth]);

  // Get the prediction end date (end of selected month)
  const predictionEndDate = useMemo(() => {
    return getEndOfSelectedMonth();
  }, [dateRange.endDate]);

  const handleDownloadInvoice = async () => {
    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();

    if (
      selectedYear > currentYear ||
      (selectedYear === currentYear && selectedMonth >= currentMonth)
    ) {
      setShowModal(true);
      return;
    }

    setIsDownloading(true);

    try {
      console.log("Downloading invoice for:", {
        month: selectedMonth,
        year: selectedYear,
      });
      console.log("API Routes billing invoice:", apiRoutes.billing.invoice);

      const selectedDate = `${selectedYear}-${selectedMonth
        .toString()
        .padStart(2, "0")}-01`;

      let invoiceUrl;
      if (typeof apiRoutes.billing.invoice === "string") {
        invoiceUrl = apiRoutes.billing.invoice;
      } else if (
        apiRoutes.billing.invoice &&
        typeof apiRoutes.billing.invoice === "object"
      ) {
        invoiceUrl =
          apiRoutes.billing.invoice.url ||
          apiRoutes.billing.invoice.endpoint ||
          Object.values(apiRoutes.billing.invoice).find(
            (val) => typeof val === "string" && val.includes("/")
          );
      }

      if (!invoiceUrl) {
        throw new Error("Could not determine invoice API endpoint");
      }

      const baseUrl = invoiceUrl.startsWith("http")
        ? invoiceUrl
        : `${window.location.origin}${invoiceUrl}`;
      const url = new URL(baseUrl);
      url.searchParams.append("selected_date", selectedDate);

      console.log("Final URL:", url.toString());

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access")}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => null);
        const errorMessage =
          errorBody?.detail || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = downloadUrl;
      link.download = `invoice-${selectedYear}-${selectedMonth
        .toString()
        .padStart(2, "0")}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log("Invoice downloaded successfully");
    } catch (error) {
      console.error("Error downloading invoice:", error);
      setShowModal(true);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target)
      ) {
        setIsPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [datePickerRef]);

  const agentList = useMemo(() => {
    return agentNamesData?.agents || [];
  }, [agentNamesData]);

  const tabData = useMemo(() => {
    const allTransactions = billingData?.transactions_grouped || [];
    console.log("allTransactions:", allTransactions);
    const graphData = billingData?.license_cost || [];
    const apiCostData = billingData?.api_cost || [];
    const zeroPoint = { date: "0", cost: 0, isZeroPoint: true };

    // Filter license_cost to respect dateRange
    const start = moment(dateRange.startDate).startOf("day");
    const end = moment(dateRange.endDate).endOf("day");
    const dataStart =
      graphData.length > 0 ? moment(graphData[0].date).startOf("day") : start;
    const dataEnd =
      graphData.length > 0
        ? moment(graphData[graphData.length - 1].date).endOf("day")
        : end;

    const filteredGraphData = graphData.filter((item) =>
      moment(item.date).isBetween(dataStart, dataEnd, null, "[]")
    );

    let chartData = [];
    let tableData = [];

    if (mainView === "Agents") {
      tableData =
        selectedAgent === "all"
          ? allTransactions
          : allTransactions.filter((item) => item.app_name === selectedAgent);

      const agentChartSource = [];
      tableData.forEach((item) => {
        if (item.cost > 0) {
          const startDate = moment(item.start_date);
          const endDate = moment(item.end_date);
          const days = endDate.diff(startDate, "days") + 1;
          const dailyCost = item.cost / days;

          for (let i = 0; i < days; i++) {
            const currentDate = startDate
              .clone()
              .add(i, "days")
              .format("YYYY-MM-DD");
            if (moment(currentDate).isBetween(start, end, null, "[]")) {
              agentChartSource.push({
                date: currentDate,
                cost: parseFloat(dailyCost.toFixed(2)),
              });
            }
          }
        }
      });

      const aggregatedAgentDailyCosts = {};
      agentChartSource.forEach((item) => {
        aggregatedAgentDailyCosts[item.date] =
          (aggregatedAgentDailyCosts[item.date] || 0) + item.cost;
      });

      const finalAgentChartData = Object.keys(aggregatedAgentDailyCosts).map(
        (date) => ({
          date: date,
          cost: parseFloat(aggregatedAgentDailyCosts[date].toFixed(2)),
        })
      );

      const sortedAgentChartData = finalAgentChartData.sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );
      chartData = [zeroPoint, ...sortedAgentChartData];
    } else {
      let sourceForChartForOverall = [];

      switch (activeTab) {
        case "API cost":
          tableData = allTransactions
            .filter((item) => item.module_name)
            .map((item) => ({
              ...item,
              cost: item.cost,
            }));
          chartData = [
            zeroPoint,
            ...apiCostData
              .filter(
                (item) =>
                  item.api_cost > 0 &&
                  moment(item.date).isBetween(start, end, null, "[]")
              )
              .map((item) => ({ ...item, cost: item.api_cost })),
          ];
          break;

        case "Transaction cost":
          tableData = allTransactions.filter((item) => item.cost > 0);

          const transactionCostChartSource = [];
          tableData.forEach((item) => {
            const startDate = moment(item.startdate);
            const endDate = moment(item.enddate);
            const days = endDate.diff(startDate, "days") + 1;
            for (let i = 0; i < days; i++) {
              const currentDate = startDate.clone().add(i, "days");
              if (
                currentDate.isBetween(
                  dateRange.startDate,
                  dateRange.endDate,
                  null,
                  "[]"
                )
              ) {
                transactionCostChartSource.push({
                  date: currentDate.format("YYYY-MM-DD"),
                  cost: parseFloat((item.cost / days).toFixed(2)),
                });
              }
            }
          });

          const aggregatedDailyCosts = {};
          transactionCostChartSource.forEach((item) => {
            aggregatedDailyCosts[item.date] =
              (aggregatedDailyCosts[item.date] || 0) + item.cost;
          });

          chartData = Object.entries(aggregatedDailyCosts).map(
            ([date, cost]) => ({
              date,
              cost,
            })
          );

          chartData.sort((a, b) => new Date(a.date) - new Date(b.date));
          break;

        case "Overall":
        default:
          tableData = allTransactions;
          sourceForChartForOverall = filteredGraphData;
          const actualsDaily = sourceForChartForOverall.sort(
            (a, b) => new Date(a.date) - new Date(b.date)
          );
          const initialData = [zeroPoint, ...actualsDaily];

          console.log("Overall Tab - Initial data:", {
            actualsCount: actualsDaily.length,
            initialDataCount: initialData.length,
            firstPoint: initialData[0],
            lastPoint: initialData[initialData.length - 1],
          });

          if (actualsDaily.length > 1 && showPrediction) {
            // Only generate predictions if we need to show them
            const dailyPredictionData = actualsDaily.map((item) => ({
              date: item.date,
              cost: item.cost,
            }));

            // Use end of selected month for prediction instead of current month
            const predictionPoints = generateInterquartilePrediction(
              dailyPredictionData,
              predictionEndDate
            );
            const lastActualPoint = actualsDaily[actualsDaily.length - 1];

            if (lastActualPoint) {
              const bridgePoint = {
                date: lastActualPoint.date,
                cost: lastActualPoint.cost,
                prediction: lastActualPoint.cost,
                predictionRange: [lastActualPoint.cost, lastActualPoint.cost],
              };

              const combinedMap = {};
              initialData.forEach(
                (item) =>
                  (combinedMap[item.date] = {
                    ...combinedMap[item.date],
                    ...item,
                  })
              );
              [bridgePoint, ...predictionPoints].forEach(
                (item) =>
                  (combinedMap[item.date] = {
                    ...combinedMap[item.date],
                    ...item,
                  })
              );

              chartData = Object.values(combinedMap).sort((a, b) => {
                if (a.date === "0") return -1;
                if (b.date === "0") return 1;
                return new Date(a.date) - new Date(b.date);
              });
            } else {
              chartData = initialData;
            }
          } else {
            // If no prediction needed, just use the actual data
            chartData = initialData;
          }

          console.log("Overall Tab - Final chart data:", {
            length: chartData.length,
            firstPoint: chartData[0],
            lastPoint: chartData[chartData.length - 1],
            fullData: chartData,
            showPrediction,
            predictionEndDate: moment(predictionEndDate).format('YYYY-MM-DD'),
          });
          break;
      }
    }

    console.log(`Chart Data for ${mainView}/${activeTab}:`, chartData);
    console.log(`Table Data for ${mainView}/${activeTab}:`, tableData);
    return { chartData, tableData };
  }, [billingData, activeTab, mainView, selectedAgent, dateRange, showPrediction, predictionEndDate]);

  useEffect(() => {
    if (billingData) {
      const graphData = billingData.license_cost || [];
      console.log(
        "Calculating total and forecasted cost from graphData:",
        graphData
      );
      const actualTotal = graphData.length
        ? graphData[graphData.length - 1].cost
        : 0;
      
      if (graphData.length > 1 && showPrediction) {
        // Only calculate forecast if we need to show prediction
        const dailyPredictionData = graphData
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map((item) => ({
            date: item.date,
            cost: item.cost,
          }));
        
        const predictionPoints = generateInterquartilePrediction(
          dailyPredictionData,
          predictionEndDate
        );
        const lastForecast =
          predictionPoints.length > 0
            ? predictionPoints[predictionPoints.length - 1].prediction
            : actualTotal;
        setForecastedCost(lastForecast);
      } else {
        // If no prediction needed, forecast is the same as current total
        setForecastedCost(actualTotal);
      }
      setTotalCost(actualTotal);
    }
  }, [billingData, showPrediction, predictionEndDate]);

  const isLoading =
    mainView === "Agents"
      ? agentNamesLoading || billingLoading
      : billingLoading;

  if (userLoading || billingLoading) {
    return <div style={{ color: "white" }}>Loading...</div>;
  }

  if (!billingData || !billingData.license_cost) {
    return <div style={{ color: "white" }}>No billing data available.</div>;
  }

  const columns = [
    {
      title: "Date Range",
      accessor_key: "",
      render: (_, item) => (
        <Text>
          {item.start_date === item.end_date
            ? moment(item.start_date).format("DD MMM YYYY")
            : `${moment(item.start_date).format("DD MMM")} - ${moment(
                item.end_date
              ).format("DD MMM YYYY")}`}
        </Text>
      ),
    },
    {
      title: "Department",
      accessor_key: "module_name",
    },
    {
      title: "Agent",
      accessor_key: "app_name",
    },
    {
      title: "Transactions",
      accessor_key: "transaction_count",
      render: (transaction_count) => {
        return formatNumberWithCommas(transaction_count);
      },
    },
    {
      title: "Cost",
      accessor_key: "cost",
      render: (cost) => {
        return formatCurrency(cost);
      },
    },
  ];

  if (!hasPermission("billing_view", "view")) return <UnauthorizedPage />;

  return (
    <>
      <Card.Root w={"full"} bg={"droidalBlack.300"} border="none">
        <Card.Header
          color="white"
          letterSpacing={"widest"}
          fontSize={{
            base: "md",
            "2xl": "lg",
            "3xl": "xl",
          }}
          fontWeight={"semibold"}
        >
          Billing View
        </Card.Header>
        <Card.Body>
          <div style={{ color: "white", padding: "20px" }}>
            <style>{datePickerStyles}</style>
            <HStack
              justify={"flex-end"}
              gap={{
                base: "10px",
                "2xl": "12px",
                "3xl": "14px",
              }}
            >
              <Card.Root bgColor="transparent" borderColor="#000">
                <Card.Body px="22px" py="20px">
                  <VStack gap="6px" align={"flex-start"}>
                    <Text
                      fontSize={{
                        base: "md",
                        "2xl": "lg",
                        "3xl": "xl",
                      }}
                      lineHeight={{
                        base: "16px !important",
                        "2xl": "18px !important",
                        "3xl": "20px !important",
                      }}
                      color="white"
                      letterSpacing={"wider"}
                      fontWeight={"semibold"}
                    >
                      Total Cost
                    </Text>
                    <Text
                      fontSize={{
                        base: "sm",
                        "2xl": "md",
                        "3xl": "lg",
                      }}
                      color="#90a6c6"
                    >
                      ({moment(dateRange.startDate).format("DD MMM")} –{" "}
                      {moment(dateRange.endDate).format("DD MMM YYYY")})
                    </Text>
                    <Text
                      fontSize={{
                        base: "24px !important",
                        "2xl": "32px !important",
                        "3xl": "44px !important",
                      }}
                      lineHeight={{
                        base: "24px !important",
                        "2xl": "32px !important",
                        "3xl": "44px !important",
                      }}
                      fontWeight={200}
                      color="white"
                    >
                      {formatCurrency(totalCost)}
                    </Text>
                  </VStack>
                </Card.Body>
              </Card.Root>
              <Card.Root bgColor="transparent" borderColor="#000">
                <Card.Body px="22px" py="20px">
                  <VStack gap="6px" align={"flex-start"}>
                    <Text
                      fontSize={{
                        base: "md",
                        "2xl": "lg",
                        "3xl": "xl",
                      }}
                      lineHeight={{
                        base: "16px !important",
                        "2xl": "18px !important",
                        "3xl": "20px !important",
                      }}
                      color="white"
                      letterSpacing={"wider"}
                      fontWeight={"semibold"}
                    >
                      {showPrediction ? "Forecasted Cost" : "Current Cost"}
                    </Text>
                    <Text
                      fontSize={{
                        base: "sm",
                        "2xl": "md",
                        "3xl": "lg",
                      }}
                      color="#90a6c6"
                    >
                      {showPrediction 
                        ? `Projected until ${moment(predictionEndDate).format("MMM YYYY")} end`
                        : "Complete month data"
                      }
                    </Text>
                    <Text
                      fontSize={{
                        base: "24px !important",
                        "2xl": "36px !important",
                        "3xl": "48px !important",
                      }}
                      lineHeight={{
                        base: "24px !important",
                        "2xl": "36px !important",
                        "3xl": "48px !important",
                      }}
                      fontWeight={200}
                      color="white"
                    >
                      {formatCurrency(forecastedCost)}
                    </Text>
                  </VStack>
                </Card.Body>
              </Card.Root>
              <Card.Root
                minW={"230px"}
                bgColor="transparent"
                borderColor="#000"
              >
                <Card.Body px="22px" py="20px">
                  <VStack gap="6px" align={"flex-start"}>
                    <Text
                      fontSize={{
                        base: "md",
                        "2xl": "lg",
                        "3xl": "xl",
                      }}
                      lineHeight={{
                        base: "16px !important",
                        "2xl": "18px !important",
                        "3xl": "20px !important",
                      }}
                      color="white"
                      letterSpacing={"wider"}
                      fontWeight={"semibold"}
                    >
                      License Tier
                    </Text>
                    <Text
                      fontSize={{
                        base: "sm",
                        "2xl": "md",
                        "3xl": "lg",
                      }}
                      color="#90a6c6"
                    >
                      Current plan
                    </Text>
                    <Text
                      fontSize={{
                        base: "24px !important",
                        "2xl": "32px !important",
                        "3xl": "44px !important",
                      }}
                      lineHeight={{
                        base: "24px !important",
                        "2xl": "32px !important",
                        "3xl": "44px !important",
                      }}
                      fontWeight={200}
                      color="white"
                      textTransform={"capitalize"}
                    >
                      {userData?.license_tier}{" "}
                    </Text>
                  </VStack>
                </Card.Body>
              </Card.Root>
            </HStack>
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
              <div style={styles.topControls}>
                {mainView === "Agents" && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <AgentsIcon size={16} color="white" />
                    {agentNamesLoading ? (
                      <p style={{ color: "white" }}>Loading agents...</p>
                    ) : agentNamesError ? (
                      <p style={{ color: "red" }}>
                        Error: {agentNamesError.message}
                      </p>
                    ) : (
                      <select
                        style={styles.dropdown}
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                      >
                        <option value="all">All Agents</option>
                        {agentList.map((agentName) => (
                          <option key={agentName} value={agentName}>
                            {agentName}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
                <div style={styles.chartToggle}>
                  <button
                    style={{
                      ...styles.chartButton,
                      ...(chartType === "line" ? styles.chartButtonActive : {}),
                      borderTopLeftRadius: "4px",
                      borderBottomLeftRadius: "4px",
                      borderRight: "none",
                    }}
                    onClick={() => setChartType("line")}
                  >
                    Line
                  </button>
                  <button
                    style={{
                      ...styles.chartButton,
                      ...(chartType === "bar" ? styles.chartButtonActive : {}),
                      borderTopRightRadius: "4px",
                      borderBottomRightRadius: "4px",
                    }}
                    onClick={() => setChartType("bar")}
                  >
                    Bar
                  </button>
                </div>
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
              </div>
            </div>
            <div style={styles.tabsContainer}>
              <button
                style={{
                  ...styles.tabButton,
                  ...(mainView === "Overall" ? styles.tabButtonActive : {}),
                }}
                onClick={() => setMainView("Overall")}
              >
                Overall
              </button>
              <button
                style={{
                  ...styles.tabButton,
                  ...(mainView === "Agents" ? styles.tabButtonActive : {}),
                }}
                onClick={() => setMainView("Agents")}
              >
                Agents
              </button>
            </div>
            {mainView === "Overall" && (
              <div style={styles.tabsContainer}>
                {["Overall", "Transaction cost", "API cost"].map((tabName) => (
                  <button
                    key={tabName}
                    style={{
                      ...styles.tabButton,
                      ...(activeTab === tabName ? styles.tabButtonActive : {}),
                    }}
                    onClick={() => setActiveTab(tabName)}
                  >
                    {tabName}
                  </button>
                ))}
              </div>
            )}
            <BillingTabContent
              title={
                mainView === "Agents"
                  ? `Agents Breakdown (${
                      selectedAgent === "all" ? "All" : selectedAgent
                    })`
                  : `${activeTab}`
              }
              chartData={tabData.chartData}
              tableData={tabData.tableData}
              chartType={chartType}
              tabIdentifier={
                mainView === "Agents"
                  ? "agents"
                  : activeTab.toLowerCase().replace(" ", "-")
              }
              showPrediction={showPrediction}
            />
            <div style={styles.invoiceSection}>
              <label style={{ color: "white", fontWeight: "bold" }}>
                Download Invoice:
              </label>
              <select
                style={styles.dropdown}
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              >
                {monthOptions.map((month) => (
                  <option key={month.value} value={month.value}>
                    {month.label}
                  </option>
                ))}
              </select>
              <select
                style={styles.dropdown}
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <button
                style={{
                  ...styles.downloadButton,
                  opacity: isDownloading ? 0.7 : 1,
                }}
                onClick={handleDownloadInvoice}
                disabled={isDownloading}
              >
                <Download size={16} />
                {isDownloading ? "Downloading..." : "Download Invoice"}
              </button>
            </div>
            {showModal && (
              <div style={styles.modalOverlay}>
                <div style={styles.modalContent}>
                  <h3>Invalid Invoice Selection</h3>
                  <p>
                    Invoices are not available for the current or future months.
                    Please select a past month.
                  </p>
                  <button
                    style={styles.modalButton}
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </Card.Body>
      </Card.Root>
      <Box my={4}>
        <GenericTable
          columns={columns || []}
          data={tabData.tableData || []}
          loader={false}
          headerLoading={false}
          pagination={false}
          title={"Overall Breakdown"}
        />
      </Box>
    </>
  );
};

export default BillingView;
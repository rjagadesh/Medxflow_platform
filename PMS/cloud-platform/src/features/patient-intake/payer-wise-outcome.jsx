import { Box } from "@chakra-ui/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

const data = [
  { payer: "Aetna", Approved: 98, Denied: 12 },
  { payer: "Blue Cross", Approved: 35, Denied: 8 },
  { payer: "Cigna", Approved: 25, Denied: 5 },
  { payer: "Humana", Approved: 15, Denied: 3 },
  { payer: "Medicare", Approved: 102, Denied: 18 },
  { payer: "Medicaid", Approved: 45, Denied: 12 },
  { payer: "UnitedHealth", Approved: 75, Denied: 15 },
  { payer: "Anthem", Approved: 38, Denied: 9 },
  { payer: "Kaiser", Approved: 28, Denied: 6 },
  { payer: "Molina", Approved: 22, Denied: 4 },
  { payer: "Centene", Approved: 18, Denied: 3 },
  { payer: "WellCare", Approved: 15, Denied: 2 },
  { payer: "Tricare", Approved: 12, Denied: 2 },
  { payer: "BCBS", Approved: 8, Denied: 1 },
  { payer: "Other", Approved: 5, Denied: 1 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-3 bg-white border rounded-lg shadow-lg border-slate-200">
        <p className="mb-2 font-medium text-slate-800">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm text-slate-600">
              {entry.dataKey}: {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export const PayerAreaChart = () => {
  return (
    <div className="bg-droidal-black-300 rounded-2xl shadow-sm  overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-y-4 lg:gap-y-0">
          <h2 className="text-xl font-semibold text-white">
            Payer Wise Distribution
          </h2>
        </div>
      </div>
      <Box w="100%" minH={{ sm: "300px" }}>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <defs>
              <linearGradient id="DeniedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a5dad" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0a90bd" stopOpacity={0.1} />
              </linearGradient>
              <linearGradient id="ApprovedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#1a5dad" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#0a90bd" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#ababbd" />
            <XAxis
              dataKey="payer"
              tick={{ fontSize: 10, fill: "gray" }}
              axisLine={{ stroke: "#ababbd" }}
              angle={-45}
              textAnchor="end"
              height={80}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "gray" }}
              axisLine={{ stroke: "#ababbd" }}
              label={{ value: "Count", angle: -90, position: "insideLeft" }}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }} />
            <Area
              type="monotone"
              dataKey="Approved"
              stackId="1"
              stroke="#97009D"
              fill="url(#ApprovedGradient)"
              strokeWidth={2}
            />
            <Area
              type="monotone"
              dataKey="Denied"
              stackId="1"
              stroke="#1a5dad"
              fill="url(#DeniedGradient)"
              strokeWidth={2}
            />
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </div>
  );
};

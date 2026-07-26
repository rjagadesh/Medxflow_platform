import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  YAxis,
} from "recharts";

export const SpendChart = ({ data }) => {
  return (
    <div
      style={{
        borderColor: "#2f4d78",
      }}
      className="bg-card-dark border border-border-dark rounded-xl p-6 h-full flex flex-col"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h4 className="text-lg font-bold text-white">
            Historical Monthly Spend
          </h4>
          <p className="text-sm text-gray-500">
            Analysis of consumption over the last 6 months
          </p>
        </div>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg border border-border-dark bg-background-dark text-xs font-medium text-gray-300 hover:border-primary transition-colors">
            Export PDF
          </button>
          <button className="px-3 py-1.5 rounded-lg neon-gradient-btn text-white text-xs font-bold">
            Save Report
          </button>
        </div>
      </div>

      <div className="flex-1 w-full min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
          >
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00bbf2" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#00bbf2" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="month"
              axisLine={false}
              tickLine={false}
              tick={{ fill: "#6b7280", fontSize: 10, fontWeight: "bold" }}
              dy={10}
            />
            {/* YAxis hidden to match design but functional for scale */}
            <YAxis hide domain={["dataMin - 100", "dataMax + 100"]} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#0A0A0A",
                borderColor: "#1A1A1A",
                color: "#fff",
              }}
              itemStyle={{ color: "#00bbf2" }}
              cursor={{ stroke: "#1A1A1A", strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#00bbf2"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorAmount)"
              activeDot={{
                r: 6,
                fill: "#00bbf2",
                stroke: "#000",
                strokeWidth: 2,
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

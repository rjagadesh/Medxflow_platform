import { Box } from "@chakra-ui/react/box";
import {
  ResponsiveContainer,
  Legend,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
} from "recharts";

const data = [
  { year: "2023", Overall: 420, Approved: 350, Denied: 70 },
  { year: "2024", Overall: 480, Approved: 380, Denied: 100 },
];

export const YearlyChart = () => {
  return (
    <div className="bg-droidal-black-300 rounded-2xl shadow-sm  overflow-hidden">
      <div className="p-6 ">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-y-4 lg:gap-y-0">
          <h2 className="text-xl font-semibold text-white">
            Yearly Trends: Total, Approved, Denied
          </h2>
        </div>
      </div>
      <Box w="100%" minH={{ sm: "300px" }}>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ababbd" />
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: "gray" }}
              axisLine={{ stroke: "#ababbd" }}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "gray" }}
              axisLine={{ stroke: "#ababbd" }}
            />
            <Legend
              wrapperStyle={{
                paddingTop: "20px",
                fontSize: "12px",
                color: "gray",
              }}
            />
            <Bar
              dataKey="Overall"
              fill="url(#purpleGradient)"
              radius={[4, 4, 0, 0]}
              name="Overall"
            />
            <Bar
              dataKey="Approved"
              fill="url(#violetGradient)"
              radius={[4, 4, 0, 0]}
              name="Approved"
            />
            <Bar
              dataKey="Denied"
              fill="url(#grayGradient)"
              radius={[4, 4, 0, 0]}
              name="Denied"
            />
            <defs>
              <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#1a5dad" />
                <stop offset="100%" stopColor="#1a5dad" />
              </linearGradient>
              <linearGradient id="violetGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#97009D" />
                <stop offset="100%" stopColor="#97009D" />
              </linearGradient>
              <linearGradient id="grayGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d1d5db" />
                <stop offset="100%" stopColor="#9ca3af" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </Box>{" "}
    </div>
  );
};

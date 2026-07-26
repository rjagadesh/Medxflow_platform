import { Box } from "@chakra-ui/react/box";
import { Text } from "@chakra-ui/react/text";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const data = [
  { name: "Passed", value: 85.0, count: 850 },
  { name: "Failed", value: 15.0, count: 150 },
];

const COLORS = {
  Passed: "#a855f7",
  Failed: "#e5e7eb",
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="p-3 bg-white border rounded-lg shadow-lg border-slate-200">
        <p className="font-medium text-slate-800">{data.name}</p>
        <p className="text-sm text-slate-600">Count: {data.count}</p>
        <p className="text-sm text-slate-600">Percentage: {data.value}%</p>
      </div>
    );
  }
  return null;
};

export const ApprovalVsDenied = () => {
  return (
    <div className="bg-droidal-black-300 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-y-4 lg:gap-y-0">
          <h2 className="text-xl font-semibold text-white">
            Daily Case Distribution: Approval vs Denied
          </h2>
        </div>
      </div>
      <Box w="100%" minH={{ sm: "250px" }}>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <defs>
              <linearGradient id="purpleGradient2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4a25d0" />
                <stop offset="100%" stopColor="#876cea" />
              </linearGradient>
            </defs>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={
                    entry.name === "Passed"
                      ? "url(#purpleGradient2)"
                      : COLORS[entry.name]
                  }
                  stroke="none"
                />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <Box textAlign="center" mb={2}>
          <Text fontSize={"2xl"} fontWeight={"bold"} color={"primary.600"}>
            85.0%
          </Text>
          <Text fontSize={"md"} fontWeight={"medium"} color={"gray.400"}>
            Success Rate
          </Text>
        </Box>
      </Box>
    </div>
  );
};

import { Box, Flex, Text } from "@chakra-ui/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import { cardStyles, NEON_COLORS } from "../styles";

export default function Performance({ data }) {
  return (
    <Box flex="1" {...cardStyles} p={4}>
      <Flex mb={3}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            Performance Metrics
          </Text>
          <Text fontSize="xs" color="rgba(255,255,255,0.55)">
            Encounters per service group
          </Text>
        </Box>
      </Flex>

      <Box w="100%" h="260px">
        <ResponsiveContainer>
          <BarChart data={data} barSize={32}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.08)"
              vertical={false}
            />
            <XAxis
              dataKey="name"
              tick={{ fill: "white", fontSize: 10 }}
              axisLine={false}
            />
            <YAxis tick={{ fill: "white", fontSize: 10 }} axisLine={false} />
            <Tooltip
              contentStyle={{
                background: "#050608",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              labelStyle={{ color: "#fff" }}
            />
            <Bar dataKey="value" radius={[10, 10, 4, 4]}>
              {data.map((_, i) => (
                <Cell key={i} fill={NEON_COLORS[i]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

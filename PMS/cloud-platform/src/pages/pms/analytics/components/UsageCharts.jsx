import { Box, Flex, Text, HStack, Button } from "@chakra-ui/react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from "recharts";
import { cardStyles } from "../styles";

export default function UsageCharts({
  data,
  usageMode,
  setUsageMode,
  isMobile,
}) {
  return (
    <Box {...cardStyles} p={4} mb={8}>
      <Flex justify="space-between" mb={3}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            Collections vs Charges
          </Text>
          <Text fontSize="xs" color="rgba(255,255,255,0.6)">
            Track how much you bill vs how much you collect.
          </Text>
        </Box>

        <HStack spacing={2}>
          <Button
            size="xs"
            variant="outline"
            borderRadius="999px"
            onClick={() => setUsageMode("bar")}
            bg={usageMode === "bar" ? "#00C3FF" : "transparent"}
          >
            Bar
          </Button>
          <Button
            size="xs"
            variant="outline"
            borderRadius="999px"
            onClick={() => setUsageMode("line")}
            bg={usageMode === "line" ? "#00C3FF" : "transparent"}
          >
            Line
          </Button>
        </HStack>
      </Flex>

      <Box w="100%" h={{ base: "260px", md: "320px" }}>
        <ResponsiveContainer>
          {usageMode === "line" ? (
            <LineChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="date" tick={{ fill: "white" }} />
              <YAxis tick={{ fill: "white" }} />
              <Tooltip />
              <Legend />
              <Line dataKey="charges" stroke="#00C3FF" strokeWidth={2} />
              <Line dataKey="collections" stroke="#00E0B8" strokeWidth={2} />
              <Line dataKey="ar" stroke="#FFB84D" strokeWidth={2} />
            </LineChart>
          ) : (
            <BarChart data={data}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.1)"
              />
              <XAxis dataKey="date" tick={{ fill: "white" }} />
              <YAxis tick={{ fill: "white" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="charges" fill="#00C3FF" />
              <Bar dataKey="collections" fill="#00E0B8" />
              <Bar dataKey="ar" fill="#FFB84D" />
            </BarChart>
          )}
        </ResponsiveContainer>
      </Box>
    </Box>
  );
}

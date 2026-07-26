import React, { useState } from "react";
import {
  Box,
  Flex,
  HStack,
  SimpleGrid,
  Text,
  Spinner,
  Center,
  VStack,
} from "@chakra-ui/react";

import RangeChip from "./components/RangeChip";
import { cardStyles, NEON_COLORS } from "./styles";
import { useGetBillingAnalytics } from "@/hooks/query/pms/analytics/useGetBillingAnalytics";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from "recharts";

const RANGES = ["1w", "1m", "6m", "1y", "MTD"];

const tooltipStyle = {
  background: "#050608",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 10,
};
const axisTick = { fill: "rgba(255,255,255,0.7)", fontSize: 10 };

const money = (n) =>
  `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

/* ---------- small building blocks ---------- */
function SectionTitle({ children }) {
  return (
    <Text fontSize="lg" mb={3} color="rgba(255,255,255,0.68)" fontWeight="semibold">
      {children}
    </Text>
  );
}

function MetricCard({ label, metric, formatter = money }) {
  const value = metric?.display ?? formatter(metric?.value);
  const down = metric?.direction === "down";
  return (
    <Box {...cardStyles} p={4}>
      <Text
        fontSize="xs"
        textTransform="uppercase"
        letterSpacing="0.16em"
        color="rgba(255,255,255,0.55)"
        mb={2}
      >
        {label}
      </Text>
      <Text fontSize="3xl" fontWeight="semibold" color="#E9FBFF">
        {value}
      </Text>
      <Text mt={2} fontSize="xs" color={down ? "#ff6b81" : "#00E0B8"}>
        {down ? "↓" : "↑"} {Math.abs(metric?.delta ?? 0)}%{" "}
        <Text as="span" color="rgba(255,255,255,0.55)">
          vs previous period
        </Text>
      </Text>
    </Box>
  );
}

function ChartCard({ title, children, h = "260px", ...rest }) {
  return (
    <Box {...cardStyles} p={4} {...rest}>
      <Text
        fontSize="xs"
        textTransform="uppercase"
        letterSpacing="0.16em"
        color="rgba(255,255,255,0.55)"
        mb={3}
      >
        {title}
      </Text>
      <Box w="100%" h={h}>
        {children}
      </Box>
    </Box>
  );
}

function RankList({ items, labelKey, subKey }) {
  if (!items?.length)
    return (
      <Text fontSize="xs" color="rgba(255,255,255,0.4)">
        No data
      </Text>
    );
  return (
    <VStack align="stretch" spacing={2}>
      {items.map((it, i) => (
        <Flex key={i} justify="space-between" fontSize="xs">
          <Text color="#52e3ff" minW="70px">
            {it.amount}
          </Text>
          <Text flex="1" ml={2} noOfLines={1} color="rgba(255,255,255,0.8)">
            {subKey ? `${it[labelKey]} – ${it[subKey]}` : it[labelKey]}
          </Text>
        </Flex>
      ))}
    </VStack>
  );
}

/* ---------- page ---------- */
export default function AnalyticsMain() {
  const [range, setRange] = useState("6m");
  const { data, isLoading, isFetching } = useGetBillingAnalytics(range);

  const tm = data?.top_metrics || {};
  const series = data?.charges_vs_collections || [];
  const avgSeries = data?.avg_gross_charges_per_encounter || [];
  const procedures = data?.top_procedures || [];
  const payers = data?.top_payers || [];
  const claimsByStatus = data?.claims_by_status || [];
  const apptsByStatus = data?.appointments_by_status || [];
  const summary = data?.summary || {};

  return (
    <Box
      minH="100vh"
      bgGradient="linear(to-b, #050608, #020308)"
      color="white"
      px={{ base: 4, md: 8 }}
      py={6}
    >
      {/* HEADER */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Text fontSize={{ base: "lg", md: "2xl" }} fontWeight="semibold" letterSpacing="0.04em">
            Billing Analytics
          </Text>
          <Text mt={1} fontSize="xs" color="rgba(255,255,255,0.55)">
            Live overview of visits, charges, collections and receivables
          </Text>
        </Box>
        {isFetching && <Spinner size="sm" color="#00C3FF" />}
      </Flex>

      {/* FILTER BAR */}
      <Box {...cardStyles} p={{ base: 3, md: 4 }} mb={6}>
        <HStack spacing={2}>
          {RANGES.map((label) => (
            <RangeChip
              key={label}
              label={label}
              active={range === label}
              onClick={() => setRange(label)}
            />
          ))}
        </HStack>
      </Box>

      {isLoading ? (
        <Center py={20}>
          <Spinner size="xl" color="#00C3FF" />
        </Center>
      ) : (
        <>
          {/* TOP METRICS */}
          <Box mb={6}>
            <SectionTitle>Top of Mind</SectionTitle>
            <SimpleGrid columns={{ base: 1, sm: 2, xl: 4 }} spacing={4}>
              <MetricCard label="Gross Charges" metric={tm.gross_charges} />
              <MetricCard label="Net Collections" metric={tm.net_collections} />
              <MetricCard label="A/R Balance" metric={tm.ar_balance} />
              <MetricCard
                label="Encounters"
                metric={tm.total_encounters}
                formatter={(v) => `${v ?? 0}`}
              />
            </SimpleGrid>
          </Box>

          {/* CHARGES VS COLLECTIONS + AVG PER ENCOUNTER */}
          <Box mb={6}>
            <SectionTitle>Charges &amp; Collections</SectionTitle>
            <Flex gap={4} direction={{ base: "column", xl: "row" }}>
              <ChartCard title="Gross Charges vs Net Collections" flex="1.5">
                <ResponsiveContainer>
                  <AreaChart data={series} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gCharges" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C3FF" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#00C3FF" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gColl" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00E0B8" stopOpacity={0.5} />
                        <stop offset="95%" stopColor="#00E0B8" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="date" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} formatter={(v) => money(v)} />
                    <Legend />
                    <Area type="monotone" dataKey="charges" stroke="#00C3FF" strokeWidth={2.2} fill="url(#gCharges)" name="Charges" />
                    <Area type="monotone" dataKey="collections" stroke="#00E0B8" strokeWidth={2.2} fill="url(#gColl)" name="Collections" />
                  </AreaChart>
                </ResponsiveContainer>
              </ChartCard>

              <ChartCard title="Avg. Gross Charges / Encounter" flex="1">
                <ResponsiveContainer>
                  <LineChart data={avgSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="month" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} formatter={(v) => money(v)} />
                    <Line type="monotone" dataKey="value" stroke="#4DA3FF" strokeWidth={2.2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartCard>
            </Flex>
          </Box>

          {/* TOP PAYERS + PROCEDURES + CLAIMS STATUS */}
          <Box mb={6}>
            <SectionTitle>Where It Comes From</SectionTitle>
            <Flex gap={4} direction={{ base: "column", xl: "row" }} align="stretch">
              <ChartCard title="Top Payers (Collected)" flex="1.3">
                <ResponsiveContainer>
                  <BarChart data={payers} layout="vertical" margin={{ top: 4, right: 16, left: 20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
                    <XAxis type="number" tick={axisTick} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={axisTick} axisLine={false} tickLine={false} width={110} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} formatter={(v) => money(v)} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="value" name="Collected" radius={[0, 6, 6, 0]}>
                      {payers.map((_, i) => (
                        <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <Box flex="1" {...cardStyles} p={4}>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.16em" color="rgba(255,255,255,0.55)" mb={3}>
                  Top Procedures (Charged)
                </Text>
                <RankList items={procedures} labelKey="code" subKey="description" />
              </Box>

              <ChartCard title="Claims by Status" flex="1">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={claimsByStatus}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {claimsByStatus.map((_, i) => (
                        <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} />
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartCard>
            </Flex>
          </Box>

          {/* APPOINTMENTS BY STATUS + SUMMARY */}
          <Box mb={8}>
            <SectionTitle>Operations</SectionTitle>
            <Flex gap={4} direction={{ base: "column", xl: "row" }} align="stretch">
              <ChartCard title="Appointments by Status" flex="1.6">
                <ResponsiveContainer>
                  <BarChart data={apptsByStatus} margin={{ top: 4, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
                    <XAxis dataKey="status" tick={axisTick} axisLine={false} tickLine={false} interval={0} angle={-20} textAnchor="end" height={50} />
                    <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#fff" }} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                    <Bar dataKey="count" name="Appointments" radius={[6, 6, 0, 0]}>
                      {apptsByStatus.map((_, i) => (
                        <Cell key={i} fill={NEON_COLORS[i % NEON_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartCard>

              <Box flex="1" {...cardStyles} p={4}>
                <Text fontSize="xs" textTransform="uppercase" letterSpacing="0.16em" color="rgba(255,255,255,0.55)" mb={3}>
                  Practice Summary
                </Text>
                <SimpleGrid columns={2} spacingY={3} spacingX={4}>
                  {[
                    ["Total Patients", summary.total_patients ?? 0],
                    ["New This Month", summary.new_patients_month ?? 0],
                    ["Appointments", summary.total_appointments ?? 0],
                    ["Encounters", summary.total_encounters ?? 0],
                    ["Claims", summary.total_claims ?? 0],
                    ["Open A/R", summary.open_ar ?? "$0"],
                    ["Days Rev. Outstanding", summary.days_revenue_outstanding ?? 0],
                  ].map(([k, v]) => (
                    <Box key={k}>
                      <Text fontSize="lg" fontWeight="semibold" color="#E9FBFF">
                        {v}
                      </Text>
                      <Text fontSize="10px" color="rgba(255,255,255,0.5)" textTransform="uppercase" letterSpacing="0.1em">
                        {k}
                      </Text>
                    </Box>
                  ))}
                </SimpleGrid>
              </Box>
            </Flex>
          </Box>
        </>
      )}
    </Box>
  );
}

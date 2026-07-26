import { Box, Flex, Badge, VStack, HStack, Text } from "@chakra-ui/react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";
import { cardStyles, NEON_COLORS } from "../styles";

export default function ChargesMix({ data }) {
  return (
    <Box flex="1" {...cardStyles} p={4}>
      <Flex justify="space-between" align="center" mb={3}>
        <Box>
          <Text fontSize="sm" fontWeight="semibold">
            Charges Mix
          </Text>
          <Text fontSize="xs" color="rgba(255,255,255,0.55)">
            Distribution of billed services
          </Text>
        </Box>
        <Badge
          variant="outline"
          borderRadius="999px"
          borderColor="rgba(255,255,255,0.18)"
          px={2}
          py={1}
          fontSize="0.62rem"
        >
          This Period
        </Badge>
      </Flex>

      <Flex
        direction={{ base: "column", sm: "row" }}
        align="center"
        justify="space-between"
        gap={3}
      >
        <Box w={{ base: "100%", sm: "55%" }} h="220px">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                innerRadius={60}
                outerRadius={90}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={NEON_COLORS[i]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "#050608",
                  border: "1px solid rgba(255,255,255,0.15)",
                }}
                labelStyle={{ color: "#fff" }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Box>

        <VStack align="flex-start" spacing={2} w={{ base: "100%", sm: "45%" }}>
          {data.map((item, i) => (
            <HStack key={item.name} justify="space-between" w="100%">
              <HStack spacing={2}>
                <Box
                  w="10px"
                  h="10px"
                  borderRadius="full"
                  bg={NEON_COLORS[i]}
                />
                <Text fontSize="xs">{item.name}</Text>
              </HStack>
              <Text fontSize="xs">{item.value}%</Text>
            </HStack>
          ))}
        </VStack>
      </Flex>
    </Box>
  );
}

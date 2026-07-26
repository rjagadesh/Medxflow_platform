import { Flex, Select, Input } from "@chakra-ui/react";

export default function CollectionsFilters({ filters, setFilters }) {
  return (
    <Flex gap={4} align="center" mb={5}>
      <Select
        placeholder="Sort"
        bg="#1a1a1a"
        onChange={(e) => setFilters((f) => ({ ...f, sort: e.target.value }))}
      >
        <option value="recent">Most Recent</option>
        <option value="balance_high">High Balance</option>
      </Select>

      <Select
        placeholder="Last Statement"
        bg="#1a1a1a"
        onChange={(e) =>
          setFilters((f) => ({ ...f, laststatement: e.target.value }))
        }
      >
        <option value="<30">Less than 30 days</option>
        <option value="30-60">30–60 days</option>
        <option value=">60">Over 60 days</option>
      </Select>

      <Select
        placeholder="Balance"
        bg="#1a1a1a"
        onChange={(e) =>
          setFilters((f) => ({ ...f, balanceRange: e.target.value }))
        }
      >
        <option value="all">All</option>
        <option value="0-50">$0–$50</option>
        <option value="50-100">$50–$100</option>
      </Select>

      <Input
        w="300px"
        placeholder="Search patient balances..."
        bg="#1a1a1a"
        onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
      />
    </Flex>
  );
}

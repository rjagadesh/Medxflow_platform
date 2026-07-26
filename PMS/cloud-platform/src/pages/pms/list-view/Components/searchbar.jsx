import { Box, Text } from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";

export default function Searchbar({
  searchTerm,
  setSearchTerm,
  searchIn,
  setSearchIn,
  statusFilter,
  setStatusFilter,
  statusOptions,
  onSearch,
  onClear,
  options,
}) {
  return (
    <Box
      bg="droidalBlack.300"
      p={3}
      display="flex"
      alignItems="center"
      gap={4}
      rounded="md"
      w="full"
    >
      <Text color="white" fontSize="sm" whiteSpace="nowrap" fontWeight="light">
        Look For:
      </Text>

      <Box flex={1}>
        <CustomInput
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search..."
          h="40px"
        />
      </Box>

      <Text color="white" fontSize="sm" whiteSpace="nowrap" fontWeight="light">
        Status:
      </Text>

      <Box w="220px">
        <CustomSelect
          value={[statusFilter]}
          onValueChange={(v) => setStatusFilter(v[0] ?? "")}
          options={statusOptions}
          placeholder=""
        />
      </Box>

      <CustomButton h="40px" onClick={onSearch}>
        Find Now
      </CustomButton>

      <CustomButton
        variant="outline"
        h="40px"
        onClick={() => setStatusFilter("")}
      >
        Clear
      </CustomButton>
    </Box>
  );
}

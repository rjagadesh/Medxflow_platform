import { Flex, Text, Input, Select } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";

const Row = ({
  label,
  value,
  type = "text", // text | input | select | date
  options = [],
  onChange,
}) => {
  const renderValue = () => {
    switch (type) {
      case "input":
        return (
          <Input
            size="sm"
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            bg="#2a2a2a"
            borderColor="#3a3a3a"
            color="white"
            textAlign="right"
            _focus={{ borderColor: "#60a5fa" }}
          />
        );

      case "date":
        return (
          <Input
            size="sm"
            type="date"
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            bg="#2a2a2a"
            borderColor="#3a3a3a"
            color="white"
            textAlign="right"
            _focus={{ borderColor: "#60a5fa" }}
          />
        );

      case "select":
        return (
          <Select
            size="sm"
            value={value || ""}
            onChange={(e) => onChange?.(e.target.value)}
            bg="#2a2a2a"
            borderColor="#3a3a3a"
            color="white"
            textAlign="right"
            _focus={{ borderColor: "#60a5fa" }}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        );

      default:
        return (
          <Tooltip
            content={value || "-"}
            positioning={{ placement: "bottom-end" }}
            contentProps={{
              css: { fontSize: "15px", borderRadius: "sm" },
            }}
          >
            <Text
              fontSize="18px"
              color="white"
              fontWeight="350"
              flex="1"
              textAlign="right"
              whiteSpace="nowrap"
              overflow="hidden"
              textOverflow="ellipsis"
              cursor="default"
            >
              {value || "-"}
            </Text>
          </Tooltip>
        );
    }
  };

  return (
    <Flex align="center" py={1} w="100%" gap={4}>
      {/* LABEL */}
      <Text
        w="140px"
        fontSize="16px"
        color="gray.400"
        flexShrink={0}
        whiteSpace="nowrap"
      >
        {label}
      </Text>

      {/* VALUE */}
      {renderValue()}
    </Flex>
  );
};

export default Row;

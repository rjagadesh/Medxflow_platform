import { Button } from "@chakra-ui/react";

export default function RangeChip({ label, active, onClick }) {
  return (
    <Button
      size="sm"
      variant="ghost"
      fontSize="xs"
      px={3}
      py={2}
      borderRadius="999px"
      onClick={onClick}
      bg={active ? "rgba(0,195,255,0.24)" : "transparent"}
      _hover={{
        bg: active ? "rgba(0,195,255,0.32)" : "rgba(255,255,255,0.04)",
      }}
      border={active ? "1px solid #00C3FF" : "1px solid rgba(255,255,255,0.09)"}
      color={active ? "#E9FBFF" : "rgba(255,255,255,0.78)"}
      transition="all 0.18s ease-out"
    >
      {label}
    </Button>
  );
}

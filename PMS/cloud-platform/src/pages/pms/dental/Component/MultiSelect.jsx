import {
  Box,
  Select,
  Portal,
  Text,
  createListCollection,
  Grid,
} from "@chakra-ui/react";
import { useEffect, useRef, useState, useMemo } from "react";

const MultiSelectField = ({
  label,
  placeholder,
  items,
  value,
  onChange,
  multiple = false,
  maxSelections,
  size = "sm",
  width = "100%",
  bg = "#2b2b2b",
  borderColor = "#444",
}) => {
  const [error, setError] = useState("");
  const timerRef = useRef(null);

  const collection = useMemo(
    () =>
      createListCollection({
        items,
      }),
    [items]
  );

  const handleValueChange = (e) => {
    const nextValues = e.value ?? [];

    if (multiple && maxSelections && nextValues.length > maxSelections) {
      setError(`You can select up to ${maxSelections} item(s).`);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setError(""), 3000);
      return;
    }

    setError("");
    onChange(nextValues);
  };

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <Box>
      <Select.Root
        size={size}
        multiple={multiple}
        collection={collection}
        value={value}
        onValueChange={handleValueChange}
      >
        <Select.HiddenSelect />

        {/* FORM ROW — EVEN & BALANCED */}
        <Grid
          templateColumns="150px 1fr"
          alignItems="center"
          columnGap={4}
          py="2px"
        >
          {/* LABEL */}
          {label && (
            <Select.Label color="gray.300" fontSize="13px" lineHeight="32px">
              {label}
            </Select.Label>
          )}

          {/* CONTROL */}
          <Select.Control>
            <Select.Trigger bg={bg} borderColor={borderColor} h="32px" px="3">
              <Select.ValueText
                color="white"
                placeholder={placeholder}
                truncate
              />
            </Select.Trigger>

            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>
        </Grid>

        {/* DROPDOWN */}
        <Portal>
          <Select.Positioner>
            <Select.Content
              bg="#1f1f1f"
              color="white"
              border="1px solid"
              borderColor="gray.700"
              maxH="240px"
              overflowY="auto"
              py={1}
            >
              {collection.items.map((item) => (
                <Select.Item
                  key={item.value}
                  item={item}
                  px={3}
                  py={2}
                  _hover={{ bg: "gray.700" }}
                  _selected={{ bg: "gray.600" }}
                >
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>

      {/* ERROR — VISUALLY SEPARATED */}
      <Text
        fontSize="12px"
        color="red.400"
        mt={1}
        pl="150px"
        minH="16px"
        visibility={error ? "visible" : "hidden"}
        opacity={error ? 1 : 0}
        transition="opacity 0.2s ease"
      >
        {error || "placeholder"}
      </Text>
    </Box>
  );
};

export default MultiSelectField;

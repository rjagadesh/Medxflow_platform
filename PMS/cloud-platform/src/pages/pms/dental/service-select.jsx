"use client";

import {
  Portal,
  Select,
  createListCollection,
  Wrap,
  WrapItem,
  Tag,
  Text,
  Grid,
  Box,
  HStack,
} from "@chakra-ui/react";

const ServicesSelect = ({
  title = "",
  services = [],
  value = [],
  onChange,
}) => {
  // const collection = createListCollection({
  //   items: services.map((s) => ({ label: s, value: s })),
  // });

  const collection = createListCollection({
    items: services.map((d) => ({
      label: d,
      value: d,
    })),
  });

  return (
    <Wrap align="center" spacing={3}>
      {/* SMALL SELECT */}
      <WrapItem>
        <Select.Root
          multiple
          collection={collection}
          value={value}
          onValueChange={(e) => onChange(e.value)}
          size="sm"
          width="200px"
        >
          <Select.HiddenSelect />

          <Select.Control>
            <Select.Trigger>
              <Text fontSize="11px" color="white">
                {title}
              </Text>
            </Select.Trigger>

            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>

          <Portal>
            <Select.Positioner>
              <Select.Content bg="black" color="white">
                {collection.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                    <Select.ItemIndicator />
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
      </WrapItem>
    </Wrap>
  );
};

export default ServicesSelect;

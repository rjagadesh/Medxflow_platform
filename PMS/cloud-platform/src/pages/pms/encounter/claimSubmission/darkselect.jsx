import { Select, createListCollection } from "@chakra-ui/react";

const DarkSelect = ({ width, placeholder, options = [] }) => {
  const collection = createListCollection({
    items: options.map((opt) => ({
      label: opt,
      value: opt,
    })),
  });

  return (
    <Select.Root size="sm" width={width} collection={collection}>
      <Select.Trigger
        bg="#2b2b2b"
        borderColor="#444"
        color="white"
        h="32px"
        _hover={{ borderColor: "#666" }}
        _focus={{ borderColor: "#00bcd4" }}
      >
        <Select.Value placeholder={placeholder} />
      </Select.Trigger>

      <Select.Content bg="#2b2b2b" borderColor="#444" color="white">
        {collection.items.map((item) => (
          <Select.Item key={item.value} item={item}>
            {item.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
};

export default DarkSelect;

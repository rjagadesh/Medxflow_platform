import React, { useState, useEffect, useMemo } from "react";
import {
  Combobox,
  Field,
  Portal,
  Spinner,
  Box,
  Text,
  useListCollection,
  HStack,
  Avatar,
  Icon,
} from "@chakra-ui/react";
import { useSearchPayers } from "@/hooks/query/pms/patient/useSearchPayer";
import { useDebounce } from "@/hooks/useDebounce";
import { useSelectContext } from "@chakra-ui/react";
import { ChevronDownIcon } from "lucide-react";

const SelectValue = () => {
  const select = useSelectContext();
  const items = select.selectedItems;
  // const { name, avatar } = items[0]
  return <HStack>dfsfd</HStack>;
};

const PayerSearch = ({
  value,
  onChange,
  label,
  invalid,
  showError,
  errorMessage,
  labelProps,
  ...rest
}) => {
  const [inputValue, setInputValue] = useState("");
  const [selectedPayer, setSelectedPayer] = useState(null);
  const debouncedQuery = useDebounce(inputValue, 300);

  // Sync internal state with prop value changes
  // useEffect(() => {
  //   if (value !== undefined && value !== inputValue) {
  //     setInputValue(value || "");
  //   }
  // }, [value]);

  console.log("value1212", value);

  const inputUpdateValue = inputValue ? inputValue : value?.displayName;

  const shouldSearch = debouncedQuery?.length > 1;

  const { data, isLoading } = useSearchPayers(
    shouldSearch ? debouncedQuery : ""
  );

  const items = useMemo(() => data?.items || [], [data]);

  const { collection, set: setCollection } = useListCollection({
    initialItems: items,
    itemToString: (item) => item.payer.displayName,
    itemToValue: (item) => item.payer.displayName,
  });

  useEffect(() => {
    setCollection(items);
  }, [items, setCollection]);

  const handleInputValueChange = (details) => {
    console.log("details", details);
    setInputValue(details.inputValue);
    // Propagate changes to parent immediately as per original behavior
  };

  const handleValueChange = (details) => {
    console.log("details888", details);
    // When an item is selected from the dropdown
    const selectedItem = details.items[0];
    console.log("selectedItem", selectedItem);
    if (selectedItem) {
      // const name = selectedItem.payer.displayName;
      // setInputValue(name);
      setSelectedPayer(selectedItem);
      onChange && onChange(selectedItem?.payer);
    }
  };

  return (
    <Combobox.Root
      width="full"
      collection={collection}
      // value={inputValue ? [inputValue] : []}
      onInputValueChange={handleInputValueChange}
      onValueChange={handleValueChange}
      inputBehavior="autocomplete"
      size={"xs"}
      invalid={invalid}
    >
      <Field.Root invalid={invalid}>
        {label && (
          <Field.Label
            color="white"
            fontWeight="light"
            fontSize={{
              base: "xs",
              "2xl": "sm",
              "3xl": "md",
            }}
            letterSpacing="wider"
            mb={0}
            {...labelProps}
          >
            {label}
          </Field.Label>
        )}

        <Combobox.Control w="full">
          <Combobox.Trigger display={"block"} w="full">
            <HStack>
              {selectedPayer &&
                inputUpdateValue === selectedPayer.payer.displayName && (
                  <Avatar.Root shape="rounded" size="2xs">
                    <Avatar.Image
                      src={selectedPayer.payer.avatarUrl}
                      alt={selectedPayer.payer.displayName}
                    />
                    <Avatar.Fallback name={selectedPayer.payer.displayName} />
                  </Avatar.Root>
                )}
              <Box position={"relative"} w={"full"}>
                <Combobox.Input
                  placeholder={rest.placeholder}
                  color="white"
                  _placeholder={{ letterSpacing: "widest", color: "#90a6c6" }}
                  letterSpacing="widest"
                  borderColor="#2f4d78"
                  transition="all .2s ease-in-out"
                  _hover={{
                    outlineColor: "transparent",
                    border: "1px solid transparent",
                    bgClip: "padding-box, border-box",
                    backgroundOrigin: "padding-box, border-box",
                    backgroundImage:
                      "linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
                  }}
                  w="full"
                  value={inputUpdateValue}
                  onChange={(v) => setInputValue(v)}
                  // Apply any other rest props
                  autoComplete="off"
                />
                <Icon position="absolute" right={"1"} size={"sm"} top={"2"}>
                  <ChevronDownIcon color="#90a6c6" />
                </Icon>
              </Box>
            </HStack>
          </Combobox.Trigger>
        </Combobox.Control>

        {showError && <Field.ErrorText>{errorMessage}</Field.ErrorText>}
      </Field.Root>

      <Portal>
        <Combobox.Positioner>
          <Combobox.Content
            bg="droidalBlack.300"
            border="1px solid"
            borderColor="gray.600"
            borderRadius="md"
            boxShadow="lg"
            maxH="200px"
            overflowY="auto"
            minW="sm"
            zIndex={1000}
          >
            {isLoading ? (
              <Box p={2} textAlign="center">
                <Spinner size="xs" color="white" />
              </Box>
            ) : items.length > 0 ? (
              items.map((item) => (
                <Combobox.Item
                  key={item.payer.id || item.payer.displayName}
                  item={item}
                  _hover={{ bg: "droidalBlack.100", cursor: "pointer" }}
                  p={2}
                  color="white"
                  fontSize="sm"
                  borderBottom="1px solid"
                  borderColor="gray.700"
                >
                  <HStack>
                    <Avatar.Root shape="rounded" size="2xs">
                      <Avatar.Image
                        src={item.payer.avatarUrl}
                        alt={
                          item.matches?.displayName || item.payer.displayName
                        }
                      />
                      <Avatar.Fallback
                        name={
                          item.matches?.displayName || item.payer.displayName
                        }
                      />
                    </Avatar.Root>
                    <Text
                      dangerouslySetInnerHTML={{
                        __html:
                          item.matches?.displayName || item.payer.displayName,
                      }}
                    />
                  </HStack>

                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))
            ) : (
              shouldSearch && (
                <Box p={2} color="gray.400" fontSize="sm">
                  No results found
                </Box>
              )
            )}
          </Combobox.Content>
        </Combobox.Positioner>
      </Portal>
    </Combobox.Root>
  );
};

export default PayerSearch;

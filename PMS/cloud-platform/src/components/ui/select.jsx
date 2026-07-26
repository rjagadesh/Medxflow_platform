import { Combobox, createListCollection, Field } from "@chakra-ui/react";
import { ChevronDown } from "lucide-react";
import { memo, useEffect, useMemo, useState } from "react";

const Select = ({
  label,
  options,
  value,
  onValueChange,
  placeholder,
  labelProps = {},
  width = "full", // default to full width for trigger
  size = "md",
  ...rest
}) => {
  const [inputValue, setInputValue] = useState("");

  const selectedLabel = useMemo(() => {
    if (value && value.length > 0) {
      const selectedOption = options.find((opt) => opt.value === value[0]);
      return selectedOption ? selectedOption.label : "";
    }
    return "";
  }, [value, options]);

  useEffect(() => {
    if (selectedLabel) {
      setInputValue(selectedLabel);
    }
  }, [selectedLabel]);

  const filteredOptions = useMemo(() => {
    if (!inputValue) return options;

    // If input value matches the selected option's label, show all options
    if (value && value.length > 0) {
      const selectedOption = options.find((opt) => opt.value === value[0]);
      if (selectedOption && selectedOption.label === inputValue) {
        return options;
      }
    }

    return options.filter((item) =>
      item.label.toLowerCase().includes(inputValue.toLowerCase()),
    );
  }, [options, inputValue, value]);

  const collection = useMemo(
    () =>
      createListCollection({
        items: filteredOptions,
        itemToString: (item) => item.label,
        itemToValue: (item) => item.value,
      }),
    [filteredOptions],
  );

  return (
    <>
      <Field.Root>
        {label && (
          <Field.Label
            color="white"
            fontWeight={"light"}
            fontSize={{
              base: "xs",
              "2xl": "sm",
              "3xl": "md",
            }}
            letterSpacing={"wider"}
            {...labelProps}
          >
            {label}
          </Field.Label>
        )}

        <Combobox.Root
          collection={collection}
          value={value}
          inputValue={inputValue}
          onValueChange={(e) => onValueChange(e.value)}
          onInputValueChange={(e) => setInputValue(e.inputValue)}
          openOnClick
          width={width} // ← Control trigger width here
          positioning={{ sameWidth: false }}
          // ← Critical: dropdown NOT forced to match trigger width
          size={size}
        >
          <Combobox.Control>
            <>
              <Combobox.Input
                placeholder={placeholder}
                fontSize="sm"
                color="white"
                bg="droidalBlack.200"
                border="1px solid #2f4d78"
                _hover={{ borderColor: "#00BBF2" }}
                _focus={{
                  borderColor: "#00BBF2",
                  boxShadow: "0 0 0 2px #00BBF2",
                }}
              />
              <Combobox.IndicatorGroup>
                {value?.[0]?.length > 0 && (
                  <Combobox.ClearTrigger
                    aria-label="Clear value"
                    cursor={"pointer"}
                    _hover={{
                      color: "#fff",
                    }}
                    onClick={(e) => e.stopPropagation()}
                  />
                )}
                <Combobox.Trigger>
                  <ChevronDown size={16} />
                </Combobox.Trigger>
              </Combobox.IndicatorGroup>
            </>
          </Combobox.Control>

          <Combobox.Positioner>
            <Combobox.Content
              bg="droidalBlack.300"
              border="1px solid #2f4d78"
              py={1}
              overflowY="auto"
              boxShadow="lg"
              borderRadius="4px !important"
            >
              <Combobox.Empty className="p-2 text-sm text-gray-400">
                No items found
              </Combobox.Empty>

              {collection.items.map((item) => (
                <Combobox.Item
                  key={item.value}
                  item={item}
                  className="px-3 py-2 hover:bg-droidalBlack.100 cursor-pointer text-white text-sm"
                  _selected={{ bg: "droidalBlack.100" }}
                >
                  <Combobox.ItemText>{item.label}</Combobox.ItemText>
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Combobox.Root>
      </Field.Root>
    </>
  );
};

const CustomSelect = memo(Select);

export default CustomSelect;

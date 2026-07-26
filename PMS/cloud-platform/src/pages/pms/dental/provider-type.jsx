import {
  Portal,
  Select,
  createListCollection,
  Text,
  Box,
} from "@chakra-ui/react";
import { useState, useRef, useEffect } from "react";

/* ---------- DATA ---------- */

const frameworks = createListCollection({
  items: [
    { label: "MD (Doctor of Medicine)", value: "md" },
    { label: "DO (Doctor of Osteopathic Medicine)", value: "do" },
    { label: "NP (Nurse Practitioner)", value: "np" },
    { label: "PA (Physician Assistant)", value: "pa" },
    { label: "RN (Registered Nurse)", value: "rn" },
    { label: "LPN / LVN", value: "lpn_lvn" },
    { label: "DDS / DMD (Dentist)", value: "dds_dmd" },
    { label: "OD (Optometrist)", value: "od" },
    { label: "PharmD (Pharmacist)", value: "pharmd" },
    { label: "PT (Physical Therapist)", value: "pt" },
    { label: "OT (Occupational Therapist)", value: "ot" },
    { label: "SLP (Speech-Language Pathologist)", value: "slp" },
    { label: "LCSW", value: "lcsw" },
    { label: "LPC", value: "lpc" },
    { label: "Other", value: "other" },
  ],
});

const MAX_SELECTIONS = 4;

/* ---------- COMPONENT ---------- */

const ProviderType = ({ providerType, setProviderType, errors }) => {
  const [error, setError] = useState("");
  const timerRef = useRef(null);

  const handleChange = (e) => {
    const nextValues = e.value;

    if (nextValues.length > MAX_SELECTIONS) {
      setError(`You can select up to ${MAX_SELECTIONS} provider types only.`);

      // ⏱ reset timer if user keeps clicking
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setError("");
      }, 3000);

      return;
    }

    setError("");
    setProviderType(nextValues);
  };

  // 🧹 cleanup on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    // <>
    <Box w="100%">
      <Select.Root
        multiple
        collection={frameworks}
        size="sm"
        value={providerType}
        onValueChange={handleChange}
      >
        <Select.HiddenSelect />

        <Select.Label color="white" textAlign={"left"}>
          Select Provider Type{" "}
          <Text as="span" color="red">
            *
          </Text>
        </Select.Label>

        <Select.Control>
          <Select.Trigger>
            <Select.ValueText
              color="white"
              placeholder="Select provider type(s)"
            />
          </Select.Trigger>

          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>

        <Portal>
          <Select.Positioner>
            <Select.Content
              bg="black"
              color="white"
              border="1px solid"
              borderColor="gray.700"
              maxH="240px"
              overflowY="auto"
            >
              {frameworks.items.map((framework) => (
                <Select.Item
                  key={framework.value}
                  item={framework}
                  _hover={{ bg: "gray.700" }}
                  _selected={{ bg: "gray.600" }}
                >
                  {framework.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>

      {/* ---------- ERROR MESSAGE (LAYOUT SAFE + AUTO HIDE) ---------- */}
      {error ? (
        <Text
          fontSize="12px"
          color="red.400"
          opacity={error ? 1 : 0}
          transition="opacity 0.2s ease"
        >
          {error || "placeholder"}
        </Text>
      ) : (
        <></>
      )}
      {errors.providerType && (
        <Text fontSize="12px" color="#ef4444" mr="40px" textAlign={"left"}>
          {errors.providerType}
        </Text>
      )}
    </Box>
  );
};

export default ProviderType;

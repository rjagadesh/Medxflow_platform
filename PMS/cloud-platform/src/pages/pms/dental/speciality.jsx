import {
  Grid,
  Portal,
  Select,
  Text,
  createListCollection,
  Box,
} from "@chakra-ui/react";
import { useMemo } from "react";
import ProviderType from "./provider-type";

/* -------------------- SPECIALTIES -------------------- */

export const specialties = createListCollection({
  items: [
    { label: "Primary Care", value: "primary_care" },
    { label: "Cardiology", value: "cardiology" },
    { label: "Orthopedics", value: "orthopedics" },
    { label: "Neurology", value: "neurology" },
    { label: "Psychiatry", value: "psychiatry" },
    { label: "Dentistry", value: "dentistry" },
    { label: "Ophthalmology", value: "ophthalmology" },
    { label: "Radiology", value: "radiology" },
    { label: "Physical Therapy", value: "physical_therapy" },
  ],
});

/* -------------------- SUB-SPECIALTIES -------------------- */

export const subSpecialtiesMap = {
  primary_care: [
    { label: "Family Medicine", value: "family_medicine" },
    { label: "Internal Medicine", value: "internal_medicine" },
    { label: "Pediatrics", value: "pediatrics" },
    { label: "Geriatrics", value: "geriatrics" },
  ],
  cardiology: [
    { label: "Interventional Cardiology", value: "interventional_cardiology" },
    { label: "Electrophysiology", value: "electrophysiology" },
    { label: "Heart Failure", value: "heart_failure" },
  ],
  orthopedics: [
    { label: "Sports Medicine", value: "sports_medicine" },
    { label: "Spine Surgery", value: "spine_surgery" },
    { label: "Joint Replacement", value: "joint_replacement" },
  ],
  neurology: [
    { label: "Stroke", value: "stroke" },
    { label: "Epilepsy", value: "epilepsy" },
    { label: "Neurophysiology", value: "neurophysiology" },
  ],
  psychiatry: [
    { label: "Child & Adolescent Psychiatry", value: "child_psychiatry" },
    { label: "Addiction Psychiatry", value: "addiction_psychiatry" },
  ],
  dentistry: [
    { label: "General Dentistry", value: "general_dentistry" },
    { label: "Orthodontics", value: "orthodontics" },
    { label: "Oral Surgery", value: "oral_surgery" },
  ],
  ophthalmology: [
    { label: "Cataract Surgery", value: "cataract_surgery" },
    { label: "Retina Specialist", value: "retina_specialist" },
  ],
  radiology: [
    { label: "Diagnostic Radiology", value: "diagnostic_radiology" },
    { label: "Interventional Radiology", value: "interventional_radiology" },
  ],
  physical_therapy: [
    { label: "Orthopedic Rehab", value: "orthopedic_rehab" },
    { label: "Sports Rehab", value: "sports_rehab" },
  ],
};

/* -------------------- COMPONENT -------------------- */

const ProviderSpecialty = ({
  specialty,
  setSpecialty,
  providerType,
  subSpecialty,
  setSubSpecialty,
  setProviderType,
  errors,
}) => {
  const subSpecialties = useMemo(
    () =>
      createListCollection({
        items: subSpecialtiesMap[specialty] || [],
      }),
    [specialty]
  );

  return (
    <Box display={"flex"}>
      {/* <Grid
        w="100%"
        templateColumns={{ base: "1fr", lg: "1fr 1fr 1fr" }}
        gap={3}
      > */}

      <Box minW="12vw">
        <ProviderType
          providerType={providerType}
          setProviderType={setProviderType}
          errors={errors}
        />
      </Box>

      {/* SPECIALTY */}
      <Box minW="12vw" ml="10px">
        <Select.Root
          collection={specialties}
          size="sm"
          width="100%"
          value={specialty ? [specialty] : []}
          onValueChange={(e) => {
            const value = e.value[0];
            setSpecialty(value);
            setSubSpecialty(null);
          }}
        >
          <Select.HiddenSelect />

          <Select.Label color="white" fontSize={"14px"} textAlign={"left"}>
            Specialty{" "}
            <Text as="span" color="red">
              *
            </Text>
          </Select.Label>

          <Select.Control>
            <Select.Trigger>
              <Select.ValueText color="white" placeholder="Select specialty" />
            </Select.Trigger>
            <Select.IndicatorGroup>
              <Select.Indicator />
            </Select.IndicatorGroup>
          </Select.Control>

          <Portal>
            <Select.Positioner>
              <Select.Content bg="black" color="white">
                {specialties.items.map((item) => (
                  <Select.Item key={item.value} item={item}>
                    {item.label}
                  </Select.Item>
                ))}
              </Select.Content>
            </Select.Positioner>
          </Portal>
        </Select.Root>
        {errors.specialty && (
          <Text fontSize="12px" color="#ef4444" mr="40px" textAlign={"left"}>
            {errors.specialty}
          </Text>
        )}
      </Box>
      {/* SUB-SPECIALTY */}
      <Select.Root
        collection={subSpecialties}
        size="sm"
        width="100%"
        isDisabled={!specialty}
        value={subSpecialty ? [subSpecialty] : []}
        onValueChange={(e) => setSubSpecialty(e.value[0])}
      >
        <Select.HiddenSelect />

        <Select.Label color="white" fontSize={"14px"} textAlign={"left"}>
          Sub-Specialty{" "}
        </Select.Label>

        <Select.Control>
          <Select.Trigger>
            <Select.ValueText
              color="white"
              placeholder={
                specialty ? "Select sub-specialty" : "Select specialty first"
              }
            />
          </Select.Trigger>
        </Select.Control>

        <Portal>
          <Select.Positioner>
            <Select.Content bg="black" color="white">
              {subSpecialties.items.map((item) => (
                <Select.Item key={item.value} item={item}>
                  {item.label}
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
      {/* </Grid> */}
    </Box>
  );
};

export default ProviderSpecialty;

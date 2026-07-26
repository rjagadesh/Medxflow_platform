import React, { useState } from "react";
import { Box, Button, Flex, Text } from "@chakra-ui/react";
import FormField from "../../dental/form-fields";
import MultiSelectField from "../../dental/Component/MultiSelect";
import CustomButton from "@/components/button/button";

export default function SelectClaimsToSubmit() {
  const [insurance, setInsurance] = useState(["all"]);
  const [patient, setPatient] = useState(["all"]);
  const [payerScenario, setPayerScenario] = useState(["all"]);

  const insuranceItems = [
    // { label: "All Insurance Companies", value: "all" },
    { label: "Aetna", value: "aetna" },
    { label: "Blue Cross Blue Shield", value: "bcbs" },
    { label: "Cigna", value: "cigna" },
    { label: "UnitedHealthcare", value: "uhc" },
  ];

  const patientList = [
    // { label: "All Patients", value: "all" },
    { label: "Kishore", value: "kishore" },
    { label: "Kabilan", value: "kabilan" },
    { label: "Mouli", value: "mouli" },
    { label: "Anish", value: "anish" },
  ];

  const payerScenarioList = [
    // { label: "All Payer Scenarios", value: "all" },
    { label: "Primary", value: "primary" },
    { label: "Secondary", value: "secondary" },
  ];

  const [formData, setFormData] = useState({
    from_date: "",
    end_date: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const Divider = () => <div className="h-px mx-8 bg-[#404040]" />;

  return (
    <Box
      bg="gray.800"
      p={6}
      rounded="lg"
      boxShadow="inner"
      color="gray.900"
      maxW="900px"
    >
      {/* HEADER */}
      <Flex justify="space-between" align="center" mb={6}>
        <Box>
          <Text fontWeight="600" fontSize="3xl" color={"white"}>
            Select Claims to Submit
          </Text>
          <Text fontSize="12px" color="gray.400">
            Filter claims before submission
          </Text>
        </Box>

        <Flex gap={3}>
          <CustomButton>Back</CustomButton>
          <CustomButton>Submit Claims</CustomButton>
        </Flex>
      </Flex>

      {/* <Divider mb={6} borderColor="#333" /> */}

      {/* DATE RANGE */}
      <Box mb={6}>
        <Text mb={2} fontSize="xl" color="gray.400">
          Date Range
        </Text>
        <Flex gap={6}>
          <FormField
            label="From"
            name="from_date"
            type="date"
            value={formData.from_date}
            onChange={handleInputChange}
          />
          <FormField
            label="To"
            name="end_date"
            type="date"
            value={formData.end_date}
            onChange={handleInputChange}
          />
        </Flex>
      </Box>

      {/* INSURANCE */}
      <Box mb={6}>
        <Text mb={2} fontSize="xl" color="gray.400">
          Insurance Providers
        </Text>
        <MultiSelectField
          width="420px"
          label="Select insurance provider(s)"
          placeholder="All insurance companies"
          items={insuranceItems}
          value={insurance}
          onChange={setInsurance}
          multiple
          maxSelections={5}
        />
      </Box>

      {/* PATIENTS */}
      <Box mb={6}>
        <Text mb={2} fontSize="xl" color="gray.400">
          Patients
        </Text>
        <MultiSelectField
          width="420px"
          label="Select patients"
          placeholder="All patients"
          items={patientList}
          value={patient}
          onChange={setPatient}
          multiple
          maxSelections={5}
        />
      </Box>

      {/* PAYER SCENARIO */}

      <Box mb={6}>
        <Text mb={2} fontSize="xl" color="gray.400">
          Payer Scenario
        </Text>
        <MultiSelectField
          width="420px"
          label="Select Payer Scenario"
          placeholder="Select Scenario"
          items={payerScenarioList}
          value={payerScenario}
          onChange={setPayerScenario}
          maxSelections={5}
        />
      </Box>
    </Box>
  );
}

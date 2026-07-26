import { Box, Flex, Text } from "@chakra-ui/react";
import { Tooltip } from "@/components/ui/tooltip";
import Row from "./rowcomponent";
const provider_options = [
  { label: "Dr. John Smith, MD", value: "prov_md_001" },
  { label: "Dr. Emily Carter, DDS", value: "prov_dds_002" },
  { label: "Dr. Michael Brown, DO", value: "prov_do_003" },
  { label: "Dr. Sarah Wilson, DMD", value: "prov_dmd_004" },
];
const location_options = [
  { label: "Downtown Medical Center", value: "loc_001" },
  { label: "Westside Dental Clinic", value: "loc_002" },
  { label: "North City Outpatient Facility", value: "loc_003" },
];

const modifier_options = [
  { label: "26 - Professional Component", value: "26" },
  { label: "TC - Technical Component", value: "TC" },
  { label: "59 - Distinct Procedural Service", value: "59" },
  { label: "25 - Significant, Separately Identifiable E/M", value: "25" },
];

const service_options = [
  { label: "01- Medical Care", value: "01" },
  { label: "02 - Surgical", value: "02" },
  { label: "03 - Consultation", value: "03" },
  { label: "05 - Diagnostic X-Ray", value: "05" },
  { label: "07 - Anesthesia", value: "07" },
];

export default function ClaimDetailsBox({ claim }) {
  return (
    <Box width={"100%"}>
      <Text fontSize="2xl" fontWeight="400" color="white" mb={4}>
        Claim Details
      </Text>
      <Box
        bg="#1f1f1f"
        border="1px solid #2a2a2a"
        borderRadius="lg"
        display="flex"
        flexWrap="wrap"
        alignItems="flex-start"
        gap={1}
        p={2}
        w="100%"
        color="white"
      >
        {/* HEADER */}

        {/* PATIENT */}
        <Box
          m={2}
          flex="1 1 200px"
          maxW="420px"
          minH="23vh"
          bg={"grey.800"}
          borderRadius={"15px"}
          p={"10px"}
        >
          <Text fontSize="lg" fontWeight="250" color="white" mb={4}>
            PATIENT
          </Text>
          <Row
            label="Name"
            value={`${claim.patient?.first_name || ""} ${
              claim.patient?.last_name || ""
            }`.trim()}
          />

          <Row editable type="date" label="DOB" value={claim.patient?.dob} />
          <Row label="Patient ID" value={claim.patient?.id} />
        </Box>

        {/* GENERAL */}
        <Box
          m={2}
          flex="1 1 200px"
          maxW="420px"
          minH="23vh"
          bg={"grey.800"}
          borderRadius={"15px"}
          p={"10px"}
        >
          <Text fontSize="lg" fontWeight="250" color="white" mb={4}>
            GENERAL
          </Text>
          <Row
            editable
            type="input"
            label="Encounter ID"
            value={claim.encounter_number}
          />
          <Row
            editable
            label="Insurance"
            value={claim.patient?.insurance_name?.names[0]}
          />
          <Row
            editable
            // type="select"
            options={provider_options}
            label="Provider"
            value={claim.providers?.rendering_provider}
          />
          <Row
            editable
            // type="select"
            options={location_options}
            label="Location"
            value={claim.location}
          />
        </Box>

        {/* <Divider borderColor="#2a2a2a" my={3} /> */}

        {/* SERVICE DETAILS */}
        <Box
          m={2}
          flex="1 1 200px"
          maxW="420px"
          minH="23vh"
          bg={"grey.800"}
          borderRadius={"15px"}
          p={"10px"}
        >
          <Text fontSize="lg" fontWeight="250" color="white" mb={4}>
            SERVICE DETAILS
          </Text>
          <Row
            editable
            type="date"
            label="Date of Service"
            value={claim.service_date?.from}
          />
          <Row
            editable
            type="input"
            label="Procedure"
            value={`${claim.service_line?.procedure_code} `}
          />
          <Row
            editable
            type="input"
            label="Modifier"
            value={claim.service_line?.modifiers?.mod_1 || ""}
          />
          <Row
            editable
            type="input"
            label="Type of Service"
            value={claim.service_details?.type_of_service.label}
          />
        </Box>

        {/* <Divider borderColor="#2a2a2a" my={3} /> */}

        {/* DIAGNOSIS */}
        <Box
          m={2}
          flex="1 1 200px"
          maxW="420px"
          minH="23vh"
          bg={"grey.800"}
          borderRadius={"15px"}
          p={"10px"}
        >
          <Text fontSize="lg" fontWeight="250" color="white" mb={4}>
            DIAGNOSIS
          </Text>
          {Object.entries(claim.service_line?.diag_pointers || {}).map(
            ([key, value], index) => (
              <Row
                editable
                type="input"
                key={key}
                label={`Diagnosis ${index + 1}`}
                value={value}
              />
            ),
          )}
        </Box>

        {/* <Divider borderColor="#2a2a2a" my={3} /> */}
      </Box>
    </Box>
  );
}

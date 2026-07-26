import { Box, Button, Grid, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
export default function ProviderProfile({ item, showScheduleButton = true }) {
  const navigate = useNavigate();
  return (
    <>
      {/* Separator line */}
      <Box w="1px" bg="rgba(255,255,255,0.15)" height="100%" flexShrink={0} />

      {/* Main Details Box */}
      <Box flex="1" minW="0">
        <Text fontSize="1xl" mb={3}>
          Details
        </Text>

        <Box
          p={4}
          borderRadius="10px"
          bg="rgba(255,255,255,0.06)"
          border="1px solid rgba(255,255,255,0.12)"
        >
          {/* Details Grid */}
          <Grid
            templateColumns={{
              base: "1fr",
              md: "140px 1fr 140px 1fr",
            }}
            rowGap={3}
            columnGap={4}
            fontSize="md"
            w="100%"
            minW="0"
          >
            <Text opacity={0.6}>Practice:</Text>
            <Text color="#00AEEF">{item?.practice_name || "—"}</Text>

            <Text opacity={0.6}>NPI:</Text>
            <Text>{item?.NPI || "—"}</Text>

            <Text opacity={0.6}>SSN:</Text>
            <Text>{item?.taxid_ssn || "—"}</Text>

            <Text opacity={0.6}>Tax ID (EIN):</Text>
            <Text>{item?.taxid_ein || "—"}</Text>

            <Text opacity={0.6}>Specialty:</Text>
            <Text>{item?.specialty || "—"}</Text>

            <Text opacity={0.6}>Sub Specialty:</Text>
            <Text>{item?.sub_specialty || "—"}</Text>

            <Text opacity={0.6}>Provider Type:</Text>
            <Text>{item?.provider_type || "—"}</Text>

            <Text opacity={0.6}>Medicare PTAN:</Text>
            <Text>{item?.medicare_ptan || "—"}</Text>

            <Text opacity={0.6}>Medicaid ID:</Text>
            <Text>{item?.medicaid_id || "—"}</Text>
          </Grid>
        </Box>
        {showScheduleButton && (
          <Button
            position={"absolute"}
            right={"5"}
            size="s"
            bg="#00afef88"
            color="white"
            borderRadius="20px"
            px={2}
            py={1}
            mt="10px"
            onClick={() =>
              navigate("/pms/home/appointment/create", {
                state: {
                  provider: item.id,
                },
              })
            }
          >
            Schedule Appointment
          </Button>
        )}
      </Box>
    </>
  );
}

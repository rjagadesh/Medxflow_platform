import {
  Box,
  Button,
  ButtonGroup,
  Code,
  Flex,
  Stack,
  Steps,
  useSteps,
} from "@chakra-ui/react";

const StepsClaimsubmission = (item) => {
  const steps = useSteps({
    defaultStep: 3,
    count: items.length,
  });

  return (
    // maxW={"64vw"} minW={"64vw"}
    <Box height={"full"} width={"50vw"} top="20vh">
      <Stack bg="#2424247c" p={4} borderRadius="md">
        <Steps.RootProvider value={steps}>
          <Steps.List
            display="grid"
            gridTemplateColumns={`repeat(${items.length}, 1fr)`}
            alignItems="center"
          >
            {items.map((step, index) => (
              <Steps.Item
                key={index}
                index={index}
                position="relative"
                display="flex"
                justifyContent="center"
              >
                {/* STEP */}
                <Stack align="center" spacing={2}>
                  <Steps.Indicator
                    size="32px"
                    bg="#1f2933"
                    border="2px solid"
                    borderColor="gray.500"
                    _active={{ bg: "#00bcd4", borderColor: "#00bcd4" }}
                    _completed={{ bg: "#22c55e", borderColor: "#22c55e" }}
                  />
                  <Steps.Title
                    fontSize="sm"
                    color="white"
                    textAlign="center"
                    maxW="140px"
                    _active={{ color: "#00bcd4" }}
                    _completed={{ color: "#22c55e" }}
                  >
                    {step.title}
                  </Steps.Title>
                </Stack>

                {/* CONNECTOR */}
                {index !== items.length - 1 && (
                  <Box
                    position="absolute"
                    top="16px"
                    right="-50%"
                    height="2px"
                    width="87%"
                    bg="gray.600"
                    _active={{ bg: "#00bcd4" }}
                    _completed={{ bg: "#22c55e" }}
                  />
                )}
              </Steps.Item>
            ))}
          </Steps.List>

          {/* DESCRIPTION */}
          <Box mt={6} color="gray.300" fontSize="sm">
            {items[steps.value]?.description}
          </Box>
        </Steps.RootProvider>
      </Stack>
    </Box>
  );
};

const items = [
  {
    title: "Approved",
    description:
      "Encounter was created from the patient encounter with ICD-10 codes. Initial charge amount was generated.",
    date: "12/18/25",
    status: "completed",
  },
  {
    title: "Transferred",
    description:
      "The claim was transferred to the primary insurance payer (Blue Cross and Blue Shield of Kansas).",
    date: "12/18/25",
    status: "completed",
  },
  {
    title: "Acknowledged",
    description: "Claim was received and acknowledged by GatewayEDI.",
    date: "12/21/25",
    status: "completed",
  },
  {
    title: "Pending",
    description: "Electronic claim is Pending for approval.",
    date: "12/22/25",
    status: "completed",
  },
  {
    title: "Denial",
    description: "Electronic claim is Denied.",
    date: "12/22/25",
    status: "completed",
  },
  {
    title: "Paid",
    description:
      "Claim batch was sent to GatewayEDI for processing with batch and transaction identifiers.",
    date: "12/22/25",
    status: "in_progress",
  },
];

export default StepsClaimsubmission;

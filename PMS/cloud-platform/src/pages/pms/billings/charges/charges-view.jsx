import React, { useMemo, useState } from "react";
import {
  Accordion,
  Box,
  Flex,
  Grid,
  GridItem,
  HStack,
  Text,
  VStack,
  Button,
} from "@chakra-ui/react";
import { Info, MessageSquare, MinusSquare } from "lucide-react";
import CustomAvatar from "@/components/avatar/avatar";
import GenericTable from "@/components/table/table";

// Mock Data
const patientInfo = {
  name: "DRAKE MAPLES",
  dob: "12/17/2008",
  age: "17.0y",
  gender: "Male",
  insurance: "UMR",
  case: "",
  primary: "UMR-Harrington",
  secondary: "None",
};

const visitInfo = {
  dateOfService: "12/02/2025",
  serviceLocation: "KSP Health - Kansas",
  placeOfService: "10 - Telehealth Provided in Patients Home",
  visitMode: "Telehealth Visit",
  renderingProvider: "SETH BREMYER",
  schedulingProvider: "",
  referringProvider: "",
  supervisingProvider: "",
};

const diagnosisCodes = [{ rank: 1, code: "F32.A: Depression, unspecified" }];

const ChargesView = () => {
  const [accordionValue, setAccordionValue] = useState([
    "patient-info",
    "visit-info",
    "diagnosis-codes",
  ]);

  const toggleAll = () => {
    if (accordionValue.length > 0) {
      setAccordionValue([]);
    } else {
      setAccordionValue(["patient-info", "visit-info", "diagnosis-codes"]);
    }
  };

  const columnsData = useMemo(
    () => [
      {
        title: "Rank",
        accessor_key: "rank",
      },
      {
        title: "Diagnosis Code",
        accessor_key: "code",
      },
    ],
    []
  );

  return (
    <Box>
      <Box className="bg-droidal-black-300 rounded-2xl shadow-sm p-6">
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          mb={6}
          direction={{ base: "column", md: "row" }}
          gap={4}
        >
          <Text as="h2" fontSize="xl" fontWeight="light" color="white">
            Charge Capture
          </Text>

          <HStack gap={4}>
            <HStack color="gray.400" cursor="pointer">
              <Text fontSize="sm">Read Only</Text>
              <Info size={16} />
            </HStack>
            <HStack color="gray.400" cursor="pointer">
              <MessageSquare size={16} />
              <Text fontSize="sm">Give Feedback</Text>
            </HStack>
            <HStack color="gray.400" cursor="pointer" onClick={toggleAll}>
              <MinusSquare size={16} />
              <Text fontSize="sm">
                {accordionValue.length > 0 ? "Collapse All" : "Expand All"}
              </Text>
            </HStack>
          </HStack>
        </Flex>

        {/* Content */}
        <Accordion.Root
          multiple
          collapsible
          value={accordionValue}
          onValueChange={(e) => setAccordionValue(e.value)}
        >
          {/* Patient Information */}
          <Accordion.Item
            value="patient-info"
            border="none"
            mb={4}
            className="bg-droidal-black-300"
          >
            <Accordion.ItemTrigger
              bgColor={"droidalBlack.400"}
              cursor="pointer"
              pl={4}
            >
              <Box flex="1" textAlign="left">
                <Text fontSize="lg" fontWeight="light" color="white">
                  Patient Information
                </Text>
              </Box>
              <Accordion.ItemIndicator color="white" />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              {/* Note: Check if Accordion.ItemBody is needed based on reference file */}
              <Box py={4} pl={4}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap={6}>
                  <GridItem>
                    <HStack align="start" gap={4}>
                      <CustomAvatar
                        name={patientInfo.name}
                        initials={patientInfo.name.slice(0, 2)}
                      />
                      <VStack align="start" gap={1}>
                        <HStack>
                          <Text color="white" fontWeight="medium">
                            Patient Name:
                          </Text>
                          <Text color="gray.300">{patientInfo.name}</Text>
                        </HStack>
                        <HStack>
                          <Text color="white" fontWeight="medium">
                            Date of birth:
                          </Text>
                          <Text color="gray.300">
                            {patientInfo.dob} ({patientInfo.age})
                          </Text>
                        </HStack>
                        <HStack>
                          <Text color="white" fontWeight="medium">
                            Gender:
                          </Text>
                          <Text color="gray.300">{patientInfo.gender}</Text>
                        </HStack>
                      </VStack>
                    </HStack>
                  </GridItem>
                  <GridItem>
                    <Grid templateColumns="auto 1fr" gap={4} rowGap={2}>
                      <Text color="white" fontWeight="medium">
                        Insurance
                      </Text>
                      <Text color="gray.300">{patientInfo.insurance}</Text>

                      <Text color="white" fontWeight="medium">
                        Case:
                      </Text>
                      <Text color="gray.300">{patientInfo.case}</Text>

                      <Text color="white" fontWeight="medium">
                        Primary:
                      </Text>
                      <Text color="gray.300">{patientInfo.primary}</Text>

                      <Text color="white" fontWeight="medium">
                        Secondary:
                      </Text>
                      <Text color="gray.300">{patientInfo.secondary}</Text>
                    </Grid>
                  </GridItem>
                </Grid>
              </Box>
            </Accordion.ItemContent>
          </Accordion.Item>

          {/* Visit & Provider Information */}
          <Accordion.Item
            value="visit-info"
            border="none"
            mb={4}
            className="bg-droidal-black-300"
          >
            <Accordion.ItemTrigger
              bgColor={"droidalBlack.400"}
              cursor="pointer"
              pl={4}
            >
              <Box flex="1" textAlign="left">
                <Text fontSize="lg" fontWeight="light" color="white">
                  Visit & Provider Information
                </Text>
              </Box>
              <Accordion.ItemIndicator color="white" />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Box py={4} pl={4}>
                <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={8}>
                  {/* Left Column */}
                  <GridItem>
                    <Grid templateColumns="150px 1fr" gap={2} rowGap={4}>
                      <Text color="white" fontWeight="medium">
                        Date of Service:
                      </Text>
                      <Text color="gray.300">{visitInfo.dateOfService}</Text>

                      <Text color="white" fontWeight="medium">
                        Service Location:
                      </Text>
                      <Text color="gray.300">{visitInfo.serviceLocation}</Text>

                      <Text color="white" fontWeight="medium">
                        Place of Service:
                      </Text>
                      <Text color="gray.300">{visitInfo.placeOfService}</Text>

                      <Text color="white" fontWeight="medium">
                        Visit Mode:
                      </Text>
                      <Text color="gray.300">{visitInfo.visitMode}</Text>
                    </Grid>
                  </GridItem>

                  {/* Right Column */}
                  <GridItem>
                    <Grid templateColumns="160px 1fr" gap={2} rowGap={4}>
                      <Text color="white" fontWeight="medium">
                        Rendering Provider:
                      </Text>
                      <Text color="gray.300">
                        {visitInfo.renderingProvider}
                      </Text>

                      <Text color="white" fontWeight="medium">
                        Scheduling Provider:
                      </Text>
                      <Text color="gray.300">
                        {visitInfo.schedulingProvider}
                      </Text>

                      <Text color="white" fontWeight="medium">
                        Referring Provider:
                      </Text>
                      <Text color="gray.300">
                        {visitInfo.referringProvider}
                      </Text>

                      <Text color="white" fontWeight="medium">
                        Supervising Provider:
                      </Text>
                      <Text color="gray.300">
                        {visitInfo.supervisingProvider}
                      </Text>
                    </Grid>
                  </GridItem>
                </Grid>
              </Box>
            </Accordion.ItemContent>
          </Accordion.Item>

          {/* Diagnosis Codes */}
          <Accordion.Item
            value="diagnosis-codes"
            border="none"
            mb={4}
            className="bg-droidal-black-300"
          >
            <Accordion.ItemTrigger cursor="pointer">
              <Box flex="1" textAlign="left">
                <Text fontSize="lg" fontWeight="light" color="white">
                  Diagnosis Codes (Max 12)
                </Text>
              </Box>
              <Accordion.ItemIndicator color="white" />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Box py={4}>
                <GenericTable
                  columns={columnsData}
                  data={diagnosisCodes}
                  pagination={false}
                  count={diagnosisCodes.length}
                />
              </Box>
            </Accordion.ItemContent>
          </Accordion.Item>
        </Accordion.Root>
      </Box>
    </Box>
  );
};

export default ChargesView;

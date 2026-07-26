import React from "react";
import {
  Box,
  Flex,
  Text,
  Grid,
  GridItem,
  VStack,
  HStack,
  Button,
  Badge,
  Card,
  Icon,
  Avatar,
  Separator,
  Span,
} from "@chakra-ui/react";
import {
  Printer,
  ChevronDown,
  Plus,
  Info,
  User,
  UserRound,
} from "lucide-react";
import CustomButton from "@/components/button/button";
import { LucideGradientIcon } from "@/features/home/home-card";
import CustomTextArea from "@/components/textarea/textarea";
import { parseAsString, useQueryState } from "nuqs";
import MedicationsView from "./medications";
import DocumentsView from "./documents";
import History from "./history";
import { useNavigate, useParams } from "react-router-dom";
import { useGetPatientById } from "@/hooks/query/pms/pms_appointments/useGetPatientById";
import { format } from "date-fns";
import PatientLedgerPage from "./patient_ledger";

const SidebarItem = ({ label, isActive, hasBadge, onItemClick }) => (
  <Flex
    align="center"
    py={2}
    px={4}
    bg={isActive ? "droidalGray.500" : "transparent"}
    color={isActive ? "white" : "droidalGray.400"}
    _hover={{ bg: "droidalGray.500", cursor: "pointer", color: "white" }}
    cursor="pointer"
    letterSpacing={"wider"}
    justify="space-between"
    onClick={onItemClick}
  >
    <Text fontSize="sm">{label}</Text>
    {hasBadge && (
      <Badge
        colorPalette="green"
        variant="solid"
        size="sm"
        px={2}
        borderRadius="md"
      >
        New
      </Badge>
    )}
  </Flex>
);

const SectionCard = ({ title, children, action, ...props }) => (
  <Card.Root
    variant="outline"
    bg="droidalBlack.300"
    h="full"
    borderRadius="md"
    boxShadow="none"
    borderColor="droidalGray.300"
    {...props}
  >
    <Card.Header pb={2}>
      <Flex justify="space-between" align="center">
        <Text
          fontSize="lg"
          color="white"
          fontWeight="light"
          letterSpacing={"wider"}
        >
          {title}
        </Text>
        {action && (
          <Text
            fontSize="sm"
            color="blue.500"
            cursor="pointer"
            letterSpacing={"wide"}
          >
            {action}
          </Text>
        )}
      </Flex>
    </Card.Header>
    <Card.Body pt={2} color="droidalGray.400">
      {children}
    </Card.Body>
  </Card.Root>
);

function calculateAge(dobStr) {
  const dob = new Date(dobStr);
  const today = new Date();

  let years = today.getFullYear() - dob.getFullYear();
  let months = today.getMonth() - dob.getMonth();

  // If current day is before birthday day, reduce month
  if (today.getDate() < dob.getDate()) {
    months--;
  }

  // If months go negative, borrow from years
  if (months < 0) {
    years--;
    months += 12;
  }

  return `${years} years, ${months} months old`;
}

// Usage

const PatientView = () => {
  const { id } = useParams();
  const { data, isLoading } = useGetPatientById(id);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("Facesheet"),
  );
  const sidebarItems = [
    { label: "Facesheet", active: false },
    { label: "History", active: true },
    { label: "Problems", active: false },
    { label: "Medications", active: false },
    { label: "Immunizations", active: false },
    { label: "Allergies", active: false },
    { label: "Vitals", active: false },
    { label: "Notes", active: false },
    { label: "Demographics", active: false },
    { label: "Account", active: false },
    { label: "Documents", active: false },
    { label: "Recall", active: false },
    { label: "Messages", active: false, badge: true },
    { label: "Ledger", active: false },
  ];

  return (
    <Box color="white" className="h-[calc(100vh-130px)]">
      {/* Patient Header */}
      <Box borderBottom="1px solid" borderColor="droidalGray.300" px={6} py={4}>
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={4}>
          {/* Patient Info */}
          <HStack gap={4} align="flex-start">
            <Avatar.Root size="2xl" bg="droidalGray.500" color="gray.300">
              <Avatar.Fallback>
                <User size={32} />
              </Avatar.Fallback>
            </Avatar.Root>
            <VStack align="start" gap={0}>
              <HStack>
                <Text fontSize="xl" fontWeight="light">
                  {data?.first_name} {data?.last_name}
                </Text>
              </HStack>
              <Text fontSize="sm" color="droidalGray.400">
                DOB:{" "}
                {data?.dob
                  ? `${format(data?.dob, "MMM dd yyyy")} ${calculateAge(
                      data?.dob,
                    )}`
                  : "N/A"}
              </Text>
              <Text fontSize="sm" color="droidalGray.400">
                Gender: {data?.gender}
                <Text as="span" mx={2} color="droidalGray.400">
                  |
                </Text>
                {data?.mobile_phone ? data?.mobile_phone : "N/A"}
              </Text>
            </VStack>
            <Separator
              borderColor={"droidalGray.300"}
              orientation="vertical"
              height="80px"
            />
            <VStack mt={1} gap={0.5} align={"flex-start"} fontSize="sm">
              <button>
                <Text
                  variant="subtle"
                  fontSize={{
                    base: "sm",
                    "2xl": "md",
                  }}
                  display="flex"
                  alignItems="center"
                  className="dark text-transparent bg-clip-text transition-colors"
                  bgImage="var(--bg-blue-gradient)"
                  letterSpacing={"wider"}
                >
                  <LucideGradientIcon
                    IconComponent={UserRound}
                    stroke="blueGradient"
                    size={16}
                  />
                  <Span ml={1}>Unrestricted</Span>
                </Text>
              </button>
              <Text
                cursor="pointer"
                fontSize={{
                  base: "sm",
                  "2xl": "md",
                }}
                display="flex"
                alignItems="center"
                className="dark text-transparent bg-clip-text transition-colors"
                bgImage="var(--bg-blue-gradient)"
                letterSpacing={"wider"}
                _hover={{ textDecoration: "underline" }}
              >
                Collect Payment
              </Text>
              <Text color="red.500">$0.00 due</Text>
            </VStack>
          </HStack>

          {/* Allergy Status */}
          <Box flex={1} mx={{ base: 0, md: 12 }} alignSelf="center">
            <CustomTextArea
              label=""
              placeholder="No allergy history documented"
              minH="70px"
              autoresize
            />
          </Box>

          {/* Actions */}
          <HStack gap={2} alignSelf="flex-start">
            <CustomButton
              variant="plain"
              size="sm"
              leftIcon={<Printer size={16} style={{ marginRight: "8px" }} />}
              color="droidalGray.400"
            >
              Print
            </CustomButton>
            <CustomButton
              variant="plain"
              size="sm"
              rightIcon={<ChevronDown size={16} />}
              color="droidalGray.400"
            >
              More
            </CustomButton>
            <CustomButton
              size="sm"
              borderRadius="full"
              px={4}
              leftIcon={<Plus size={16} />}
              rightIcon={<ChevronDown size={16} />}
            >
              New Note
            </CustomButton>
            <CustomButton
              variant="outline"
              size="sm"
              borderRadius="full"
              px={4}
              onClick={() => {
                navigate(-1);
              }}
            >
              Back
            </CustomButton>
          </HStack>
        </Flex>
      </Box>

      <Flex h="full">
        {/* Sidebar */}
        <Box
          w="200px"
          borderRight="1px solid"
          borderColor="droidalGray.300"
          bgColor={"droidalGray.600"}
          py={4}
          display={{ base: "none", md: "block" }}
        >
          <VStack align="stretch" gap={0}>
            {sidebarItems.map((item) => (
              <SidebarItem
                key={item.label}
                label={item.label}
                isActive={activeTab === item.label}
                hasBadge={item.badge}
                onItemClick={() => setActiveTab(item.label)}
              />
            ))}
          </VStack>
        </Box>

        <Box flex={1} height="full" overflow="auto">
          {activeTab === "Facesheet" && (
            <Box flex={1} p={6} bg="droidalBlack.400">
              <Flex justify="space-between" align="center" mb={6}>
                <Text fontSize="3xl" fontWeight="light" color="white">
                  Facesheet
                </Text>
                <Text
                  fontSize="sm"
                  color="blue.500"
                  cursor="pointer"
                  _hover={{ textDecoration: "underline" }}
                >
                  Customize View
                </Text>
              </Flex>

              <Grid
                templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }}
                gap={6}
              >
                <GridItem>
                  <SectionCard
                    bgColor="droidalBlack.300"
                    borderColor="droidalGray.300"
                    borderRadius="12px"
                    title="Medications"
                  >
                    <Text>(None documented)</Text>
                  </SectionCard>
                </GridItem>

                <GridItem>
                  <SectionCard title="History">
                    <Text>(None Documented)</Text>
                  </SectionCard>
                </GridItem>

                <GridItem>
                  <SectionCard title="Vitals">
                    <Text>(None documented)</Text>
                  </SectionCard>
                </GridItem>

                <GridItem rowSpan={2}>
                  <Card.Root
                    variant="outline"
                    bg="droidalBlack.300"
                    h="full"
                    borderRadius="md"
                    boxShadow="none"
                    borderColor="droidalGray.300"
                  >
                    <Card.Header pb={2}>
                      <Text fontSize="lg" letterSpacing={"wider"} color="white">
                        Clinical Recommendations
                      </Text>
                    </Card.Header>
                    <Card.Body pt={2}>
                      <VStack align="start" gap={4} width="full">
                        {/* Item 1 */}
                        <Flex
                          gap={3}
                          w="full"
                          borderBottom="1px solid"
                          borderColor="gray.100"
                          pb={4}
                        >
                          <Icon as={Info} color="droidalGray.400" mt={1} />
                          <Box>
                            <Text
                              fontSize="sm"
                              color="droidalGray.400"
                              letterSpacing={"wide"}
                            >
                              Preventive Care and Screening:
                            </Text>
                            <Text
                              fontSize="sm"
                              color="primary.500"
                              textDecoration="underline"
                              cursor="pointer"
                              letterSpacing={"wide"}
                            >
                              Influenza Immunizations
                            </Text>
                          </Box>
                        </Flex>
                        {/* Item 2 */}
                        <Flex
                          gap={3}
                          w="full"
                          borderBottom="1px solid"
                          borderColor="droidalGray.300"
                          pb={4}
                        >
                          <Text
                            fontSize="lg"
                            color="droidalGray.400"
                            w="24px"
                            textAlign="center"
                          >
                            A
                          </Text>
                          <Box>
                            <Text
                              fontSize="sm"
                              letterSpacing={"wide"}
                              color="droidalGray.400"
                            >
                              Prevention of Acquisition of HIV: Preexposure
                              Prophylaxis
                            </Text>
                            <Text
                              fontSize="sm"
                              color="primary.500"
                              letterSpacing={"wide"}
                              textDecoration="underline"
                              cursor="pointer"
                            >
                              Prevention of Acquisition of HIV: Preexposure
                              Prophylaxis -- Adolescents and adults at increased
                              risk of HIV
                            </Text>
                          </Box>
                        </Flex>
                        {/* Item 3 */}
                        <Flex
                          gap={3}
                          w="full"
                          borderBottom="1px solid"
                          borderColor="droidalGray.300"
                          pb={4}
                        >
                          <Text
                            fontSize="lg"
                            color="droidalGray.400"
                            w="24px"
                            textAlign="center"
                            letterSpacing={"wider"}
                          >
                            B
                          </Text>
                          <Box>
                            <Text
                              fontSize="sm"
                              letterSpacing={"wide"}
                              color="droidalGray.400"
                            >
                              Anxiety in Children and Adolescents: Screening
                            </Text>
                            <Text
                              fontSize="sm"
                              color="primary.500"
                              textDecoration="underline"
                              cursor="pointer"
                            >
                              Anxiety in Children and Adolescents: Screening --
                              Children and adolescents aged 8 to 18 years
                            </Text>
                          </Box>
                        </Flex>
                        {/* Item 4 */}
                        <Flex gap={3} w="full">
                          <Text
                            fontSize="lg"
                            fontWeight="bold"
                            color="gray.400"
                            w="24px"
                            textAlign="center"
                          >
                            B
                          </Text>
                          <Box>
                            <Text
                              fontSize="sm"
                              letterSpacing={"wider"}
                              color="droidalGray.400"
                            >
                              High Body Mass Index in Children and Adolescents:
                              Interventions
                            </Text>
                            <Text
                              fontSize="sm"
                              color="primary.500"
                              letterSpacing={"wider"}
                              textDecoration="underline"
                              cursor="pointer"
                            >
                              High Body Mass Index in Children and Adolescents:
                              Interventions -- Children and adolescents 6 years
                              or older
                            </Text>
                          </Box>
                        </Flex>
                      </VStack>
                    </Card.Body>
                  </Card.Root>
                </GridItem>

                <GridItem>
                  <SectionCard title="Problems">
                    <Text>(None documented)</Text>
                  </SectionCard>
                </GridItem>
              </Grid>
            </Box>
          )}

          {activeTab === "History" && <History />}
          {activeTab === "Medications" && <MedicationsView />}
          {activeTab === "Documents" && <DocumentsView />}
          {activeTab === "Ledger" && <PatientLedgerPage id={id} />}
        </Box>
      </Flex>
    </Box>
  );
};

export default PatientView;

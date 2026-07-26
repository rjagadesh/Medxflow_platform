import React from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Card,
  SimpleGrid,
  Image,
  Bleed,
  Flex,
  Skeleton,
  SkeletonCircle,
} from "@chakra-ui/react";
import {
  FileText,
  Activity,
  Pill,
  Clock,
  FlaskConical,
  Folder,
  DollarSign,
  ListTodo,
} from "lucide-react";
import CustomSelect from "@/components/ui/select";
import { useMemo } from "react";
import { useGetAppointments } from "@/hooks/query/pms/pms_appointments/useGetAppointments";
import { Link, useNavigate } from "react-router-dom";
import { useGetPatientById } from "@/hooks/query/pms/pms_appointments/useGetPatientById";
import { toaster } from "@/components/ui/toaster";
import { formatDate } from "@/utils/helper";
import { format, parse } from "date-fns";
import { parseAsString } from "nuqs";
import { useQueryStates } from "nuqs";
const EncounterNotesOverview = () => {
  const {
    data: appointments,
    isLoading,
    isPlaceholderData,
  } = useGetAppointments();
  const [queryParams, setQueryParams] = useQueryStates({
    patient_id: parseAsString.withDefault(null),
    appointment_id: parseAsString.withDefault(null),
  });
  const { appointment_id: appointmentId, patient_id: patientId } =
    queryParams || {};
  const { data: patientDetails } = useGetPatientById(patientId);
  const navigate = useNavigate();

  const handleActionClick = (path) => {
    if (!appointmentId) {
      toaster.error({
        title: "Error",
        description: "Please select an appointment first",
        type: "error",
      });
      return;
    }
    if (path) {
      navigate(path);
    }
  };

  const actions = [
    {
      label: "Notes",
      icon: <FileText size={28} color="white" />,
      bg: "blue.500",
      gradient: "linear-gradient(135deg, #3182CE 0%, #2B6CB0 100%)",
      path: `/pms/encounter/notes/${patientId}/${appointmentId}`,
      image: "/notes.png",
    },
    {
      label: "Vitals",
      icon: <Activity size={28} color="white" />,
      bg: "red.500",
      gradient: "linear-gradient(135deg, #E53E3E 0%, #C53030 100%)",
      image: "/vitals.png",
      path: `/pms/encounter/notes/${patientId}/${appointmentId}/vitals`,
    },
    {
      label: "Medications",
      icon: <Pill size={28} color="white" />,
      bg: "orange.500",
      gradient: "linear-gradient(135deg, #DD6B20 0%, #C05621 100%)",
      image: "/medications.png",
      path: `/pms/encounter/notes/${patientId}/${appointmentId}/medications-sections`,
    },
    {
      label: "History",
      icon: <Clock size={28} color="white" />,
      bg: "blue.800",
      gradient: "linear-gradient(135deg, #2C5282 0%, #2A4365 100%)",
      image: "/history.png",
      path: `/pms/encounter/notes/${patientId}/${appointmentId}/history`,
    },
    {
      label: "Lab Results",
      icon: <FlaskConical size={28} color="white" />,
      bg: "teal.500",
      gradient: "linear-gradient(135deg, #319795 0%, #285E61 100%)",
      image: "/labs.png",
      path: `/pms/encounter/notes/${patientId}/${appointmentId}/labs-studies`,
    },
    {
      label: "Documents",
      icon: <Folder size={28} color="white" />,
      bg: "yellow.500",
      gradient: "linear-gradient(135deg, #D69E2E 0%, #B7791F 100%)",
      image: "/documents.png",
      path: `/pms/encounter/notes/${patientId}/${appointmentId}/documents`,
    },
    // {
    //   label: "Billing",
    //   icon: <DollarSign size={28} color="white" />,
    //   bg: "green.500",
    //   gradient: "linear-gradient(135deg, #38A169 0%, #2F855A 100%)",
    // },
    {
      label: "Tasks",
      icon: <ListTodo size={28} color="white" />,
      bg: "cyan.600",
      gradient: "linear-gradient(135deg, #00B5D8 0%, #00A3C4 100%)",
      image: "/tasks.png",
    },
  ];

  const appointmentDetails =
    appointments?.find((app) => String(app.id) === String(appointmentId)) || {};

  return (
    <Bleed height={"full"} inline={4} blockStart={2}>
      <Box height={"full"} p={4} bg="transparent">
        <VStack gap={4} h={"full"} align="stretch">
          {/* Header Section */}
          <Card.Root
            bgColor="droidalBlack.300"
            borderColor="#2f4d78"
            color="white"
            p={2}
            borderRadius={"12px"}
          >
            <HStack justify="space-between" wrap="wrap" gap={4}>
              <Box flex={1} w="full">
                <CustomSelect
                  options={useMemo(
                    () =>
                      appointments?.map((app) => ({
                        label: `${app.time} - ${app.patient_name} | ${app.reason}`,
                        value: String(app.id),
                      })) || [],
                    [appointments],
                  )}
                  loading={isLoading || isPlaceholderData}
                  value={
                    appointments?.some(
                      (app) => String(app.id) === appointmentId,
                    )
                      ? [String(appointmentId)]
                      : []
                  }
                  onValueChange={(e) => {
                    const appointment = appointments.find(
                      (app) => app.id === Number(e[0]),
                    );
                    setQueryParams({
                      appointment_id: appointment.id,
                      patient_id: appointment.patient,
                    });
                  }}
                  placeholder="Select Appointment"
                />
              </Box>
            </HStack>
          </Card.Root>

          {isLoading || isPlaceholderData ? (
            <>
              <Text fontSize="2xl" fontWeight="light" color="white">
                Patient Information
              </Text>
              {/* Main Grid Skeleton */}
              <Box>
                <Flex gap={4} direction={{ base: "column", lg: "row" }}>
                  {/* Patient Info Card Skeleton */}
                  <Card.Root
                    bgColor="droidalBlack.300"
                    borderColor="#2f4d78"
                    color="white"
                    flex="1"
                    maxW={{ lg: "400px" }}
                  >
                    <Card.Body>
                      <VStack align="start" gap={6}>
                        <HStack gap={4}>
                          <SkeletonCircle boxSize="60px" />
                          <VStack align="start" gap={2}>
                            <Skeleton height="20px" width="150px" />
                            <Skeleton height="16px" width="100px" />
                          </VStack>
                        </HStack>

                        <VStack align="start" gap={2} w="full">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <HStack key={i} w="full">
                              <Skeleton height="16px" width="80px" />
                              <Skeleton height="16px" width="120px" />
                            </HStack>
                          ))}
                        </VStack>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  {/* Action Grid Skeleton */}
                  <SimpleGrid
                    columns={{ base: 2, md: 4 }}
                    gap={4}
                    flex="2"
                    w="full"
                  >
                    {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                      <Card.Root
                        key={i}
                        h="140px"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        border="1px solid #2f4d78"
                        borderColor={"droidalGray.300"}
                        bgColor={"droidalBlack.300"}
                      >
                        <HStack gap={3}>
                          <SkeletonCircle boxSize="70px" />
                          <Skeleton height="20px" width="80px" />
                        </HStack>
                      </Card.Root>
                    ))}
                  </SimpleGrid>
                </Flex>
              </Box>

              {/* Bottom Section Skeleton */}
              <SimpleGrid columns={{ base: 1, lg: 3 }} gap={4}>
                {/* Appointment Details Skeleton */}
                <Card.Root
                  bgColor="droidalBlack.300"
                  borderColor="#2f4d78"
                  color="white"
                  h="full"
                >
                  <Card.Header borderBottomWidth="0px" pb={0}>
                    <Skeleton height="24px" width="180px" />
                  </Card.Header>
                  <Card.Body>
                    <VStack align="start" gap={3}>
                      {[1, 2, 3, 4].map((i) => (
                        <HStack key={i} justify="space-between" w="full">
                          <Skeleton height="16px" width="60px" />
                          <Skeleton height="16px" width="120px" />
                        </HStack>
                      ))}
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Middle Column Skeleton */}
                <VStack gap={4} h="full">
                  {[1, 2].map((i) => (
                    <Card.Root
                      key={i}
                      bgColor="droidalBlack.300"
                      borderColor="#2f4d78"
                      color="white"
                      w="full"
                      flex="1"
                    >
                      <Card.Header pb={0}>
                        <HStack justify="space-between">
                          <Skeleton height="20px" width="100px" />
                          <SkeletonCircle boxSize="8px" />
                        </HStack>
                      </Card.Header>
                      <Card.Body>
                        <Skeleton height="16px" width="120px" />
                      </Card.Body>
                    </Card.Root>
                  ))}
                </VStack>

                {/* Right Column Skeleton */}
                <VStack gap={4} h="full">
                  {[1, 2].map((i) => (
                    <Card.Root
                      key={i}
                      bgColor="droidalBlack.300"
                      borderColor="#2f4d78"
                      color="white"
                      w="full"
                      flex="1"
                    >
                      <Card.Header pb={0}>
                        <HStack justify="space-between">
                          <Skeleton height="20px" width="100px" />
                          <SkeletonCircle boxSize="8px" />
                        </HStack>
                      </Card.Header>
                      <Card.Body>
                        <Skeleton height="16px" width="120px" />
                      </Card.Body>
                    </Card.Root>
                  ))}
                </VStack>
              </SimpleGrid>
            </>
          ) : (
            <></>
          )}

          {!isLoading && !isPlaceholderData && (
            <>
              <Text fontSize="2xl" fontWeight="light" color="white">
                Patient Information
              </Text>
              {/* Main Grid */}
              <Box>
                <Flex gap={4} direction={{ base: "column", lg: "row" }}>
                  {/* Patient Info Card */}
                  <Card.Root
                    bgColor="droidalBlack.300"
                    borderColor="#2f4d78"
                    color="white"
                    flex="1"
                    maxW={{ lg: "400px" }}
                  >
                    <Card.Body>
                      <VStack align="start" gap={6}>
                        <HStack gap={4}>
                          <Image
                            src={`${patientDetails.profilePicture?.replace(
                              "http:",
                              "https:",
                            )}/`}
                            boxSize="160px"
                            borderRadius="12px"
                            objectFit="cover"
                            border="1px solid"
                            borderColor={"droidalGray.300"}
                            onError={(e) => {
                              e.currentTarget.src = "/PersonPlaceholder.png";
                            }}
                          />
                          <VStack align="start" gap={0}>
                            <Text
                              fontSize="xl"
                              fontWeight="normal"
                              letterSpacing={"widest"}
                            >
                              {patientDetails.full_name
                                ? patientDetails.full_name
                                : "N/A"}
                            </Text>
                            <Text fontSize="md" color="droidalGray.400">
                              Age:{" "}
                              {patientDetails.age ? patientDetails.age : "N/A"}
                            </Text>
                          </VStack>
                        </HStack>

                        <SimpleGrid columns={2} gapX={2}>
                          <HStack>
                            <Text
                              fontSize="sm"
                              color="droidalGray.400"
                              w="80px"
                              flexShrink={0}
                            >
                              Patient ID:
                            </Text>
                            <Text fontSize="sm">
                              {patientDetails.id
                                ? patientDetails.id?.slice(0, 8)
                                : "N/A"}
                            </Text>
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="sm"
                              color="droidalGray.400"
                              w="80px"
                              flexShrink={0}
                            >
                              Gender:
                            </Text>
                            <Text fontSize="sm">
                              {patientDetails.gender
                                ? patientDetails.gender
                                : "N/A"}
                            </Text>
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="sm"
                              color="droidalGray.400"
                              w="80px"
                              flexShrink={0}
                            >
                              DOB:
                            </Text>
                            <Text fontSize="sm">
                              {patientDetails.dob
                                ? formatDate(patientDetails.dob)
                                : "N/A"}
                            </Text>
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="sm"
                              color="droidalGray.400"
                              w="80px"
                              flexShrink={0}
                            >
                              Phone:
                            </Text>
                            <Text fontSize="sm">
                              {patientDetails.mobile_phone
                                ? patientDetails.mobile_phone
                                : patientDetails.home_phone
                                  ? patientDetails.home_phone
                                  : "N/A"}
                            </Text>
                          </HStack>
                          <HStack>
                            <Text
                              fontSize="sm"
                              color="droidalGray.400"
                              w="80px"
                              flexShrink={0}
                            >
                              Email:
                            </Text>
                            <Text fontSize="sm">
                              {patientDetails.email
                                ? patientDetails.email
                                : "N/A"}
                            </Text>
                          </HStack>
                        </SimpleGrid>
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  {/* Action Grid */}
                  <SimpleGrid
                    columns={{ base: 2, md: 4 }}
                    gap={4}
                    flex="2"
                    w="full"
                  >
                    {actions.map((action, index) => (
                      <Card.Root
                        key={index}
                        onClick={() => handleActionClick(action.path)}
                        color="white"
                        cursor="pointer"
                        transition="all 0.2s"
                        _hover={{
                          transform: "translateY(-2px)",
                          shadow: "lg",
                          bgColor: "droidalBlack.200",
                        }}
                        h="140px"
                        display="flex"
                        justifyContent="center"
                        alignItems="center"
                        border="1px solid #2f4d78"
                        borderColor={"droidalGray.300"}
                        bgColor={"droidalBlack.300"}
                      >
                        <HStack gap={3}>
                          <img
                            src={action.image}
                            width={70}
                            height={70}
                            alt={action.label}
                          />
                          <Text
                            fontSize="lg"
                            letterSpacing={"widest"}
                            fontWeight="normal"
                          >
                            {action.label}
                          </Text>
                        </HStack>
                      </Card.Root>
                    ))}
                  </SimpleGrid>
                </Flex>
              </Box>

              {/* Bottom Section */}
              <SimpleGrid columns={{ base: 1, lg: 3 }} gap={4}>
                {/* Appointment Details */}
                <Card.Root
                  bgColor="droidalBlack.300"
                  borderColor="#2f4d78"
                  color="white"
                  h="full"
                >
                  <Card.Header borderBottomWidth="0px" pb={0}>
                    <Text
                      fontWeight="normal"
                      letterSpacing={"widest"}
                      fontSize="lg"
                    >
                      Appointment Details
                    </Text>
                  </Card.Header>
                  <Card.Body>
                    <VStack align="start" gap={3}>
                      <HStack justify="space-between" w="full">
                        <Text color="droidalGray.400">Date:</Text>
                        <Text>
                          {appointmentDetails.created_at
                            ? formatDate(appointmentDetails.created_at)
                            : "N/A"}
                        </Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text color="droidalGray.400">Time:</Text>
                        <Text>
                          {appointmentDetails.time
                            ? format(
                                parse(
                                  appointmentDetails.time,
                                  "HH:mm:ss",
                                  new Date(),
                                ),
                                "hh:mm a",
                              )
                            : "N/A"}
                        </Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text color="droidalGray.400">Reason:</Text>
                        <Text>
                          {appointmentDetails.reason
                            ? appointmentDetails.reason
                            : "N/A"}
                        </Text>
                      </HStack>
                      <HStack justify="space-between" w="full">
                        <Text color="droidalGray.400">Status:</Text>
                        <Box
                          px={2}
                          py={0.5}
                          bg="green.900"
                          borderRadius="md"
                          border="1px solid"
                          borderColor="green.500"
                        >
                          <Text
                            color="green.400"
                            fontSize="sm"
                            fontWeight="normal"
                            letterSpacing={"widest"}
                          >
                            {appointmentDetails.confirmationstatus
                              ? "Confirmed"
                              : "N/A"}
                          </Text>
                        </Box>
                      </HStack>
                    </VStack>
                  </Card.Body>
                </Card.Root>

                {/* Middle Column */}
                <VStack gap={4} h="full">
                  <Card.Root
                    bgColor="droidalBlack.300"
                    borderColor="#2f4d78"
                    color="white"
                    w="full"
                    flex="1"
                  >
                    <Card.Header pb={0}>
                      <HStack justify="space-between">
                        <Text fontWeight="normal" letterSpacing={"widest"}>
                          Allergies
                        </Text>
                        <Box boxSize="8px" borderRadius="full" bg="green.400" />
                      </HStack>
                    </Card.Header>
                    <Card.Body>
                      <Text
                        fontSize="lg"
                        color="droidalGray.400"
                        fontWeight={"light"}
                      >
                        {patientDetails.allergies ? "Penicillin" : "N/A"}
                      </Text>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root
                    bgColor="droidalBlack.300"
                    borderColor="#2f4d78"
                    color="white"
                    w="full"
                    flex="1"
                  >
                    <Card.Header pb={0}>
                      <Text fontWeight="normal" letterSpacing={"widest"}>
                        Last Visit
                      </Text>
                    </Card.Header>
                    <Card.Body>
                      <Text
                        fontSize="lg"
                        color="droidalGray.400"
                        fontWeight={"light"}
                      >
                        {patientDetails.lastVisit
                          ? formatDate("2025-11-11")
                          : "N/A"}
                      </Text>
                    </Card.Body>
                  </Card.Root>
                </VStack>

                {/* Right Column */}
                <VStack gap={4} h="full">
                  <Card.Root
                    bgColor="droidalBlack.300"
                    borderColor="#2f4d78"
                    color="white"
                    w="full"
                    flex="1"
                  >
                    <Card.Header pb={0}>
                      <HStack justify="space-between">
                        <Text fontWeight="normal" letterSpacing={"widest"}>
                          Alerts
                        </Text>
                        <Box boxSize="8px" borderRadius="full" bg="red.400" />
                      </HStack>
                    </Card.Header>
                    <Card.Body>
                      <Text
                        fontSize="lg"
                        color="droidalGray.400"
                        fontWeight={"light"}
                      >
                        {patientDetails.lastVisit
                          ? "High Blood Pressure"
                          : "N/A"}
                      </Text>
                    </Card.Body>
                  </Card.Root>

                  <Card.Root
                    bgColor="droidalBlack.300"
                    borderColor="#2f4d78"
                    color="white"
                    w="full"
                    flex="1"
                  >
                    <Card.Header pb={0}>
                      <Text fontWeight="normal" letterSpacing={"widest"}>
                        Primary Physician
                      </Text>
                    </Card.Header>
                    <Card.Body>
                      <Text
                        fontSize="lg"
                        color="droidalGray.400"
                        fontWeight={"light"}
                      >
                        {patientDetails.lastVisit ? "Primary Physician" : "N/A"}
                      </Text>
                    </Card.Body>
                  </Card.Root>
                </VStack>
              </SimpleGrid>
            </>
          )}
        </VStack>
      </Box>
    </Bleed>
  );
};

export default EncounterNotesOverview;

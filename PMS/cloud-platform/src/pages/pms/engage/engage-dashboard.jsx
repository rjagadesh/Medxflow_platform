import React from "react";
import {
  Bleed,
  Box,
  Button,
  Card,
  Flex,
  Grid,
  SimpleGrid,
  HStack,
  Input,
  InputGroup,
  Text,
  VStack,
} from "@chakra-ui/react";
import {
  Calendar,
  CalendarDays,
  CalendarClock,
  CheckCircle,
  DollarSign,
  Search,
  Shield,
  TrendingUp,
  UserPlus,
  Users,
  BarChart3,
  Star,
  Globe,
  Users as UsersIcon,
  Mail,
  Phone,
  MoveRight as ArrowRight,
} from "lucide-react";
import CustomButton from "@/components/button/button";
import { LucideGradientIcon } from "@/features/home/home-card";
import PatientsModal from "@/features/pms/dashboard/modal/patients-modal";

const EngageDashboard = () => {
  // Mock data
  const followUpPriorities = [
    { name: "Emily Clark", date: "May 03" },
    { name: "John Doe", date: "May 03" },
    { name: "Emma Watson", date: "May 02" },
    { name: "David Brown", date: "May 02" },
    { name: "Sarah Miller", date: "May 01" },
  ];

  const activities = [
    {
      time: "9:21",
      name: "Mark Taylor",
      action: "updated",
      displayTime: "9:21 AM",
    },
    {
      time: "8:45",
      name: "John Doe",
      action: "appointment scheduled",
      displayTime: "8:45 AM",
    },
    {
      time: "Yest.",
      name: "Sarah Miller",
      action: "billing info",
      displayTime: "Yesterday",
    },
    {
      time: "Yest.",
      name: "Sophie Lee",
      action: "added patient",
      displayTime: "Yesterday",
    },
  ];

  const insightCards = [
    {
      title: "Return on Investment",
      icon: BarChart3,
      buttonText: "ROI Calculator",
    },
    {
      title: "Surveys & Reviews",
      icon: Star,
      buttonText: "View Reviews",
    },
    {
      title: "Online Presence",
      icon: Globe,
      buttonText: "View Online Presence",
    },
  ];

  const detailedInsights = [
    {
      title: "Appointments That were Scheduled online by patients",
      value: "45",
      buttonText: "Manage Schedule Settings",
      icon: CalendarDays,
    },
    {
      title: "Appointments that were scheduled from automatic patient recall messages",
      value: "23",
      buttonText: "Manage Recall Settings",
      icon: CalendarClock,
    },
  ];

  const patientCommunications = [
    {
      title: "Appointment reminders sent",
      value: "1,250",
      description: "Total appointment reminders sent",
      buttonText: "Manage Reminder Settings",
      icon: Calendar,
    },
    {
      title: "Appointment reminders confirmed by patients",
      value: "890",
      description: "appointment reminders confirmed by patients",
      buttonText: "Manage Reminder Settings",
      icon: CheckCircle,
    },
    {
      title: "Recalls sent resulting in appointments made",
      value: "450",
      description: "Total recalls sent resulting in 45 total appointments made",
      buttonText: "Manage Recall Settings",
      icon: Mail,
    },
    {
      title: "Follow-up surveys sent to patients",
      value: "320",
      description: "Total follow-up surveys sent to patients",
      buttonText: "Manage Patient Surveys",
      icon: Star,
    },
  ];

  return (
    <Box py={{ base: "12px", md: "16px" }}>
      {/* Date Range Picker Section */}
      <Card.Root
        bg="droidalBlack.300"
        border="1px solid"
        borderColor="#2f4d78"
        borderRadius="8px"
        p={4}
        mb={6}
      >
        <Flex justify="space-between" align="center">
          <HStack spacing={3}>
            <InputGroup size="sm" w={{ base: "full", md: "auto" }}>
              <Input
                type="date"
                placeholder="Start Date"
                fontSize="xs"
                color="white"
                borderColor="#575B67"
                _placeholder={{ color: "#9ca3af" }}
              />
            </InputGroup>
            <Input
              type="date"
              placeholder="End Date"
              fontSize="xs"
              color="white"
              borderColor="#575B67"
              w={{ base: "auto", md: "auto" }}
              _placeholder={{ color: "#9ca3af" }}
            />
            <HStack spacing={1}>
              <Button
                variant="outline"
                size="xs"
                color="white"
                borderColor="#575B67"
                _hover={{ bg: "rgba(255,255,255,0.1)" }}
                fontSize="xs"
              >
                1 Week
              </Button>
              <Button
                variant="outline"
                size="xs"
                color="white"
                borderColor="#575B67"
                _hover={{ bg: "rgba(255,255,255,0.1)" }}
                fontSize="xs"
              >
                1 Month
              </Button>
              <Button
                variant="outline"
                size="xs"
                color="white"
                borderColor="#575B67"
                _hover={{ bg: "rgba(255,255,255,0.1)" }}
                fontSize="xs"
              >
                6 Months
              </Button>
              <Button
                variant="outline"
                size="xs"
                color="white"
                borderColor="#575B67"
                _hover={{ bg: "rgba(255,255,255,0.1)" }}
                fontSize="xs"
              >
                1 Year
              </Button>
            </HStack>
          </HStack>
        </Flex>
      </Card.Root>

      {/* Insights and Detailed Insights Grid Section */}
      <Grid
        templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
        gap={6}
        mb={6}
      >
        {/* Insights Section */}
        <Card.Root
          bg="droidalBlack.300"
          border="1px solid"
          borderColor="#2f4d78"
          borderRadius="8px"
          p={4}
        >
          <Text fontSize="lg" fontWeight="bold" color="white" mb={4}>
            Insights
          </Text>
          <Grid
            templateColumns={{
              base: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            }}
            gap={4}
          >
            {insightCards.map((card, index) => (
              <Box
                key={index}
                asChild
                className={
                  "relative transition-all px-[1px] h-96 pt-[1px] duration-500 ease-in-out rounded-sm 2xl:rounded-md"
                }
                _before={{
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderRadius: "inherit",
                  padding: "1px",
                  background: "linear-gradient(90deg, transparent, transparent)",
                  mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                  maskComposite: "xor",
                  transition: "background 0.3s ease",
                }}
              >
                <Box
                  px={4}
                  py={4}
                  h="full"
                  _before={{
                    content: '""',
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    borderRadius: "inherit",
                    padding: "1px",
                    background: "linear-gradient(90deg, transparent, transparent)",
                    mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                    maskComposite: "xor",
                    transition: "background 0.3s ease",
                  }}
                  _hover={{
                    _before: {
                      background: "linear-gradient(180deg, #5A9310, #94F219)",
                    },
                  }}
                  className="bg-[#292929] rounded-lg shadow-sm hover:shadow-md cursor-pointer group relative overflow-hidden transition-all duration-500 ease-in-out"
                >
                  <VStack align="center" gap={2} h="full" justify="space-between">
                    <VStack align="center" gap={2}>
                      <HStack justify="center" w="full">
                        <Box color="white">
                          <LucideGradientIcon IconComponent={card.icon} />
                        </Box>
                      </HStack>
                      <Box textAlign="center">
                        <Text
                          fontSize={{ base: "xs", md: "sm" }}
                          color="white"
                          mb={1}
                        >
                          {card.title}
                        </Text>
                      </Box>
                    </VStack>
                    <Button
                      variant="outline"
                      size="xs"
                      color="white"
                      borderColor="#575B67"
                      _hover={{ bg: "rgba(255,255,255,0.1)" }}
                      w="full"
                      fontSize="xs"
                    >
                      <HStack gap={1}>
                        <Text>{card.buttonText}</Text>
                        <ArrowRight size={12} color="white" />
                      </HStack>
                    </Button>
                  </VStack>
                </Box>
              </Box>
            ))}
          </Grid>
        </Card.Root>

        {/* Detailed Insights Section */}
        <Card.Root
          bg="droidalBlack.300"
          border="1px solid"
          borderColor="#2f4d78"
          borderRadius="8px"
          p={4}
        >
          <VStack align="start" gap={4}>
            <Text fontSize="lg" fontWeight="bold" color="white">
              Detailed Insights
            </Text>
            <Text fontSize="md" fontWeight="medium" color="white">
              Online Appointments Generated
            </Text>
            <Grid 
              templateColumns={{ base: "1fr", lg: "repeat(2, 1fr)" }} 
              gap={4}
              w="full"
            >
              {detailedInsights.map((insight, index) => (
                <Box key={index}>
                  <Card.Root
                    bg="droidalBlack.300"
                    border="1px solid"
                    borderColor="#2f4d78"
                    borderRadius="8px"
                    p={4}
                  >
                    <VStack align="center" gap={2} w="full">
                      <HStack justify="center" w="full">
                        <Box color="white">
                          <LucideGradientIcon IconComponent={insight.icon} />
                        </Box>
                      </HStack>
                      <Box textAlign="center">
                        <Text fontSize="sm" color="white" fontWeight="medium" mb={1}>
                          {insight.title}
                        </Text>
                        <Text fontSize="2xl" fontWeight="bold" color="white">
                          {insight.value}
                        </Text>
                      </Box>
                      <Button
                        variant="outline"
                        size="xs"
                        color="white"
                        borderColor="#575B67"
                        _hover={{ bg: "rgba(255,255,255,0.1)" }}
                        w="full"
                        fontSize="xs"
                      >
                        <HStack gap={1}>
                          <Text>{insight.buttonText}</Text>
                          <ArrowRight size={12} color="white" />
                        </HStack>
                      </Button>
                    </VStack>
                  </Card.Root>
                </Box>
              ))}
            </Grid>
          </VStack>
        </Card.Root>
      </Grid>

      {/* Patient Communications Section */}
      <Card.Root
        bg="droidalBlack.300"
        border="1px solid"
        borderColor="#2f4d78"
        borderRadius="8px"
        p={4}
        mb={6}
      >
        <VStack align="start" gap={4} w="full">
          <Text fontSize="lg" fontWeight="bold" color="white">
            Patient Communications
          </Text>
          <Grid 
            templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} 
            gap={4}
            w="full"
          >
            {patientCommunications.map((comm, index) => (
              <Card.Root
                key={index}
                bg="droidalBlack.300"
                border="1px solid"
                borderColor="#2f4d78"
                borderRadius="8px"
                p={4}
              >
                <VStack align="center" gap={2} w="full">
                  <HStack justify="center" w="full">
                    <Box color="white">
                      <LucideGradientIcon IconComponent={comm.icon} />
                    </Box>
                  </HStack>
                  <Box textAlign="center">
                    <Text fontSize="xs" color="white" mb={1}>
                      {comm.title}
                    </Text>
                    <Text
                      fontSize="xl"
                      fontWeight="bold"
                      color="white"
                    >
                      {comm.value}
                    </Text>
                    <Text fontSize="xs" color="#9ca3af" mt={1}>
                      {comm.description}
                    </Text>
                  </Box>
                  <Button
                    variant="outline"
                    size="xs"
                    color="white"
                    borderColor="#575B67"
                    _hover={{ bg: "rgba(255,255,255,0.1)" }}
                    w="full"
                    fontSize="xs"
                  >
                    <HStack gap={1}>
                      <Text>{comm.buttonText}</Text>
                      <ArrowRight size={12} color="white" />
                    </HStack>
                  </Button>
                </VStack>
              </Card.Root>
            ))}
          </Grid>
        </VStack>
      </Card.Root>
    </Box>
  );
};

export default EngageDashboard;
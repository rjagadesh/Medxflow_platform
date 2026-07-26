import React from "react";
import {
  Box,
  Flex,
  Text,
  Heading,
  SimpleGrid,
  Button,
  Select,
  HStack,
  Icon,
  Center,
  Avatar,
} from "@chakra-ui/react";
import { Mail, MessageSquare, Phone } from "lucide-react";
import CustomSelect from "@/components/ui/select";
import CustomButton from "@/components/button/button";

const CommunicationCard = ({
  icon,
  title,
  description,
  status,
  iconBg,
  iconColor = "gray.500",
}) => {
  const IconComponent = icon;
  return (
    <Box
      border="1px solid"
      borderColor="droidalBlack.300"
      p={6}
      borderRadius="md"
      textAlign="center"
      bg="droidalBlack.300"
      h="full"
      display="flex"
      flexDirection="column"
    >
      <Text mb={4} fontSize="lg" fontWeight="light" color="white">
        {title}
      </Text>
      <Center mb={4} flex={1}>
        <Center w="80px" h="80px" borderRadius="full" bg={iconBg}>
          <IconComponent size={32} color={iconColor} strokeWidth={1.5} />
        </Center>
      </Center>
      <Text fontSize="sm" color="droidalGray.400" mb={6} px={2}>
        {description}
      </Text>
      <Box mt="auto">
        <Text
          fontSize="xs"
          fontWeight="light"
          letterSpacing="wider"
          color="white"
          mb={1}
        >
          Appointment Reminders
        </Text>
        <Text
          fontSize="xs"
          fontWeight="light"
          color="red.300"
          letterSpacing="wider"
        >
          {status}
        </Text>
      </Box>
    </Box>
  );
};

const PatientCommunication = () => {
  return (
    <Box p={6} bg="droidalBlack.400" h="full" overflowY="auto">
      {/* Header */}
      <Flex justify="space-between" align="center" mb={8}>
        <HStack gap={2}>
          <Text
            letterSpacing={"wide"}
            fontWeight="light"
            color="white"
            fontSize="sm"
          >
            View As:
          </Text>
          <HStack gap={2}>
            <Avatar.Root className="dark" size={"sm"}>
              <Avatar.Fallback name="Segun Adebayo" />
              {/* <Avatar.Image src="https://bit.ly/sage-adebayo" /> */}
            </Avatar.Root>
            <CustomSelect
              options={[
                {
                  label: "Albert Quainoo",
                  value: "albert-quainoo",
                },
              ]}
              placeholder="Select Patient"
              css={{
                "& button": {
                  borderRadius: "4px !important",
                  borderColor: "#2f4d78",
                  color: "white !important",
                },
              }}
              w="300px"
              size="xs"
            />
          </HStack>
        </HStack>
        <Flex
          align="center"
          color="gray.500"
          cursor="pointer"
          _hover={{ color: "white" }}
        >
          <Icon as={MessageSquare} mr={2} boxSize={4} />
          <Text fontSize="sm" fontWeight="medium">
            Custom Reminders Feedback
          </Text>
        </Flex>
      </Flex>

      <Heading
        size="md"
        letterSpacing={"widest"}
        fontWeight={"light"}
        mb={6}
        color="white"
      >
        Patient Communications
      </Heading>

      {/* Turn on Banner */}
      <Box
        bg="droidalBlack.300"
        p={8}
        borderRadius="none"
        mb={8}
        textAlign="left"
      >
        <Heading
          size="md"
          mb={4}
          fontWeight={"light"}
          letterSpacing={"wider"}
          color="white"
        >
          Turn on patient communications
        </Heading>
        <Text
          color="droidalGray.400"
          letterSpacing={"wide"}
          mb={6}
          fontSize="sm"
          lineHeight="tall"
        >
          Automating your patient communications is an effective way to increase
          your practice's income, save time, and boost productivity. Configure
          your practice's automated patient communications settings below.
        </Text>
        <Center>
          <CustomButton
            bg="primary.700"
            color="white"
            borderRadius="full"
            px={8}
            py={6}
            fontWeight="medium"
            fontSize="md"
          >
            Turn on patient communications
          </CustomButton>
        </Center>
      </Box>

      {/* When Your Practice Can Send Messages */}
      <Box mb={10}>
        <Text
          fontSize="sm"
          fontWeight="light"
          color="white"
          mb={6}
          textTransform="uppercase"
          letterSpacing="wide"
        >
          HOW YOUR PRACTICE CAN SEND MESSAGES
        </Text>
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
          <CommunicationCard
            title="Email"
            icon={Mail}
            iconBg="#f7dcdc"
            iconColor="#7a7a7a"
            description="Non-intrusive, but typically only about 20-25% of your patients will open an email that is sent to them."
            status="DISABLED"
          />
          <CommunicationCard
            title="Text Messages"
            icon={MessageSquare}
            iconBg="#dcecf7"
            iconColor="#7a7a7a"
            description="90% of all messages are read within 3 minutes of being received on the patient's mobile phone."
            status="DISABLED"
          />
          <CommunicationCard
            title="Phone Messages"
            icon={Phone}
            iconBg="#eaf2d7"
            iconColor="#7a7a7a"
            description="To save time and for a more personalized touch, you can record a custom greeting for your patients."
            status="DISABLED"
          />
        </SimpleGrid>
      </Box>

      {/* When Your Practice Can Send Messages */}
      <Box>
        <Text
          fontSize="sm"
          fontWeight="light"
          color="white"
          mb={6}
          textTransform="uppercase"
          letterSpacing="wide"
        >
          WHEN YOUR PRACTICE CAN SEND MESSAGES
        </Text>
        <Box pl={4} position="relative">
          {/* Timeline Vertical Line */}
          <Box
            position="absolute"
            left="112px"
            top="40px"
            bottom="-20px"
            w="3px"
            zIndex={0}
            bgColor={"droidalBlack.200"}
          />

          <Box position="relative" zIndex={1}>
            <Center position="absolute" left="100px" top="0">
              <Text
                fontSize="sm"
                fontWeight="light"
                color="droidalGray.400"
                mb={4}
              >
                Before the visit
              </Text>
            </Center>

            {/* Spacer to push content down below label */}
            <Box h="30px" />

            <Flex align="flex-start" mt={4}>
              <Box
                ml="130px" // Offset to right of line
                p={4}
                bg="droidalBlack.300"
                borderRadius="md"
                position="relative"
                maxW="xl"
                color="droidalGray.400"
                fontSize="sm"
                _before={{
                  content: '""',
                  position: "absolute",
                  left: "-8px",
                  top: "15px",
                  width: "0",
                  height: "0",
                  borderTop: "8px solid transparent",
                  borderBottom: "8px solid transparent",
                  borderRight: "8px solid",
                  borderRightColor: "droidalBlack.300",
                }}
                letterSpacing={"wide"}
              >
                An <b>appointment confirmation message</b> is sent once the
                patient's appointment is scheduled.
              </Box>
            </Flex>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default PatientCommunication;

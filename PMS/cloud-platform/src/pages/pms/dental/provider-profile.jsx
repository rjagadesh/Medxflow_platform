import { useState } from "react";
import {
  Box,
  Text,
  VStack,
  Button,
  Grid,
  GridItem,
  Avatar,
  Badge,
  Flex,
  Tabs,
  For,
  SimpleGrid,
  useBreakpointValue,
} from "@chakra-ui/react";
import MapImage from "@/assets/img/MAP.png";
import {
  Sparkles,
  FilesIcon,
  MapPin,
  Star,
  Calendar,
  MessageCircle,
  Clock,
  Award,
  CheckCircle,
  Users,
  Phone,
} from "lucide-react";

import { useLocation, useNavigate, useParams } from "react-router-dom";

// Tab sections components with white text
const AboutSection = (about) => (
  <Box className="space-y-4 mt-1">
    <Text fontSize="lg" fontWeight="light" mb={4} color="white">
      About Me
    </Text>

    <Text color="#90a6c6" opacity={0.9}>
      {about.about.about ||
        "Place Holder for Experienced service provider with over 5 years of professional experience. Specializing in providing high-quality services with attention to detail and customer satisfaction. Committed to delivering exceptional results for every project."}
    </Text>

    <Box className="mt-6">
      <Text fontWeight="light" mb={2} color="white">
        Experience & Qualifications:
      </Text>

      <VStack align="start" spacing={2}>
        {about?.about?.qualification ? (
          <Text color="#90a6c6" whiteSpace="pre-line">
            {about.about.qualification}
          </Text>
        ) : (
          <>
            <Flex align="center" gap={2}>
              <Text color="#90a6c6">
                Place Holder for professional experience
              </Text>
            </Flex>

            <Flex align="center" gap={2}>
              <Text color="#90a6c6">
                Place Holder for Certified Professional
              </Text>
            </Flex>

            <Flex align="center" gap={2}>
              <Text color="#90a6c6">
                Place Holder for 100+ satisfied clients
              </Text>
            </Flex>
          </>
        )}
      </VStack>
    </Box>
  </Box>
);

const ServicesSection = ({ services_offered = "" }) => {
  services_offered = services_offered
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (services_offered == "None") return null;

  return (
    <Box className="space-y-4">
      <Text fontSize="lg" fontWeight="light" mb={4} color="white">
        Services Offered
      </Text>

      {services_offered ? (
        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={4}>
          {services_offered.map((service, index) => (
            <Box
              key={index}
              p={3}
              borderRadius="md"
              bg="rgba(255, 255, 255, 0.1)"
              border="1px solid rgba(255, 255, 255, 0.2)"
            >
              <Flex align="center" gap={2}>
                <CheckCircle size={16} color="white" />
                <Text fontWeight="medium" color="white">
                  {service}
                </Text>
              </Flex>
            </Box>
          ))}
        </Grid>
      ) : (
        ""
      )}
    </Box>
  );
};
const LocationSection = (about) => (
  <Box className="space-y-4">
    <Text fontSize="lg" fontWeight="light" mb={4} color="white">
      Location & Availability
    </Text>
    {/* Map Image Section - Added below Availability */}
    <Box className="mt-2 mb-2">
      <Box
        borderRadius="md"
        overflow="hidden"
        border="1px"
        borderColor="rgba(255, 255, 255, 0.2)"
        boxShadow="md"
        position="relative"
        height="200px"
        bg="gray.700"
      >
        {/* Map placeholder with Unsplash image */}

        {about.full_address ? (
          <iframe
            title="Provider Location"
            width="100%"
            height="100%"
            style={{ border: 0 }}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://www.google.com/maps?q=${encodeURIComponent(
              about.full_address
            )}&z=15&output=embed`}
          />
        ) : (
          ""
        )}
      </Box>
    </Box>
    <Flex align="center" gap={2} mb={3}>
      <MapPin size={20} color="white" />
      <Text fontWeight="medium" color="white">
        {about.full_address || ""}
        {}
      </Text>
    </Flex>

    <Box mt={2}>
      {(() => {
        let ranges = about?.about?.week ?? {};

        // Handle stringified JSON
        if (typeof ranges === "string") {
          try {
            ranges = JSON.parse(ranges);
          } catch {
            return (
              <Text fontSize="14px" color="red.400">
                Invalid availability data
              </Text>
            );
          }
        }

        if (!ranges || Object.keys(ranges).length === 0) {
          return (
            <Text fontSize="14px" color="red.400">
              Weekly availability is required
            </Text>
          );
        }

        const rows = Object.entries(ranges).map(([locationName, days]) => {
          const enabledDays = Object.entries(days || {}).filter(
            ([, day]) => day?.enabled === true
          );

          if (enabledDays.length === 0) return null;

          return (
            <Box key={locationName} mb={3}>
              {/* Location */}
              <Text fontSize="14px" color="gray.300" fontWeight="500">
                {locationName}
              </Text>

              {/* Days in one line */}
              <Text fontSize="13px" color="gray.400" mt={1} pl={3}>
                {enabledDays.map(([dayName, day], idx) => (
                  <Text as="span" key={dayName}>
                    • {dayName}:{" "}
                    <Text as="span" color="white">
                      {day.start} – {day.end}
                    </Text>
                    {idx < enabledDays.length - 1 && " "}
                  </Text>
                ))}
              </Text>
            </Box>
          );
        });

        if (rows.every((r) => r === null)) {
          return (
            <Text fontSize="14px" color="red.400">
              At least one day must be enabled for any location
            </Text>
          );
        }

        return <Box>{rows}</Box>;
      })()}
    </Box>
  </Box>
);

const ReviewsSection = () => (
  <Box className="space-y-4">
    <Text fontSize="lg" fontWeight="light" mb={4} color="white">
      Customer Reviews
    </Text>
    <VStack spacing={4} align="stretch">
      {[1, 2, 3].map((review) => (
        <Box
          key={review}
          p={4}
          borderRadius="md"
          border="1px"
          borderColor="rgba(255, 255, 255, 0.2)"
          bg="rgba(255, 255, 255, 0.1)"
        >
          <Flex justify="space-between" align="center" mb={2}>
            <Flex align="center" gap={2}>
              <Avatar.Root size="sm">
                <Avatar.Fallback name="John Doe" />
                <Avatar.Image src="https://randomuser.me/api/portraits/men/32.jpg" />
              </Avatar.Root>
              <Text fontWeight="light" color="white">
                John Doe
              </Text>
            </Flex>
            <Flex align="center" gap={1}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} size={16} fill="gold" color="gold" />
              ))}
            </Flex>
          </Flex>
          <Text color="white" opacity={0.9}>
            Excellent service! Professional and timely. Highly recommended for
            anyone looking for quality workmanship.
          </Text>
          <Text fontSize="sm" color="white" opacity={0.7} mt={2}>
            2 weeks ago
          </Text>
        </Box>
      ))}
    </VStack>
  </Box>
);

export default function ProviderProfile(about) {
  // Responsive button sizes

  const buttonSize = useBreakpointValue({ base: "sm", md: "md" });
  const { location } = useLocation();
  const providerFromState = location?.state?.SelectedProvider;
  const { state } = useLocation();
  const providerFromStorage = state?.SelectedProvider;

  const navigate = useNavigate();
  const SelectedProvider = providerFromState || providerFromStorage;
  const full_address = [
    SelectedProvider.address,
    SelectedProvider.city,
    SelectedProvider.state,
    SelectedProvider.country,
    SelectedProvider.zipcode,
  ]
    .filter(Boolean)
    .join(", ");

  const from = location?.state?.from;
  const profilePicture = SelectedProvider.profile_picture;
  console.log("SELKECGEYGF", SelectedProvider, from);

  const tabItems = [
    {
      id: "about",
      label: "About",
      icon: <Sparkles size={18} />,
      content: <AboutSection about={SelectedProvider || "None"} />,
    },
    {
      id: "services",
      label: "Services",
      icon: <FilesIcon size={18} />,
      content: (
        <ServicesSection
          services_offered={SelectedProvider?.service || "None"}
        />
      ),
    },
    {
      id: "location",
      label: "Location",
      icon: <MapPin size={18} />,
      content: (
        <LocationSection
          about={SelectedProvider || "None"}
          full_address={full_address}
        />
      ),
    },
    {
      id: "reviews",
      label: "Reviews",
      icon: <Star size={18} />,
      content: <ReviewsSection />,
    },
  ];

  return (
    <Grid
      templateColumns="1fr"
      gap={8}
      p={4}
      maxW="full"
      mx="auto"
      bg="gray.900"
    >
      {/* ===================== PROFILE — FULL WIDTH ===================== */}
      <GridItem>
        <Box
          className="rounded-[20px] p-6 shadow-lg"
          border="1px"
          borderColor="gray.700"
          bg="gray.800"
          width="full"
        >
          <Grid
            templateColumns={{ base: "1fr", lg: "auto 1.5fr 2fr" }}
            gap={10}
            alignItems="flex-start"
          >
            {/* ================= COLUMN 1 — AVATAR ================= */}
            <Box
              width="140px"
              height="140px"
              borderRadius="md"
              overflow="hidden"
            >
              <img
                src={
                  profilePicture
                    ? `${profilePicture.replace("http://", "https://")}/`
                    : "/PersonPlaceholder.png"
                }
                alt="Profile picture"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            </Box>

            {/* ================= COLUMN 2 — NAME + ADDRESS ================= */}
            <Box>
              <Text fontSize="3xl" fontWeight="medium" color="white">
                {SelectedProvider.first_name} {SelectedProvider.last_name}
              </Text>

              <Text color="blue.400" fontSize="lg" mb={2}>
                {SelectedProvider.practice_name}
              </Text>

              <Flex align="center" gap={3} mb={3}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={16} fill="gold" color="gold" />
                ))}
                <Text color="gray.300">4.8 (128 reviews)</Text>
              </Flex>

              <Flex gap={2} align="center">
                <MapPin size={18} color="gray.400" />
                <Text color="gray.200">
                  {SelectedProvider.address}, {SelectedProvider.city}
                </Text>
              </Flex>
            </Box>

            {/* ================= COLUMN 3 — DETAILS (RIGHT SIDE ✅) ================= */}
            <SimpleGrid columns={2} spacingY={6} spacingX={12} p={1}>
              <Box>
                <Text color="gray.400" fontSize="m">
                  Specialization
                </Text>
                <Text color="white" fontSize="lg" mb={5}>
                  {SelectedProvider.specialty || "General Practice"}
                </Text>
              </Box>

              <Box mb={5} position="relative">
                <Flex justify="space-between" align="center" mb={2}>
                  <Box>
                    <Text color="gray.400" fontSize="m">
                      Sub-Specialization
                    </Text>
                    <Text color="white" fontSize="lg">
                      {SelectedProvider.sub_specialty || "N/A"}
                    </Text>
                  </Box>

                  <Button
                    onClick={() => navigate("/pms/home/providers")}
                    variant="outline"
                    colorScheme="gray"
                    borderRadius="lg"
                    color="white"
                    _hover={{ bg: "white", color: "black" }}
                    size="sm"
                  >
                    Back
                  </Button>
                </Flex>
              </Box>

              <Box>
                <Text color="gray.400" fontSize="m">
                  Provider Type
                </Text>
                <Text color="white" fontSize="lg" mb={5}>
                  {SelectedProvider.provider_type || "N/A"}
                </Text>
              </Box>

              <Box>
                <Text color="gray.400" fontSize="m">
                  Medicare PTAN
                </Text>
                <Text color="white" fontSize="lg" mb={5}>
                  {SelectedProvider.medicare_ptan || "N/A"}
                </Text>
              </Box>

              <Box>
                <Text color="gray.400" fontSize="m">
                  Medicaid ID
                </Text>
                <Text color="white" fontSize="lg" mb={5}>
                  {SelectedProvider.medicaid_id || "N/A"}
                </Text>
              </Box>

              <Box>
                <Text color="gray.400" fontSize="m">
                  Tax ID (EIN)
                </Text>
                <Text color="white" fontSize="lg" mb={5}>
                  {SelectedProvider.taxid_ein || "N/A"}
                </Text>
              </Box>

              <Box>
                <Text color="gray.400" fontSize="m">
                  Social Security Number
                </Text>
                <Text color="white" fontSize="lg" mb={5}>
                  {SelectedProvider.taxid_ssn || "N/A"}
                </Text>
              </Box>
            </SimpleGrid>
          </Grid>
        </Box>
      </GridItem>

      {/* ===================== ABOUT + BOOKING GRID ===================== */}
      <Grid
        templateColumns={{ base: "1fr", lg: "3fr 2fr" }}
        gap={8}
        alignItems="flex-start"
      >
        {/* ===================== ABOUT / TABS ===================== */}
        <GridItem>
          <Tabs.Root defaultValue="about" variant="line">
            <Tabs.List
              borderBottom="1px"
              borderColor="gray.700"
              className="no-scrollbar"
            >
              <For each={tabItems}>
                {(tab) => (
                  <Tabs.Trigger
                    key={tab.id}
                    value={tab.id}
                    py={4}
                    px={6}
                    color="gray.300"
                    _selected={{
                      color: "blue.300",
                      bg: "gray.700",
                      fontWeight: "light",
                    }}
                    _hover={{ bg: "gray.700", color: "white" }}
                  >
                    {tab.icon}
                    {tab.label}
                  </Tabs.Trigger>
                )}
              </For>
              <Tabs.Indicator />
            </Tabs.List>

            <Box
              mt={6}
              p={6}
              borderRadius="lg"
              bg="gray.800"
              border="1px"
              borderColor="gray.700"
              boxShadow="lg"
              minH="300px"
              overflowY="auto"
            >
              <For each={tabItems}>
                {(tab) => (
                  <Tabs.Content key={tab.id} value={tab.id}>
                    {tab.content}
                  </Tabs.Content>
                )}
              </For>
            </Box>
          </Tabs.Root>
        </GridItem>

        {/* ===================== BOOKING ===================== */}
        <GridItem>
          <Box
            className="rounded-[20px] p-6 shadow-lg"
            border="1px"
            borderColor="gray.700"
            bg="gray.800"
            position="sticky"
            top={4}
            mt={"10%"}
          >
            <VStack align="stretch" spacing={6}>
              <Box>
                <Text fontSize="xl" fontWeight="light" color="white" mb={2}>
                  Online Booking
                </Text>
                <Text color="#90a6c6">Book your appointment instantly</Text>
              </Box>

              <Button
                leftIcon={<Calendar size={18} />}
                bg="linear-gradient(360deg, #494949 -0.35%, #565656 99.3%)"
                _hover={{
                  bg: "linear-gradient(360deg, #555555 -0.35%, #606060 99.3%)",
                }}
                color="white"
                onClick={() => navigate("/pms/home/appointment-view")}
              >
                Book Appointment Now
              </Button>

              <Box borderTop="1px" borderColor="gray.700" pt={6}>
                <Text fontWeight="light" mb={4} color="white">
                  Got any Questions?
                </Text>

                <Button
                  leftIcon={<MessageCircle size={18} />}
                  variant="outline"
                  color="white"
                  borderColor="#2f4d78"
                >
                  Send Message
                </Button>
              </Box>
            </VStack>
          </Box>
        </GridItem>
      </Grid>
    </Grid>
  );
}

import { Avatar, Box, Button, Flex, HStack, Text } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import PatientProfile from "../profile-data/patient-collection";
import PatientCollection from "../profile-data/patient-collection";
import PatientCollectionProfile from "../profile-data/patient-collection";
import ProviderProfile from "../profile-data/provider-profile";
import { format } from "date-fns";
import { Tooltip } from "@/components/ui/tooltip";
import StepsClaimsubmission from "../profile-data/claims-submission";
import { Divide } from "lucide-react";
import { useGetAppointmentsByPatient } from "@/hooks/query/pms/pms_appointments/useGetAppointmentsByPatient";

export default function ProfilePreviewCard({
  title,
  item,
  profile,
  onClose,
  showScheduleButton = true,
}) {
  const navigate = useNavigate();
  let button_name = "View Profile";
  if (title == "CLAIM SUBMISSION") {
    button_name = "View Claim";
  }
  if (title == "Payment Posting") {
    button_name = "View Payment";
  }

  const { data: appointments = [] } = useGetAppointmentsByPatient(
    title === "Patients" ? item.id : null,
  );

  return (
    <Box
      p={5}
      id="profile-preview-card"
      borderRadius="8px"
      border="1px solid rgba(255,255,255,0.12)"
      bg="#1a1a1a"
      position="relative"
      height="310px"
      maxH="310px"
      mb={3}
    >
      {/* CLOSE BUTTON */}
      <Button
        position="absolute"
        top="10px"
        right="10px"
        size="xs"
        height="22px"
        minW="22px"
        borderRadius="full"
        padding={0}
        fontSize="10px"
        bg="rgba(255,255,255,0.1)"
        _hover={{ bg: "rgba(255,255,255,0.2)" }}
        onClick={onClose}
      >
        ✕
      </Button>

      <Flex w="100%" height={"full"} gap={12} align="flex-start">
        {title == "PATIENT COLLECTIONS" ? (
          <PatientCollectionProfile item={item} />
        ) : (
          <>
            <Flex flex="1" gap={6}>
              {title != "CLAIM SUBMISSION" && (
                <Box
                  w="120px"
                  h="120px"
                  borderRadius="12px"
                  overflow="hidden"
                  border="2px solid rgba(255,255,255,0.2)"
                  flexShrink={0}
                >
                  <img
                    src={
                      `${item.profile_picture?.replace(
                        "http://",
                        "https://",
                      )}` + "/" || "/PersonPlaceholder.png"
                    }
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/PersonPlaceholder.png";
                    }}
                    alt="Profile"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                    }}
                  />
                </Box>
              )}

              {/* DETAILS */}
              <Box flex="1">
                <Text fontSize="2xl" mb={1} color="#00AEEF">
                  {item.first_name} {item.last_name}
                </Text>
                {item.dob && (
                  <Text fontSize="sm" opacity={0.7} mb={4}>
                    {format(item.dob, "MMM dd, yyyy")}
                  </Text>
                )}

                {profile.map((col) => {
                  const content =
                    col.key === "week"
                      ? Object.entries(item.week || {})
                          .filter(([, value]) => value.enabled)
                          .map(
                            ([day, value]) =>
                              `${day} (${value.start}–${value.end})`,
                          )
                          .join(", ")
                      : item[col.key] || "—";
                  return (
                    <Flex key={col.key}>
                      <Text fontSize="sm" opacity={0.6} minW="120px">
                        {col.label}:
                      </Text>
                      <Tooltip content={content}>
                        <Text fontSize="lg" fontWeight="300" lineClamp={3}>
                          {content}
                        </Text>
                      </Tooltip>
                    </Flex>
                  );
                })}
              </Box>
              {title === "CLAIM SUBMISSION" && (
                <>
                  <Box
                    w="1px"
                    bg="rgba(255,255,255,0.15)"
                    height="250px"
                    flexShrink={0}
                  />
                  <Box p={3} borderRadius={"15px"}>
                    <Text
                      textAlign={"center"}
                      color={"#00AEEF"}
                      fontSize={"50px"}
                      pt={"20px"}
                    >
                      ${item.total_charge}
                    </Text>
                    <Text textAlign={"center"}>Billed Amount</Text>
                  </Box>
                </>
              )}
            </Flex>

            {/* RIGHT SECTIONS — ONLY FOR PATIENT */}
            {title === "Patients" && (
              <>
                {/* FIRST DIVIDER */}
                <Box
                  w="1px"
                  bg="rgba(255,255,255,0.15)"
                  height="250px"
                  flexShrink={0}
                />

                {/* FUTURE APPOINTMENTS */}
                <Box flex="1" h="full" position={"relative"}>
                  <Text fontSize="2xl" mb={1}>
                    Future Appointments
                  </Text>

                  <Box
                    p={3}
                    py="10px"
                    borderRadius="6px"
                    bg="rgba(255,255,255,0.05)"
                    border="1px solid rgba(255,255,255,0.12)"
                    maxH="150px"
                    overflowY="auto"
                  >
                    {appointments.length > 0 ? (
                      appointments.map((appt) => (
                        <Flex key={appt.id} justify="space-between" mb={2}>
                          <Box>
                            <Text fontSize="sm" fontWeight="bold">
                              {format(new Date(appt.date), "MMM dd, yyyy")}
                            </Text>
                            <Text fontSize="xs" opacity={0.7}>
                              {appt.time} -{" "}
                              {appt.provider_name || "No Provider"}
                            </Text>
                          </Box>
                          <Text fontSize="xs" color="#00AEEF">
                            {appt.confirmationstatus}
                          </Text>
                        </Flex>
                      ))
                    ) : (
                      <Text fontSize="sm" opacity={0.7}>
                        No future appointments
                      </Text>
                    )}
                  </Box>
                  <HStack position={"absolute"} right={4} bottom={4}>
                    {showScheduleButton && (
                      <Button
                        size="s"
                        bg="#00afef88"
                        color="white"
                        borderRadius="20px"
                        px={3}
                        py={1}
                        mt="auto"
                        onClick={() => {
                          navigate("/pms/home/appointment/create", {
                            state: {
                              patient: item,
                            },
                          });
                        }}
                      >
                        Schedule Appointment
                      </Button>
                    )}
                    <Button
                      size="s"
                      bg="#00afef88"
                      color="white"
                      borderRadius="20px"
                      px={3}
                      py={1}
                      mt="auto"
                      onClick={() => {
                        navigate("/pms/home/eligibility-check", {
                          state: item,
                        });
                      }}
                    >
                      Check Eligibility
                    </Button>
                  </HStack>
                </Box>

                {/* SECOND DIVIDER */}
                <Box
                  w="1px"
                  bg="rgba(255,255,255,0.15)"
                  height="250px"
                  flexShrink={0}
                />

                {/* PENDING PAYMENTS + INSURANCE */}
                <Box flex="1" display="flex" flexDirection="column">
                  <Text fontSize="2xl">Pending Payments</Text>

                  {/* TOP BLOCK */}
                  <Box
                    flex="1"
                    p={10}
                    mb={5}
                    borderRadius="6px"
                    bg="rgba(255,255,255,0.05)"
                    border="1px solid rgba(255,255,255,0.12)"
                  >
                    <Text fontSize="sm" opacity={0.7}>
                      (Pending payment — placeholder)
                    </Text>
                  </Box>

                  {/* INSURANCE */}
                  <Text fontSize="2xl">Insurance</Text>
                  <Box flex="1" h="100%" borderRadius="6px">
                    <HStack>
                      <Avatar.Root
                        alignSelf={"self-start"}
                        shape="rounded"
                        size="2xs"
                      >
                        <Avatar.Image
                          src={item?.insurance_name?.avatarUrl}
                          alt={item.insurance_name?.displayName}
                        />
                        <Avatar.Fallback
                          name={item.insurance_name?.displayName}
                        />
                      </Avatar.Root>
                      <Text fontSize="lg" color="#00AEEF">
                        {item?.insurance_name
                          ? item.insurance_name?.displayName
                          : "N/A"}
                      </Text>
                    </HStack>
                  </Box>
                </Box>
              </>
            )}
            {title === "PROVIDER" && (
              <ProviderProfile
                item={item}
                showScheduleButton={showScheduleButton}
              />
            )}
            {title === "CLAIM SUBMISSION" && (
              <StepsClaimsubmission item={item} />
            )}
          </>
        )}
      </Flex>

      {/* BOTTOM BUTTON */}

      <Flex gap={3} position="absolute" bottom="36px">
        <Button
          size="s"
          bg="#00afef88"
          color="white"
          borderRadius="20px"
          px={3}
          py={1}
          mt="auto"
          onClick={() => {
            if (title === "PROVIDER") {
              localStorage.setItem("selected_provider", JSON.stringify(item));

              navigate("/pms/platform/provider-profile", {
                state: {
                  SelectedProvider: item,
                  from: "Provider",
                },
              });
            } else if (title === "Patients") {
              navigate(`/pms/home/patients/${item.id}`);
            } else if (title === "CLAIM SUBMISSION") {
              navigate(`/pms/encounter/claimform/${item.id}`);
            } else if (title === "PAYMENT POSTING") {
              navigate(`/pms/encounter/payments/create/${item.id}`);
            }
          }}
        >
          {button_name}
        </Button>
      </Flex>
    </Box>
  );
}

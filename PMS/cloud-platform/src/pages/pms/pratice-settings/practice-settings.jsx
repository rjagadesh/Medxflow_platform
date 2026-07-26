import { Badge, Box, Flex, Text, VStack } from "@chakra-ui/react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import PlatformSettingsSidebar from "@/layouts/sidebar/platform-settings-sidebar";
import React from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";

/* ================= SIDEBAR ITEM ================= */
const SidebarItem = ({
  label,
  isActive,
  hasBadge,
  onItemClick,
  isExpandable,
  isExpanded,
}) => (
  <Flex
    align="center"
    py={2}
    px={4}
    bg={isActive ? "droidalGray.500" : "transparent"}
    color={isActive ? "white" : "droidalGray.400"}
    _hover={{ bg: "droidalGray.500", cursor: "pointer", color: "white" }}
    justify="space-between"
    onClick={onItemClick}
  >
    <Text fontSize="sm">{label}</Text>

    <Flex align="center" gap={2}>
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

      {isExpandable &&
        (isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
    </Flex>
  </Flex>
);

/* ================= DATA ================= */
const sidebarItems = [
  {
    title: "Practice Information",
    path: "practice-information",
    showSideBar: true,
  },
  { title: "Insurance", path: "insurance", showSideBar: false },
  { title: "User Settings", path: "user-settings", showSideBar: true },
  { title: "Service Locations", path: "service-locations", showSideBar: true },
  { title: "Provider Profiles", path: "provider-profiles", showSideBar: true },
  {
    title: "Telehealth Settings",
    path: "telehealth-settings",
    showSideBar: true,
  },
  { title: "Calendar Settings", path: "calendar-settings", showSideBar: true },
  { title: "Fee Schedule", path: "fee-schedule", showSideBar: true },
  { title: "Fax", path: "fax", showSideBar: true },
  { title: "Scheduling Widget", path: "scheduling-widget", showSideBar: true },
  { title: "Visit Reasons", path: "visit-reasons", showSideBar: true },
  {
    title: "Patient Communications",
    path: "patient-communications",
    showSideBar: true,
  },
  { title: "A2P Registration", path: "a2p-registration", showSideBar: true },
  { title: "Patient Intake", path: "patient-intake", showSideBar: true },
  { title: "Surveys & Reviews", path: "surveys-reviews", showSideBar: true },
  { title: "Payments", path: "payments", showSideBar: true },
  { title: "Clinical", path: "clinical", showSideBar: true },
  { title: "Misc", path: "misc", showSideBar: true },
  { title: "Data Management", path: "data-management", showSideBar: true },
  { title: "Billing", path: "billing", showSideBar: true },
  { title: "SFTP", path: "sftp-settings", showSideBar: true },
];

/* ================= MAIN ================= */
const PracticeSettings = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const activeItem = sidebarItems.find((item) =>
    location.pathname.includes(item.path),
  );

  // If no active item matches (e.g. root path), show sidebar by default
  const shouldShowSidebar = activeItem ? activeItem.showSideBar : true;

  return (
    <Flex style={{ height: "calc(100vh - 100px)" }}>
      {shouldShowSidebar && (
        <PlatformSettingsSidebar.Root>
          {sidebarItems.map((sidebarItem) => (
            <PlatformSettingsSidebar.Item
              key={sidebarItem.title}
              label={sidebarItem.title}
              isActive={location.pathname.includes(sidebarItem.path)}
              hasBadge={false}
              onItemClick={() => navigate(sidebarItem.path)}
            />
          ))}
        </PlatformSettingsSidebar.Root>
      )}

      <Box flex={1} height="full" overflow="auto">
        <Outlet />
      </Box>
    </Flex>
  );
};

export default PracticeSettings;

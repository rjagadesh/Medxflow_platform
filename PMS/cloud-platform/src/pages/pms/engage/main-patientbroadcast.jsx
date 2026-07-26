import {
  Badge,
  Box,
  Flex,
  Grid,
  GridItem,
  Text,
  VStack,
} from "@chakra-ui/react";
import { parseAsString, useQueryState } from "nuqs";
import SendBroadcast from "./patient-broadcast/send-broadcast";
import BroadcastHistory from "./patient-broadcast/broadcast-history";
import MergedRequest from "./patient-intake/merged";
import NotSubmittedRequest from "./patient-intake/not-submitted";
import PendingReview from "./patient-intake/pending-review";
import { useEffect } from "react";
import { useMemo } from "react";
import { flushSync } from "react-dom";

const contentMap = {
  "Pending Review": <PendingReview />,
  "Not Submitted Requests": <NotSubmittedRequest />,
  "Merged Requests": <MergedRequest />,
  "Send Broadcast": <SendBroadcast />,
  "Broadcast History": <BroadcastHistory />,
};

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

const EngageBroadcast = ({ type = "broadcast" }) => {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault(null)
  );

  const sidebarItems = useMemo(() => {
    if (type === "broadcast") {
      const sidebars = ["Send Broadcast", "Broadcast History"];
      return sidebars;
    } else if (type === "patient-intake") {
      const sidebars = [
        "Pending Review",
        "Not Submitted Requests",
        "Merged Requests",
      ];
      return sidebars;
    }
  }, [type]);

  useEffect(() => {
    setActiveTab(type === "broadcast" ? "Send Broadcast" : "Pending Review");
  }, [type]);



  return (
    <Flex style={{ height: "calc(100vh - 100px)" }}>
      {/* Sidebar */}
      <Box
        w="200px"
        borderRight="1px solid"
        borderColor="droidalGray.300"
        bgColor={"droidalGray.600"}
        py={4}
        overflowY={"auto"}
        display={{ base: "none", md: "block" }}
      >
        <VStack align="stretch" gap={0}>
          {sidebarItems.map((label) => (
            <SidebarItem
              key={label}
              label={label}
              isActive={activeTab === label}
              hasBadge={false}
              onItemClick={() => setActiveTab(label)}
            />
          ))}
        </VStack>
      </Box>

      <Box flex={1} height="full" overflow="auto">
        {contentMap[activeTab] ? contentMap[activeTab] : null}
      </Box>
    </Flex>
  );
};

export default EngageBroadcast;

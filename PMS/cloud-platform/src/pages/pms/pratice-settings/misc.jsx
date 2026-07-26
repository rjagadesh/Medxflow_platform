import React from "react";
import PlatformSettingsSidebar from "@/layouts/sidebar/platform-settings-sidebar";
import { Box, Button, Flex, HStack } from "@chakra-ui/react";
import { useQueryState } from "nuqs";
import { parseAsString } from "nuqs";
import { ArrowLeftIcon } from "lucide-react";
import MiscPortal from "./misc-portal";
import MiscReferprovider from "./misc-referringprovider";
import MiscRefersources from "./misc-refersources";

const sidebarItems = [
  "Portal Settings",
  "Refferring Providers",
  "Refferal Sources",
];

const MiscPage = () => {
  const [activeTab, setActiveTab] = useQueryState(
    "misc-tab",
    parseAsString.withDefault("Portal Settings")
  );

  return (
    <>
      <Flex style={{ height: "calc(100vh - 100px)" }}>
        <PlatformSettingsSidebar.Root>
          <HStack>
            <Button color={"white"} variant={"plain"}>
              <ArrowLeftIcon /> Back
            </Button>
          </HStack>
          {sidebarItems.map((label) => (
            <PlatformSettingsSidebar.Item
              key={label}
              label={label}
              isActive={activeTab === label}
              hasBadge={false}
              onItemClick={() => setActiveTab(label)}
            />
          ))}
        </PlatformSettingsSidebar.Root>

        <Box
          flex={1}
          bgColor={"droidalBlack.400"}
          height="full"
          overflow="auto"
        >
          {activeTab === "Portal Settings" && <MiscPortal />}
          {activeTab === "Refferring Providers" && <MiscReferprovider />}
          {activeTab === "Refferal Sources" && <MiscRefersources />}
        </Box>
      </Flex>
    </>
  );
};

export default MiscPage;

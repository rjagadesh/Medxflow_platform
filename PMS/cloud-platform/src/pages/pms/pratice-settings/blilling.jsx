import React from "react";
import PlatformSettingsSidebar from "@/layouts/sidebar/platform-settings-sidebar";
import { Box, Button, Flex, HStack } from "@chakra-ui/react";
import { useQueryState } from "nuqs";
import { parseAsString } from "nuqs";
import { ArrowLeftIcon } from "lucide-react";
import Billingreceipts from "./billing-receipts";
import BillingChargeCapture from "./billing-chargecapture";

const sidebarItems = ["Receipts", "Charge Capture"];

const BillingPage = () => {
  const [activeTab, setActiveTab] = useQueryState(
    "clinical-tab",
    parseAsString.withDefault("Receipts")
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
          {activeTab === "Receipts" && <Billingreceipts />}
          {activeTab === "Charge Capture" && <BillingChargeCapture />}
        </Box>
      </Flex>
    </>
  );
};

export default BillingPage;

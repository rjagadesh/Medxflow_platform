import React from "react";
import PlatformSettingsSidebar from "@/layouts/sidebar/platform-settings-sidebar";
import { Box, Button, Flex, HStack } from "@chakra-ui/react";
import { useQueryState } from "nuqs";
import { parseAsString } from "nuqs";
import { ArrowLeftIcon } from "lucide-react";
import ClinicalPrescription from "./clinical-prescription";
import ClinicalDecision from "./clinical-decision";
import ClinicalFlowsheet from "./clinical-flowcheet";
import ClinicalLabList from "./clinical-lablist";
import ClinicalChartAccess from "./clinical-chartaccess";
import ClinicalERX from "./clinical-erx";

const sidebarItems = [
  "Prescription Preference",
  "Clinical Decision Support",
  "Flowsheets",
  "Lab List",
  "Chart Access",
  "eRx Enrollment",
];

const ClinicalPage = () => {
  const [activeTab, setActiveTab] = useQueryState(
    "clinical-tab",
    parseAsString.withDefault("Prescription Preference")
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
          {activeTab === "Prescription Preference" && <ClinicalPrescription />}
          {activeTab === "Clinical Decision Support" && <ClinicalDecision />}
          {activeTab === "Flowsheets" && <ClinicalFlowsheet />}
          {activeTab === "Lab List" && <ClinicalLabList />}
          {activeTab === "Chart Access" && <ClinicalChartAccess />}
          {activeTab === "eRx Enrollment" && <ClinicalERX />}
        </Box>
      </Flex>
    </>
  );
};

export default ClinicalPage;

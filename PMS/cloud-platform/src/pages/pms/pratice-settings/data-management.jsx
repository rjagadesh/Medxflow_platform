import React from "react";
import PlatformSettingsSidebar from "@/layouts/sidebar/platform-settings-sidebar";
import { Box, Button, Flex, HStack } from "@chakra-ui/react";
import { useQueryState } from "nuqs";
import { parseAsString } from "nuqs";
import { ArrowLeftIcon } from "lucide-react";
import DbDemographics from "./db-demographics";
import DbClinicaldata from "./db-clinicaldata";
import DbPatientdata from "./db-patientdata";

const sidebarItems = [
  "Import Demographics",
  "Import Clinical Data",
  "Import Patient Data",
];

const DateManagementPage = () => {
  const [activeTab, setActiveTab] = useQueryState(
    "data-management-tab",
    parseAsString.withDefault("Import Demographics")
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
          {activeTab === "Import Demographics" && <DbDemographics />}
          {activeTab === "Import Clinical Data" && <DbClinicaldata />}
          {activeTab === "Export Patient Data" && <DbPatientdata />}
        </Box>
      </Flex>
    </>
  );
};

export default DateManagementPage;

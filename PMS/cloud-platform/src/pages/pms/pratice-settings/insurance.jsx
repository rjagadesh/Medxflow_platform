import React, { useState } from "react";
import { Plus, X, Search } from "lucide-react";
import PlatformSettingsSidebar from "@/layouts/sidebar/platform-settings-sidebar";
import { Box, Button, Flex, HStack } from "@chakra-ui/react";
import { useQueryState } from "nuqs";
import { parseAsString } from "nuqs";
import InsuranceCompanies from "./insurance-companies";
import NewInsurancePlan from "@/features/pms/pratice-settings/insurance/new-insurance-plan";
import { ArrowLeftIcon } from "lucide-react";
import InsurancePlanSearch from "@/features/pms/pratice-settings/insurance-plan/find-insurance-plan";
import InsurancePolicy from "@/features/pms/pratice-settings/insurance-policy/insurance-policy";
import { useNavigate } from "react-router-dom";

/* ---------------- SAMPLE DATA ---------------- */
const COMMON_INSURANCES = [
  { name: "Aetna", vendor: "Trizetto" },
  { name: "Blue Cross Blue Shield", vendor: "Trizetto" },
  { name: "Cigna Healthcare", vendor: "Trizetto" },
  { name: "UnitedHealthcare", vendor: "Trizetto" },
  { name: "Humana", vendor: "Trizetto" },
];

const sidebarItems = [
  "Insurance Companies",
  "New Insurance Plan",
  "Find Insurance Plans",
  "New Insurance Policy",
];

const Insurance = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useQueryState(
    "insurance-tab",
    parseAsString.withDefault("Insurance Companies"),
  );

  return (
    <>
      <Flex style={{ height: "calc(100vh - 100px)" }}>
        <PlatformSettingsSidebar.Root>
          <HStack>
            <Button
              onClick={() => {
                navigate(-1);
              }}
              color={"white"}
              variant={"plain"}
            >
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
          {activeTab === "Insurance Companies" && <InsuranceCompanies />}
          {activeTab === "New Insurance Plan" && <NewInsurancePlan />}
          {activeTab === "Find Insurance Plans" && <InsurancePlanSearch />}
          {activeTab === "New Insurance Policy" && <InsurancePolicy />}
        </Box>
      </Flex>
    </>
  );
};

export default Insurance;

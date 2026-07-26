import { Box, Flex, Button } from "@chakra-ui/react";
import { useState } from "react";

// import ClaimSubmission from "./tabs/ClaimSubmission";
import NotFoundPage from "@/pages/not-found";
import { useParams } from "react-router-dom";
import ClaimOverview from "./general";

export default function ClaimsPage() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("general");

  const CLAIM_TABS = [
    { key: "general", label: "General" },
    { key: "details", label: "Details" },
    { key: "log", label: "Log" },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "general":
        return <ClaimOverview id={id} />;
      // <ClaimSubmission />;
      case "details":
        return <NotFoundPage />;
      case "log":
        return <NotFoundPage />;
      default:
        return null;
    }
  };

  return (
    <Box p={4} bg="#2b2b2bff" borderRadius={"15px"} minH="100vh">
      {/* Tabs Header */}
      <Flex gap={3} mb={2}>
        {CLAIM_TABS.map((tab) => (
          <Button
            key={tab.label}
            size="sm"
            variant={activeTab === tab.key ? "solid" : "bold"}
            bg={activeTab === tab.key ? "#00afef" : "transparent"}
            color="white"
            borderRadius="20px"
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </Button>
        ))}
      </Flex>

      {/* Tab Content */}

      {renderTabContent()}
    </Box>
  );
}

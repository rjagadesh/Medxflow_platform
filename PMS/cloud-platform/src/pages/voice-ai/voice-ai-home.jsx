import UserMenu from "@/components/user-popover/user-popover";
import HomeApps from "../home";
import { HStack, Image, VStack } from "@chakra-ui/react";
import { BellIcon } from "lucide-react";
import VoiceAILogoImage from "@/assets/icons/voice_ai.png";
import { Heading } from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import CustomBreadcrumb from "@/components/breadcrumb/breadcrumb";

const VoiceAiHome = () => {
  const { department_id } = useParams();
  return (
    <>
      <HStack justify={"space-between"} py={3}>
        <CustomBreadcrumb
          sidebarItems={[
            {
              name: "Agents",
              to: `/voice-ai/${department_id}`,
              end: true,
            },
            {
              name: "Analytics",
              to: `/voice-ai/${department_id}/analytics`,
            },
            {
              name: "Billing",
              to: `/voice-ai/${department_id}/billing`,
            },
          ]}
          suffix={`/voice-ai/${department_id}/`}
          search={location.search}
          fontSize={{
            base: "sm",
          }}
        />

        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </HStack>
      <HomeApps
        customUrl="configurations"
        customButtonName="Add a custom Voice agent"
      />
    </>
  );
};

export default VoiceAiHome;

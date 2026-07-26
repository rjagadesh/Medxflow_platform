import CustomBreadcrumb from "@/components/breadcrumb/breadcrumb";
import UserMenu from "@/components/user-popover/user-popover";
import getSideBarItems from "@/utils/side-bar";
import { Box, HStack } from "@chakra-ui/react";
import { useMemo } from "react";
import { useParams, useLocation } from "react-router-dom";
import VersionSelector from "./VersionSelector";
import CustomButton from "@/components/button/button";

const VoiceAiHeader = ({
  onSaveAsNewVersion,
  onSave,
  isSaveLoading,
  isUpdateLoading,
  hideVersionSelector,
  isSaveAsNewVersionDisabled,
}) => {
  const { department_id, agent_app } = useParams();
  const location = useLocation();

  const dashboardNavigation = useMemo(() => {
    return getSideBarItems("VOICE_AI", true);
  }, []);

  return (
    <HStack justify={"space-between"} py={3}>
      <CustomBreadcrumb
        sidebarItems={dashboardNavigation}
        suffix={`/voice-ai/${department_id}/${agent_app}`}
        search={location.search}
        fontSize={{
          base: "sm",
        }}
      />
      <HStack gap={4}>
        {!hideVersionSelector && agent_app && <VersionSelector label="" />}
        {onSave && (
          <CustomButton size="xs" onClick={onSave} loading={isUpdateLoading}>
            Save Changes
          </CustomButton>
        )}
        {onSaveAsNewVersion && (
          <CustomButton
            size="xs"
            variant="outline"
            onClick={onSaveAsNewVersion}
            loading={isSaveLoading}
            disabled={isSaveAsNewVersionDisabled}
          >
            Save as New Version
          </CustomButton>
        )}
        <UserMenu />
      </HStack>
    </HStack>
  );
};

export default VoiceAiHeader;

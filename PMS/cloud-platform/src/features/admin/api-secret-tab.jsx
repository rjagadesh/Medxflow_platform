import { Clipboard, HStack, IconButton } from "@chakra-ui/react";
import SecretAPIKeyModal from "./modal/secret-api-key";
import { useSubAgentsAPIKeys } from "@/hooks/query/admin/useGetSubAgentAPIkeys";
import GenericTable from "@/components/table/table";
import CustomButton from "@/components/button/button";
import UnauthorizedPage from "@/pages/unauthorized";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";

const APISecretKeyTab = () => {
  const { isLoading: isLoadingSubAgents, data: subAgentsKeys = [] } =
    useSubAgentsAPIKeys();

  const { hasPermission } = usePermissions();

  const columns = [
    {
      title: "Agent",
      accessor_key: "apps_data",
      render: (_, item) => item.sub_app_data?.app_name,
    },
    {
      title: "App",
      accessor_key: "apps_data",
      render: (_, item) => item.sub_app_data?.sub_app_name,
    },
    {
      title: "API Key",
      accessor_key: "apps_data",
      render: (_, item) => (
        <HStack>
          <div
            style={{
              padding: "10px",
              borderRadius: "6px",
              fontFamily: "monospace",
              fontSize: "14px",
            }}
          >
            ************
          </div>
          <Clipboard.Root value={item.api_key}>
            <Clipboard.Trigger asChild>
              <IconButton variant="surface" size="xs">
                <Clipboard.Indicator />
              </IconButton>
            </Clipboard.Trigger>
          </Clipboard.Root>
        </HStack>
      ),
    },
    {
      title: "Actions",
      accessor_key: "actions",
      render: () => (
        <CustomButton
          onClick={() => {}}
          size="sm"
          variant="primary"
          text="Regenerate"
        >
          Regenerate
        </CustomButton>
      ),
    },
  ];

  if (!hasPermission("ai_api_keys", "view")) return <UnauthorizedPage />;

  return (
    <div className="text-white pt-8">
      <GenericTable
        columns={columns || []}
        rightAction={<SecretAPIKeyModal />}
        data={subAgentsKeys || []}
        loader={isLoadingSubAgents}
        headerLoading={false}
        pagination={false}
        title={"API Secret Keys"}
        count={subAgentsKeys?.length}
      />
    </div>
  );
};

export default APISecretKeyTab;

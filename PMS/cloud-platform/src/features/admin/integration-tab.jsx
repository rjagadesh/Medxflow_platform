import { useAPIkeys } from "@/hooks/query/apikeys/useAPIkeys";
import IntegrationModal from "./modal/integration-modal";
import { Clipboard, HStack, IconButton } from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import GenericTable from "@/components/table/table";
import CustomSelect from "@/components/ui/select";
import { useUpdateRetry } from "@/hooks/mutation/admin/useUpdateRetry";
import { toaster } from "@/components/ui/toaster";
import UnauthorizedPage from "@/pages/unauthorized";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";

const IntegrationTab = () => {
  const { isLoading, data: apiKeys = [] } = useAPIkeys();
  const { mutate } = useUpdateRetry();
  const { hasPermission } = usePermissions();
  console.log("apiKeys212", apiKeys);

  const handleMaxRetriesChange = (id, max_retries) => {
    mutate(
      { id, max_retries },
      {
        onSuccess: (response) => {
          toaster.success({
            title: "Success",
            description: response.message || "Max retries updated",
          });
        },
        onError: (response) => {
          console.log("response121", response);
          toaster.error({
            title: "Error",
            description: response.message || "Error updating max retries",
          });
        },
      }
    );
  };

  const columns = [
    {
      title: "Agent",
      accessor_key: "apps_data",
      render: (apps_data) => apps_data?.app_name,
    },
    {
      title: "API Key",
      accessor_key: "api_key",
      render: (api_key, item) => {
        return (
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
        );
      },
    },
    {
      title: "Max Retries",
      accessor_key: "max_retries",
      render: (api_key, item) => {
        return (
          <CustomSelect
            borderRadius="4px !important"
            borderColor="#2f4d78"
            width="100px"
            css={{
              "& button": {
                height: "44px !important",
                minHeight: "44px !important",
                borderRadius: "4px !important",
                borderColor: "#2f4d78",
              },
            }}
            options={[
              {
                label: 1,
                value: 1,
              },
              {
                label: 2,
                value: 2,
              },
              {
                label: 3,
                value: 3,
              },
            ]}
            placeholder="Select Department"
            defaultValue={[item.max_retries]}
            onValueChange={(v) => handleMaxRetriesChange(item.id, v[0])}
          />
        );
      },
    },
    {
      title: "Actions",
      accessor_key: "action",
      render: () => {
        return <CustomButton>Regenerate</CustomButton>;
      },
    },
  ];

  if (!hasPermission("agent_secret_keys", "view")) return <UnauthorizedPage />;

  return (
    <div className="text-white pt-8">
      <GenericTable
        columns={columns || []}
        rightAction={<IntegrationModal />}
        data={apiKeys || []}
        loader={isLoading}
        headerLoading={false}
        pagination={false}
        title={"Agent API Keys"}
        count={apiKeys?.length}
      />
      {/* 
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>Agent</th>
            <th style={thStyle}>API Key</th>
            <th style={thStyle}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {apiKeys?.map((item) => (
            <tr>
              <td style={tdStyle}>{item.apps_data?.app_name}</td>
              <td style={tdStyle}>
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
              </td>
              <td style={tdStyle}>
                <button
                  style={{
                    ...buttonStyle,
                    background: "#2196F3",
                    color: "white",
                  }}
                >
                  Regenerate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table> */}
    </div>
  );
};

export default IntegrationTab;

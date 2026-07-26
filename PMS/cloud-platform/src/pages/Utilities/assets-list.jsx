import { useState, useEffect } from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Square,
  PlusIcon,
  BellIcon,
  Key,
  Copy,
  Check,
} from "lucide-react";
import { CreateAssetsModal } from "../../features/ABA/modal/create-assets-modal";
import { useGetAssetQuery } from "@/hooks/query/assets/useGetAssetQuery";
// import { useDeleteAsset } from "@/hooks/mutation/useDeleteAsset";
import { Box, Button, Popover, Portal, Text, VStack } from "@chakra-ui/react";
import GenericTable from "@/components/table/table";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import CONSTANT from "@/services/constant";
import UserMenu from "@/components/user-popover/user-popover";
const BASE_URL = `${CONSTANT.BASE_URL}`;

// AssetActions component similar to QueueActions
const AssetActions = ({ handleEdit, handleDelete, asset }) => {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Button size="sm" variant="plain">
          <MoreHorizontal color="white" className="h-4 w-4" />
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className="!w-[180px]">
            <Popover.Arrow />
            <Popover.Body p={2}>
              <div className="py-0">
                <button
                  onClick={() => handleEdit(asset)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleDelete(asset);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </button>
              </div>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};

export default function AssetsList() {
  // const { mutate: deleteMutate, isPending: isDeletePending } = useDeleteAsset();
  const {
    data: assets,
    isLoading,
    isPlaceholderData,
    refetch,
  } = useGetAssetQuery();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [initialValues, setInitialValues] = useState(null);
  const { hasPermission } = usePermissions();
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  const [currentApiKey, setCurrentApiKey] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isKeyVisible, setIsKeyVisible] = useState(false);

  useEffect(() => {
  const savedKey = localStorage.getItem('projectApiKey');
  if (savedKey) {
    setCurrentApiKey(savedKey);
  }
}, []);

  const handleCreateAsset = () => {
    if (!hasPermission("create_edit_assets", "create")) return;
    setIsCreateModalOpen(true);
    setMode("create");
    setInitialValues(null);
  };

  const handleEditAsset = (asset) => {
    if (!hasPermission("create_edit_assets", "edit")) return;
    setIsCreateModalOpen(true);
    setMode("edit");
    setInitialValues(asset);
  };

  const handleDeleteAsset = async (asset) => {
    if (!hasPermission("create_edit_assets", "delete")) return;

    try {
      const response = await fetch(
        `${BASE_URL}/app/project/assets/${asset.asset_id}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`, // Add auth
          },
        }
      );

      if (response.ok) {
        refetch();
      } else {
        console.error("Failed to delete asset");
      }
    } catch (error) {
      console.error("Error deleting asset:", error);
    }
  };

  const handleGetApiKey = async () => {
  if (currentApiKey) return; // already generated

  setIsGeneratingKey(true);

  try {
    const response = await fetch(`${BASE_URL}/app/project/api-keys/generate/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("access")}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "Failed to generate API key");
    }

    const data = await response.json();
    const apiKey = data.api_key || data.key || data.token;

    if (!apiKey) {
      throw new Error("No API key returned from server");
    }

    // Save to both state and localStorage
    setCurrentApiKey(apiKey);
    localStorage.setItem('projectApiKey', apiKey);  // ← This saves it permanently

  } catch (error) {
    console.error("Error generating API key:", error);
    alert(`Error: ${error.message || "Failed to generate API key"}`);
  } finally {
    setIsGeneratingKey(false);
  }
};

const handleCopyKey = () => {
  if (!currentApiKey) return;

  navigator.clipboard.writeText(currentApiKey);
  setCopied(true);
  setTimeout(() => setCopied(false), 2000);
};

  // Format value based on asset type for display
  const formatValue = (asset) => {
    if (asset.asset_type === "Boolean") {
      return asset.value === "true" ? "True" : "False";
    }

    if (asset.asset_type === "Credentials") {
      return "*****";
    }
    return asset.value;
  };

  const columns = [
    {
      title: "Id",
      accessor_key: "asset_id",
    },
    {
      title: "Name",
      accessor_key: "name",
    },
    {
      title: "Label",
      accessor_key: "label",
    },
    {
      title: "Type",
      accessor_key: "asset_type",
    },
    {
      title: "Value",
      accessor_key: "",
      render: (_, asset) => formatValue(asset),
    },
    {
      title: "Actions",
      accessor_key: "actions",
      render: (_, asset) => (
        <AssetActions
          asset={asset}
          handleEdit={handleEditAsset}
          handleDelete={handleDeleteAsset}
        />
      ),
    },
  ];

  return (
    <>
      <>
        <Box className="top-4 py-6 right-4 z-50 flex items-center justify-between w-full gap-4">
          <VStack justify={"space-between"} gap="2" align={"flex-start"}>
            <Text
              color="#fff"
              fontSize={{
                base: "lg",
                "2xl": "22px",
                "3xl": "2xl",
              }}
              letterSpacing={"widest"}
            >
              SmartDrive: Vault
            </Text>
          </VStack>

          <div className="flex items-center justify-end gap-4">
            <div className="flex items-center gap-4">
              <UserMenu />
              <BellIcon color="#fff" size={24} />
            </div>
          </div>
        </Box>
        <GenericTable
          columns={columns || []}
          rightAction={
            <>
               {/* API Key Display + Copy */}
              {currentApiKey && (
              <div className="flex items-center gap-3 mr-6">
                <div className="flex items-center bg-gray-800 px-4 py-1.5 rounded-md border border-gray-700">
                  {/* Masked Key Display */}
                  <Box
                    as="span"
                    fontSize="sm"
                    color="#e2e8f0"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Courier New', monospace"
                    letterSpacing="0.5px"
                    whiteSpace="nowrap"
                    maxW="300px"
                    overflow="hidden"
                    textOverflow="ellipsis"
                    title="API Key (hidden for security)" // Optional tooltip
                  >
                    {/* Option 1: Fully hidden */}
                    ••••••••••••••••••••••••••••{currentApiKey.slice(-4)}

                    {/* Option 2: If you want fully hidden with no hint, use this instead: */}
                    {/* •••••••••••••••••••••••••••••••• */}
                  </Box>

                  {/* Copy Button */}
                  <button
                    onClick={handleCopyKey}
                    className="ml-3 text-gray-400 hover:text-white transition-colors"
                    title="Copy API Key to clipboard"
                  >
                    {copied ? <Check size={16} color="#48bb78" /> : <Copy size={16} />}
                  </button>
                  {/* Copied Feedback */}
                {copied && (
                  <Text fontSize="xs" color="#48bb78" fontWeight="semibold">
                    Copied!
                  </Text>
                )}
                </div>

                
              </div>
            )}

                {/* Get API Key Button */}
                <Button
              rounded="10px"
              bg="transparent"
              border="1px solid #00bbf2"
              color="#00bbf2"
              size="xs"
              isLoading={isGeneratingKey}
              loadingText={currentApiKey ? "Loading..." : "Generating..."}
              isDisabled={!!currentApiKey || isGeneratingKey} // Disable if key exists
              _hover={{
                bg: currentApiKey ? "transparent" : "rgba(0, 187, 242, 0.1)",
              }}
              _disabled={{
                opacity: 0.6,
                borderColor: "#4a5568",
                color: "#94a3b8",
              }}
              onClick={handleGetApiKey}
              leftIcon={<Key size={18} />}
              mr={4}
            >
              <Text fontSize="md" fontWeight="semibold" letterSpacing="2px" as="span">
                {currentApiKey ? "Key Active" : "Get API Key"}
              </Text>
            </Button>
              <Button
                type="submit"
                rounded="10px"
                bgImage={
                  "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)"
                }
                border={"none"}
                _hover={{
                  bgImage:
                    "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                }}
                size={"xs"}
                onClick={handleCreateAsset}
              >
                <PlusIcon />
                <Text
                  fontSize={"md"}
                  fontWeight={"semibold"}
                  letterSpacing={"2px"}
                  as={"span"}
                >
                  Create Asset
                </Text>
              </Button>
            </>
          }
          data={assets || []}
          loader={isLoading || isPlaceholderData}
          headerLoading={false}
          pagination={false}
          title={"Vault"}
          count={assets.length}
        />

        {/* {assets.length === 0 && !isLoading && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Square className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No assets found
              </h3>
              <p className="text-gray-600 mb-6">
                Get started by creating your first asset.
              </p>
              <button
                onClick={handleCreateAsset}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
              >
                Create Asset
              </button>
            </div>
          )} */}
      </>

      <CreateAssetsModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setInitialValues(null);
        }}
        mode={mode}
        initialValues={initialValues}
      />
    </>
  );
}

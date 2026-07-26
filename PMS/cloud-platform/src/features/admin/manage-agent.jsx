import { Box, HStack, Text } from "@chakra-ui/react";
import GenericTable from "@/components/table/table";
import { useHideAgent } from "@/hooks/mutation/agentsapp/useHideAgent";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import { toaster } from "@/components/ui/toaster";
import AgentForm from "../apps/models/new-agent";
import { useGetAgentsHideList } from "@/hooks/query/useGETAgentsHideList";
import { parseAsString, useQueryStates } from "nuqs";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import { useDeleteAgent } from "@/hooks/mutation/admin/useDeleteAgent";

const ManageAgent = () => {
  const { mutateAsync: hideAgent, isPending: isHiding } = useHideAgent();
  const { hasPermission } = usePermissions();
  const { mutate: deleteAgent, isPending: isDeleting } = useDeleteAgent();

  const [query, setQuery] = useQueryStates({
    page: parseAsString.withDefault(1),
  });
  const {
    data: agents,
    isLoading,
    isPlaceholderData,
  } = useGetAgentsHideList({
    page: query.page,
  });

  const onPageChange = (v) => {
    setQuery((prev) => ({
      ...prev,
      page: v,
    }));
  };

  const columns = [
    {
      title: "Agents",
      accessor_key: "module_name",
      render: (_, rowData) => {
        return (
          <HStack>
            <Text letterSpacing={"widest"}>{rowData?.module_name} -</Text>
            <Text letterSpacing={"widest"} color="#90a6c6">
              {rowData?.app_name}
            </Text>
          </HStack>
        );
      },
    },
    {
      title: "Action",
      render: (_, rowData) => (
        <HStack>
          {!rowData.is_system && (
            <AgentForm
              initialValues={rowData}
              mode="edit"
              checkPermission={() => {
                const canEditAgent = hasPermission(
                  "agents_remove_edit",
                  "edit"
                );
                return canEditAgent;
              }}
            />
          )}
          <ConfirmationDialog
            title="Confirmation"
            description="Are you sure you want to Hide the agent?"
            onConfirm={() => handleCOnfirm(rowData.id, !rowData.is_hide_app)}
            buttonName={rowData.is_hide_app ? "Show" : "Hide"}
            buttonProps={{
              variant: "danger",
              size: "xs",
            }}
            checkPermission={() => {
              const canEditAgent = hasPermission("agents_remove_edit", "edit");
              return canEditAgent;
            }}
            loading={isHiding}
          />
          {/* {!rowData.is_system && (
            <ConfirmationDialog
              title="Confirmation"
              description="Are you sure you want to delete the agent?"
              onConfirm={() => handleDelete(rowData.id)}
              buttonName="Delete"
              buttonProps={{
                variant: "danger",
                size: "xs",
              }}
              checkPermission={() => {
                const canDeleteAgent = hasPermission(
                  "agents_remove_edit",
                  "delete"
                );
                return canDeleteAgent;
              }}
              loading={isDeleting}
            />
          )} */}
        </HStack>
      ),
      tableProps: { "data-sticky": "end" },
    },
  ];

  const handleDelete = (id) => {
    let status = false;
    deleteAgent(
      { id: id },
      {
        onSuccess: () => {
          status = true;
          toaster.success({
            title: "Success",
            description: "Agent deleted successfully",
          });
        },
        onError: () => {
          status = false;
          toaster.error({
            title: "Error",
            description: "Error deleting agent",
          });
        },
      }
    );
    return status;
  };

  const handleCOnfirm = async (app_id, is_hide) => {
    let status = false;
    try {
      await hideAgent(
        { app_id, hide: is_hide },
        {
          onSuccess: () => {
            status = true;
            toaster.success({
              title: "Success",
              description: "Agent hidden successfully",
            });
          },
          onError: () => {
            toaster.error({
              title: "Error",
              description: "Error while hiding agent",
            });
          },
        }
      );
    } catch (err) {
      console.log("err", err);
    }

    return status;
  };

  return (
    <Box py="8">
      <GenericTable
        title={"Manage Agents"}
        columns={columns}
        data={agents.results}
        headerLoading={false}
        count={agents.count}
        loader={isLoading || isPlaceholderData}
        isPlaceholderData={isPlaceholderData}
        onPageChange={(v) => {
          onPageChange(v);
        }}
        page={query.page || 1}
      />
    </Box>
  );
};

export default ManageAgent;

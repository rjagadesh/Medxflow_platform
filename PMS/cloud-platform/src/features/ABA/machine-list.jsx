import { useState } from "react";
import { MoreHorizontal, Edit, Trash2, Square, PlusIcon } from "lucide-react";
import { CreateMachineModal } from "./modal/create-machine-modal";
import { useGetMachineQuery } from "@/hooks/query/machines/useGetMachineQuery";

import { Button, Popover, Portal, Text } from "@chakra-ui/react";
import GenericTable from "@/components/table/table";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";

// MachineActions component similar to AssetActions
const MachineActions = ({ handleEdit, handleDelete, machine }) => {
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
                  onClick={() => handleEdit(machine)}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(machine)}
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

const MachineList = () => {
  const {
    data: machines,
    isLoading,
    isPlaceholderData,
    refetch,
  } = useGetMachineQuery();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [initialValues, setInitialValues] = useState(null);
  const { hasPermission } = usePermissions();

  const handleCreateMachine = () => {
    if (!hasPermission("create_edit_machines", "create")) return;

    setIsCreateModalOpen(true);
    setMode("create");
    setInitialValues(null);
  };

  const handleEditMachine = (machine) => {
    if (!hasPermission("create_edit_machines", "edit")) return;
    setIsCreateModalOpen(true);
    setMode("edit");
    setInitialValues(machine);
  };

  const handleDeleteMachine = async (machine) => {
    if (!hasPermission("create_edit_machines", "delete")) return;

    try {
      const response = await fetch(
        `https://dev-cloud.droidal.com/app/license/licenses/${machine.id}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );

      if (response.ok) {
        refetch();
      } else {
        console.error("Failed to delete machine");
      }
    } catch (error) {
      console.error("Error deleting machine:", error);
    }
  };

  const columns = [
    {
      title: "#",
      accessor_key: "id",
    },
    {
      title: "Machine Name",
      accessor_key: "machine_name",
    },
    {
      title: "Machine IP Address",
      accessor_key: "machine_ip",
    },
    {
      title: "Width",
      accessor_key: "width",
    },
    {
      title: "Height",
      accessor_key: "height",
    },
    {
      title: "Username",
      accessor_key: "machine_username",
    },
    {
      title: "Password",
      accessor_key: "machine_password",
    },

    {
      title: "Actions",
      accessor_key: "actions",
      tableProps: { "data-sticky": "end" },
      render: (_, machine) => (
        <MachineActions
          handleEdit={handleEditMachine}
          handleDelete={handleDeleteMachine}
          machine={machine}
        />
      ),
    },
  ];

  return (
    <div className="pb-6 h-full">
      <GenericTable
        columns={columns || []}
        rightAction={
          <>
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
              onClick={handleCreateMachine}
            >
              <PlusIcon />
              <Text
                fontSize={"md"}
                fontWeight={"semibold"}
                letterSpacing={"2px"}
                as={"span"}
              >
                Create Machine
              </Text>
            </Button>
          </>
        }
        data={machines || []}
        count={machines.length}
        loader={isLoading || isPlaceholderData}
        headerLoading={false}
        pagination={false}
        title={"Machines"}
      />

      <CreateMachineModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setInitialValues(null);
        }}
        mode={mode}
        initialValues={initialValues}
        refetch={refetch}
      />
    </div>
  );
};

export default MachineList;

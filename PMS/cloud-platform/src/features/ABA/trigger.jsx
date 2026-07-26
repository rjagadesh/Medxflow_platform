import { MoreHorizontal, Trash2 } from "lucide-react";
import { useGetTriggersQuery } from "@/hooks/query/triggers/useGetTriggersQuery";
import {
  Button,
  HStack,
  Popover,
  Portal,
  Switch,
  Text,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useTriggerFlags } from "@/hooks/mutation/useTriggerFlags";
import GenericTable from "@/components/table/table";
import { toaster } from "@/components/ui/toaster";
import CreateTriggerModal2 from "./modal/create-trigger-modal";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import CustomButton from "@/components/button/button";
import { useState } from "react";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog-refactored";
import ApiConstant from "@/services/constant";

const TriggerActions = ({ handleDeleteTrigger, trigger }) => {
  const { hasPermission } = usePermissions();
  return (
    <Popover.Root w={150}>
      <Popover.Trigger asChild>
        <Button size="sm" variant="plain">
          <MoreHorizontal color="#fff" className="h-4 w-4" />
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            bgColor={"droidalBlack.300"}
            border={"1px solid"}
            borderColor={"droidalBlack.100"}
            className="!w-[180px]"
          >
            <Popover.Arrow
              bgColor={"droidalBlack.300"}
              css={{
                "& > div": {
                  bgColor: "#16375e !important",
                },
              }}
            />
            <Popover.Body p={2}>
              <div className="py-0">
                {/* <CreateTriggerModal2
                  mode="edit"
                  trigger_id={trigger.trigger_id}
                  checkPermission={() =>
                    hasPermission("create_edit_triggers", "edit")
                  }
                /> */}
                <button
                  onClick={() => handleDeleteTrigger(trigger.trigger_id)}
                  className="flex items-center cursor-pointer w-full px-4 py-2 text-sm text-red-600 hover:droidal-black-200"
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

function TriggerList() {
  const { data: triggers = [], isLoading, refetch } = useGetTriggersQuery();
  const { mutate: triggerflag } = useTriggerFlags();
  const [modalState, setModalState] = useState({
    show: false,
    initialState: {},
  });
  const { hasPermission } = usePermissions();
  const navigate = useNavigate();

  const handleEdit = (trigger) => {
    if (!hasPermission("create_edit_triggers", "edit")) return;

    navigate(`/aba/edit-trigger/${trigger.trigger_id}`);
  };

  const handleDeleteTrigger = async (triggerId) => {
    if (!hasPermission("create_edit_triggers", "delete")) return;

    try {
      const response = await fetch(
        `${ApiConstant.BASE_URL}/${ApiConstant.APP}/trigger/triggers/${triggerId}/`,
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
        console.error("Failed to delete trigger");
      }
    } catch (error) {
      console.error("Error deleting trigger:", error);
    }
  };

  const toggleStatus = (trigger, value) => {
    const flagPayload = {
      triggerid: trigger.trigger_id,
      machine_id: trigger.machine,
      flag_value: value ? ["1"] : ["0"],
    };

    triggerflag(flagPayload, {
      onSuccess: () => {
        refetch();
        toaster.success({
          title: "Success",
          description: "Trigger Status Updated",
        });
      },
      onError: () => {
        toaster.error({
          title: "Error",
          description: "Error updating trigger",
        });
      },
    });
  };

  const handleRun = (trigger) => {
    if (!hasPermission("start_stop_agents", "create")) return;
    const runPayload = {
      triggerid: trigger.trigger_id,
      machine_id: trigger.machine,
      flag_value: ["2"],
    };

    triggerflag(runPayload, {
      onSuccess: () => {
        refetch();
        toaster.success({
          title: "Success",
          description: "Trigger Status Updated",
        });
      },
      onError: () => {
        toaster.error({
          title: "Error",
          description: "Error updating trigger",
        });
      },
    });
  };

  const handleStop = (trigger) => {
    if (!hasPermission("start_stop_agents", "create")) return;

    const stopPayload = {
      triggerid: trigger.trigger_id,
      machine_id: trigger.machine,
      flag_value: ["3"],
    };

    triggerflag(stopPayload, {
      onSuccess: () => {
        refetch();
        toaster.success({
          title: "Success",
          description: "Trigger Status Updated",
        });
      },
      onError: () => {
        toaster.error({
          title: "Error",
          description: "Error updating trigger",
        });
      },
    });
  };

  const columns = [
    {
      title: "#",
      accessor_key: "trigger_id",
    },
    {
      title: "Name",
      accessor_key: "name",
      render: (name, trigger) => {
        return (
          <Link
            className="underline text-droid-primary-400"
            to={`/aba/trigger/details/${trigger.trigger_id}`}
          >
            <Text>{name}</Text>
          </Link>
        );
      },
    },
    {
      title: "Description",
      accessor_key: "description",
    },
    {
      title: "Type",
      accessor_key: "code_env",
      render: (code_env) => {
        return (
          <div>
            {code_env === "tasks-json" && "Code Builder"}{" "}
            {code_env === "tasks-code" && "Agent Flow"}
          </div>
        );
      },
    },
    {
      title: "Agent",
      accessor_key: "agentname",
    },
    {
      title: "Machine",
      accessor_key: "machine_name",
    },

    {
      title: "Scaling",
      accessor_key: "scaling",
    },
    {
      title: "Cron Expression",
      accessor_key: "cron_query",
      render: (cron_query) => {
        return <div>{cron_query || "N/A"}</div>;
      },
    },
    {
      title: "Status",
      accessor_key: "status",
      render: (_, trigger) => {
        return (
          <Switch.Root
            defaultChecked={trigger.cron_flag === "1" ? true : false}
            onCheckedChange={(v) => {
              toggleStatus(trigger, v.checked);
            }}
          >
            <Switch.HiddenInput />
            <Switch.Control
              bgColor={"#000 !important"}
              _checked={{
                bgImage:
                  "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%) !important",
              }}
            />
            <Switch.Label>
              {trigger.cron_flag === "1"
                ? "Active"
                : trigger.cron_flag === "0"
                ? "Inactive"
                : trigger.cron_flag === "2"
                ? "Running"
                : trigger.cron_flag === "3"
                ? "Stopped"
                : ""}
            </Switch.Label>
          </Switch.Root>

          // <Switch.Root
          //   // defaultChecked={trigger.cron_flag === "1" ? true : false}
          //   onCheckedChange={(v) => {
          //     console.log("v", v);
          //     // toggleStatus(trigger, v)
          //   }}
          //   className="inline-flex h-6 w-11 cursor-pointer rounded-full bg-gray-300 p-[2px] shadow-inner shadow-black/50 transition-colors duration-200 data-[state=checked]:bg-green-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          //   id={`switch-${trigger.trigger_id}`}
          //   aria-label="Toggle Trigger Status"
          // >
          //   <Switch.Thumb className="block h-5 w-5 rounded-full bg-white transition-transform duration-200 data-[state=checked]:translate-x-5" />
          // </Switch.Root>
        );
      },
    },
    {
      title: "Machine Status",
      accessor_key: "machine_status",
      render: (_, trigger) => {
        return (
          <div className="px-3 py-2 flex justify-center gap-1">
            <button
              onClick={() => handleRun(trigger)}
              className="px-2 py-1 text-xs rounded bg-green-600 text-white hover:bg-green-700 transition"
            >
              Run
            </button>
            <button
              onClick={() => handleStop(trigger)}
              className="px-2 py-1 text-xs rounded bg-red-600 text-white hover:bg-red-700 transition"
            >
              Stop
            </button>
          </div>
        );
      },
    },
    {
      title: "Actions",
      accessor_key: "actions",
      tableProps: { "data-sticky": "end" },
      render: (_, trigger) => (
        <TriggerActions
          trigger={trigger}
          handleEdit={handleEdit}
          handleDeleteTrigger={(deleteId) => {
            setModalState((prev) => ({
              ...prev,
              open: true,
              initialState: deleteId,
            }));
          }}
        />
      ),
    },
  ];

  return (
    <div className="h-full pb-6">
      {/* Table */}
      <GenericTable
        columns={columns || []}
        rightAction={
          <HStack>
            <CustomButton
              onClick={() => {
                window.extensionId = "jdehhckfjldgkgmbeealligfdfoljkhk";
                window.postMessage(
                  {
                    action: "messageToExtension",
                    data: {
                      type: "runbetadev",
                      taskid: 74,
                      token: localStorage.getItem("access"),
                      domain: window.location.origin,
                    },
                  },
                  "*"
                );
              }}
            >
              Download MedXFlow Scheduler
            </CustomButton>
            <CreateTriggerModal2
              checkPermission={() => {
                return hasPermission("create_edit_triggers", "create");
              }}
            />
          </HStack>
        }
        data={triggers || []}
        loader={isLoading}
        headerLoading={false}
        pagination={false}
        title={"Trigger List"}
        count={triggers.length}
      />
      <ConfirmationDialog
        open={modalState.open}
        onClose={(v) => {
          setModalState({ ...modalState, open: v ?? false });
        }}
        onConfirm={() => {
          handleDeleteTrigger(modalState.initialState);
        }}
        title="Delete Trigger"
        description="Are you sure you want to delete this trigger?"
      />
    </div>
  );
}

export default TriggerList;

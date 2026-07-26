import { useState, useEffect, useRef } from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Square,
  ChevronDown,
  PlusIcon,
} from "lucide-react";
import { CreateQueueModal } from "./modal/create-queue-modal";
import { useGetQueuesQuery } from "@/hooks/query/queues/useGetQueuesQuery";
import { Button, Input, Popover, Portal, Text } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import GenericTable from "@/components/table/table";

const QueueActions = ({ handleEdit, handleDeleteQueue, queue }) => {
  return (
    <Popover.Root w={150}>
      <Popover.Trigger asChild>
        <Button size="sm" variant="plain">
          <MoreHorizontal color="#fff" className="h-4 w-4" />
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content className="!w-[180px]">
            <Popover.Arrow />
            <Popover.Body p={2}>
              <div className="py-0">
                <button
                  onClick={() => {
                    handleEdit(queue.id);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </button>
                <button
                  onClick={() => {
                    handleDeleteQueue(queue.id);
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </button>
              </div>{" "}
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
};

export function QueueList() {
  const { data: queues = [], isLoading, refetch } = useGetQueuesQuery();
  console.log("queues", queues);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [openDropdowns, setOpenDropdowns] = useState([]);
  const dropdownRef = useRef(null);
  const [initialValues, setInitialValues] = useState({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdowns([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleCreateQueue = (newQueue) => {};

  const handleEdit = (queueId) => {
    setIsCreateModalOpen(true);
    setMode("edit");
    setInitialValues(queues.find((queue) => queue.id === queueId));
  };

  const handleDeleteQueue = async (queueId) => {
    try {
      const response = await fetch(
        `https://dev-cloud.droidal.com/app/queue/queues/${queueId}/`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        refetch(); // Refresh the queue list after deletion
      } else {
        console.error("Failed to delete queue");
      }
    } catch (error) {
      console.error("Error deleting queue:", error);
    }
  };

  const columns = [
    {
      title: "#",
      accessor_key: "id",
    },
    {
      title: "Name",
      accessor_key: "queue_name",
    },
    {
      title: "Description",
      accessor_key: "description",
    },
    {
      title: "Truncate Date",
      accessor_key: "truncate_date",
    },
    {
      title: "No of Retry",
      accessor_key: "retry_count",
    },
    {
      title: "Actions",
      accessor_key: "actions",
      render: (_, queue) => (
        <QueueActions
          queue={queue}
          handleEdit={handleEdit}
          handleDeleteQueue={handleDeleteQueue}
        />
      ),
    },
  ];

  return (
    <div className="pb-6">
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
              onClick={() => setIsCreateModalOpen(true)}
            >
              <PlusIcon />
              <Text
                fontSize={"md"}
                fontWeight={"semibold"}
                letterSpacing={"2px"}
                as={"span"}
              >
                Create Queue
              </Text>
            </Button>
          </>
        }
        data={queues || []}
        loader={isLoading}
        headerLoading={false}
        pagination={false}
        title={"Queue List"}
      />

      <CreateQueueModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setInitialValues({});
          setMode("create");
        }}
        onSubmit={handleCreateQueue}
        mode={mode}
        initialValues={initialValues}
      />
    </div>
  );
}

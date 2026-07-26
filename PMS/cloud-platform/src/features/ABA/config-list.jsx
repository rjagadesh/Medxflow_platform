import { useState, useEffect, useRef } from "react";
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Play,
  Square,
  ChevronDown,
} from "lucide-react";
import { CreateQueueModal } from "./modal/create-queue-modal";
import { CreateConfigModal } from "./modal/create-config-modal";
import { Button } from "@chakra-ui/react";

export function ConfigList() {
  const [queues, setQueues] = useState([
    {
      id: 1,
      name: "Config",
      type: "Integer",
      value: 10,
    },
    {
      id: 2,
      name: "Config",
      type: "Integer",
      value: 10,
    },
    {
      id: 3,
      name: "Config",
      type: "Integer",
      value: 10,
    },
  ]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState([]);
  const dropdownRef = useRef(null);

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

  const handleTaskNameChange = (queueId, taskName) => {
    setQueues((prev) =>
      prev.map((queue) =>
        queue.id === queueId ? { ...queue, taskName } : queue
      )
    );
  };

  const handleCreateQueue = (newQueue) => {
    const id = Math.max(...queues.map((q) => q.id), 0) + 1;
    setQueues((prev) => [...prev, { ...newQueue, id }]);
    setIsCreateModalOpen(false);
  };

  const handleDeleteQueue = (queueId) => {
    setQueues((prev) => prev.filter((queue) => queue.id !== queueId));
  };

  const toggleQueueStatus = (queueId) => {
    setQueues((prev) =>
      prev.map((queue) =>
        queue.id === queueId
          ? {
              ...queue,
              status: queue.status === "active" ? "inactive" : "active",
            }
          : queue
      )
    );
  };

  return (
    <div className="p-6 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-droidal-black-300 rounded-lg shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Config List
              </h1>
              <p className="text-sm text-white mt-1">Manage your queues</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              variant={"subtle"}
            >
              Create Config
            </Button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-droidal-black-200">
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
                    Type
                  </th>
                  <th className="w-32 px-4 py-3 text-center text-sm font-medium text-gray-500">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody>
                {queues.map((queue) => (
                  <tr
                    key={queue.id}
                    className="border-b border-droidal-black-100"
                  >
                    <td className="px-4 py-4 text-center font-medium text-gray-900">
                      {queue.id}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            queue.status === "active"
                              ? "bg-green-500"
                              : "bg-gray-400"
                          }`}
                        />
                        <span className="font-medium text-blue-600 hover:text-blue-800 cursor-pointer">
                          {queue.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-white">{queue.type}</td>
                    <td className="px-4 py-4 text-center">{queue.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {queues.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Square className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No queues found
              </h3>
              <p className="text-white mb-6">
                Get started by creating your first queue.
              </p>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors duration-200"
              >
                Create Config
              </button>
            </div>
          )}
        </div>
      </div>

      <CreateConfigModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateQueue}
      />
    </div>
  );
}

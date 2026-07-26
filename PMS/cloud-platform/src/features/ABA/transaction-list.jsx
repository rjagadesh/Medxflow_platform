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

export function TransactionList() {
  const [transactions, setTransactions] = useState([
    {
      status: "Deleted",
      reference: "Ref-001",
      Revision: "None",
      priority: "High",
      DeadLine: "23/01/2024 10:30 am",
      postpone: "23/01/2024 10:40 am",
      Started: "23/01/2024 10:40 am",
      ended: "23/01/2024 10:40 am",
      Exception: "None",
    },
    {
      status: "Active",
      reference: "Ref-002",
      Revision: "Rev-1",
      priority: "Medium",
      DeadLine: "24/01/2024 11:00 am",
      postpone: "24/01/2024 11:10 am",
      Started: "24/01/2024 11:10 am",
      ended: "24/01/2024 11:40 am",
      Exception: "Timeout",
    },
    {
      status: "Pending",
      reference: "Ref-003",
      Revision: "Rev-2",
      priority: "Low",
      DeadLine: "25/01/2024 12:00 pm",
      postpone: "25/01/2024 12:10 pm",
      Started: "25/01/2024 12:10 pm",
      ended: "25/01/2024 12:40 pm",
      Exception: "None",
    },
    {
      status: "Completed",
      reference: "Ref-004",
      Revision: "Rev-3",
      priority: "High",
      DeadLine: "26/01/2024 01:00 pm",
      postpone: "26/01/2024 01:10 pm",
      Started: "26/01/2024 01:10 pm",
      ended: "26/01/2024 01:40 pm",
      Exception: "Error",
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

  const handleCreateQueue = (newQueue) => {
    const id = Math.max(...queues.map((q) => q.id), 0) + 1;
    setQueues((prev) => [...prev, { ...newQueue, id }]);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Transaction List
              </h1>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    Reference
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    Revision
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    Priority
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    Deadline
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    Postpone
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    Started
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    Ended
                  </th>
                  <th className="px-4 py-3 text-center text-sm font-medium text-gray-500">
                    Exception
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx, idx) => (
                  <tr
                    key={idx}
                    className="hover:bg-gray-50 border-b border-gray-200"
                  >
                    <td className="px-4 py-4 text-center">{tx.status}</td>
                    <td className="px-4 py-4 text-center">{tx.reference}</td>
                    <td className="px-4 py-4 text-center">{tx.Revision}</td>
                    <td className="px-4 py-4 text-center">{tx.priority}</td>
                    <td className="px-4 py-4 text-center">{tx.DeadLine}</td>
                    <td className="px-4 py-4 text-center">{tx.postpone}</td>
                    <td className="px-4 py-4 text-center">{tx.Started}</td>
                    <td className="px-4 py-4 text-center">{tx.ended}</td>
                    <td className="px-4 py-4 text-center">{tx.Exception}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {transactions.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Square className="mx-auto h-12 w-12" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No transactions found
              </h3>
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

import React, { useEffect, useState } from "react";
import { Search, Pencil, Trash2 } from "lucide-react";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";
import AddEditEntryModal from "./AddEditEntryModal";
import CustomButton from "@/components/button/button";
import { useNavigate } from "react-router-dom";

const FeeSchedule = () => {
  const navigate = useNavigate();

  const [allEntries, setAllEntries] = useState([]); // 🔹 master list
  const [entries, setEntries] = useState([]);       // 🔹 filtered list
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);

  // ================= FETCH ONCE =================
  const fetchEntries = async () => {
    try {
      setLoading(true);

      const res = await apiRequest(apiRoutes.feeScheduleEntry.get);
      const data = res?.entries || res || [];

      setAllEntries(Array.isArray(data) ? data : []);
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to fetch entries", err);
      setAllEntries([]);
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // ================= FRONTEND SEARCH =================
  useEffect(() => {
    if (!searchQuery.trim()) {
      setEntries(allEntries);
      return;
    }

    const q = searchQuery.toLowerCase();

    const filtered = allEntries.filter((entry) => {
      return (
        entry.procedure_code?.toLowerCase().includes(q) ||
        entry.modifier?.toLowerCase().includes(q) ||
        entry.note?.toLowerCase().includes(q)
      );
    });

    setEntries(filtered);
  }, [searchQuery, allEntries]);

  // ================= ACTIONS =================
  const openCreateModal = () => {
    setEditingEntry(null);
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    setEditingEntry(entry);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this fee schedule entry permanently?")) return;
    try {
      await apiRequest(apiRoutes.feeScheduleEntry.delete(id));
      fetchEntries(); // refresh data
    } catch {
      alert("Failed to delete entry");
    }
  };

  // ================= UI =================
  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg p-6 h-full flex flex-col">

      {/* HEADER */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-4">
          Fee Schedule Entries
        </h2>

        {/* SEARCH */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by procedure code, modifier, or note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#252525] border border-[#404040] rounded-md text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* ACTIONS */}
        <div className="flex justify-between items-center">
          <p className="text-gray-400">
            {entries.length} {entries.length === 1 ? "entry" : "entries"} found
          </p>

          <div className="flex gap-4">
            <CustomButton
              onClick={() =>
                navigate("/pms/platform-settings/fee-schedule/bulk-upload")
              }
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-md text-white font-medium"
            >
              Bulk Upload Excel
            </CustomButton>

            <CustomButton
              onClick={openCreateModal}
              className="px-5 py-2.5 bg-green-600 hover:bg-green-700 rounded-md text-white font-medium"
            >
              Add Entry
            </CustomButton>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 overflow-auto border border-[#2a2a2a] rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-[#252525] text-gray-400 uppercase text-xs sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left">Procedure Code</th>
              <th className="px-4 py-3 text-left">Modifier</th>
              <th className="px-4 py-3 text-left">Par Amount</th>
              <th className="px-4 py-3 text-left">Non-Par Amount</th>
              <th className="px-4 py-3 text-left">Limiting Charge</th>
              <th className="px-4 py-3 text-left">Active</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" className="text-center py-10 text-gray-400">
                  Loading entries...
                </td>
              </tr>
            ) : entries.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center py-16 text-gray-500">
                  No matching entries found
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-[#2a2a2a] hover:bg-[#252525]"
                >
                  <td className="px-4 py-4 font-mono text-blue-300">
                    {entry.procedure_code}
                  </td>
                  <td className="px-4 py-4 text-gray-300">
                    {entry.modifier || "—"}
                  </td>
                  <td className="px-4 py-4 text-green-400 font-medium">
                    ${Number(entry.par_amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-yellow-400 font-medium">
                    ${Number(entry.non_par_amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-4 text-red-400 font-medium">
                    ${Number(entry.limiting_charge_amount).toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`px-3 py-1 rounded text-xs ${
                        entry.is_active
                          ? "bg-green-900 text-green-300"
                          : "bg-gray-700 text-gray-300"
                      }`}
                    >
                      {entry.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right">
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => openEditModal(entry)}
                        className="text-blue-400"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-red-400"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <AddEditEntryModal
          entry={editingEntry}
          onClose={() => setShowModal(false)}
          onSuccess={fetchEntries}
        />
      )}
    </div>
  );
};

export default FeeSchedule;

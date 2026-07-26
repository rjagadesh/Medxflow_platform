import React, { useEffect, useState } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";

/* ================= MODAL ================= */

const ServiceCodeModal = ({ initialData, onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: initialData?.name || "",
    procedures: initialData?.procedures || "",
    description: initialData?.description || "",
    is_active: initialData?.is_active ?? true,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm({
      ...form,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (initialData) {
        await apiRequest(apiRoutes.service.update, {
          metadata: { id: initialData.id },
          payload: form,
        });
      } else {
        await apiRequest(apiRoutes.service.create, {
          payload: form,
        });
      }

      onSuccess();
      onClose();
    } catch {
      alert("Failed to save service code");
    }
  };
  
  useEffect(() => {
    if (initialData) {
      setForm({
        name: initialData.name,
        procedures: initialData.procedures,
        description: initialData.description,
        is_active: initialData.is_active,
      });
    }
  }, [initialData]);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1e1e] border border-[#3a3a3a] rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 flex items-center justify-between">
          <h3 className="text-white text-xl font-semibold">
            {initialData ? "Edit Service Code" : "Add Service Code"}
          </h3>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Service Name <span className="text-red-400">*</span>
            </label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Enter service name"
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Procedures
            </label>
            <input
              name="procedures"
              value={form.procedures}
              onChange={handleChange}
              placeholder="e.g., CPT-99213"
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Enter service description"
              rows={3}
              className="w-full bg-[#2a2a2a] border border-[#3a3a3a] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={form.is_active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#3a3a3a] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-300">
              {form.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#2a2a2a] px-6 py-4 flex justify-end gap-3 border-t border-[#3a3a3a]">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-sm font-medium text-gray-300 bg-[#1e1e1e] border border-[#3a3a3a] rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all"
          >
            {initialData ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

/* ================= MAIN PAGE ================= */

const ServiceCode = () => {
  const [serviceCodes, setServiceCodes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);

  const fetchServiceCodes = async () => {
    try {
      const response = await apiRequest(apiRoutes.service.list);
      const data = response?.data ?? response;
      setServiceCodes(data?.service_codes || []);
    } catch {
      setServiceCodes([]);
    }
  };

  useEffect(() => {
    fetchServiceCodes();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this service code?")) return;

    try {
      await apiRequest(apiRoutes.service.delete, {
        metadata: { id },
      });
      fetchServiceCodes();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <div className="bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl shadow-lg p-8 h-full">
      {/* Back Button */}
      <button
        onClick={() => window.history.back()}
        className="flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft size={20} />
        <span className="text-sm font-medium">Back</span>
      </button>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 pb-5 border-b border-[#2a2a2a]">
        <div>
          <h2 className="text-white text-2xl font-bold">Service Codes</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manage your medical service codes and procedures
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedService(null);
            setShowModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm hover:shadow transition-all"
        >
          <Plus size={16} /> Add Service Code
        </button>
      </div>

      {/* List */}
      <div className="border border-[#2a2a2a] rounded-lg overflow-hidden">
        {/* Table Header */}
        <div className="flex justify-between items-center px-6 py-3 bg-[#2a2a2a] border-b border-[#3a3a3a]">
          <div className="flex-1 grid grid-cols-3 gap-6">
            <div className="text-xs font-semibold text-gray-400 uppercase">
              Service Name
            </div>
            <div className="text-xs font-semibold text-gray-400 uppercase">
              Procedures
            </div>
            <div className="text-xs font-semibold text-gray-400 uppercase">
              Description
            </div>
          </div>
          <div className="w-10"></div>
        </div>

        {/* Table Rows */}
        {serviceCodes.map((item, index) => (
          <div
            key={item.id}
            className="flex justify-between items-start px-6 py-4 border-b border-[#2a2a2a] last:border-b-0 hover:bg-[#2a2a2a]/50 transition-colors"
          >
            <div className="flex-1 grid grid-cols-3 gap-6">
              <div className="flex items-center gap-2">
                <div className="text-gray-300 font-medium">{item.name}</div>
                {item.is_active ? (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                    <CheckCircle2 size={10} />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                    <AlertCircle size={10} />
                    Inactive
                  </span>
                )}
              </div>

              <div className="text-gray-400 text-sm">
                {item.procedures || "—"}
              </div>

              <div className="text-gray-400 text-sm line-clamp-2">
                {item.description || "—"}
              </div>
            </div>

            <div className="flex items-center gap-2 ml-4">
              <button
                onClick={() => {
                  setSelectedService(item);
                  setShowModal(true);
                }}
                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-[#3a3a3a] rounded-lg transition-colors"
                title="Edit"
              >
                <Pencil size={16} />
              </button>
              <button
                onClick={() => handleDelete(item.id)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}

        {serviceCodes.length === 0 && (
          <div className="py-16 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-[#2a2a2a] rounded-full mb-4">
              <AlertCircle size={32} className="text-gray-500" />
            </div>
            <h3 className="text-white font-medium text-lg mb-1">
              No service codes found
            </h3>
            <p className="text-gray-400 text-sm">
              Get started by creating your first service code
            </p>
          </div>
        )}
      </div>

      {/* Popup */}
      {showModal && (
        <ServiceCodeModal
          initialData={selectedService}
          onClose={() => setShowModal(false)}
          onSuccess={fetchServiceCodes}
        />
      )}
    </div>
  );
};

export default ServiceCode;
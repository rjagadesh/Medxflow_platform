import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  Trash2,
} from "lucide-react";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";

/* ---------------- CONSTANTS ---------------- */
const COLOR_OPTIONS = [
  "#6b7280",
  "#475569",
  "#52525b",
  "#78716c",
  "#64748b",
  "#92400e",
  "#7c2d12",
];

const ITEMS_PER_PAGE = 5;

const VisitReasons = () => {
  const [data, setData] = useState([]);
  const [services, setServices] = useState([]);
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [selectedVisitReason, setSelectedVisitReason] = useState(null);
  const [actionMenuId, setActionMenuId] = useState(null);
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: "",
    duration: "",
    service: "",
    color: COLOR_OPTIONS[0],
  });

  const [colorOpen, setColorOpen] = useState(false);
  const colorRef = useRef(null);

  /* ---------------- FETCH DATA ---------------- */

  const fetchVisitReasons = async () => {
    try {
      const res = await apiRequest(apiRoutes.visitreason.list);
      const payload = res?.data ?? res;
      setData(payload.visit_reasons || []);
    } catch {
      setData([]);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await apiRequest(apiRoutes.service.list);
      const payload = res?.data ?? res;
      setServices(payload.service_codes || []);
    } catch {
      setServices([]);
    }
  };

  useEffect(() => {
    fetchVisitReasons();
    fetchServices();
  }, []);

  /* ---------------- PAGINATION ---------------- */

  const totalPages = Math.ceil(data.length / ITEMS_PER_PAGE);
  const rows = data.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  /* ---------------- COLOR DROPDOWN CLOSE ---------------- */

  useEffect(() => {
    const handler = (e) => {
      if (colorRef.current && !colorRef.current.contains(e.target)) {
        setColorOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* ---------------- FORM ACTIONS ---------------- */

  const handleSave = async () => {
  try {
    if (selectedVisitReason) {
      // 🔹 EDIT
      await apiRequest(apiRoutes.visitreason.update, {
        metadata: { id: selectedVisitReason.id },
        payload: {
          name: form.name,
          duration: Number(form.duration),
          color: form.color,
          service: form.service,
        },
      });
    } else {
      // 🔹 CREATE
      await apiRequest(apiRoutes.visitreason.create, {
        payload: {
          name: form.name,
          duration: Number(form.duration),
          color: form.color,
          service: form.service,
        },
      });
    }

    setOpenModal(false);
    setSelectedVisitReason(null);
    setForm({
      name: "",
      duration: "",
      service: "",
      color: COLOR_OPTIONS[0],
    });

    fetchVisitReasons();
  } catch {
    alert("Failed to save visit reason");
  }
};


  const handleDelete = async (id) => {
    if (!window.confirm("Delete this visit reason?")) return;

    try {
      await apiRequest(apiRoutes.visitreason.delete,{
        metadata: { id },
      });
      fetchVisitReasons();
    } catch {
      alert("Delete failed");
    }
  };
  const handleEdit = async (id) => {
    

    try {
      await apiRequest(apiRoutes.visitreason.update,{
        metadata: { id },
      });
      fetchVisitReasons();
    } catch {
      alert("Delete failed");
    }
  };

  return (
    <>
      {/* ================= PAGE ================= */}
      <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-6 h-full flex flex-col">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-lg font-semibold">Visit Reasons</h2>
          <button 
              onClick={() => navigate("/pms/service-code")}
              className="ml-auto px-3 py-2 rounded-full bg-[#2d2d2d] text-sm text-gray-200 hover:bg-[#3a3a3a]" > 
          Add service </button> 
         <button
            onClick={() => {
              setSelectedVisitReason(null);
              setForm({
                name: "",
                duration: "",
                service: "",
                color: COLOR_OPTIONS[0],
              });
              setOpenModal(true);
            }}
            className="px-6 py-2 rounded-full bg-[#2d2d2d] text-sm text-gray-200 hover:bg-[#3a3a3a]"
          >
            Add visit reason
          </button>

        </div>

        {/* Table Header */}
        <div className="grid grid-cols-12 px-5 py-3 text-sm text-gray-400 border-b border-[#2b2b2b]">
          <div className="col-span-2">Color</div>
          <div className="col-span-4">Name</div>
          <div className="col-span-2">Duration</div>
          <div className="col-span-3">Service</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        {/* Rows */}
        <div className="border border-[#2b2b2b] rounded-md mt-2 flex-1">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-12 px-5 py-4 border-b border-[#2b2b2b] items-center"
            >
              <div className="col-span-2">
                <div
                  className="w-6 h-6 rounded-md"
                  style={{ backgroundColor: row.color }}
                />
              </div>
              <div className="col-span-4 text-gray-200">
                {row.name}
              </div>
              <div className="col-span-2 text-gray-400">
                {row.duration} min
              </div>
              <div className="col-span-3 text-gray-400">
                {row.service_name}
              </div>
              <div className="col-span-1 flex justify-end relative">
  <button
    onClick={() =>
      setActionMenuId(actionMenuId === row.id ? null : row.id)
    }
  >
    <MoreVertical size={18} className="text-gray-400" />
  </button>

  {actionMenuId === row.id && (
    <div className="absolute right-0 top-6 bg-[#2b2b2b] border border-[#404040] rounded-md z-20 w-32">
      <button
        onClick={() => {
          setSelectedVisitReason(row);
          setForm({
            name: row.name,
            duration: row.duration,
            service: row.service,
            color: row.color,
          });
          setOpenModal(true);
          setActionMenuId(null);
        }}
        className="w-full px-3 py-2 text-sm text-gray-300 hover:bg-[#3a3a3a]"
      >
        Edit
      </button>

      <button
        onClick={() => handleDelete(row.id)}
        className="w-full px-3 py-2 text-sm text-red-400 hover:bg-[#3a3a3a]"
      >
        Delete
      </button>
    </div>
  )}
</div>

            </div>
          ))}

          {rows.length === 0 && (
            <div className="py-10 text-center text-gray-500 text-sm">
              No visit reasons found
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className="flex justify-end items-center gap-4 mt-4">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="p-2 border border-[#2b2b2b] rounded-md text-gray-400 disabled:opacity-40"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm text-gray-400">
            Page {page} of {totalPages || 1}
          </span>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="p-2 border border-[#2b2b2b] rounded-md text-gray-400 disabled:opacity-40"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {openModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-xl w-[720px] p-6">

            <div className="flex justify-between mb-6">
              <h3 className="text-white text-lg">
  {selectedVisitReason ? "Edit Visit Reason" : "Add Visit Reason"}
</h3>

              <button onClick={() => setOpenModal(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="grid grid-cols-12 gap-4 mb-6">
              <div className="col-span-6">
                <input
                  placeholder="Name"
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                  className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300"
                />
              </div>

              <div className="col-span-3">
                <input
                  type="number"
                  placeholder="Duration"
                  value={form.duration}
                  onChange={(e) =>
                    setForm({ ...form, duration: e.target.value })
                  }
                  className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300"
                />
              </div>

              {/* Color */}
              <div className="col-span-3 relative" ref={colorRef}>
                <div
                  onClick={() => setColorOpen(!colorOpen)}
                  className="h-[42px] bg-[#1a1a1a] border border-[#404040] rounded-md flex items-center px-3 cursor-pointer"
                >
                  <div
                    className="w-5 h-5 rounded"
                    style={{ backgroundColor: form.color }}
                  />
                </div>

                {colorOpen && (
                  <div className="absolute left-0 top-full mt-1 bg-[#1a1a1a] border border-[#404040] rounded-md z-50">
                    {COLOR_OPTIONS.map((c) => (
                      <button
                        key={c}
                        onClick={() =>
                          setForm({ ...form, color: c })
                        }
                        className="w-full px-4 py-2 flex hover:bg-[#2b2b2b]"
                      >
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: c }}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Service */}
            <select
              value={form.service}
              onChange={(e) =>
                setForm({ ...form, service: e.target.value })
              }
              className="w-full mb-6 bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300"
            >
              <option value="">Select service</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setOpenModal(false)}
                className="px-6 py-2 rounded-full bg-[#2d2d2d] text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2 rounded-full bg-orange-600 text-white"
              >
                {selectedVisitReason ? "Update" : "Save"}

              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );
};

export default VisitReasons;

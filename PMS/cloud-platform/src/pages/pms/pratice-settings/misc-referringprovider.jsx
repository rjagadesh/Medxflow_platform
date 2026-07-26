import React, { useState } from "react";
import {
  Plus,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ---------------- SAMPLE DATA ---------------- */
const PROVIDERS = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  firstName: ["John", "Maria", "David", "Emma", "Sophia"][i % 5],
  lastName: ["Doe", "Smith", "Brown", "Lee", "Taylor"][i % 5],
  email: `provider${i + 1}@example.com`,
}));

const MiscReferprovider = () => {
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);
  const [menuOpen, setMenuOpen] = useState(null);

  return (
    <>
      {/* ================= PAGE ================= */}
      <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-8 h-full overflow-y-auto">

        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-white text-lg font-semibold">
            Referring Providers
          </h2>

          <button
            onClick={() => setOpenModal(true)}
            className="px-6 py-2 rounded-full bg-orange-600 text-white
                       hover:bg-orange-500 flex items-center gap-2 text-sm"
          >
            <Plus size={16} />
            Add referring provider
          </button>
        </div>

        {/* ================= TABLE ================= */}
        <div className="border border-[#2b2b2b] rounded-lg overflow-hidden mb-6">
          {/* Header */}
          <div className="grid grid-cols-12 px-5 py-3 text-sm text-gray-400 border-b border-[#2b2b2b]">
            <div className="col-span-3">First Name</div>
            <div className="col-span-3">Last Name</div>
            <div className="col-span-5">Email</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          {PROVIDERS.map((p) => (
            <div
              key={p.id}
              className="grid grid-cols-12 px-5 py-4 border-b border-[#2b2b2b]
                         last:border-none hover:bg-[#202020] relative"
            >
              <div className="col-span-3 text-sm text-gray-300">
                {p.firstName}
              </div>
              <div className="col-span-3 text-sm text-gray-300">
                {p.lastName}
              </div>
              <div className="col-span-5 text-sm text-gray-400">
                {p.email}
              </div>

              {/* Three dots */}
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() =>
                    setMenuOpen(menuOpen === p.id ? null : p.id)
                  }
                  className="text-gray-400 hover:text-white"
                >
                  <MoreVertical size={16} />
                </button>

                {menuOpen === p.id && (
                  <div className="absolute right-6 top-12 bg-[#1c1c1c]
                                  border border-[#2b2b2b] rounded-md
                                  shadow-lg z-20">
                    <button className="block px-4 py-2 text-sm text-gray-300
                                       hover:bg-[#2b2b2b] w-full text-left">
                      Edit
                    </button>
                    <button className="block px-4 py-2 text-sm text-red-400
                                       hover:bg-[#2b2b2b] w-full text-left">
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ================= PAGINATION ================= */}
        <div className="flex justify-end items-center gap-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            className="p-2 border border-[#2b2b2b] rounded-md text-gray-400"
          >
            <ChevronLeft size={16} />
          </button>

          <span className="text-sm text-gray-400">
            Page {page}
          </span>

          <button
            onClick={() => setPage(page + 1)}
            className="p-2 border border-[#2b2b2b] rounded-md text-gray-400"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {openModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1c1c1c] border border-[#2b2b2b]
                          rounded-xl w-[700px] max-h-[90vh]
                          overflow-y-auto p-6">

            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-lg font-semibold">
                Add Referring Provider
              </h3>
              <button onClick={() => setOpenModal(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* ================= BASIC INFO ================= */}
            <h4 className="text-sm font-semibold text-white mb-4">
              Basic Information
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <input placeholder="Individual NPI" className="input" />
              <button className="rounded-md bg-[#2b2b2b] text-sm text-gray-300">
                Look Up
              </button>

              <input placeholder="First Name" className="input" />
              <input placeholder="Last Name" className="input" />

              <input placeholder="Email" className="input col-span-2" />

              <input placeholder="Taxonomy Code" className="input" />
              <input placeholder="Specialty" className="input" />

              <input placeholder="Work #" className="input" />
              <input placeholder="Mobile #" className="input" />

              <input placeholder="Home #" className="input" />
              <input placeholder="Fax #" className="input" />
            </div>

            {/* ================= ADDITIONAL INFO ================= */}
            <h4 className="text-sm font-semibold text-white mb-4">
              Additional Information
            </h4>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <input placeholder="Street Address" className="input col-span-2" />
              <input placeholder="Suite" className="input" />
              <input placeholder="City" className="input" />
              <input placeholder="State" className="input" />
              <input placeholder="ZIP" className="input" />
              <textarea
                placeholder="Notes"
                rows={3}
                className="input col-span-2 resize-none"
              />
            </div>

            {/* ================= ACTIONS ================= */}
            <div className="flex justify-end gap-4">
              <button className="px-6 py-2 rounded-full bg-red-600/20 text-red-400">
                Delete
              </button>
              <button
                onClick={() => setOpenModal(false)}
                className="px-6 py-2 rounded-full bg-[#2d2d2d] text-gray-200"
              >
                Cancel
              </button>
              <button className="px-6 py-2 rounded-full bg-orange-600 text-white">
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input style */}
      <style>{`
        .input {
          background: #1a1a1a;
          border: 1px solid #404040;
          border-radius: 6px;
          padding: 10px 12px;
          font-size: 14px;
          color: white;
        }
      `}</style>
    </>
  );
};

export default MiscReferprovider;

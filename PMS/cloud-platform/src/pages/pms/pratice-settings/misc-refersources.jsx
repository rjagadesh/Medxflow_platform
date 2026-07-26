import React, { useState } from "react";
import {
  Plus,
  MoreVertical,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ---------------- SAMPLE DATA ---------------- */
const SOURCES = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  name: `Referral Source ${i + 1}`,
  description: "External referral partner",
}));

const MiscRefersources = () => {
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
            Referral Sources
          </h2>

          <button
            onClick={() => setOpenModal(true)}
            className="px-6 py-2 rounded-full bg-orange-600 text-white
                       hover:bg-orange-500 flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={16} />
            Add Referral Source
          </button>
        </div>

        {/* ================= TABLE ================= */}
        <div className="border border-[#2b2b2b] rounded-lg overflow-hidden mb-6">
          {/* Header */}
          <div className="grid grid-cols-12 px-5 py-3 text-sm text-gray-400 border-b border-[#2b2b2b]">
            <div className="col-span-4">Name</div>
            <div className="col-span-7">Description</div>
            <div className="col-span-1"></div>
          </div>

          {/* Rows */}
          {SOURCES.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-12 px-5 py-4 border-b border-[#2b2b2b]
                         last:border-none hover:bg-[#202020] relative"
            >
              <div className="col-span-4 text-sm text-gray-300">
                {item.name}
              </div>

              <div className="col-span-7 text-sm text-gray-400">
                {item.description}
              </div>

              {/* Three dots */}
              <div className="col-span-1 flex justify-end">
                <button
                  onClick={() =>
                    setMenuOpen(menuOpen === item.id ? null : item.id)
                  }
                  className="text-gray-400 hover:text-white"
                >
                  <MoreVertical size={16} />
                </button>

                {menuOpen === item.id && (
                  <div
                    className="absolute right-6 top-12 z-20
                               bg-[#1c1c1c] border border-[#2b2b2b]
                               rounded-md shadow-lg"
                  >
                    <button
                      className="block w-full px-4 py-2 text-sm text-gray-300
                                 hover:bg-[#2b2b2b] text-left"
                    >
                      Edit
                    </button>
                    <button
                      className="block w-full px-4 py-2 text-sm text-red-400
                                 hover:bg-[#2b2b2b] text-left"
                    >
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
                          rounded-xl w-[420px] p-6">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-lg font-semibold">
                Add Referral Source
              </h3>
              <button onClick={() => setOpenModal(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5 mb-8">
              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Name
                </label>
                <input
                  className="w-full bg-[#1a1a1a] border border-[#404040]
                             rounded-md px-4 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  className="w-full bg-[#1a1a1a] border border-[#404040]
                             rounded-md px-4 py-2 text-sm text-white resize-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setOpenModal(false)}
                className="px-6 py-2 rounded-full bg-[#2d2d2d]
                           text-gray-200 hover:bg-[#3a3a3a]"
              >
                Cancel
              </button>

              <button
                className="px-6 py-2 rounded-full bg-orange-600
                           text-white hover:bg-orange-500 font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MiscRefersources;

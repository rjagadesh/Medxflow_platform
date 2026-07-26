import React, { useState } from "react";
import { Plus, ChevronLeft, ChevronRight, X } from "lucide-react";

/* ---------- SAMPLE DATA ---------- */
const LABS = Array.from({ length: 10 }).map((_, i) => ({
  id: i + 1,
  category: "Chemistry A-K",
  name: i === 0 ? "Ammonia" : `Lab Test ${i + 1}`,
  description: i === 0 ? "NH4" : "—",
}));

const ClinicalLabList = () => {
  const [page, setPage] = useState(1);
  const [openModal, setOpenModal] = useState(false);

  return (
    <>
      {/* ================= PAGE ================= */}
      <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-8 h-full overflow-y-auto">

        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-white text-lg font-semibold">
              Lab List
            </h2>
            <p className="text-sm text-gray-400">
              186 tests total
            </p>
          </div>

          <button
            onClick={() => setOpenModal(true)}
            className="px-6 py-2 rounded-full bg-orange-600 text-white
                       hover:bg-orange-500 flex items-center gap-2 text-sm font-medium"
          >
            <Plus size={16} />
            New test
          </button>
        </div>

        {/* ================= TABLE ================= */}
        <div className="border border-[#2b2b2b] rounded-lg overflow-hidden mb-6">
          <div className="grid grid-cols-12 px-5 py-3 text-sm text-gray-400 border-b border-[#2b2b2b]">
            <div className="col-span-1">
              <input type="checkbox" />
            </div>
            <div className="col-span-3">Category</div>
            <div className="col-span-3">Name</div>
            <div className="col-span-3">Description</div>
            <div className="col-span-2">Label</div>
          </div>

          {LABS.map((lab) => (
            <div
              key={lab.id}
              className="grid grid-cols-12 px-5 py-4 border-b border-[#2b2b2b]
                         last:border-none hover:bg-[#202020]"
            >
              <div className="col-span-1">
                <input type="checkbox" />
              </div>
              <div className="col-span-3 text-sm text-gray-400">
                {lab.category}
              </div>
              <div className="col-span-3 text-sm text-gray-300">
                {lab.name}
              </div>
              <div className="col-span-3 text-sm text-gray-400">
                {lab.description}
              </div>
              <div className="col-span-2 text-sm text-gray-400">
                {lab.description}
              </div>
            </div>
          ))}
        </div>

        {/* ================= FOOTER ACTIONS ================= */}
        <div className="flex justify-between items-center">
          {/* Delete / Cancel */}
          <div className="flex gap-3">
            <button
              className="px-6 py-2 rounded-full bg-red-600/20 text-red-400
                         hover:bg-red-600/30 text-sm"
            >
              Delete
            </button>
            <button
              className="px-6 py-2 rounded-full bg-[#2d2d2d] text-gray-200
                         hover:bg-[#3a3a3a] text-sm"
            >
              Cancel
            </button>
          </div>

          {/* Pagination */}
          <div className="flex items-center gap-4">
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
      </div>

      {/* ================= MODAL ================= */}
      {openModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-xl w-[520px] p-6">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-lg font-semibold">
                Add new test
              </h3>
              <button onClick={() => setOpenModal(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Form */}
            <div className="space-y-5 mb-8">
              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Category
                </label>
                <select
                  className="w-full bg-[#1a1a1a] border border-[#404040]
                             rounded-md px-4 py-2 text-sm text-white"
                >
                  <option>Chemistry A-K</option>
                  <option>Hematology</option>
                  <option>Microbiology</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Name
                </label>
                <input
                  className="w-full bg-[#1a1a1a] border border-[#404040]
                             rounded-md px-4 py-2 text-sm text-white"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400 mb-1 block">
                  Description (optional)
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
                           text-white hover:bg-orange-500"
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

export default ClinicalLabList;

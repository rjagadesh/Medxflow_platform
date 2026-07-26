import React, { useState } from "react";
import {
  Download,
  Trash2,
  X,
} from "lucide-react";

const DbPatientdata = () => {
  const [openModal, setOpenModal] = useState(false);
  const [activeTab, setActiveTab] = useState("one-time");

  return (
    <>
      <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-10 h-full overflow-y-auto">

        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-white text-xl font-semibold">
            Export Patient Summaries
          </h2>

          <button
            onClick={() => setOpenModal(true)}
            className="px-8 py-3 rounded-full bg-orange-600
                       text-white hover:bg-orange-500 font-medium"
          >
            Run Export
          </button>
        </div>

        {/* ================= PATIENT SUMMARIES ================= */}
        <h3 className="text-white text-sm font-semibold mb-4">
          Patient Summaries
        </h3>

        <div className="border border-[#2b2b2b] rounded-lg overflow-hidden mb-10">
          <div className="grid grid-cols-5 px-6 py-3 text-xs uppercase tracking-wide
                          text-gray-400 border-b border-[#2b2b2b] bg-[#202020]">
            <div>Date Exported</div>
            <div className="col-span-2">Summaries of patients seen</div>
            <div>Seen by provider</div>
            <div>Status</div>
          </div>

          <div className="grid grid-cols-5 px-6 py-4 text-sm items-center">
            <div className="text-gray-300">08/17/2023</div>
            <div className="col-span-2 text-gray-400">
              Between 01/01/2023 – 08/16/2023
            </div>
            <div className="text-gray-300">Allison Brown</div>
            <div className="flex items-center gap-3">
              <span className="text-green-400">Ready</span>
              <Download size={16} className="text-gray-300 cursor-pointer" />
            </div>
          </div>
        </div>

        {/* ================= MANAGE RECURRING ================= */}
        <h3 className="text-white text-sm font-semibold mb-2">
          Manage Recurring Exports
        </h3>

        <p className="text-sm text-gray-400 mb-1">
          Download summaries for patients seen by <span className="text-gray-300">All Providers</span> in the last week (Mon–Sun).
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Repeat every Monday
        </p>

        <div className="flex justify-between items-center text-sm text-gray-400">
          <span>
            Next report will run on <span className="text-gray-300">08/28/2023</span>
          </span>
          <Trash2 size={16} className="cursor-pointer text-gray-400 hover:text-red-400" />
        </div>
      </div>

      {/* ================= MODAL ================= */}
      {openModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg w-[700px] p-8">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-white text-lg font-semibold">
                Run Export
              </h3>
              <X
                size={18}
                className="text-gray-400 cursor-pointer"
                onClick={() => setOpenModal(false)}
              />
            </div>

            {/* Tabs */}
            <div className="flex gap-6 border-b border-[#2b2b2b] mb-6">
              {["one-time", "recurring"].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-2 text-sm ${
                    activeTab === tab
                      ? "text-white border-b-2 border-orange-500"
                      : "text-gray-400"
                  }`}
                >
                  {tab === "one-time" ? "One-time" : "Recurring"}
                </button>
              ))}
            </div>

            {/* ================= ONE-TIME ================= */}
            {activeTab === "one-time" && (
              <div className="space-y-6 text-sm text-gray-400">

                <div>
                  <p className="mb-2 text-gray-300">Download summaries for patients seen</p>

                  <label className="flex items-center gap-2 mb-2">
                    <input type="radio" />
                    Since the beginning of time
                  </label>

                  <label className="flex items-center gap-2">
                    <input type="radio" />
                    Date Range:
                    <span className="ml-2 text-gray-300">
                      01/01/2023 to 08/16/2023
                    </span>
                  </label>
                </div>

                <div>
                  <p className="mb-2 text-gray-300">Seen by Provider</p>
                  <select className="w-full bg-[#1a1a1a] border border-[#404040]
                                     rounded-md px-3 py-2 text-white">
                    <option>All Providers</option>
                  </select>
                </div>

                <div>
                  <p className="mb-2 text-gray-300">Run this export</p>
                  <label className="flex items-center gap-2 mb-2">
                    <input type="radio" />
                    Now
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="radio" />
                    mm/dd/yyyy 12:00 AM
                  </label>
                </div>
              </div>
            )}

            {/* ================= RECURRING ================= */}
            {activeTab === "recurring" && (
              <div className="space-y-6 text-sm text-gray-400">

                <label className="flex items-start gap-3">
                  <input type="radio" />
                  <div>
                    <p className="text-gray-300 mb-1">Monthly</p>
                    <p>
                      Download summaries for patients seen by{" "}
                      <select className="ml-2 bg-[#1a1a1a] border border-[#404040]
                                         rounded-md px-2 py-1 text-white">
                        <option>-- Select Provider --</option>
                      </select>{" "}
                      in the last month.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Repeat on the first day of every month.
                    </p>
                  </div>
                </label>

                <label className="flex items-start gap-3">
                  <input type="radio" />
                  <div>
                    <p className="text-gray-300 mb-1">Weekly</p>
                    <p>
                      Download summaries for patients seen by{" "}
                      <select className="ml-2 bg-[#1a1a1a] border border-[#404040]
                                         rounded-md px-2 py-1 text-white">
                        <option>-- Select Provider --</option>
                      </select>{" "}
                      in the last week.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Repeat every Monday.
                    </p>
                  </div>
                </label>
              </div>
            )}

            {/* Footer */}
            <div className="flex justify-end gap-3 mt-8">
              <button
                onClick={() => setOpenModal(false)}
                className="px-6 py-2 rounded-full bg-[#2d2d2d] text-gray-300"
              >
                Cancel
              </button>
              <button className="px-6 py-2 rounded-full bg-orange-600 text-white">
                Run Export
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DbPatientdata;

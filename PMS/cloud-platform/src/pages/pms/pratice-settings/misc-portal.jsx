import React, { useState } from "react";
import {
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ---------------- SAMPLE DATA ---------------- */
const ACTIVITIES = Array.from({ length: 10 }).map((_, i) => ({
  id: i,
  name: ["John Lee", "Maria Smith", "David Miller", "Emma Brown"][i % 4],
  amount: (Math.random() * 100).toFixed(2),
  time: "8:08 PM - 10/06/2023",
}));

const MiscPortal = () => {
  const [page, setPage] = useState(1);

  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-6 h-full overflow-y-auto">

      {/* ================= HEADER ================= */}
      <div className="mb-6">
        <p className="text-xs text-gray-400 uppercase tracking-wide">
          Dashboard
        </p>
        <p className="text-sm text-gray-300">
          A place of healing
        </p>
      </div>

      {/* ================= GRID ================= */}
      <div className="grid grid-cols-12 gap-6">

        {/* ================= LEFT (9) ================= */}
        <div className="col-span-9 bg-[#1e1e1e] border border-[#2b2b2b] rounded-lg p-6">

          {/* Header */}
          <h3 className="text-white text-sm font-semibold mb-6">
            Activity Feed
          </h3>

          {/* Filters */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Filter by type
              </label>
              <select className="w-full bg-[#1a1a1a] border border-[#404040]
                                 rounded-md px-3 py-2 text-sm text-white">
                <option>All</option>
                <option>Payments</option>
                <option>Messages</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Filter by date
              </label>
              <select className="w-full bg-[#1a1a1a] border border-[#404040]
                                 rounded-md px-3 py-2 text-sm text-white">
                <option>All time</option>
                <option>Last 7 days</option>
                <option>Last 30 days</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-gray-400 block mb-1">
                Filter by patient
              </label>
              <input
                placeholder="Search patient"
                className="w-full bg-[#1a1a1a] border border-[#404040]
                           rounded-md px-3 py-2 text-sm text-white"
              />
            </div>
          </div>

          {/* Activity List */}
          <div className="space-y-3">
            {ACTIVITIES.map((item) => (
              <div
                key={item.id}
                className="flex justify-between items-center
                           bg-[#202020] border border-[#2b2b2b]
                           rounded-md px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600/20
                                  flex items-center justify-center">
                    <DollarSign size={16} className="text-green-400" />
                  </div>
                  <p className="text-sm text-gray-300">
                    <span className="font-medium uppercase">
                      {item.name}
                    </span>{" "}
                    made a payment of{" "}
                    <span className="font-medium text-white">
                      ${item.amount}
                    </span>
                  </p>
                </div>

                <span className="text-xs text-gray-500">
                  {item.time}
                </span>
              </div>
            ))}
          </div>

          {/* Pagination */}
          <div className="flex justify-end items-center gap-4 mt-6">
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

        {/* ================= RIGHT (3) ================= */}
        <div className="col-span-3 bg-[#1e1e1e] border border-[#2b2b2b] rounded-lg p-6">

          <h3 className="text-white text-sm font-semibold mb-4">
            Patient Portal Usage
          </h3>

          <div className="bg-[#202020] border border-[#2b2b2b]
                          rounded-lg p-5 text-center">
            <p className="text-xs text-gray-400 mb-1">
              Total Collected
            </p>
            <p className="text-2xl font-semibold text-white">
              $2,356.84
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MiscPortal;

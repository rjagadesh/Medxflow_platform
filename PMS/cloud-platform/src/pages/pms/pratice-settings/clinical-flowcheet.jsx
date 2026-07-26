import React, { useState } from "react";
import { MoreVertical } from "lucide-react";

/* ---------- SAMPLE DATA ---------- */
const standardFlowsheets = [
  "Adult Preventive Care",
  "Diabetes",
  "Hypertension",
  "Vitals",
];

const customFlowsheets = [
  {
    name: "Glucose",
    editor: "Diana Hudson",
    updated: "11/12/2019",
  },
];

const ClinicalFlowsheet = () => {
  const [tab, setTab] = useState("active");
  const [menuOpen, setMenuOpen] = useState(null);

  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-8 h-full overflow-y-auto">

      {/* ================= STANDARD FLOWSHEETS ================= */}
      <h2 className="text-white text-lg font-semibold mb-6">
        Standard Flowsheets
      </h2>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#2b2b2b] mb-6">
        {["active", "inactive"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm capitalize ${
              tab === t
                ? "text-white border-b-2 border-orange-500"
                : "text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Active Tab Content */}
      {tab === "active" && (
        <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg mb-10">
          <div className="px-5 py-3 text-sm text-gray-400 border-b border-[#2b2b2b]">
            Name
          </div>

          {standardFlowsheets.map((name) => (
            <div
              key={name}
              className="flex justify-between items-center px-5 py-4 border-b border-[#2b2b2b] last:border-none hover:bg-[#202020]"
            >
              <span className="text-gray-300 text-sm">{name}</span>

              <div className="relative">
                <button onClick={() => setMenuOpen(menuOpen === name ? null : name)}>
                  <MoreVertical size={18} className="text-gray-400" />
                </button>

                {menuOpen === name && name === "Diabetes" && (
                  <div className="absolute right-0 mt-2 bg-[#141414] border border-[#2b2b2b] rounded-md shadow-lg z-10">
                    <button className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2b2b2b] w-full text-left">
                      Duplicate
                    </button>
                    <button className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2b2b2b] w-full text-left">
                      Deactivate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= CUSTOM FLOWSHEETS ================= */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white text-md font-semibold">
          Custom Flowsheets
        </h3>

        <button className="px-6 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-500 text-sm font-medium">
          Create
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-[#2b2b2b] mb-6">
        {["active", "inactive"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm capitalize ${
              tab === t
                ? "text-white border-b-2 border-orange-500"
                : "text-gray-400"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Custom Active */}
      {tab === "active" && (
        <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg">
          {/* Header */}
          <div className="grid grid-cols-12 px-5 py-3 text-sm text-gray-400 border-b border-[#2b2b2b]">
            <div className="col-span-4">Name</div>
            <div className="col-span-4">Last editor</div>
            <div className="col-span-3">Last updated</div>
            <div className="col-span-1" />
          </div>

          {/* Rows */}
          {customFlowsheets.map((item) => (
            <div
              key={item.name}
              className="grid grid-cols-12 px-5 py-4 border-b border-[#2b2b2b] last:border-none hover:bg-[#202020]"
            >
              <div className="col-span-4 text-sm text-gray-300">
                {item.name}
              </div>
              <div className="col-span-4 text-sm text-gray-400">
                {item.editor}
              </div>
              <div className="col-span-3 text-sm text-gray-400">
                {item.updated}
              </div>

              <div className="col-span-1 flex justify-end relative">
                <button onClick={() => setMenuOpen("custom")}>
                  <MoreVertical size={18} className="text-gray-400" />
                </button>

                {menuOpen === "custom" && (
                  <div className="absolute right-0 mt-2 bg-[#141414] border border-[#2b2b2b] rounded-md shadow-lg z-10">
                    <button className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2b2b2b] w-full text-left">
                      Edit
                    </button>
                    <button className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2b2b2b] w-full text-left">
                      Duplicate
                    </button>
                    <button className="block px-4 py-2 text-sm text-gray-300 hover:bg-[#2b2b2b] w-full text-left">
                      Deactivate
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ClinicalFlowsheet;

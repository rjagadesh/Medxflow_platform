import React from "react";

const Billingreceipts = () => {
  return (
    <div className="h-full overflow-y-auto flex justify-center bg-[#1c1c1c]">

      {/* ================= CENTERED CARD ================= */}
      <div
        className="w-full max-w-4xl border border-[#2b2b2b]
                   rounded-lg p-10 bg-[#1c1c1c] mt-10"
      >
        {/* ================= HEADER ================= */}
        <h2 className="text-white text-xl font-semibold mb-10">
          Receipt Settings
        </h2>

        {/* ================= RECEIPT ON PATIENT PORTAL ================= */}
        <div className="mb-10">
          <h3 className="text-white text-sm font-semibold mb-4">
            Receipt on Patient Portal
          </h3>

          {/* Enabled */}
          <div className="mb-6">
            <label className="flex items-center gap-3 text-sm text-gray-300">
              <input
                type="checkbox"
                className="accent-orange-500 w-4 h-4"
              />
              Enabled
            </label>
          </div>

          {/* Description */}
          <p className="text-sm text-gray-400 leading-relaxed max-w-3xl mb-8">
            Please select the default set of features you would like to include
            on the receipts when they are sent to the patient through the
            Patient Portal.
          </p>

          {/* ================= OPTIONS ================= */}
          <div className="space-y-6 text-sm text-gray-300">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="accent-orange-500 w-4 h-4 mt-1"
              />
              <span>Include notes</span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="accent-orange-500 w-4 h-4 mt-1"
              />
              <span>Include NPI from charge</span>
            </label>

            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                className="accent-orange-500 w-4 h-4 mt-1"
              />
              <span>Include TAX ID</span>
            </label>
          </div>
        </div>

        {/* ================= ACTION BUTTONS ================= */}
        <div className="flex justify-end gap-5 pt-6 border-t border-[#2b2b2b]">
          <button
            className="px-8 py-3 rounded-full
                       bg-[#2d2d2d] text-gray-300
                       hover:bg-[#3a3a3a]"
          >
            Cancel
          </button>

          <button
            className="px-8 py-3 rounded-full
                       bg-orange-600 text-white
                       hover:bg-orange-500 font-medium"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default Billingreceipts;

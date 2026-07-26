import React from "react";

const BillingChargeCapture = () => {
  return (
    <div className="h-full overflow-y-auto flex justify-center bg-[#1c1c1c]">

      {/* ================= CENTERED CARD ================= */}
      <div
        className="w-full max-w-3xl border border-[#2b2b2b]
                   rounded-lg p-10 bg-[#1c1c1c] mt-10"
      >
        {/* ================= HEADER ================= */}
        <h2 className="text-white text-xl font-semibold mb-10">
          Charge Capture Settings
        </h2>

        {/* ================= OFFICE STAFF ================= */}
        <div className="mb-12">
          <h3 className="text-white text-sm font-semibold mb-4">
            Office Staff
          </h3>

          <label className="flex items-start gap-3 text-sm text-gray-300">
            <input
              type="checkbox"
              className="accent-orange-500 w-4 h-4 mt-1"
            />
            <span>
              Enable submit to billing status
            </span>
          </label>
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

export default BillingChargeCapture;

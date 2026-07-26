import React from "react";
import { Info } from "lucide-react";

const ClinicalPrescription = () => {
  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-6 h-full overflow-y-auto">

      {/* ================= HEADER ================= */}
      <h2 className="text-white text-lg font-semibold mb-8">
        Prescription Preferences
      </h2>

      {/* ================= DRUG–DRUG INTERACTION ================= */}
      <section className="mb-10">
        <h3 className="text-white text-md font-semibold mb-4">
          Drug-to-Drug Interaction
        </h3>

        <div className="space-y-3 mb-6">
          <label className="flex items-start gap-3 text-sm text-gray-400">
            <input type="checkbox" className="mt-1 accent-orange-500" />
            Allow prescribers to override Drug-to-Drug interaction alerts
            without providing an override reason.
          </label>

          <label className="flex items-start gap-3 text-sm text-gray-400">
            <input type="checkbox" className="mt-1 accent-orange-500" />
            Allow prescribers to provide only one override reason for multiple
            Drug-to-Drug interaction alerts.
          </label>
        </div>

        {/* Security Level */}
        <div className="text-center">
          <p className="text-sm text-gray-300 font-medium mb-3">
            Security level for Drug-to-Drug interaction alerts
          </p>

          <div className="flex justify-center items-center gap-4">
            <select className="bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-sm text-white">
              <option>Minor Drug Interaction</option>
              <option>Moderate Drug Interaction</option>
              <option>Severe Drug Interaction</option>
            </select>

            <span className="text-xs text-gray-400 flex items-center gap-1">
              <Info size={14} />
              Learn more about these severity levels
            </span>
          </div>
        </div>
      </section>

      <div className="border-t border-[#2b2b2b] my-10" />

      {/* ================= ALLERGY INTERACTION ================= */}
      <section className="mb-10">
        <h3 className="text-white text-md font-semibold mb-4">
          Allergy Interaction
        </h3>

        <div className="space-y-3 mb-6">
          <label className="flex items-start gap-3 text-sm text-gray-400">
            <input type="checkbox" className="mt-1 accent-orange-500" />
            Display Drug Allergy interaction alerts for allergies with an
            unknown severity.
          </label>

          <label className="flex items-start gap-3 text-sm text-gray-400">
            <input type="checkbox" className="mt-1 accent-orange-500" />
            Allow prescribers to override Drug Allergy interaction alerts
            without providing an override reason.
          </label>

          <label className="flex items-start gap-3 text-sm text-gray-400">
            <input type="checkbox" className="mt-1 accent-orange-500" />
            Allow prescribers to provide only one override reason for multiple
            Drug Allergy interaction alerts.
          </label>
        </div>

        {/* Security Level */}
        <div className="text-center">
          <p className="text-sm text-gray-300 font-medium mb-3">
            Security level for Drug Allergy alerts
          </p>

          <select className="bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-sm text-white">
            <option>Severe</option>
            <option>Moderate</option>
            <option>Minor</option>
          </select>
        </div>
      </section>

      <div className="border-t border-[#2b2b2b] my-10" />

      {/* ================= PRINTING ADJUSTMENTS ================= */}
      <section className="mb-12">
        <h3 className="text-white text-md font-semibold mb-4">
          Prescription Printing Adjustments
        </h3>

        <div className="max-w-md space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">
              Prescription Printing X Adjust (inches)
            </span>
            <input
              defaultValue="0.00"
              className="w-28 bg-[#1a1a1a] border border-[#404040]
                         rounded-md px-3 py-2 text-sm text-white text-right"
            />
          </div>

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-400">
              Prescription Printing Y Adjust (inches)
            </span>
            <input
              defaultValue="0.00"
              className="w-28 bg-[#1a1a1a] border border-[#404040]
                         rounded-md px-3 py-2 text-sm text-white text-right"
            />
          </div>
        </div>
      </section>

      {/* ================= SAVE ================= */}
      <button className="px-10 py-3 rounded-full bg-orange-600 text-white
                         hover:bg-orange-500 transition font-medium">
        Save
      </button>
    </div>
  );
};

export default ClinicalPrescription;

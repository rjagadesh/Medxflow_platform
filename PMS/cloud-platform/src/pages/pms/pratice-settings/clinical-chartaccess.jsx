import React, { useState } from "react";
import { X } from "lucide-react";

const ClinicalChartAccess = () => {
  const [enabled, setEnabled] = useState(false);
  const [restriction, setRestriction] = useState("notes");
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <>
      {/* ================= PAGE ================= */}
      <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-8 h-full overflow-y-auto">

        {/* ================= HEADER ================= */}
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-white text-lg font-semibold">
            Chart Access
          </h2>
          <span className="text-xs text-gray-400">
            Disabled
          </span>
        </div>

        {/* ================= DESCRIPTION ================= */}
        <p className="text-sm text-gray-400 max-w-4xl mb-8 leading-relaxed">
          Providers and clinical staff can access all aspects of a patient&apos;s
          chart by default. Enable Chart Access restrictions to control who can
          access a patient&apos;s clinical notes or who can access a patient&apos;s
          clinical data.{" "}
          <span className="underline cursor-pointer text-gray-300">
            Learn more
          </span>{" "}
          about the Chart Access settings.
        </p>

        {/* ================= ENABLE CHECKBOX ================= */}
        <label className="flex items-start gap-3 text-sm text-gray-300 mb-4">
          <input
            type="checkbox"
            className="mt-1 accent-orange-500"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
          />
          Enable chart access restrictions
        </label>

        {/* ================= RESTRICTION OPTIONS ================= */}
        <div className="ml-6 mt-4 mb-10 space-y-6">

          {/* Restrict notes */}
          <label className="flex items-start gap-3 text-sm text-gray-400">
            <input
              type="radio"
              name="chartRestriction"
              className="mt-1 accent-orange-500"
              checked={restriction === "notes"}
              onChange={() => setRestriction("notes")}
              disabled={!enabled}
            />
            <div>
              <p className="text-gray-300">
                Restrict access to clinical notes only
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This option allows staff members to restrict access to a
                patient&apos;s clinical notes.
              </p>
            </div>
          </label>

          {/* Restrict data */}
          <label className="flex items-start gap-3 text-sm text-gray-400">
            <input
              type="radio"
              name="chartRestriction"
              className="mt-1 accent-orange-500"
              checked={restriction === "data"}
              onChange={() => setRestriction("data")}
              disabled={!enabled}
            />
            <div>
              <p className="text-gray-300">
                Restrict access to clinical data
              </p>
              <p className="text-xs text-gray-500 mt-1">
                This option allows staff members to restrict access to all
                clinical data in a patient&apos;s chart.
              </p>
            </div>
          </label>
        </div>

        {/* ================= ADDITIONAL OPTIONS ================= */}
        <h3 className="text-white text-sm font-semibold uppercase tracking-wide mb-4">
          Additional Options
        </h3>

        <label className="flex items-start gap-3 text-sm text-gray-400 max-w-4xl mb-2 ml-6">
          <input
            type="checkbox"
            className="mt-1 accent-orange-500"
            disabled={!enabled}
          />
          <div>
            <p className="text-gray-300">
              Automatically add clinical admins to all restricted charts
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Select this option if clinical admins in your practice always
              require access to patient clinical data. This eliminates the
              process of manually adding clinical admins to every restricted
              chart.
            </p>
          </div>
        </label>

        <p className="text-xs text-gray-500 ml-12 mb-10 max-w-4xl">
          A &quot;Clinical Admin&quot; is a user with the
          &quot;Admin+Provider&quot; or
          &quot;Admin+Clinical Assistant&quot; roles in User Settings.
        </p>

        {/* ================= ACTION BUTTONS ================= */}
        <div className="flex justify-end gap-4">
          <button
            className="px-8 py-2.5 rounded-full bg-[#2d2d2d]
                       text-gray-200 hover:bg-[#3a3a3a]"
          >
            Cancel
          </button>

          <button
            onClick={() => setShowConfirm(true)}
            className="px-8 py-2.5 rounded-full bg-orange-600
                       text-white hover:bg-orange-500 font-medium"
          >
            Save
          </button>
        </div>
      </div>

      {/* ================= CONFIRMATION MODAL ================= */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-[#1c1c1c] border border-[#2b2b2b]
                          rounded-xl w-[420px] p-6">

            {/* Modal Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-md font-semibold">
                Enable Chart Restrictions
              </h3>
              <button onClick={() => setShowConfirm(false)}>
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            {/* Modal Content */}
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Once enabled, providers and clinical staff can still access all
              aspects of a patient&apos;s chart by default. Staff can restrict
              the patient chart by manually assigning which users can access the
              patient&apos;s chart.
            </p>

            {/* Modal Actions */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-6 py-2 rounded-full bg-[#2d2d2d]
                           text-gray-200 hover:bg-[#3a3a3a]"
              >
                Cancel
              </button>

              <button
                className="px-6 py-2 rounded-full bg-orange-600
                           text-white hover:bg-orange-500 font-medium"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ClinicalChartAccess;

import React from "react";
import { Upload, ChevronLeft, ChevronRight } from "lucide-react";

/* ---------------- SAMPLE DATA ---------------- */
const RECENT_IMPORTS = [
  { date: "10/06/2023", success: 2450, duplicates: 32, errors: 4 },
  { date: "09/18/2023", success: 1800, duplicates: 21, errors: 0 },
];

const DbDemographics = () => {
  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-10 h-full overflow-y-auto">

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4 mb-3">
        <h2 className="text-white text-xl font-semibold">
          Upload Patient Demographics File
        </h2>
        <span className="text-sm text-gray-400">
          Step 1 of 3
        </span>
      </div>

      {/* ================= INTRO TEXT (MISSING — ADDED) ================= */}
      <p className="text-sm text-gray-400 max-w-4xl mb-8">
        Importing your patient demographic data into{" "}
        <span className="text-gray-300">Tebra</span> takes just three, easy steps.
      </p>

      {/* ================= STEPS ================= */}
      <div className="space-y-6 mb-8 max-w-4xl">
        {[
          "Upload your patient demographics file. Up to 5,000 patients can be imported at once.",
          "Review one patient to ensure we're reading your file correctly.",
          "Confirm everything was imported correctly and resolve any errors if needed.",
        ].map((text, index) => (
          <div key={index} className="flex gap-4">
            <div
              className="flex-shrink-0 w-7 h-7 rounded-full
                         border border-gray-500
                         flex items-center justify-center
                         text-sm text-gray-300"
            >
              {index + 1}
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              {text}
            </p>
          </div>
        ))}
      </div>

      {/* ================= LINKS ROW ================= */}
      <div className="flex justify-between items-center text-sm text-gray-400 mb-10 max-w-5xl">
        <p>
          Don&apos;t have your patient demographics in a spreadsheet?{" "}
          <span className="underline cursor-pointer text-gray-300">
            Download our template
          </span>
        </p>
        <p className="text-gray-500">
          Need help importing patient data?
        </p>
      </div>

      {/* ================= FILE UPLOAD ================= */}
      <div
        className="border border-dashed border-[#404040]
                   rounded-xl p-10 mb-12 bg-[#1e1e1e] text-center"
      >
        <p className="text-sm text-gray-300 mb-2">
          Selected file
        </p>
        <p className="text-sm text-gray-400 mb-6">
          patientdemo_aplaceofhealing.csv
        </p>

        <div className="flex justify-center gap-4 mb-4">
          <button
            className="flex items-center gap-2
                       px-10 py-3 rounded-full
                       bg-orange-600 text-white
                       hover:bg-orange-500 font-medium"
          >
            <Upload size={18} />
            Upload file
          </button>

          <button
            className="px-8 py-3 rounded-full
                       bg-[#2d2d2d] text-gray-200
                       hover:bg-[#3a3a3a]"
          >
            Change file
          </button>
        </div>

        <p className="text-xs text-gray-400">
          or you can also{" "}
          <span className="underline cursor-pointer text-gray-300">
            browse for a file
          </span>
        </p>
      </div>

      {/* ================= RECENT IMPORTS ================= */}
      <h3 className="text-white text-sm font-semibold mb-4">
        Recent Imports
      </h3>

      <div className="border border-[#2b2b2b] rounded-lg overflow-hidden mb-6 max-w-5xl">
        <div
          className="grid grid-cols-4 px-6 py-3
                     text-xs uppercase tracking-wide
                     text-gray-400 border-b border-[#2b2b2b] bg-[#202020]"
        >
          <div>Import Date</div>
          <div>Successful</div>
          <div>Duplicates</div>
          <div>Errors</div>
        </div>

        {RECENT_IMPORTS.map((row, idx) => (
          <div
            key={idx}
            className="grid grid-cols-4 px-6 py-4
                       border-b border-[#2b2b2b]
                       last:border-none text-sm"
          >
            <div className="text-gray-300">{row.date}</div>
            <div className="text-green-400">{row.success}</div>
            <div className="text-yellow-400">{row.duplicates}</div>
            <div className="text-red-400">{row.errors}</div>
          </div>
        ))}
      </div>

      {/* ================= PAGINATION ================= */}
      <div className="flex justify-between items-center text-sm text-gray-400 max-w-5xl">
        <div className="flex gap-4">
          <button className="hover:text-white">First</button>
          <button className="hover:text-white flex items-center gap-1">
            <ChevronLeft size={14} />
            Previous
          </button>
          <button className="hover:text-white flex items-center gap-1">
            Next
            <ChevronRight size={14} />
          </button>
          <button className="hover:text-white">Last</button>
        </div>
      </div>
    </div>
  );
};

export default DbDemographics;

import React, { useState } from "react";
import {
  Mail,
  Printer,
  MoreVertical,
  AlertTriangle,
  Plus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

/* ---------------- SAMPLE DATA ---------------- */
const FORMS = [
  { name: "Basic Information", type: "Profile", status: "Active", action: "menu" },
  { name: "Demographics", type: "Profile", status: "Active", action: "warning" },
  { name: "Insurance Details", type: "Profile", status: "Active", action: "menu" },
  { name: "Emergency Contact", type: "Profile", status: "Inactive", action: "menu" },
  { name: "Medical History", type: "Clinical", status: "Active", action: "menu" },
  { name: "Family History", type: "Clinical", status: "Active", action: "menu" },
  { name: "Allergies", type: "Clinical", status: "Active", action: "menu" },
  { name: "Medications", type: "Clinical", status: "Active", action: "menu" },
  { name: "Consent Forms", type: "Administrative", status: "Active", action: "menu" },
  { name: "Lifestyle Questionnaire", type: "Clinical", status: "Inactive", action: "menu" },
];

const ITEMS_PER_PAGE = 5;

const PatientIntake = () => {
  const [page, setPage] = useState(1);

  const totalPages = Math.ceil(FORMS.length / ITEMS_PER_PAGE);
  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const currentForms = FORMS.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE
  );

  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-6 h-full flex flex-col">

      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-white text-lg font-semibold">
          Intake Forms
        </h2>

        {/* Header Actions */}
        <div className="flex items-center gap-4">
          <button className="text-gray-400 hover:text-gray-300" title="Send mail">
            <Mail size={18} />
          </button>

          <button className="text-gray-400 hover:text-gray-300" title="Print">
            <Printer size={18} />
          </button>

          <button className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-200 bg-[#2b2b2b] rounded-md hover:bg-[#333333]">
            <Plus size={14} />
            Create form
          </button>
        </div>
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-12 px-5 py-3 text-sm text-gray-400 border-b border-[#2b2b2b]">
        <div className="col-span-5">Form name</div>
        <div className="col-span-3">Type</div>
        <div className="col-span-2">Status</div>
        <div className="col-span-2 text-right">Action</div>
      </div>

      {/* Rows */}
      <div className="border border-[#2b2b2b] rounded-md overflow-hidden mt-2 flex-1">
        {currentForms.map((form, index) => (
          <div
            key={index}
            className="grid grid-cols-12 items-center px-5 py-4 border-b border-[#2b2b2b] last:border-none"
          >
            {/* Form Name */}
            <div className="col-span-5 text-sm text-gray-200">
              {form.name}
            </div>

            {/* Type */}
            <div className="col-span-3 text-sm text-gray-400">
              {form.type}
            </div>

            {/* Status */}
            <div className="col-span-2 text-sm text-gray-300">
              {form.status}
            </div>

            {/* Action */}
            <div className="col-span-2 flex justify-end">
              {form.action === "warning" ? (
                <AlertTriangle
                  size={18}
                  className="text-gray-400"
                  title="Attention required"
                />
              ) : (
                <MoreVertical
                  size={18}
                  className="text-gray-400 cursor-pointer"
                  title="More options"
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-end items-center gap-4 mt-4">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1}
          className="p-2 border border-[#2b2b2b] rounded-md text-gray-400 disabled:opacity-40"
        >
          <ChevronLeft size={16} />
        </button>

        <span className="text-sm text-gray-400">
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="p-2 border border-[#2b2b2b] rounded-md text-gray-400 disabled:opacity-40"
        >
          <ChevronRight size={16} />
        </button>
      </div>

    </div>
  );
};

export default PatientIntake;

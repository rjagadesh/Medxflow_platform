import React from "react";

const roles = [
  "System Administrator",
  "Provider",
  "Clinical Assistant",
  "Office Staff",
];

const permissions = [
  "Demographics",
  "Implantable Devices",
  "Lab Tests & Values/Results",
  "Medication Allergy List",
  "Medication List",
  "Problem List",
  "Procedures",
  "Vital Signs",
];

const ClinicalDecision = () => {
  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-8 h-full overflow-y-auto">

      {/* ================= HEADER ================= */}
      <h2 className="text-white text-lg font-semibold mb-2">
        Configure Clinical Decision Support Permissions
      </h2>

      <p className="text-sm text-gray-400 mb-8 max-w-4xl">
        Select the checkboxes to define which user roles can access each of the
        CDS interventions and therapeutic/diagnostic resources.
      </p>

      {/* ================= PERMISSIONS TABLE ================= */}
      <div className="overflow-x-auto mb-6">
        <table className="w-full border border-[#2b2b2b] rounded-lg overflow-hidden">
          <thead className="bg-[#1a1a1a]">
            <tr>
              <th className="text-left px-4 py-3 text-sm text-gray-400 font-medium">
                Resource
              </th>
              {roles.map((role) => (
                <th
                  key={role}
                  className="px-4 py-3 text-sm text-gray-400 font-medium text-center"
                >
                  {role}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {/* Toggle All */}
            <tr className="border-t border-[#2b2b2b] bg-[#181818]">
              <td className="px-4 py-3 text-sm text-gray-300 font-medium">
                Toggle All
              </td>
              {roles.map((_, i) => (
                <td key={i} className="text-center">
                  <input type="checkbox" className="accent-orange-500" />
                </td>
              ))}
            </tr>

            {permissions.map((item) => (
              <tr
                key={item}
                className="border-t border-[#2b2b2b] hover:bg-[#1a1a1a]"
              >
                <td className="px-4 py-3 text-sm text-gray-400">
                  {item}
                </td>
                {roles.map((_, i) => (
                  <td key={i} className="text-center">
                    <input type="checkbox" className="accent-orange-500" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Save / Cancel */}
      <div className="flex justify-end gap-4 mb-12">
        <button className="px-8 py-2.5 rounded-full bg-[#2d2d2d] text-gray-200 hover:bg-[#3a3a3a]">
          Cancel
        </button>
        <button className="px-8 py-2.5 rounded-full bg-orange-600 text-white hover:bg-orange-500 font-medium">
          Save
        </button>
      </div>

      {/* ================= EXPORT FEEDBACK ================= */}
      <h3 className="text-white text-md font-semibold mb-4">
        Export Clinical Decision Support Feedback
      </h3>

      <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg p-6 mb-10 max-w-4xl">
        <div className="grid grid-cols-12 gap-4 mb-3">
          <div className="col-span-4">
            <label className="text-sm text-gray-400 mb-1 block">
              Start date
            </label>
            <input
              type="date"
              className="w-full bg-[#141414] border border-[#404040] rounded-md px-3 py-2 text-sm text-white"
            />
          </div>

          <div className="col-span-4">
            <label className="text-sm text-gray-400 mb-1 block">
              End date
            </label>
            <input
              type="date"
              className="w-full bg-[#141414] border border-[#404040] rounded-md px-3 py-2 text-sm text-white"
            />
          </div>
        </div>

        <p className="text-xs text-gray-500 mb-4">
          Feedback is limited to one year.
        </p>

        <div className="flex justify-end">
          <button className="px-8 py-2.5 rounded-full bg-orange-600 text-white hover:bg-orange-500 font-medium">
            Export CSV
          </button>
        </div>
      </div>

      {/* ================= INTERVENTIONS ================= */}
      <h3 className="text-white text-md font-semibold mb-4">
        Clinical Decision Support Interventions
      </h3>

      <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg p-6 mb-10 text-sm text-gray-400 space-y-2 max-w-5xl leading-relaxed">
        <p>Demographic: Pneumonia Vaccination Status for Older Adults</p>
        <p>Demographic: Preventive Care and Screening: Influenza Immunizations</p>
        <p>
          Demographic, Problem & Medication: Heart Failure: Angiotensin-Converting
          Enzyme (ACE) Inhibitor or Angiotensin Receptor Blocker (ARB) Therapy
        </p>
        <p>
          Implantable Device: Complications with Cardiac Implantable Electronic
          Device (CIED)
        </p>
        <p>Lab Result: Diabetes: Hemoglobin A1c</p>
        <p>
          Medication: Documentation of Current Medication in the Medication Records
        </p>
        <p>Medication Allergy: Childhood Immunization Status</p>
        <p>
          Problem: Ischemic Vascular Disease: Use of Aspirin or other Antithrombotic
        </p>
        <p>
          Procedure: Preventive Care and Screening: Colorectal Cancer Screening
        </p>
        <p>Vitals: Controlling High Blood Pressure</p>
      </div>

      {/* ================= USPSTF ================= */}
      <h3 className="text-white text-md font-semibold mb-4">
        USPSTF Recommendations
      </h3>

      <div className="bg-[#1a1a1a] border border-[#2b2b2b] rounded-lg p-6 mb-6 max-w-5xl text-sm text-gray-400 leading-relaxed space-y-3">
        <p>
          If the "Show AHRQ Recommendations" option is enabled, AHRQ ePSS
          recommendations will be displayed on patient face sheets.
        </p>
        <p>
          AHRQ’s Electronic Preventive Services Selector (ePSS) helps clinicians
          identify appropriate preventive services based on USPSTF
          recommendations.
        </p>
        <p>
          USPSTF recommendations apply to adults and children with no symptoms
          and do not cover chronic or acute care services.
        </p>
      </div>

      <label className="flex items-center gap-3 text-sm text-gray-400 mb-8">
        <input type="checkbox" className="accent-orange-500" />
        Show USPSTF Recommendations
      </label>

      {/* Final buttons */}
      <div className="flex justify-end gap-4">
        <button className="px-8 py-2.5 rounded-full bg-[#2d2d2d] text-gray-200 hover:bg-[#3a3a3a]">
          Cancel
        </button>
        <button className="px-8 py-2.5 rounded-full bg-orange-600 text-white hover:bg-orange-500 font-medium">
          Save
        </button>
      </div>
    </div>
  );
};

export default ClinicalDecision;

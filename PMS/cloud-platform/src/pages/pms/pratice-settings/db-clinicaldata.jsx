import React from "react";
import { Upload } from "lucide-react";

const DbClinicaldata = () => {
  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-10 h-full overflow-y-auto">

      {/* ================= HEADER ================= */}
      <h2 className="text-white text-xl font-semibold mb-4">
        Import Clinical Data
      </h2>

      {/* ================= DESCRIPTION ================= */}
      <p className="text-sm text-gray-400 max-w-3xl leading-relaxed mb-10">
        Have your <span className="text-gray-300">.ccda</span> files ready to
        import into Clinical? Submit a request, and we&apos;ll help you import
        your files.
      </p>

      {/* ================= REQUEST FORM ================= */}
      <div className="max-w-3xl mb-12">
        <div className="grid grid-cols-2 gap-6 mb-8">

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              First Name
            </label>
            <input
              className="w-full bg-[#1a1a1a] border border-[#404040]
                         rounded-md px-4 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Last Name
            </label>
            <input
              className="w-full bg-[#1a1a1a] border border-[#404040]
                         rounded-md px-4 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full bg-[#1a1a1a] border border-[#404040]
                         rounded-md px-4 py-2 text-sm text-white"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Phone
            </label>
            <input
              className="w-full bg-[#1a1a1a] border border-[#404040]
                         rounded-md px-4 py-2 text-sm text-white"
            />
          </div>
        </div>

        <button
          className="px-10 py-3 rounded-full bg-orange-600
                     text-white hover:bg-orange-500 font-medium"
        >
          Request Data Import
        </button>
      </div>

      {/* ================= QRDA IMPORT ================= */}
      <h3 className="text-white text-sm font-semibold mb-4">
        Import QRDA
      </h3>

      <div
        className="border border-dashed border-[#404040]
                   rounded-xl p-12 bg-[#1e1e1e] max-w-3xl text-center"
      >
        <Upload size={28} className="mx-auto mb-4 text-gray-400" />

        <p className="text-sm text-gray-300 mb-2">
          Drag &amp; Drop Your <span className="text-gray-200">.ZIP</span> Folder
          Here
        </p>

        <p className="text-xs text-gray-400 mb-4">
          OR{" "}
          <span className="underline cursor-pointer text-gray-300">
            browse for files
          </span>{" "}
          (.zip)
        </p>
      </div>
    </div>
  );
};

export default DbClinicaldata;

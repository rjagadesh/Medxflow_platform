import React from "react";
import { CheckCircle, Lock } from "lucide-react";

const ClinicalERX = () => {
  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-8 h-full overflow-y-auto">

      {/* ================= HEADER ================= */}
      <h2 className="text-white text-lg font-semibold mb-4">
        eRx Enrollment
      </h2>

      {/* ================= DESCRIPTION ================= */}
      <p className="text-sm text-gray-400 max-w-3xl mb-10 leading-relaxed">
        Providers and licensed users can verify their identity using ID.me to
        prescribe medications electronically.
      </p>

      {/* ================= VERIFY BUTTON ================= */}
      <div className="flex flex-col items-start mb-6">
        <button
          className="flex items-center justify-center gap-3
                     px-10 py-4 rounded-full
                     bg-green-600 hover:bg-green-500
                     text-white text-base font-semibold"
        >
          <CheckCircle size={22} />
          Verify with ID.me
        </button>

        <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
          <Lock size={14} />
          <span>
            Verification by ID.me ·{" "}
            <span className="underline cursor-pointer text-gray-300">
              What is ID.me?
            </span>
          </span>
        </div>
      </div>

      {/* ================= SUCCESS MESSAGE ================= */}
      <div className="bg-green-600/10 border border-green-600/30
                      rounded-lg p-6 mb-8 max-w-4xl">
        <p className="text-sm text-green-400 leading-relaxed">
          Your identity has been verified for e-prescribing for this practice.
          One of your staff will complete the final steps of the e-prescribing
          process by setting you up with Surescripts. We will email{" "}
          <span className="font-medium">
            dianahudson@tebratest.com
          </span>{" "}
          within 3–5 business days when you are ready to e-prescribe.
        </p>
      </div>

      {/* ================= ID.ME INFO ================= */}
      <div className="max-w-4xl">
        <p className="text-sm text-gray-400 leading-relaxed">
          ID.me is our trusted technology partner in helping to keep your
          personal information safe. They specialize in digital identity
          protection and help us make sure you&apos;re you — and not someone
          pretending to be you — before we give you access to your information.
        </p>
      </div>
    </div>
  );
};

export default ClinicalERX;

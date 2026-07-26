import React from "react";

const A2PRegistration = () => {
  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-6 h-full overflow-y-auto">

      {/* ================= HEADER ================= */}
      <div className="flex items-center gap-4 mb-6">
        <h2 className="text-white text-lg font-semibold">
          A2P Registration
        </h2>

        <span className="px-4 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-sm font-medium">
          Not Started
        </span>
      </div>

      {/* ================= INTRO TEXT ================= */}
      <p className="text-sm text-gray-400 mb-6 leading-relaxed">
        Maintain uninterrupted patient SMS communication by verifying your
        practice details and submitting A2P messaging registration — required
        by U.S. mobile carriers for compliance.
      </p>

      <ol className="text-sm text-gray-400 space-y-2 mb-6 list-decimal pl-5">
        <li>Add information below</li>
        <li>
          Double-check all fields: incomplete or incorrect submissions will
          result in failed registration and will require resubmission. You are
          allowed up to 3 registration attempts. If your registration is not
          approved within those attempts, additional charges may apply.
        </li>
        <li>Submit registration</li>
      </ol>

      <p className="text-sm text-gray-400 mb-8">
        For additional guidance, review{" "}
        <span className="underline cursor-pointer text-gray-300">
          documentation
        </span>
        .
      </p>

      {/* ================= BUSINESS DETAILS ================= */}
      <h3 className="text-white text-md font-semibold mb-4">
        Business Details
      </h3>

      {/* Row 1 */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-6">
          <label className="text-sm text-gray-400 mb-1 block">
            Business type
          </label>
          <select className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300">
            <option>Select business type</option>
          </select>
        </div>

        <div className="col-span-6">
          <label className="text-sm text-gray-400 mb-1 block">
            Full legal name
          </label>
          <input className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
        </div>
      </div>

      {/* Row 2 */}
      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-6">
          <label className="text-sm text-gray-400 mb-1 block">
            Patient-facing practice name
          </label>
          <input className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
        </div>

        <div className="col-span-6">
          <label className="text-sm text-gray-400 mb-1 block">
            Last 4 of SSN (U.S. only)
          </label>
          <input className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
        </div>
      </div>

      {/* Row 3 */}
      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-6">
          <label className="text-sm text-gray-400 mb-1 block">
            Website or online presence
          </label>
          <input className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
        </div>
      </div>

      {/* ================= ADDRESS ================= */}
      <h3 className="text-white text-md font-semibold mb-4">
        Legal Business Address (must match IRS statement)
      </h3>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-6">
          <label className="text-sm text-gray-400 mb-1 block">
            Address line 1
          </label>
          <input className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
        </div>

        <div className="col-span-6">
          <label className="text-sm text-gray-400 mb-1 block">
            Address line 2
          </label>
          <input
            placeholder="Apartment, suite, etc."
            className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300"
          />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 mb-6">
        <div className="col-span-4">
          <label className="text-sm text-gray-400 mb-1 block">City</label>
          <input className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
        </div>

        <div className="col-span-4">
          <label className="text-sm text-gray-400 mb-1 block">State</label>
          <select className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300">
            <option>Select state</option>
          </select>
        </div>

        <div className="col-span-4">
          <label className="text-sm text-gray-400 mb-1 block">ZIP code</label>
          <input className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
        </div>
      </div>

      {/* ================= CONTACT INFO ================= */}
      <h3 className="text-white text-md font-semibold mb-4">
        Contact Information
      </h3>

      <div className="grid grid-cols-12 gap-4 mb-4">
        <div className="col-span-6">
          <label className="text-sm text-gray-400 mb-1 block">
            Primary contact name
          </label>
          <input className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
        </div>

        <div className="col-span-6">
          <label className="text-sm text-gray-400 mb-1 block">
            Title
          </label>
          <input className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
        </div>
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-1 block">Email</label>
        <input className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
      </div>

      {/* ================= SOLE PROPRIETOR ================= */}
      <h3 className="text-white text-md font-semibold mb-2">
        Sole Proprietor SMS Verification
      </h3>

      <p className="text-sm text-gray-400 mb-4">
        Enter the sole proprietor's mobile phone number for identity verification.
        Each number can only be used once and must be capable of receiving SMS
        text messages. A verification code will be sent immediately upon
        completing this form.
      </p>

      <div className="mb-4">
        <label className="text-sm text-gray-400 mb-1 block">
          Sole proprietor’s cell phone
        </label>
        <input className="w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
      </div>

      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-1 block">
          Preferred area code
        </label>

        <p className="text-sm text-gray-500 mb-2">
          The default area code below is pulled from your practice settings and
          will be used for your dedicated number if available. If you'd prefer
          something else, click{" "}
          <span className="underline cursor-pointer text-gray-400">
            choose my own
          </span>
          . Actual area code availability cannot be guaranteed.
        </p>

        <div className="text-gray-300 text-sm">(866) XXX-XXXX</div>
      </div>

      {/* ================= FINAL STEP ================= */}
      <h3 className="text-white text-md font-semibold mb-2">
        Final Step
      </h3>

      <p className="text-sm text-gray-400 mb-4">
        Please double-check that your information is accurate. Incorrect details
        — such as your address, tax ID, or legal business name — will result in a
        failed registration and additional fees.
      </p>

      <p className="text-sm text-gray-400 mb-4">
        When you're ready, add your initials below and click submit registration.
      </p>

      <div className="mb-6">
        <label className="text-sm text-gray-400 mb-1 block">Initials</label>
        <input className="w-40 bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2 text-gray-300" />
      </div>

      {/* ================= ACTION BUTTONS ================= */}
      <div className="flex gap-4">
        <button className="px-8 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-500">
          Submit registration
        </button>

        <button className="px-8 py-2 rounded-full bg-[#2d2d2d] text-gray-200 hover:bg-[#3a3a3a]">
          Save draft
        </button>
      </div>

    </div>
  );
};

export default A2PRegistration;

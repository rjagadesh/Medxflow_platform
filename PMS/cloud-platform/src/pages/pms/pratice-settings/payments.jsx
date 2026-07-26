import React, { useState } from "react";
import { Check } from "lucide-react";

const STEPS = [
  "Business",
  "Bank",
  "Products",
  "Owner",
  "Attachments",
  "Review & Sign",
];

const Payments = () => {
  const [step, setStep] = useState(1);

  return (
    <div className="bg-[#1c1c1c] border border-[#2b2b2b] rounded-lg p-8 h-full overflow-y-auto">

      {/* ================= STEPPER ================= */}
      <div className="flex justify-between mb-12 text-sm">
        {STEPS.map((label, idx) => {
          const stepNo = idx + 1;
          const completed = stepNo < step;
          const active = stepNo === step;

          return (
            <div
              key={label}
              className={`flex items-center gap-2 ${
                active ? "text-white font-medium" : "text-gray-400"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs
                  ${
                    completed
                      ? "bg-green-600 text-white"
                      : "border border-[#404040]"
                  }`}
              >
                {completed ? <Check size={14} /> : stepNo}
              </span>
              {label}
            </div>
          );
        })}
      </div>

      {/* ================= STEP 1: BUSINESS ================= */}
      {step === 1 && (
        <>
          <CenterHeader
            title="Business Information"
            subtitle="Tell us about your business"
          />

          <div className="max-w-4xl mx-auto space-y-8">

            <Field label="Legal Business Name">
              <input />
            </Field>

            <label className="flex items-center gap-2 text-sm text-gray-400">
              <input type="checkbox" />
              DBA name (Doing Business As) is the same as legal name
            </label>

            <Field label="Business Tax ID">
              <input />
            </Field>

            <TwoCol>
              <Field label="Ownership Type">
                <select>
                  <option>Select ownership type</option>
                  <option>Sole Proprietor</option>
                  <option>LLC</option>
                  <option>Corporation</option>
                </select>
              </Field>

              <Field label="Business Established Date">
                <input type="date" />
              </Field>
            </TwoCol>

            <TwoCol>
              <Field label="Business Email">
                <input type="email" />
              </Field>

              <Field label="Business Website">
                <input />
              </Field>
            </TwoCol>

            {/* ADDRESS */}
            <Section title="Physical Address">

              <Field label="Address Line 1">
                <input />
              </Field>

              <Field label="Address Line 2 (Optional)">
                <input />
              </Field>

              <TwoCol>
                <Field label="City">
                  <input />
                </Field>

                <Field label="State">
                  <select>
                    <option>Select state</option>
                  </select>
                </Field>
              </TwoCol>

              <TwoCol>
                <Field label="Country">
                  <select>
                    <option>Select country</option>
                  </select>
                </Field>

                <Field label="Postal Code">
                  <input />
                </Field>
              </TwoCol>

              <label className="flex items-center gap-2 text-sm text-gray-400">
                <input type="checkbox" />
                Legal/Mailing Address is the same as physical address
              </label>

            </Section>
          </div>

          <ActionButtons
            showPrevious={false}
            onNext={() => setStep(2)}
          />
        </>
      )}

      {/* ================= STEP 2: BANK ================= */}
      {step === 2 && (
        <>
          <CenterHeader
            title="Bank Information"
            subtitle="Let's set up the account where your payouts will be delivered.
Only business bank accounts are accepted unless your business is a sole proprietorship."
          />

          <div className="max-w-4xl mx-auto space-y-8">

            <Field label="Bank Name">
              <input />
            </Field>

            <Field label="Account Owner / Business Name">
              <input />
            </Field>

            <Field label="Account Type">
              <select>
                <option>Select account type</option>
                <option>Checking</option>
                <option>Savings</option>
              </select>
            </Field>

            <HelperText>
              Only business bank accounts are accepted, unless your business is a
              sole proprietorship.
            </HelperText>

            <Field label="Account Number">
              <input />
            </Field>

            <HelperText>
              The bank account must allow debits so we can facilitate refunds,
              chargebacks, and other payment adjustments.
            </HelperText>

            <Field label="Confirm Account Number">
              <input />
            </Field>

            <Field label="Routing Number">
              <input />
            </Field>

            <Field label="Confirm Routing Number">
              <input />
            </Field>
          </div>

          <ActionButtons
            onPrevious={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        </>
      )}
    </div>
  );
};

export default Payments;

/* ================= HELPERS ================= */

const CenterHeader = ({ title, subtitle }) => (
  <div className="text-center mb-10">
    <h2 className="text-white text-lg font-semibold mb-2">{title}</h2>
    <p className="text-sm text-gray-400 max-w-2xl mx-auto whitespace-pre-line">
      {subtitle}
    </p>
  </div>
);

const Section = ({ title, children }) => (
  <div className="pt-6 border-t border-[#2b2b2b] space-y-6">
    <h3 className="text-white text-sm font-semibold">{title}</h3>
    {children}
  </div>
);

const TwoCol = ({ children }) => (
  <div className="grid grid-cols-12 gap-6">
    {React.Children.map(children, (child) =>
      React.cloneElement(child, { className: "col-span-6" })
    )}
  </div>
);

const Field = ({ label, children, className = "" }) => (
  <div className={`mb-6 ${className}`}>
    <label className="block text-sm text-gray-400 mb-2">{label}</label>
    {React.cloneElement(children, {
      className:
        "w-full bg-[#1a1a1a] border border-[#404040] rounded-md px-4 py-2.5 text-gray-300 outline-none",
    })}
  </div>
);

const HelperText = ({ children }) => (
  <p className="text-sm text-gray-500 -mt-4 mb-6">{children}</p>
);

const ActionButtons = ({
  onPrevious,
  onNext,
  showPrevious = true,
}) => (
  <div className="flex justify-between max-w-4xl mx-auto mt-12">
    {showPrevious ? (
      <button
        onClick={onPrevious}
        className="px-6 py-2 rounded-full bg-[#2d2d2d] text-gray-200 hover:bg-[#3a3a3a]"
      >
        Previous
      </button>
    ) : (
      <div />
    )}

    <div className="flex gap-4">
      <button className="px-6 py-2 rounded-full bg-[#2d2d2d] text-gray-200 hover:bg-[#3a3a3a]">
        Save for later
      </button>

      <button
        onClick={onNext}
        className="px-6 py-2 rounded-full bg-orange-600 text-white hover:bg-orange-500"
      >
        Next
      </button>
    </div>
  </div>
);

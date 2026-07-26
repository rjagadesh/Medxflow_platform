import { useGetPatientLedger } from "@/hooks/mutation/pms/patient/useGetPatientLedger";
import React, { useMemo } from "react";

// Patient Ledger – JSX only

const ledgerData = [
  {
    date: "2026-01-01",
    encounter: "ENC-1001",
    type: "CHARGE",
    description: "Office Visit – CPT 99213",
    charge: 120,
    payment: 0,
    adjustment: 0,
  },
  {
    date: "2026-01-05",
    encounter: "ENC-1001",
    type: "INSURANCE PAYMENT",
    description: "BCBS Payment",
    charge: 0,
    payment: 80,
    adjustment: 20,
  },
  {
    date: "2026-01-10",
    encounter: "ENC-1001",
    type: "PATIENT PAYMENT",
    description: "Credit Card",
    charge: 0,
    payment: 20,
    adjustment: 0,
  },
];

export default function PatientLedgerPage(id) {
  console.log("IDDATEEREIFGEJFGEU ", id?.id);
  const { data, isLoading, error } = useGetPatientLedger(id.id);

  console.log("ledger data:", data);

  const rows = useMemo(() => {
    let runningBalance = 0;

    return (data || ledgerData).map((row) => {
      runningBalance += row.charge;
      runningBalance -= row.payment;
      runningBalance -= row.adjustment;

      return { ...row, balance: runningBalance };
    });
  }, [data]);

  const currentBalance = rows.length ? rows[rows.length - 1].balance : 0;

  return (
    <div className="p-6 space-y-4 text-white">
      <div className="flex justify-between items-center border-b border-neutral-700 pb-3">
        <div>
          <h1 className="text-xl font-semibold">Patient Ledger</h1>
          <p className="text-sm text-neutral-400">
            John Doe • DOB: 01/01/1980 • MRN: 123456
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-neutral-400">Current Balance</p>
          <p
            className={`text-lg font-bold ${
              currentBalance > 0
                ? "text-red-400"
                : currentBalance < 0
                  ? "text-green-400"
                  : "text-neutral-300"
            }`}
          >
            ${currentBalance.toFixed(2)}
          </p>
        </div>
      </div>

      <div className="border border-neutral-700 rounded-lg overflow-hidden">
        <div className="max-h-[45vh] overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-cyan-600">
              <tr className="border-b border-neutral-700">
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Encounter</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Description</th>
                <th className="px-3 py-2 text-right">Charges</th>
                <th className="px-3 py-2 text-right">Payments</th>
                <th className="px-3 py-2 text-right">Adjustments</th>
                <th className="px-3 py-2 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, idx) => (
                <tr
                  key={idx}
                  className="border-b border-neutral-800 hover:bg-neutral-800"
                >
                  <td className="px-3 py-2">{row.date}</td>
                  <td className="px-3 py-2">{row.encounter}</td>
                  <td className="px-3 py-2">{row.type}</td>
                  <td className="px-3 py-2">{row.description}</td>
                  <td className="px-3 py-2 text-right">
                    {row.charge ? "$" + row.charge.toFixed(2) : "–"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.payment ? "$" + row.payment.toFixed(2) : "–"}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {row.adjustment ? "$" + row.adjustment.toFixed(2) : "–"}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      row.balance > 0
                        ? "text-red-400"
                        : row.balance < 0
                          ? "text-green-400"
                          : "text-neutral-300"
                    }`}
                  >
                    ${row.balance.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

import React from "react";

const StatusBadge = ({ status }) => {
  const isCompleted = status === "completed";
  const isActive = status === "active";

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-primary/10 text-[var(--chakra-colors-primary-400)] text-[10px] font-bold uppercase tracking-tighter`}
    >
      <span
        className={`size-1 rounded-full bg-primary ${isActive ? "animate-pulse" : ""}`}
      ></span>
      {status}
    </span>
  );
};

export const ConsumptionTable = ({ transactions }) => {
  return (
    <div
      style={{
        borderColor: "#2f4d78",
      }}
      className="bg-card-dark border border-border-dark rounded-xl overflow-hidden"
    >
      <div
        style={{
          borderColor: "#2f4d78",
        }}
        className="p-6 border-b border-border-dark flex justify-between items-center"
      >
        <h4 className="text-lg font-bold text-white">Recent Consumption</h4>
        <a
          href="#"
          className="text-[var(--chakra-colors-primary-400)] text-sm font-medium hover:underline"
        >
          View all transactions
        </a>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-background-dark/50 text-gray-400 font-medium uppercase text-[11px] tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Resource ID</th>
              <th className="px-6 py-4">Description</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-dark">
            {transactions.map((tx) => (
              <tr
                key={tx.id}
                className="hover:bg-white/5 transition-colors group"
              >
                <td className="px-6 py-4 text-gray-300">{tx.date}</td>
                <td className="px-6 py-4 font-mono text-xs text-[var(--chakra-colors-primary-400)]">
                  {tx.resourceId}
                </td>
                <td className="px-6 py-4 text-white">{tx.description}</td>
                <td className="px-6 py-4 font-bold text-white">
                  ${tx.amount.toFixed(2)}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={tx.status} />
                </td>
                <td className="px-6 py-4 text-right">
                  <button className="text-gray-500 hover:text-white transition-colors">
                    <span className="material-symbols-outlined text-lg">
                      download
                    </span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

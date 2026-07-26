// src/pages/Payouts.jsx

import { useCallback } from "react";
import ListLayout from "./Components/ListLayout";

// Table Columns
const columns = [
  { accessor_key: "date", title: "Date" },
  { accessor_key: "bank_account", title: "Bank Account" },
  { accessor_key: "trace_id", title: "Trace ID" },
  { accessor_key: "transactions", title: "Transactions" },
  { accessor_key: "gross_charges", title: "Gross Charges" },
  { accessor_key: "fees", title: "Fees" },
  { accessor_key: "net_payout", title: "Net Payout" },
];

// Filters displayed at top
const filterDefs = [
  { key: "search", label: "Search Date / Trace" },
  { key: "bank_account", label: "Bank Account" },
];

// Mock Data (10 Rows)
const mockPayouts = [
  {
    date: "12/01/2025",
    bank_account: "CHECKING - 1067",
    trace_id: "242071754552648",
    transactions: 1,
    gross_charges: "$75.00",
    fees: "($2.36)",
    net_payout: "$72.64",
  },
  {
    date: "12/01/2025",
    bank_account: "CHECKING - 1067",
    trace_id: "242071754552667",
    transactions: 3,
    gross_charges: "$98.11",
    fees: "($3.60)",
    net_payout: "$94.51",
  },
  {
    date: "11/28/2025",
    bank_account: "CHECKING - 1067",
    trace_id: "242071755653508",
    transactions: 5,
    gross_charges: "$516.51",
    fees: "($15.70)",
    net_payout: "$500.81",
  },
  {
    date: "11/26/2025",
    bank_account: "CHECKING - 1067",
    trace_id: "242071750528988",
    transactions: 3,
    gross_charges: "$144.12",
    fees: "($4.86)",
    net_payout: "$139.26",
  },
  {
    date: "11/25/2025",
    bank_account: "CHECKING - 1067",
    trace_id: "242071750582213",
    transactions: 3,
    gross_charges: "$60.00",
    fees: "($2.55)",
    net_payout: "$57.45",
  },
  {
    date: "11/24/2025",
    bank_account: "CHECKING - 1067",
    trace_id: "242071759473348",
    transactions: 1,
    gross_charges: "$65.26",
    fees: "($2.09)",
    net_payout: "$63.17",
  },
  {
    date: "11/24/2025",
    bank_account: "CHECKING - 1067",
    trace_id: "242071759474648",
    transactions: 4,
    gross_charges: "$324.31",
    fees: "($10.11)",
    net_payout: "$314.20",
  },
  {
    date: "11/21/2025",
    bank_account: "CHECKING - 1067",
    trace_id: "242071751278889",
    transactions: 3,
    gross_charges: "$310.25",
    fees: "($9.43)",
    net_payout: "$300.82",
  },
  {
    date: "11/20/2025",
    bank_account: "CHECKING - 1067",
    trace_id: "24207151709304",
    transactions: 3,
    gross_charges: "$201.97",
    fees: "($6.46)",
    net_payout: "$195.51",
  },
  {
    date: "11/19/2025",
    bank_account: "CHECKING - 1067",
    trace_id: "242071752058650",
    transactions: 1,
    gross_charges: "$20.00",
    fees: "($0.85)",
    net_payout: "$19.15",
  },
];

// Page Component
export default function Payouts() {
  const fetchData = useCallback(async ({ filters }) => {
    let data = [...mockPayouts];

    // SEARCH by date or trace ID
    if (filters.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(
        (x) =>
          x.date.toLowerCase().includes(s) ||
          x.trace_id.toLowerCase().includes(s)
      );
    }

    // Bank Account filter
    if (filters.bank_account) {
      const s = filters.bank_account.toLowerCase();
      data = data.filter((x) => x.bank_account.toLowerCase().includes(s));
    }

    return data;
  }, []);

  return (
    <ListLayout
      title="Payouts"
      columns={columns}
      filters={filterDefs}
      data={fetchData}
      profile={[]} // payouts do not have profile preview
    />
  );
}

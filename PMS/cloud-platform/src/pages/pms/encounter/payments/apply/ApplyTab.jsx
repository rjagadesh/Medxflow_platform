import React, { useEffect, useMemo, useState } from "react";

export default function ApplyPaymentPage({ amount = 987.65 }) {
  const [applyTo, setApplyTo] = useState("encounter");
  const [showOnly, setShowOnly] = useState("selected");
  const [searchId, setSearchId] = useState("");

  const [patient, setPatient] = useState(null);
  const [encounter, setEncounter] = useState(null);
  const [claims, setClaims] = useState([]);

  const [transactions, setTransactions] = useState([]);
  const [eob, setEob] = useState({
    payer: "",
    allowed: 0,
    contractAdj: 0,
    secondAdj: 0,
    paid: 0,
    deductible: 0,
    coinsurance: 0,
    copay: 0,
    status: "",
    note: "",
  });

  /* ------------------- Calculations ------------------- */

  const totalApplied = useMemo(
    () => claims.reduce((sum, c) => sum + Number(c.thisPayment || 0), 0),
    [claims]
  );

  const unapplied = useMemo(
    () => (amount - totalApplied).toFixed(2),
    [amount, totalApplied]
  );

  /* ------------------- Fetch Logic ------------------- */

  const fetchData = async () => {
    if (!searchId) return;

    let res;
    if (applyTo === "patient") {
      res = await fetch(`/api/patient/${searchId}`).then((r) => r.json());
    } else if (applyTo === "encounter") {
      res = await fetch(`/api/encounter/${searchId}`).then((r) => r.json());
    } else {
      res = await fetch(`/api/claim/${searchId}`).then((r) => r.json());
    }

    setPatient(res.patient);
    setEncounter(res.encounter);
    setClaims(res.claims || []);
    setTransactions(res.transactions || []);
  };

  /* ------------------- Render ------------------- */

  return (
    <div className="apply-payment">
      {/* Header */}
      <div className="header">
        <strong>Amount:</strong> ${amount.toFixed(2)}
        <strong style={{ marginLeft: 24 }}>Unapplied:</strong> ${unapplied}
      </div>

      {/* Filters */}
      <div className="filters">
        <select value={applyTo} onChange={(e) => setApplyTo(e.target.value)}>
          <option value="patient">Patient</option>
          <option value="encounter">Encounter</option>
          <option value="claim">Claim</option>
        </select>

        <input
          placeholder="Enter ID"
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          onBlur={fetchData}
        />

        <select value={showOnly} onChange={(e) => setShowOnly(e.target.value)}>
          <option value="selected">Selected</option>
          <option value="paid">Paid</option>
          <option value="reverted">Reverted</option>
          <option value="all">All</option>
        </select>
      </div>

      {/* Tables */}
      <div className="tables">
        {/* Patient */}
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Patient</th>
            </tr>
          </thead>
          <tbody>
            {patient && (
              <tr>
                <td>{patient.id}</td>
                <td>{patient.name}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Encounter */}
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Svc Date</th>
            </tr>
          </thead>
          <tbody>
            {encounter && (
              <tr>
                <td>{encounter.id}</td>
                <td>{encounter.serviceDate}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Claims */}
        <table>
          <thead>
            <tr>
              <th>Svc Date</th>
              <th>Code</th>
              <th>Mod</th>
              <th>Charges</th>
              <th>This Payment</th>
              <th>Balance</th>
            </tr>
          </thead>
          <tbody>
            {claims.map((c, i) => (
              <tr key={i}>
                <td>{c.serviceDate}</td>
                <td>{c.code}</td>
                <td>{c.mod}</td>
                <td>${c.charges}</td>
                <td>
                  <input
                    value={c.thisPayment}
                    onChange={(e) => {
                      const updated = [...claims];
                      updated[i].thisPayment = e.target.value;
                      setClaims(updated);
                    }}
                  />
                </td>
                <td>${c.balance}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Bottom Section */}
      <div className="bottom">
        {/* Simple EOB */}
        <div className="eob">
          <h4>Simple EOB</h4>

          <input placeholder="Payer" value={eob.payer} />
          <input placeholder="Allowed" value={eob.allowed} />
          <input placeholder="Contract Adj" value={eob.contractAdj} />
          <input placeholder="Second Adj" value={eob.secondAdj} />
          <input placeholder="Paid" value={eob.paid} />
          <input placeholder="Deductible" value={eob.deductible} />
          <input placeholder="Coinsurance" value={eob.coinsurance} />
          <input placeholder="Copay" value={eob.copay} />
          <input placeholder="Status" value={eob.status} />
          <textarea placeholder="Note" value={eob.note} />
        </div>

        {/* Transactions */}
        <div className="transactions">
          <h4>Transaction Log</h4>
          <ul>
            {transactions.map((t, i) => (
              <li key={i}>
                {t.date} — {t.description} — ${t.amount}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

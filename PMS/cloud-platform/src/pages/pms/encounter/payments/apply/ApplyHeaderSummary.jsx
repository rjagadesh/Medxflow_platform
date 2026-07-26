import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomTextArea from "@/components/textarea/textarea";
import CustomSelect from "@/components/ui/select";
import { useGetClaimDetails } from "@/hooks/query/pms/payment_posting/useGetClaimdetails";
import { useGetPaymentClaimById } from "@/hooks/query/pms/payment_posting/useGetPaymentClaimById";
import { Input } from "@chakra-ui/react";
import { parseAsString, useQueryStates } from "nuqs";
import React, { useMemo, useState } from "react";
import { get } from "react-hook-form";

export default function ApplyPaymentUI({
  amount,
  unapplied,
  encounter,
  claims,
  transactions,
  eob,

  onEobChange,
  onClaimPaymentChange,
  selectedClaimId,
  setSelectedClaimId,
  handleSubmitEob,
}) {
  const [topView, setTopView] = React.useState("patient");
  const [search, setSearch] = React.useState("");
  const [selectedItem, setSelectedItem] = React.useState(null);

  // ✅ FUNCTIONAL ADDITION (NO UI IMPACT)

  const [queryParams, setQueryParams] = useQueryStates({
    name: parseAsString.withDefault(""),
    type: parseAsString.withDefault(""),
    clicked: parseAsString.withDefault(0),
    page: parseAsString.withDefault(1),
    page_size: parseAsString.withDefault(10),
  });
  const [paymentsQueryParams, setPaymentQueryParams] = useQueryStates({
    name: parseAsString.withDefault(""),
    type: parseAsString.withDefault(""),
    clicked: parseAsString.withDefault(0),
    page: parseAsString.withDefault(1),
    page_size: parseAsString.withDefault(10),
  });

  const { data: paymentClaims } = useGetPaymentClaimById(paymentsQueryParams);

  const payment_claims = paymentClaims;
  const is_present = paymentClaims?.results;

  const { data, isLoading, isPlaceholderData } =
    useGetClaimDetails(queryParams);

  const patient = data;

  const totalApplied = useMemo(() => {
    return claims?.reduce((sum, c) => sum + Number(c.thisPayment || 0), 0);
  }, [claims]);

  const summary = useMemo(() => {
    return {
      totalAmount: amount,
      unapplied: Math.max(amount - totalApplied, 0),
    };
  }, [amount, totalApplied]);

  const safeArray = (v) => (Array.isArray(v) ? v : []);

  const searchOptions = React.useMemo(() => {
    if (topView === "patient") {
      return safeArray(patient).map((p) => ({
        label: `${p.first_name}-${p.last_name}`,
        value: p,
      }));
    }

    if (topView === "encounter") {
      return safeArray(patient).map((e) => ({
        label: e.encounter_number,
        value: e,
      }));
    }
    if (topView === "appointment") {
      return safeArray(patient).map((a) => ({
        label: a.id,
        value: a,
      }));
    }

    if (topView === "claims") {
      return safeArray(patient).map((c) => ({
        label: c.claim_number,
        value: c,
      }));
    }

    return [];
  }, [topView, patient, encounter, claims]);

  // ✅ FUNCTIONAL ADDITION (NO UI IMPACT)
  const visibleTransactions = React.useMemo(() => {
    if (!selectedClaimId) return [];
    return transactions.filter((t) => t.claimId === selectedClaimId);
  }, [transactions, selectedClaimId]);

  const payer_list = [
    { value: "Aetna", label: "Aetna" },
    { value: "Mtsinai", label: "Mtsinai" },
    { value: "Humana", label: "Humana" },
  ];
  const payer_type = [
    { value: "Primary", label: "Primary" },
    { value: "Secondary", label: "Secondary" },
    { value: "Tertiary", label: "Tertiary" },
  ];
  const adj_codes = [
    { value: "0", label: "0 - Default" },
    { value: "1", label: "1 - Deductible Amount" },
    { value: "2", label: "2 - Coinsurance Amount" },
    { value: "3", label: "3 - Copayment Amount" },
    {
      value: "45",
      label: "45 - Charges exceed fee schedule / contracted amount",
    },
    { value: "94", label: "94 - Processed in excess of charges" },
    { value: "96", label: "96 - Non-covered charge(s)" },
    {
      value: "97",
      label: "97 - Benefit included in allowance for another service",
    },
    {
      value: "100",
      label: "100 - Payment made to patient/insured/responsible party",
    },
    {
      value: "204",
      label:
        "204 - This service/equipment/drug is not covered under the patient's current benefit plan",
    },
    {
      value: "253",
      label: "253 - Sequestration - reduction in federal payment",
    },
  ];

  const coins_type = [
    {
      value: "Default",
      label: "Default",
    },
    {
      value: "Primary",
      label: "Primary",
    },
    {
      value: "Secondary",
      label: "Secondary",
    },
    {
      value: "Treciary",
      label: "Treciary",
    },
  ];

  const copay_type = [
    {
      value: "0-None",
      label: "0-None",
    },
  ];

  const NUMERIC_FIELDS = new Set([
    "billed",
    "allowed",
    "paid",
    "coinsurance",
    "copay",
    "deductible",
    "contractualAdj",
    "balance",
  ]);

  const handleClaimChange = React.useCallback((claimId) => {
    if (!claimId) return;

    const claim = getClaimById(claimId);
    if (!claim) return;

    // 1️⃣ RESET EOB
    const resetEob = {
      payer: [],
      payerType: [],
      billed: "",
      allowed: "",
      paid: "",
      deductible: "",
      coinsurance: "",
      copay: "",
      status: "",
      note: "",
      adjCode: "",
      contractualAdj: "",
      balance: "",
    };

    onEobChange(resetEob);

    // 2️⃣ APPLY BILLED
    const billedAmount = Number(
      claim.total_charge ?? claim.charge_amount ?? 0,
    ).toFixed(2);

    calculateAndEmitEobChange("billed", billedAmount, billedAmount);
  });

  const calculateAndEmitEobChange = (key, value, unpaid = 0) => {
    const toFloat = (v) => {
      const n = parseFloat(v);
      return Number.isFinite(n) ? n : 0;
    };

    const next = {
      ...eob,
      [key]: NUMERIC_FIELDS.has(key) && value === "" ? "" : value,
    };

    const allowed = Number(next.allowed);
    if (!Number.isNaN(allowed)) {
      next.contractualAdj = toFloat(unpaid) - allowed;
    }

    next.balance = toFloat(next.allowed) - toFloat(next.paid);

    // 🔥 SINGLE STATE UPDATE
    onEobChange(next);
  };

  const isNegative = Number(eob?.balance ?? 0) < 0;
  const paymentClaimsList = React.useMemo(
    () => payment_claims?.results ?? payment_claims ?? [],
    [payment_claims],
  );

  const getClaimById = (claimId) =>
    paymentClaimsList.find((t) => t.claim_id === claimId);

  // console.log("PAYMENT CLAIM DATA", paymentClaims);
  console.log("Search data", patient);

  const unpaid = Number(
    getClaimById(selectedClaimId)?.total_charge ?? 0,
  ).toFixed(2);

  return (
    <>
      <div className="bg-gradient-to-b from-neutral-900 to-neutral-950 text-neutral-200 p-4 text-sm">
        {/* ================= HEADER ================= */}
        <div className="flex justify-between items-center border-b border-neutral-700 pb-3 mb-4">
          {/* <div>
            Patient Id:{" "}
            <span className="font-semibold text-cyan-400">
              {getClaimById(selectedClaimId)?.patient_id}
            </span>
          </div> */}
          <div>
            Patient Name:{" "}
            <span className="font-semibold text-cyan-400">
              {getClaimById(selectedClaimId)?.patient_first_name}{" "}
              {getClaimById(selectedClaimId)?.patient_last_name}
            </span>
          </div>
          <div>
            Encounter Id:{" "}
            <span className="font-semibold text-cyan-400">
              {getClaimById(selectedClaimId)?.encounter_number}
            </span>
          </div>
          <div>
            Amount:{" "}
            <span className="font-semibold text-white">
              ${summary.totalAmount?.toFixed(2)}
            </span>
          </div>
          <div>
            Unapplied:{" "}
            <span className="font-semibold text-amber-400">
              ${summary.unapplied?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* ================= TOP SELECTOR ================= */}
        <div className="grid grid-cols-[260px_260px_1fr] gap-4">
          <div className="col-span-2 border border-neutral-700 bg-neutral-900">
            <div className="px-3 py-2 bg-neutral-800 font-semibold border-b border-neutral-700">
              View
            </div>

            <div className="p-3 space-y-3">
              <div className="flex gap-2">
                {["patient", "encounter", "claims", "appointment"].map((v) => (
                  <button
                    key={v}
                    onClick={() => {
                      setTopView(v);
                      setSearch("");
                      setSelectedItem(null);
                    }}
                    className={`px-3 py-1 text-sm border ${
                      topView === v
                        ? "bg-cyan-600 border-cyan-500 text-white"
                        : "bg-neutral-800 border-neutral-700 text-neutral-300"
                    }`}
                  >
                    {v.charAt(0).toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>

              <div className="relative">
                <input
                  value={search}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSearch(value);
                    setSelectedItem(null);

                    setQueryParams((prev) => ({
                      ...prev,
                      name: value,
                      type: topView,
                    }));
                  }}
                  // onChange={(e) => setSearch(e.target.value)}
                  placeholder={`Search ${topView}`}
                  className="w-full h-8 bg-neutral-800 border border-neutral-600 px-2 text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />

                {search && (
                  <div className="absolute z-10 mt-1 w-full bg-neutral-900 border border-neutral-700 max-h-48 overflow-auto">
                    {searchOptions.map((o, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          setSelectedItem(o?.value?.id);
                          setSearch(o.label);

                          setPaymentQueryParams((prev) => ({
                            ...prev,
                            name: o?.value?.id,
                            type: topView,
                          }));
                        }}
                        className="px-3 py-2 cursor-pointer hover:bg-neutral-800"
                      >
                        {o.label}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= SERVICE LINE ITEMS TABLE ================= */}
          <div className="border border-neutral-700 bg-neutral-900">
            {/* Primary Header */}
            <div className="grid  font-semibold border-b border-neutral-700">
              <div className="px-3 py-2 flex items-center justify-center bg-cyan-600 text-white">
                Claim / Service Line
              </div>
            </div>

            {/* Secondary Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr] bg-neutral-850 border-b border-neutral-700 text-xs font-semibold">
              {[
                "Claim ID",
                "Line Svc Date",
                "Code",
                "Charges",
                "Allowed",
                "Paid",
                "Balance",
              ].map((h) => (
                <div
                  key={h}
                  className="px-2 py-2 border-r bg-neutral-800 last:border-r-0 flex items-center justify-center"
                >
                  {h}
                </div>
              ))}
            </div>

            {/* Rows */}
            <div className="max-h-64 overflow-auto divide-y divide-neutral-800">
              {safeArray(payment_claims)?.map((c, i) => (
                <div
                  key={i}
                  onClick={() => {
                    setSelectedClaimId(c.claim_id);
                    handleClaimChange(c.claim_id);
                  }}
                  className={`grid grid-cols-[1fr_1fr_1fr_1fr_1fr_1fr_1fr]
        items-stretch
        cursor-pointer
        ${
          selectedClaimId === c.claim_id
            ? "bg-cyan-900/60"
            : "hover:bg-neutral-800"
        }`}
                >
                  <div className="px-2 py-2 border-r flex items-center justify-center">
                    {c?.claim_number}
                  </div>
                  <div className="px-2 py-2 border-r flex items-center justify-center">
                    {c?.from_date || "-"}
                  </div>
                  <div className="px-2 py-2 border-r flex items-center justify-center">
                    {c?.code || "-"}
                  </div>
                  {/* <div className="px-2 py-2 border-r flex items-center">
                    {c.modifiers || "-"}
                  </div> */}
                  <div className="px-2 py-2 border-r flex items-center justify-center">
                    ${c.total_charge}
                  </div>
                  <div className="px-2 py-2 border-r flex items-center justify-center">
                    ${c.allowed}
                  </div>{" "}
                  <div className="px-2 py-2 border-r flex items-center justify-center">
                    ${c.paid}
                  </div>
                  <div className="px-2 py-2 border-r flex items-center justify-center">
                    ${c.balance_due}
                  </div>
                  <div className="px-2 py-2 border-r flex items-center justify-center" />
                  <div className="px-2 py-2 border-r flex items-center justify-center" />
                  <div className="px-2 py-2 flex items-center justify-end" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ================= BOTTOM SECTION ================= */}
        <div className="grid  gap-4 mt-5">
          {/* Transaction Log */}

          {/* EOB */}
          <div>
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-neutral-800 text-neutral-300">
                  {Object.keys(eob)
                    .filter((key) => key !== "note")
                    .map((key) => (
                      <th
                        key={key}
                        className="border border-neutral-700 px-2 py-2 text-center capitalize whitespace-nowrap"
                      >
                        {key.replace(/([A-Z])/g, " $1")}
                      </th>
                    ))}
                </tr>
              </thead>

              <tbody>
                <tr className="hover:bg-neutral-800">
                  {Object.entries(eob)
                    .filter(([key]) => key !== "note")
                    .map(([key, value]) => {
                      const isDisabled = ["contractualAdj", "balance"].includes(
                        key,
                      );
                      return (
                        <td
                          key={key}
                          className="border border-neutral-700 px-2 py-1 align-top"
                        >
                          {key === "payer" ? (
                            <CustomSelect
                              value={value ?? ""}
                              onValueChange={(val) =>
                                calculateAndEmitEobChange(key, val, unpaid)
                              }
                              options={payer_list}
                            />
                          ) : key === "payerType" ? (
                            <CustomSelect
                              value={value ?? ""}
                              onValueChange={(val) =>
                                calculateAndEmitEobChange(key, val, unpaid)
                              }
                              options={payer_type}
                            />
                          ) : key === "billed" ? (
                            <CustomInput
                              value={value ?? ""}
                              height={8}
                              disabled
                              className="w-full h-7 px-1 text-right text-white text-xs bg-neutral-700 cursor-not-allowed"
                            />
                          ) : key === "adjCode" ? (
                            <CustomSelect
                              value={value ? [value] : []}
                              onValueChange={(val) =>
                                calculateAndEmitEobChange(key, val, unpaid)
                              }
                              options={adj_codes}
                              disabled={isDisabled}
                            />
                          ) : key === "copayCode" ? (
                            <CustomSelect
                              value={value ? [] : []}
                              onValueChange={(val) =>
                                calculateAndEmitEobChange(key, val, unpaid)
                              }
                              options={copay_type}
                            />
                          ) : key === "balance" ? (
                            <Input
                              value={value}
                              height={8}
                              isReadOnly
                              borderColor={
                                Number(value) < 0 ? "red.500" : "neutral.600"
                              }
                              onChange={(e) =>
                                calculateAndEmitEobChange(
                                  key,
                                  e.target.value,
                                  unpaid,
                                )
                              }
                              // disabled={isDisabled}

                              css={{ "--error-color": "red" }}
                              className={`w-full h-7 px-1 text-right text-xs bg-neutral-700 cursor-not-allowed`}
                            />
                          ) : (
                            <CustomInput
                              value={value}
                              height={8}
                              onChange={(e) =>
                                calculateAndEmitEobChange(
                                  key,
                                  e.target.value,
                                  unpaid,
                                )
                              }
                              disabled={isDisabled}
                              className={`w-full h-7 px-1 text-right text-white text-xs ${
                                isDisabled
                                  ? "bg-neutral-700 cursor-not-allowed"
                                  : "bg-neutral-800 border border-neutral-600"
                              }`}
                            />
                          )}
                        </td>
                      );
                    })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div className="border border-neutral-700 bg-neutral-900 p-3 mt-5">
          <div className="font-semibold mb-3">Transaction Log</div>

          {/* Header */}
          <div className="grid grid-cols-[1fr_120px_120px_120px_120px] text-xs font-medium text-neutral-400 border-b border-neutral-800 pb-2">
            <span>Description</span>

            <span className="text-right">Paid</span>
            <span className="text-right">Total Balance</span>
            <span className="text-right">Paid Type</span>
          </div>

          {/* Body */}
          <div className="max-h-64 overflow-auto divide-y divide-neutral-800 text-sm">
            {visibleTransactions.map((t, i) => (
              <div
                key={i}
                className="grid grid-cols-[1fr_120px_120px_120px_120px] py-2 items-center"
              >
                <span className="truncate" title={t.description}>
                  {t.description}
                </span>

                <span className="text-right text-green-400">
                  ${t.paidAmount}
                </span>
                <span className="text-right text-neutral-300">
                  ${t.charge_amount}
                </span>

                <span className="text-right text-neutral-300">
                  {t.paid_type}
                </span>
              </div>
            ))}
          </div>
        </div>

        <h1 className="mt-5">Notes</h1>
        <CustomTextArea
          onChange={(e) => onEobChange("note", e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-600 px-2 py-1 text-white resize-none text-xs"
        />
      </div>
      <div className="mt-3">
        <CustomButton className="mr-3">Post</CustomButton>

        <CustomButton onClick={handleSubmitEob}>Save & Submit</CustomButton>
      </div>
    </>
  );
}

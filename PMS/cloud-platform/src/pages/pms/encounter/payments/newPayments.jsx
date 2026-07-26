import CustomInput from "@/components/input/input";
import CustomTextArea from "@/components/textarea/textarea";
import React, { useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import ApplyTab from "./apply/ApplyTab";
import ApplyPaymentPage from "./apply/ApplyTab";
import ApplyPaymentUI from "./apply/ApplyHeaderSummary";
import { formatDate } from "@/utils/helper";
import { toaster } from "@/components/ui/toaster";
import { useUpdatePayment } from "@/hooks/mutation/pms/payment/useUpdatePayment";
import { useCreatePayment } from "@/hooks/mutation/pms/payment/useCreatePayment";
import CustomSelect from "@/components/ui/select";
import { useGetPaymentClaimById } from "@/hooks/query/pms/payment_posting/useGetPaymentClaimById";
import { useGetPaymentById } from "@/hooks/query/pms/payment_posting/useGetPaymentsById";
import {
  useCreatePaymentEob,
  useCreatePaymentLedger,
} from "@/hooks/mutation/pms/payment/useCreatePaymentEOb";
import { useLocation } from "react-router-dom";

export default function CreatePaymentPage() {
  const location = useLocation();
  const row = location.state?.row;
  const navigate = useNavigate();
  const { paymentId } = useParams();

  const [activeTab, setActiveTab] = useState("general");

  const { mutateAsync: updatePayment, isPending: isUpdating } =
    useUpdatePayment();

  const { mutateAsync, isPending } = useCreatePayment();
  const editId = null;

  const { mutateAsync: saveEobMutation, isPending: is_Pending } =
    useCreatePaymentEob();

  const [currentPaymentId, setCurrentPaymentId] = useState(row?.id || null);

  const [encounter, setEncounter] = useState({
    id: "ENC-88931",
    serviceDate: "2025-01-03",
  });
  const [transactions, setTransactions] = useState([
    {
      claimId: "CLM-001",
      date: "2025-01-04",
      description: "Primary Insurance Payment",
      paidAmount: "40.00",
      balance: "80.00",
      paid_type: "Debit",
    },
    {
      claimId: "CLM-001",
      date: "2025-01-04",
      description: "Secondary Insurance Payment",
      unpaidAmount: "80.00",
      paidAmount: "40.00",
      balance: "40.00",
      paid_type: "Debit",
    },

    {
      claimId: "CLM-002",
      date: "2025-01-04",
      description: "Patient Copay",
      unpaidAmount: "95.00",
      allowed: "50.00",
      paidAmount: "40.00",
      balance: "10.00",
      paid_type: "Debit",
    },
    {
      claimId: "CLM-003",
      date: "2025-01-04",
      description: "Insurance Payment",
      unpaidAmount: "150.00",
      allowed: "60.00",
      paidAmount: "30.00",
      balance: "30.00",
      paid_type: "Debit",
    },
  ]);

  const claimEobMap = {};

  const [claims, setClaims] = useState([
    {
      claimId: "CLM-001",
      serviceDate: "01-03-2025",
      code: "D0120",
      mod: "",
      charges: 120.0,
      allowed: 80.0,
      settled: 80.0,
      balance: 0.0,
    },
    {
      claimId: "CLM-002",
      serviceDate: "01-03-2025",
      code: "D0274",
      mod: "",
      charges: 95.0,
      allowed: 50.0,
      settled: 40.0,
      balance: 10.0,
    },
    {
      claimId: "CLM-003",
      serviceDate: "01-03-2025",
      code: "D1110",
      mod: "",
      charges: 150.0,
      allowed: 60.0,
      settled: 30.0,
      balance: 30.0,
    },
  ]);
  const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  };
  const normalizeEob = (eob) => {
    const toNum = (v) => {
      const n = Number(v);
      return Number.isFinite(n) ? n : 0;
    };

    return {
      payment_id: currentPaymentId,
      claim: selectedClaimId,
      payer: eob.payer?.[0] ?? null,
      payer_type: eob.payerType?.[0] ?? null,
      billed_amount: toNum(eob.billed),
      allowed: toNum(eob.allowed),
      paid: toNum(eob.paid),
      deductible: toNum(eob.deductible),
      coinsurance: toNum(eob.coinsurance),
      copay: toNum(eob.copay),
      adj_amount: toNum(eob.contractualAdj),
      balance: toNum(eob.balance),
      adjustment_code: eob.adjCode ?? null,
      note: eob.note ?? "",
    };
  };

  const handleSubmitEob = async () => {
    if (!selectedClaimId) {
      toaster.error({ title: "Please select a claim" });
      return;
    }

    const eobPayload = normalizeEob(eob);

    const ledgerPayload = buildPaymentLedgerPayload({
      claimId: selectedClaimId,
      batchId: currentPaymentId,
      paid: eob.paid,
      cont_adj: eob.adjCode,
      adj_amount: eob.contractualAdj,
    });

    try {
      // 1️⃣ Save EOB first (source of truth)
      await saveEobMutation(eobPayload);

      // 2️⃣ Create Payment Ledger entry
      await createPaymentLedger(ledgerPayload);

      toaster.success({ title: "EOB and Payment Ledger saved" });
    } catch (err) {
      console.error(err);
      toaster.error({
        title: "Failed to save EOB or Payment Ledger",
      });
    }
  };

  const onEobChange = (nextEob) => {
    setEob(nextEob);
  };

  const buildPaymentLedgerPayload = ({
    claimId,
    batchId,
    paid,
    cont_adj,
    adj_amount,
  }) => {
    return {
      adj_amount: adj_amount,
      claim: claimId,
      batch: batchId,
      entry_type: "PAYMENT",
      responsibility_type: "PAYER",
      amount: paid,
      posting_date: new Date().toISOString().slice(0, 10),
    };
  };

  const { mutateAsync: createPaymentLedger } = useCreatePaymentLedger();

  const type_list = [
    {
      value: "insurance",
      label: "Insurance",
    },
    {
      value: "patient",
      label: "Patient",
    },
  ];

  const category_list = [
    {
      value: "None",
      label: "None",
    },
    {
      value: "writeoff",
      label: "Write Off",
    },
  ];

  const method_list = [
    { label: "EFT / ACH", value: "eft" },
    { label: "Check", value: "check" },
    { label: "Cash", value: "cash" },
    { label: "Card", value: "card" },
  ];

  const { data } = useGetPaymentById(row?.id);

  console.log("DAATA FOR THE PAYMTN", data);
  const empty_eob_state = {
    payer: [],
    payerType: [],
    billed: "",
    // unpaidAmount: "",
    allowed: "",
    paid: "",
    deductible: "",
    coinsurance: "",
    copay: "",
    status: "",
    note: "",
    adjCode: "",
  };
  const [eob, setEob] = useState(empty_eob_state);

  const {
    register,
    control,
    handleSubmit,
    watch,
    reset,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      batchNo: "",
      postDate: "",
      adjudicationDate: "",
      type: "",
      insurance: "",
      category: "",
      method: "",
      referenceNo: "",
      amount: "",
      notes: "",
    },
    mode: "onChange",
  });

  useEffect(() => {
    if (!data) return;

    reset({
      batchNo: data.batch_number ?? "",
      postDate: data.deposit_date ?? "",
      adjudicationDate: data.adjudication_date ?? "",
      type: data.type ?? "",
      insurance: data.payer_name ?? "",
      category: data.category ?? "",
      method: data.method ?? "",
      referenceNo: data.reference_number ?? "",
      amount: data.total_amount ?? "",
      notes: data.notes ?? "",
    });
  }, [data, reset]);

  const amount = Number(watch("amount") || 0);

  const summary = useMemo(() => {
    return {
      totalAmount: amount,
      unapplied: amount,
    };
  }, [amount]);

  const onSubmit = async (data) => {
    const payload = {
      batch_no: data.batchNo,
      post_date: data.postDate,
      adjudication_date: data.adjudicationDate,
      payment_type: data.type,
      payer_name: data.insurance,
      category: data.category,
      source_type: data.method,
      reference_number: data.referenceNo,
      total_amount: data.amount,
      notes: data.notes,
    };

    console.log("payload", payload);

    const formData = new FormData();

    Object.keys(payload).forEach((key) => {
      if (key === "dob" && !payload[key]) {
        formData.append(key, "");
      } else {
        formData.append(key, payload[key]);
      }
    });

    try {
      setActiveTab("apply");
      if (editId) {
        formData.id = editId;

        await updatePayment(formData);
        toaster.success({
          title: "Form Submitted",
          description: "Payment data has been updated successfully.",
        });
      } else {
        const response = await mutateAsync(formData);
        setCurrentPaymentId(response.id);
        toaster.success({
          title: "Form Submitted",
          description: "Payment data has been saved successfully.",
        });
      }
    } catch (error) {
      console.log("error", error);
      toaster.error({
        title: "Submission Failed",
        description: "There was an error saving the patient data.",
      });
    }
  };

  const [selectedClaimId, setSelectedClaimId] = React.useState(null);

  const twoColRowStyle = {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "16px",
    marginTop: "10px",
  };

  return (
    <div style={pageStyle}>
      <div style={{ display: "flex", gap: "16px", marginBottom: "20px" }}>
        <button
          type="button"
          style={tabStyle(activeTab === "general")}
          onClick={() => setActiveTab("general")}
        >
          General
        </button>

        <button
          type="button"
          style={tabStyle(activeTab === "apply")}
          onClick={() => setActiveTab("apply")}
        >
          Apply
        </button>
      </div>

      {activeTab === "general" && (
        <form onSubmit={handleSubmit(onSubmit)}>
          <div style={cardStyle}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 1fr",
                gap: "24px",
              }}
            >
              <div>
                <div style={twoColRowStyle}>
                  <CustomInput
                    label="Batch #"
                    {...register("batchNo", {
                      required: "Batch # is required",
                    })}
                    invalid={!!errors.batchNo}
                    showError={!!errors.batchNo}
                    errorMessage={errors.batchNo?.message}
                  />

                  <CustomInput
                    label="Post Date"
                    type="date"
                    {...register("postDate", {
                      required: "Post Date is required",
                    })}
                    invalid={!!errors.postDate}
                    showError={!!errors.postDate}
                    errorMessage={errors.postDate?.message}
                  />
                </div>

                <div style={twoColRowStyle}>
                  <Controller
                    name="type"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        label="Type"
                        options={type_list}
                        value={field.value ? [field.value] : []}
                        onValueChange={(v) => {
                          field.onChange(v?.[0] ?? "");
                        }}
                      />
                    )}
                  />

                  <CustomInput
                    label="Insurance"
                    {...register("insurance")}
                    invalid={!!errors.insurance}
                    showError={!!errors.insurance}
                    errorMessage={errors.insurance?.message}
                  />
                </div>

                <div style={twoColRowStyle}>
                  <CustomInput
                    label="Adjudication Date"
                    type="date"
                    onChan
                    {...register("adjudicationDate")}
                  />

                  <Controller
                    name="category"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        value={field.value ? [field.value] : []}
                        onValueChange={(v) => {
                          field.onChange(v?.[0] ?? "");
                        }}
                        options={category_list}
                        label="Category"
                      />
                    )}
                  />
                </div>

                <div style={twoColRowStyle}>
                  <Controller
                    name="method"
                    control={control}
                    render={({ field }) => (
                      <CustomSelect
                        options={method_list}
                        label="Method"
                        value={field.value ? [field.value] : []}
                        onValueChange={(v) => {
                          field.onChange(v?.[0] ?? "");
                        }}
                      />
                    )}
                  />

                  <CustomInput
                    label="Reference #"
                    {...register("referenceNo")}
                  />
                </div>

                <div style={twoColRowStyle}>
                  <CustomInput
                    label="Amount"
                    leftAddon="$"
                    type="number"
                    step="0.01"
                    {...register("amount", {
                      required: "Amount is required",
                      min: { value: 0.01 },
                    })}
                  />
                  <div />
                </div>

                <div style={{ marginTop: "12px" }}>
                  <CustomTextArea
                    label="Notes"
                    minH="160px"
                    {...register("notes")}
                  />
                </div>
              </div>

              <div style={summaryStyle}>
                <h3 style={{ marginBottom: "12px", fontSize: "16px" }}>
                  Summary
                </h3>
                <SummaryRow
                  label="Total Amount"
                  value={`$${summary.totalAmount?.toFixed(2)}`}
                />
                <SummaryRow label="Payment Applied to Charges" value="$0.00" />
                <SummaryRow
                  label="Payment Applied to Capitated"
                  value="$0.00"
                />
                <SummaryRow
                  label="Adjustments Related to Payment"
                  value="$0.00"
                />
                <SummaryRow label="Refunds from Payment" value="$0.00" />
                <SummaryRow
                  label="Unapplied Amount"
                  value={`$${summary.unapplied?.toFixed(2)}`}
                />
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: "24px",
              }}
            >
              <button type="submit" style={primaryButton}>
                Save & Continue
              </button>
            </div>
          </div>
        </form>
      )}

      {activeTab === "apply" && (
        <div style={cardStyle}>
          <ApplyPaymentUI
            amount={amount}
            unapplied={summary.unapplied}
            encounter={encounter}
            claims={claims}
            transactions={transactions}
            eob={eob}
            onClaimPaymentChange={(index, value) => {
              const updated = [...claims];
              updated[index].thisPayment = value;
              setClaims(updated);
            }}
            onEobChange={onEobChange}
            selectedClaimId={selectedClaimId}
            setSelectedClaimId={setSelectedClaimId}
            handleSubmitEob={handleSubmitEob}
          />
        </div>
      )}
    </div>
  );
}

/* ---------- unchanged helpers & styles ---------- */

function SummaryRow({ label, value }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#121212",
  color: "#E0E0E0",
  padding: "24px",
  fontFamily: "Roboto, sans-serif",
};

const cardStyle = {
  background: "#1E1E1E",
  borderRadius: "16px",
  padding: "24px",
};

const summaryStyle = {
  background: "#181818",
  borderRadius: "12px",
  padding: "16px",
};

const tabStyle = (active) => ({
  padding: "8px 16px",
  borderRadius: "999px",
  background: active ? "#1E88E5" : "#2A2A2A",
  color: active ? "#FFF" : "#AAA",
});

const primaryButton = {
  padding: "10px 20px",
  borderRadius: "10px",
  background: "#1E88E5",
  color: "#FFF",
};

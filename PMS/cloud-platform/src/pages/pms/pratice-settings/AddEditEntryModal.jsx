import React, { useEffect, useState } from "react";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";
import { X } from "lucide-react";
import CustomButton from "@/components/button/button";
import { toaster } from "@/components/ui/toaster";

const AddEditEntryModal = ({ entry, onClose, onSuccess }) => {
  const isEdit = !!entry;
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    procedure_code: "",
    modifier: "",
    par_amount: "",
    non_par_amount: "",
    limiting_charge_amount: "",
    note: "",
    is_active: true,
  });

  /* ================= POPULATE EDIT ================= */
  useEffect(() => {
    if (entry) {
      setFormData({
        procedure_code: entry.procedure_code || "",
        modifier: entry.modifier || "",
        par_amount: entry.par_amount ?? "",
        non_par_amount: entry.non_par_amount ?? "",
        limiting_charge_amount: entry.limiting_charge_amount ?? "",
        note: entry.note || "",
        is_active: entry.is_active ?? true,
      });
    }
  }, [entry]);

  /* ================= VALIDATION ================= */
  const validateForm = () => {
    if (!formData.procedure_code.trim()) {
      toaster.error({ title: "Procedure code is required" });
      return false;
    }

    if (formData.par_amount === "") {
      toaster.error({ title: "Par amount is required" });
      return false;
    }

    if (formData.non_par_amount === "") {
      toaster.error({ title: "Non-par amount is required" });
      return false;
    }

    if (formData.limiting_charge_amount === "") {
      toaster.error({ title: "Limiting charge amount is required" });
      return false;
    }

    return true;
  };

  /* ================= SUBMIT ================= */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const payload = {
      procedure_code: formData.procedure_code.toUpperCase(),
      modifier: formData.modifier
        ? formData.modifier.toUpperCase()
        : null,
      par_amount: Number(formData.par_amount),
      non_par_amount: Number(formData.non_par_amount),
      limiting_charge_amount: Number(formData.limiting_charge_amount),
      note: formData.note,
      is_active: formData.is_active,
    };

    try {
      setLoading(true);

      if (isEdit) {
        await apiRequest(apiRoutes.feeScheduleEntry.update(entry.id), {
          payload,
        });
        toaster.success({ title: "Entry updated successfully" });
      } else {
        await apiRequest(apiRoutes.feeScheduleEntry.create, {
          payload,
        });
        toaster.success({ title: "Entry created successfully" });
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.error(error);
      toaster.error({
        title: isEdit ? "Failed to update entry" : "Failed to create entry",
      });
    } finally {
      setLoading(false);
    }
  };

  /* ================= UI ================= */
  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* HEADER */}
        <div style={styles.header}>
          <div>
            <h2 style={styles.title}>
              {isEdit ? "Edit" : "Add"} Fee Schedule Entry
            </h2>
            <p style={styles.subtitle}>
              Enter procedure and pricing details
            </p>
          </div>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={22} />
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} style={styles.formBody} noValidate>
          <div style={styles.gridTwo}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Procedure Code <span style={styles.required}>*</span>
              </label>
              <input
                type="text"
                value={formData.procedure_code}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    procedure_code: e.target.value.toUpperCase(),
                  })
                }
                style={styles.input}
                placeholder="e.g. 99213"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Modifier</label>
              <input
                type="text"
                value={formData.modifier}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    modifier: e.target.value.toUpperCase(),
                  })
                }
                style={styles.input}
                placeholder="e.g. 25"
              />
            </div>
          </div>

          <div style={styles.gridThree}>
            <div style={styles.formGroup}>
              <label style={styles.label}>
                Par Amount <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.par_amount}
                onChange={(e) =>
                  setFormData({ ...formData, par_amount: e.target.value })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Non-Par Amount <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.non_par_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    non_par_amount: e.target.value,
                  })
                }
                style={styles.input}
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>
                Limiting Charge <span style={styles.required}>*</span>
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.limiting_charge_amount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    limiting_charge_amount: e.target.value,
                  })
                }
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.formGroup}>
            <label style={styles.label}>Note</label>
            <textarea
              value={formData.note}
              onChange={(e) =>
                setFormData({ ...formData, note: e.target.value })
              }
              style={styles.textarea}
              rows="3"
            />
          </div>

          <div style={styles.formGroup}>
            <label style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    is_active: e.target.checked,
                  })
                }
                style={styles.checkbox}
              />
              Active
            </label>
          </div>

          {/* FOOTER */}
          <div style={styles.footer}>
            <CustomButton type="button" onClick={onClose} disabled={loading}>
              Cancel
            </CustomButton>
            <CustomButton type="submit" disabled={loading}>
              {loading ? "Saving..." : isEdit ? "Update Entry" : "Create Entry"}
            </CustomButton>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */
const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.75)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#1a1a1a",
    borderRadius: "14px",
    width: "100%",
    maxWidth: "720px",
    border: "1px solid #2a2a2a",
  },
  header: {
    padding: "20px 24px",
    borderBottom: "1px solid #2a2a2a",
    display: "flex",
    justifyContent: "space-between",
  },
  title: { fontSize: "20px", color: "#fff", margin: 0 },
  subtitle: { fontSize: "13px", color: "#9ca3af", marginTop: "4px" },
  closeButton: { background: "none", border: "none", color: "#9ca3af" },
  formBody: { padding: "24px" },
  gridTwo: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" },
  gridThree: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "16px",
    marginTop: "16px",
  },
  formGroup: { display: "flex", flexDirection: "column", marginTop: "16px" },
  label: { fontSize: "14px", color: "#d1d5db", marginBottom: "6px" },
  required: { color: "#ef4444" },
  input: {
    padding: "10px",
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#fff",
  },
  textarea: {
    padding: "10px",
    background: "#0f0f0f",
    border: "1px solid #2a2a2a",
    borderRadius: "8px",
    color: "#fff",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#d1d5db",
    marginTop: "16px",
  },
  checkbox: { width: "18px", height: "18px" },
  footer: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "28px",
  },
};

export default AddEditEntryModal;

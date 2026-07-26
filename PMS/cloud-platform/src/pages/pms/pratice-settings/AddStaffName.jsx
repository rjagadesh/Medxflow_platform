import React, { useState } from "react";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";
import { useNavigate } from "react-router-dom";

const AddStaffNameModal = ({ onClose, onSuccess }) => {
  const [staffName, setStaffName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSave = async () => {
  if (!staffName.trim()) {
    alert("Staff name is required");
    return;
  }

  try {
    setLoading(true);

    await apiRequest(apiRoutes.staffscheduling.create, {
      
      payload: {
        staff_name: staffName,
        daily_schedules: [],
      },
    });

    
    onClose?.();  // close modal
    navigate("/pms/platform-settings/calendar-settings");
  } catch (err) {
    console.error(err);
    alert("Failed to add staff");
  } finally {
    setLoading(false);
  }
};


  return (
    <div style={backdropStyle}>
      <div style={modalStyle}>
        <h3 style={{ marginBottom: "12px" }}>Add Staff Name</h3>

        <input
          type="text"
          placeholder="Staff name"
          value={staffName}
          onChange={(e) => setStaffName(e.target.value)}
          style={inputStyle}
        />

        <div style={actionsStyle}>
          <button onClick={onClose}>Cancel</button>
          <button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddStaffNameModal;

/* ---------------- STYLES ---------------- */

const backdropStyle = {
  position: "fixed",
  inset: 0,
  backgroundColor: "rgba(0,0,0,0.6)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
};

const modalStyle = {
  width: "400px",
  backgroundColor: "#2d2d2d",
  padding: "20px",
  borderRadius: "8px",
  border: "1px solid #404040",
};

const inputStyle = {
  width: "100%",
  padding: "10px",
  backgroundColor: "#1a1a1a",
  color: "#fff",
  border: "1px solid #404040",
  borderRadius: "6px",
};

const actionsStyle = {
  marginTop: "16px",
  display: "flex",
  justifyContent: "flex-end",
  gap: "10px",
};

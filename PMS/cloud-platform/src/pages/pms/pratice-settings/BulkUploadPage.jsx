import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";
import {
  Upload,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  FileSpreadsheet,
  Info,
  Download,
} from "lucide-react";
import CustomButton from "@/components/button/button";

const BulkUploadPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // ================= FILE CHANGE =================
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/csv",
    ];

    if (
      validTypes.includes(selectedFile.type) ||
      selectedFile.name.endsWith(".csv")
    ) {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      alert("Please select a valid Excel (.xlsx, .xls) or CSV file.");
      e.target.value = "";
    }
  };

  // ================= UPLOAD =================
  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploading(true);
      setError(null);
      setResult(null);

      const response = await apiRequest(
        apiRoutes.feeScheduleEntry.bulkUpload,
        {
          payload: formData,
          isMultipart: true,
        }
      );

      setResult(response);
      alert(`Success! ${response.total_uploaded} entries uploaded.`);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.response?.data?.details?.join("\n") ||
        "Upload failed. Check file format and required columns.";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  // ================= CSV TEMPLATE DOWNLOAD =================
  const downloadSampleCSV = () => {
    const csvContent = `Note,Procedure Code,Modifier,Par Amount,Non-Par Amount,Limiting Charge Amount
Office visit follow-up,99213,25,120.00,150.00,180.00
`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "fee_schedule_sample.csv";
    link.click();

    URL.revokeObjectURL(url);
  };

  // ================= REQUIRED / OPTIONAL COLUMNS =================
  const requiredColumns = [
    { name: "Procedure Code", description: "e.g. 99213" },
    { name: "Par Amount", description: "Numeric (e.g. 120.00)" },
    { name: "Non-Par Amount", description: "Numeric (e.g. 150.00)" },
    { name: "Limiting Charge Amount", description: "Maximum allowed charge" },
  ];

  const optionalColumns = [
    { name: "Note", description: "Free text note" },
    { name: "Modifier", description: "e.g. 25" },
  ];

  return (
    <div style={styles.container}>
      {/* TOP BAR */}
      <div style={styles.topBar}>
        <CustomButton
          leftIcon={<ArrowLeft size={18} />}
          onClick={() => navigate(-1)}
        >
          Back
        </CustomButton>
        <div style={styles.topBarTitle}>
          
          <span>Bulk Upload</span>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={styles.mainContent}>
        {/* UPLOAD SECTION */}
        <div style={styles.uploadSection}>
          <div style={styles.uploadCard}>
            <div style={styles.uploadHeader}>
              <FileSpreadsheet size={22} />
              <span style={styles.uploadTitle}>Select File</span>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />

            {!file ? (
              <div style={styles.dropZone} onClick={() => fileInputRef.current.click()}>
                <FileSpreadsheet size={40} style={{ color: "#00bbf2", marginBottom: 12 }} />
                <div style={styles.dropZoneText}>Click to browse files</div>
                <div style={styles.dropZoneSubtext}>CSV, XLSX, XLS</div>
              </div>
            ) : (
              <div style={styles.filePreview}>
                <CheckCircle2 size={22} style={{ color: "#10b981" }} />
                <div style={{ flex: 1 }}>
                  <div style={styles.fileName}>{file.name}</div>
                  <div style={styles.fileSize}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>
                <CustomButton onClick={() => fileInputRef.current.click()}>
                  Change
                </CustomButton>
              </div>
            )}

            <CustomButton
              onClick={handleUpload}
              disabled={uploading || !file}
              style={{ width: "100%", marginTop: 16 }}
            >
              {uploading ? "Uploading..." : "Upload File"}
            </CustomButton>

            {result && (
              <div style={styles.successMsg}>
                <CheckCircle2 size={18} />
                <span>Uploaded {result.total_uploaded} entries</span>
              </div>
            )}

            {error && (
              <div style={styles.errorMsg}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
          </div>

          {/* FILE REQUIREMENTS */}
          <div style={styles.requirementsCard}>
            <div style={styles.requirementsHeader}>
              <div style={styles.requirementsHeaderLeft}>
                <Info size={20} />
                <span style={styles.requirementsTitle}>File Requirements</span>
              </div>
              <CustomButton
                leftIcon={<Download size={16} />}
                onClick={downloadSampleCSV}
              >
                Sample CSV
              </CustomButton>
            </div>

            <p style={styles.requirementsSubtitle}>
              CSV headers must match exactly (case & spacing)
            </p>

            <div style={styles.sectionLabel}>Required Columns</div>
            <div style={styles.columnsGrid}>
              {requiredColumns.map((col, idx) => (
                <div key={idx} style={styles.columnCard}>
                  <code style={styles.columnName}>{col.name}</code>
                  <span style={styles.columnDescription}>{col.description}</span>
                </div>
              ))}
            </div>

            <div style={styles.sectionLabel}>Optional Columns</div>
            <div style={styles.columnsGrid}>
              {optionalColumns.map((col, idx) => (
                <div key={idx} style={styles.columnCard}>
                  <code style={styles.columnName}>{col.name}</code>
                  <span style={styles.columnDescription}>{col.description}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */
const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#0a0a0a",
    color: "#fff",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },
  topBar: {
    background: "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)",
    borderBottom: "1px solid #262626",
    padding: "14px 24px",
    display: "flex",
    alignItems: "center",
    gap: 20,
  },
  topBarTitle: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 17,
    fontWeight: 600,
  },
  mainContent: {
    flex: 1,
    padding: "20px 24px",
    overflow: "auto",
  },
  uploadSection: {
    display: "grid",
    gridTemplateColumns: "400px 1fr",
    gap: 24,
    height: "100%",
  },
  uploadCard: {
    background: "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)",
    border: "1px solid #262626",
    borderRadius: 14,
    padding: 22,
  },
  uploadHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  dropZone: {
    border: "2px dashed #404040",
    borderRadius: 12,
    padding: "40px 20px",
    textAlign: "center",
    cursor: "pointer",
    transition: "all 0.3s ease",
    background: "#0f0f0f",
  },
  dropZoneText: {
    fontSize: 15,
    fontWeight: 500,
    marginBottom: 4,
  },
  dropZoneSubtext: {
    fontSize: 12,
    color: "#9ca3af",
  },
  filePreview: {
    background: "#0f0f0f",
    border: "1px solid #10b981",
    borderRadius: 12,
    padding: 16,
    display: "flex",
    alignItems: "center",
    gap: 14,
  },
  fileName: {
    fontSize: 14,
    fontWeight: 500,
    marginBottom: 3,
  },
  fileSize: {
    fontSize: 11,
    color: "#9ca3af",
  },
  successMsg: {
    marginTop: 14,
    padding: 12,
    background: "#064e3b",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
  },
  errorMsg: {
    marginTop: 14,
    padding: 12,
    background: "#450a0a",
    borderRadius: 8,
    display: "flex",
    alignItems: "center",
    gap: 10,
    fontSize: 13,
  },
  requirementsCard: {
    background: "linear-gradient(135deg, #1a1a1a 0%, #0f0f0f 100%)",
    border: "1px solid #262626",
    borderRadius: 14,
    padding: 22,
    overflow: "auto",
  },
  requirementsHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  requirementsHeaderLeft: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  requirementsTitle: {
    fontSize: 16,
    fontWeight: 600,
  },
  requirementsSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: 700,
    color: "#00bbf2",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
    marginTop: 16,
  },
  columnsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 10,
    marginBottom: 12,
  },
  columnCard: {
    background: "#0f0f0f",
    border: "1px solid #262626",
    borderRadius: 8,
    padding: 12,
  },
  columnName: {
    fontFamily: "monospace",
    fontSize: 17,
    fontWeight: 600,
    color: "#00bbf2",
    display: "block",
    marginBottom: 4,
  },
  columnDescription: {
    fontSize: 14,
    color: "#9ca3af",
    display: "block",
    lineHeight: 1.4,
  },
};

export default BulkUploadPage;
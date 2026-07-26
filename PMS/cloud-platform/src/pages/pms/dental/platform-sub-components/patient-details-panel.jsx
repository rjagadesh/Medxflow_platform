import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Clock,
  DollarSign,
  FileText,
  ChevronDown,
  AlertCircle,
  Upload,
  CheckCircle2, // ← Added for "Charges Started" visual
} from "lucide-react";
import { useGetAppointmentById } from "@/hooks/query/pms/pms_appointments/useGetAppointments";
import { Menu, Portal, Button } from "@chakra-ui/react";
import {
  useDeleteAppointment,
  useUpdateAppointment,
} from "@/hooks/mutation/pms/pms_appointments/useCreateAppointments";
import { useUploadPatientDocs } from "@/hooks/mutation/pms/patient/useUploadDocs";
import { toaster } from "@/components/ui/toaster";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog-refactored";
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import CustomAmountInput from "@/components/input/amountInput";

const noteTypes = [
  { label: "Initial Visit", value: "initial_visit" },

  { label: "Amendment", value: "amendment" },

  { label: "Consultation", value: "consultation" },

  { label: "Discharge Summary", value: "discharge_summary" },

  { label: "Dr. Park's Note Type", value: "dr_parks_note_type" },

  { label: "H&P", value: "h_and_p" },

  { label: "Kathy's Initial Visit", value: "kathys_initial_visit" },

  { label: "Memo to Record", value: "memo_to_record" },

  { label: "Nurse Visit", value: "nurse_visit" },

  { label: "Office Form", value: "office_form" },

  { label: "Phone", value: "phone" },

  { label: "Procedure", value: "procedure" },

  { label: "Psych Initial Visit", value: "psych_initial_visit" },

  { label: "Psych Progress", value: "psych_progress" },

  { label: "SOAP", value: "soap" },

  { label: "Telehealth H&P", value: "telehealth_h_and_p" },

  { label: "Telehealth SOAP", value: "telehealth_soap" },

  { label: "Therapist Follow Up", value: "therapist_follow_up" },

  { label: "Therapist Initial Visit", value: "therapist_initial_visit" },

  { label: "Therapist Progress", value: "therapist_progress" },
];

const PatientDetailsPanel = ({
  appointment,
  isOpen,
  onClose,
  lightGradient,
}) => {
  const [activeTab, setActiveTab] = useState("visit");

  const currentAppointment = appointment;

  const navigate = useNavigate();

  const { mutate: updateAppointment, isPending: isUpdatingAppointment } =
    useUpdateAppointment();

  // Financial Editing State
  const [financialData, setFinancialData] = useState({
    self_pay: false,
    copay_amt: "",
    deposite_amt: "",
    self_amt: "",
  });
  const [hasFinancialChanges, setHasFinancialChanges] = useState(false);

  useEffect(() => {
    if (appointment) {
      setFinancialData({
        self_pay: appointment.self_pay || false,
        copay_amt: appointment.copay_amt || "",
        deposite_amt: appointment.deposite_amt || "",
        self_amt: appointment.self_amt || "",
      });
      setHasFinancialChanges(false);
    }
  }, [appointment]);

  const handleFinancialChange = (field, value) => {
    setFinancialData((prev) => ({ ...prev, [field]: value }));
    setHasFinancialChanges(true);
  };

  const handleSelfPayChange = (checked) => {
    if (checked) {
      setShowSelfPayDialog(true);
    } else {
      handleFinancialChange("self_pay", false);
    }
  };

  const handleConfirmSelfPay = () => {
    handleFinancialChange("self_pay", true);
    return true;
  };

  const handleSaveFinancials = () => {
    if (!currentAppointment?.id) return;

    updateAppointment(
      {
        id: currentAppointment.id,
        appointmentData: {
          self_pay: financialData.self_pay,
          copay_amt: financialData.copay_amt,
          deposite_amt: financialData.deposite_amt,
          self_amt: financialData.self_amt,
        },
      },
      {
        onSuccess: () => {
          toaster.create({
            title: "Success",
            description: "Financial information updated",
            type: "success",
          });
          setHasFinancialChanges(false);
        },
        onError: () => {
          toaster.create({
            title: "Error",
            description: "Failed to update financial information",
            type: "error",
          });
        },
      }
    );
  };

  const patient =
    currentAppointment?.patient &&
    typeof currentAppointment.patient === "object"
      ? currentAppointment.patient
      : null;

  useEffect(() => {
    if (isOpen && currentAppointment) {
      console.log(
        "[PatientDetailsPanel] Current Appointment:",
        currentAppointment
      );

      if (patient) {
        console.log("[PatientDetailsPanel] Patient Object:", patient);
      } else {
        console.log(
          "[PatientDetailsPanel] Patient Name (fallback):",
          currentAppointment.patient_name ||
            currentAppointment.patient ||
            "Unknown Patient"
        );
      }
    }
  }, [isOpen, currentAppointment, patient]);

  const deleteMutation = useDeleteAppointment();
  const { mutate: uploadDocs, isPending: isUploading } = useUploadPatientDocs();
  const [files, setFiles] = useState({ photoId: null, insuranceCard: null });
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [showSelfPayDialog, setShowSelfPayDialog] = useState(false);
  const photoIdRef = useRef(null);
  const insuranceCardRef = useRef(null);

  const calculateAge = (dobString) => {
    if (!dobString) return "N/A";
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const formatTimeRange = () => {
    if (!currentAppointment) return "N/A";

    let startTime = currentAppointment.time || currentAppointment.start_time;
    let duration = currentAppointment.duration || 30;

    if (!startTime) return "N/A";

    if (startTime.includes(":")) {
      startTime = startTime.split(":").slice(0, 2).join(":");
    }

    const [hours, minutes] = startTime.split(":").map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(startDate.getTime() + duration * 60 * 1000);

    const format = (d) =>
      d
        .toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        })
        .toUpperCase();

    return `${format(startDate)} - ${format(endDate)}`;
  };

  const formatAppointmentDate = () => {
    if (!currentAppointment?.date) return "N/A";
    return new Date(currentAppointment.date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleDeleteAppointment = () => {
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteAppointment = () => {
    if (!currentAppointment?.id) return;

    deleteMutation.mutate(currentAppointment.id, {
      onSuccess: () => {
        toaster.create({
          title: "Appointment deleted",
          type: "success",
        });
        setIsDeleteConfirmOpen(false);
        onClose();
      },
      onError: (error) => {
        toaster.create({
          title: "Failed to delete",
          description: error?.message || "Failed to delete",
          type: "error",
        });
      },
    });
  };

  const handleUploadDocuments = () => {
    if (!currentAppointment?.patient_id) {
      toaster.create({
        title: "Error",
        description: "Patient ID is missing – cannot upload documents",
        type: "error",
      });
      return;
    }

    if (!files.photoId && !files.insuranceCard) {
      toaster.create({
        title: "Warning",
        description: "Please select at least one document to upload",
        type: "warning",
      });
      return;
    }

    const notes = `Document for Appt ${currentAppointment.date || "N/A"}`;
    const patientId = currentAppointment.patient_id;
    const appointmentId = currentAppointment.id || "";

    const uploadFile = (file, label) => {
      const formData = new FormData();
      formData.append("patient", patientId);
      formData.append("appointment", appointmentId);
      formData.append("file", file);
      formData.append("label", label);
      formData.append("notes", notes);
      formData.append("status", "New");

      uploadDocs(
        { data: formData, id: patientId },
        {
          onSuccess: () => {
            toaster.create({
              title: "Success",
              description: `${label} uploaded successfully`,
              type: "success",
            });
            // Clear the file from state and input
            if (label === "Photo Id") {
              setFiles((prev) => ({ ...prev, photoId: null }));
              if (photoIdRef.current) photoIdRef.current.value = "";
            } else {
              setFiles((prev) => ({ ...prev, insuranceCard: null }));
              if (insuranceCardRef.current) insuranceCardRef.current.value = "";
            }
          },
          onError: (error) => {
            toaster.create({
              title: "Error",
              description: `Failed to upload ${label}: ${
                error?.message || "Unknown error"
              }`,
              type: "error",
            });
          },
        }
      );
    };

    if (files.photoId) {
      uploadFile(files.photoId, "Photo Id");
    }

    if (files.insuranceCard) {
      uploadFile(files.insuranceCard, "Insurance Card");
    }
  };

  // === Determine if charges have started ===
  const hasPaymentInfo =
    parseFloat(currentAppointment?.copay_amt || 0) > 0 ||
    parseFloat(currentAppointment?.deposite_amt || 0) > 0 ||
    parseFloat(currentAppointment?.self_amt || 0) > 0;

  const isPastAppointment = () => {
    if (!currentAppointment?.date) return false;
    const apptDate = new Date(currentAppointment.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return apptDate < today;
  };

  if (!isOpen || !currentAppointment) return null;

  return (
    <div
      className={`transition-all duration-300 ${
        isOpen ? "w-full md:w-[400px] rounded-r-2xl" : "w-0"
      } overflow-hidden bg-[#16375e] border-l border-[#1e4270] h-[calc(88.5vh-30px)] flex flex-col`}
    >
      <div className="w-full md:w-[400px] flex flex-col h-full">
        {/* Header */}
        <div className="p-6 border-b border-[#1e4270] flex flex-col gap-4 flex-shrink-0">
          <div className="flex justify-between items-start">
            <h3 className="text-xl text-white flex items-center gap-2">
              <User size={20} />
              Patient Details
            </h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#1e4270] rounded-lg transition-colors"
            >
              <X className="text-white" size={20} />
            </button>
          </div>

          <div className="text-left">
            <div className="text-lg font-semibold text-white">
              {formatTimeRange()}
            </div>
            <div className="text-sm text-[#808080] mt-1">
              {formatAppointmentDate()}
            </div>
          </div>

          {patient ? (
            <div className="text-left -mt-2">
              <div className="flex justify-between items-baseline gap-2">
                <p className="text-xl font-medium text-white truncate max-w-[260px]" title={`${patient.first_name} ${patient.last_name}`}>
                  {patient.first_name} {patient.last_name}
                </p>
                <span className="text-xs text-[#808080] flex-shrink-0">
                  ID: {typeof currentAppointment.id === "string" ? currentAppointment.id.split("-")[0] : currentAppointment.id}
                </span>
              </div>
              <p className="text-sm text-[#808080] mt-1">
                DOB:{" "}
                {patient.dob
                  ? new Date(patient.dob).toLocaleDateString()
                  : "N/A"}{" "}
                ({calculateAge(patient.dob)} y/o) •{" "}
                <span className="capitalize">{patient.gender || "N/A"}</span>
              </p>
            </div>
          ) : (
            <div className="text-left -mt-2">
              <div className="flex justify-between items-baseline gap-2">
                <p className="text-xl font-medium text-white truncate max-w-[260px]" title={currentAppointment.patient_name || currentAppointment.patient || "Unknown Patient"}>
                  {currentAppointment.patient_name ||
                    currentAppointment.patient ||
                    "Unknown Patient"}
                </p>
                <span className="text-md text-[#808080] flex-shrink-0">
                  Appt ID: {typeof currentAppointment.id === "string" ? currentAppointment.id.split("-")[0] : currentAppointment.id}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[#1e4270] flex-shrink-0">
          <button
            onClick={() => setActiveTab("visit")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "visit"
                ? "text-white border-b-2 border-[#4f8fce]"
                : "text-[#808080] hover:text-white"
            }`}
          >
            Visit Information
          </button>
          <button
            onClick={() => setActiveTab("financial")}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === "financial"
                ? "text-white border-b-2 border-[#4f8fce]"
                : "text-[#808080] hover:text-white"
            }`}
          >
            Financial Information
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-2">
          {activeTab === "visit" && (
            <div className="space-y-6">
              {/* Existing Visit Info */}
              <div className="space-y-5 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#808080]">Provider</span>
                  <span className="text-white">
                    {currentAppointment.provider_name ||
                      currentAppointment.provider ||
                      "N/A"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#808080]">Appointment Mode</span>
                  <span className="text-white capitalize">
                    {currentAppointment.mode ||
                      (currentAppointment.type === "telehealth"
                        ? "Virtual"
                        : "In Person")}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#808080]">Location</span>
                  <span className="text-white">
                    {currentAppointment.location || "Main Clinic"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#808080]">Visit Reason</span>
                  <span className="text-white">
                    {currentAppointment.reason || "General Check-up"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#808080]">Patient Intake</span>
                  <span className="text-white">
                    {currentAppointment.intake_status || "Pending"}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-[#808080]">Current Balance</span>
                  <span className="text-white font-medium">
                    ${patient?.balance || "0.00"}
                  </span>
                </div>
              </div>

              {/* === UPLOAD PATIENT DOCUMENTS SECTION === */}
              <div>
                <div className="h-px bg-[#1e4270] my-3" />

                <h4 className="text-lg font-medium text-white flex items-center gap-2 mb-2">
                  <FileText size={18} className="text-cyan-400" />
                  Upload Patient Documents
                </h4>

                <div className="space-y-5">
                  {/* Photo ID Upload */}
                  <div>
                    <label className="block text-sm font-medium text-[#d2d0d0] mb-2">
                      Photo ID
                    </label>
                    {files.photoId ? (
                      <div className="flex items-center justify-between bg-[#1e4270] rounded-lg p-3 border border-[#2b5187]">
                        <span className="text-sm text-white truncate mr-2">
                          {files.photoId.name}
                        </span>
                        <button
                          onClick={() => {
                            setFiles((prev) => ({ ...prev, photoId: null }));
                            if (photoIdRef.current)
                              photoIdRef.current.value = "";
                          }}
                          className="text-[#808080] hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <input
                            ref={photoIdRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) =>
                              setFiles((prev) => ({
                                ...prev,
                                photoId: e.target.files[0],
                              }))
                            }
                            className="block w-full text-sm text-[#808080] file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#1e4270] file:text-white hover:file:bg-[#2b5187] cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-[#808080] mt-1.5">
                          e.g. Driver's license, passport, or state ID (front
                          and back if applicable)
                        </p>
                      </>
                    )}
                  </div>

                  {/* Insurance Card Upload */}
                  <div>
                    <label className="block text-sm font-medium text-[#d2d0d0] mb-2">
                      Insurance Card
                    </label>
                    {files.insuranceCard ? (
                      <div className="flex items-center justify-between bg-[#1e4270] rounded-lg p-3 border border-[#2b5187]">
                        <span className="text-sm text-white truncate mr-2">
                          {files.insuranceCard.name}
                        </span>
                        <button
                          onClick={() => {
                            setFiles((prev) => ({
                              ...prev,
                              insuranceCard: null,
                            }));
                            if (insuranceCardRef.current)
                              insuranceCardRef.current.value = "";
                          }}
                          className="text-[#808080] hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="relative">
                          <input
                            ref={insuranceCardRef}
                            type="file"
                            accept="image/*,.pdf"
                            onChange={(e) =>
                              setFiles((prev) => ({
                                ...prev,
                                insuranceCard: e.target.files[0],
                              }))
                            }
                            className="block w-full text-sm text-[#808080] file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-[#1e4270] file:text-white hover:file:bg-[#2b5187] cursor-pointer"
                          />
                        </div>
                        <p className="text-xs text-[#808080] mt-1.5">
                          e.g. Front and back of insurance card (if patient has
                          active coverage)
                        </p>
                      </>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleUploadDocuments}
                      disabled={isUploading}
                      className="w-full py-2.5 bg-[#4f8fce] hover:bg-[#468bc0] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? (
                        "Uploading..."
                      ) : (
                        <>
                          <Upload size={16} />
                          Upload Documents
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "financial" && (
            <div className="space-y-6">
              {/* === PAYMENT INFORMATION SECTION === */}
              <div>
                <h4 className="text-lg font-medium text-white flex items-center gap-2 mb-4">
                  <DollarSign size={18} className="text-cyan-400" />
                  Payment Details
                </h4>

                {/* Eligibility Check for Edit Mode */}
                {["active", "unknown", "error", "unknow"].includes(
                  (
                    currentAppointment?.eligibility_status_detail || ""
                  ).toLowerCase()
                ) ? (
                  <div className="space-y-4">
                    {/* Self Pay Checkbox */}
                    <div className="flex items-center justify-between py-2 bg-[#0d2b52] px-3 rounded-lg border border-[#1e4270]">
                      <span className="text-[#d2d0d0] text-sm">
                        Self-Pay Patient
                      </span>
                      <input
                        type="checkbox"
                        checked={financialData.self_pay}
                        onChange={(e) =>
                          handleSelfPayChange(e.target.checked)
                        }
                        className="w-4 h-4 rounded border-gray-600 text-[#4f8fce] focus:ring-[#4f8fce] bg-[#1e4270]"
                      />
                    </div>

                    {/* Co-Pay Input */}
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#d2d0d0] text-sm">Co-Pay</span>
                      <div className="w-36">
                        <CustomAmountInput
                          value={financialData.copay_amt}
                          onChange={(e) =>
                            handleFinancialChange("copay_amt", e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Deposit Input */}
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#d2d0d0] text-sm">
                        Deposit Amount
                      </span>
                      <div className="w-36">
                        <CustomAmountInput
                          value={financialData.deposite_amt}
                          onChange={(e) =>
                            handleFinancialChange(
                              "deposite_amt",
                              e.target.value
                            )
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Self Pay Amount Input */}
                    <div className="flex items-center justify-between py-1">
                      <span className="text-[#d2d0d0] text-sm">
                        Self Pay Amount
                      </span>
                      <div className="w-36">
                        <CustomAmountInput
                          value={financialData.self_amt}
                          onChange={(e) =>
                            handleFinancialChange("self_amt", e.target.value)
                          }
                          placeholder="0.00"
                        />
                      </div>
                    </div>

                    {/* Save Button */}
                    {hasFinancialChanges && (
                      <div className="pt-2">
                        <button
                          onClick={handleSaveFinancials}
                          disabled={isUpdatingAppointment}
                          className="w-full py-2 bg-[#4f8fce] hover:bg-[#468bc0] text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          {isUpdatingAppointment
                            ? "Saving..."
                            : "Save Financial Changes"}
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Self-Pay Status */}
                    <div className="flex items-center justify-between py-2">
                      <span className="text-[#d2d0d0] text-sm">
                        Self-Pay Patient
                      </span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          currentAppointment.self_pay
                            ? "bg-cyan-900/40 text-cyan-300 border-cyan-600"
                            : "bg-gray-800/50 text-gray-400 border-gray-600"
                        }`}
                      >
                        {currentAppointment.self_pay ? "Yes" : "No"}
                      </span>
                    </div>

                    {/* Co-Pay */}
                    {parseFloat(currentAppointment.copay_amt || 0) > 0 && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[#d2d0d0] text-sm flex items-center gap-2">
                          <DollarSign size={16} className="text-green-400" />
                          Co-Pay
                        </span>
                        <span className="text-green-400 font-medium">
                          ${parseFloat(currentAppointment.copay_amt).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* Deposit */}
                    {parseFloat(currentAppointment.deposite_amt || 0) > 0 && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[#d2d0d0] text-sm flex items-center gap-2">
                          <DollarSign size={16} className="text-blue-400" />
                          Deposit
                        </span>
                        <span className="text-blue-400 font-medium">
                          $
                          {parseFloat(currentAppointment.deposite_amt).toFixed(
                            2
                          )}
                        </span>
                      </div>
                    )}

                    {/* Self-Pay Amount */}
                    {parseFloat(currentAppointment.self_amt || 0) > 0 && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-[#d2d0d0] text-sm flex items-center gap-2">
                          <DollarSign size={16} className="text-cyan-400" />
                          {currentAppointment.self_pay
                            ? "Expected Payment"
                            : "Self-Pay Amount"}
                        </span>
                        <span className="text-cyan-400 font-medium text-lg">
                          ${parseFloat(currentAppointment.self_amt).toFixed(2)}
                        </span>
                      </div>
                    )}

                    {/* No payment info fallback */}
                    {!currentAppointment.self_pay &&
                      parseFloat(currentAppointment.copay_amt || 0) === 0 &&
                      parseFloat(currentAppointment.deposite_amt || 0) === 0 &&
                      parseFloat(currentAppointment.self_amt || 0) === 0 && (
                        <p className="text-sm text-[#808080] italic">
                          No payment details recorded.
                        </p>
                      )}

                    {/* Helper note for self-pay */}
                    {currentAppointment.self_pay && (
                      <p className="text-xs text-[#dbcf26] mt-4 flex items-start gap-1">
                        <AlertCircle
                          size={12}
                          className="mt-0.5 flex-shrink-0"
                        />
                        This is a self-pay patient. Full payment expected at
                        time of service.
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* === CHARGE CAPTURE STATUS === */}
              <div className="bg-[#0d2b52] rounded-lg border border-[#1e4270] p-6 text-center">
                {hasPaymentInfo ? (
                  <div className="flex flex-col items-center gap-3">
                    <CheckCircle2 size={32} className="text-green-400" />
                    <p className="text-lg text-green-400 font-medium">
                      Charges Started
                    </p>
                    <p className="text-xs text-[#808080]">
                      Payment details have been recorded
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <p className="text-lg text-white">Charges Not Started</p>
                    <button className="px-6 py-2 border border-[#4f8fce] text-[#4f8fce] rounded-lg hover:bg-[#4f8fce] hover:text-white transition-colors">
                      Create Charge
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <ConfirmationDialog
          open={isDeleteConfirmOpen}
          onClose={setIsDeleteConfirmOpen}
          onConfirm={confirmDeleteAppointment}
          title="Delete Appointment"
          description={`Are you sure want to Delete this ${
            patient
              ? `${patient.first_name} ${patient.last_name}`
              : currentAppointment?.patient_name ||
                currentAppointment?.patient ||
                "Unknown Patient"
          }'s appointment on ${formatAppointmentDate()}`}
          loading={deleteMutation.isPending}
        />
        <ConfirmationDialog
          open={showSelfPayDialog}
          onClose={setShowSelfPayDialog}
          onConfirm={handleConfirmSelfPay}
          title="Confirm Self-Pay"
          description="Are you sure you want to mark this patient as Self-Pay? This will indicate that the patient is responsible for full payment at the time of service."
        />
        <div className="border-t border-[#1e4270] p-2 flex justify-between items-center gap-4 flex-shrink-0">
          <div className="relative flex-1">
            <Menu.Root>
              <Menu.Trigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  color="white"
                  colorScheme={"blackAlpha"}
                  borderColor="droidalGray.300"
                  fontWeight="normal"
                  onClick={() => {}}
                  _hover={{ bg: "droidalGray.300" }}
                  _active={{ bg: "droidalGray.300" }}
                  _expanded={{
                    bg: "droidalGray.300",
                  }}
                >
                  Create Clinical Note
                  <ChevronDown size={18} />
                </Button>
              </Menu.Trigger>

              <Portal>
                <Menu.Positioner>
                  <Menu.Content bgColor={"droidalBlack.300"}>
                    {noteTypes.map((noteType) => (
                      <Menu.Item
                        bgColor={"droidalBlack.300"}
                        color="droidalGray.400"
                        _hover={{
                          color: "white",
                        }}
                        onClick={() => {
                          console.log("currentAppointment", currentAppointment);

                          navigate(
                            `/pms/encounter/notes/${currentAppointment.patient_id}/${currentAppointment.id}/overview`
                          );
                        }}
                        key={noteType.label}
                        value={noteType.value}
                      >
                        {noteType.label}
                      </Menu.Item>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Portal>
            </Menu.Root>
          </div>

          <div className="relative flex-1">
            <select
              className="w-full appearance-none bg-[#0d2b52] border border-[#1e4270] rounded-lg px-4 py-2.5 pr-10 text-white text-sm cursor-pointer hover:border-[#4f8fce] focus:border-[#4f8fce] focus:outline-none transition-colors"
              defaultValue=""
              onChange={(e) => {
                const value = e.target.value;
                if (value === "delete") {
                  handleDeleteAppointment();
                } else if (value === "edit") {
                  // Navigate to edit with full appointment data
                  navigate("/pms/home/appointment/create", {
                    state: {
                      appointmentToEdit: currentAppointment,
                      eligibilityResult: {
                        eligibility_status:
                          currentAppointment.eligibility_status_detail ||
                          "Unknown",
                        provider_network:
                          currentAppointment.provider_network_detail ||
                          "Unknown",
                      },
                    },
                  });
                } else if (value === "payment") {
                  if (currentAppointment.patient_id) {
                    navigate(`/pms/payments/${currentAppointment.patient_id}`, {
                      state: {
                        appointment: {
                          ...currentAppointment,
                          providerName:
                            currentAppointment.provider_name ||
                            currentAppointment.provider ||
                            "N/A",
                          locationName: currentAppointment.location || "Main Clinic",
                        },
                      },
                    });
                  } else {
                    toaster.create({
                      title: "Error",
                      description: "Patient ID is missing",
                      type: "error",
                    });
                  }
                } else if (value) {
                  console.log("Action:", value);
                }
                e.target.value = "";
              }}
            >
              <option value="" disabled>
                More options
              </option>
              <option value="charge">Charge Capture</option>
              <option value="payment">Collect Payment</option>
              <option value="print">Print Encounter Form</option>
              <option disabled>───────────────</option>
              <option value="edit" disabled={isPastAppointment()}>
                Edit Appointment
              </option>
              <option value="delete" style={{ color: "#f56565" }}>
                Delete Appointment
              </option>
            </select>
            <ChevronDown
              size={18}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientDetailsPanel;

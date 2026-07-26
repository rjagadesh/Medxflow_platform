import { formatDate } from "@/utils/helper";
import { 
  CheckCircle, 
  X, 
  Calendar, 
  Clock, 
  User, 
  Stethoscope, 
  MapPin, 
  MessageCircle, 
  AlignLeft, 
  Video,
  DollarSign,
  AlertTriangle
} from "lucide-react";

const AppointmentConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  appointment,
  patientName,
  providerName,
  locationName,
  statusLabel,
  isLoading = false,
  eligibilityResult = null, // NEW PROP
}) => {
  if (!isOpen) return null;

  const getAppointmentTypeLabel = () => {
    if (appointment.type === "telehealth") {
      return "Telehealth Appointment";
    }
    if (appointment.type === "patient_appointment") {
      return "In-Person Appointment";
    }
    return appointment.type?.replace(/_/g, " ")?.split(' ').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ') || "Other Appointment";
  };

  const appointmentTypeLabel = getAppointmentTypeLabel();
  const isTelehealth = appointment.type === "telehealth";

  // Helper to format currency
  const formatCurrency = (value) => {
    if (!value || value === "") return null;
    return `$${parseFloat(value).toFixed(2)}`;
  };

  // Check if there's an eligibility issue
  const hasEligibilityIssue = eligibilityResult && (
    eligibilityResult.eligibility_status !== "Active" ||
    eligibilityResult.eligibility_status === "Unknown" ||
    eligibilityResult.eligibility_status === "Inactive"
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#0a2040] w-full max-w-4xl rounded-2xl shadow-2xl border border-[#1e4270] overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 pb-2">
              <div className="w-10 h-10 rounded-full bg-green-500/15 flex items-center justify-center">
                <CheckCircle size={22} className="text-green-400" />
              </div>
              <h3 className="text-xl font-semibold text-white">Confirm Appointment</h3>
            </div>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="p-2 hover:bg-[#1e4270] rounded-full transition-colors text-[#808080] hover:text-white"
              aria-label="Close"
            >
              <X size={22} />
            </button>
          </div>

          {/* ELIGIBILITY WARNING BANNER */}
          {hasEligibilityIssue && !appointment.isSelfPay && (
            <div className="p-4 mb-3 rounded-lg bg-yellow-900/20 border border-yellow-600/40 flex items-start gap-3">
              <AlertTriangle size={20} className="text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-yellow-300 font-semibold text-sm mb-1">
                  Coverage Issue Detected
                </p>
                <p className="text-yellow-100/90 text-sm leading-relaxed">
                  {eligibilityResult.eligibility_status === "Inactive" 
                    ? "The patient's insurance is currently inactive."
                    : eligibilityResult.eligibility_status === "Unknown"
                    ? "Unable to verify insurance coverage."
                    : "There may be an issue with the patient's insurance coverage."}
                  {" "}Self-pay is not enabled for this appointment. Do you want to proceed with scheduling?
                </p>
              </div>
            </div>
          )}

          {/* Top Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#0d2b52]/50 border border-[#1e4270]/50">
              <div className="w-9 h-9 rounded-full bg-[#1e4270] flex items-center justify-center flex-shrink-0">
                <User size={18} className="text-[#4f8fce]" />
              </div>
              <div>
                <p className="text-xs text-[#808080] font-medium leading-none">Patient</p>
                <p className="text-sm text-white font-semibold leading-tight mt-0.5">{patientName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#0d2b52]/50 border border-[#1e4270]/50">
              <div className="w-9 h-9 rounded-full bg-[#1e4270] flex items-center justify-center flex-shrink-0">
                <Stethoscope size={18} className="text-[#4f8fce]" />
              </div>
              <div>
                <p className="text-xs text-[#808080] font-medium leading-none">Provider</p>
                <p className="text-sm text-white font-semibold leading-tight mt-0.5">{providerName}</p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-3 rounded-lg bg-[#0d2b52]/50 border border-[#1e4270]/50">
              <div className="w-9 h-9 rounded-full bg-[#1e4270] flex items-center justify-center flex-shrink-0">
                {isTelehealth ? (
                  <Video size={18} className="text-cyan-400" />
                ) : (
                  <CheckCircle size={18} className="text-green-400" />
                )}
              </div>
              <div>
                <p className="text-xs text-[#808080] font-medium leading-none">Appointment Type</p>
                <p className={`text-sm font-semibold leading-tight mt-0.5 ${isTelehealth ? "text-cyan-400" : "text-green-400"}`}>
                  {appointmentTypeLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#1e4270] w-full my-8"></div>

          {/* Appointment Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            <div className="flex items-start gap-3">
              <Calendar size={18} className="text-[#808080] mt-0.5" />
              <div>
                <p className="text-xs text-[#808080] uppercase tracking-wider font-medium leading-none">Date</p>
                <p className="text-sm text-white mt-1">{formatDate(appointment.date)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock size={18} className="text-[#808080] mt-0.5" />
              <div>
                <p className="text-xs text-[#808080] uppercase tracking-wider font-medium leading-none">Time & Duration</p>
                <p className="text-sm text-white mt-1">
                  {appointment.time} <span className="text-[#808080]">({appointment.duration} min)</span>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              {isTelehealth ? (
                <Video size={18} className="text-[#808080] mt-0.5" />
              ) : (
                <CheckCircle size={18} className="text-[#808080] mt-0.5" />
              )}
              <div>
                <p className="text-xs text-[#808080] uppercase tracking-wider font-medium leading-none">Type</p>
                <p className="text-sm text-white mt-1">{appointmentTypeLabel}</p>
              </div>
            </div>

            {!isTelehealth && locationName && (
              <div className="flex items-start gap-3">
                <MapPin size={18} className="text-[#808080] mt-0.5" />
                <div>
                  <p className="text-xs text-[#808080] uppercase tracking-wider font-medium leading-none">Location</p>
                  <p className="text-sm text-white mt-1">{locationName}</p>
                </div>
              </div>
            )}

            {isTelehealth && (
              <div className="flex items-start gap-3">
                <Video size={18} className="text-cyan-400 mt-0.5" />
                <div>
                  <p className="text-xs text-[#808080] uppercase tracking-wider font-medium leading-none">Delivery Method</p>
                  <p className="text-sm text-cyan-400 mt-1 font-medium">Virtual Video Call</p>
                </div>
              </div>
            )}

            {appointment.reason && (
              <div className="flex items-start gap-3 md:col-span-2 lg:col-span-1">
                <MessageCircle size={18} className="text-[#808080] mt-0.5" />
                <div>
                  <p className="text-xs text-[#808080] uppercase tracking-wider font-medium leading-none">Reason for Visit</p>
                  <p className="text-sm text-white mt-1">{appointment.reason}</p>
                </div>
              </div>
            )}
          </div>

          {/* === PAYMENT INFORMATION SECTION === */}
          {(appointment.isSelfPay || appointment.coPay || appointment.deposit || appointment.selfPayAmount || appointment.paymentMethod || appointment.paidAmount) && (
            <>
              <div className="h-px bg-[#1e4270] w-full my-8"></div>
              <div className="space-y-4">
                <h4 className="text-lg font-medium text-white flex items-center gap-2">
                  <DollarSign size={20} className="text-cyan-400" />
                  Payment Details
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {appointment.isSelfPay && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-cyan-900/20 border border-cyan-600/30">
                      <div className="w-10 h-10 rounded-full bg-cyan-900/40 flex items-center justify-center flex-shrink-0">
                        <User size={20} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xs text-[#808080] uppercase tracking-wider font-medium">Payment Type</p>
                        <p className="text-base text-cyan-400 font-semibold mt-1">Self-Pay Patient</p>
                      </div>
                    </div>
                  )}

                  {appointment.selfPayAmount && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-cyan-900/20 border border-cyan-600/30">
                      <div className="w-10 h-10 rounded-full bg-cyan-900/40 flex items-center justify-center flex-shrink-0">
                        <DollarSign size={20} className="text-cyan-400" />
                      </div>
                      <div>
                        <p className="text-xs text-[#808080] uppercase tracking-wider font-medium">Self-Pay Amount</p>
                        <p className="text-lg text-cyan-400 font-bold mt-1">
                          {formatCurrency(appointment.selfPayAmount)}
                        </p>
                      </div>
                    </div>
                  )}

                  {appointment.coPay && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-green-900/20 border border-green-600/30">
                      <div className="w-10 h-10 rounded-full bg-green-900/40 flex items-center justify-center flex-shrink-0">
                        <DollarSign size={20} className="text-green-400" />
                      </div>
                      <div>
                        <p className="text-xs text-[#808080] uppercase tracking-wider font-medium">Co-Pay</p>
                        <p className="text-lg text-green-400 font-bold mt-1">
                          {formatCurrency(appointment.coPay)}
                        </p>
                      </div>
                    </div>
                  )}

                  {appointment.deposit && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-blue-900/20 border border-blue-600/30">
                      <div className="w-10 h-10 rounded-full bg-blue-900/40 flex items-center justify-center flex-shrink-0">
                        <DollarSign size={20} className="text-blue-400" />
                      </div>
                      <div>
                        <p className="text-xs text-[#808080] uppercase tracking-wider font-medium">Deposit</p>
                        <p className="text-lg text-blue-400 font-bold mt-1">
                          {formatCurrency(appointment.deposit)}
                        </p>
                      </div>
                    </div>
                  )}

                  {appointment.paymentMethod && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-purple-900/20 border border-purple-600/30">
                      <div className="w-10 h-10 rounded-full bg-purple-900/40 flex items-center justify-center flex-shrink-0">
                        <CheckCircle size={20} className="text-purple-400" />
                      </div>
                      <div>
                        <p className="text-xs text-[#808080] uppercase tracking-wider font-medium">Payment Method</p>
                        <p className="text-base text-purple-400 font-semibold mt-1">
                          {appointment.paymentMethod}
                        </p>
                      </div>
                    </div>
                  )}

                  {appointment.paidAmount && (
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-900/20 border border-emerald-600/30">
                      <div className="w-10 h-10 rounded-full bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
                        <DollarSign size={20} className="text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-xs text-[#808080] uppercase tracking-wider font-medium">Paid Amount</p>
                        <p className="text-lg text-emerald-400 font-bold mt-1">
                          {formatCurrency(appointment.paidAmount)}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Additional Notes */}
          {appointment.notes && (
            <>
              <div className="h-px bg-[#1e4270] w-full my-8"></div>
              <div className="flex items-start gap-3">
                <AlignLeft size={18} className="text-[#808080] mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs text-[#808080] uppercase tracking-wider font-medium leading-none mb-2">
                    Additional Notes
                  </p>
                  <div className="bg-[#0d2b52] rounded-lg p-4 border border-[#1e4270]">
                    <p className="text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                      {appointment.notes}
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-4 pt-6">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="px-6 py-2.5 bg-[#1e4270] hover:bg-[#2b5187] text-white rounded-lg transition-colors text-sm font-medium disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="px-7 py-2.5 rounded-lg text-white text-sm font-medium transition-all hover:shadow-lg hover:scale-[1.02] disabled:opacity-70"
              style={{ backgroundImage: "var(--bg-blue-gradient2)", backgroundColor: "rgba(85, 165, 220, 0.3)" }}
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin inline-block mr-2" />
                  Scheduling...
                </>
              ) : (
                "Confirm & Schedule"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirmationModal;
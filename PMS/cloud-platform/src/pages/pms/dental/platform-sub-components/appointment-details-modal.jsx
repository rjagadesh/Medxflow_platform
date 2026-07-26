import { X, Calendar, Clock, User, Stethoscope, MapPin, FileText, AlignLeft, CheckCircle, IdCard, Shield, ChevronDown } from "lucide-react";
import { useUpdateAppointment } from "@/hooks/mutation/pms/pms_appointments/useCreateAppointments";
import { useState, useEffect } from "react";
import { toaster } from "@/components/ui/toaster";
import { MessageCircle } from "lucide-react";

const AppointmentDetailsModal = ({ isOpen, appointment, onClose, onUpdate }) => {
  const updateAppointment = useUpdateAppointment();
  const [localAppointment, setLocalAppointment] = useState(appointment);

  useEffect(() => {
    if (appointment) {
      setLocalAppointment(appointment);
    }
  }, [appointment]);

  if (!isOpen || !localAppointment) return null;

  const STATUS_OPTIONS = [
    { value: "unconfirmed", label: "Unconfirmed" },
    { value: "scheduled", label: "Scheduled" },
    { value: "reminder_sent", label: "Reminder Sent" },
    { value: "confirmed", label: "Confirmed" },
    { value: "arrived", label: "Arrived" },
    { value: "checked_in", label: "Checked In" },
    { value: "in_progress", label: "In Progress" },
    { value: "roomed", label: "Roomed" },
    { value: "checked_out", label: "Checked Out" },
    { value: "completed", label: "Completed" },
    { value: "no_show", label: "No Show" },
    { value: "rescheduled", label: "Rescheduled" },
    { value: "cancelled", label: "Cancelled" },
  ];

  const handleStatusChange = async (newStatus) => {
    try {
      const updatedLocal = {
        ...localAppointment,
        confirmation_status: newStatus,
      };
      setLocalAppointment(updatedLocal);
      if (onUpdate) onUpdate(updatedLocal);

      await updateAppointment.mutateAsync({
        id: localAppointment.id,
        appointmentData: { confirmationstatus: newStatus },
      });

      toaster.create({
        title: "Status Updated",
        description: `Appointment status changed to ${newStatus.replace(/_/g, " ")}`,
        type: "success",
      });
    } catch (error) {
      setLocalAppointment((prev) => ({
        ...prev,
        confirmation_status: appointment.confirmation_status,
      }));
      if (onUpdate) {
        onUpdate({
          ...localAppointment,
          confirmation_status: appointment.confirmation_status,
        });
      }
      toaster.create({
        title: "Update Failed",
        description: "Failed to update appointment status. Please try again.",
        type: "error",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-[#0a2040] w-full max-w-7xl rounded-2xl shadow-2xl border border-[#1e4270] overflow-hidden max-h-[92vh] overflow-y-auto">
        <div className="p-8 space-y-8">
          {/* Title + Close */}
          <div className="flex items-center justify-between">
            <h3 className="text-2xl text-white">Appointment Details</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-[#1e4270] rounded-full transition-colors text-[#808080] hover:text-white"
            >
              <X size={24} />
            </button>
          </div>

          {/* Top Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="flex items-center gap-3 p-4 rounded-lg bg-[#0d2b52]/50 border border-[#1e4270]/50">
              <div className="w-10 h-10 rounded-full bg-[#1e4270] flex items-center justify-center flex-shrink-0">
                <User size={20} className="text-[#4f8fce]" />
              </div>
              <div>
                <p className="text-sm text-[#808080] font-medium">Patient</p>
                <p className="text-base text-white  mt-0.5 truncate">{localAppointment.patient}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-[#0d2b52]/50 border border-[#1e4270]/50">
              <div className="w-10 h-10 rounded-full bg-[#1e4270] flex items-center justify-center flex-shrink-0">
                <Stethoscope size={20} className="text-[#4f8fce]" />
              </div>
              <div>
                <p className="text-sm text-[#808080] font-medium">Provider</p>
                <p className="text-base text-white  mt-0.5 truncate">{localAppointment.provider}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-lg bg-[#0d2b52]/50 border border-[#1e4270]/50">
              <div className="w-10 h-10 rounded-full bg-[#1e4270] flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-[#4f8fce]" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-[#808080] font-medium mb-1">Appointment Status</p>
                <div className="relative">
                  <select
                    value={localAppointment.confirmation_status || ""}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    disabled={updateAppointment.isPending}
                    className="w-full bg-[#1e4270] text-white border border-[#2b5187] rounded-md px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:border-[#4f8fce] text-sm disabled:opacity-50"
                  >
                    <option value="" disabled>Select</option>
                    {STATUS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#808080] pointer-events-none" />
                  {updateAppointment.isPending && (
                    <div className="absolute inset-0 bg-[#1e4270]/50 rounded-md flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-[#1e4270] w-full my-8"></div>

          {/* Logistics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            <div className="flex items-start gap-4">
              <Calendar size={20} className="text-[#808080] mt-0.5" />
              <div>
                <p className="text-sm text-[#808080] uppercase tracking-wider font-medium">Date</p>
                <p className="text-base text-white mt-1.5">{localAppointment.date}</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock size={20} className="text-[#808080] mt-0.5" />
              <div>
                <p className="text-sm text-[#808080] uppercase tracking-wider font-medium">Time & Duration</p>
                <p className="text-base text-white mt-1.5">{localAppointment.displayTime} <span className="text-[#808080]">({localAppointment.duration} min)</span></p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <CheckCircle size={20} className="text-[#808080] mt-0.5" />
              <div>
                <p className="text-sm text-[#808080] uppercase tracking-wider font-medium">Type</p>
                <p className="text-base text-white mt-1.5 capitalize">{localAppointment.type?.replace(/_/g, " ")}</p>
              </div>
            </div>

            {localAppointment.location && (
              <div className="flex items-start gap-4">
                <MapPin size={20} className="text-[#808080] mt-0.5" />
                <div>
                  <p className="text-sm text-[#808080] uppercase tracking-wider font-medium">Location</p>
                  <p className="text-base text-white mt-1.5">{localAppointment.location}</p>
                </div>
              </div>
            )}
            {localAppointment.reason && (
              <div className="flex items-start gap-4">
                <MessageCircle size={20} className="text-[#808080] mt-0.5" />
                <div>
                  <p className="text-sm text-[#808080] uppercase tracking-wider font-medium">Reason for Visit</p>
                  <p className="text-base text-white mt-1.5">{localAppointment.reason}</p>
                </div>
              </div>
            )}
          </div>

          {/* Patient, Subscriber & Insurance - 4 Columns */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-6">
              <IdCard size={20} className="text-[#4f8fce]" />
              <h4 className="text-lg  text-white">Patient, Subscriber & Insurance Information</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {/* Column 1: Patient Details */}
              <div className="space-y-3">
                <p className="text-lg text-[#808080] ">Patient Details</p>
                <div className="space-y-2 text-base">
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Member ID:</span> <span className="text-white ml-2">{localAppointment.stedi?.memberId || localAppointment.stedi?.subscriberId || "N/A"}</span></p>
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Date of Birth:</span> <span className="text-white ml-2">{localAppointment.stedi?.dateOfBirth || "N/A"}</span></p>
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Gender:</span> <span className="text-white ml-2">{localAppointment.stedi?.gender || "N/A"}</span></p>
                </div>
              </div>

              {/* Column 2: Subscriber Details */}
              <div className="space-y-3">
                <p className="text-lg text-[#808080] ">Subscriber Details</p>
                <div className="space-y-2 text-base">
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Subscriber Name:</span> <span className="text-white ml-2">{localAppointment.stedi?.subscriberName || "N/A"}</span></p>
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Subscriber ID:</span> <span className="text-white ml-2">{localAppointment.stedi?.subscriberId || "N/A"}</span></p>
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Relationship:</span> <span className="text-white ml-2">{localAppointment.stedi?.relationship || "Self"}</span></p>
                </div>
              </div>

              {/* Column 3: Insurance / Payer */}
              <div className="space-y-3">
                <p className="text-lg text-[#808080] ">Insurance / Payer</p>
                <div className="space-y-2 text-base">
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Insurance Company:</span> <span className="text-white ml-2">{localAppointment.stedi?.insuranceCompany || "N/A"}</span></p>
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Payer ID:</span> <span className="text-white ml-2">{localAppointment.stedi?.payerId || "N/A"}</span></p>
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Plan Name:</span> <span className="text-white ml-2">{localAppointment.stedi?.planName || "N/A"}</span></p>
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Plan Type:</span> <span className="text-white ml-2">{localAppointment.stedi?.planType || "N/A"}</span></p>
                </div>
              </div>

              {/* Column 4: Coverage Status */}
              <div className="space-y-3">
                <p className="text-lg text-[#808080] ">Coverage Status</p>
                <div className="space-y-2 text-base">
                  <p>
                    <span className="text-[#808080] text-sm uppercase tracking-wider">Status:</span>{' '}
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium ml-2 ${
                      localAppointment.stedi?.coverageActive 
                        ? 'bg-green-900/30 text-green-400 border border-green-800' 
                        : 'bg-red-900/30 text-red-400 border border-red-800'
                    }`}>
                      {localAppointment.stedi?.coverageActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Start Date:</span> <span className="text-white ml-2">{localAppointment.stedi?.coverageStartDate || "N/A"}</span></p>
                  {localAppointment.stedi?.coverageEndDate && (
                    <p><span className="text-[#808080] text-sm uppercase tracking-wider">End Date:</span> <span className="text-white ml-2">{localAppointment.stedi?.coverageEndDate}</span></p>
                  )}
                  <p><span className="text-[#808080] text-sm uppercase tracking-wider">Level:</span> <span className="text-white ml-2">{localAppointment.stedi?.coverageLevel || "Individual"}</span></p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Notes */}
          {localAppointment.notes && (
            <div className="mb-8">
              <div className="h-px bg-[#1e4270] w-full my-6"></div>
              <div className="flex items-start gap-4">
                <AlignLeft size={20} className="text-[#808080] mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-[#808080] uppercase tracking-wider font-medium mb-2">Additional Notes</p>
                  <div className="bg-[#0d2b52] rounded-lg p-4 border border-[#1e4270]">
                    <p className="text-base text-white/90 leading-relaxed whitespace-pre-wrap">{localAppointment.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4">
            <button
              onClick={onClose}
              className="px-8 py-3 bg-[#1e4270] hover:bg-[#2b5187] text-white rounded-lg transition-colors text-base font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDetailsModal;
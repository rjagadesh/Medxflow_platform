import { useState, useMemo, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Calendar,
  Clock,
  User,
  Stethoscope,
  MapPin,
  FileText,
  CheckCircle,
  AlignLeft,
  X,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { useCreateAppointments } from "@/hooks/mutation/pms/pms_appointments/useCreateAppointments";
import { useUpdateAppointment } from "@/hooks/mutation/pms/pms_appointments/useCreateAppointments"; // ← Add this import
import { toaster } from "@/components/ui/toaster";
import PatientSearch from "./patient-search";
import ProviderSearch from "./provider-search";
import AppointmentConfirmationModal from "./appointment-confirmation";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import CustomButton from "@/components/button/button";
import { formatDate } from "@/utils/helper";
import { Calendar1Icon } from "lucide-react";
import { useGetMinimalPatients } from "@/hooks/query/pms/patient/useGetMinimalPatients";
import { useGetMinimalProviders } from "@/hooks/query/pms/pms_appointments/useGetProviders";
import { useGetPatientLedger } from "@/hooks/mutation/pms/patient/useGetPatientLedger";
import { useRunEligibilityCheck } from "@/hooks/mutation/pms/pms_appointments/useCreateAppointments";
import { useGetProvidersById } from "@/hooks/query/pms/pms_appointments/useGetProviderById";
import CustomAmountInput from "@/components/input/amountInput";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog-refactored";

const processProviderSchedule = (weekData) => {
  if (!weekData) return {};
  let parsed = {};
  try {
    parsed = typeof weekData === "string" ? JSON.parse(weekData) : weekData;
  } catch (e) {
    console.error("Error parsing week data", e);
    return {};
  }

  const keys = Object.keys(parsed);
  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];
  const isSingleLocation = keys.some((k) => days.includes(k));

  if (isSingleLocation) {
    return { "Main Clinic": parsed };
  }
  return parsed;
};

const CreateAppointment = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Detect edit mode from location.state
  const appointmentToEdit = location.state?.appointmentToEdit;
  const prefilledEligibility = location.state?.eligibilityResult;

  const isEditMode = !!appointmentToEdit;

  const {
    date: prefilledDate,
    time: prefilledTime,
    patient: prefilledPatient = {},
    provider: prefilledProvider,
  } = location.state || {};

  const now = new Date();
  const today = now;
  const lightGradient = "var(--bg-blue-gradient2)";

  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [showProviderSearch, setShowProviderSearch] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isNavigateToPayment, setIsNavigateToPayment] = useState(false);
  const [showInactiveInsuranceDialog, setShowInactiveInsuranceDialog] = useState(false);
  const [providerSchedule, setProviderSchedule] = useState({});

  const [newAppointment, setNewAppointment] = useState({
    id: appointmentToEdit?.id || null,
    patient: appointmentToEdit?.patient_id || prefilledPatient.id || "",
    provider: appointmentToEdit?.provider_id || prefilledProvider || "",
    date: appointmentToEdit?.date || prefilledDate || "",
    time: appointmentToEdit?.time || prefilledTime || "",
    duration: appointmentToEdit?.duration?.toString() || "30",
    type:
      appointmentToEdit?.type === "telehealth_appointment"
        ? "telehealth"
        : appointmentToEdit?.type || "patient_appointment",
    location: appointmentToEdit?.location || "",
    reason: appointmentToEdit?.reason || "",
    notes: appointmentToEdit?.notes || "",
    confirmation_status: appointmentToEdit?.confirmation_status || "unconfirmed",

    // === PAYMENT FIELDS ===
    isSelfPay: appointmentToEdit?.self_pay || false,
    coPay: appointmentToEdit?.copay_amt || "",
    deposit: appointmentToEdit?.deposite_amt || "",
    selfPayAmount: appointmentToEdit?.self_amt || "",
    paymentMethod: appointmentToEdit?.payment_method || "",
    paidAmount: appointmentToEdit?.paid_amount || "",
  });

  const [eligibilityResult, setEligibilityResult] = useState(prefilledEligibility || null);

  // Pre-fill eligibility from appointment data if in edit mode
  useEffect(() => {
    if (isEditMode && appointmentToEdit && !prefilledEligibility) {
      setEligibilityResult({
        eligibility_status: appointmentToEdit.eligibility_status_detail || "Unknown",
        provider_network: appointmentToEdit.provider_network_detail || "Unknown",
      });
    }
  }, [isEditMode, appointmentToEdit, prefilledEligibility]);

  const locationOptions = useMemo(() => {
    const locs = Object.keys(providerSchedule);
    if (locs.length > 0) {
        return locs.map(l => ({ id: l, name: l }));
    }
    return [];
  }, [providerSchedule]);

  const dummyLocations = locationOptions;

  const reasonDurationMap = useMemo(() => ({
    "ADHD Consult": "30",
    "Annual Physical Exam": "30",
    "Behavioral Consult": "60",
    "Behavioral Follow Up": "30",
    "Consult – 30 min": "30",
    "Consult – 60 min": "60",
    "Follow Up": "30",
    "Hormone Consult": "20",
    "Hormone Management": "10",
    "Inpatient – Primary Team": "540",
    "Inpatient Consult": "120",
    "Lab results": "15",
    "Medication Refill": "15",
    "Obesity management": "60",
    "Provider Unavailable": "60",
    Psychotherapy: "60",
    "Psychotherapy Intake": "60",
    "Sick Visit": "15",
    "Weight loss Consultation": "30",
  }), []);

  const reasonOptions = useMemo(() => Object.keys(reasonDurationMap), [reasonDurationMap]);

  const createMutation = useCreateAppointments();
  const updateMutation = useUpdateAppointment(); // ← Use update hook in edit mode
  const { mutate: runEligibilityCheck } = useRunEligibilityCheck();
  const { data: patientsData = [] } = useGetMinimalPatients();
  const { data: providersData = [] } = useGetMinimalProviders();
  const { data: fullProviderDetails } = useGetProvidersById(
    newAppointment.provider
  );

  const { data: ledgerData } = useGetPatientLedger(newAppointment.patient);

  const ledgerBalance = useMemo(() => {
    let balance = 0;
    if (ledgerData && Array.isArray(ledgerData)) {
      balance = ledgerData.reduce((acc, item) => {
        if (item.type === "PAYMENT") {
          return acc + (item.payment || 0);
        } else if (item.type === "CHARGE") {
          return acc - (item.charge || 0);
        }
        return acc;
      }, 0);
    }

    // Add Co Pay and Deposit to balance (increasing what they owe/balancing it)
    // Actually, usually "Patient Balance" is what they owe. 
    // If balance is positive, it means they have credit? 
    // The code says: if (item.type === "PAYMENT") { return acc + (item.payment || 0); }
    // This means PAYMENT increases the balance. So balance is likely "Credit Balance".
    // If balance is positive, they have money in their account.
    // If balance is negative, they owe money.
    // "when the user is entering amount in Co Pay or Deposit Field add that amount to the Patient Balance"
    // "if the paid amount is entering then deduct it from the Patient Balance"
    // Wait, if I add Co Pay to balance, and Co Pay is something they NEED to pay, 
    // and they haven't paid it yet, it should decrease their credit balance?
    // Let's follow the user's literal instruction: 
    // "add that amount to the Patient Balance and if the paid amount is entering then deduct it from the Patient Balance"

    const coPayVal = parseFloat(newAppointment.coPay) || 0;
    const depositVal = parseFloat(newAppointment.deposit) || 0;
    const paidAmountVal = parseFloat(newAppointment.paidAmount) || 0;

    return balance + coPayVal + depositVal - paidAmountVal;
  }, [ledgerData, newAppointment.coPay, newAppointment.deposit, newAppointment.paidAmount]);

  const patients = Array.isArray(patientsData) ? patientsData : [];
  const providersList = Array.isArray(providersData) ? providersData : [];

  const providers = useMemo(
    () => [
      { id: "all", name: "All Providers" },
      ...providersList.map((p) => ({
        id: p.provider_id || p.id,
        name:
          p.provider_name ||
          `${p.first_name || ""} ${p.last_name || ""}`.trim() ||
          `Provider ${p.provider_id || p.id}`,
        specialty: p.specialty || "",
      })),
    ],
    [providersList]
  );

  // === ROBUST PROVIDER NAME LOOKUP ===
  const selectedProviderName = useMemo(() => {
    if (!newAppointment.provider) return "Unknown Provider";

    const fromDropdown = providers.find(
      (p) => p.id.toString() === newAppointment.provider.toString()
    );
    if (fromDropdown && fromDropdown.name !== "All Providers") {
      return fromDropdown.name;
    }

    const fromRaw = providersList.find(
      (p) =>
        (p.provider_id || p.id)?.toString() ===
        newAppointment.provider.toString()
    );
    if (fromRaw) {
      return (
        fromRaw.provider_name ||
        `${fromRaw.first_name || ""} ${fromRaw.last_name || ""}`.trim() ||
        "Unknown Provider"
      );
    }

    return "Unknown Provider";
  }, [newAppointment.provider, providers, providersList]);

  // Update schedule when full provider details are loaded
  useEffect(() => {
    // Guard: If provider is selected but data not yet loaded (id mismatch/missing), do nothing.
    // This prevents clearing pre-filled location in edit mode during initial load.
    if (
      newAppointment.provider &&
      fullProviderDetails?.id?.toString() !== newAppointment.provider.toString()
    ) {
      return;
    }

    const weekData = fullProviderDetails?.week;
    const processed = processProviderSchedule(weekData);
    setProviderSchedule(processed);

    const newLocations = Object.keys(processed);
    setNewAppointment((prev) => {
      const currentLocValid = newLocations.includes(prev.location);
      // If we have NO locations, clear location?
      if (newLocations.length === 0 && prev.location) {
        return { ...prev, location: "" };
      }
      return prev;
    });
  }, [fullProviderDetails, newAppointment.provider]);

  const handleReasonChange = (e) => {
    const reason = e.target.value;
    const duration = reasonDurationMap[reason] || "30";
    setNewAppointment((prev) => ({ ...prev, reason, duration }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (
      !newAppointment.patient ||
      !newAppointment.provider ||
      !newAppointment.date ||
      !newAppointment.time
    ) {
      toaster.error({
        title: "Required Fields Missing",
        description: "Please select patient, provider, date, and time.",
      });
      return;
    }

    const selectedDateTime = new Date(
      `${newAppointment.date}T${newAppointment.time}`
    );
    if (selectedDateTime < new Date()) {
      toaster.error({
        title: "Invalid Time",
        description: "Cannot schedule an appointment in the past.",
      });
      return;
    }

    setShowConfirmDialog(true);
  };

  const handleScheduleAndCollectPayment = (e) => {
    e.preventDefault();

    if (
      !newAppointment.patient ||
      !newAppointment.provider ||
      !newAppointment.date ||
      !newAppointment.time
    ) {
      toaster.error({
        title: "Required Fields Missing",
        description: "Please select patient, provider, date, and time.",
      });
      return;
    }

    const selectedDateTime = new Date(
      `${newAppointment.date}T${newAppointment.time}`
    );
    if (selectedDateTime < new Date()) {
      toaster.error({
        title: "Invalid Time",
        description: "Cannot schedule an appointment in the past.",
      });
      return;
    }

    setIsNavigateToPayment(true);
    setShowConfirmDialog(true);
  };

  const confirmAndSubmit = () => {
    const payload = {
      patient: newAppointment.patient,
      provider: newAppointment.provider,
      date: formatDate(newAppointment.date, "yyyy-MM-dd"),
      time: newAppointment.time,
      duration: newAppointment.duration,
      type:
        newAppointment.type === "telehealth"
          ? "telehealth_appointment"
          : newAppointment.type,
      location: newAppointment.location || null,
      reason: newAppointment.reason || null,
      notes: newAppointment.notes || null,
      confirmation_status: newAppointment.confirmation_status,
      ...(newAppointment.type === "telehealth" && {
        create_telehealth_meeting: true,
      }),

      // === PAYMENT FIELDS ===
      self_pay: newAppointment.isSelfPay,
      copay_amt: newAppointment.coPay ? parseFloat(newAppointment.coPay) : 0.0,
      deposite_amt: newAppointment.deposit
        ? parseFloat(newAppointment.deposit)
        : 0.0,
      self_amt: newAppointment.selfPayAmount
        ? parseFloat(newAppointment.selfPayAmount)
        : 0.0,
      payment_method: newAppointment.paymentMethod || null,
      paid_amount: newAppointment.paidAmount ? parseFloat(newAppointment.paidAmount) : 0.0,
    };

    const mutation = isEditMode ? updateMutation : createMutation;
    const mutationPayload = isEditMode
      ? { id: newAppointment.id, appointmentData: payload }
      : payload;

    mutation.mutate(mutationPayload, {
      onSuccess: (data) => {
        toaster.success({
          title: "Success",
          description: `Appointment ${isEditMode ? "updated" : "created"} successfully.`,
        });
        if (isNavigateToPayment) {
          const appointmentId = data?.appointment?.id || newAppointment.id;
          navigate(`/pms/payments/${newAppointment.patient}`, {
            state: {
              appointment: {
                ...newAppointment,
                id: appointmentId,
                providerName: selectedProviderName,
                locationName: getLocationName(),
              }
            }
          });
        } else {
          navigate(-1);
        }
      },
      onError: (error) => {
        let shown = false;

        if (error?.patient?.[0]?.includes("already has an appointment")) {
          toaster.error({
            title: "Patient Conflict",
            description:
              "This patient already has an appointment at this time.",
          });
          shown = true;
        }

        if (!shown && error?.provider?.[0]?.includes("already booked")) {
          toaster.error({
            title: "Provider Unavailable",
            description: "This provider is already booked at this time.",
          });
          shown = true;
        }

        if (!shown) {
          const fields = [
            "patient",
            "provider",
            "date",
            "time",
            "duration",
            "self_pay",
            "copay_amt",
            "deposite_amt",
            "self_amt",
            "non_field_errors",
            "detail",
          ];
          for (const field of fields) {
            if (error?.[field]) {
              const msg = Array.isArray(error[field])
                ? error[field][0]
                : error[field];
              if (typeof msg === "string") {
                toaster.error({
                  title: "Error",
                  description: msg.charAt(0).toUpperCase() + msg.slice(1),
                });
                shown = true;
                break;
              }
            }
          }
        }

        if (!shown) {
          toaster.error({
            title: "Failed",
            description: `Unable to ${isEditMode ? "update" : "create"} appointment. Please try again.`,
          });
        }
      },
      onSettled: () => setShowConfirmDialog(false),
    });
  };

  const handlePatientSelect = (patient) => {
    setNewAppointment((prev) => ({ ...prev, patient: patient.id }));
    console.log("Selected Patient:", patient);
    setShowPatientSearch(false);
  };

  const handleProviderSelect = (provider) => {
    setNewAppointment((prev) => ({
      ...prev,
      provider: provider.id,
      location: "", // Clear location so it resets based on new schedule
    }));
    setShowProviderSearch(false);
  };

  const handleCancel = () => navigate(-1);

  const handleSelfPayConfirm = () => {
    setNewAppointment((prev) => ({ ...prev, isSelfPay: true }));
    return true;
  };

  const handleCheckEligibility = () => {
    if (!newAppointment.patient || !newAppointment.provider) {
      toaster.error({
        title: "Missing Information",
        description: "Please select both a patient and a provider.",
      });
      return;
    }

    const payload = {
      patientid: newAppointment.patient,
      providerid: newAppointment.provider,
    };

    toaster.create({ title: "Checking Eligibility...", type: "info" });

    runEligibilityCheck(payload, {
      onSuccess: (data) => {
        const result = data["93"] || data["None"] || Object.values(data)[0];

        if (result?.success) {
          const status = result.eligibility_status;
          const network = result.provider_network;

          setEligibilityResult({
            eligibility_status: status,
            provider_network: network,
          });

          if (status === "Active") {
            toaster.success({
              title: "Eligibility Verified",
              description: `${status} • ${network}`,
            });
          } else {
            setShowInactiveInsuranceDialog(true);
          }
        } else {
          setEligibilityResult({
            eligibility_status: "Unknown",
            provider_network: "Unknown",
          });
          setShowInactiveInsuranceDialog(true);
        }
      },
      onError: (error) => {
        setEligibilityResult(null);
        setShowInactiveInsuranceDialog(true);
      },
    });
  };

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

  const getPatientName = () => {
    const pt = patients.find(
      (p) => (p.patient_id || p.id) === newAppointment.patient
    );
    if (!pt) return "Unknown Patient";
    return (
      pt.patient_name || `${pt.first_name || ""} ${pt.last_name || ""}`.trim()
    );
  };

  const getLocationName = () => {
    const loc = dummyLocations.find((l) => l.id === newAppointment.location);
    return loc ? loc.name : "Not specified";
  };

  const getStatusLabel = () => {
    return (
      STATUS_OPTIONS.find((s) => s.value === newAppointment.confirmation_status)
        ?.label || "Unconfirmed"
    );
  };

  const timeOptions = useMemo(() => {
    // If we have dynamic schedule, generate from it
    if (newAppointment.location && providerSchedule[newAppointment.location]) {
        if (!newAppointment.date) return [];

        // Fix: Parse YYYY-MM-DD as local date to avoid timezone shifts
        let dateObj = new Date(newAppointment.date);
        if (typeof newAppointment.date === 'string' && newAppointment.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
            const [y, m, d] = newAppointment.date.split('-').map(Number);
            dateObj = new Date(y, m - 1, d);
        }

        const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
        console.log("Generating slots for:", dayName, newAppointment.location);

        const daySchedule = providerSchedule[newAppointment.location][dayName];
        console.log("Schedule:", daySchedule);

        if (!daySchedule || !daySchedule.enabled) return [];

        const slots = [];
        // Support both "ranges" array and legacy "start"/"end"
        let ranges = daySchedule.ranges || [];
        if (ranges.length === 0 && daySchedule.start && daySchedule.end) {
            ranges = [{ start: daySchedule.start, end: daySchedule.end }];
        }

        ranges.forEach(range => {
            if (!range.start || !range.end) return;
            const [startH, startM] = range.start.split(':').map(Number);
            const [endH, endM] = range.end.split(':').map(Number);
            
            let current = new Date();
            current.setHours(startH, startM, 0, 0);
            
            const endTime = new Date();
            endTime.setHours(endH, endM, 0, 0);

            // Generate slots every 30 mins
            while (current < endTime) {
                const h = current.getHours();
                const m = current.getMinutes();
                const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
                
                const displayH = h % 12 || 12;
                const period = h >= 12 ? "PM" : "AM";
                const displayTime = `${displayH}:${String(m).padStart(2, '0')} ${period}`;

                let isPast = false;
                if (newAppointment.date) {
                   // Compare with current time if today
                   const selectedDate = new Date(dateObj);
                   const nowTime = new Date();
                   const isToday = selectedDate.getDate() === nowTime.getDate() &&
                                   selectedDate.getMonth() === nowTime.getMonth() &&
                                   selectedDate.getFullYear() === nowTime.getFullYear();
                   if (isToday) {
                        const slotTime = new Date(nowTime);
                        slotTime.setHours(h, m, 0, 0);
                        if (slotTime < nowTime) isPast = true;
                   }
                }
                slots.push({ time24, displayTime, disabled: isPast });
                current.setMinutes(current.getMinutes() + 30);
            }
        });
        
        console.log("Generated slots count:", slots.length);
        return slots.sort((a,b) => a.time24.localeCompare(b.time24));
    } 

    // NO FALLBACK
    return [];
  }, [newAppointment.date, newAppointment.location, providerSchedule, now]);

  const maxAvailableDuration = useMemo(() => {
    if (!newAppointment.time || !newAppointment.date || !newAppointment.location || !providerSchedule[newAppointment.location]) {
      return null;
    }

    let dateObj = new Date(newAppointment.date);
    if (typeof newAppointment.date === 'string' && newAppointment.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
        const [y, m, d] = newAppointment.date.split('-').map(Number);
        dateObj = new Date(y, m - 1, d);
    }
    const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    const daySchedule = providerSchedule[newAppointment.location][dayName];

    if (!daySchedule || !daySchedule.enabled) return null;

    let ranges = daySchedule.ranges || [];
    if (ranges.length === 0 && daySchedule.start && daySchedule.end) {
        ranges = [{ start: daySchedule.start, end: daySchedule.end }];
    }

    const [selH, selM] = newAppointment.time.split(':').map(Number);
    const selectedMinutes = selH * 60 + selM;

    for (const range of ranges) {
      if (!range.start || !range.end) continue;
      const [startH, startM] = range.start.split(':').map(Number);
      const [endH, endM] = range.end.split(':').map(Number);
      
      const rangeStart = startH * 60 + startM;
      const rangeEnd = endH * 60 + endM;

      if (selectedMinutes >= rangeStart && selectedMinutes < rangeEnd) {
        return rangeEnd - selectedMinutes;
      }
    }
    
    return null;
  }, [newAppointment.time, newAppointment.date, newAppointment.location, providerSchedule]);

  // If selected duration exceeds available time, reset it
  useEffect(() => {
    if (maxAvailableDuration !== null) {
        let updates = {};

        // Check Duration
        if (parseInt(newAppointment.duration) > maxAvailableDuration) {
            const validDurations = [10, 15, 20, 30, 45, 60, 90, 120, 540].filter(d => d <= maxAvailableDuration);
            const bestFit = validDurations.length > 0 ? validDurations[validDurations.length - 1] : "30";
            updates.duration = bestFit.toString();
        }

        // Check Reason
        if (newAppointment.reason) {
            const reasonDur = parseInt(reasonDurationMap[newAppointment.reason] || "0");
            if (reasonDur > maxAvailableDuration) {
                updates.reason = "";
            }
        }

        if (Object.keys(updates).length > 0) {
            setNewAppointment(prev => ({ ...prev, ...updates }));
        }
    }
  }, [maxAvailableDuration, newAppointment.duration, newAppointment.reason, reasonDurationMap]);

  // Dynamic title and button text
  const pageTitle = isEditMode ? "Edit Appointment" : "Schedule New Appointment";
  const submitButtonText = isEditMode
    ? updateMutation.isPending
      ? "Updating..."
      : "Update Appointment"
    : createMutation.isPending
    ? "Scheduling..."
    : "Schedule Appointment";

  if (showPatientSearch) {
    return (
      <div className="w-full h-full relative">
        <button
          onClick={() => setShowPatientSearch(false)}
          className="absolute top-6 right-6 z-10 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
          style={{
            backgroundImage: lightGradient,
            backgroundColor: "rgba(85, 165, 220, 0.3)",
          }}
        >
          Close <X size={20} />
        </button>
        <PatientSearch onSelect={handlePatientSelect} />
      </div>
    );
  }

  if (showProviderSearch) {
    return (
      <div className="w-full h-full relative">
        <button
          onClick={() => setShowProviderSearch(false)}
          className="absolute top-6 right-6 z-10 px-6 py-2.5 rounded-lg text-white text-sm font-medium transition-all duration-200 hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
          style={{
            backgroundImage: lightGradient,
            backgroundColor: "rgba(85, 165, 220, 0.3)",
          }}
        >
          Close <X size={20} />
        </button>
        <ProviderSearch onSelect={handleProviderSelect} />
      </div>
    );
  }

  return (
    <>
      <div className="w-full h-full bg-[#0a2040] p-6 overflow-y-auto">
        <div className="mb-8 flex justify-between items-center">
          <h3 className="text-2xl text-white">{pageTitle}</h3>
          {newAppointment.patient && (
            <div className="flex flex-col items-end">
              <span className="text-xs text-[#808080] uppercase tracking-wider">Patient Balance</span>
              <span className={`text-xl font-bold ${ledgerBalance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {ledgerBalance >= 0 ? '' : ''}{ledgerBalance.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            {/* Patient */}
            <div>
              <label className="block text-sm font-medium text-[#d2d0d0] mb-3">
                Patient Name
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowPatientSearch(true)}
                  className="absolute left-0 top-0 h-full w-12 flex items-center justify-center border-r border-[#1e4270] text-[#808080] hover:text-cyan-500 transition-colors rounded-l-lg"
                >
                  <User size={18} />
                </button>
                <select
                  value={newAppointment.patient}
                  onChange={(e) =>
                    setNewAppointment((prev) => ({
                      ...prev,
                      patient: e.target.value,
                    }))
                  }
                  className="w-full pl-14 pr-4 py-3.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none appearance-none"
                  required
                >
                  <option value="">Select a patient</option>
                  {patients.map((p) => (
                    <option
                      key={p.patient_id || p.id}
                      value={p.patient_id || p.id}
                    >
                      {p.patient_name ||
                        `${p.first_name || ""} ${p.last_name || ""}`.trim()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Provider */}
            <div>
              <label className="block text-sm font-medium text-[#d2d0d0] mb-3">
                Provider
              </label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowProviderSearch(true)}
                  className="absolute left-0 top-0 h-full w-12 flex items-center justify-center border-r border-[#1e4270] text-[#808080] hover:text-cyan-500 transition-colors rounded-l-lg"
                >
                  <Stethoscope size={18} />
                </button>
                <select
                  value={newAppointment.provider}
                  onChange={(e) =>
                    setNewAppointment((prev) => ({
                      ...prev,
                      provider: e.target.value,
                      location: "", // Clear location so it resets based on new schedule
                    }))
                  }
                  className="w-full pl-14 pr-4 py-3.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none appearance-none"
                  required
                >
                  <option value="">Select a provider</option>
                  {providers.slice(1).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                      {p.specialty ? ` • ${p.specialty}` : ""}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-sm font-medium text-[#d2d0d0] mb-3">
                <Calendar size={16} className="inline mr-2" /> Date
              </label>

              <CustomDatePicker
                value={newAppointment.date}
                onValueChange={(date) =>
                  setNewAppointment((prev) => ({ ...prev, date }))
                }
                minDate={today}
                inputProps={{
                  className:
                    "w-full px-4 py-3.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-[#d2d0d0] focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none",
                  required: true,
                }}
                endElement={<Calendar1Icon className="text-gray-400" />}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-[#d2d0d0] mb-3">
                <MapPin size={16} className="inline mr-2" /> Location
              </label>
              <select
                value={newAppointment.location}
                onChange={(e) =>
                  setNewAppointment((prev) => ({
                    ...prev,
                    location: e.target.value,
                  }))
                }
                className="w-full px-4 py-3.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none"
                disabled={locationOptions.length === 0}
              >
                <option value="">Select location</option>
                {locationOptions.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
              {locationOptions.length === 0 && (
                <p className="text-xs text-amber-500 mt-2">
                  {!newAppointment.provider
                    ? "Please select a provider first."
                    : "No locations available for this provider."}
                </p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-[#d2d0d0] mb-3">
                <Clock size={16} className="inline mr-2" /> Time
              </label>
              <select
                value={newAppointment.time}
                onChange={(e) =>
                  setNewAppointment((prev) => ({
                    ...prev,
                    time: e.target.value,
                  }))
                }
                className="w-full px-4 py-3.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none"
                required
                disabled={timeOptions.length === 0}
              >
                <option value="">Select time</option>
                {timeOptions.map(({ time24, displayTime, disabled }) => (
                  <option key={time24} value={time24} disabled={disabled}>
                    {displayTime}
                  </option>
                ))}
              </select>
              <p className="text-xs text-amber-500 mt-2">
                {!newAppointment.provider
                  ? "Please select a provider first."
                  : !newAppointment.location
                  ? "Please select a location first."
                  : !newAppointment.date
                  ? "Please select a date to view available times."
                  : timeOptions.length === 0
                  ? "No available times for this date."
                  : ""}
              </p>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-sm font-medium text-[#d2d0d0] mb-3">
                Duration
              </label>
              <select
                value={newAppointment.duration}
                onChange={(e) =>
                  setNewAppointment((prev) => ({
                    ...prev,
                    duration: e.target.value,
                  }))
                }
                className="w-full px-4 py-3.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none"
                required
              >
                {[10, 15, 20, 30, 45, 60, 90, 120, 540]
                  .filter(m => maxAvailableDuration === null || m <= maxAvailableDuration)
                  .map((m) => (
                  <option key={m} value={m}>
                    {m} minutes
                  </option>
                ))}
              </select>
              {maxAvailableDuration !== null && maxAvailableDuration <= 30 && (
                <div className="flex items-center gap-2 mt-2 text-amber-500 text-xs font-medium">
                  <AlertCircle size={14} />
                  <span>Only {maxAvailableDuration} minutes remaining in this slot block.</span>
                </div>
              )}
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-[#d2d0d0] mb-3">
                Type
              </label>
              <div className="flex gap-20 py-3">
                {[
                  { value: "patient_appointment", label: "Patient" },
                  { value: "other_appointment", label: "Other" },
                  ...(fullProviderDetails?.telehealth === "True"
                    ? [{ value: "telehealth", label: "Telehealth" }]
                    : []),
                ].map((type) => (
                  <label
                    key={type.value}
                    className="flex items-center gap-2 cursor-pointer group"
                  >
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={newAppointment.type === type.value}
                      onChange={(e) =>
                        setNewAppointment((prev) => ({
                          ...prev,
                          type: e.target.value,
                        }))
                      }
                      className="peer appearance-none w-5 h-5 border-2 border-[#1e4270] rounded-full checked:border-cyan-500 checked:border-4"
                    />
                    <span className="text-white group-hover:text-cyan-500">
                      {type.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-[#d2d0d0] mb-3">
                <CheckCircle size={16} className="inline mr-2" /> Appointment
                Status
              </label>
              <select
                value={newAppointment.confirmation_status}
                onChange={(e) =>
                  setNewAppointment((prev) => ({
                    ...prev,
                    confirmation_status: e.target.value,
                  }))
                }
                className="w-full px-4 py-3.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason */}
            {(newAppointment.type === "patient_appointment" ||
              newAppointment.type === "telehealth") && (
              <div>
                <label className="block text-sm font-medium text-[#d2d0d0] mb-3">
                  <FileText size={16} className="inline mr-2" /> Reason
                </label>
                <select
                  value={newAppointment.reason}
                  onChange={handleReasonChange}
                  className="w-full px-4 py-3.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none"
                >
                  <option value="">Select reason</option>
                  {reasonOptions.map((r) => {
                    const rDur = parseInt(reasonDurationMap[r] || "0");
                    const isDisabled = maxAvailableDuration !== null && rDur > maxAvailableDuration;
                    return (
                        <option key={r} value={r} disabled={isDisabled} className={isDisabled ? "text-gray-500" : ""}>
                        {r} ({reasonDurationMap[r]} mins)
                        </option>
                    );
                  })}
                </select>
              </div>
            )}

            {/* === Payment Information Section === */}
            <div className="md:col-span-3">
              <div className="py-2">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-medium text-white">
                    Payment Information
                  </h4>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="selfPay"
                      checked={newAppointment.isSelfPay}
                      onChange={(e) =>
                        setNewAppointment((prev) => ({
                          ...prev,
                          isSelfPay: e.target.checked,
                        }))
                      }
                      className="w-5 h-5 rounded border-[#1e4270] text-cyan-500 focus:ring-cyan-500/30"
                    />
                    <label
                      htmlFor="selfPay"
                      className="text-sm font-medium text-[#d2d0d0] cursor-pointer select-none"
                    >
                      Self Pay Patient
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Co Pay */}
                  <div>
                    <label className="block text-sm font-medium text-[#d2d0d0] mb-2">
                      Co Pay
                    </label>
                    <CustomAmountInput
                      value={newAppointment.coPay}
                      onChange={(e) =>
                        setNewAppointment((prev) => ({
                          ...prev,
                          coPay: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className="w-full bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none"
                      height="50px"
                    />
                  </div>

                  {/* Deposit */}
                  <div>
                    <label className="block text-sm font-medium text-[#d2d0d0] mb-2">
                      Deposit
                    </label>
                    <CustomAmountInput
                      value={newAppointment.deposit}
                      onChange={(e) =>
                        setNewAppointment((prev) => ({
                          ...prev,
                          deposit: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className="w-full bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none"
                      height="50px"
                    />
                  </div>

                  {/* Self Pay Amount */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${newAppointment.isSelfPay ? 'text-[#d2d0d0]' : 'text-[#808080]'}`}>
                      Self Pay Amount
                    </label>
                    <CustomAmountInput
                      value={newAppointment.selfPayAmount}
                      onChange={(e) =>
                        setNewAppointment((prev) => ({
                          ...prev,
                          selfPayAmount: e.target.value,
                        }))
                      }
                      placeholder="0.00"
                      className={`w-full bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none ${!newAppointment.isSelfPay ? 'opacity-50 cursor-not-allowed' : ''}`}
                      height="50px"
                      disabled={!newAppointment.isSelfPay}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-[#d2d0d0] mb-3">
                <AlignLeft size={16} className="inline mr-2" /> Notes
              </label>
              <textarea
                value={newAppointment.notes}
                onChange={(e) =>
                  setNewAppointment((prev) => ({
                    ...prev,
                    notes: e.target.value,
                  }))
                }
                placeholder="Additional notes..."
                rows={3}
                className="w-full px-4 py-3.5 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/30 outline-none resize-none"
              />
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div className="mt-8">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="flex flex-wrap items-center gap-4">
                <CustomButton
                  variant="outline"
                  onClick={handleCheckEligibility}
                  disabled={
                    !newAppointment.patient ||
                    !newAppointment.provider ||
                    createMutation.isPending ||
                    updateMutation.isPending
                  }
                >
                  Check Eligibility
                </CustomButton>

                {eligibilityResult && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-[#afaeae] text-sm">Patient:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          eligibilityResult.eligibility_status === "Active"
                            ? "bg-green-900/30 text-green-300 border-green-600"
                            : eligibilityResult.eligibility_status ===
                              "Inactive"
                            ? "bg-red-900/30 text-red-300 border-red-600"
                            : "bg-yellow-900/30 text-yellow-300 border-yellow-600"
                        }`}
                      >
                        {eligibilityResult.eligibility_status}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[#afaeae] text-sm">Provider:</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                          eligibilityResult.provider_network === "In-Network"
                            ? "bg-emerald-900/30 text-emerald-300 border-emerald-600"
                            : eligibilityResult.provider_network ===
                              "Out-of-Network"
                            ? "bg-orange-900/30 text-orange-300 border-orange-600"
                            : "bg-gray-800/60 text-gray-400 border-gray-600"
                        }`}
                      >
                        {eligibilityResult.provider_network}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <CustomButton variant="outline" onClick={handleCancel}>
                  Cancel
                </CustomButton>
                <CustomButton
                  type="button"
                  variant="outline"
                  onClick={handleScheduleAndCollectPayment}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 min-w-[180px] border-cyan-500 text-cyan-500 hover:bg-cyan-500/10"
                >
                  Schedule & Collect Payment
                </CustomButton>
                <CustomButton
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  loading={createMutation.isPending || updateMutation.isPending}
                  className="px-6 py-2.5 min-w-[180px]"
                >
                  {submitButtonText}
                </CustomButton>
              </div>
            </div>
          </div>
        </form>
      </div>

      <AppointmentConfirmationModal
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmAndSubmit}
        appointment={newAppointment}
        patientName={getPatientName()}
        providerName={selectedProviderName}
        locationName={getLocationName()}
        statusLabel={getStatusLabel()}
        isLoading={createMutation.isPending || updateMutation.isPending}
        eligibilityResult={eligibilityResult}
      />

      <ConfirmationDialog
        open={showInactiveInsuranceDialog}
        onClose={setShowInactiveInsuranceDialog}
        onConfirm={handleSelfPayConfirm}
        title="Inactive Insurance"
        description="This patient has inactive insurance. Please enable self-pay."
      />
    </>
  );
};

export default CreateAppointment;

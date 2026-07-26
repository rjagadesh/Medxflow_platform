import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Plus,
  X,
  Clock,
  User,
  Stethoscope,
  Users,
  ChevronDown,
} from "lucide-react";
import { useGetAppointments } from "@/hooks/query/pms/pms_appointments/useGetAppointments";
import { useGetPatients } from "@/hooks/query/pms/pms_appointments/useGetPatients";
import { useGetMinimalProviders } from "@/hooks/query/pms/pms_appointments/useGetProviders";
import { useUpdateAppointment } from "@/hooks/mutation/pms/pms_appointments/useCreateAppointments";
import { useRunEligibilityCheck } from "@/hooks/mutation/pms/pms_appointments/useCreateAppointments";
import LeftPanel from "./platform-sub-components/left-panel";
import CalendarHeader from "./platform-sub-components/calendar-header";
import ProviderFilterBar from "./platform-sub-components/provider-filterbar";
import DayView from "./platform-sub-components/day-view";
import WeekView from "./platform-sub-components/week-view";
import MonthView from "./platform-sub-components/month-view";
import ProviderAvailabilityPanel from "./platform-sub-components/provider-availability";
import PatientDetailsPanel from "./platform-sub-components/patient-details-panel";
import AppointmentDetailsModal from "./platform-sub-components/appointment-details-modal";
import { useGetMinimalPatients } from "@/hooks/query/pms/patient/useGetMinimalPatients";
import { toaster } from "@/components/ui/toaster";

const PMSPlatform = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedProviders, setSelectedProviders] = useState(() => {
    try {
      const saved = sessionStorage.getItem("pms_selected_providers");
      return saved ? JSON.parse(saved) : ["all"];
    } catch (error) {
      console.error("Error reading from sessionStorage", error);
      return ["all"];
    }
  });
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "pms_selected_providers",
        JSON.stringify(selectedProviders)
      );
    } catch (error) {
      console.error("Error writing to sessionStorage", error);
    }
  }, [selectedProviders]);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSetSelectedProviders = (newSelection) => {
    const resolvedSelection =
      typeof newSelection === "function"
        ? newSelection(selectedProviders)
        : newSelection;

    if (resolvedSelection.length > 10 && !resolvedSelection.includes("all")) {
      setError("You can only select up to 10 providers.");
      return;
    }

    setSelectedProviders(resolvedSelection);
  };

  const [providerDropdownOpen, setProviderDropdownOpen] = useState(false);
  const [providerSearch, setProviderSearch] = useState("");

  // === URL Query Params Handling ===
  const urlView = searchParams.get("view");
  const urlCalendarView = searchParams.get("calendarView");
  const urlDate = searchParams.get("date");
  const urlTab = searchParams.get("tab");

  const [mainViewMode, setMainViewMode] = useState(() => {
    return urlView === "list" ? "list" : "calendar";
  });

  const [activeView, setActiveView] = useState(() => {
    if (mainViewMode === "list") return "day"; // irrelevant in list mode
    const view = urlCalendarView && ["day", "week", "month"].includes(urlCalendarView)
      ? urlCalendarView
      : sessionStorage.getItem("pms_active_view") || "day";
    return view;
  });

  const [currentDate, setCurrentDate] = useState(() => {
    if (urlDate) {
      const parsed = new Date(urlDate);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return new Date();
  });

  const [listViewTab, setListViewTab] = useState(() => {
    return urlTab && ["scheduled", "in_office", "finished"].includes(urlTab)
      ? urlTab
      : "scheduled";
  });

  // Sync all relevant state to URL
  useEffect(() => {
    const params = new URLSearchParams();

    params.set("view", mainViewMode === "list" ? "list" : "calendar");

    if (mainViewMode === "calendar") {
      params.set("calendarView", activeView);
    } else {
      params.set("tab", listViewTab);
    }

    params.set("date", formatLocalDate(currentDate));

    setSearchParams(params, { replace: true });
  }, [mainViewMode, activeView, currentDate, listViewTab, setSearchParams]);

  // Keep sessionStorage as fallback for activeView in calendar mode
  useEffect(() => {
    if (mainViewMode === "calendar") {
      try {
        sessionStorage.setItem("pms_active_view", activeView);
      } catch (error) {
        console.error("Error writing activeView to sessionStorage", error);
      }
    }
  }, [activeView, mainViewMode]);

  const [activeRightPanel, setActiveRightPanel] = useState("none");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [selectedAppointmentForPanel, setSelectedAppointmentForPanel] =
    useState(null);
  const [appointments, setAppointments] = useState([]);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const { mutate: updateAppointment } = useUpdateAppointment();
  const { mutate: runEligibilityCheck } = useRunEligibilityCheck();

  const timeScrollRef = useRef(null);
  const contentScrollRef = useRef(null);
  const providerDropdownRef = useRef(null);

  const toApiStatus = (displayStatus) => {
    if (!displayStatus) return "pending";
    return displayStatus.toLowerCase().replace(/ /g, "_");
  };

  const normalizeStatusForDisplay = (status) => {
    if (!status) return "Pending";
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const getDateRange = (view, date) => {
    let fromDate, toDate;
    if (view === "day") {
      fromDate = toDate = formatLocalDate(date);
    } else if (view === "week") {
      const start = new Date(date);
      start.setDate(date.getDate() - date.getDay());
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      fromDate = formatLocalDate(start);
      toDate = formatLocalDate(end);
    } else if (view === "month") {
      const start = new Date(date.getFullYear(), date.getMonth(), 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      fromDate = formatLocalDate(start);
      toDate = formatLocalDate(end);
    }
    return { fromDate, toDate };
  };

  const dateRange = getDateRange(activeView, currentDate);

  const { data: appointmentsData, isLoading: isAppointmentsLoading } =
    useGetAppointments(dateRange);
  const { data: patientsData, isLoading: patientsLoading } =
    useGetMinimalPatients();
  const { data: providersResponse, isLoading: providersLoading } =
    useGetMinimalProviders();
  const providersData = Array.isArray(providersResponse)
    ? providersResponse
    : [];
  const providers = useMemo(
    () => [
      { id: "all", name: "All Providers", avatar: "" },
      ...providersData.map((provider) => ({
        id: provider.provider_id || provider.id,
        name:
          provider.provider_name ||
          `${provider.first_name || ""} ${provider.last_name || ""}`.trim() ||
          `Provider ${provider.provider_id || provider.id}`,
        specialty: provider.specialty || "",
        avatar: provider.avatar || "",
      })),
    ],
    [providersData]
  );

  const mapAppointment = (apt) => {
    const timeWithoutSeconds = apt.time
      ? apt.time.split(":").slice(0, 2).join(":")
      : "";
    return {
      id: apt.id,
      patient: apt.patient_name || apt.patient || "",
      patient_id: apt.patient || apt.patient_id || apt.patientId,
      provider: apt.provider_name || apt.provider || "",
      provider_id: apt.provider || apt.provider_id || apt.providerId,
      date: apt.date,
      time: timeWithoutSeconds,
      hour: parseInt(timeWithoutSeconds?.split(":")[0]) || 0,
      minute: parseInt(timeWithoutSeconds?.split(":")[1] || "0") || 0,
      displayTime: convert24to12(timeWithoutSeconds),
      duration: parseInt(apt.duration) || 30,
      type: apt.type,
      location: apt.location,
      reason: apt.reason,
      notes: apt.notes,
      confirmation_status:
        apt.confirmation_status || apt.confirmationstatus || "pending",
      created_at: apt.created_at,
      eligibility_status_detail: apt.eligibility_status_detail,
      provider_network_detail: apt.provider_network_detail,
      eligibility_last_checked_detail: apt.eligibility_last_checked_detail,

      self_pay: apt.self_pay || false,
      copay_amt: apt.copay_amt || "0.00",
      deposite_amt: apt.deposite_amt || "0.00",
      self_amt: apt.self_amt || "0.00",
    };
  };

  useEffect(() => {
    if (appointmentsData) {
      setAppointments(appointmentsData.map(mapAppointment));
    }
  }, [appointmentsData]);

  const defaultGradient = "var(--bg-blue-gradient2)";
  const defaultBorderColor = "rgba(59, 130, 246, 0.8)";
  const lightGradient = "var(--bg-blue-gradient2)";
  const calendarGradient =
    "linear-gradient(90deg, rgba(0,0,0,0.20) 0%, rgba(0,0,0,0.12) 20%, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0.02) 100%, rgba(0,60,82,1) 70%, rgba(0,128,162,1) 100%)";

  const businessTimeSlots = Array.from({ length: 32 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8;
    const minute = (i % 2) * 30;
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    const timeStr = `${displayHour}:${minute === 0 ? "00" : "30"} ${period}`;
    return {
      hour,
      minute,
      label: timeStr,
      time: `${hour.toString().padStart(2, "0")}:${minute
        .toString()
        .padStart(2, "0")}`,
    };
  });

  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate);
    if (activeView === "day") {
      newDate.setDate(newDate.getDate() + direction);
    } else if (activeView === "week") {
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentDate(newDate);
  };

  const formatDate = () => {
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const convert24to12 = (time24) => {
    if (!time24) return "";
    const [hourStr, minStr] = time24.split(":");
    const hour = parseInt(hourStr);
    const minute = parseInt(minStr);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const handleDoubleClickTimeSlot = (
    slot,
    date = currentDate,
    prefilledProvider = ""
  ) => {
    const dateStr = formatLocalDate(date);

    let providerToUse = prefilledProvider;
    if (
      !providerToUse &&
      selectedProviders.length === 1 &&
      selectedProviders[0] !== "all"
    ) {
      providerToUse = selectedProviders[0];
    }

    navigate("/pms/home/appointment/create", {
      state: {
        date: dateStr,
        time: slot.time,
        provider: providerToUse,
      },
    });
  };

  const handleAppointmentClick = (apt) => {
    setSelectedAppointment(apt);
  };

  const handleAppointmentUpdate = (updatedApt) => {
    setAppointments((prev) =>
      prev.map((a) => (a.id === updatedApt.id ? { ...a, ...updatedApt } : a))
    );
    if (selectedAppointment && selectedAppointment.id === updatedApt.id) {
      setSelectedAppointment((prev) => ({ ...prev, ...updatedApt }));
    }
  };

  const getStatusColor = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "confirmed") return "text-green-400";
    if (s === "cancelled") return "text-red-400";
    if (s === "pending") return "text-yellow-400";
    if (s === "completed" || s === "checked_out") return "text-gray-400";
    if (s === "no_show") return "text-red-500";
    if (s === "rescheduled") return "text-orange-400";
    if (
      s === "arrived" ||
      s === "in_session" ||
      s === "checked_in" ||
      s === "roomed" ||
      s === "in_progress"
    )
      return "text-blue-400";
    if (s === "unconfirmed" || s === "scheduled" || s === "reminder_sent")
      return "text-purple-400";
    return "text-gray-400";
  };

  const calculateAge = (dobString) => {
    if (!dobString) return "N/A";
    const dob = new Date(dobString);
    const diff_ms = Date.now() - dob.getTime();
    const age_dt = new Date(diff_ms);
    return Math.abs(age_dt.getUTCFullYear() - 1970);
  };

  const calculateEndTime = (startTime, duration = 30) => {
    if (!startTime) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    date.setMinutes(date.getMinutes() + duration);

    const endHours = date.getHours();
    const endMinutes = date.getMinutes();
    const period = endHours >= 12 ? "PM" : "AM";
    const displayHour = endHours % 12 || 12;
    return `${displayHour}:${endMinutes.toString().padStart(2, "0")} ${period}`;
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        providerDropdownRef.current &&
        !providerDropdownRef.current.contains(event.target)
      ) {
        setProviderDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const slotHeight = 60;

  const colorStyles = `
    :root {
      --color-droidal-blue-400: #4f8fce;
      --color-droidal-black-100: #2b5187;
      --color-droidal-black-200: #1e4270;
      --color-droidal-black-300: #16375e;
      --color-droidal-black-400: #0d2b52;
      --color-droidal-black-500: #0b2547;
      --color-droidal-black-600: #0a2040;
      --color-droidal-black-700: #081a35;
      --color-droidal-black-800: #07152b;
      --color-droidal-black-900: #051021;
    }
    
    .scrollbar-thin {
      scrollbar-width: thin;
    }
    
    .scrollbar-thin::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    
    .scrollbar-thin::-webkit-scrollbar-track {
      background: #0d2b52;
      border-radius: 4px;
    }
    
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: rgba(85, 165, 220, 0.5);
      border-radius: 4px;
    }
    
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background: rgba(59, 130, 246, 0.7);
    }

    .time-column {
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .time-column::-webkit-scrollbar { 
      width: 0; 
      height: 0; 
      display: none;
    }
  `;

  const STATUS_DISPLAY_OPTIONS = [
    "Unconfirmed",
    "Scheduled",
    "Reminder Sent",
    "Pending",
    "Confirmed",
    "Arrived",
    "Checked In",
    "In Progress",
    "Roomed",
    "In Session",
    "Checked Out",
    "Completed",
    "No Show",
    "Rescheduled",
    "Cancelled",
  ];

  // Helper to format last eligibility check
  const formatLastChecked = (dateStr) => {
    if (!dateStr) return "Never";
    const date = new Date(dateStr);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <>
      <style>{colorStyles}</style>

      <div className="flex gap-2 relative">
        {error && (
          <div
            style={{
              position: "fixed",
              top: "20px",
              right: "20px",
              backgroundColor: "#dc3545",
              color: "#fff",
              padding: "15px 20px",
              borderRadius: "5px",
              boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
              zIndex: 9999,
            }}
          >
            {error}
          </div>
        )}

        <div className="hidden lg:block">
          <LeftPanel
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            lightGradient={lightGradient}
            providers={providers}
            selectedProviders={selectedProviders}
            setSelectedProviders={handleSetSelectedProviders}
            providerSearch={providerSearch}
            setProviderSearch={setProviderSearch}
            mainViewMode={mainViewMode}
            setMainViewMode={setMainViewMode}
          />
        </div>

        <div className="flex-1 lg:ml-0 transition-all duration-300">
          <div className="flex gap-0">
            <div className="flex-1">
              <div
                className={`bg-[#16375e] ${
                  activeRightPanel !== "none"
                    ? "rounded-l-2xl rounded-r-none"
                    : "rounded-2xl"
                } p-4.5 shadow-xl border border-[#1e4270] hover:shadow-2xl transition-all duration-300 h-[calc(90vh-40px)] relative flex flex-col`}
              >
                {activeRightPanel === "none" && (
                  <button
                    onClick={() => setActiveRightPanel("provider")}
                    className="absolute -right-10 top-0 z-10 flex flex-col items-center justify-center gap-2 px-2 h-20 rounded-r-2xl shadow-lg transition-all duration-300 hover:shadow-xl"
                    style={{
                      backgroundImage: lightGradient,
                      backgroundColor: "rgba(85, 165, 220, 0.3)",
                      writingMode: "vertical-rl",
                      textOrientation: "mixed",
                    }}
                  >
                    <ChevronLeft
                      size={16}
                      className="text-white"
                      style={{ transform: "rotate(180deg)" }}
                    />
                    <span className="text-white font-medium text-xs">
                      Provider
                    </span>
                  </button>
                )}

                {mainViewMode === "calendar" ? (
                  <CalendarHeader
                    currentDate={currentDate}
                    formatDate={formatDate}
                    navigateDate={navigateDate}
                    activeView={activeView}
                    setActiveView={setActiveView}
                    lightGradient={lightGradient}
                    setCurrentDate={setCurrentDate}
                  />
                ) : (
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
                    <div className="flex flex-col">
                      <h1 className="text-2xl text-white">Appointment List</h1>
                      <p className="text-[#808080]">{formatDate()}</p>
                    </div>

                    <div className="flex border border-[#1e4270] rounded-lg overflow-hidden">
                      {[
                        { id: "scheduled", label: "Scheduled" },
                        { id: "in_office", label: "In Office" },
                        { id: "finished", label: "Finished" },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setListViewTab(tab.id)}
                          className={`px-4 py-2 border-r border-[#1e4270] last:border-r-0 transition-all duration-200 ${
                            listViewTab === tab.id
                              ? "text-white shadow-inner"
                              : "bg-[#0d2b52] text-white hover:bg-[#1e4270]"
                          }`}
                          style={{
                            border:
                              listViewTab === tab.id ? lightGradient : "none",
                            backgroundColor:
                              listViewTab === tab.id
                                ? "rgba(85, 165, 220, 0.2)"
                                : "transparent",
                          }}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <ProviderFilterBar
                  providers={providers}
                  selectedProviders={selectedProviders}
                  setSelectedProviders={setSelectedProviders}
                  setShowAppointmentModal={() =>
                    navigate("/pms/home/appointment/create")
                  }
                  lightGradient={lightGradient}
                  mainViewMode={mainViewMode}
                  onRunEligibilityCheck={() => {
                    const scheduledAppointments = appointments.filter((apt) => {
                      let providerMatch = false;
                      if (selectedProviders.includes("all")) {
                        providerMatch = true;
                      } else if (selectedProviders.length === 0) {
                        providerMatch = false;
                      } else {
                        if (
                          apt.provider_id &&
                          selectedProviders.includes(apt.provider_id)
                        ) {
                          providerMatch = true;
                        } else {
                          const providerObj = providers.find(
                            (p) => p.name === apt.provider
                          );
                          providerMatch =
                            providerObj &&
                            selectedProviders.includes(providerObj.id);
                        }
                      }
                      if (!providerMatch) return false;

                      const status = (
                        apt.confirmation_status || "pending"
                      ).toLowerCase();
                      return [
                        "unconfirmed",
                        "scheduled",
                        "reminder_sent",
                        "pending",
                        "confirmed",
                      ].includes(status);
                    });

                    const appointmentIds = scheduledAppointments.map(
                      (apt) => apt.id
                    );

                    const payload = { appointment_ids: appointmentIds };

                    console.log(
                      "Running eligibility check ONLY for Scheduled appointments:",
                      payload
                    );

                    if (appointmentIds.length === 0) {
                      toaster.create({
                        title: "No Eligible Appointments",
                        description:
                          "There are no scheduled appointments to check eligibility for.",
                        type: "warning",
                      });
                      return;
                    }

                    toaster.create({
                      title: "Eligibility Check Started",
                      description: `Processing eligibility for ${appointmentIds.length} scheduled appointment(s)...`,
                      type: "info",
                      duration: 6000,
                    });

                    runEligibilityCheck(payload, {
                      onSuccess: () => {
                        toaster.create({
                          title: "Eligibility Check Completed",
                          description:
                            "All selected appointments have been processed.",
                          type: "success",
                        });
                      },
                      onError: () => {
                        toaster.create({
                          title: "Eligibility Check Failed",
                          description:
                            "Something went wrong. Please try again.",
                          type: "error",
                        });
                      },
                    });
                  }}
                />

                <div className="mt-6 flex-1 min-h-0">
                  {mainViewMode === "calendar" ? (
                    <>
                      {activeView === "day" && (
                        <DayView
                          appointments={appointments}
                          currentDate={currentDate}
                          selectedProviders={selectedProviders}
                          providers={providers}
                          businessTimeSlots={businessTimeSlots}
                          slotHeight={slotHeight}
                          calendarGradient={calendarGradient}
                          defaultBorderColor={defaultBorderColor}
                          handleDoubleClickTimeSlot={handleDoubleClickTimeSlot}
                          onAppointmentClick={handleAppointmentClick}
                          timeScrollRef={timeScrollRef}
                          contentScrollRef={contentScrollRef}
                          convert24to12={convert24to12}
                        />
                      )}
                      {activeView === "week" && (
                        <WeekView
                          appointments={appointments}
                          currentDate={currentDate}
                          selectedProviders={selectedProviders}
                          providers={providers}
                          businessTimeSlots={businessTimeSlots}
                          calendarGradient={calendarGradient}
                          weekDays={weekDays}
                          onAppointmentClick={handleAppointmentClick}
                          handleDoubleClickTimeSlot={handleDoubleClickTimeSlot}
                          slotHeight={slotHeight}
                          setActiveView={setActiveView}
                          setCurrentDate={setCurrentDate}
                        />
                      )}
                      {activeView === "month" && (
                        <MonthView
                          currentDate={currentDate}
                          appointments={appointments}
                          selectedProviders={selectedProviders}
                          providers={providers}
                          calendarGradient={calendarGradient}
                          weekDays={weekDays}
                          setCurrentDate={setCurrentDate}
                          setActiveView={setActiveView}
                        />
                      )}
                    </>
                  ) : (
                    <div className="h-full overflow-y-auto scrollbar-thin p-1">
                      {isAppointmentsLoading ? (
                        <div className="flex flex-col gap-3">
                          {[1, 2, 3, 4].map((i) => (
                            <div
                              key={i}
                              className="bg-[#0d2b52] border border-[#1e4270] rounded-xl p-4 animate-pulse"
                            >
                              <div className="flex justify-between items-center">
                                <div className="flex flex-col gap-3 flex-1">
                                  <div className="h-6 bg-[#1e4270] rounded w-56"></div>
                                  <div className="flex items-center gap-4">
                                    <div className="h-4 bg-[#1e4270] rounded w-36"></div>
                                    <div className="h-4 bg-[#1e4270] rounded w-28"></div>
                                    <div className="h-4 bg-[#1e4270] rounded w-32"></div>
                                  </div>
                                  <div className="flex items-center gap-3 flex-wrap">
                                    <div className="h-5 bg-[#1e4270] rounded w-40"></div>
                                    <div className="h-5 bg-[#1e4270] rounded w-48"></div>
                                    <div className="h-5 bg-[#1e4270] rounded w-44"></div>
                                  </div>
                                </div>
                                <div className="h-10 w-36 bg-[#1e4270] rounded-lg"></div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : appointments.filter((apt) => {
                          let providerMatch = false;
                          if (selectedProviders.includes("all")) {
                            providerMatch = true;
                          } else if (selectedProviders.length === 0) {
                            providerMatch = false;
                          } else {
                            if (
                              apt.provider_id &&
                              selectedProviders.includes(apt.provider_id)
                            ) {
                              providerMatch = true;
                            } else {
                              const providerObj = providers.find(
                                (p) => p.name === apt.provider
                              );
                              providerMatch =
                                providerObj &&
                                selectedProviders.includes(providerObj.id);
                            }
                          }
                          if (!providerMatch) return false;

                          const status = (
                            apt.confirmation_status || "pending"
                          ).toLowerCase();
                          if (listViewTab === "scheduled") {
                            return [
                              "unconfirmed",
                              "scheduled",
                              "reminder_sent",
                              "pending",
                              "confirmed",
                            ].includes(status);
                          }
                          if (listViewTab === "in_office") {
                            return [
                              "arrived",
                              "checked_in",
                              "in_progress",
                              "roomed",
                              "in_session",
                            ].includes(status);
                          }
                          if (listViewTab === "finished") {
                            return [
                              "checked_out",
                              "completed",
                              "no_show",
                              "rescheduled",
                              "cancelled",
                            ].includes(status);
                          }
                          return true;
                        }).length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {appointments
                            .filter((apt) => {
                              let providerMatch = false;
                              if (selectedProviders.includes("all")) {
                                providerMatch = true;
                              } else if (selectedProviders.length === 0) {
                                providerMatch = false;
                              } else {
                                if (
                                  apt.provider_id &&
                                  selectedProviders.includes(apt.provider_id)
                                ) {
                                  providerMatch = true;
                                } else {
                                  const providerObj = providers.find(
                                    (p) => p.name === apt.provider
                                  );
                                  providerMatch =
                                    providerObj &&
                                    selectedProviders.includes(providerObj.id);
                                }
                              }
                              if (!providerMatch) return false;

                              const status = (
                                apt.confirmation_status || "pending"
                              ).toLowerCase();
                              if (listViewTab === "scheduled") {
                                return [
                                  "unconfirmed",
                                  "scheduled",
                                  "reminder_sent",
                                  "pending",
                                  "confirmed",
                                ].includes(status);
                              }
                              if (listViewTab === "in_office") {
                                return [
                                  "arrived",
                                  "checked_in",
                                  "in_progress",
                                  "roomed",
                                  "in_session",
                                ].includes(status);
                              }
                              if (listViewTab === "finished") {
                                return [
                                  "checked_out",
                                  "completed",
                                  "no_show",
                                  "rescheduled",
                                  "cancelled",
                                ].includes(status);
                              }
                              return true;
                            })
                            .map((apt) => {
                              const patient =
                                patientsData?.find(
                                  (p) =>
                                    p.id === apt.patient_id ||
                                    `${p.first_name} ${p.last_name}` ===
                                      apt.patient
                                ) || {};

                              const dob = patient.dob
                                ? new Date(patient.dob).toLocaleDateString()
                                : "N/A";
                              const age = patient.dob
                                ? calculateAge(patient.dob)
                                : "N/A";
                              const gender = patient.gender || "N/A";

                              // New fields
                              const isEligibilityNone = (value) =>
                                value === null ||
                                value === undefined ||
                                value === "None" ||
                                value === "";

                              const patientStatus = isEligibilityNone(
                                apt.eligibility_status_detail
                              )
                                ? "Not Checked"
                                : apt.eligibility_status_detail;

                              const networkStatus = isEligibilityNone(
                                apt.provider_network_detail
                              )
                                ? "Not Checked"
                                : apt.provider_network_detail;

                              const lastEligibilityCheck = isEligibilityNone(
                                apt.eligibility_last_checked_detail
                              )
                                ? null
                                : apt.eligibility_last_checked_detail;

                              const endTime = calculateEndTime(
                                apt.time,
                                apt.duration
                              );

                              const displayStatus = normalizeStatusForDisplay(
                                apt.confirmation_status
                              );

                              // Badge styles
                              const getPatientStatusClass = (status) => {
                                switch ((status || "").toLowerCase()) {
                                  case "active":
                                    return "text-green-400 bg-green-900/30";
                                  case "inactive":
                                    return "text-red-400 bg-red-900/30";
                                  default:
                                    return "text-gray-400 bg-gray-800/50";
                                }
                              };

                              const getNetworkClass = (status) => {
                                switch ((status || "").toLowerCase()) {
                                  case "in network":
                                    return "text-emerald-400 bg-emerald-900/30";
                                  case "out of network":
                                    return "text-orange-400 bg-orange-900/30";
                                  default:
                                    return "text-gray-500 bg-gray-800/50";
                                }
                              };

                              return (
                                <div
                                  key={apt.id}
                                  className="bg-[#0d2b52] border border-[#1e4270] rounded-xl p-4 flex justify-between items-center hover:border-[#4f8fce] transition-all cursor-pointer group"
                                  onClick={() => {
                                    setSelectedAppointmentId(apt.id);
                                    setSelectedAppointmentForPanel(apt);
                                    setActiveRightPanel("patient");
                                  }}
                                >
                                  <div className="flex flex-col gap-2.5 flex-1">
                                    {/* Patient Name */}
                                    <div
                                      className="text-white font-medium text-lg hover:text-[#4f8fce] transition-colors cursor-pointer w-fit"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (apt.patient_id) {
                                          navigate(
                                            `/pms/home/patients/${apt.patient_id}`
                                          );
                                        }
                                      }}
                                    >
                                      {apt.patient}
                                    </div>

                                    {/* DOB, Age, Gender + Active Status */}
                                    <div className="text-[#afaeae] text-[15px] flex items-center gap-2 flex-wrap">
                                      <span>DOB: {dob}</span>
                                      <span className="w-1 h-1 rounded-full bg-[#2b5187]" />
                                      <span>Age: {age} y/o</span>
                                      <span className="w-1 h-1 rounded-full bg-[#2b5187]" />
                                      <span>Gender: {gender}</span>
                                      <span className="w-1 h-1 rounded-full bg-[#2b5187]" />
                                      <span
                                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${getPatientStatusClass(
                                          patientStatus
                                        )}`}
                                      >
                                        {patientStatus}
                                      </span>
                                    </div>

                                    {/* Time, Reason, Location, Provider + Network */}
                                    <div className="text-[#afaeae] text-[15px] flex items-center gap-2 flex-wrap">
                                      <span className="text-[#4f8fce] font-medium">
                                        {apt.displayTime} - {endTime}
                                      </span>
                                      <span className="text-[#2b5187]">|</span>
                                      <span className="capitalize">
                                        {apt.reason || "Check-up"}
                                      </span>
                                      <span className="text-[#2b5187]">|</span>
                                      <span className="capitalize">
                                        {apt.location || "Office"}
                                      </span>
                                      <span className="text-[#2b5187]">|</span>
                                      <span>{apt.provider}</span>
                                      <span
                                        className={`ml-2 px-2.5 py-1 rounded-full text-xs font-medium ${getNetworkClass(
                                          networkStatus
                                        )}`}
                                      >
                                        {networkStatus}
                                      </span>
                                    </div>

                                    {/* Last Eligibility Check */}
                                    <div className="text-[#808080] text-xs">
                                      Last checked:{" "}
                                      {formatLastChecked(lastEligibilityCheck)}
                                    </div>
                                  </div>

                                  {/* Status Dropdown */}
                                  <div
                                    className="relative"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <select
                                      className={`appearance-none bg-[#1e4270] text-sm font-medium pl-3 pr-9 py-2 rounded-lg border border-[#2b5187] focus:outline-none focus:border-[#4f8fce] cursor-pointer ${getStatusColor(
                                        apt.confirmation_status
                                      )}`}
                                      value={displayStatus}
                                      onChange={(e) => {
                                        const newDisplayStatus = e.target.value;
                                        const newApiStatus =
                                          toApiStatus(newDisplayStatus);

                                        setAppointments((prev) =>
                                          prev.map((a) =>
                                            a.id === apt.id
                                              ? {
                                                  ...a,
                                                  confirmation_status:
                                                    newApiStatus,
                                                }
                                              : a
                                          )
                                        );

                                        updateAppointment(
                                          {
                                            id: apt.id,
                                            appointmentData: {
                                              confirmationstatus: newApiStatus,
                                            },
                                          },
                                          {
                                            onError: () => {
                                              setAppointments((prev) =>
                                                prev.map((a) =>
                                                  a.id === apt.id
                                                    ? {
                                                        ...a,
                                                        confirmation_status:
                                                          apt.confirmation_status,
                                                      }
                                                    : a
                                                )
                                              );
                                              toaster.create({
                                                title: "Update Failed",
                                                description:
                                                  "Failed to update appointment status. Please try again.",
                                                type: "error",
                                              });
                                            },
                                            onSuccess: (data) => {
                                              if (data?.appointment) {
                                                const updatedApt =
                                                  mapAppointment(
                                                    data.appointment
                                                  );
                                                setAppointments((prev) =>
                                                  prev.map((a) =>
                                                    a.id === apt.id
                                                      ? updatedApt
                                                      : a
                                                  )
                                                );
                                                toaster.create({
                                                  title: "Status Updated",
                                                  description: `Appointment status changed to ${newDisplayStatus}`,
                                                  type: "success",
                                                });
                                              }
                                            },
                                          }
                                        );
                                      }}
                                    >
                                      {STATUS_DISPLAY_OPTIONS.map((status) => (
                                        <option key={status} value={status}>
                                          {status}
                                        </option>
                                      ))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#808080]">
                                      <ChevronDown size={14} />
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <div className="h-full flex flex-col items-center justify-center text-[#808080] gap-4">
                          <div className="p-4 rounded-full bg-[#1e4270]">
                            <Calendar size={32} />
                          </div>
                          <p className="text-lg font-medium">
                            No appointments found
                          </p>
                          <p className="text-sm opacity-60">
                            Try selecting a different date or provider
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <ProviderAvailabilityPanel
              providers={providers}
              lightGradient={lightGradient}
              isOpen={activeRightPanel === "provider"}
              currentDate={currentDate}
              onClose={() => setActiveRightPanel("none")}
            />
            <PatientDetailsPanel
              appointment={
                selectedAppointmentId
                  ? appointments.find((a) => a.id === selectedAppointmentId) ||
                    selectedAppointmentForPanel
                  : selectedAppointmentForPanel
              }
              fallbackAppointment={selectedAppointmentForPanel}
              lightGradient={lightGradient}
              isOpen={activeRightPanel === "patient"}
              onClose={() => {
                setActiveRightPanel("none");
                setSelectedAppointmentId(null);
                setSelectedAppointmentForPanel(null);
              }}
            />
          </div>
        </div>

        <AppointmentDetailsModal
          isOpen={!!selectedAppointment}
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onUpdate={handleAppointmentUpdate}
        />
      </div>
    </>
  );
};

export default PMSPlatform;

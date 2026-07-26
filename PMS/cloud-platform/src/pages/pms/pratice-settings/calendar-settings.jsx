import React, { useState, useEffect } from "react";
import {
  Globe,
  Clock,
  Users,
  DoorOpen,
  Monitor,
  UserPlus,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { Tabs } from "@chakra-ui/react";
import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useNavigate } from "react-router-dom";
import CustomButton from "/src/components/button/button";
import { toaster } from "@/components/ui/toaster";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";

/* ---------------- LEFT NAV ITEMS ---------------- */
const navItems = [
  "General",
  "Scheduling Resources",
  "Office Hours",
  "Schedules",
  "Time Off & Holidays",
  "Online Scheduling",
];

/* ---------------- DAYS ---------------- */
const days = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
];

const TABS = ["Rooms", "Equipment", "Staff"];

const dayLabels = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
};

const formatTime = (time) => {
  if (!time) return "--";
  return time.slice(0, 5); // "18:24:00" → "18:24"
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
};

const formatHolidayDate = (dateStr) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
};



const CalendarSettings = () => {
  const [active, setActive] = useState("General");
  const [timezone, setTimezone] = useState("Asia/Kolkata");
  const [increment, setIncrement] = useState("15");
  const [groupAppointments, setGroupAppointments] = useState(false);
  const [loading, setLoading] = useState(false);
  const [settingsId, setSettingsId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [settingsList, setSettingsList] = useState([]);
  const [editingSetting, setEditingSetting] = useState(null);
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [activeTab, setActiveTab] = useState("Rooms");
  const ITEMS_PER_PAGE = 10;
  const [page, setPage] = useState(1);
  const [resourceTab, setResourceTab] = useState("rooms");

  // Scheduling Resources state
  const [rooms, setRooms] = useState([]);
  const [equipments, setEquipments] = useState([]);
  const [staffs, setStaffs] = useState([]); // For Scheduling Resources tab
  const [staffSchedules, setStaffSchedules] = useState([]); // For Office Hours tab

  // Time Off & Holidays state
  const [timeOffs, setTimeOffs] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [providerSchedules, setProviderSchedules] = useState([]);

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState(""); // "room", "equipment", "staff", "timeoff", "holiday"
  const [newName, setNewName] = useState("");
  const [newStaffId, setNewStaffId] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newEndDate, setNewEndDate] = useState("");
  const [newHolidayName, setNewHolidayName] = useState("");
  const [newHolidayDate, setNewHolidayDate] = useState("");
  const [modalLoading, setModalLoading] = useState(false);

  const navigate = useNavigate();

  /* ---------------- FETCH FUNCTIONS ---------------- */
  const fetchRooms = async () => {
    try {
      const res = await apiRequest(apiRoutes.room.get);
      setRooms(res?.rooms || res || []);
    } catch (err) {
      console.error("Fetch rooms error:", err);
    }
  };

  const fetchProviders = async () => {
    try {
      const res = await apiRequest(apiRoutes.provider.get);
      const data = res?.data ?? res;

      setProviders(data?.results || []); // ✅ FIX
    } catch (err) {
      console.error("Fetch providers error:", err);
    }
  };


  const fetchPatientProviders = async () => {
    try {
      const res = await apiRequest(apiRoutes.provider.get);
      console.log("Providers response:", res);
      setProviderSchedules(res?.results || res || []);
    } catch (err) {
      console.error("Fetch providers error:", err);
    }
  };

  const fetchEquipments = async () => {
    try {
      const res = await apiRequest(apiRoutes.equipments.get);
      console.log("Equipments response:", res);
      setEquipments(res?.equipment || res || []);
    } catch (err) {
      console.error("Fetch equipments error:", err);
    }
  };

  const fetchStaffs = async () => {
    try {
      const res = await apiRequest(apiRoutes.staffscheduling.get);
      setStaffs(res?.staff_schedules || res || []);
    } catch (err) {
      console.error("Fetch staff error:", err);
    }
  };

  const fetchStaffSchedules = async () => {
    try {
      const res = await apiRequest(apiRoutes.staffscheduling.get);
      console.log("Staff schedules response:", res);
      setStaffSchedules(res?.staff_schedules || res || []);
    } catch (err) {
      console.error("Fetch staff schedules error:", err);
    }
  };

  const fetchTimeOffs = async () => {
    try {
      const res = await apiRequest(apiRoutes.timeoff.get);
      console.log("Time offs response:", res);
      setTimeOffs(res?.time_offs || res || []);
    } catch (err) {
      console.error("Fetch time offs error:", err);
    }
  };

  const fetchHolidays = async () => {
    try {
      const res = await apiRequest(apiRoutes.holiday.get);
      console.log("Holidays response:", res);
      setHolidays(res?.holidays || res || []);
    } catch (err) {
      console.error("Fetch holidays error:", err);
    }
  };

  const fetchCalendarSettings = async () => {
  try {
    setLoading(true);
    const response = await apiRequest(apiRoutes.calendersettings.get);
    const data = response?.data ?? response;
    setSettingsList(data?.settings || []);
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  setPage(1);
}, [resourceTab]);

const paginate = (data) => {
  const start = (page - 1) * ITEMS_PER_PAGE;
  return data.slice(start, start + ITEMS_PER_PAGE);
};

const totalPages = (data) =>
  Math.ceil(data.length / ITEMS_PER_PAGE);
  /* ---------------- CREATE / DELETE FUNCTIONS ---------------- */
  const handleCreate = async () => {
    setModalLoading(true);

    try {
      let route;
      let payload;

      if (modalType === "room") {
        if (!newName.trim()) {
          toaster.error({
                  title: "Name is required",
                  description: ""
                })
          return;
        }
        route = apiRoutes.room.create;
        payload = { name: newName.trim() };
      } else if (modalType === "equipment") {
        if (!newName.trim()) {
          toaster.error({
                  title: "Name is required",
                  description: ""
                })
          return;
        }

        route = apiRoutes.equipments.create;
        payload = { name: newName.trim() };
      } else if (modalType === "staff") {
        if (!newName.trim()) {
          toaster.error({
                  title: "Name is required",
                  description: ""
                })
          return;
        }
        route = apiRoutes.staffscheduling.create;
        payload = {
          staff_name: newName.trim(),
          daily_schedules: [], // Required by backend
        };
      } else if (modalType === "timeoff") {
        if (!newStaffId || !newTitle.trim() || !newStartDate || !newEndDate) {
          alert("All fields are required");
          return;
        }
        route = apiRoutes.timeoff.create;
        payload = {
          staff: newStaffId,
          reason: newTitle.trim(),
          start_datetime: newStartDate,
          end_datetime: newEndDate,
        };
      } else if (modalType === "holiday") {
        if (!newHolidayName.trim() || !newHolidayDate) {
          alert("All fields are required");
          return;
        }
        route = apiRoutes.holiday.create;
        payload = {
          name: newHolidayName.trim(),
          date: newHolidayDate,
        };
      }

      await apiRequest(route, {
        payload: payload,
      });

      toaster.success({
                  title: `${modalType.charAt(0).toUpperCase() + modalType.slice(1)} created successfully`,
                  description: ""
                })

      // Refresh lists
      if (modalType === "room") fetchRooms();
      if (modalType === "equipment") fetchEquipments();
      if (modalType === "staff") {
        await fetchStaffs();
        await fetchStaffSchedules();
      }
      if (modalType === "timeoff") fetchTimeOffs();
      if (modalType === "holiday") fetchHolidays();

      closeModal();

      // Redirect after staff creation (matches your reference modal)
      if (modalType === "staff") {
        navigate("/pms/platform-settings/calendar-settings");
      }
    } catch (err) {
      console.error("Create error:", err);

      let errorMessage = "Failed to create.";

      if (err?.response?.data) {
        const data = err.response.data;
        if (data.name) {
          errorMessage = Array.isArray(data.name) ? data.name.join(" ") : data.name;
        } else if (data.staff_name) {
          errorMessage = Array.isArray(data.staff_name)
            ? data.staff_name.join(" ")
            : data.staff_name;
        } else if (data.detail) {
          errorMessage = data.detail;
        } else if (typeof data === "string") {
          errorMessage = data;
        } else {
          const firstField = Object.values(data)[0];
          errorMessage = Array.isArray(firstField) ? firstField[0] : String(firstField);
        }
      }

      alert(errorMessage);
    } finally {
      setModalLoading(false);
    }
  };
  
  const handlecalenderDelete = async (id) => {
    if (!window.confirm("Delete this calendar setting?")) return;

    try {
      await apiRequest(apiRoutes.calendersettings.delete, { metadata: { id } });
      fetchCalendarSettings();
    } catch (err) {
      console.error(err);
    }
  };


  const handleDelete = async (id, type) => {

    try {
      let route;
      if (type === "room") route = apiRoutes.room.delete;
      if (type === "equipment") route = apiRoutes.equipments.delete;
      if (type === "staff") route = apiRoutes.staffscheduling.delete;

      await apiRequest(route, { metadata: { id } });

      if (type === "room") {
        setRooms(rooms.filter((r) => r.id !== id));
        fetchRooms();
      }
      if (type === "equipment") {
        setEquipments(equipments.filter((e) => e.id !== id));
        fetchEquipments();
      }
      if (type === "staff") {
        setStaffs(staffs.filter((s) => s.id !== id));
        setStaffSchedules(staffSchedules.filter((s) => s.id !== id));
      }

      toaster.success({
                  title: "Deleted Successfully",
                  description: ""
                })
    } catch (err) {
      console.error("Delete error:", err);
      alert("Delete failed");
    }
  };

  const handleDeleteTimeOff = async (id) => {
    if (!window.confirm("Delete this time off?")) return;

    try {
      await apiRequest(apiRoutes.timeoff.delete, {
        metadata: { id },

      });
      setTimeOffs(timeOffs.filter((t) => t.id !== id));
      alert("Deleted successfully");
    } catch (err) {
      console.error("Delete time off error:", err);
      alert("Delete failed");
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Delete this holiday?")) return;

    try {
      await apiRequest(apiRoutes.holiday.delete,
        { metadata: { id } }
      );
      setHolidays(holidays.filter((h) => h.id !== id));
      alert("Deleted successfully");
    } catch (err) {
      console.error("Delete holiday error:", err);
      alert("Delete failed");
    }
  };
  
  useEffect(() => {
    fetchProviders();
  }, []);

  useEffect(() => {
  fetchPatientProviders();
}, []);

  const openModal = (type) => {
    setModalType(type);
    setNewName("");
    setNewStaffId("");
    setNewTitle("");
    setNewStartDate("");
    setNewEndDate("");
    setNewHolidayName("");
    setNewHolidayDate("");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalType("");
    setNewName("");
    setNewStaffId("");
    setNewTitle("");
    setNewStartDate("");
    setNewEndDate("");
    setNewHolidayName("");
    setNewHolidayDate("");
  };

  /* ---------------- SAVE GENERAL SETTINGS ---------------- */
  const handleEdit = (setting) => {
      setEditingSetting(setting);
      setSelectedProvider(setting.patient_provider); // 🔥 critical
      setTimezone(setting.timezone);
      setIncrement(String(setting.calendar_increment));
      setGroupAppointments(setting.group_appointments);
      setShowForm(true);
    };

  const handleAdd = () => {
      setEditingSetting(null);
      setSelectedProvider("");
      setTimezone("Asia/Kolkata");
      setIncrement("15");
      setGroupAppointments(false);
      setShowForm(true);
    };


  

 const saveCalendarSettings = async () => {
  console.log("Selected provider BEFORE save:", selectedProvider);
  console.log("Type:", typeof selectedProvider);

  if (!selectedProvider) {
    alert("Please select a provider");
    return;
  }


  try {
    setLoading(true);

    const payload = {
      patient_provider: Number(selectedProvider), // 🔥 required
      timezone,
      calendar_increment: Number(increment),
      group_appointments: groupAppointments,
    };


    if (editingSetting) {
      await apiRequest(apiRoutes.calendersettings.update, {
        metadata: { id: editingSetting.id },
        payload: payload,
      });
    } else {
      await apiRequest(apiRoutes.calendersettings.create, {
        payload: payload,
      });
    }

    setShowForm(false);
    setEditingSetting(null);
    fetchCalendarSettings();
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(false);
  }
};



  /* ---------------- EFFECTS ---------------- */
  useEffect(() => {

    fetchCalendarSettings();
  }, []);
  
  
  
  useEffect(() => {
    if (active === "Scheduling Resources") {
      fetchRooms();
      fetchEquipments();
      fetchStaffs();
    }
    if (active === "Office Hours") {
      fetchStaffSchedules();
    }
    if (active === "Time Off & Holidays") {
      fetchStaffs();
      fetchTimeOffs();
      fetchHolidays();
    }
  }, [active]);

  return (
    <div style={styles.page}>
      {/* ================= LEFT SIDEBAR ================= */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarTitle}>CALENDAR SETTINGS</div>
        {navItems.map((item) => (
          <div
            key={item}
            onClick={() => setActive(item)}
            style={{
              ...styles.navItem,
              ...(active === item ? styles.navItemActive : {}),
            }}
          >
            {item}
          </div>
        ))}
      </div>

      {/* ================= RIGHT CONTENT ================= */}
      <div style={styles.content}>
        <div style={styles.pageTitle}>{active}</div>

        {/* ================= GENERAL ================= */}
        {active === "General" && !showForm && (
  <div style={styles.card}>
    {/* HEADER */}
    <div style={styles.headerRow}>
      <h3>General List</h3>
      <CustomButton onClick={handleAdd}>+ Add</CustomButton>
    </div>

    {/* LIST */}
    {settingsList.length === 0 ? (
      <div style={styles.empty}>No settings found</div>
    ) : (
      settingsList.map((item) => (
        <div key={item.id} style={styles.listRow}>
          {/* LEFT */}
          <div style={styles.providerRow}>
            <img
              src={item.patient_provider_profile}
              alt="Provider"
              style={styles.avatar}
              onError={(e) => (e.target.style.display = "none")}
            />

            <div>
              <strong>{item.patient_provider_name}</strong>
              <div style={styles.subText}>
                {item.timezone} · {item.calendar_increment} min ·{" "}
                {item.group_appointments ? "Group Enabled" : "Single Only"}
              </div>
            </div>
          </div>

          {/* ACTIONS */}
          <div style={styles.actions}>
            <button onClick={() => handleEdit(item)}>Edit</button>
            <button onClick={() => handlecalenderDelete(item.id)}>Delete</button>
          </div>
        </div>
      ))
    )}
  </div>
)}

       {active === "General" && showForm && (
  <div style={styles.formOverlay}>
    <div style={styles.formModal}>
      {/* Header */}
      <div style={styles.formHeader}>
        <h3 style={styles.formTitle}>
          {editingSetting ? "Edit Calendar Settings" : "New Calendar Settings"}
        </h3>
        <button 
          onClick={() => setShowForm(false)} 
          style={styles.closeButton}
          aria-label="Close"
        >
          ×
        </button>
      </div>

      {/* Form Content */}
      <div style={styles.formContent}>
        {/* Provider Selection */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Provider <span style={styles.required}>*</span>
          </label>
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            style={styles.select}
          >
            <option value="">Select a provider</option>
            {providers.map((provider) => (
              <option key={provider.id} value={provider.id}>
                {provider.first_name} {provider.last_name}
              </option>
            ))}
          </select>
        </div>

        {/* Timezone */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Time Zone <span style={styles.required}>*</span>
          </label>
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            style={styles.select}
          >
            <option value="Asia/Kolkata">India Standard Time (IST)</option>
            <option value="UTC">Coordinated Universal Time (UTC)</option>
          </select>
        </div>

        {/* Calendar Increment */}
        <div style={styles.formGroup}>
          <label style={styles.label}>
            Calendar Increment <span style={styles.required}>*</span>
          </label>
          <div style={styles.radioGroup}>
            {['5', '10', '15', '30'].map((value) => (
              <label 
                key={value} 
                style={{
                  ...styles.radioLabel,
                  ...(increment === value ? styles.radioLabelActive : {})
                }}
              >
                <input
                  type="radio"
                  name="increment"
                  value={value}
                  checked={increment === value}
                  onChange={(e) => setIncrement(e.target.value)}
                  style={styles.radio}
                />
                <span style={styles.radioText}>{value} min</span>
              </label>
            ))}
          </div>
        </div>

        {/* Group Appointments Toggle */}
        <div style={styles.formGroup}>
          <label style={styles.toggleLabel}>
            <input
              type="checkbox"
              checked={groupAppointments}
              onChange={(e) => setGroupAppointments(e.target.checked)}
              style={styles.checkbox}
            />
            <span style={styles.toggleText}>
              <strong style={styles.toggleTitle}>Group Appointments</strong>
              <small style={styles.helpText}>
                Combine consecutive appointments from the same provider
              </small>
            </span>
          </label>
        </div>
      </div>

      {/* Footer Actions */}
      <div style={styles.formFooter}>
        <CustomButton 
          onClick={() => setShowForm(false)}
          style={styles.cancelButton}
        >
          Cancel
        </CustomButton>
        <CustomButton 
          onClick={saveCalendarSettings} 
          disabled={loading || !selectedProvider}
          style={{
            ...styles.saveButton,
            ...(loading || !selectedProvider ? styles.saveButtonDisabled : {})
          }}
        >
          {loading ? (
            <span style={styles.loadingText}>
              <span style={styles.spinner}>⏳</span> Saving...
            </span>
          ) : (
            editingSetting ? "Update" : "Save"
          )}
        </CustomButton>
      </div>
    </div>
  </div>
)}


        {/* ================= SCHEDULING RESOURCES ================= */}
  {active === "Scheduling Resources" && (
  <div style={styles.card}>

     <Tabs.Root value={resourceTab} onValueChange={(e) => setResourceTab(e.value)} variant="line" flex="1">
          <Tabs.List bg="droidalBlack.300" px={4} borderBottom="1px solid #2f4d78">
            <Tabs.Trigger value="rooms" _selected={{ color: "#00BBF2" }}>Rooms</Tabs.Trigger>
            <Tabs.Trigger value="equipment" _selected={{ color: "#00BBF2" }}>Equipments</Tabs.Trigger>
            <Tabs.Trigger value="staff" _selected={{ color: "#00BBF2" }}>Staffs</Tabs.Trigger>
          </Tabs.List>

          <Tabs.Content value="rooms" p={2} flex="1" overflowY="auto">

          </Tabs.Content>

          <Tabs.Content value="equipment" p={2} flex="1" overflowY="auto">
          </Tabs.Content>

          <Tabs.Content value="staff" p={2} flex="1" overflowY="auto">
          </Tabs.Content>
        </Tabs.Root>

    {/* ROOMS */}
    {resourceTab === "rooms" && (
      <div style={styles.section}>
        <div style={styles.rowBetween}>
          <div style={styles.sectionHeader}>Rooms</div>
          <CustomButton mb={3} onClick={() => openModal("room")}>
            Create room
          </CustomButton>
        </div>

        {rooms.map((room) => (
          <div key={room.id} style={styles.resourceItem}>
            <span>{room.name}</span>
             <ConfirmationDialog
                          title="Confirmation"
                          description="Are you sure you want to delete?"
                          onConfirm={() => handleDelete(room.id, "room")}
                          buttonName={<Trash2 />}
                          buttonProps={{
                            variant: "danger",
                            size: "xs",
                          }}
                        />
          </div>
          
        ))}
        
      </div>
    )}

    {/* EQUIPMENT */}
    {resourceTab === "equipment" && (
      <div style={styles.section}>
        <div style={styles.rowBetween}>
          <div style={styles.sectionHeader}>Equipment</div>
          <CustomButton mb={3} onClick={() => openModal("equipment")}>
            Create equipment
          </CustomButton>
        </div>

        {equipments.map((eq) => (
          <div key={eq.id} style={styles.resourceItem}>
            <span>{eq.name}</span>
            <ConfirmationDialog
                          title="Confirmation"
                          description="Are you sure you want to delete?"
                          onConfirm={() => handleDelete(eq.id, "equipment")}
                          buttonName={<Trash2 />}
                          buttonProps={{
                            variant: "danger",
                            size: "xs",
                          }}
/>
          </div>
        ))}
      </div>
    )}

    {/* STAFF */}
    {resourceTab === "staff" && (
      <div style={styles.section}>
        <div style={styles.rowBetween}>
          <div style={styles.sectionHeader}>Staff</div>
          <CustomButton mb={3} onClick={() => openModal("staff")}>
            Create staff
          </CustomButton>
        </div>

        {staffs.map((staff) => (
          <div key={staff.id} style={styles.resourceItem}>
            <span>{staff.staff_name}</span>
            <ConfirmationDialog
                          title="Confirmation"
                          description="Are you sure you want to delete?"
                          onConfirm={() => handleDelete(staff.id, "staff")}
                          buttonName={<Trash2 />}
                          buttonProps={{
                            variant: "danger",
                            size: "xs",
                          }}
                          />
          </div>
        ))}
      </div>
    )}

  </div>
)}


        {/* ================= OFFICE HOURS ================= */}
        {active === "Office Hours" && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div style={styles.sectionHeader}>
                <Clock size={16} style={{ color: "#9ca3af" }} />
                Office Hours
              </div>
              <span
                style={styles.linkText}
                onClick={() => openModal("staff")}
              >
                Add staff name
              </span>
            </div>
            {staffSchedules.length === 0 && (
              <div style={styles.emptyState}>No staff added yet</div>
            )}
            <div style={styles.cardsGrid}>
             {staffSchedules.map((staff) => {
  const scheduleMap = {};

  staff.daily_schedules?.forEach((d) => {
    scheduleMap[d.day] = d;
  });

  return (
    <div key={staff.id} style={styles.officeCard}>
      <div style={styles.officeHeader}>
        <span style={styles.cardTitle}>{staff.staff_name}</span>
        <span
          style={styles.editLink}
          onClick={() => navigate(`/pms/staff/${staff.id}`)}
        >
          Edit
        </span>
      </div>
      
      <div style={styles.daysColumn}>
        {days.map((day) => {
          const dayData = scheduleMap[day];

          return (
            <div key={day} style={styles.dayRow}>
              <span style={styles.dayLabel}>
                {dayLabels[day]}
              </span>
                        <span style={styles.dayCenter}>-</span>
              
              <span style={styles.dayCenter}>
                {dayData ? (
                  <>
                    {formatTime(dayData.work_start_time)} –{" "}
                    {formatTime(dayData.work_end_time)}
                  </>
                ) : (
                  <span style={{ color: "#6b7280" }}>Off</span>
                )}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
})}

            </div>
          </>
        )}

        {/* ================= TIME OFF & HOLIDAYS ================= */}
        {active === "Time Off & Holidays" && (
          <div style={styles.card}>
            {/* STAFF TIME OFF */}
            <div style={styles.section}>
              <div style={styles.rowBetween}>
                <div style={styles.sectionHeader}>
                  <Users size={16} style={{ color: "#9ca3af" }} /> Staff Time Off
                </div>
                <span style={styles.linkText} onClick={() => openModal("timeoff")}>
                  New Time Off Event
                </span>
              </div>
              {timeOffs.length === 0 ? (
                <div style={styles.emptyState}>No staff time off events</div>
              ) : (
                timeOffs.map((item) => (
                  <div key={item.id} style={styles.timeRow}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.timePrimary}>
                        {item.staff} – {item.reason}
                      </div>
                      <div style={styles.timeSecondary}>
                        {formatDate(item.start_datetime)} - {formatDate(item.end_datetime)}
                      </div>
                    </div>
                    <Trash2
                      size={16}
                      style={{ cursor: "pointer", color: "#ef4444" }}
                      onClick={() => handleDeleteTimeOff(item.id)}
                    />
                  </div>
                ))
              )}
            </div>

            {/* PRACTICE HOLIDAYS */}
            <div style={styles.section}>
              <div style={styles.rowBetween}>
                <div style={styles.sectionHeader}>
                  <DoorOpen size={16} style={{ color: "#9ca3af" }} /> Practice Holidays
                </div>
                <span style={styles.linkText} onClick={() => openModal("holiday")}>
                  New Custom Holiday
                </span>
              </div>
              {holidays.length === 0 ? (
                <div style={styles.emptyState}>No holidays defined</div>
              ) : (
                holidays.map((holiday) => (
                  <div key={holiday.id} style={styles.timeRow}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.timePrimary}>{holiday.name}</div>
                      <div style={styles.timeSecondary}>
                        {formatHolidayDate(holiday.date)}
                      </div>
                    </div>
                    <Trash2
                      size={16}
                      style={{ cursor: "pointer", color: "#ef4444" }}
                      onClick={() => handleDeleteHoliday(holiday.id)}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ================= SCHEDULES ================= */}
        {active === "Schedules" && (
  <div style={styles.card}>
    <div style={styles.section}>
      <div style={styles.sectionHeader}>
        <Clock size={16} style={{ color: "#9ca3af" }} /> Provider Schedules
      </div>
      {providerSchedules.length === 0 ? (
        <div style={styles.emptyState}>No provider schedules</div>
      ) : (
        providerSchedules.map((provider) => (
          <div
            key={provider.id}
            style={{
              ...styles.scheduleRow,
              cursor: "pointer",
              padding: "10px",
              borderBottom: "1px solid #eee",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#2f4d78"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
            onClick={() => navigate(`/pms/provider-schedule/${provider.id}`)}
          >
            {provider.first_name} {provider.last_name}
          </div>
        ))
      )}
    </div>
  </div>
)}

        {/* ================= ONLINE SCHEDULING ================= */}
        {active === "Online Scheduling" && (
          <div style={styles.card}>
            {/* Service locations / office hours */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <Globe size={16} style={{ color: "#9ca3af" }} />
                Service locations or office hours
              </div>
              <div style={{ marginBottom: "12px", color: "#9ca3af", fontSize: "14px" }}>
                Availability based on:
              </div>
              <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="radio" name="availability" defaultChecked />
                  Provider office hours
                </label>
              </div>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", color: "#9ca3af" }}>
                  <input type="radio" name="availability" disabled />
                  Service location hours (coming soon)
                </label>
              </div>
              <div style={styles.helper}>
                The following providers have online scheduling enabled in their provider
                profile. Additional providers can be enabled by visiting each provider's
                profile page and enabling online scheduling.{" "}
                <span style={styles.linkText}>Learn more</span>
              </div>
            </div>

            {/* Providers */}
            <div style={styles.section}>
              <div style={styles.sectionHeader}>
                <Users size={16} style={{ color: "#9ca3af" }} /> Providers
              </div>
              {["Kathy Heav", "Alyssa Domingos", "Michael Thompson", "Sophia Martinez"].map(
                (name) => (
                  <div
                    key={name}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "12px 16px",
                      backgroundColor: "#1a1a1a",
                      border: "1px solid #404040",
                      borderRadius: "6px",
                      marginBottom: "8px",
                      fontSize: "14px",
                    }}
                  >
                    <span>{name}</span>
                    <span style={styles.linkText}>Share link</span>
                  </div>
                )
              )}
            </div>

            {/* Practice URL */}
            <div style={{ ...styles.section, borderBottom: "none", paddingBottom: 0 }}>
              <div style={styles.sectionHeader}>
                <Globe size={16} style={{ color: "#9ca3af" }} /> Practice URL
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <input type="radio" defaultChecked />
                  Enable online scheduling
                </label>
              </div>
              <div style={styles.helper}>
                Each URL can contain letters, numbers, or hyphens (e.g.
                https://practice.kareo.com/sample-practice-1) up to a maximum of
                64 characters.
              </div>
              <div
                style={{
                  marginTop: "12px",
                  padding: "12px 16px",
                  backgroundColor: "#1a1a1a",
                  border: "1px solid #404040",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              >
                https://practice.kareo.com/aplaceofhealing
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {isModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h3>
                {modalType === "staff"
                  ? "Add Staff Name"
                  : modalType === "timeoff"
                  ? "Create New Time Off Event"
                  : modalType === "holiday"
                  ? "Create New Holiday"
                  : `Create New ${modalType.charAt(0).toUpperCase() + modalType.slice(1)}`}
              </h3>
              <X size={20} style={{ cursor: "pointer" }} onClick={closeModal} />
            </div>
            <div style={styles.modalBody}>
              {["room", "equipment", "staff"].includes(modalType) && (
                <>
                  <label style={styles.label}>
                    {modalType === "staff" ? "Staff Name" : "Name"}
                  </label>
                  <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder={
                      modalType === "staff" ? "Enter staff name" : `Enter ${modalType} name`
                    }
                    style={styles.input}
                    autoFocus
                  />
                </>
              )}
              {modalType === "timeoff" && (
                <>
                  <label style={styles.label}>Staff</label>
                  <select
                    value={newStaffId}
                    onChange={(e) => setNewStaffId(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">Select staff</option>
                    {staffs.map((staff) => (
                      <option key={staff.id} value={staff.id}>
                        {staff.staff_name}
                      </option>
                    ))}
                  </select>
                  <label style={styles.label}>Title</label>
                  <input
                    type="text"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="Enter title"
                    style={styles.input}
                  />
                  <label style={styles.label}>Start Date</label>
                  <input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    style={styles.input}
                  />
                  <label style={styles.label}>End Date</label>
                  <input
                    type="date"
                    value={newEndDate}
                    onChange={(e) => setNewEndDate(e.target.value)}
                    style={styles.input}
                  />
                </>
              )}
              {modalType === "holiday" && (
                <>
                  <label style={styles.label}>Name</label>
                  <input
                    type="text"
                    value={newHolidayName}
                    onChange={(e) => setNewHolidayName(e.target.value)}
                    placeholder="Enter holiday name"
                    style={styles.input}
                    autoFocus
                  />
                  <label style={styles.label}>Date</label>
                  <input
                    type="date"
                    value={newHolidayDate}
                    onChange={(e) => setNewHolidayDate(e.target.value)}
                    style={styles.input}
                  />
                </>
              )}
            </div>
            <div style={styles.modalFooter}>
              <CustomButton onClick={closeModal} style={styles.btnSecondary}>
                Cancel
              </CustomButton>
              <CustomButton
                onClick={handleCreate}
                disabled={modalLoading}
                style={{
                  ...styles.btnPrimary,
                  opacity: modalLoading ? 0.6 : 1,
                }}
              >
                {modalLoading ? "Creating..." : modalType === "staff" ? "Save" : "Create"}
              </CustomButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarSettings;

/* ---------------- ALL STYLES ---------------- */
const styles = {
  page: {
    display: "flex",
    height: "100vh",
    backgroundColor: "#1a1a1a",
    color: "#ffffff",
  },
  sidebar: {
    width: "260px",
    backgroundColor: "#2d2d2d",
    borderRight: "1px solid #404040",
    padding: "16px",
  },
  sidebarTitle: {
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "16px",
    fontWeight: 600,
    letterSpacing: "0.1em",
  },
  navItem: {
    padding: "10px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    color: "#9ca3af",
    marginBottom: "4px",
    fontSize: "14px",
    transition: "all 0.2s ease",
  },
  navItemActive: {
    backgroundColor: "#404040",
    color: "#ffffff",
  },
  content: {
    flex: 1,
    padding: "24px",
    overflowY: "auto",
    backgroundColor: "#1a1a1a",
  },
  pageTitle: {
    fontSize: "14px",
    fontWeight: 600,
    marginBottom: "16px",
    color: "#ffffff",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  card: {
    backgroundColor: "#2d2d2d",
    borderRadius: "8px",
    padding: "24px",
    maxWidth: "900px",
  },
  section: {
    marginBottom: "28px",
    paddingBottom: "28px",
    borderBottom: "1px solid #404040",
  },
  sectionHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontSize: "12px",
    fontWeight: 600,
    marginBottom: "12px",
    color: "#ffffff",
    letterSpacing: "0.1em",
    textTransform: "uppercase",
  },
  rowBetween: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  linkText: {
    fontSize: "13px",
    color: "#3b82f6",
    cursor: "pointer",
    transition: "color 0.2s ease",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#d1d5db",
  },
  select: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#1f2937",
    color: "#ffffff",
    border: "1px solid #374151",
    borderRadius: "6px",
    fontSize: "14px",
    cursor: "pointer",
    outline: "none",
  },
  helper: {
    fontSize: "12px",
    color: "#9ca3af",
    marginTop: "6px",
    lineHeight: "1.5",
  },
  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    cursor: "pointer",
  },
  emptyState: {
    padding: "16px",
    backgroundColor: "#1a1a1a",
    borderRadius: "6px",
    fontSize: "14px",
    color: "#9ca3af",
    textAlign: "center",
  },
  resourceItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 16px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #404040",
    borderRadius: "6px",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#ffffff",
  },
  cardsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "16px",
    maxWidth: "1100px",
  },
  officeCard: {
    backgroundColor: "#2d2d2d",
    borderRadius: "8px",
    padding: "16px",
  },
  officeHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
    paddingBottom: "12px",
    borderBottom: "1px solid #404040",
  },
  cardTitle: {
    fontSize: "14px",
    fontWeight: 600,
    color: "#ffffff",
  },
  editLink: {
    fontSize: "13px",
    color: "#3b82f6",
    cursor: "pointer",
  },
  daysColumn: {
    display: "flex",
    flexDirection: "column",
    gap: "6px",
  },
  dayRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "8px 0",
    borderBottom: "1px solid #404040",
  },
  dayLabel: {
    color: "#9ca3af",
    fontSize: "13px",
  },
  dayCenter: {
    color: "#9ca3af",
    fontSize: "13px",
    textAlign: "center",
    flex: 1,
  },
  timeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "12px 0",
    borderBottom: "1px solid #404040",
  },
  timePrimary: {
    fontSize: "14px",
    fontWeight: 500,
    color: "#ffffff",
  },
  timeSecondary: {
    fontSize: "13px",
    color: "#9ca3af",
  },
  scheduleRow: {
    padding: "12px 16px",
    backgroundColor: "#1a1a1a",
    border: "1px solid #404040",
    borderRadius: "6px",
    marginBottom: "8px",
    fontSize: "14px",
    color: "#ffffff",
  },
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  modal: {
    backgroundColor: "#2d2d2d",
    borderRadius: "8px",
    width: "400px",
    maxWidth: "90%",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
  },
  modalHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "16px 20px",
    borderBottom: "1px solid #404040",
  },
  modalBody: {
    padding: "20px",
  },
  modalFooter: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    padding: "16px 20px",
    borderTop: "1px solid #404040",
  },
  input: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#1f2937",
    color: "#ffffff",
    border: "1px solid #374151",
    borderRadius: "6px",
    fontSize: "14px",
    outline: "none",
    marginBottom: "16px",
  },
  btnPrimary: {
    padding: "8px 16px",
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  btnSecondary: {
    padding: "8px 16px",
    backgroundColor: "#404040",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
  },
  headerRow: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
},

listRow: {
  display: "flex",
  justifyContent: "space-between",
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
},

actions: {
  display: "flex",
  gap: "10px",
},

subText: {
  fontSize: "12px",
  color: "#6b7280",
},

empty: {
  padding: "20px",
  textAlign: "center",
  color: "#9ca3af",
},
// Modal Overlay & Container
formOverlay: {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.75)',
  backdropFilter: 'blur(4px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
  padding: '20px',
  animation: 'fadeIn 0.2s ease-out',
},
formModal: {
  backgroundColor: '#1a1d29',
  borderRadius: '16px',
  width: '100%',
  maxWidth: '540px',
  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
  maxHeight: '90vh',
  display: 'flex',
  flexDirection: 'column',
  border: '1px solid rgba(255, 255, 255, 0.08)',
},

// Header
formHeader: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '24px 24px 20px',
  borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
  background: 'linear-gradient(to bottom, rgba(255, 255, 255, 0.02), transparent)',
},
formTitle: {
  margin: 0,
  fontSize: '20px',
  fontWeight: '600',
  color: '#f9fafb',
  letterSpacing: '-0.01em',
},
closeButton: {
  background: 'rgba(255, 255, 255, 0.05)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  fontSize: '24px',
  color: '#9ca3af',
  cursor: 'pointer',
  padding: '0',
  width: '32px',
  height: '32px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  fontWeight: '300',
},

// Form Content
formContent: {
  padding: '24px',
  overflowY: 'auto',
  flex: 1,
},
formGroup: {
  marginBottom: '24px',
},
label: {
  display: 'block',
  fontSize: '14px',
  fontWeight: '500',
  color: '#d1d5db',
  marginBottom: '10px',
  letterSpacing: '0.01em',
},
required: {
  color: '#f87171',
  marginLeft: '2px',
},
select: {
  width: '100%',
  padding: '12px 14px',
  fontSize: '14px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '10px',
  backgroundColor: '#0f1117',
  color: '#f9fafb',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
  backgroundPosition: 'right 10px center',
  backgroundRepeat: 'no-repeat',
  backgroundSize: '20px',
  appearance: 'none',
},

// Radio Group
radioGroup: {
  display: 'grid',
  gridTemplateColumns: 'repeat(4, 1fr)',
  gap: '10px',
},
radioLabel: {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 16px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: '10px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  backgroundColor: '#0f1117',
  position: 'relative',
},
radioLabelActive: {
  backgroundColor: 'rgba(59, 130, 246, 0.15)',
  borderColor: '#3b82f6',
  boxShadow: '0 0 0 3px rgba(59, 130, 246, 0.1)',
},
radio: {
  position: 'absolute',
  opacity: 0,
  cursor: 'pointer',
},
radioText: {
  fontSize: '14px',
  color: '#e5e7eb',
  fontWeight: '500',
},

// Toggle/Checkbox
toggleLabel: {
  display: 'flex',
  alignItems: 'flex-start',
  cursor: 'pointer',
  padding: '16px',
  backgroundColor: 'rgba(255, 255, 255, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: '10px',
  transition: 'all 0.2s ease',
},
checkbox: {
  marginRight: '12px',
  marginTop: '2px',
  cursor: 'pointer',
  width: '18px',
  height: '18px',
  accentColor: '#3b82f6',
},
toggleText: {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  flex: 1,
},
toggleTitle: {
  fontSize: '14px',
  color: '#f9fafb',
  fontWeight: '500',
},
helpText: {
  fontSize: '13px',
  color: '#9ca3af',
  fontWeight: '400',
  lineHeight: '1.5',
},

// Footer
formFooter: {
  display: 'flex',
  gap: '12px',
  padding: '20px 24px',
  borderTop: '1px solid rgba(255, 255, 255, 0.08)',
  justifyContent: 'flex-end',
  background: 'linear-gradient(to top, rgba(255, 255, 255, 0.02), transparent)',
},
cancelButton: {
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  color: '#e5e7eb',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '10px 20px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
},
saveButton: {
  backgroundColor: '#3b82f6',
  color: '#ffffff',
  border: 'none',
  padding: '10px 24px',
  borderRadius: '8px',
  cursor: 'pointer',
  fontSize: '14px',
  fontWeight: '500',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
},
saveButtonDisabled: {
  backgroundColor: 'rgba(59, 130, 246, 0.3)',
  cursor: 'not-allowed',
  boxShadow: 'none',
},
loadingText: {
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
},
spinner: {
  display: 'inline-block',
  animation: 'spin 1s linear infinite',
},
tabs: {
  display: "flex",
  gap: "10px",
  marginBottom: "16px",
},

tab: {
  padding: "6px 12px",
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer",
  borderRadius: "6px",
},

activeTab: {
  padding: "6px 12px",
  background: "#2563eb",
  color: "#fff",
  borderRadius: "6px",
  cursor: "pointer",
},

pagination: {
  display: "flex",
  justifyContent: "center",
  gap: "12px",
  marginTop: "12px",
},

};
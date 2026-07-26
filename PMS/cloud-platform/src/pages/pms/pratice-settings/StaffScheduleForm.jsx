import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import apiRequest from "@/services/api-request";
import { apiRoutes } from "@/services/api";
import { Clock, Coffee, CalendarDays, User } from "lucide-react";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

const emptyDay = (day) => ({
  day,
  work_start_time: "",
  work_end_time: "",
  break_start_time: "",
  break_end_time: "",
  break_description: "",
});

const StaffScheduleForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [staffName, setStaffName] = useState("");
  const [dailySchedules, setDailySchedules] = useState(
    DAYS.map((d) => emptyDay(d.key))
  );
  const [loading, setLoading] = useState(false);

  /* ================= FETCH ================= */
  useEffect(() => {
    if (!id) return;

    const fetchStaff = async () => {
        const staff = await apiRequest({
            ...apiRoutes.staffscheduling.get,
            url: `${apiRoutes.staffscheduling.get.url}${id}/`,
        });

        // ✅ staff is already response.data
        setStaffName(staff.staff_name || "");

        setDailySchedules(
            DAYS.map(
            (d) =>
                staff.daily_schedules?.find((x) => x.day === d.key) ||
                emptyDay(d.key)
            )
        );
};

    fetchStaff();
  }, [id]);

  /* ================= SAVE ================= */
  const handleSave = async () => {
    try {
        setLoading(true);

        const filteredSchedules = dailySchedules
            .filter((d) => d.work_start_time && d.work_end_time)
            .map((d) => ({
                day: d.day,
                work_start_time: d.work_start_time|| null,
                work_end_time: d.work_end_time || null, 
                break_start_time: d.break_start_time || null,
                break_end_time: d.break_end_time || null,
                break_description: d.break_description || null,
                is_working_day: true,
            }));


        const payload = id
        ? { daily_schedules: filteredSchedules } // ✅ PATCH
        : { staff_name: staffName, daily_schedules: filteredSchedules }; // ✅ POST

        if (id) {
        await apiRequest(apiRoutes.staffscheduling.update,{
            payload,
            metadata: { id },
        });
        } else {
        await apiRequest(apiRoutes.staffscheduling.create, payload);
        }

        navigate("/pms/platform-settings/calendar-settings");
    } finally {
        setLoading(false);
    }
};


  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* HEADER */}
        <div style={styles.header}>
          <h2>{id ? "Edit Staff Schedule" : "Create Staff Schedule"}</h2>
        </div>

     {/* STAFF NAME */}
    {!id ? (
    <div style={styles.section}>
        <label style={styles.label}>Staff Name *</label>
        <input
        value={staffName}
        onChange={(e) => setStaffName(e.target.value)}
        placeholder="Enter staff name"
        style={styles.input}
        />
    </div>
    ) : (
    <div style={{ marginBottom: "20px" }}>
        <span style={{ color: "#9ca3af", fontSize: "13px" }}>
        Staff
        </span>
        <h3 style={{ marginTop: "4px" }}>
        {staffName}
        </h3>
    </div>
    )}


        {/* DAYS */}
        {dailySchedules.map((day, index) => (
          <div key={day.day} style={styles.dayCard}>
            <div style={styles.dayHeader}>
              <CalendarDays size={16} />
              {DAYS[index].label}
            </div>

            {/* WORK HOURS */}
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.smallLabel}>
                  <Clock size={14} /> Work Start
                </label>
                <input
                  type="time"
                  value={day.work_start_time}
                  onChange={(e) => {
                    const copy = [...dailySchedules];
                    copy[index].work_start_time = e.target.value;
                    setDailySchedules(copy);
                  }}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.smallLabel}>
                  <Clock size={14} /> Work End
                </label>
                <input
                  type="time"
                  value={day.work_end_time}
                  onChange={(e) => {
                    const copy = [...dailySchedules];
                    copy[index].work_end_time = e.target.value;
                    setDailySchedules(copy);
                  }}
                  style={styles.input}
                />
              </div>
            </div>

            {/* BREAK */}
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.smallLabel}>
                  <Coffee size={14} /> Break Start
                </label>
                <input
                  type="time"
                  value={day.break_start_time}
                  onChange={(e) => {
                    const copy = [...dailySchedules];
                    copy[index].break_start_time = e.target.value;
                    setDailySchedules(copy);
                  }}
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.smallLabel}>
                  <Coffee size={14} /> Break End
                </label>
                <input
                  type="time"
                  value={day.break_end_time}
                  onChange={(e) => {
                    const copy = [...dailySchedules];
                    copy[index].break_end_time = e.target.value;
                    setDailySchedules(copy);
                  }}
                  style={styles.input}
                />
              </div>
            </div>

            <input
              placeholder="Break description (Lunch, Tea, etc.)"
              value={day.break_description}
              onChange={(e) => {
                const copy = [...dailySchedules];
                copy[index].break_description = e.target.value;
                setDailySchedules(copy);
              }}
              style={{ ...styles.input, marginTop: "8px" }}
            />
          </div>
        ))}

        {/* ACTIONS */}
        <div style={styles.actions}>
          <button style={styles.cancelBtn} onClick={() => navigate(-1)}>
            Cancel
          </button>
          <button
            style={styles.saveBtn}
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StaffScheduleForm;

const styles = {
  page: {
    backgroundColor: "#1a1a1a",
    minHeight: "100vh",
    padding: "24px",
    color: "#fff",
  },
  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },
  header: {
    marginBottom: "24px",
    fontSize: "20px",
    fontWeight: 600,
  },
  section: {
    marginBottom: "24px",
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "6px",
    fontSize: "14px",
    color: "#d1d5db",
  },
  smallLabel: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    fontSize: "12px",
    color: "#9ca3af",
    marginBottom: "4px",
  },
  input: {
    width: "100%",
    padding: "10px",
    backgroundColor: "#1f2937",
    border: "1px solid #374151",
    borderRadius: "6px",
    color: "#fff",
    fontSize: "14px",
  },
  dayCard: {
    backgroundColor: "#2d2d2d",
    padding: "16px",
    borderRadius: "8px",
    marginBottom: "12px",
    border: "1px solid #404040",
  },
  dayHeader: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
    marginBottom: "12px",
  },
  row: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: "12px",
    marginBottom: "8px",
  },
  field: {
    display: "flex",
    flexDirection: "column",
  },
  actions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
  },
  cancelBtn: {
    background: "transparent",
    border: "1px solid #404040",
    color: "#fff",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
  },
  saveBtn: {
    background: "#2563eb",
    border: "none",
    color: "#fff",
    padding: "8px 20px",
    borderRadius: "6px",
    cursor: "pointer",
  },
};

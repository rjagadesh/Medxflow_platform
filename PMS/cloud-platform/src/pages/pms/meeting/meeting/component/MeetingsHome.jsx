// src/pages/pms/meeting/meeting/component/MeetingsHome.jsx

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mic,
  Video,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
} from "lucide-react";
import { scheduleMeetingService } from "./scheduleMeetingService";
import axios from "axios";
import config from "@/services/config.js";
import MeetingRoom from "./MeetingRoom";
import ApiConstant from "@/services/constant";

const BASE_URL = ApiConstant.BASE_URL.trim().replace(/\/+$/, "");

const MeetingsHome = () => {
  const navigate = useNavigate();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("calendar");
  const [listFilter, setListFilter] = useState("scheduled");

  const [isInMeeting, setIsInMeeting] = useState(false);
  const [meetingData, setMeetingData] = useState(null);
  const [attendeeData, setAttendeeData] = useState(null);

  const getLiteralDate = (isoString) => {
    if (!isoString) return null;
    try {
      const [datePart, timePart] = isoString.split("T");
      const [year, month, day] = datePart.split("-").map(Number);
      const [hours, minutes] = timePart.split(":").map(Number);

      return new Date(year, month - 1, day, hours, minutes);
    } catch (e) {
      return new Date(isoString);
    }
  };

  const formatDisplayDate = () => {
    return currentDate.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    });
  };

  useEffect(() => {
    const loadMeetings = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await scheduleMeetingService.getScheduledMeetings();
        const meetingsList = Array.isArray(data.meetings)
          ? data.meetings
          : data || [];
        setMeetings(meetingsList);
      } catch (err) {
        console.warn("Could not load meetings:", err.message);
        setError("Unable to load appointments at this time");
        setMeetings([]);
      } finally {
        setLoading(false);
      }
    };

    loadMeetings();
  }, []);

  const meetingsForDay = meetings.filter((meeting) => {
    if (!meeting.scheduled_start_time) return false;
    const meetingDate = getLiteralDate(meeting.scheduled_start_time);
    return (
      meetingDate.getFullYear() === currentDate.getFullYear() &&
      meetingDate.getMonth() === currentDate.getMonth() &&
      meetingDate.getDate() === currentDate.getDate()
    );
  });

  const filteredListMeetings = meetings.filter((meeting) => {
    const status = meeting.status?.toLowerCase();
    if (listFilter === "scheduled") return status === "scheduled";
    if (listFilter === "inoffice")
      return status === "ongoing" || status === "in_office";
    if (listFilter === "finished") return status === "ended";
    return true;
  });

  const timeSlots = [];
  for (let hour = 8; hour <= 20; hour++) {
    timeSlots.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < 20) timeSlots.push(`${hour.toString().padStart(2, "0")}:30`);
  }

  const getTopPosition = (startTime) => {
    const date = getLiteralDate(startTime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const slotIndex = (hours - 8) * 2 + (minutes >= 30 ? 1 : 0);
    return slotIndex * 80;
  };

  const handleJoinMeeting = async (meeting) => {
    try {
      const startResponse = await scheduleMeetingService.startMeeting(
        meeting.id
      );

      const patientName =
        meeting.attendees?.find((a) => !a.is_organizer)?.name ||
        meeting.attendees?.[0]?.name ||
        "Guest";

      const joinResponse = await axios.post(
        `${BASE_URL}/app/telehealth/join/`,
        {
          meeting_id: startResponse.meeting_id,
          attendee_name: patientName,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );

      const { meeting: joinedMeeting, attendee: joinedAttendee } =
        joinResponse.data;

      setMeetingData(joinedMeeting);
      setAttendeeData(joinedAttendee);
      setIsInMeeting(true);
    } catch (err) {
      console.error("Failed to join meeting:", err);
      alert(
        "Could not join the meeting. It may already be in progress or invalid."
      );
    }
  };

  const handleLeaveMeeting = () => {
    setIsInMeeting(false);
    setMeetingData(null);
    setAttendeeData(null);
  };

  const getDaysInMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) =>
    new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const calendarDays = [];
  const daysInMonth = getDaysInMonth(calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarMonth);

  for (let i = 0; i < firstDay; i++) calendarDays.push(null);
  for (let day = 1; day <= daysInMonth; day++) calendarDays.push(day);

  const isSelectedDay = (day) => {
    if (!day) return false;
    const date = new Date(
      calendarMonth.getFullYear(),
      calendarMonth.getMonth(),
      day
    );
    return date.toDateString() === currentDate.toDateString();
  };

  const selectDate = (day) => {
    setCurrentDate(
      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day)
    );
  };


  useEffect(() => {
  if (isInMeeting && meetingData && attendeeData) {
    navigate("/pms/path/telehealth", {
      state: {
        meetingData,
        attendeeData,
        isTelehealth: true
      },
    });
  }
}, [isInMeeting, meetingData, attendeeData, navigate]);

  // if (isInMeeting && meetingData && attendeeData) {
  //   navigate("/pms/path/telehealth")
    
    // return (
      // <MeetingRoom
      //   meetingData={meetingData}
      //   attendeeData={attendeeData}
      //   onLeaveMeeting={handleLeaveMeeting}
      //   isTelehealth={true}
      // />
    // );
  // }

  return (
    <div className="h-[calc(100vh-100px)] w-full bg-black text-white flex flex-col overflow-hidden box-border">
      {/* FIXED HEADER */}
      <div className="border-b border-[#1e4270] bg-black shrink-0">
        <div className="p-6 pt-0">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-6">
              <div>
                <h1 className="text-2xl font-semibold">Appointment Calendar</h1>
                <p className="text-[#808080] mt-1">{formatDisplayDate()}</p>
              </div>
            </div>
            
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 bg-[#0f0f0f] border border-[#1e4270] rounded-lg flex items-center justify-center cursor-pointer hover:bg-[#1a1a1a]"
                onMouseEnter={() => setIsCalendarVisible(true)}
              >
                <CalendarIcon size={24} className="text-cyan-400" />
              </div>
              <button
              onClick={() => setCurrentDate(new Date())}
              className="px-2 text-xs py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-500 transition"
            >
              {currentDate.toDateString() === new Date().toDateString()
                ? "Today"
                : "Go to Today"}
            </button>

              <div className="flex border border-[#1e4270] rounded-lg overflow-hidden">
                <button
                  onClick={() => setActiveTab("calendar")}
                  className={`px-6 py-2 flex items-center gap-2 ${
                    activeTab === "calendar"
                      ? "bg-cyan-600 text-white"
                      : "bg-[#0d2b52] text-gray-400 hover:bg-[#1e4270]"
                  }`}
                >
                  <CalendarIcon size={18} />
                  Calendar
                </button>
                <button
                  onClick={() => setActiveTab("list")}
                  className={`px-6 py-2 flex items-center gap-2 ${
                    activeTab === "list"
                      ? "bg-cyan-600 text-white"
                      : "bg-[#0d2b52] text-gray-400 hover:bg-[#1e4270]"
                  }`}
                >
                  List View
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/meetings/audio")}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition"
                >
                  <Mic size={22} />
                  <span>Audio Call</span>
                </button>
                <button
                  onClick={() => navigate("/meetings/video")}
                  className="flex items-center gap-2 px-6 py-3 rounded-lg bg-neutral-800 hover:bg-neutral-700 transition"
                >
                  <Video size={22} />
                  <span>Video Call</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="flex-1 bg-black overflow-hidden">
        {/* Sidebar Calendar - Updated to match your design exactly */}
        <div
          className={`absolute left-0 top-0 w-130 pt-30 pl-25 h-100% bottom-0 w-80 bg-[#1a1a1a] border-r border-[#1e4270] transition-transform duration-300 z-20 ${
            isCalendarVisible ? "translate-x-0" : "-translate-x-full"
          }`}
          onMouseEnter={() => setIsCalendarVisible(true)}
          onMouseLeave={() => setIsCalendarVisible(false)}
        >
          <div className="p-6">
            <div className="bg-[#1e1e1e] rounded-xl p-6 ">
              {/* Month Title with Arrows */}
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() =>
                    setCalendarMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1)
                    )
                  }
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronLeft size={28} />
                </button>
                <h3 className="text-2xl font-semibold">
                  {calendarMonth.toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </h3>
                <button
                  onClick={() =>
                    setCalendarMonth(
                      (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1)
                    )
                  }
                  className="text-gray-400 hover:text-white"
                >
                  <ChevronRight size={28} />
                </button>
              </div>

              {/* Selected Day Pill */}
              <div className="text-center mb-8">
                <div className="inline-block bg-cyan-600 text-white rounded-full px-6 py-4">
                  <div className="text-4xl font-bold">
                    {currentDate.getDate()}
                  </div>
                  <div className="text-sm uppercase tracking-wider mt-1">
                    {currentDate.toLocaleDateString("en-US", { weekday: "short" })}
                  </div>
                </div>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 text-sm text-[#808080] text-center mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                  <div key={d} className="py-2">
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 text-center">
                {calendarDays.map((day, i) => (
                  <button
                    key={i}
                    onClick={() => day && selectDate(day)}
                    disabled={!day}
                    className={`h-12 rounded-lg text-lg font-medium transition-all ${
                      !day
                        ? "invisible"
                        : isSelectedDay(day)
                        ? "bg-cyan-600 text-white shadow-lg"
                        : "hover:bg-[#1e4270] text-gray-300"
                    }`}
                  >
                    {day || ""}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* SCROLLABLE CONTENT */}
        <div className="h-full overflow-y-auto">
          <div className="px-6 pt-6 pb-12">
            {loading ? (
              <p className="text-center text-gray-400 mt-20">
                Loading appointments...
              </p>
            ) : error ? (
              <p className="text-center text-red-400 mt-20">{error}</p>
            ) : activeTab === "calendar" ? (
              <div className="grid grid-cols-12 gap-6 min-w-max">
                <div className="col-span-1">
                  {timeSlots.map((t) => {
                    const [h, m] = t.split(":");
                    const hour = parseInt(h);
                    const display = `${
                      hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                    }:${m} ${hour >= 12 ? "PM" : "AM"}`;
                    return (
                      <div
                        key={t}
                        className="h-20 flex items-start justify-end pr-6 text-[#808080] text-sm pt-3"
                      >
                        {display}
                      </div>
                    );
                  })}
                </div>

                <div className="col-span-11 relative">
                  {timeSlots.map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-x-0 border-t border-[#1e4270]"
                      style={{ top: `${i * 80}px` }}
                    />
                  ))}

                  {meetingsForDay.map((meeting) => {
                    const description = meeting.meeting_description || "Consultation";

                    let patientName = "Patient";
                    if (meeting.meeting_title) {
                      const parts = meeting.meeting_title.split(" with ");
                      if (parts.length > 1) {
                        patientName = parts[0].replace(/^Appointment:\s*/, "").trim();
                      }
                    }

                    const meetingTime = getLiteralDate(meeting.scheduled_start_time).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                    });

                    return (
                      <div
                        key={meeting.id}
                        className="absolute left-4 right-4 px-4 py-3 m-1.5 rounded-lg bg-[#1e1e1e] border border-[#1e4270] shadow-md"
                        style={{
                          top: `${getTopPosition(meeting.scheduled_start_time)}px`,
                        }}
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex-1">
                            {/* Description bold + Name normal + Join button inline */}
                            <div className="font-medium flex items-center flex-wrap gap-2">
                              <span className="font-bold">{description}</span>
                              <span className="text-s text-gray-300">{patientName}</span>
                              <button
                                onClick={() => handleJoinMeeting(meeting)}
                                className="px-1 py-1 text-xs bg-blue-600 hover:bg-blue-700 rounded transition"
                              >
                                Join Meeting
                              </button>
                            </div>

                            {/* Time below */}
                            <div className="text-xs text-cyan-400 mt-1 font-bold">
                              {meetingTime}
                            </div>
                          </div>

                          {/* Status badge on the right */}
                          <div className="flex items-center">
                            <span className="text-xs bg-gray-700 px-3 py-1 rounded-full">
                              {meeting.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <>
                <div className="flex border border-[#1e4270] rounded-lg overflow-hidden mb-6 w-fit">
                  {["Scheduled", "In Office", "Finished"].map((tab) => (
                    <button
                      key={tab}
                      onClick={() =>
                        setListFilter(tab.toLowerCase().replace(" ", ""))
                      }
                      className={`px-6 py-2 transition ${
                        listFilter === tab.toLowerCase().replace(" ", "")
                          ? "bg-cyan-600 text-white"
                          : "bg-[#0d2b52] text-gray-400 hover:bg-[#1e4270]"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {filteredListMeetings.length === 0 ? (
                    <p className="text-center text-gray-400 mt-20">
                      No appointments found
                    </p>
                  ) : (
                    filteredListMeetings.map((meeting) => {
                      const description = meeting.meeting_description || "Consultation";

                      let patientName = "Unknown Patient";
                      if (meeting.meeting_title) {
                        const parts = meeting.meeting_title.split(" with ");
                        if (parts.length > 1) {
                          patientName = parts[0].replace(/^Appointment:\s*/, "").trim();
                        }
                      }

                      const lStart = getLiteralDate(meeting.scheduled_start_time);
                      const lEnd = meeting.scheduled_end_time
                        ? getLiteralDate(meeting.scheduled_end_time)
                        : null;

                      const timeRange = lEnd
                        ? `${lStart.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })} - ${lEnd.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          })}`
                        : lStart.toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                          });

                      return (
                        <div
                          key={meeting.id}
                          className="bg-[#1e1e1e] rounded-lg p-6 border border-[#1e4270]"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="text-xl font-medium flex items-center flex-wrap gap-3">
                                <span className="font-bold">{description}</span>
                                <span>{patientName}</span>
                              </div>
                              <div className="text-sm text-gray-300 mt-3 font-semibold text-cyan-400">
                                {timeRange} | {meeting.meeting_title || "Appointment"}
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <span
                                className={`px-4 py-2 rounded-full text-sm font-medium ${
                                  meeting.status === "scheduled"
                                    ? "bg-purple-900 text-purple-300"
                                    : meeting.status === "ended"
                                    ? "bg-gray-700 text-gray-300"
                                    : "bg-yellow-900 text-yellow-300"
                                }`}
                              >
                                {meeting.status}
                              </span>
                              <button
                                onClick={() => handleJoinMeeting(meeting)}
                                className="bg-blue-600 px-5 py-2 rounded text-sm hover:bg-blue-700 transition"
                              >
                                Join
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MeetingsHome;
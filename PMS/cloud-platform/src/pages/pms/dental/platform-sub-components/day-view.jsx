import { useState, useEffect, useRef, useMemo } from "react";
import { Calendar } from "lucide-react";

const DayView = ({
  appointments,
  currentDate,
  selectedProviders,
  providers,
  businessTimeSlots,
  slotHeight,
  calendarGradient,
  defaultBorderColor,
  handleDoubleClickTimeSlot,
  onAppointmentClick,
  timeScrollRef,
  contentScrollRef,
  convert24to12,
}) => {
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const onSlotDoubleClick = (slot) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(currentDate);
    targetDate.setHours(0, 0, 0, 0);
    if (targetDate < today) {
      setError("Can't Create Appointment on past days");
      return;
    }
    if (targetDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      if (
        slot.hour < currentHour ||
        (slot.hour === currentHour && slot.minute < currentMinute)
      ) {
        setError("Can't Create Appointment on past time");
        return;
      }
    }
    // Determine if we should pre-fill a provider
    let prefilledProvider = "";
    if (selectedProviders.length === 1 && selectedProviders[0] !== "all") {
      prefilledProvider = selectedProviders[0];
      console.log("Prefilling provider:", prefilledProvider);
    }
    handleDoubleClickTimeSlot(slot, currentDate, prefilledProvider);
  };

  const getFilteredAppointments = (targetDate) => {
    return appointments
      .filter((apt) => {
        if (!apt.date) return false;
        const [year, month, day] = apt.date.split("-").map(Number);
        const aptDate = new Date(year, month - 1, day);
        return aptDate.toDateString() === targetDate.toDateString();
      })
      .filter((apt) => {
        if (selectedProviders.includes("all")) return true;
        if (selectedProviders.length === 0) return false;
        return selectedProviders.some((id) => {
          const prov = providers.find((p) => p.id === id);
          return prov && prov.name === apt.provider;
        });
      });
  };

  const todayAppointments = getFilteredAppointments(currentDate);

  const appointmentLayout = useMemo(() => {
    if (todayAppointments.length === 0) return { appointments: [], maxLanes: 1 };

    const appts = todayAppointments.map((apt) => ({
      ...apt,
      startMinutes: apt.hour * 60 + apt.minute,
      endMinutes: apt.hour * 60 + apt.minute + apt.duration,
    }));

    appts.sort((a, b) => a.startMinutes - b.startMinutes);

    const lanes = [];
    appts.forEach((apt) => {
      let assigned = false;
      for (let lane = 0; lane < lanes.length; lane++) {
        const lastInLane = lanes[lane][lanes[lane].length - 1];
        if (!lastInLane || lastInLane.endMinutes <= apt.startMinutes) {
          lanes[lane].push(apt);
          apt.lane = lane;
          assigned = true;
          break;
        }
      }
      if (!assigned) {
        apt.lane = lanes.length;
        lanes.push([apt]);
      }
    });

    const maxLanes = lanes.length;

    const openHour = 8;
    const openMinutes = openHour * 60;

    appts.forEach((apt) => {
      const startMinutesFromOpen = apt.startMinutes - openMinutes;
      apt.top = (startMinutesFromOpen / 30) * slotHeight;
      apt.height = (apt.duration / 30) * slotHeight - 8;
    });

    return { appointments: appts, maxLanes };
  }, [todayAppointments, slotHeight]);

  useEffect(() => {
    const timeEl = timeScrollRef.current;
    const contentEl = contentScrollRef.current;
    if (!timeEl || !contentEl) return;

    const handleTimeScroll = () => {
      contentEl.scrollTop = timeEl.scrollTop;
    };
    const handleContentScroll = () => {
      timeEl.scrollTop = contentEl.scrollTop;
    };

    timeEl.addEventListener("scroll", handleTimeScroll, { passive: true });
    contentEl.addEventListener("scroll", handleContentScroll, { passive: true });

    contentEl.scrollTop = timeEl.scrollTop;

    return () => {
      timeEl.removeEventListener("scroll", handleTimeScroll);
      timeEl.removeEventListener("scroll", handleContentScroll);
    };
  }, [timeScrollRef, contentScrollRef]);

  const { appointments: laidOutAppointments, maxLanes } = appointmentLayout;

  // Format type and get initials
  const getAppointmentTypeDisplay = (type, isSmall) => {
    if (!type) return { full: "Appointment", initials: "A" };

    const words = type.split("_");
    const full = words
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");

    const initials = words
      .map((word) => word.charAt(0).toUpperCase())
      .join("/");

    return isSmall ? initials : full;
  };

  return (
    <div className="flex h-full border border-[#1e4270] rounded-2xl overflow-hidden bg-[#16375e] relative">
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

      {/* Time column */}
      <div className="w-20 bg-[#0d2b52] border-r border-[#1e4270] flex-shrink-0">
        <div ref={timeScrollRef} className="time-column h-full overflow-y-auto pt-3">
          {businessTimeSlots.map((slot) => (
            <div
              key={`${slot.hour}-${slot.minute}`}
              className="border-b border-[#4a4949] relative cursor-pointer hover:bg-[#1e4270]/50 transition-colors"
              style={{ height: slotHeight }}
              title="Double click to create appointment"
              onDoubleClick={() => onSlotDoubleClick(slot)}
            >
              {slot.minute === 0 && (
                <div className="absolute top-5 left-2 text-xs text-[#808080] font-medium bg-[#0d2b52] px-1">
                  {slot.label}
                </div>
              )}
              <div className="h-3 border-t border-[#4a4949] border-dashed"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Appointment area */}
      <div className="flex-1 relative">
        <div ref={contentScrollRef} className="h-full overflow-y-auto pt-3">
          <div className="min-h-full relative">
            {/* Grid lines */}
            {businessTimeSlots.map((slot) => (
              <div
                key={`line-${slot.hour}-${slot.minute}`}
                className="border-b border-[#4a4949] cursor-pointer hover:bg-[#1e4270]/20 transition-colors"
                style={{ height: slotHeight }}
                title="Double click to create appointment"
                onDoubleClick={() => onSlotDoubleClick(slot)}
              ></div>
            ))}

            {/* Appointments */}
            {laidOutAppointments.map((apt) => {
              const laneWidth = 100 / maxLanes;
              const isCompact = maxLanes > 2 || apt.height < 60;
              const isVerySmall = apt.height < 35;

              const typeDisplay = getAppointmentTypeDisplay(apt.type, isCompact || isVerySmall);

              return (
                <div
                  key={apt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAppointmentClick(apt);
                  }}
                  className="absolute rounded-lg shadow-lg border-l-4 overflow-hidden backdrop-blur-sm hover:shadow-xl group transition-all duration-200 cursor-pointer"
                  style={{
                    top: `${apt.top + 4}px`,
                    left: `${apt.lane * laneWidth}%`,
                    width: `calc(${laneWidth}% - 4px)`,
                    height: `${Math.max(apt.height, 28)}px`,
                    backgroundImage: calendarGradient,
                    borderLeftColor: defaultBorderColor,
                    backgroundColor: "rgba(85, 165, 220, 0.15)",
                    backdropFilter: "blur(10px)",
                    padding: isVerySmall ? '3px 5px' : isCompact ? '4px 6px' : '8px 10px 8px 8px',
                  }}
                >
                  {/* Appointment Type Badge - Always in top-right */}
                  <div className="absolute top-1 right-1 z-10">
                    <span
                      className={`px-2 py-0.5 rounded text-white font-medium shadow-md ${
                        isCompact || isVerySmall ? 'text-[9px]' : 'text-xs'
                      }`}
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.25)",
                        backdropFilter: "blur(4px)",
                      }}
                    >
                      {typeDisplay}
                    </span>
                  </div>

                  {/* Main Content */}
                  {isVerySmall ? (
                    <div className="flex items-center justify-between h-full gap-1 pr-12">
                      <div className="min-w-0 flex-1">
                        <p className="text-white text-[11px] truncate leading-tight tracking-wider">
                          {apt.patient}
                        </p>
                      </div>
                      <span className="text-[9px] text-white/80 whitespace-nowrap leading-tight tracking-wider">
                        {apt.displayTime}
                      </span>
                    </div>
                  ) : isCompact ? (
                    <div className="flex flex-col h-full justify-between pr-12">
                      <div className="min-w-0">
                        <p className="text-white text-xs truncate leading-tight tracking-wider">{apt.patient}</p>
                        <p className="text-[10px] text-white/70 truncate mt-0.5 tracking-wider">{apt.displayTime}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col h-full pr-12">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0 flex-1">
                          <p className="text-white text-sm truncate leading-tight tracking-wider">{apt.patient}</p>
                          <p className="text-xs text-white/70 mt-1 tracking-wider">{apt.displayTime}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {todayAppointments.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <Calendar className="w-12 h-12 text-[#2b5187] mx-auto mb-4" />
                  <p className="text-[#808080] font-medium">No appointments scheduled</p>
                  <p className="text-[#2b5187] text-sm mt-1">
                    Double-click a time slot to create an appointment
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DayView;

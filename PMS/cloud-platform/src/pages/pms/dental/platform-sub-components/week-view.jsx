import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

const WeekView = ({
  appointments,
  currentDate,
  selectedProviders,
  providers,
  businessTimeSlots,
  calendarGradient,
  weekDays,
  onAppointmentClick,
  handleDoubleClickTimeSlot,
  slotHeight = 60,
  setActiveView,
  setCurrentDate,
  defaultBorderColor,
}) => {
  const [error, setError] = useState("");

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Format type to shortform (Always use shortform in WeekView)
  const getAppointmentTypeDisplay = (type) => {
    if (!type) return "A";
    const words = type.split("_");
    return words.map((word) => word.charAt(0).toUpperCase()).join("/");
  };

  // Calculate end time for appointment, ensuring it doesn't exceed 23:59
  const calculateAppointmentEndTime = (appointment) => {
    const [hour, minute] = appointment.time.split(":").map(Number);
    const duration = parseInt(appointment.duration) || 0;
    const totalMinutes = hour * 60 + minute + duration;
    const cappedMinutes = Math.min(totalMinutes, 23 * 60 + 59);
    const originalEndMinutes = hour * 60 + minute + duration;
    const cappedDuration = Math.max(0, cappedMinutes - (hour * 60 + minute));

    return {
      hour,
      minute,
      endHour: Math.floor(cappedMinutes / 60),
      endMinute: cappedMinutes % 60,
      endMinutes: cappedMinutes,
      duration: cappedDuration,
      originalDuration: duration,
      exceedsMidnight: originalEndMinutes > (23 * 60 + 59),
    };
  };

  // FIXED: Double-click now correctly pre-fills provider when only one is selected
  const onSlotDoubleClick = (slot, date) => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate < today) {
      setError("Can't create appointment on past days");
      return;
    }
    if (targetDate.getTime() === today.getTime()) {
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      if (
        slot.hour < currentHour ||
        (slot.hour === currentHour && slot.minute < currentMinute)
      ) {
        setError("Can't create appointment in past time");
        return;
      }
    }

    // Determine if we should pre-fill a provider
    let prefilledProvider = "";
    if (selectedProviders.length === 1 && selectedProviders[0] !== "all") {
      prefilledProvider = selectedProviders[0];
    }

    // Pass slot, date, and prefilled provider
    handleDoubleClickTimeSlot(slot, date, prefilledProvider);
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
          if (apt.provider_id && (apt.provider_id === id || String(apt.provider_id) === String(id))) return true;
          const prov = providers.find((p) => p.id === id);
          return prov && (prov.name === apt.provider || String(prov.id) === String(apt.provider));
        });
      });
  };

  const getWeekDates = () => {
    const dates = [];
    const current = new Date(currentDate);
    current.setDate(current.getDate() - current.getDay());
    for (let i = 0; i < 7; i++) {
      const date = new Date(current);
      date.setDate(current.getDate() + i);
      dates.push({
        day: date.getDate(),
        date: new Date(date),
        dayName: weekDays[i],
      });
    }
    return dates;
  };

  const weekDates = getWeekDates();
  const actualToday = new Date();

  const getLayoutForDay = (dayDate) => {
    const dayAppointments = getFilteredAppointments(dayDate);
    if (dayAppointments.length === 0) return [];

    const appts = dayAppointments.map((apt) => {
      const calc = calculateAppointmentEndTime(apt);
      return {
        ...apt,
        hour: calc.hour,
        minute: calc.minute,
        startMinutes: calc.hour * 60 + calc.minute,
        endMinutes: calc.endMinutes,
        duration: calc.duration,
        exceedsMidnight: calc.exceedsMidnight,
        endHour: calc.endHour,
        endMinute: calc.endMinute,
        displayTime: `${String(calc.hour).padStart(2, '0')}:${String(calc.minute).padStart(2, '0')} - ${String(calc.endHour).padStart(2, '0')}:${String(calc.endMinute).padStart(2, '0')}${calc.exceedsMidnight ? ' (capped)' : ''}`
      };
    });

    appts.sort((a, b) => a.startMinutes - b.startMinutes);

    const clusters = [];
    if (appts.length > 0) {
      let currentCluster = [appts[0]];
      let clusterEnd = appts[0].endMinutes;

      for (let i = 1; i < appts.length; i++) {
        const apt = appts[i];
        if (apt.startMinutes < clusterEnd) {
          currentCluster.push(apt);
          clusterEnd = Math.max(clusterEnd, apt.endMinutes);
        } else {
          clusters.push(currentCluster);
          currentCluster = [apt];
          clusterEnd = apt.endMinutes;
        }
      }
      clusters.push(currentCluster);
    }

    const firstSlot = businessTimeSlots[0];
    const openHour = firstSlot ? firstSlot.hour : 8;
    const openMinutes = openHour * 60 + (firstSlot ? firstSlot.minute : 0);

    const lastSlot = businessTimeSlots[businessTimeSlots.length - 1];
    const closeHour = lastSlot ? Math.max(lastSlot.hour + 1, 24) : 24;
    const closeMinutes = Math.min(closeHour * 60, 24 * 60);

    const MAX_VISIBLE_LANES = 3;
    let finalVisibleAppts = [];

    clusters.forEach((clusterAppts) => {
      const lanes = [];
      clusterAppts.forEach((apt) => {
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
      let effectiveMaxLanes = maxLanes;
      let visibleClusterAppts = clusterAppts;

      if (maxLanes > MAX_VISIBLE_LANES) {
        effectiveMaxLanes = MAX_VISIBLE_LANES;
        visibleClusterAppts = clusterAppts.filter((apt) => apt.lane < MAX_VISIBLE_LANES);
        visibleClusterAppts.forEach((apt) => {
          if (apt.lane === MAX_VISIBLE_LANES - 1) {
            apt.isMoreButton = true;
            const hiddenOverlaps = clusterAppts.filter(
              (hiddenApt) =>
                hiddenApt.lane >= MAX_VISIBLE_LANES &&
                Math.max(apt.startMinutes, hiddenApt.startMinutes) <
                  Math.min(apt.endMinutes, hiddenApt.endMinutes)
            );
            apt.moreCount = 1 + hiddenOverlaps.length;
          }
        });
      }

      visibleClusterAppts.forEach((apt) => {
        const startMinutesFromOpen = apt.startMinutes - openMinutes;
        apt.top = (startMinutesFromOpen / 30) * slotHeight;
        const visibleEndMinutes = Math.min(apt.endMinutes, closeMinutes);
        const visibleDuration = Math.max(0, visibleEndMinutes - apt.startMinutes);
        apt.height = (visibleDuration / 30) * slotHeight - 8;
        apt.laneWidthPercent = 100 / effectiveMaxLanes;
        apt.leftPercent = apt.lane * apt.laneWidthPercent;
        apt.maxLanes = effectiveMaxLanes;

        const overlappingApps = visibleClusterAppts.filter(
          (otherApt) =>
            otherApt.id !== apt.id &&
            Math.max(apt.startMinutes, otherApt.startMinutes) <
              Math.min(apt.endMinutes, otherApt.endMinutes)
        );
        apt.hasOverlaps = overlappingApps.length > 0;
      });

      finalVisibleAppts = [...finalVisibleAppts, ...visibleClusterAppts];
    });

    return finalVisibleAppts;
  };

  const handleHeaderClick = (date) => {
    if (setCurrentDate && setActiveView) {
      setCurrentDate(date);
      setActiveView("day");
    }
  };

  const createBusinessTimeSlots = () => {
    const slots = [];
    const startHour = businessTimeSlots[0]?.hour || 8;
    const endHour = 24;
    for (let hour = startHour; hour < endHour; hour++) {
      slots.push(
        { hour, minute: 0, label: `${hour % 12 === 0 ? 12 : hour % 12} ${hour < 12 ? 'AM' : 'PM'}` },
        { hour, minute: 30, label: '' }
      );
    }
    return slots;
  };

  const extendedBusinessTimeSlots = createBusinessTimeSlots();

  return (
    <div className="border border-[#1e4270] rounded-2xl overflow-hidden bg-[#16375e] h-full relative flex flex-col">
      <style>{`
        .scrollbar-white { scrollbar-width: thin; scrollbar-color: #ffffff #0d2b52; }
        .scrollbar-white::-webkit-scrollbar { width: 4px; height: 4px; }
        .scrollbar-white::-webkit-scrollbar-track { background: #0d2b52; border-radius: 4px; }
        .scrollbar-white::-webkit-scrollbar-thumb { background: #ffffff; border-radius: 4px; }
        .scrollbar-white::-webkit-scrollbar-thumb:hover { background: #e0e0e0; }
      `}</style>

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

      <div className="overflow-y-auto flex-1 scrollbar-white relative">
        <div className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-[#1e4270] bg-[#0d2b52] sticky top-0 z-20">
          <div className="p-3 bg-[#0d2b52]"></div>
          {weekDates.map((date, index) => (
            <div
              key={`header-${index}`}
              onClick={() => handleHeaderClick(date.date)}
              className={`p-3 text-center border-l border-[#1e4270] bg-[#0d2b52] cursor-pointer hover:bg-[#1e4270]/50 transition-colors ${
                date.date.toDateString() === actualToday.toDateString()
                  ? "bg-gradient-to-br from-[#4f8fce]/10 to-cyan-900/10"
                  : ""
              }`}
            >
              <p className="text-white text-sm font-medium">{date.dayName}</p>
              <p
                className={`text-sm mt-1 ${
                  date.date.toDateString() === actualToday.toDateString()
                    ? "text-white font-bold bg-[#4f8fce] rounded-full w-7 h-7 flex items-center justify-center mx-auto"
                    : "text-[#808080]"
                }`}
              >
                {date.day}
              </p>
            </div>
          ))}
        </div>

        <div className="relative">
          <div className="relative z-0">
            {extendedBusinessTimeSlots.map((slot, slotIndex) => (
              <div
                key={`row-${slot.hour}-${slot.minute}`}
                className="grid grid-cols-[80px_repeat(7,1fr)] border-b border-[#1e4270]"
                style={{ height: slotHeight }}
              >
                <div className="p-1 border-r border-[#1e4270] bg-[#0d2b52] relative">
                  {slot.minute === 0 && (
                    <p className="text-xs text-[#808080] font-medium text-right pr-2 mt-4">
                      {slot.label}
                    </p>
                  )}
                </div>
                {weekDates.map((date, dayIndex) => (
                  <div
                    key={`cell-${dayIndex}-${slot.hour}-${slot.minute}`}
                    title="Double click to create appointment"
                    onDoubleClick={() => onSlotDoubleClick(slot, date.date)}
                    className={`border-l border-[#1e4270] cursor-pointer hover:bg-[#1e4270]/20 transition-colors ${
                      dayIndex % 2 === 0 ? "bg-[#16375e]" : "bg-[#0d2b52]"
                    }`}
                  ></div>
                ))}
              </div>
            ))}
          </div>

          <div className="absolute top-0 left-0 right-0 bottom-0 z-10 pointer-events-none grid grid-cols-[80px_repeat(7,1fr)]">
            <div></div>
            {weekDates.map((date, dayIndex) => {
              const laidOutAppointments = getLayoutForDay(date.date);
              return (
                <div
                  key={`apt-col-${dayIndex}`}
                  className="relative h-full pointer-events-none"
                >
                  {laidOutAppointments.map((apt) => {
                    if (apt.isMoreButton) {
                      return (
                        <div
                          key={`more-${apt.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleHeaderClick(date.date);
                          }}
                          className="absolute rounded-lg border-l-4 p-1.5 overflow-hidden backdrop-blur-md cursor-pointer hover:shadow-lg transition-all hover:z-50 shadow-md flex items-center justify-center pointer-events-auto group"
                          style={{
                            top: `${apt.top + 4}px`,
                            left: `calc(${apt.leftPercent}% + 2px)`,
                            width: `calc(${apt.laneWidthPercent}% - 4px)`,
                            height: `${Math.max(apt.height, 24)}px`,
                            backgroundImage:
                              "linear-gradient(135deg, rgba(100, 100, 100, 0.3) 0%, rgba(60, 60, 60, 0.4) 100%)",
                            borderLeftColor: "#808080",
                            backgroundColor: "rgba(80, 80, 80, 0.25)",
                          }}
                          title="Click to view full day"
                        >
                          <p className="font-bold text-white text-[11px] group-hover:text-[12px] transition-all">
                            +{apt.moreCount} More
                          </p>
                        </div>
                      );
                    }

                    const shouldCompact = apt.hasOverlaps;
                    const isVerySmall = apt.height < 35;
                    const typeDisplay = getAppointmentTypeDisplay(apt.type);

                    return (
                      <div
                        key={`apt-${apt.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAppointmentClick(apt);
                        }}
                        className="absolute rounded-lg shadow-lg border-l-4 tracking-wider overflow-hidden backdrop-blur-sm cursor-pointer hover:shadow-xl transition-all hover:z-50 group pointer-events-auto"
                        style={{
                          top: `${apt.top + 4}px`,
                          left: `calc(${apt.leftPercent}% + 2px)`,
                          width: `calc(${apt.laneWidthPercent}% - 4px)`,
                          height: `${Math.max(apt.height, 24)}px`,
                          backgroundImage: calendarGradient,
                          borderLeftColor: defaultBorderColor || "rgba(59, 130, 246, 0.8)",
                          backgroundColor: "rgba(85, 165, 220, 0.15)",
                          backdropFilter: "blur(10px)",
                          padding: isVerySmall ? "3px 5px" : shouldCompact ? "4px 6px" : "8px 10px 8px 8px",
                        }}
                        title={`${apt.patient} - ${apt.displayTime}`}
                      >
                        <div className="absolute top-1 right-1 z-10">
                          <span
                            className={`px-2 py-0.5 rounded text-white font-medium tracking-wider shadow-md ${
                              shouldCompact || isVerySmall ? 'text-[9px]' : 'text-xs'
                            }`}
                            style={{
                              backgroundColor: "rgba(255, 255, 255, 0.25)",
                              backdropFilter: "blur(4px)",
                            }}
                          >
                            {typeDisplay}
                          </span>
                        </div>

                        {isVerySmall ? (
                          <div className="flex items-center justify-between h-full pr-8">
                            <p className=" text-white text-[10px] truncate tracking-wider leading-tight flex-1">
                              {apt.patient.split(" ")[0]}
                            </p>
                            <span className="text-[8px] text-white/80 ml-1 tracking-wider whitespace-nowrap">
                              {apt.displayTime.split(" ")[0]}
                            </span>
                          </div>
                        ) : shouldCompact ? (
                          <div className="flex flex-col h-full pr-8">
                            <p className="font-medium text-white text-[11px] leading-tight tracking-wider truncate">
                              {apt.patient.split(" ")[0]}
                            </p>
                            {apt.height > 30 && (
                              <p className="text-white/90 text-[9px] truncate tracking-wider leading-tight mt-0.5">
                                {apt.displayTime}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="flex flex-col h-full justify-between pr-12">
                            <div>
                              <p className=" text-white text-xs tracking-wider leading-tight truncate">
                                {apt.patient}
                              </p>
                              <p className="text-white/90 text-[10px] truncate tracking-wider leading-tight mt-0.5">
                                {apt.displayTime.replace(' (capped)', '')}
                              </p>
                            </div>
                            {/* <div>
                              <p className="text-white/70 text-[9px] truncate leading-tight">
                                {providers.find(p => p.id === apt.provider_id || p.name === apt.provider || String(p.id) === String(apt.provider))?.name || apt.provider}
                              </p>
                            </div> */}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeekView;
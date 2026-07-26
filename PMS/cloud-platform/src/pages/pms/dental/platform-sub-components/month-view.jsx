const MonthView = ({ currentDate, appointments, selectedProviders, providers, calendarGradient, weekDays, setCurrentDate, setActiveView }) => {
  const onDayDoubleClick = (day) => {
    const newDate = new Date(currentDate);
    newDate.setDate(day);
    setCurrentDate(newDate);
    setActiveView("day");
  };

  const getFilteredAppointments = (targetDate) => {
    return appointments
      .filter((apt) => {
        if (!apt.date) return false;
        // Parse YYYY-MM-DD as local date to avoid timezone issues
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

  const getDayAppointments = (dayDate) => {
    return getFilteredAppointments(dayDate);
  };

  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const actualToday = new Date();

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const monthDaysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyCells = Array.from({ length: firstDay }, (_, i) => null);
  const allDays = [...emptyCells, ...monthDaysArray];

  const isToday = (day) => {
    const dayDate = new Date(currentYear, currentMonth, day);
    return dayDate.toDateString() === actualToday.toDateString();
  };

  return (
    <div className="border border-[#1e4270] rounded-2xl overflow-hidden bg-[#16375e] h-full flex flex-col">
      <div className="grid grid-cols-7 bg-[#0d2b52] border-b border-[#1e4270] flex-shrink-0">
        {weekDays.map((day) => (
          <div key={day} className="p-3 text-center">
            <p className=" text-white">{day}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 flex-1 overflow-y-auto" style={{ gridAutoRows: '1fr' }}>
        {allDays.map((day, index) => {
          if (day === null) {
            return (
              <div
                key={`empty-${index}`}
                className="min-h-[100px] border-r border-b border-[#1e4270] bg-[#0d2b52]"
              ></div>
            );
          }

          const dayDate = new Date(currentYear, currentMonth, day);
          const dayAppointments = getDayAppointments(dayDate);

          return (
            <div
              key={day}
              className={`min-h-[100px] p-3 border-r border-b border-[#1e4270] hover:bg-[#0d2b52]/50 cursor-pointer transition-all duration-200 ${
                isToday(day)
                  ? "bg-gradient-to-br from-[#4f8fce]/10 to-cyan-900/10"
                  : ""
              }`}
              title="Double click to manage appointments"
              onDoubleClick={(e) => {
                e.stopPropagation();
                onDayDoubleClick(day);
              }}
            >
              <div className="flex justify-between items-center mb-2">
                <p
                  className={` text-lg ${
                    isToday(day) ? "text-white" : "text-white"
                  }`}
                >
                  {day}
                </p>
                {dayAppointments.length > 0 && (
                  <span
                    className="text-xs px-2 py-1 rounded font-medium backdrop-blur-sm"
                    style={{
                      backgroundImage: calendarGradient,
                      color: "white",
                      backgroundColor: "rgba(85, 165, 220, 0.2)",
                    }}
                  >
                    {dayAppointments.length}
                  </span>
                )}
              </div>

              <div className="space-y-1 overflow-y-auto flex-1 min-h-0">
                {dayAppointments.slice(0, 2).map((apt) => (
                  <div
                    key={apt.id}
                    className="p-1.5 rounded text-xs border-l-2 shadow-sm flex items-center justify-between gap-1 backdrop-blur-sm"
                    style={{
                      backgroundImage: calendarGradient,
                      borderLeftColor: "rgba(59, 130, 246, 0.6)",
                      backgroundColor: "rgba(85, 165, 220, 0.2)",
                    }}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {apt.patient.split(" ")[0]}
                      </p>
                    </div>

                    <div className="flex items-center gap-1 text-white whitespace-nowrap">
                      <span className="text-xs">
                        {apt.displayTime.split(" ")[0]}
                      </span>
                      <span className="text-xs opacity-80">|</span>
                      <span className="text-xs truncate max-w-[40px]">
                        {(() => {
                          const provName = providers.find(p => p.id === apt.provider_id || p.name === apt.provider || String(p.id) === String(apt.provider))?.name || String(apt.provider || "");
                          const parts = provName.split(" ");
                          return parts.length > 1 ? parts[1] : provName;
                        })()}
                      </span>
                    </div>
                  </div>
                ))}
                {dayAppointments.length > 2 && (
                  <div
                    className="text-xs text-center p-1 cursor-pointer text-white hover:bg-white/10 rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDayDoubleClick(day);
                    }}
                  >
                    +{dayAppointments.length - 2} more
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MonthView;

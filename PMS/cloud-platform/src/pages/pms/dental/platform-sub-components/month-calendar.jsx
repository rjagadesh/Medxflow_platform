import { useState, useEffect, useRef, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const MonthCalendarWidget = ({
  currentDate,
  setCurrentDate,
  lightGradient,
}) => {
  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const today = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();
  const currentDay = currentDate.getDate();

  // Get first day of month
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  // Get number of days in month
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Create array of days
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  // Create empty cells for days before first day
  const emptyCells = Array.from({ length: firstDay }, (_, i) => null);
  const allDays = [...emptyCells, ...monthDays];

  // Group days by week
  const weeks = [];
  for (let i = 0; i < allDays.length; i += 7) {
    weeks.push(allDays.slice(i, i + 7));
  }

  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const isToday = (day) => {
    return (
      day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear()
    );
  };

  const isSelected = (day) => {
    return day === currentDay;
  };

  return (
    <div className="bg-[#16375e] rounded-2xl p-4 shadow-xl border border-[#1e4270] hover:shadow-2xl transition-all duration-300">
      {/* Calendar Header with Month, Year and Date */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <button
            onClick={() => navigateMonth(-1)}
            className="p-2 hover:bg-[#1e4270] rounded-lg transition-colors"
          >
            <ChevronLeft className="text-white" size={20} />
          </button>

          <div className="text-center">
            <h3 className="text-xl font-bold text-white">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <div className="flex items-center justify-center gap-2 mt-1">
              <div
                className="px-3 py-1 rounded-lg text-sm font-medium backdrop-blur-sm"
                style={{
                  backgroundImage: lightGradient,
                  backgroundColor: "rgba(85, 165, 220, 0.2)",
                  color: "white",
                }}
              >
                <span className="font-bold">{currentDay}</span>
                <span className="ml-1">
                  {currentDate.toLocaleDateString("en-US", {
                    weekday: "short",
                  })}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => navigateMonth(1)}
            className="p-2 hover:bg-[#1e4270] rounded-lg transition-colors"
          >
            <ChevronRight className="text-white" size={20} />
          </button>
        </div>

        {/* Today Button */}
        
      </div>

      {/* Calendar Grid */}
      <div>
        {/* Day Headers */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map((day) => (
            <div key={day} className="text-center">
              <p className="text-sm text-[#808080] font-medium">{day}</p>
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="space-y-1">
          {weeks.map((week, weekIndex) => (
            <div key={weekIndex} className="grid grid-cols-7 gap-1">
              {week.map((day, dayIndex) => {
                if (day === null) {
                  return (
                    <div
                      key={`empty-${weekIndex}-${dayIndex}`}
                      className="h-8"
                    ></div>
                  );
                }

                const isTodayDay = isToday(day);
                const isSelectedDay = isSelected(day);
                const isWeekend = dayIndex === 0 || dayIndex === 6;

                return (
                  <button
                    key={day}
                    onClick={() => {
                      const newDate = new Date(currentYear, currentMonth, day);
                      setCurrentDate(newDate);
                    }}
                    className={`
                      h-8 rounded-lg text-sm font-medium transition-all duration-200
                      ${isTodayDay ? "ring-2 ring-[#4f8fce]" : ""}
                      ${
                        isSelectedDay
                          ? "text-white shadow-md scale-105"
                          : isWeekend
                          ? "text-white/70 hover:bg-[#1e4270]"
                          : "text-white hover:bg-[#1e4270]"
                      }
                    `}
                    style={{
                      backgroundImage: isSelectedDay ? lightGradient : "none",
                      backgroundColor: isSelectedDay
                        ? "rgba(85, 165, 220, 0.3)"
                        : "transparent",
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Month Navigation at Bottom */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1e4270]">
          <span className="text-sm text-[#808080]">
            {currentDate.toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => navigateMonth(-1)}
              className="px-3 py-1 text-sm rounded border border-[#1e4270] text-white hover:bg-[#1e4270] transition-colors"
            >
              Prev
            </button>
            <button
              onClick={() => navigateMonth(1)}
              className="px-3 py-1 text-sm rounded border border-[#1e4270] text-white hover:bg-[#1e4270] transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthCalendarWidget;
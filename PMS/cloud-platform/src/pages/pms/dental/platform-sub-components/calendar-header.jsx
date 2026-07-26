import {
  ChevronLeft,
  ChevronRight
} from "lucide-react";

const CalendarHeader = ({
  currentDate,
  formatDate,
  navigateDate,
  activeView,
  setActiveView,
  lightGradient,
  setCurrentDate,
}) => {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
      <div className="flex flex-col">
        <h1 className="text-2xl text-white">Appointment Calendar</h1>
        <p className="text-[#808080]">{formatDate()}</p>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* <button
          onClick={() => navigateDate(-1)}
          className="px-4 py-2 border border-[#1e4270] rounded-lg hover:bg-[#0d2b52] flex items-center gap-2 text-white hover:text-white transition-colors"
        >
          <ChevronLeft size={20} />
          Previous
        </button> */}

        <div className="flex border border-[#1e4270] rounded-lg overflow-hidden">
          {["DAY", "WEEK", "MONTH"].map((view) => (
            <button
              key={view}
              onClick={() => setActiveView(view.toLowerCase())}
              className={`px-4 py-2 border-r border-[#1e4270] last:border-r-0 transition-all duration-200 ${
                activeView === view.toLowerCase()
                  ? "text-white shadow-inner"
                  : "bg-[#0d2b52] text-white hover:bg-[#1e4270]"
              }`}
              style={{
                border:
                  activeView === view.toLowerCase()
                    ? lightGradient
                    : "none",
                backgroundColor:
                  activeView === view.toLowerCase()
                    ? "rgba(85, 165, 220, 0.2)"
                    : "transparent",
              }}
            >
              {view}
            </button>
          ))}
        </div>

        <button
          onClick={() => setCurrentDate(new Date())}
          className="px-4 py-2 text-white hover:bg-[#0d2b52] rounded-lg border border-cyan-500 hover:border-cyan-400 transition-colors backdrop-blur-sm"
          style={{}}
        >
          Today
        </button>
        {/* <button
          onClick={() => navigateDate(1)}
          className="px-4 py-2 border border-[#1e4270] rounded-lg hover:bg-[#0d2b52] flex items-center gap-2 text-white hover:text-white transition-colors"
        >
          Next
          <ChevronRight size={20} />
        </button> */}
      </div>
    </div>
  );
};

export default CalendarHeader;
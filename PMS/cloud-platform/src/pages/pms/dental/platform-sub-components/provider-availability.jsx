import { X, Users } from "lucide-react";
import { useGetProviderAvailability } from "@/hooks/query/pms/patient/useGetMinimalProvider";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";

const ProviderAvailabilityPanel = ({
  providers,
  lightGradient,
  isOpen,
  onClose,
  currentDate = new Date(),
}) => {
  const formatLocalDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formattedDate = formatLocalDate(currentDate);

  const { data: availabilityData, isLoading } = useGetProviderAvailability({
    date: formattedDate,
  });

  const convert24to12 = (time24) => {
    if (!time24) return "";
    const [hourStr, minStr] = time24.split(":");
    const hour = parseInt(hourStr);
    const minute = parseInt(minStr);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const displayProviders = useMemo(() => {
    if (!availabilityData) return providers.slice(1); // Fallback to list without slots if no data

    return providers.slice(1).map((provider) => {
      const availInfo = availabilityData.find(
        (a) => a.provider_id === provider.id
      );
      let slots = [];
      if (availInfo && availInfo.week) {
        availInfo.week.forEach((w) => {
          if (w["Available Slots"]) {
            w["Available Slots"].forEach((s) => {
              const start = convert24to12(s.start);
              const end = convert24to12(s.end);
              slots.push(`${start} - ${end}`);
            });
          }
        });
      }
      return {
        ...provider,
        slots,
        isAvailable: slots.length > 0,
      };
    });
  }, [providers, availabilityData]);

  const totalAvailableSlots = displayProviders.reduce(
    (acc, curr) => acc + (curr.slots ? curr.slots.length : 0),
    0
  );

  return (
    <div
      className={`transition-all duration-300 ${
        isOpen ? "w-80 rounded-r-2xl" : "w-0"
      } overflow-hidden bg-[#16375e] border-l border-[#1e4270] h-[calc(88.5vh-30px)]`}
    >
      <div
        className={`w-80 flex flex-col ${
          isOpen ? "opacity-100 h-full" : "opacity-0 h-0"
        } transition-opacity duration-300`}
      >
        {/* Header */}
        <div className="p-6 border-b border-[#1e4270] flex justify-between items-center">
          <h3 className="text-xl text-white flex items-center gap-2 flex-1">
            <Users size={20} />
            Provider Availability
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#1e4270] rounded-lg transition-colors ml-4"
          >
            <X className="text-white" size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-4">
            {isLoading ? (
               <div className="flex flex-col gap-3">
                 {[1, 2, 3].map((i) => (
                   <div key={i} className="h-32 bg-[#0d2b52] border border-[#1e4270] rounded-lg animate-pulse"></div>
                 ))}
               </div>
            ) : (
              displayProviders.map((provider) => (
                <div
                  key={provider.id || Math.random()}
                  className="p-4 bg-[#0d2b52] rounded-lg border border-[#1e4270] hover:border-[#4f8fce] transition-all duration-200"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="h-12 w-12 rounded-full flex items-center justify-center text-lg shadow-md"
                      style={{
                        color: "white",
                        backgroundColor: "rgba(85, 165, 220, 0.2)",
                      }}
                    >
                      {provider.avatar ||
                        (provider.name
                          ? provider.name.charAt(0).toUpperCase()
                          : "U")}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white">
                        {provider.name || "Unknown Provider"}
                      </p>
                      
                    </div>
                    <span
                      className="px-3 py-1 rounded-full text-sm font-medium"
                      style={{
                        color: "white",
                        backgroundColor: "rgba(85, 165, 220, 0.2)",
                      }}
                    >
                      {provider.slots ? provider.slots.length : 0} slots
                    </span>
                  </div>

                  {/* Availability Slots */}
                  <div className="space-y-2">
                    {/* <p className="text-sm text-white/70">
                      {currentDate.toLocaleDateString()}'s Availability
                    </p> */}
                    <div className="grid grid-cols-1 gap-2">
                      {provider.slots && provider.slots.length > 0 ? (
                        provider.slots.map((slot, index) => (
                          <span
                            key={index}
                            className="px-3 py-1.5 text-xs text-center rounded border border-[#1e4270] text-white/80 hover:border-[#4f8fce] hover:text-white cursor-pointer transition-colors bg-[#16375e]"
                          >
                            {slot}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-white/50 italic">
                          No slots available
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status */}
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#1e4270]">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          provider.isAvailable ? "bg-green-500" : "bg-red-500"
                        } ${provider.isAvailable ? "animate-pulse" : ""}`}
                      ></div>
                      <span className="text-sm text-white/70">
                        {provider.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    {provider.isAvailable && (
                      <button
                        className="text-sm px-3 py-1 rounded border border-[#1e4270] hover:border-[#4f8fce] text-white/80 hover:text-white transition-colors"
                        style={{
                          backgroundImage: lightGradient,
                          backgroundColor: "rgba(85, 165, 220, 0.1)",
                        }}
                      >
                        Book Slot
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Today's Schedule Summary */}
          {!isLoading && (
            <div className="mt-8 p-4 bg-[#0d2b52] rounded-lg border border-[#1e4270]">
              <h4 className="text-white mb-3 font-medium">
                Schedule Summary ({currentDate.toLocaleDateString()})
              </h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Providers Checked</span>
                  <span className="text-white">{displayProviders.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">Total Available Slots</span>
                  <span className="text-white">{totalAvailableSlots}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProviderAvailabilityPanel;

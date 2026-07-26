import {
  ChevronRight,
  Calendar as CalendarIcon,
  List,
  Users,
  DoorOpen,
  MapPin
} from "lucide-react";
import { useState } from "react";
import MonthCalendarWidget from "./month-calendar";
import { toaster } from "@/components/ui/toaster"; // ← Add this import

const LeftPanel = ({
  currentDate,
  setCurrentDate,
  lightGradient,
  providers,
  selectedProviders,
  setSelectedProviders,
  providerSearch,
  setProviderSearch,
  mainViewMode,
  setMainViewMode
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [openSections, setOpenSections] = useState({
    providers: false,
    rooms: false,
    serviceLocation: false
  });

  const toggleSection = (section) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const isAllSelected = selectedProviders.includes("all");

  const handleAllProvidersToggle = () => {
    if (providers.length <= 1) return;
    setSelectedProviders((prev) => (prev.includes("all") ? [] : ["all"]));
  };

  return (
    <>
      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #444444;
          border-radius: 3px;
          transition: background 0.2s ease;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555555;
        }
        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #444444 transparent;
        }
      `}</style>

      <div 
        className={`flex flex-col gap-4 h-[calc(90vh-40px)] transition-all duration-300 ease-in-out ${
          isExpanded ? 'w-[350px]' : 'w-[80px]'
        }`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        
        {/* View Toggle */}
        <div className="flex bg-[#0d2b52] p-1 rounded-xl border border-[#1e4270] shrink-0 overflow-hidden">
          {isExpanded ? (
            <>
              <button
                onClick={() => setMainViewMode("calendar")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mainViewMode === "calendar"
                    ? "bg-[#1e4270] text-white shadow-lg"
                    : "text-[#808080] hover:text-white"
                }`}
              >
                <CalendarIcon size={16} />
                <span className="whitespace-nowrap">Calendar</span>
              </button>
              <button
                onClick={() => setMainViewMode("list")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  mainViewMode === "list"
                    ? "bg-[#1e4270] text-white shadow-lg"
                    : "text-[#808080] hover:text-white"
                }`}
              >
                <List size={16} />
                <span className="whitespace-nowrap">List View</span>
              </button>
            </>
          ) : (
            <div className="flex flex-col gap-1 w-full py-1 px-2">
              <button
                onClick={() => setMainViewMode("calendar")}
                className={`flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${
                  mainViewMode === "calendar"
                    ? "bg-[#1e4270] text-white"
                    : "text-[#808080] hover:text-white hover:bg-[#2a2a2a]"
                }`}
                title="Calendar View"
              >
                <CalendarIcon size={18} />
              </button>
              <button
                onClick={() => setMainViewMode("list")}
                className={`flex items-center justify-center p-2.5 rounded-lg transition-all duration-200 ${
                  mainViewMode === "list"
                    ? "bg-[#1e4270] text-white"
                    : "text-[#808080] hover:text-white hover:bg-[#2a2a2a]"
                }`}
                title="List View"
              >
                <List size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Calendar Widget - Only visible when expanded */}
        {isExpanded && (
          <div className="flex-shrink-0 animate-in fade-in slide-in-from-left-2 duration-300">
            <MonthCalendarWidget
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              lightGradient={lightGradient}
            />
          </div>
        )}

        {/* Main Collapsible Panel */}
        <div className="bg-[#16375e] rounded-2xl p-4 shadow-xl border border-[#1e4270] hover:shadow-2xl transition-all duration-300 flex-1 overflow-hidden min-h-0 flex flex-col">
          
          {isExpanded ? (
            <div className="overflow-y-auto custom-scrollbar flex-1 pr-1">
              {/* Providers Section */}
              <div className="mb-5">
                <div className="flex items-center justify-between">
                  <div 
                    className="flex items-center cursor-pointer hover:bg-[#1e4270] p-2 rounded-lg transition-colors flex-1"
                    onClick={() => toggleSection('providers')}
                  >
                    <ChevronRight
                      size={20}
                      className={`transition-transform mr-2 text-white flex-shrink-0 ${
                        openSections.providers ? "rotate-90" : ""
                      }`}
                    />
                    <span className="text-white font-medium text-base">Providers</span>
                  </div>

                  {/* All Providers Checkbox */}
                  <label
                    className={`flex items-center pr-2 ${
                      providers.length <= 1
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleAllProvidersToggle}
                      disabled={providers.length <= 1}
                      className="mr-2 rounded text-cyan-500 w-4 h-4 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <span
                      className={`text-white text-sm whitespace-nowrap ${
                        providers.length <= 1 ? "opacity-50" : ""
                      }`}
                    >
                      All
                    </span>
                  </label>
                </div>
                
                {openSections.providers && (
                  <div className="mt-4 pl-8 space-y-3 animate-in slide-in-from-top duration-200">
                    <input
                      type="text"
                      placeholder="Search providers..."
                      value={providerSearch}
                      onChange={(e) => setProviderSearch(e.target.value)}
                      className="w-full px-3 py-2 bg-[#0d2b52] border border-[#1e4270] rounded-lg text-white text-sm placeholder-[#808080] focus:outline-none focus:border-[#4f8fce] transition-colors"
                    />

                    <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                      {providers
                        .slice(1)
                        .filter((provider) =>
                          provider.name.toLowerCase().includes(providerSearch.toLowerCase())
                        )
                        .map((provider) => (
                          <label
                            key={provider.id}
                            className="flex items-center p-2 cursor-pointer hover:bg-[#1e4270] rounded-lg transition-colors text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={selectedProviders.includes(provider.id)}
                              disabled={isAllSelected}
                              onChange={() => {
                                setSelectedProviders((prev) => {
                                  // If "all" is currently selected, switch to individual
                                  if (prev.includes("all")) {
                                    return [provider.id];
                                  }

                                  // If already selected, unselect
                                  if (prev.includes(provider.id)) {
                                    return prev.filter((p) => p !== provider.id);
                                  }

                                  // Count current individual selections
                                  const currentCount = prev.filter(p => p !== "all").length;

                                  // Block if trying to select more than 5
                                  if (currentCount >= 5) {
                                    toaster.create({
                                      title: "Selection Limit Reached",
                                      description: "You can only select up to 5 providers for filtering.",
                                      type: "error",
                                      duration: 4000,
                                    });
                                    return prev; // no change
                                  }

                                  // Add the provider
                                  return [...prev, provider.id];
                                });
                              }}
                              className="mr-3 rounded text-cyan-500 w-4 h-4"
                            />
                            <span className={`truncate ${isAllSelected ? 'text-gray-500' : 'text-white'}`}>
                              {provider.name}
                              {provider.specialty && (
                                <span className="text-gray-400 ml-2 text-xs">
                                  • {provider.specialty}
                                </span>
                              )}
                            </span>
                          </label>
                        ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Rooms & Service Location sections remain unchanged */}
              {/* ... */}
              {/* Rooms Section */}
              <div className="mb-5">
                <div
                  className="flex items-center cursor-pointer hover:bg-[#1e4270] p-2 rounded-lg transition-colors"
                  onClick={() => toggleSection("rooms")}
                >
                  <ChevronRight
                    size={20}
                    className={`transition-transform mr-2 text-white flex-shrink-0 ${
                      openSections.rooms ? "rotate-90" : ""
                    }`}
                  />
                  <span className="text-white font-medium text-base">
                    Rooms
                  </span>
                </div>

                {openSections.rooms && (
                  <div className="mt-3 pl-8">
                    <p className="text-gray-400 text-sm">No rooms configured</p>
                  </div>
                )}
              </div>

              {/* Service Location Section */}
              <div>
                <div
                  className="flex items-center cursor-pointer hover:bg-[#1e4270] p-2 rounded-lg transition-colors"
                  onClick={() => toggleSection("serviceLocation")}
                >
                  <ChevronRight
                    size={20}
                    className={`transition-transform mr-2 text-white flex-shrink-0 ${
                      openSections.serviceLocation ? "rotate-90" : ""
                    }`}
                  />
                  <span className="text-white font-medium text-base">
                    Service Location
                  </span>
                </div>

                {openSections.serviceLocation && (
                  <div className="mt-3 pl-8">
                    <p className="text-gray-400 text-sm">
                      No locations configured
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Collapsed icons remain unchanged */
            <div className="flex flex-col gap-6 items-center justify-start py-6">
              <button
                className="p-4 hover:bg-[#1e4270] rounded-xl transition-all group"
                title="Providers"
                onClick={() => setIsExpanded(true)}
              >
                <Users size={24} className="text-[#4f8fce]" />
              </button>
              <button
                className="p-4 hover:bg-[#1e4270] rounded-xl transition-all group"
                title="Rooms"
              >
                <DoorOpen size={24} className="text-[#808080]" />
              </button>
              <button
                className="p-4 hover:bg-[#1e4270] rounded-xl transition-all group"
                title="Service Location"
              >
                <MapPin size={24} className="text-[#808080]" />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default LeftPanel;

import { Plus, X, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { toaster } from "@/components/ui/toaster";

const ProviderFilterBar = ({
  providers,
  selectedProviders,
  setSelectedProviders,
  setShowAppointmentModal,
  lightGradient,
  mainViewMode,
  onRunEligibilityCheck, // ← NEW: callback from parent to run the real mutation
}) => {
  const [showMoreDropdown, setShowMoreDropdown] = useState(false);

  const MAX_VISIBLE = 5;

  const handleRemoveProvider = (id) => {
    if (id === "all") {
      setSelectedProviders([]);
    } else {
      setSelectedProviders((prev) => prev.filter((p) => p !== id));
    }
  };

  const getSelectedProviderObjects = () => {
    if (selectedProviders.includes("all")) {
      return [{ id: "all", name: "All Providers" }];
    }
    return providers.filter((p) => selectedProviders.includes(p.id));
  };

  const activeProviders = getSelectedProviderObjects();
  const visibleProviders = activeProviders.slice(0, MAX_VISIBLE);
  const hiddenProviders = activeProviders.slice(MAX_VISIBLE);
  const hasMore = hiddenProviders.length > 0;

  const isListView = mainViewMode === "list";

  return (
    <div className="flex items-center justify-between mb-6 relative">
      {/* Selected Providers Pills */}
      <div className="flex flex-wrap gap-2 items-center flex-1 mr-4">
        {activeProviders.length > 0 ? (
          <>
            {visibleProviders.map((provider) => (
              <div
                key={provider.id}
                className="px-4 py-2 rounded-full text-white text-sm border border-[#1e4270] flex items-center gap-2 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-[#4f8fce]"
                style={{
                  backgroundColor: "rgba(85, 165, 220, 0.2)",
                  borderColor: "rgba(85, 165, 220, 0.5)",
                }}
              >
                <span className="font-medium">{provider.name}</span>
                <button
                  onClick={() => handleRemoveProvider(provider.id)}
                  className="hover:bg-white/10 rounded-full p-0.5 transition-colors"
                >
                  <X size={14} className="text-white/70 hover:text-white" />
                </button>
              </div>
            ))}

            {hasMore && (
              <div className="relative">
                <button
                  onClick={() => setShowMoreDropdown(!showMoreDropdown)}
                  className="px-4 py-2 rounded-full text-white text-sm border border-[#1e4270] flex items-center gap-1.5 shadow-sm backdrop-blur-sm transition-all duration-200 hover:border-[#4f8fce]"
                  style={{
                    backgroundColor: "rgba(85, 165, 220, 0.15)",
                    borderColor: "rgba(85, 165, 220, 0.4)",
                  }}
                >
                  <span className="font-medium">
                    +{hiddenProviders.length} more
                  </span>
                  {showMoreDropdown ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>

                {showMoreDropdown && (
                  <div className="absolute top-full mt-2 left-0 bg-[#16375e] border border-[#1e4270] rounded-xl shadow-2xl py-2 min-w-[220px] z-50">
                    {hiddenProviders.map((provider) => (
                      <div
                        key={provider.id}
                        className="px-4 py-2.5 flex items-center justify-between hover:bg-[#1e4270] transition-colors"
                      >
                        <span className="text-white text-sm truncate pr-2">
                          {provider.name}
                        </span>
                        <button
                          onClick={() => {
                            handleRemoveProvider(provider.id);
                            setShowMoreDropdown(false);
                          }}
                          className="hover:bg-red-900/30 rounded p-1 transition-colors"
                        >
                          <X
                            size={14}
                            className="text-white/70 hover:text-white"
                          />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        ) : (
          <p className="text-[#808080] text-sm italic">No providers selected</p>
        )}
      </div>

      {/* Right-side Buttons */}
      <div className="flex items-center gap-3">
        {/* Run Eligibility Check Button — Only in List View */}
        {isListView && (
          <button
            onClick={onRunEligibilityCheck} // ← Use the real handler from parent
            className="px-5 py-2 rounded-lg text-white flex items-center gap-2 transition-all duration-200 hover:shadow-lg whitespace-nowrap"
            style={{
              backgroundImage: lightGradient,
              backgroundColor: "rgba(85, 165, 220, 0.3)",
            }}
          >
            Run Eligibility Check For All
          </button>
        )}

        {/* Schedule Appointment Button */}
        <div className="relative">
          <button
            onClick={() => {
              const individualCount = selectedProviders.filter(
                (p) => p !== "all"
              ).length;
              if (!selectedProviders.includes("all") && individualCount > 5) {
                toaster.create({
                  title: "Too Many Providers",
                  description:
                    "Please select 5 or fewer providers to schedule an appointment.",
                  type: "error",
                  duration: 4000,
                });
                return;
              }
              setShowAppointmentModal(true);
            }}
            disabled={selectedProviders.length === 0}
            className="px-6 py-2 rounded-lg text-white flex items-center gap-2 transition-all duration-200 hover:shadow-lg whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundImage:
                selectedProviders.length === 0 ? "none" : lightGradient,
              backgroundColor:
                selectedProviders.length === 0
                  ? "#1e4270"
                  : "rgba(85, 165, 220, 0.3)",
            }}
          >
            <Plus size={20} />
            Schedule Appointment
          </button>

          {/* Warning if more than 5 individual providers selected */}
          {!selectedProviders.includes("all") &&
            selectedProviders.filter((p) => p !== "all").length > 5 && (
              <p className="text-red-400 text-xs mt-2 text-right">
                Max 5 providers allowed
              </p>
            )}
        </div>
      </div>

      {/* Click outside to close "more" dropdown */}
      {showMoreDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowMoreDropdown(false)}
        />
      )}
    </div>
  );
};

export default ProviderFilterBar;

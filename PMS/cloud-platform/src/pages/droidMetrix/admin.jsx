import AIAgents from "@/features/droid-metrix/agents";
import License from "@/features/droid-metrix/license";
import { Switch } from "@chakra-ui/react";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";

export default function DroidMetrixAdmin() {
  const [expandedAgent, setExpandedAgent] = useState(null);

  const agentForm = useForm({
    defaultValues: {
      agentName: "Letter Automation",
      taskId: "",
      ownerMail: "owner1@example.com",
      department: "Referrals",
      automationProcess: "",
      displayOnDashboard: true,
      frequency: "Daily",
    },
  });

  const aiAgentTabs = [
    { id: "ai-agent-settings", label: "AI Agent Settings" },
    { id: "license", label: "License" },
    { id: "user-management", label: "User Management" },
    { id: "ai-agent-schedule", label: "AI Agent Schedule" },
  ];

  const [activeAITab, setActiveAITab] = useState("ai-agent-settings");

  const onAgentSubmit = (data) => {
    console.log("Updating AI Agent:", data);
  };

  return (
    <>
      <div className="max-w-full mx-auto">
        <div className="bg-droidal-black-300 shadow-lg min-h-[80vh] rounded-lg overflow-hidden">
          <>
            {/* AI Agent Sub-tabs */}
            <div className="flex border-b bg-droidal-black-300">
              {aiAgentTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveAITab(tab.id)}
                  className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
                    activeAITab === tab.id
                      ? "bg-slate-800 text-white"
                      : "text-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {tab.id === "ai-agent-settings" && (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372-.836 2.942.734 2.106 2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {tab.id === "license" && (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2a1 1 0 000 2h6a1 1 0 100-2H7zm6 7a1 1 0 011 1v3a1 1 0 11-2 0v-3a1 1 0 011-1zm-3 3a1 1 0 100 2h.01a1 1 0 100-2H10zm-4 1a1 1 0 011-1h.01a1 1 0 110 2H7a1 1 0 01-1-1zm1-4a1 1 0 100 2h.01a1 1 0 100-2H7zm2 0a1 1 0 100 2h.01a1 1 0 100-2H9zm2 0a1 1 0 100 2h.01a1 1 0 100-2H11z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {tab.id === "user-management" && (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                  )}
                  {tab.id === "ai-agent-schedule" && (
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-8">
              {activeAITab === "ai-agent-settings" && <AIAgents />}

              {activeAITab === "license" && <License />}
            </div>
          </>
        </div>
      </div>
    </>
  );
}

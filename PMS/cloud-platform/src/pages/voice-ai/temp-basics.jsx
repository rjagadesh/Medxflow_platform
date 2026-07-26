import React, { useMemo, useState } from "react";
import {
  Bot,
  ChevronDown,
  Circle,
  CircleDot,
  Copy,
  Eye,
  EyeOff,
  Info,
  KeyRound,
  MessageCircle,
  Pencil,
  Phone,
  PhoneCall,
  Play,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";

const tabs = ["Basic", "Call Handling", "Security", "Integrations"];

const versionRows = [
  {
    version: "v1.0",
    type: "Production",
    status: "Active",
    createdBy: "Droid_HBE",
    createdOn: "Feb 18, 2025",
    rowAction: "trash",
  },
  {
    version: "v0.9",
    type: "Testing",
    status: "Paused",
    createdBy: "Droid_HBE",
    createdOn: "Feb 10, 2025",
    rowAction: "play",
  },
  {
    version: "v0.8",
    type: "Draft",
    status: "Draft",
    createdBy: "Droid_HBE",
    createdOn: "Jan 28, 2025",
    rowAction: "trash",
  },
];

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

function PanelCard({ className, children }) {
  return (
    <article
      className={joinClasses(
        "rounded-2xl border border-[#2f4d7a]/60 bg-[linear-gradient(160deg,#0d1430_0%,#091126_55%,#080d1e_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_24px_rgba(27,115,255,0.18)] md:p-5",
        className,
      )}
    >
      {children}
    </article>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  iconTone = "text-[#36a9ff]",
  action,
}) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        {React.createElement(Icon, {
          className: joinClasses("h-5 w-5", iconTone),
        })}
        <h2 className="text-[18px] font-semibold leading-none text-white lg:text-[22px]">
          {title}
        </h2>
      </div>
      {action}
    </div>
  );
}

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-1.5 block text-[12px] font-medium tracking-[0.01em] text-[#aeb9d6] lg:text-[14px]">
      {children}
      {required ? <span className="ml-1 text-[#ff4f7b]">*</span> : null}
    </label>
  );
}

function FieldShell({ children, className }) {
  return (
    <div
      className={joinClasses(
        "flex h-11 items-center rounded-[10px] border border-[#38598d]/80 bg-[linear-gradient(180deg,#101a3a_0%,#0b1330_100%)] px-3 text-[15px] text-white shadow-[inset_0_1px_1px_rgba(255,255,255,0.04)] lg:h-12 lg:text-[17px]",
        className,
      )}
    >
      {children}
    </div>
  );
}

function SelectLike({ value, left, right }) {
  return (
    <FieldShell className="justify-between gap-2">
      <div className="flex min-w-0 items-center gap-2">
        {left}
        <span className="truncate">{value}</span>
      </div>
      {right || <ChevronDown className="h-4 w-4 shrink-0 text-[#9fb0d5]" />}
    </FieldShell>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onChange}
      className={joinClasses(
        "relative inline-flex h-7 w-12 items-center rounded-full border border-[#35548a] transition",
        checked
          ? "bg-[linear-gradient(180deg,#1a6dff_0%,#1f9bff_100%)] shadow-[0_0_12px_rgba(44,146,255,0.5)]"
          : "bg-[#1d2a44]",
      )}
    >
      <span
        className={joinClasses(
          "inline-block h-5 w-5 rounded-full bg-white transition-transform",
          checked ? "translate-x-6" : "translate-x-1",
        )}
      />
    </button>
  );
}

function StatusBadge({ value }) {
  const variants = {
    Active: "border-[#1f9f67] bg-[#103322] text-[#4be08e]",
    Paused: "border-[#9a7a17] bg-[#34290f] text-[#f5bf35]",
    Draft: "border-[#66739a] bg-[#2a334f] text-[#c3ccdf]",
  };

  return (
    <span
      className={joinClasses(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[14px] font-medium lg:text-[16px]",
        variants[value] || variants.Draft,
      )}
    >
      <span className="h-2.5 w-2.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

function IconActionButton({ icon: Icon, label, className }) {
  return (
    <button
      type="button"
      aria-label={label}
      className={joinClasses(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#3a588d] bg-[#0f1b3a] text-[#c5d2ef] transition hover:text-white",
        className,
      )}
    >
      {React.createElement(Icon, { className: "h-4 w-4" })}
    </button>
  );
}

function TempBasics() {
  const [activeTab, setActiveTab] = useState("Basic");
  const [weekendSupport, setWeekendSupport] = useState(true);
  const [continueRecording, setContinueRecording] = useState(true);
  const [callSummary, setCallSummary] = useState(false);
  const [callRecording, setCallRecording] = useState(true);

  const tableRows = useMemo(() => versionRows, []);

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-[linear-gradient(180deg,#040917_0%,#030710_100%)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-[#1b54ff]/20 blur-3xl" />
        <div className="absolute -right-20 top-36 h-80 w-80 rounded-full bg-[#0bb7ff]/15 blur-3xl" />
      </div>

      <div className="relative mx-auto flex w-full max-w-[1320px] flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-[#2e4b79]/60 bg-[linear-gradient(160deg,#0c142f_0%,#081128_60%,#070d1f_100%)] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_0_24px_rgba(27,115,255,0.15)]">
          <div className="flex flex-wrap items-start justify-between gap-4 lg:items-center">
            <div className="flex min-w-0 items-start gap-3">
              <div className="inline-flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#3a5f95] bg-[linear-gradient(180deg,#19356d_0%,#0f244f_100%)] shadow-[0_0_14px_rgba(20,121,255,0.35)]">
                <Settings2 className="h-7 w-7 text-[#78d1ff]" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-3">
                  <h1 className="text-[28px] font-semibold leading-none tracking-tight text-white sm:text-[34px] xl:text-[42px]">
                    Agent Configuration
                  </h1>
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#2a8b55] bg-[#103725] px-3 py-1 text-[14px] font-medium text-[#3ddd84]">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#33de80]" />
                    Active
                  </span>
                </div>
                <p className="mt-1 text-[13px] text-[#8ea3c8] sm:text-[15px] lg:text-[18px]">
                  Create and manage your AI voice agent settings
                </p>
              </div>
            </div>

            <div className="flex w-full flex-wrap items-center justify-start gap-2 lg:w-auto lg:justify-end">
              <button
                type="button"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#33568d] bg-[linear-gradient(180deg,#111e3f_0%,#0c1632_100%)] px-3 text-[18px] text-white"
              >
                <span>v1.0</span>
                <span className="rounded-full border border-[#2a8b55] bg-[#123928] px-2 py-0.5 text-[14px] text-[#3ddd84]">
                  Active
                </span>
                <ChevronDown className="h-4 w-4 text-[#afc1e2]" />
              </button>

              <button
                type="button"
                className="inline-flex h-12 items-center rounded-xl border border-[#2f5f99] bg-[#0b1737] px-5 text-[20px] font-medium text-white"
              >
                Save as New Version
              </button>

              <button
                type="button"
                className="inline-flex h-12 items-center gap-2 rounded-xl border border-[#2b7eff] bg-[linear-gradient(180deg,#2b84ff_0%,#1a58ff_100%)] px-5 text-[22px] font-semibold text-white shadow-[0_0_20px_rgba(41,131,255,0.45)]"
              >
                <Search className="h-5 w-5" />
                Save Changes
              </button>
            </div>
          </div>

          <nav
            aria-label="Configuration tabs"
            className="mt-4 border-b border-[#223a64]/70"
          >
            <ul className="flex min-w-max items-center gap-6 overflow-x-auto pb-1.5">
              {tabs.map((tab) => {
                const active = activeTab === tab;
                return (
                  <li key={tab}>
                    <button
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={joinClasses(
                        "relative pb-2 text-[18px] transition sm:text-[22px]",
                        active
                          ? "text-white"
                          : "text-[#8f9fbe] hover:text-white",
                      )}
                    >
                      {tab}
                      {active ? (
                        <span className="absolute inset-x-0 -bottom-[1px] h-[2px] bg-[#22a5ff] shadow-[0_0_12px_rgba(34,165,255,0.6)]" />
                      ) : null}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>
        </header>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.62fr_1fr]">
          <div className="flex min-w-0 flex-col gap-4">
            <PanelCard>
              <SectionTitle icon={Settings2} title="Basic Agent Settings" />

              <form
                className="grid gap-4 lg:grid-cols-[130px_minmax(0,1fr)]"
                onSubmit={(e) => e.preventDefault()}
              >
                <div className="space-y-2">
                  <div className="overflow-hidden rounded-xl border border-[#3d5f96] bg-[#08112a]">
                    <img
                      src="https://placehold.co/200x260/png"
                      alt="Agent avatar"
                      className="h-[138px] w-full object-cover"
                    />
                  </div>
                  <button
                    type="button"
                    className="w-full rounded-[10px] border border-[#396097] bg-[#0e1a37] px-2 py-2 text-[15px] font-medium"
                  >
                    Change Photo
                  </button>
                </div>

                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <FieldLabel required>Agent Name</FieldLabel>
                      <FieldShell>
                        <span className="truncate">Insurance - Testing</span>
                      </FieldShell>
                    </div>

                    <div>
                      <FieldLabel>Voice Gender</FieldLabel>
                      <SelectLike value="Male" />
                    </div>

                    <div>
                      <FieldLabel required>Select Voice</FieldLabel>
                      <SelectLike
                        value="Emma (Natural)"
                        right={
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-[#3b629a] bg-[#102145] px-2 py-1 text-[14px] text-[#87c3ff]"
                          >
                            <Play className="h-3.5 w-3.5" />
                            Test
                          </button>
                        }
                      />
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[220px_minmax(0,1fr)]">
                    <div>
                      <FieldLabel required>Language</FieldLabel>
                      <SelectLike
                        value="English (US)"
                        left={
                          <span className="text-[12px] font-semibold tracking-[0.08em]">
                            US
                          </span>
                        }
                      />
                    </div>

                    <div>
                      <FieldLabel required>Call Direction</FieldLabel>
                      <div className="flex h-11 items-center gap-5 rounded-[10px] border border-[#38598d]/80 bg-[linear-gradient(180deg,#101a3a_0%,#0b1330_100%)] px-3 text-[18px] lg:h-12 lg:text-[20px]">
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-white"
                        >
                          <CircleDot className="h-5 w-5 text-[#2ea9ff]" />
                          Inbound
                        </button>
                        <button
                          type="button"
                          className="inline-flex items-center gap-2 text-[#c1cee7]"
                        >
                          <Circle className="h-5 w-5" />
                          Outbound
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                    <div>
                      <FieldLabel>Timezone</FieldLabel>
                      <SelectLike
                        value="(UTC+5:30) India Standard Time"
                        left={<PhoneCall className="h-4 w-4 text-[#9bb2dc]" />}
                      />
                    </div>

                    <div className="min-w-[230px]">
                      <FieldLabel>Working Hours</FieldLabel>
                      <FieldShell className="justify-between gap-2">
                        <div className="flex items-center gap-2 text-[18px] lg:text-[22px]">
                          <span>24/7</span>
                          <Toggle
                            checked={weekendSupport}
                            onChange={() => setWeekendSupport((v) => !v)}
                          />
                        </div>
                        <div className="inline-flex items-center gap-1 text-[16px] text-[#d8e4ff] lg:text-[19px]">
                          Weekend Support
                          <Info className="h-4 w-4 text-[#8ca4d1]" />
                        </div>
                      </FieldShell>
                    </div>
                  </div>
                </div>
              </form>
            </PanelCard>

            <PanelCard>
              <SectionTitle icon={PhoneCall} title="Call Settings" />

              <section
                className="grid gap-3 lg:grid-cols-3"
                aria-label="Call settings panels"
              >
                <article className="rounded-xl border border-[#325284] bg-[linear-gradient(180deg,#0f1935_0%,#0c1630_100%)] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-[18px] font-semibold lg:text-[20px]">
                      Call Forwarding
                    </h3>
                    <Toggle checked={true} onChange={() => {}} />
                  </div>

                  <FieldLabel>Forward To</FieldLabel>
                  <SelectLike
                    value="+1 (555) 987-6543"
                    left={
                      <span className="text-[12px] font-semibold tracking-[0.08em]">
                        US
                      </span>
                    }
                  />

                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div>
                      <FieldLabel>Retry Attempts</FieldLabel>
                      <FieldShell className="justify-between">
                        <span>2</span>
                        <span className="text-[#8ea3cb]">�</span>
                      </FieldShell>
                    </div>
                    <div>
                      <FieldLabel>Delay (min)</FieldLabel>
                      <FieldShell>
                        <span>1</span>
                      </FieldShell>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 text-[14px] text-[#d4ddf5] lg:text-[16px]">
                    <Toggle
                      checked={continueRecording}
                      onChange={() => setContinueRecording((v) => !v)}
                    />
                    Continue Recording after transfer
                  </div>
                </article>

                <article className="rounded-xl border border-[#325284] bg-[linear-gradient(180deg,#0f1935_0%,#0c1630_100%)] p-3">
                  <div className="mb-2 flex items-center gap-2">
                    <h3 className="text-[18px] font-semibold lg:text-[20px]">
                      End Call Keys
                    </h3>
                    <Info className="h-4 w-4 text-[#8ea3cb]" />
                  </div>

                  <div className="grid grid-cols-4 gap-2">
                    {["0", "#", "1", "9"].map((keyVal) => (
                      <button
                        key={keyVal}
                        type="button"
                        className="h-9 rounded-[9px] border border-[#36578c] bg-[#17264a] text-[18px] font-medium"
                      >
                        {keyVal}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2">
                    <FieldLabel>Fallback Action</FieldLabel>
                    <SelectLike value="Voicemail" />
                  </div>

                  <div className="mt-2">
                    <FieldLabel>Max Retry</FieldLabel>
                    <SelectLike value="1" />
                  </div>
                </article>

                <article className="rounded-xl border border-[#325284] bg-[linear-gradient(180deg,#0f1935_0%,#0c1630_100%)] p-3">
                  <h3 className="mb-2 text-[18px] font-semibold lg:text-[20px]">
                    Advanced
                  </h3>
                  <ul className="space-y-3 text-[18px] leading-6 text-[#dbe5fa] lg:text-[32px] lg:leading-[1.05]">
                    <li className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#3aa8ff]" />
                      Noise Reduction
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#3aa8ff]" />
                      Smart Pause
                    </li>
                  </ul>

                  <div className="mt-4 flex items-center justify-between text-[18px] text-[#dce7ff] lg:text-[28px]">
                    <span className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#7e90b7]" />
                      Call Summary
                    </span>
                    <Toggle
                      checked={callSummary}
                      onChange={() => setCallSummary((v) => !v)}
                    />
                  </div>
                </article>
              </section>
            </PanelCard>
          </div>

          <aside className="flex min-w-0 flex-col gap-4">
            <PanelCard>
              <SectionTitle
                icon={Phone}
                title="Phone Configuration"
                action={
                  <button
                    type="button"
                    className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#39629b] bg-[#0f2148] px-3 text-[16px] text-[#96ceff] lg:text-[18px]"
                  >
                    <Plus className="h-4 w-4" />
                    Add Number
                  </button>
                }
              />

              <div className="space-y-3">
                <div>
                  <p className="mb-2 text-[15px] text-[#dbe5f8] lg:text-[17px]">
                    Phone Numbers (1)
                  </p>
                  <div className="rounded-xl border border-[#36588e] bg-[linear-gradient(180deg,#111d3f_0%,#0d1837_100%)] p-3">
                    <div className="flex flex-wrap items-center gap-2 text-[18px] lg:text-[24px]">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#1d2f56] text-[16px]">
                        US
                      </span>
                      <span className="font-medium">+1 (555) 123-4567</span>
                      <span className="rounded-full border border-[#2b63b3] bg-[#102b59] px-2 py-0.5 text-[14px] text-[#6cb9ff]">
                        Primary
                      </span>
                      <div className="ml-auto flex items-center gap-2">
                        <Phone className="h-4 w-4 text-[#c8d4ef]" />
                        <MessageCircle className="h-4 w-4 text-[#54d8ff]" />
                        <Trash2 className="h-4 w-4 text-[#ff4a71]" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <FieldLabel>Max Concurrent Calls</FieldLabel>
                    <SelectLike value="5" />
                  </div>

                  <div>
                    <FieldLabel>Call Recording</FieldLabel>
                    <div className="flex h-11 items-center gap-2 rounded-[10px] border border-[#38598d]/80 bg-[linear-gradient(180deg,#101a3a_0%,#0b1330_100%)] px-2">
                      <Toggle
                        checked={callRecording}
                        onChange={() => setCallRecording((v) => !v)}
                      />
                      <div className="ml-auto inline-flex rounded-lg border border-[#355488] bg-[#102246] p-1 text-[14px] lg:text-[16px]">
                        <button
                          type="button"
                          onClick={() => setCallRecording(true)}
                          className={joinClasses(
                            "rounded-md px-3 py-1",
                            callRecording
                              ? "bg-[#224f9f] text-white"
                              : "text-[#9eb0d4]",
                          )}
                        >
                          Yes
                        </button>
                        <button
                          type="button"
                          onClick={() => setCallRecording(false)}
                          className={joinClasses(
                            "rounded-md px-3 py-1",
                            !callRecording
                              ? "bg-[#224f9f] text-white"
                              : "text-[#9eb0d4]",
                          )}
                        >
                          No
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#2d4a78] pt-2">
                  <h3 className="mb-2 text-[20px] font-semibold lg:text-[26px]">
                    Runtime Limits
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <FieldLabel>Max Duration (min)</FieldLabel>
                      <FieldShell>
                        <span>60</span>
                      </FieldShell>
                    </div>
                    <div>
                      <FieldLabel>Cooldown (sec)</FieldLabel>
                      <FieldShell>
                        <span>30</span>
                      </FieldShell>
                    </div>
                  </div>
                </div>
              </div>
            </PanelCard>

            <PanelCard>
              <SectionTitle
                icon={KeyRound}
                title="API Configuration"
                iconTone="text-[#ff9a1a]"
              />

              <div className="space-y-3 border-t border-[#2b4673] pt-3">
                <div>
                  <FieldLabel>AI Model</FieldLabel>
                  <SelectLike
                    value="Gemini 2.5 Flash"
                    right={
                      <span className="rounded-full bg-[#203d75] px-3 py-1 text-[14px] text-[#cfe3ff]">
                        Preview
                      </span>
                    }
                  />
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-2">
                    <FieldLabel>API Keys</FieldLabel>
                    <button
                      type="button"
                      className="inline-flex h-9 items-center gap-1 rounded-xl border border-[#39629b] bg-[#102147] px-3 text-[14px] text-[#d7e7ff] lg:text-[16px]"
                    >
                      <Settings2 className="h-4 w-4" />
                      Manage
                    </button>
                  </div>
                  <FieldShell className="justify-between gap-2">
                    <span className="tracking-[0.2em] text-[#d7e2fb]">
                      ��������������������
                    </span>
                    <div className="flex items-center gap-2">
                      <EyeOff className="h-4 w-4 text-[#9db0d3]" />
                      <Copy className="h-4 w-4 text-[#9db0d3]" />
                      <Plus className="h-4 w-4 text-[#36b2ff]" />
                    </div>
                  </FieldShell>
                </div>

                <div className="inline-flex items-center gap-2 text-[20px] text-[#3fdd8f] lg:text-[28px]">
                  <span className="h-2.5 w-2.5 rounded-full bg-[#39dd87] shadow-[0_0_10px_rgba(57,221,135,0.7)]" />
                  Connected
                </div>
              </div>
            </PanelCard>
          </aside>
        </section>

        <PanelCard className="p-0">
          <section
            aria-labelledby="agent-version-history"
            className="overflow-hidden rounded-2xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#2d4a78] px-4 py-3 md:px-5">
              <div className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-[#3aa8ff]" />
                <h2
                  id="agent-version-history"
                  className="text-[20px] font-semibold lg:text-[26px]"
                >
                  Agent Version History
                </h2>
              </div>

              <button
                type="button"
                className="inline-flex h-10 items-center gap-1 rounded-xl border border-[#2d78ec] bg-[linear-gradient(180deg,#2a86ff_0%,#1d63ff_100%)] px-4 text-[16px] font-semibold shadow-[0_0_16px_rgba(42,134,255,0.45)] lg:text-[18px]"
              >
                <Plus className="h-4 w-4" />
                New Version
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="bg-[#17254b]/80 text-[15px] text-[#d2def7] lg:text-[18px]">
                    <th className="px-4 py-2 font-medium">Version</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                    <th className="px-4 py-2 font-medium">Created By</th>
                    <th className="px-4 py-2 font-medium">Created On</th>
                    <th className="px-4 py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tableRows.map((row) => (
                    <tr
                      key={row.version}
                      className="text-[16px] text-[#e5ecff] lg:text-[20px]"
                    >
                      <td className="border-t border-[#2f4d7a] px-4 py-2.5">
                        {row.version}
                      </td>
                      <td className="border-t border-[#2f4d7a] px-4 py-2.5">
                        {row.type}
                      </td>
                      <td className="border-t border-[#2f4d7a] px-4 py-2.5">
                        <StatusBadge value={row.status} />
                      </td>
                      <td className="border-t border-[#2f4d7a] px-4 py-2.5">
                        {row.createdBy}
                      </td>
                      <td className="border-t border-[#2f4d7a] px-4 py-2.5">
                        {row.createdOn}
                      </td>
                      <td className="border-t border-[#2f4d7a] px-4 py-2.5">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex h-8 items-center gap-1 rounded-md border border-[#3a588d] bg-[#0f1b3a] px-3 text-[14px] text-[#d8e5ff] lg:h-9 lg:text-[16px]"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                          <IconActionButton
                            icon={Pencil}
                            label="Edit version"
                          />
                          {row.rowAction === "play" ? (
                            <IconActionButton
                              icon={Play}
                              label="Activate version"
                              className="text-[#43d48a]"
                            />
                          ) : (
                            <IconActionButton
                              icon={Trash2}
                              label="Delete version"
                              className="text-[#ff547d]"
                            />
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </PanelCard>
      </div>
    </main>
  );
}

export default TempBasics;

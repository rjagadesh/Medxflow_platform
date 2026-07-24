/**
 * Voice AI studio — the home of a tenant's voice agents. Lists existing agents
 * as cards and offers a prominent "Create agent" action. Clicking a card opens
 * the guided builder to edit it.
 */
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import api from "../api/client.js";
import VoiceCampaigns from "../components/VoiceCampaigns.jsx";
import VobCall from "../components/vob/VobCall.jsx";
import VobInstructions from "../components/vob/VobInstructions.jsx";
import VobIvrConfigs from "../components/vob/VobIvrConfigs.jsx";
import VobRecordings from "../components/vob/VobRecordings.jsx";
import { VoiceIcon } from "../components/icons.jsx";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const STATUS_CLASS = {
  ACTIVE: "pill pill--active",
  DRAFT: "pill pill--suspended",
  PAUSED: "pill pill--expired",
};

// Grouped information architecture:
//   Agents  — agent list + per-agent detail
//   Calls   — Place VOB Call · Campaigns · History (recordings)
//   Library — reusable Instructions & IVR Configs referenced by agents/calls
const GROUPS = [
  { key: "agents", label: "Agents", subs: [] },
  {
    key: "calls", label: "Calls",
    subs: [
      { key: "vob", label: "Place VOB Call" },
      { key: "campaigns", label: "Campaigns" },
      { key: "history", label: "History" },
    ],
  },
  {
    key: "library", label: "Library",
    subs: [
      { key: "instructions", label: "Instructions" },
      { key: "ivr", label: "IVR Configs" },
    ],
  },
];

export default function VoiceAI() {
  const [group, setGroup] = useState("agents");
  const [sub, setSub] = useState({ calls: "vob", library: "instructions" });
  usePageHeader("Voice AI studio", "Build agents, verify benefits, and run outbound campaigns.");

  const current = GROUPS.find((g) => g.key === group);
  const activeSub = sub[group];

  return (
    <>
      {/* Primary group tabs */}
      <div className="tabs">
        {GROUPS.map((g) => (
          <button key={g.key} className={`tab ${group === g.key ? "is-active" : ""}`} onClick={() => setGroup(g.key)}>
            {g.label}
          </button>
        ))}
      </div>

      {/* Secondary sub-tabs (Calls / Library) */}
      {current.subs.length > 0 && (
        <div className="subtabs">
          {current.subs.map((s) => (
            <button key={s.key}
              className={`subtab ${activeSub === s.key ? "is-active" : ""}`}
              onClick={() => setSub((cur) => ({ ...cur, [group]: s.key }))}>
              {s.label}
            </button>
          ))}
        </div>
      )}

      {group === "agents" && <AgentsTab />}
      {group === "calls" && activeSub === "vob" && <VobCall />}
      {group === "calls" && activeSub === "campaigns" && <VoiceCampaigns />}
      {group === "calls" && activeSub === "history" && <VobRecordings />}
      {group === "library" && activeSub === "instructions" && <VobInstructions />}
      {group === "library" && activeSub === "ivr" && <VobIvrConfigs />}
    </>
  );
}

function AgentsTab() {
  const navigate = useNavigate();
  const [agents, setAgents] = useState(null);

  useEffect(() => {
    api.get("/voice-agents/").then(({ data }) => setAgents(data)).catch(() => setAgents([]));
  }, []);

  return (
    <>
      <div className="page-actions">
        <Link to="/voice-ai/new" className="btn btn--primary">
          + Create agent
        </Link>
      </div>

      {agents === null ? (
        <p className="muted">Loading agents…</p>
      ) : agents.length === 0 ? (
        <div className="empty">
          <div className="empty__icon">
            <VoiceIcon width={40} height={40} />
          </div>
          <h3 className="empty__title">No agents yet</h3>
          <p className="muted">
            Create your first voice agent — give it a name, a voice, and tell it
            how to behave. It takes about a minute.
          </p>
          <button className="btn btn--primary" onClick={() => navigate("/voice-ai/new")}>
            + Create your first agent
          </button>
        </div>
      ) : (
        <div className="agent-grid">
          {agents.map((agent) => (
            <Link key={agent.id} to={`/voice-ai/${agent.id}`} className="agent-card">
              <div className="agent-card__top">
                <span className="agent-card__avatar">
                  <VoiceIcon width={22} height={22} />
                </span>
                <span className={STATUS_CLASS[agent.status] || "pill"}>
                  {agent.status_label}
                </span>
              </div>
              <h3 className="agent-card__name">{agent.name}</h3>
              <p className="agent-card__persona">
                {agent.persona || agent.description || "Voice agent"}
              </p>
              <div className="agent-card__meta">
                <span>🎙 {agent.voice_label?.split(" —")[0]}</span>
                <span>🌐 {agent.language_label}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

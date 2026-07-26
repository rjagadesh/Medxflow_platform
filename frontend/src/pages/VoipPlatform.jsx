/**
 * VoIP — MedXFlow cloud phone system (RingCentral-style UCaaS).
 *
 * A self-contained, demo/simulated unified-communications workspace:
 *   • Phone     — dial pad, live call screen (mute/hold/record/keypad/transfer),
 *                 and call history (all / missed / recorded)
 *   • Messages  — SMS conversation threads with composer + simulated replies
 *   • Video     — meetings: start now, schedule, join, upcoming list
 *   • Contacts  — searchable directory, click-to-call / click-to-message
 *   • Voicemail — inbox with playback + transcription
 *   • Analytics — call KPIs and volume bars
 *
 * All telephony is simulated client-side (no backend / SIP). Route: /voip.
 */
import { useEffect, useMemo, useRef, useState } from "react";

/* ---------------------------------------------------------------- icons -- */
const I = {
  phone: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>),
  message: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>),
  video: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>),
  contacts: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>),
  voicemail: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="5.5" cy="11.5" r="4.5"/><circle cx="18.5" cy="11.5" r="4.5"/><line x1="5.5" y1="16" x2="18.5" y2="16"/></svg>),
  chart: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>),
  settings: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>),
  search: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>),
  mic: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>),
  micOff: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="1" y1="1" x2="23" y2="23"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"/><path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"/><line x1="12" y1="19" x2="12" y2="23"/></svg>),
  pause: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><rect x="6" y="4" width="4" height="16" rx="1"/><rect x="14" y="4" width="4" height="16" rx="1"/></svg>),
  play: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><polygon points="6 4 20 12 6 20 6 4"/></svg>),
  grid: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="5" cy="5" r="1.6"/><circle cx="12" cy="5" r="1.6"/><circle cx="19" cy="5" r="1.6"/><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/><circle cx="5" cy="19" r="1.6"/><circle cx="12" cy="19" r="1.6"/><circle cx="19" cy="19" r="1.6"/></svg>),
  record: (p) => (<svg viewBox="0 0 24 24" fill="currentColor" {...p}><circle cx="12" cy="12" r="7"/></svg>),
  transfer: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>),
  plus: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>),
  back: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="12 19 5 12 12 5"/></svg>),
  send: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>),
  arrowUpRight: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>),
  arrowDownLeft: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>),
  x: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>),
  calendar: (p) => (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>),
};

/* --------------------------------------------------------- demo data -- */
const AGENT = { name: "Dr. Alex Rivera", ext: "1042", number: "+1 (415) 555‑0142" };

const seedContacts = [
  { id: 1, name: "Front Desk — Main", number: "+1 (415) 555‑0100", initials: "FD", dept: "Reception", fav: true },
  { id: 2, name: "Sarah Johnson, MD", number: "+1 (415) 555‑0111", initials: "SJ", dept: "Cardiology", fav: true },
  { id: 3, name: "Michael Lee, MD", number: "+1 (415) 555‑0122", initials: "ML", dept: "Radiology" },
  { id: 4, name: "Emily Carter, RN", number: "+1 (415) 555‑0133", initials: "EC", dept: "Nursing" },
  { id: 5, name: "Billing Department", number: "+1 (415) 555‑0155", initials: "BD", dept: "Revenue Cycle" },
  { id: 6, name: "BlueCross Provider Line", number: "+1 (800) 555‑0199", initials: "BC", dept: "Payer" },
  { id: 7, name: "Patient — John Doe", number: "+1 (415) 555‑0177", initials: "JD", dept: "Patient" },
  { id: 8, name: "Pharmacy — Walgreens", number: "+1 (415) 555‑0188", initials: "PH", dept: "Pharmacy" },
];

const seedCalls = [
  { id: 1, dir: "in", name: "Sarah Johnson, MD", number: "+1 (415) 555‑0111", time: "9:42 AM", dur: "4:12", missed: false, recorded: true },
  { id: 2, dir: "out", name: "BlueCross Provider Line", number: "+1 (800) 555‑0199", time: "9:05 AM", dur: "12:38", missed: false, recorded: true },
  { id: 3, dir: "in", name: "Patient — John Doe", number: "+1 (415) 555‑0177", time: "Yesterday", dur: "0:00", missed: true, recorded: false },
  { id: 4, dir: "out", name: "Pharmacy — Walgreens", number: "+1 (415) 555‑0188", time: "Yesterday", dur: "2:01", missed: false, recorded: false },
  { id: 5, dir: "in", name: "Billing Department", number: "+1 (415) 555‑0155", time: "Mon", dur: "6:24", missed: false, recorded: true },
  { id: 6, dir: "in", name: "Unknown", number: "+1 (628) 555‑0164", time: "Mon", dur: "0:00", missed: true, recorded: false },
];

const seedThreads = [
  { id: 1, name: "Sarah Johnson, MD", number: "+1 (415) 555‑0111", initials: "SJ", unread: 2, messages: [
    { from: "them", text: "Can you cover the 3pm cardiology consult?", at: "9:12 AM" },
    { from: "them", text: "Patient is already checked in.", at: "9:12 AM" },
  ] },
  { id: 2, name: "Patient — John Doe", number: "+1 (415) 555‑0177", initials: "JD", unread: 0, messages: [
    { from: "me", text: "Hi John, this is a reminder for your appointment tomorrow at 10:00 AM.", at: "Mon" },
    { from: "them", text: "Thank you! I'll be there.", at: "Mon" },
  ] },
  { id: 3, name: "Billing Department", number: "+1 (415) 555‑0155", initials: "BD", unread: 0, messages: [
    { from: "them", text: "Claim #48213 was accepted by the payer.", at: "Fri" },
  ] },
];

const seedVoicemails = [
  { id: 1, name: "Patient — John Doe", number: "+1 (415) 555‑0177", time: "Yesterday 4:31 PM", dur: "0:38", heard: false, transcript: "Hi, this is John Doe. I'd like to reschedule my appointment to next week if possible. Please call me back. Thanks." },
  { id: 2, name: "BlueCross Provider Line", number: "+1 (800) 555‑0199", time: "Mon 11:02 AM", dur: "1:12", heard: true, transcript: "This message is regarding prior authorization request 77‑2201. Additional documentation is required for approval." },
  { id: 3, name: "Unknown", number: "+1 (628) 555‑0164", time: "Sun 6:45 PM", dur: "0:21", heard: true, transcript: "Hello, please return our call at your earliest convenience regarding your recent inquiry." },
];

const seedMeetings = [
  { id: 1, title: "RCM Weekly Standup", when: "Today · 2:00 PM", host: "You", attendees: 8 },
  { id: 2, title: "Payer Contract Review — BlueCross", when: "Tomorrow · 10:30 AM", host: "Sarah Johnson", attendees: 4 },
  { id: 3, title: "New Provider Onboarding", when: "Thu · 9:00 AM", host: "Emily Carter", attendees: 12 },
];

const NAV = [
  { key: "phone", label: "Phone", icon: I.phone },
  { key: "messages", label: "Messages", icon: I.message },
  { key: "video", label: "Video", icon: I.video },
  { key: "contacts", label: "Contacts", icon: I.contacts },
  { key: "voicemail", label: "Voicemail", icon: I.voicemail },
  { key: "analytics", label: "Analytics", icon: I.chart },
  { key: "settings", label: "Settings", icon: I.settings },
];

const PRESENCE = {
  available: { label: "Available", color: "#17c3b2" },
  busy: { label: "Busy", color: "#e0a100" },
  dnd: { label: "Do not disturb", color: "#d64545" },
  offline: { label: "Invisible", color: "#8aa0b8" },
};

const DIALPAD = [
  ["1", ""], ["2", "ABC"], ["3", "DEF"],
  ["4", "GHI"], ["5", "JKL"], ["6", "MNO"],
  ["7", "PQRS"], ["8", "TUV"], ["9", "WXYZ"],
  ["*", ""], ["0", "+"], ["#", ""],
];

function fmtDuration(sec) {
  const m = Math.floor(sec / 60).toString();
  const s = (sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

/* ============================================================ component === */
export default function VoipPlatform() {
  const [section, setSection] = useState("phone");
  const [presence, setPresence] = useState("available");
  const [presenceOpen, setPresenceOpen] = useState(false);

  // Phone / dialer
  const [dial, setDial] = useState("");
  const [callTab, setCallTab] = useState("all");
  const [calls, setCalls] = useState(seedCalls);

  // Active + incoming call
  const [call, setCall] = useState(null); // {name, number, status, muted, hold, recording, seconds, keypad}
  const [incoming, setIncoming] = useState(null);
  const timerRef = useRef(null);

  // Messages
  const [threads, setThreads] = useState(seedThreads);
  const [activeThread, setActiveThread] = useState(null);
  const [draft, setDraft] = useState("");

  // Contacts
  const [contactQuery, setContactQuery] = useState("");

  // Voicemail
  const [voicemails, setVoicemails] = useState(seedVoicemails);
  const [playingVm, setPlayingVm] = useState(null);

  /* ---- call timer ---- */
  useEffect(() => {
    if (call?.status === "connected") {
      timerRef.current = setInterval(() => {
        setCall((c) => (c ? { ...c, seconds: c.seconds + 1 } : c));
      }, 1000);
      return () => clearInterval(timerRef.current);
    }
  }, [call?.status]);

  /* ---- placing a call: Calling… -> connected after ~1.8s ---- */
  function placeCall(number, name) {
    if (!number) return;
    setCall({ name: name || "", number, status: "calling", muted: false, hold: false, recording: false, seconds: 0, keypad: false });
    setTimeout(() => setCall((c) => (c && c.status === "calling" ? { ...c, status: "connected" } : c)), 1800);
  }

  function endCall() {
    if (!call) return;
    // Log to history
    if (call.status === "connected" || call.status === "calling") {
      setCalls((prev) => [
        { id: Date.now(), dir: call.incoming ? "in" : "out", name: call.name || "Unknown", number: call.number, time: "Just now", dur: fmtDuration(call.seconds), missed: false, recorded: call.recording },
        ...prev,
      ]);
    }
    clearInterval(timerRef.current);
    setCall(null);
  }

  function pressPad(d) {
    if (call) setCall((c) => ({ ...c })); // keypad tones during call (no-op state touch)
    else setDial((v) => (v.length < 18 ? v + d : v));
  }

  function simulateIncoming() {
    const c = seedContacts[Math.floor(Math.random() * seedContacts.length)];
    setIncoming({ name: c.name, number: c.number });
  }
  function acceptIncoming() {
    setCall({ name: incoming.name, number: incoming.number, status: "connected", muted: false, hold: false, recording: false, seconds: 0, keypad: false, incoming: true });
    setIncoming(null);
  }
  function declineIncoming() {
    setCalls((prev) => [{ id: Date.now(), dir: "in", name: incoming.name, number: incoming.number, time: "Just now", dur: "0:00", missed: true, recorded: false }, ...prev]);
    setIncoming(null);
  }

  /* ---- messaging ---- */
  function openThread(t) {
    setActiveThread(t.id);
    setThreads((prev) => prev.map((x) => (x.id === t.id ? { ...x, unread: 0 } : x)));
  }
  function sendMessage() {
    if (!draft.trim() || activeThread == null) return;
    const text = draft.trim();
    setThreads((prev) => prev.map((t) => (t.id === activeThread ? { ...t, messages: [...t.messages, { from: "me", text, at: "Now" }] } : t)));
    setDraft("");
    // simulated reply
    setTimeout(() => {
      setThreads((prev) => prev.map((t) => (t.id === activeThread ? { ...t, messages: [...t.messages, { from: "them", text: "Got it — thanks for the update.", at: "Now" }] } : t)));
    }, 1600);
  }

  const filteredContacts = useMemo(() => {
    const q = contactQuery.trim().toLowerCase();
    if (!q) return seedContacts;
    return seedContacts.filter((c) => c.name.toLowerCase().includes(q) || c.number.includes(q) || c.dept.toLowerCase().includes(q));
  }, [contactQuery]);

  const visibleCalls = calls.filter((c) => callTab === "all" || (callTab === "missed" && c.missed) || (callTab === "recorded" && c.recorded));
  const thread = threads.find((t) => t.id === activeThread);
  const totalUnread = threads.reduce((n, t) => n + t.unread, 0);

  return (
    <div className="voip">
      {/* ---------------- left rail ---------------- */}
      <aside className="voip__rail">
        <div className="voip__brand"><span className="voip__brand-dot" />MedXFlow <b>Phone</b></div>
        <nav className="voip__nav">
          {NAV.map((n) => {
            const Icon = n.icon;
            const badge = n.key === "messages" ? totalUnread : n.key === "voicemail" ? voicemails.filter((v) => !v.heard).length : 0;
            return (
              <button key={n.key} className={`voip__navbtn ${section === n.key ? "is-active" : ""}`} onClick={() => setSection(n.key)}>
                <Icon width={20} height={20} />
                <span>{n.label}</span>
                {badge > 0 && <em className="voip__navbadge">{badge}</em>}
              </button>
            );
          })}
        </nav>
        <div className="voip__me">
          <button className="voip__presence" onClick={() => setPresenceOpen((o) => !o)}>
            <span className="voip__avatar">AR<i className="voip__dot" style={{ background: PRESENCE[presence].color }} /></span>
            <span className="voip__me-meta">
              <b>{AGENT.name}</b>
              <small style={{ color: PRESENCE[presence].color }}>{PRESENCE[presence].label}</small>
            </span>
          </button>
          {presenceOpen && (
            <div className="voip__presence-menu">
              {Object.entries(PRESENCE).map(([k, v]) => (
                <button key={k} onClick={() => { setPresence(k); setPresenceOpen(false); }}>
                  <i style={{ background: v.color }} />{v.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ---------------- main ---------------- */}
      <div className="voip__main">
        <header className="voip__top">
          <div className="voip__search">{I.search({ width: 16, height: 16 })}<input placeholder="Search contacts, numbers, messages…" /></div>
          <div className="voip__top-actions">
            <button className="voip__ghost" onClick={simulateIncoming} title="Simulate an inbound call">{I.arrowDownLeft({ width: 16, height: 16 })}Simulate call</button>
            <span className="voip__num">{AGENT.number} · Ext {AGENT.ext}</span>
          </div>
        </header>

        <div className="voip__body">
          {section === "phone" && (
            <div className="voip__cols">
              {/* call history */}
              <section className="voip__list">
                <div className="voip__list-head">
                  <h2>Calls</h2>
                  <div className="voip__tabs">
                    {["all", "missed", "recorded"].map((t) => (
                      <button key={t} className={callTab === t ? "is-active" : ""} onClick={() => setCallTab(t)}>{t[0].toUpperCase() + t.slice(1)}</button>
                    ))}
                  </div>
                </div>
                <ul className="voip__calls">
                  {visibleCalls.map((c) => (
                    <li key={c.id} className="voip__call-row" onClick={() => placeCall(c.number, c.name === "Unknown" ? "" : c.name)}>
                      <span className={`voip__call-dir ${c.missed ? "is-missed" : c.dir}`}>
                        {c.dir === "in" ? I.arrowDownLeft({ width: 15, height: 15 }) : I.arrowUpRight({ width: 15, height: 15 })}
                      </span>
                      <span className="voip__call-meta">
                        <b className={c.missed ? "is-missed" : ""}>{c.name}</b>
                        <small>{c.number}{c.recorded && <em className="voip__rec">REC</em>}</small>
                      </span>
                      <span className="voip__call-time">{c.time}<small>{c.missed ? "Missed" : c.dur}</small></span>
                      <button className="voip__call-btn" title="Call" onClick={(e) => { e.stopPropagation(); placeCall(c.number, c.name === "Unknown" ? "" : c.name); }}>{I.phone({ width: 16, height: 16 })}</button>
                    </li>
                  ))}
                  {visibleCalls.length === 0 && <li className="voip__empty">No {callTab} calls.</li>}
                </ul>
              </section>

              {/* dialer */}
              <section className="voip__panel">
                <div className="voip__dialer">
                  <input className="voip__dial-input" value={dial} onChange={(e) => setDial(e.target.value)} placeholder="Enter a number" />
                  <div className="voip__pad">
                    {DIALPAD.map(([d, sub]) => (
                      <button key={d} className="voip__key" onClick={() => pressPad(d)}>
                        <b>{d}</b>{sub && <small>{sub}</small>}
                      </button>
                    ))}
                  </div>
                  <div className="voip__dial-actions">
                    <span />
                    <button className="voip__call-big" onClick={() => placeCall(dial)} disabled={!dial}>{I.phone({ width: 24, height: 24 })}</button>
                    <button className="voip__back" onClick={() => setDial((v) => v.slice(0, -1))} disabled={!dial}>{I.back({ width: 20, height: 20 })}</button>
                  </div>
                </div>
              </section>
            </div>
          )}

          {section === "messages" && (
            <div className="voip__cols">
              <section className="voip__list">
                <div className="voip__list-head"><h2>Messages</h2><button className="voip__pill">{I.plus({ width: 15, height: 15 })}New</button></div>
                <ul className="voip__threads">
                  {threads.map((t) => (
                    <li key={t.id} className={`voip__thread ${activeThread === t.id ? "is-active" : ""}`} onClick={() => openThread(t)}>
                      <span className="voip__avatar sm">{t.initials}</span>
                      <span className="voip__thread-meta">
                        <b>{t.name}</b>
                        <small>{t.messages[t.messages.length - 1]?.text}</small>
                      </span>
                      {t.unread > 0 && <em className="voip__navbadge">{t.unread}</em>}
                    </li>
                  ))}
                </ul>
              </section>
              <section className="voip__panel voip__chat">
                {thread ? (
                  <>
                    <div className="voip__chat-head">
                      <span className="voip__avatar sm">{thread.initials}</span>
                      <div><b>{thread.name}</b><small>{thread.number}</small></div>
                      <button className="voip__call-btn" onClick={() => placeCall(thread.number, thread.name)}>{I.phone({ width: 16, height: 16 })}</button>
                    </div>
                    <div className="voip__chat-body">
                      {thread.messages.map((m, i) => (
                        <div key={i} className={`voip__bubble ${m.from === "me" ? "me" : "them"}`}>{m.text}<span>{m.at}</span></div>
                      ))}
                    </div>
                    <div className="voip__composer">
                      <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && sendMessage()} placeholder="Type a message…" />
                      <button onClick={sendMessage} disabled={!draft.trim()}>{I.send({ width: 18, height: 18 })}</button>
                    </div>
                  </>
                ) : (
                  <div className="voip__placeholder">{I.message({ width: 40, height: 40 })}<p>Select a conversation</p></div>
                )}
              </section>
            </div>
          )}

          {section === "video" && (
            <div className="voip__section">
              <div className="voip__video-hero">
                <div>
                  <h2>Video meetings</h2>
                  <p>Start an instant HD meeting, schedule one, or join with a code.</p>
                  <div className="voip__video-cta">
                    <button className="voip__btn primary">{I.video({ width: 18, height: 18 })}Start a meeting</button>
                    <button className="voip__btn">{I.calendar({ width: 18, height: 18 })}Schedule</button>
                    <div className="voip__join"><input placeholder="Enter meeting code" /><button className="voip__btn ghost">Join</button></div>
                  </div>
                </div>
                <div className="voip__video-art">{I.video({ width: 60, height: 60 })}</div>
              </div>
              <h3 className="voip__subh">Upcoming</h3>
              <ul className="voip__meetings">
                {seedMeetings.map((m) => (
                  <li key={m.id}>
                    <span className="voip__meet-when">{I.calendar({ width: 16, height: 16 })}{m.when}</span>
                    <b>{m.title}</b>
                    <small>Host: {m.host} · {m.attendees} invited</small>
                    <button className="voip__btn ghost sm">Join</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section === "contacts" && (
            <div className="voip__section">
              <div className="voip__list-head"><h2>Contacts</h2>
                <div className="voip__search inpage">{I.search({ width: 15, height: 15 })}<input value={contactQuery} onChange={(e) => setContactQuery(e.target.value)} placeholder="Search directory…" /></div>
              </div>
              <ul className="voip__contacts">
                {filteredContacts.map((c) => (
                  <li key={c.id} className="voip__contact">
                    <span className="voip__avatar">{c.initials}</span>
                    <span className="voip__contact-meta"><b>{c.name}{c.fav && <em className="voip__fav">★</em>}</b><small>{c.dept} · {c.number}</small></span>
                    <div className="voip__contact-actions">
                      <button title="Message" onClick={() => { const t = threads.find((x) => x.number === c.number); if (t) { setSection("messages"); openThread(t); } }}>{I.message({ width: 16, height: 16 })}</button>
                      <button className="call" title="Call" onClick={() => { setSection("phone"); placeCall(c.number, c.name); }}>{I.phone({ width: 16, height: 16 })}</button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section === "voicemail" && (
            <div className="voip__section">
              <div className="voip__list-head"><h2>Voicemail</h2><span className="voip__num">{voicemails.filter((v) => !v.heard).length} new</span></div>
              <ul className="voip__vms">
                {voicemails.map((v) => (
                  <li key={v.id} className={`voip__vm ${!v.heard ? "is-new" : ""}`}>
                    <button className="voip__vm-play" onClick={() => { setPlayingVm(playingVm === v.id ? null : v.id); setVoicemails((prev) => prev.map((x) => x.id === v.id ? { ...x, heard: true } : x)); }}>
                      {playingVm === v.id ? I.pause({ width: 16, height: 16 }) : I.play({ width: 16, height: 16 })}
                    </button>
                    <div className="voip__vm-meta">
                      <b>{v.name}</b>
                      <small>{v.number} · {v.time} · {v.dur}</small>
                      <div className={`voip__vm-wave ${playingVm === v.id ? "playing" : ""}`}>{Array.from({ length: 32 }).map((_, i) => <i key={i} style={{ height: `${6 + ((i * 7) % 20)}px` }} />)}</div>
                      <p className="voip__vm-txt"><em>Transcript:</em> {v.transcript}</p>
                    </div>
                    <button className="voip__call-btn" onClick={() => { setSection("phone"); placeCall(v.number, v.name === "Unknown" ? "" : v.name); }}>{I.phone({ width: 16, height: 16 })}</button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {section === "analytics" && (
            <div className="voip__section">
              <div className="voip__list-head"><h2>Call analytics</h2><span className="voip__num">Last 7 days</span></div>
              <div className="voip__kpis">
                {[
                  { label: "Total calls", value: "1,284", delta: "+8.2%" },
                  { label: "Answer rate", value: "92.4%", delta: "+1.1%" },
                  { label: "Avg. handle time", value: "4:37", delta: "-0:12" },
                  { label: "Missed calls", value: "37", delta: "-14%" },
                ].map((k) => (
                  <div key={k.label} className="voip__kpi"><small>{k.label}</small><b>{k.value}</b><em className={k.delta.startsWith("-") && !k.label.includes("Missed") ? "down" : "up"}>{k.delta}</em></div>
                ))}
              </div>
              <div className="voip__chartcard">
                <h3 className="voip__subh">Call volume</h3>
                <div className="voip__bars">
                  {[
                    ["Mon", 62], ["Tue", 78], ["Wed", 90], ["Thu", 71], ["Fri", 84], ["Sat", 34], ["Sun", 22],
                  ].map(([d, v]) => (
                    <div key={d} className="voip__bar"><span style={{ height: `${v}%` }} /><small>{d}</small></div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {section === "settings" && (
            <div className="voip__section voip__settings">
              <div className="voip__list-head"><h2>Phone settings</h2></div>
              <div className="voip__setgrid">
                <div className="voip__setcard"><small>Caller ID</small><b>{AGENT.number}</b><p>Outbound number shown to recipients.</p></div>
                <div className="voip__setcard"><small>Extension</small><b>{AGENT.ext}</b><p>Your direct internal extension.</p></div>
                <div className="voip__setcard"><small>Voicemail greeting</small><b>Custom · 0:14</b><p>Played to callers you miss.</p></div>
                <div className="voip__setcard"><small>Call recording</small><b>On demand</b><p>Record active calls with one tap.</p></div>
                <div className="voip__setcard"><small>Business hours</small><b>Mon–Fri · 8:00–18:00</b><p>After‑hours routes to voicemail.</p></div>
                <div className="voip__setcard"><small>Ring devices</small><b>Desktop · Mobile</b><p>Ring all devices simultaneously.</p></div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ---------------- active call overlay ---------------- */}
      {call && (
        <div className="voip__callscreen">
          <div className="voip__callcard">
            <span className="voip__avatar xl">{(call.name || "#").split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            <h3>{call.name || call.number}</h3>
            <p className="voip__callnum">{call.name ? call.number : ""}</p>
            <p className="voip__callstatus">
              {call.status === "calling" ? "Calling…" : call.hold ? "On hold" : "Connected"}
              {call.status === "connected" && <span className="voip__calltimer"> · {fmtDuration(call.seconds)}</span>}
              {call.recording && <em className="voip__rec-live">● REC</em>}
            </p>

            {call.keypad ? (
              <div className="voip__pad in-call">
                {DIALPAD.map(([d]) => <button key={d} className="voip__key" onClick={() => pressPad(d)}><b>{d}</b></button>)}
              </div>
            ) : (
              <div className="voip__callctl">
                <button className={call.muted ? "is-on" : ""} onClick={() => setCall((c) => ({ ...c, muted: !c.muted }))}>{call.muted ? I.micOff({ width: 20, height: 20 }) : I.mic({ width: 20, height: 20 })}<small>Mute</small></button>
                <button className={call.hold ? "is-on" : ""} onClick={() => setCall((c) => ({ ...c, hold: !c.hold }))}>{I.pause({ width: 20, height: 20 })}<small>Hold</small></button>
                <button onClick={() => setCall((c) => ({ ...c, keypad: true }))}>{I.grid({ width: 20, height: 20 })}<small>Keypad</small></button>
                <button className={call.recording ? "is-rec" : ""} onClick={() => setCall((c) => ({ ...c, recording: !c.recording }))}>{I.record({ width: 18, height: 18 })}<small>Record</small></button>
                <button onClick={() => {}}>{I.transfer({ width: 20, height: 20 })}<small>Transfer</small></button>
                <button onClick={() => {}}>{I.plus({ width: 20, height: 20 })}<small>Add</small></button>
              </div>
            )}

            <div className="voip__callend-row">
              {call.keypad && <button className="voip__callhide" onClick={() => setCall((c) => ({ ...c, keypad: false }))}>Hide keypad</button>}
              <button className="voip__hangup" onClick={endCall}>{I.phone({ width: 26, height: 26 })}</button>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- incoming call ---------------- */}
      {incoming && (
        <div className="voip__incoming">
          <div className="voip__incoming-card">
            <small>Incoming call</small>
            <span className="voip__avatar xl">{incoming.name.split(" ").map((w) => w[0]).slice(0, 2).join("")}</span>
            <h3>{incoming.name}</h3>
            <p>{incoming.number}</p>
            <div className="voip__incoming-actions">
              <button className="decline" onClick={declineIncoming}>{I.phone({ width: 24, height: 24 })}<span>Decline</span></button>
              <button className="accept" onClick={acceptIncoming}>{I.phone({ width: 24, height: 24 })}<span>Accept</span></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

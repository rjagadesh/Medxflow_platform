/**
 * AI Front Desk Kiosk — a build-your-own kiosk studio. The left panel has two
 * tabs: "Generate" (chat with the AI designer) and "Kiosks" (your saved kiosk
 * screens). The right side is a live preview with undo / preview / save, a
 * desktop/tablet toggle, and a tip. Tenants start with a couple of sample
 * kiosks (a Welcome/Home screen and a Patient Intake flow).
 */
import { useEffect, useRef, useState } from "react";

import api from "../api/client.js";
import agentAvatar from "../assets/kiosk-agent.webp";
import { useAuth } from "../context/AuthContext.jsx";
import { usePageHeader } from "../context/PageHeaderContext.jsx";

const SUGGESTIONS = [
  "Change the primary colour to green",
  "Add an email address field",
  "Add a consent checkbox step",
  "Change the heading to 'Welcome to Acme Clinic'",
];

const now = () => new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export default function KioskBuilder() {
  const { user } = useAuth();
  const firstName = (user?.display_name || "there").split(" ")[0];
  usePageHeader("AI Front Desk Kiosk", "Build your own check-in kiosk by chatting with the AI designer.");

  const [panel, setPanel] = useState("generate"); // generate | kiosks
  const [html, setHtml] = useState("");
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([
    { role: "ai", at: now(), text: `Hi ${firstName}! 👋\nLet's build your front desk kiosk. You can describe what you want, and I'll design it for you.\nWhat would you like your kiosk screen to look like?` },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const [screens, setScreens] = useState([]);
  const [currentId, setCurrentId] = useState(null);
  const [name, setName] = useState("Untitled kiosk");
  const [device, setDevice] = useState("desktop");
  const chatRef = useRef(null);

  useEffect(() => {
    api.get("/kiosk/default/").then(({ data }) => setHtml(data.html)).catch(() => {});
    loadScreens();
  }, []);
  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending]);

  function loadScreens() {
    api.get("/kiosk/screens/").then(({ data }) => setScreens(data)).catch(() => {});
  }

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", at: now(), text: message }]);
    setSending(true);
    try {
      const { data } = await api.post("/kiosk/chat/", { html, message });
      setHistory((h) => [...h, html]);
      setHtml(data.html);
      setMessages((m) => [...m, { role: "ai", at: now(), text: data.reply }]);
    } catch {
      setMessages((m) => [...m, { role: "ai", at: now(), text: "Something went wrong updating the kiosk. Please try again." }]);
    } finally {
      setSending(false);
    }
  }

  function undo() {
    setHistory((h) => {
      if (!h.length) return h;
      setHtml(h[h.length - 1]);
      return h.slice(0, -1);
    });
  }

  function preview() {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    window.open(url, "_blank", "noopener");
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  async function save() {
    if (currentId) {
      const { data } = await api.put(`/kiosk/screens/${currentId}/`, { name, html });
      setName(data.name);
    } else {
      const { data } = await api.post("/kiosk/screens/", { name, html });
      setCurrentId(data.id);
    }
    loadScreens();
  }

  async function load(id) {
    const { data } = await api.get(`/kiosk/screens/${id}/`);
    setHistory((h) => [...h, html]);
    setHtml(data.html);
    setName(data.name);
    setCurrentId(data.id);
    setPanel("generate");
    setMessages((m) => [...m, { role: "ai", at: now(), text: `Loaded "${data.name}". What would you like to change?` }]);
  }

  async function remove(id, e) {
    e.stopPropagation();
    await api.delete(`/kiosk/screens/${id}/`).catch(() => {});
    if (id === currentId) { setCurrentId(null); setName("Untitled kiosk"); }
    loadScreens();
  }

  async function newKiosk() {
    const { data } = await api.get("/kiosk/default/");
    setHistory((h) => [...h, html]);
    setHtml(data.html);
    setCurrentId(null);
    setName("Untitled kiosk");
    setPanel("generate");
    setMessages([{ role: "ai", at: now(), text: `Fresh kiosk loaded. Tell me how to build it, ${firstName}.` }]);
  }

  function download() {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([html], { type: "text/html" }));
    a.download = `${(name || "kiosk").replace(/\s+/g, "-").toLowerCase()}.html`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="kbuild">
      {/* LEFT — tabs: Generate (chat) / Kiosks (saved) */}
      <div className="kbuild__chat">
        <div className="kb-tabs">
          <button className={`kb-tab ${panel === "generate" ? "is-active" : ""}`} onClick={() => setPanel("generate")}>
            <span className="kb-tab__ic">💬</span> Generate
          </button>
          <button className={`kb-tab ${panel === "kiosks" ? "is-active" : ""}`} onClick={() => setPanel("kiosks")}>
            <span className="kb-tab__ic">🗂</span> Kiosks
            {screens.length > 0 && <span className="kb-tab__count">{screens.length}</span>}
          </button>
        </div>

        {panel === "generate" ? (
          <>
            <div className="kbuild__msgs" ref={chatRef}>
              {messages.map((m, i) => (
                <div key={i} className={`kb-msg kb-msg--${m.role}`}>
                  {m.role === "ai" && <img src={agentAvatar} alt="AI designer" className="kb-avatar" />}
                  <div className="kb-bubble">
                    {m.text.split("\n").map((line, j) => <p key={j}>{line}</p>)}
                    <span className="kb-time">{m.at}</span>
                  </div>
                </div>
              ))}
              {sending && (
                <div className="kb-msg kb-msg--ai">
                  <img src={agentAvatar} alt="AI designer" className="kb-avatar" />
                  <div className="kb-bubble kb-bubble--typing"><span /><span /><span /></div>
                </div>
              )}
              {messages.length <= 1 && (
                <div className="kb-chips">
                  {SUGGESTIONS.map((s) => <button key={s} className="kb-chip" onClick={() => send(s)}>{s}</button>)}
                </div>
              )}
            </div>
            <form className="kbuild__composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
              <input className="kbuild__input" value={input} onChange={(e) => setInput(e.target.value)}
                placeholder="Describe what you want to change…" disabled={sending} />
              <button className="kbuild__send" type="submit" disabled={sending || !input.trim()} aria-label="Send">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="kb-list">
            <button className="kb-newbtn" onClick={newKiosk}>＋ New kiosk</button>
            {screens.map((s) => (
              <div key={s.id} className={`kb-item ${s.id === currentId ? "is-active" : ""}`} onClick={() => load(s.id)}>
                <div className="kb-item__main">
                  <div className="kb-item__name">{s.name}</div>
                  <div className="kb-item__meta">Updated {new Date(s.updated_at).toLocaleDateString()}</div>
                </div>
                <button className="kb-item__x" title="Delete" onClick={(e) => remove(s.id, e)}>✕</button>
              </div>
            ))}
            {screens.length === 0 && <p className="muted" style={{ padding: "1rem" }}>No saved kiosks yet — build one in the Generate tab.</p>}
          </div>
        )}
      </div>

      {/* RIGHT — preview */}
      <div className="kbuild__preview">
        <div className="kbuild__toolbar">
          <input className="kbuild__name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Kiosk name" />
          <div className="kbuild__toolbar-r">
            <button className="kb-tbtn" onClick={undo} disabled={!history.length} title="Undo last change">↶ Undo</button>
            <button className="kb-tbtn" onClick={download} title="Download HTML">⭳ Download</button>
            <button className="kb-tbtn" onClick={preview} title="Open full preview">👁 Preview</button>
            <button className="kb-tbtn kb-tbtn--primary" onClick={save}>Save kiosk</button>
          </div>
        </div>

        <div className="kbuild__card">
          <span className="kbuild__card-label">Kiosk Preview</span>
          <div className={`kbuild__stage kbuild__stage--${device}`}>
            <iframe title="Kiosk preview" className="kbuild__frame" srcDoc={html} sandbox="allow-scripts allow-forms" />
          </div>
        </div>

        <div className="kbuild__footer">
          <div className="kbuild__devices">
            <button className={`kb-dev ${device === "desktop" ? "is-active" : ""}`} onClick={() => setDevice("desktop")}>🖥 Desktop</button>
            <button className={`kb-dev ${device === "tablet" ? "is-active" : ""}`} onClick={() => setDevice("tablet")}>▭ Tablet</button>
          </div>
          <div className="kbuild__tip">
            <strong>💡 Tip</strong>
            <span>The more specific you are, the better I can design for you.</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Developer-mode assistant — a full conversational surface styled like Claude /
 * ChatGPT (side panel, role rows with avatars, greeting + suggestions, an
 * auto-growing composer, and a typing indicator). It stays section-aware:
 * the current screen (from the route) scopes the conversation via /api/dev-chat.
 */
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import api from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./Avatar.jsx";

function sectionFromPath(pathname) {
  if (pathname.startsWith("/skills/")) return pathname.split("/")[2];
  if (pathname.startsWith("/voice-ai")) return "voice-ai";
  if (pathname === "/") return "dashboard";
  return pathname.replace(/^\//, "").split("/")[0] || "dashboard";
}

const TITLES = {
  "eligibility-verification": "Eligibility Verification",
  "prior-authorization": "Prior Authorization",
  referrals: "Referrals",
  "claim-submission": "Claim Submission",
  telehealth: "Telehealth",
  "denial-management": "Denial Management",
  "claim-status-inquiry": "Claim Status Inquiry",
  "payment-posting": "Payment Posting / ERA",
  "decision-engine": "Decision Engine",
  "review-queue": "Review Queue",
  "voice-ai": "Voice AI",
  connectors: "Connectors",
  files: "File Manager",
  vault: "Secret Vault",
  "scheduled-runs": "Scheduled Runs",
  automations: "Automations",
  "audit-log": "Audit Log",
  licenses: "Licenses",
  settings: "Settings",
  dashboard: "Dashboard",
};

const SUGGESTIONS = [
  "Add a new input field",
  "Rename a label",
  "Change the layout or colours",
  "Wire this screen to a connector",
];

export default function DevChat() {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const section = sectionFromPath(pathname);
  const title = TITLES[section] || section;

  const [open, setOpen] = useState(true);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bodyRef = useRef(null);
  const textareaRef = useRef(null);

  // Load history whenever the section changes.
  useEffect(() => {
    api
      .get(`/dev-chat/?section=${section}`)
      .then(({ data }) => setMessages(data))
      .catch(() => setMessages([]));
  }, [section]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, sending, open]);

  function autoGrow() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  async function sendMessage(text) {
    const content = text.trim();
    if (!content || sending) return;
    setInput("");
    requestAnimationFrame(autoGrow);
    setSending(true);
    setMessages((m) => [...m, { id: `tmp-${Date.now()}`, sender: "user", content }]);
    try {
      const { data } = await api.post("/dev-chat/", { section, message: content });
      setMessages((m) => [...m, data]);
      // The dashboard chat can edit the dashboard; tell the page to refresh live.
      if (data.action?.type === "dashboard_updated") {
        window.dispatchEvent(new CustomEvent("eirim:dashboard-updated"));
      }
    } catch {
      setMessages((m) => [
        ...m,
        { id: `err-${Date.now()}`, sender: "assistant", content: "Sorry — I couldn't respond just now." },
      ]);
    } finally {
      setSending(false);
    }
  }

  function onSubmit(event) {
    event.preventDefault();
    sendMessage(input);
  }

  function onKeyDown(event) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  }

  // Collapsed: a floating launcher button (like reopening a chat panel).
  if (!open) {
    return (
      <button className="assistant-fab" onClick={() => setOpen(true)} title="Open developer assistant">
        <img src="/fav.png" alt="" className="assistant-fab__mark" />
        <span className="assistant-fab__pulse" />
      </button>
    );
  }

  return (
    <aside className="assistant" role="complementary" aria-label="Developer assistant">
      <header className="assistant__head">
        <div className="assistant__id">
          <img src="/fav.png" alt="" className="assistant__logo" />
          <div>
            <span className="assistant__name">MedXFlow Assistant</span>
            <span className="assistant__ctx">Developer mode · {title}</span>
          </div>
        </div>
        <button className="assistant__min" onClick={() => setOpen(false)} title="Minimize" aria-label="Minimize">
          ✕
        </button>
      </header>

      <div className="assistant__body" ref={bodyRef}>
        {messages.length === 0 && !sending ? (
          <div className="assistant__welcome">
            <img src="/fav.png" alt="" className="assistant__welcome-logo" />
            <h3 className="assistant__welcome-title">How can I help with {title}?</h3>
            <p className="assistant__welcome-sub">
              I'm your developer copilot for this screen. Describe a change and
              I'll walk through exactly what to edit.
            </p>
            <div className="assistant__suggestions">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="assistant__chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="assistant__thread">
            {messages.map((m) => (
              <ChatRow key={m.id} sender={m.sender} content={m.content} user={user} />
            ))}
            {sending && (
              <div className="turn turn--assistant">
                <span className="turn__avatar turn__avatar--ai">
                  <img src="/fav.png" alt="" />
                </span>
                <div className="turn__body">
                  <span className="turn__role">MedXFlow Assistant</span>
                  <div className="typing">
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <form className="composer" onSubmit={onSubmit}>
        <div className="composer__box">
          <textarea
            ref={textareaRef}
            className="composer__input"
            rows={1}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoGrow();
            }}
            onKeyDown={onKeyDown}
            placeholder={`Message the assistant about ${title}…`}
          />
          <button
            type="submit"
            className="composer__send"
            disabled={!input.trim() || sending}
            aria-label="Send"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="19" x2="12" y2="5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
          </button>
        </div>
        <span className="composer__hint">
          Enter to send · Shift+Enter for a new line
        </span>
      </form>
    </aside>
  );
}

/* ---------------------------------------------------------- one turn --- */
function ChatRow({ sender, content, user }) {
  const isUser = sender === "user";
  return (
    <div className={`turn turn--${isUser ? "user" : "assistant"}`}>
      {isUser ? (
        <span className="turn__avatar">
          <Avatar user={user} size={28} />
        </span>
      ) : (
        <span className="turn__avatar turn__avatar--ai">
          <img src="/fav.png" alt="" />
        </span>
      )}
      <div className="turn__body">
        <span className="turn__role">{isUser ? "You" : "MedXFlow Assistant"}</span>
        <div className="turn__text">{content}</div>
      </div>
    </div>
  );
}

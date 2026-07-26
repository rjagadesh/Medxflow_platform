// src/components/MeetingChat.jsx

import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { Send } from "lucide-react";
import config from "../../../../../services/config.js";

const BASE_URL = config.config.BASE_URL.trim().replace(/\/+$/, "");

const MeetingChat = ({
  meetingId,
  attendeeId,
  attendeeName,
  isTelehealth = false,
  isOnHold = false,
}) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  // Track last system hold/resume message to prevent duplicates
  const prevHoldStateRef = useRef(false);
  const lastHoldMessageRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const chatPrefix = isTelehealth ? "/app/telehealth/chat" : "/app/meetings/chat";

  console.log(`Chat using: ${BASE_URL}${chatPrefix}/send/ (isTelehealth: ${isTelehealth})`);

  // Determine if this is a guest (patient) session based on presence of X-Guest-Token logic
  // We detect this indirectly: if there's no access token in localStorage, assume guest
  const isGuest = !localStorage.getItem("access");

  const getHeaders = () => {
    if (isGuest) {
      // Patient/Guest: Use X-Guest-Token from URL (same as join request)
      const urlParams = new URLSearchParams(window.location.search);
      const guestToken = urlParams.get("token");

      if (!guestToken) {
        console.warn("Guest token missing for chat requests");
      }

      return {
        headers: {
          "X-Guest-Token": guestToken || "",
          "Content-Type": "application/json",
        },
      };
    }

    // Provider/Authenticated user: Use Bearer token
    return {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
        "Content-Type": "application/json",
      },
    };
  };

  const fetchMessages = async () => {
    if (!meetingId) return;

    try {
      setLoading(true);
      const response = await axios.get(
        `${BASE_URL}${chatPrefix}/${meetingId}/messages/`,
        getHeaders()
      );

      let msgs = Array.isArray(response.data)
        ? response.data
        : response.data.messages || [];

      // Strong deduplication: use a Set to track seen system hold/resume contents
      const seenHoldContents = new Set();
      const filteredMsgs = [];

      for (const msg of msgs) {
        const content = msg.content ? msg.content.trim() : "";
        const isHoldRelated =
          msg.type === "system" &&
          (content.toLowerCase().includes("hold") || 
           content.toLowerCase().includes("resume"));

        if (isHoldRelated) {
          if (seenHoldContents.has(content)) {
            continue;
          }
          seenHoldContents.add(content);
        }

        filteredMsgs.push(msg);
      }

      setMessages(filteredMsgs);
    } catch (err) {
      console.error("Fetch messages failed:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!text.trim() || sending || !meetingId) return;

    const payload = {
      meeting_id: meetingId,
      attendee_id: attendeeId,
      content: text.trim(),
    };

    try {
      setSending(true);
      await axios.post(
        `${BASE_URL}${chatPrefix}/send/`,
        payload,
        getHeaders()
      );

      setText("");
      fetchMessages();
    } catch (err) {
      console.error("Send failed:", err.response?.data || err.message);
      alert("Failed to send message.");
    } finally {
      setSending(false);
    }
  };

  const deleteMessage = async (messageId) => {
    try {
      await axios.delete(
        `${BASE_URL}${chatPrefix}/message/${messageId}/delete/`,
        getHeaders()
      );
      fetchMessages();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  useEffect(() => {
    if (!meetingId) return;
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [meetingId, chatPrefix]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="w-80 shrink-0 bg-neutral-900 border-l border-neutral-800 flex flex-col h-full">
      <div className="px-4 py-3 border-b border-neutral-800 font-medium text-white">
        Chat
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        {messages.map((msg) => {
          const isMine = msg.sender_name === attendeeName;

          return (
            <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"} mb-4`}>
              <div
                className={`relative max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-sm group ${
                  isMine ? "bg-neutral-700" : "bg-neutral-800 text-neutral-100"
                }`}
              >
                {!isMine && (
                  <div className="text-xs text-neutral-400 font-medium mb-1">
                    {msg.sender_name || "Unknown"}
                  </div>
                )}
                <div className="break-words text-sm pr-10">
                  {msg.content || "(empty message)"}
                </div>

                {isMine && (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="relative group/menu">
                      <button className="p-1 rounded-full hover:bg-white/20 transition">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="5" r="1" />
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="12" cy="19" r="1" />
                        </svg>
                      </button>
                      <div className="absolute right-0 mt-1 w-32 bg-neutral-900 border border-neutral-700 rounded-md shadow-md z-30 opacity-0 scale-95 pointer-events-none transition-all duration-150 group-hover/menu:opacity-100 group-hover/menu:scale-100 group-hover/menu:pointer-events-auto">
                        <button
                          onClick={() => deleteMessage(msg.id)}
                          className="w-full px-3 py-2 text-left text-xs text-red-300 hover:bg-neutral-800 rounded-md"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 border-t border-neutral-800">
        <div className="flex items-center gap-2 bg-neutral-800 rounded-lg px-3 py-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            disabled={sending}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder-neutral-500"
          />
          <button
            onClick={sendMessage}
            disabled={sending || !text.trim()}
            className="text-blue-400 hover:text-blue-300 disabled:opacity-50 transition"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default MeetingChat;
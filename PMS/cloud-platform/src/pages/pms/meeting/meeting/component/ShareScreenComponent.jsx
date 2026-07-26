// src/pages/pms/meeting/meeting/component/ShareScreenComponent.jsx

import React, { useState } from "react";
import { ScreenShare, ScreenShareOff } from "lucide-react";
import axios from "axios";
import chimeService from "../services/chimeService";
import config from "../../../../../services/config.js";

const BASE_URL = config.config.BASE_URL.trim().replace(/\/+$/, "");

const ShareScreenComponent = ({
  meetingId,
  attendeeId,
  onToggle,
  isTelehealth = false, // ← Added for consistency with other components
}) => {
  const [isSharing, setIsSharing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Detect if this is a guest (patient) session
  const isGuest = !localStorage.getItem("access");

  const getHeaders = () => {
    if (isGuest) {
      // Patient/Guest: Use X-Guest-Token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const guestToken = urlParams.get("token");

      if (!guestToken) {
        console.warn("Guest token missing for screen share request");
      }

      return {
        headers: {
          "X-Guest-Token": guestToken || "",
          "Content-Type": "application/json",
        },
      };
    }

    // Provider/Authenticated: Use Bearer token
    return {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("access")}`,
        "Content-Type": "application/json",
      },
    };
  };

  // Conditional endpoint — same pattern as Hold/Recording/Chat
  const screenshareBase = isTelehealth
    ? "/app/telehealth/screenshare"
    : "/app/meetings/screenshare";

  const handleToggleShare = async () => {
    if (!meetingId || !attendeeId) return;

    setLoading(true);

    try {
      if (!isSharing) {
        /* ---------------- START SCREEN SHARE ---------------- */

        // 1. Start Chime SDK screen share
        await chimeService.startScreenShare();

        // 2. Inform backend
        await axios.post(
          `${BASE_URL}${screenshareBase}/start/`,
          {
            meeting_id: meetingId,
            attendee_id: attendeeId,
          },
          getHeaders()
        );

        setIsSharing(true);
        onToggle?.(true);
      } else {
        /* ---------------- STOP SCREEN SHARE ---------------- */

        // 1. Stop Chime SDK
        await chimeService.stopScreenShare();

        // 2. Inform backend
        await axios.post(
          `${BASE_URL}${screenshareBase}/stop/`,
          {
            meeting_id: meetingId,
            attendee_id: attendeeId,
          },
          getHeaders()
        );

        setIsSharing(false);
        onToggle?.(false);
      }
    } catch (err) {
      console.error("Screen share failed:", err.response?.data || err.message);

      // Safety reset if user cancels browser picker or backend fails
      setIsSharing(false);
      onToggle?.(false);

      alert("Screen share operation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggleShare}
      disabled={loading}
      className={`flex flex-col items-center gap-1 text-xs transition-colors
        ${isSharing ? "text-blue-500" : "text-neutral-400 hover:text-white"}
        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isSharing ? <ScreenShareOff size={22} /> : <ScreenShare size={22} />}
      <span>{isSharing ? "Stop Share" : "Share"}</span>
    </button>
  );
};

export default ShareScreenComponent;
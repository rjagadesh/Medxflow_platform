// src/pages/pms/meeting/meeting/component/HoldComponent.jsx

import React, { useState, useRef } from "react";
import { Pause, Phone } from "lucide-react";
import axios from "axios";
import chimeService from "../services/chimeService";
import config from "../../../../../services/config.js";

const BASE_URL = config.config.BASE_URL.trim().replace(/\/+$/, "");

const HoldComponent = ({
  meetingId,
  attendeeId,
  attendeeName,
  onHoldChange,
  onHoldStateChange,
  isTelehealth = false,
}) => {
  const [isOnHold, setIsOnHold] = useState(false);
  const [loading, setLoading] = useState(false);
  const [prevMuted, setPrevMuted] = useState(false);
  const [prevVideoOn, setPrevVideoOn] = useState(true);
  const prevVideoDeviceRef = useRef(null);
  const isProcessingRef = useRef(false);

  const isGuest = !localStorage.getItem("access");

  const getHeaders = () => {
    if (isGuest) {
      const urlParams = new URLSearchParams(window.location.search);
      const guestToken = urlParams.get("token");
      return {
        headers: { "X-Guest-Token": guestToken || "", "Content-Type": "application/json" },
      };
    }
    return {
      headers: { Authorization: `Bearer ${localStorage.getItem("access")}`, "Content-Type": "application/json" },
    };
  };

  const holdEndpoint = isTelehealth
    ? "/app/telehealth/call/hold/"
    : "/app/meetings/call/hold/";

  const handleHoldToggle = async () => {
    if (isProcessingRef.current || !meetingId || !attendeeId) return;
    isProcessingRef.current = true;
    setLoading(true);

    try {
      if (!isOnHold) {
        // ----- GOING ON HOLD -----
        console.log("Putting call on HOLD");

        setPrevMuted(chimeService.isAudioMuted());
        setPrevVideoOn(chimeService.isVideoEnabled());

        // Save current video device
        if (chimeService.isVideoEnabled()) {
          prevVideoDeviceRef.current = chimeService.getCurrentVideoInputDevice();
        }

        // Stop audio/video
        await chimeService.muteAudio();
        await chimeService.stopVideoInput();

        // Notify backend
        await axios.post(
          `${BASE_URL}${holdEndpoint}`,
          { meeting_id: meetingId, attendee_id: attendeeId, on_hold: true },
          getHeaders()
        );

        // Send real-time hold message
        await chimeService.sendDataMessage({
          type: "hold_state",
          attendeeId,
          attendeeName: attendeeName || "Unknown",
          isOnHold: true,
        });

        setIsOnHold(true);
        onHoldChange?.(true);
        onHoldStateChange?.(true);

        console.log("Call is now ON HOLD");
      } else {
        // ----- RESUMING -----
        console.log("RESUMING call from hold");

        if (!prevMuted) await chimeService.unmuteAudio();
        if (prevVideoOn && prevVideoDeviceRef.current) {
          await chimeService.startVideo(prevVideoDeviceRef.current);
        }

        await axios.post(
          `${BASE_URL}${holdEndpoint}`,
          { meeting_id: meetingId, attendee_id: attendeeId, on_hold: false },
          getHeaders()
        );

        await chimeService.sendDataMessage({
          type: "hold_state",
          attendeeId,
          attendeeName: attendeeName || "Unknown",
          isOnHold: false,
        });

        setIsOnHold(false);
        onHoldChange?.(false);
        onHoldStateChange?.(false);

        console.log("Call RESUMED successfully");
      }
    } catch (err) {
      console.error("Hold/Resume failed:", err.response?.data || err.message);
      alert("Hold operation failed. Please try again.");
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
    }
  };

  return (
    <button
      onClick={handleHoldToggle}
      disabled={loading}
      className={`flex flex-col items-center gap-1 text-xs transition-colors
        ${isOnHold ? "text-yellow-400" : "text-neutral-400 hover:text-white"}
        ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {isOnHold ? <Phone size={22} /> : <Pause size={22} />}
      <span>{isOnHold ? "Resume" : "Hold"}</span>
    </button>
  );
};

export default HoldComponent;

// src/components/RecordingComponent.jsx

import React, { useState } from "react";
import { Circle, Square, Pause, Play } from "lucide-react";
import axios from "axios";
import config from "../../../../../services/config.js";

const BASE_URL = config.config.BASE_URL.trim().replace(/\/+$/, "");

const RecordingComponent = ({
  meetingId,
  attendeeId,
  onRecordingStopped,
  isTelehealth = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingId, setRecordingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Detect if this is a guest (patient) session
  const isGuest = !localStorage.getItem("access");

  const getHeaders = () => {
    if (isGuest) {
      // Patient/Guest: Use X-Guest-Token from URL
      const urlParams = new URLSearchParams(window.location.search);
      const guestToken = urlParams.get("token");

      if (!guestToken) {
        console.warn("Guest token missing for recording request");
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

  // Conditional base path
  const recordingBase = isTelehealth
    ? "/app/telehealth/recording"
    : "/app/meetings/recording";

  /* ---------------- START RECORDING ---------------- */
  const startRecording = async () => {
    if (!meetingId || !attendeeId) return;

    setLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}${recordingBase}/start/`,
        {
          meeting_id: meetingId,
          attendee_id: attendeeId,
        },
        getHeaders()
      );

      setRecordingId(res.data?.recording_id);
      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("Start recording failed:", err.response?.data || err.message);
      alert("Failed to start recording.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- STOP RECORDING ---------------- */
  const stopRecording = async () => {
    if (!recordingId) return;

    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}${recordingBase}/stop/`,
        {
          meeting_id: meetingId,
          attendee_id: attendeeId,
          recording_id: recordingId,
        },
        getHeaders()
      );

      setIsRecording(false);
      setIsPaused(false);
      setRecordingId(null);
      onRecordingStopped?.();
    } catch (err) {
      console.error("Stop recording failed:", err.response?.data || err.message);
      alert("Failed to stop recording.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- PAUSE RECORDING ---------------- */
  const pauseRecording = async () => {
    if (!recordingId) return;

    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}${recordingBase}/pause/`,
        {
          meeting_id: meetingId,
          attendee_id: attendeeId,
          recording_id: recordingId,
        },
        getHeaders()
      );

      setIsPaused(true);
    } catch (err) {
      console.error("Pause recording failed:", err.response?.data || err.message);
      alert("Failed to pause recording.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- RESUME RECORDING ---------------- */
  const resumeRecording = async () => {
    if (!recordingId) return;

    setLoading(true);
    try {
      await axios.post(
        `${BASE_URL}${recordingBase}/resume/`,
        {
          meeting_id: meetingId,
          attendee_id: attendeeId,
          recording_id: recordingId,
        },
        getHeaders()
      );

      setIsPaused(false);
    } catch (err) {
      console.error("Resume recording failed:", err.response?.data || err.message);
      alert("Failed to resume recording.");
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <div className="flex items-center gap-3">
      {!isRecording && (
        <button
          onClick={startRecording}
          disabled={loading}
          className="flex flex-col items-center gap-1 text-xs text-red-500 hover:text-red-600 disabled:opacity-50"
        >
          <Circle size={22} />
          <span>Record</span>
        </button>
      )}

      {isRecording && !isPaused && (
        <>
          <button
            onClick={pauseRecording}
            disabled={loading}
            className="flex flex-col items-center gap-1 text-xs text-yellow-400 hover:text-yellow-500 disabled:opacity-50"
          >
            <Pause size={22} />
            <span>Pause</span>
          </button>

          <button
            onClick={stopRecording}
            disabled={loading}
            className="flex flex-col items-center gap-1 text-xs text-neutral-400 hover:text-white disabled:opacity-50"
          >
            <Square size={22} />
            <span>Stop</span>
          </button>
        </>
      )}

      {isRecording && isPaused && (
        <>
          <button
            onClick={resumeRecording}
            disabled={loading}
            className="flex flex-col items-center gap-1 text-xs text-green-400 hover:text-green-500 disabled:opacity-50"
          >
            <Play size={22} />
            <span>Resume</span>
          </button>

          <button
            onClick={stopRecording}
            disabled={loading}
            className="flex flex-col items-center gap-1 text-xs text-neutral-400 hover:text-white disabled:opacity-50"
          >
            <Square size={22} />
            <span>Stop</span>
          </button>
        </>
      )}
    </div>
  );
};

export default RecordingComponent;
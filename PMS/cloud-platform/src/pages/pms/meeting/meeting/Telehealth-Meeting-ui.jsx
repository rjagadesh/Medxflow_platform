import React, { useState } from "react";
import apiService from "./services/apiService";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";

function TelehealthAppLayout() {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [meetingData, setMeetingData] = useState(null);
  const [attendeeData, setAttendeeData] = useState(null);
  const [attendeeName, setAttendeeName] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // New: Handle back button click
  const handleBack = () => {
    navigate("/pms/telehealth");
  };

  const handleCreateMeeting = async () => {
    if (!attendeeName.trim()) {
      setError("Please enter your name");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiService.createMeeting(attendeeName);
      setMeetingData(response.meeting);
      setAttendeeData(response.attendee);
      setIsInMeeting(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMeeting = async () => {
    if (!attendeeName.trim() || !meetingId.trim()) {
      setError("Please enter your name and meeting ID");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await apiService.joinMeeting(meetingId, attendeeName);
      setMeetingData(response.meeting);
      setAttendeeData(response.attendee);
      setIsInMeeting(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isInMeeting && meetingData && attendeeData) {
      navigate("/pms/path/telehealth", {
        state: {
          meetingData,
          attendeeData,
          isTelehealth: false,
        },
      });
    }
  }, [isInMeeting, meetingData, attendeeData, navigate]);

  // Determine if we should show only Join button
  const hasMeetingId = meetingId.trim().length > 0;

  return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-8 relative">
        {/* Back Button - Top Right */}
        <button
          onClick={handleBack}
          className="absolute top-4 right-4 text-neutral-400 hover:text-white transition"
          aria-label="Go back"
        >
          Back
        </button>

        <h1 className="text-2xl font-semibold mb-6 text-center">
          Telehealth Meetings
        </h1>

        {error && (
          <div className="mb-4 bg-red-600/20 border border-red-600 text-red-400 px-4 py-2 rounded text-sm">
            {error}
          </div>
        )}

        {/* NAME */}
        <div className="mb-4">
          <label className="block text-sm mb-1 text-neutral-400">
            Your Name
          </label>
          <input
            type="text"
            value={attendeeName}
            onChange={(e) => setAttendeeName(e.target.value)}
            placeholder="Enter your name"
            disabled={loading}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* MEETING ID */}
        <div className="mb-6">
          <label className="block text-sm mb-1 text-neutral-400">
            Meeting ID (optional)
          </label>
          <input
            type="text"
            value={meetingId}
            onChange={(e) => setMeetingId(e.target.value)}
            placeholder="Enter meeting ID to join"
            disabled={loading}
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* BUTTONS - Conditional Rendering */}
        <div className="flex gap-3">
          {/* Show Create Meeting only when NO Meeting ID is entered */}
          {!hasMeetingId && (
            <button
              onClick={handleCreateMeeting}
              disabled={loading || !attendeeName.trim()}
              className="flex-1 py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-sm font-medium transition"
            >
              {loading ? "Creating..." : "Create Meeting"}
            </button>
          )}

          {/* Always show Join Meeting (but disabled if inputs invalid) */}
          <button
            onClick={handleJoinMeeting}
            disabled={loading || !attendeeName.trim() || (!hasMeetingId && !meetingId.trim())}
            className={`flex-1 py-2 rounded-md transition text-sm font-medium ${
              hasMeetingId
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-neutral-700 hover:bg-neutral-600"
            } disabled:opacity-50`}
          >
            {loading ? "Joining..." : "Join Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TelehealthAppLayout;
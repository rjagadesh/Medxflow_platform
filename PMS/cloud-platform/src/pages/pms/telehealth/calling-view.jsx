import React, { useState } from "react";
import apiService from "../meeting/meeting/services/apiService";
import TelehealthAppLayout from "../meeting/meeting/Telehealth-Meeting-ui";

function CallingView() {
  const [isInMeeting, setIsInMeeting] = useState(false);
  const [meetingData, setMeetingData] = useState(null);
  const [attendeeData, setAttendeeData] = useState(null);
  const [attendeeName, setAttendeeName] = useState("");
  const [meetingId, setMeetingId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const createMeeting = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.createMeeting(attendeeName);
      setMeetingData(res.meeting);
      setAttendeeData(res.attendee);
      setIsInMeeting(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiService.joinMeeting(meetingId, attendeeName);
      setMeetingData(res.meeting);
      setAttendeeData(res.attendee);
      setIsInMeeting(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  if (isInMeeting) {
    return (
      <TelehealthAppLayout
        meetingData={meetingData}
        attendeeData={attendeeData}
        onLeaveMeeting={() => setIsInMeeting(false)}
      />
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-900 text-white px-4">
      <div className="w-full max-w-md bg-zinc-800 rounded-2xl shadow-xl p-6 space-y-5">
        <h2 className="text-2xl font-semibold text-center">
          Amazon Chime Telehealth
        </h2>

        {error && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Your Name
            </label>
            <input
              placeholder="Enter your name"
              value={attendeeName}
              onChange={(e) => setAttendeeName(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg bg-zinc-700 text-white placeholder-zinc-400 px-4 py-2 outline-none border border-zinc-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1">
              Meeting ID (optional)
            </label>
            <input
              placeholder="Enter meeting ID to join"
              value={meetingId}
              onChange={(e) => setMeetingId(e.target.value)}
              disabled={loading}
              className="w-full rounded-lg bg-zinc-700 text-white placeholder-zinc-400 px-4 py-2 outline-none border border-zinc-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30 transition"
            />
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={createMeeting}
            disabled={loading || !attendeeName}
            className="flex-1 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 transition"
          >
            {loading ? "Creating..." : "Create Meeting"}
          </button>

          <button
            onClick={joinMeeting}
            disabled={loading || !attendeeName || !meetingId}
            className="flex-1 rounded-lg bg-zinc-600 hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 transition"
          >
            {loading ? "Joining..." : "Join Meeting"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CallingView;

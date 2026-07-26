import { useEffect, useRef, useState } from "react";
import axios from "axios";
import ApiConstant from "@/services/constant";
import MeetingRoom from "./MeetingRoom";

const BASE_URL = ApiConstant.BASE_URL.trim().replace(/\/+$/, "");

/**
 * Entry point for the patient guest telehealth link:
 *   /patient-telehealth?token=...&meetingid=...&name=...
 * Validates the guest token, joins the meeting as a guest (no login), then
 * renders the MeetingRoom with the returned Chime meeting + attendee data.
 */
const PatientGuestEntry = () => {
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const [message, setMessage] = useState("Joining your appointment…");
  const [meetingData, setMeetingData] = useState(null);
  const [attendeeData, setAttendeeData] = useState(null);
  const joinedRef = useRef(false); // guard against double-join in StrictMode

  useEffect(() => {
    if (joinedRef.current) return;
    joinedRef.current = true;

    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Invalid meeting link: no access token provided.");
      return;
    }

    const run = async () => {
      try {
        // 1) Validate the guest token
        const validate = await axios.get(
          `${BASE_URL}/app/telehealth/guest/validate/?token=${encodeURIComponent(token)}`,
        );
        if (!validate.data?.valid) {
          setStatus("error");
          const reason = validate.data?.reason;
          setMessage(
            reason === "expired"
              ? "This meeting link has expired."
              : "This meeting link is no longer valid.",
          );
          return;
        }

        // 2) Join the meeting as a guest
        const join = await axios.post(
          `${BASE_URL}/app/telehealth/guest/join/`,
          { token },
          { headers: { "Content-Type": "application/json" } },
        );

        setMeetingData(join.data.meeting);
        setAttendeeData(join.data.attendee);
        setStatus("ready");
      } catch (err) {
        const apiMsg = err?.response?.data?.error;
        setStatus("error");
        setMessage(
          apiMsg ||
            "Could not join the meeting. The provider may not have started it yet.",
        );
      }
    };

    run();
  }, []);

  if (status === "ready" && meetingData && attendeeData) {
    // MeetingRoom's root is h-full, so it needs a full-viewport height ancestor.
    // The patient route renders outside the app layout, so provide it here.
    return (
      <div className="h-screen w-screen overflow-hidden">
        <MeetingRoom
          meetingData={meetingData}
          attendeeData={attendeeData}
          isTelehealth={true}
          isGuest={true}
        />
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
      <div className="text-center px-6">
        {status === "loading" && (
          <div className="mb-4 h-10 w-10 mx-auto border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        )}
        <p className="text-xl">{message}</p>
        {status === "error" && (
          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-6 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-500"
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
};

export default PatientGuestEntry;

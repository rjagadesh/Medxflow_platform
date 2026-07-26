import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import chimeService from "../services/chimeService";
import process from "process";
import { Buffer } from "buffer";
import ShareScreenComponent from "./ShareScreenComponent";
import RecordingComponent from "./RecordingComponent";
import HoldComponent from "./HoldComponent";
import LiveTranscription from "./LiveTranscription";
import apiService from "../services/apiService";

import {
  PhoneOff,
  Pause,
  MessageCircle,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Copy,
  Check,
  Mic as MicIcon,
  Subtitles,
  FileText,
} from "lucide-react";
import MeetingChat from "./MeetingChat";

window.global = window;
window.process = process;
window.Buffer = Buffer;

const MeetingRoom = (props = {}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const { state } = location;

  // Data may come from router navigation state (provider flow) or via props
  // (patient guest flow renders this component directly with fetched data).
  const meetingData = props.meetingData ?? state?.meetingData;
  const attendeeData = props.attendeeData ?? state?.attendeeData;
  const isTelehealth = props.isTelehealth ?? state?.isTelehealth ?? false;

  const [isOnHold, setIsOnHold] = useState(false);
  const [localTileId, setLocalTileId] = useState(null);

  if (!meetingData || !attendeeData) {
    return (
      <div className="h-screen w-screen bg-black flex items-center justify-center text-white">
        <div className="text-center">
          <p className="text-xl mb-4">Unable to join meeting</p>
          <button
            onClick={() => navigate("/meetings")}
            className="px-6 py-3 bg-cyan-600 rounded-lg hover:bg-cyan-500"
          >
            Back to Calendar
          </button>
        </div>
      </div>
    );
  }

  const localVideoRef = useRef(null);
  const audioRef = useRef(null);
  const [recordings, setRecordings] = useState([]);
  const [recordingsLoading, setRecordingsLoading] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [participants, setParticipants] = useState([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState("requesting");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [isLocalSharing, setIsLocalSharing] = useState(false);

  const [mainTileId, setMainTileId] = useState(null);

  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showCaptions, setShowCaptions] = useState(true);

  const [copied, setCopied] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const meetingId = meetingData?.meeting_id;

  const handleTranscribeToggle = async () => {
  try {
    if (isTranscribing) {
      // 1. Try to tell the backend to stop
      await apiService.stopTranscription(meetingId);
      
      // 2. If successful, update UI
      setIsTranscribing(false);
      setShowCaptions(false);
    } else {
      // 1. Try to tell backend to start
      await apiService.startTranscription(meetingId);
      
      // 2. If successful, update UI
      setIsTranscribing(true);
      setShowCaptions(true); // Good practice to show captions when starting
    }
  } catch (err) {
    // CHECK THE ERROR MESSAGE HERE
    if (err.message?.includes("No active transcription found")) {
      // If the backend says it's already gone, we treat this as a success 
      // and shut down the frontend transcription logic.
      console.warn("Transcription was already stopped on the server side.");
      setIsTranscribing(false);
      setShowCaptions(false);
    } else {
      // If it's a different error (like a 500 or Network Error), log it.
      console.error("Transcription toggle failed:", err);
    }
  }
};

  const handleCopyMeetingId = async () => {
    try {
      await navigator.clipboard.writeText(meetingData?.meeting_id || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Copy failed:", err);
    }
  };

  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isInitialized]);

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const s = (seconds % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  useEffect(() => {
    const initMeeting = async () => {
      try {
        setPermissionStatus("requesting");

        try {
          await navigator.permissions.query({ name: "camera" });
          await navigator.permissions.query({ name: "microphone" });
          setPermissionStatus("granted");
        } catch {
          setPermissionStatus("denied");
          setError("Camera/Microphone access denied.");
          return;
        }

        await chimeService.initializeMeetingSession(meetingData, attendeeData);

        if (audioRef.current) {
          chimeService.bindAudioElement(audioRef.current);
        }

        const observers = {
          videoTileDidUpdate: (tileState) => {
            if (!tileState.boundAttendeeId) return;

            if (tileState.localTile) {
              setLocalTileId(tileState.tileId);
            }

            setParticipants((prev) => {
              const exists = prev.find((p) => p.tileId === tileState.tileId);
              let newParticipants;
              if (exists) {
                newParticipants = prev.map((p) =>
                  p.tileId === tileState.tileId ? { ...p, ...tileState } : p
                );
              } else {
                newParticipants = [...prev, tileState];
              }

              if (tileState.isContent && !exists) {
                setMainTileId(tileState.tileId);
              }

              return newParticipants;
            });

            if (tileState.localTile && localVideoRef.current) {
              chimeService.bindVideoElement(
                tileState.tileId,
                localVideoRef.current
              );

              setTimeout(() => {
                if (localVideoRef.current) {
                  localVideoRef.current.play().catch((e) => console.warn("Play failed:", e));
                }
              }, 100);
            }
          },

          videoTileWasRemoved: (tileId) => {
            setParticipants((prev) => prev.filter((p) => p.tileId !== tileId));
            if (mainTileId === tileId) {
              setMainTileId(null);
            }
          },

          audioVideoDidStart: () => {
            setIsInitialized(true);
            setError(null);
          },

          audioVideoDidStop: () => {
            setIsInitialized(false);
          },

          volumeDidChange: (attendeeId, volume) => {
            if (volume > 0) {
              setIsSpeaking(true);
              setTimeout(() => setIsSpeaking(false), 1000);
            }
          },
        };

        chimeService.addObservers(observers);

        await chimeService.startMeeting(localVideoRef.current);
      } catch (error) {
        console.error("Failed to initialize meeting:", error);
        setError(`Failed to start meeting: ${error.message}`);
        setPermissionStatus("error");
      }
    };

    initMeeting();

    return async () => {
      try {
        // Ensure audio is stopped properly
        await chimeService.stopMedia();
        await chimeService.leaveMeeting();
      } catch (e) {
        console.warn("Cleanup error:", e);
      }
    };
  }, [meetingData, attendeeData]);

  const handleToggleMute = async () => {
    if (!isInitialized) return;
    const muted = await chimeService.toggleMute();
    setIsMuted(muted);
  };

  const handleToggleVideo = async () => {
    if (!isInitialized) return;
    const enabled = await chimeService.toggleVideo();
    setIsVideoEnabled(enabled);
  };

  const handleLeaveMeeting = async () => {
    try {
      // Properly cleanup before navigating
      setIsInitialized(false);
      
      // Stop all media tracks
      await chimeService.stopMedia();
      await chimeService.leaveMeeting();
      
      // Navigate after cleanup
      navigate(-1);
    } catch (error) {
      console.error("Error leaving meeting:", error);
      // Navigate anyway even if cleanup fails
      navigate(-1);
    }
  };

  const contentTile = participants.find((p) => p.isContent);
  const mainTile =
    participants.find((p) => p.tileId === mainTileId) ||
    contentTile ||
    participants.find((p) => !p.localTile) ||
    null;

  const localTile = participants.find((p) => p.localTile);
  const remoteTiles = participants.filter(
    (p) => !p.localTile && p.tileId !== mainTile?.tileId
  );

  const handleThumbnailClick = (tileId) => {
    setMainTileId(tileId);
  };

  const fetchRecordings = async () => {
    if (!meetingData?.meeting_id) return;

    setRecordingsLoading(true);
    try {
      const res = await fetch(
        `${BASE_URL}/app/meetings/recording/${meetingData.meeting_id}/list/`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        }
      );

      const data = await res.json();
      setRecordings(data || []);
    } catch (err) {
      console.error("Failed to fetch recordings", err);
    } finally {
      setRecordingsLoading(false);
    }
  };

  return (
    <div className="h-full w-full bg-black text-white flex flex-col overflow-hidden">
      <audio ref={audioRef} autoPlay playsInline className="hidden" />

      {/* Top Bar */}
      <div className="flex items-center justify-between px-6 py-2 text-sm text-neutral-400 border-b border-neutral-800">
        {/* LEFT: Timer + Meeting ID */}
        <div className="flex items-center gap-8">
          <span>⏱ {formatTime(elapsedSeconds)}</span>

          {/* Meeting ID with Copy Button */}
          <div className="flex items-center gap-3 bg-neutral-900/70 px-4 py-1.5 rounded-lg border border-neutral-700">
            <span className="text-gray-400 text-xs">Meeting Id:</span>
            <span className="text-sky-400 font-mono text-base select-all">
              {meetingData?.meeting_id}
            </span>
            <button
              onClick={handleCopyMeetingId}
              className="text-white hover:text-sky-400 transition"
            >
              {copied ? (
                <>
                  <Check size={18} className="text-green-400" />
                  <span className="text-green-400 text-xs ml-1">Copied!</span>
                </>
              ) : (
                <Copy size={18} />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <ShareScreenComponent
            meetingId={meetingData?.meeting_id}
            attendeeId={attendeeData?.attendee_id}
            onToggle={(isSharing) => setIsLocalSharing(isSharing)}
          />
          <RecordingComponent
            meetingId={meetingData?.meeting_id}
            attendeeId={attendeeData?.attendee_id}
            onRecordingStopped={fetchRecordings}
            isTelehealth={isTelehealth}
          />
          <HoldComponent
            meetingId={meetingData?.meeting_id}
            attendeeId={attendeeData?.attendee_id}
            attendeeName={attendeeData?.attendee_name}
            onHoldStateChange={setIsOnHold}
            isTelehealth={isTelehealth}
          />
          <LiveTranscription
            meetingId={meetingData?.meeting_id}
            transcriptionActive={isTranscribing}
            showCaptions={showCaptions}
          />
          {/* Start / Stop Transcription */}
          <button
            onClick={handleTranscribeToggle}
            className="flex flex-col items-center text-xs text-neutral-400 hover:text-white"
          >
            <MicIcon
              size={22}
              className={isTranscribing ? "text-red-500" : "text-green-400"}
            />
            <span>{isTranscribing ? "Stop Transcribe" : "Transcribe"}</span>
          </button>

          {/* Show / Hide Captions */}
          <button
            onClick={() => setShowCaptions((v) => !v)}
            disabled={!isTranscribing}
            className={`flex flex-col items-center text-xs ${
              showCaptions ? "text-sky-400" : "text-neutral-400"
            } hover:text-white disabled:opacity-40`}
          >
            <Subtitles size={22} />
            <span>{showCaptions ? "Hide Captions" : "Captions"}</span>
          </button>

          <button
            onClick={() => setIsChatOpen((v) => !v)}
            className="flex flex-col items-center text-xs text-neutral-400 hover:text-white"
          >
            <MessageCircle size={22} />
            <span>Chat</span>
          </button>

          <button
            onClick={handleToggleVideo}
            disabled={!isInitialized}
            className="flex flex-col items-center text-xs text-neutral-400 hover:text-white disabled:opacity-50"
          >
            {isVideoEnabled ? <Video size={22} /> : <VideoOff size={22} className="text-red-500" />}
            <span>{isVideoEnabled ? "Camera" : "Camera Off"}</span>
          </button>

          <button
            onClick={handleToggleMute}
            disabled={!isInitialized}
            className="flex flex-col items-center text-xs text-neutral-400 hover:text-white disabled:opacity-50"
          >
            {isMuted ? <MicOff size={22} className="text-red-500" /> : <Mic size={22} />}
            <span>{isMuted ? "Muted" : "Mic"}</span>
          </button>

          <button
            onClick={handleLeaveMeeting}
            className="flex flex-col items-center text-xs text-red-500 hover:text-red-600"
          >
            <PhoneOff size={22} />
            <span>Leave</span>
          </button>
        </div>
      </div>

      {/* Main Video Area */}
      <div className="flex flex-1 overflow-hidden relative">
        <div className="flex-1 relative bg-neutral-900 flex items-center justify-center">
          {mainTile ? (
            <video
              key={mainTile.tileId}
              autoPlay
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
              ref={(el) => {
                if (el) chimeService.bindVideoElement(mainTile.tileId, el);
              }}
            />
          ) : (
            <div className="text-neutral-500 text-xl">
              Waiting for others to join...
            </div>
          )}

          {localTile && (
            <div className="absolute bottom-6 right-6 w-56 h-32 rounded-lg overflow-hidden bg-black border border-neutral-700 shadow-2xl">
              <div className="relative w-full h-full">
                {isVideoEnabled ? (
                  <video
                    ref={localVideoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="w-full h-full bg-neutral-900" />
                )}

                {isOnHold && (
                  <div className="absolute inset-0 bg-neutral-900/90 flex flex-col items-center justify-center text-neutral-400 z-10">
                    <Pause size={48} className="mb-3" />
                    <span className="text-xl font-semibold">On Hold</span>
                  </div>
                )}

                <div className="absolute bottom-1 left-1 bg-black/60 text-xs px-3 py-1 rounded flex items-center gap-2 z-20">
                  {!isVideoEnabled && <VideoOff size={16} className="text-white" />}
                  {isMuted && <MicOff size={16} className="text-white" />}
                  <span>You</span>
                  {!isMuted && isSpeaking && (
                    <span className="ml-1 animate-pulse text-red-400">●</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 overflow-x-auto px-4 py-2 max-w-full scrollbar-thin scrollbar-thumb-neutral-700">
            {remoteTiles.map((p) => (
              <div
                key={p.tileId}
                onClick={() => handleThumbnailClick(p.tileId)}
                className={`w-32 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all cursor-pointer hover:scale-105 ${
                  mainTile?.tileId === p.tileId
                    ? "border-white shadow-lg scale-110"
                    : "border-neutral-700"
                }`}
              >
                <video
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                  ref={(el) => {
                    if (el) chimeService.bindVideoElement(p.tileId, el);
                  }}
                />
                <div className="absolute bottom-1 left-1 bg-black/60 text-xs px-2 py-0.5 rounded">
                  Participant
                </div>
              </div>
            ))}
          </div>
        </div>

        {isChatOpen && (
          <MeetingChat
            meetingId={meetingData?.meeting_id}
            attendeeId={attendeeData?.attendee_id}
            attendeeName={attendeeData?.attendee_name}
            isTelehealth={isTelehealth}
            isOnHold={isOnHold}
          />
        )}
      </div>

      {!isInitialized && permissionStatus !== "denied" && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm text-neutral-300">
              {permissionStatus === "requesting"
                ? "Requesting camera and microphone access..."
                : "Connecting to meeting..."}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 px-4 py-2 rounded text-sm z-50">
          {error}
          <button onClick={() => window.location.reload()} className="ml-3 underline">
            Reload
          </button>
        </div>
      )}
    </div>
  );
};

export default MeetingRoom;

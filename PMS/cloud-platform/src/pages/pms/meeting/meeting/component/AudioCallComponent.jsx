import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom'; // ← Added for navigation
import {
  MeetingSessionConfiguration,
  ConsoleLogger,
  LogLevel,
  DefaultDeviceController,
  DefaultMeetingSession,
} from 'amazon-chime-sdk-js';
import axios from 'axios';
import ApiService from "../services/apiService";

const AudioCallComponent = ({ onCallEnd }) => {
  const navigate = useNavigate(); // ← For redirecting

  const [meetingData, setMeetingData] = useState(null);
  const [attendeeData, setAttendeeData] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [participants, setParticipants] = useState([]);
  const [audioInputDevices, setAudioInputDevices] = useState([]);
  const [audioOutputDevices, setAudioOutputDevices] = useState([]);
  const [selectedInputDevice, setSelectedInputDevice] = useState('');
  const [selectedOutputDevice, setSelectedOutputDevice] = useState('');

  // Form states
  const [attendeeName, setAttendeeName] = useState('');
  const [meetingIdToJoin, setMeetingIdToJoin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const meetingSessionRef = useRef(null);
  const audioVideoRef = useRef(null);
  const durationTimerRef = useRef(null);

  const mapToChimeObjects = (backendMeeting, backendAttendee) => ({
    meeting: {
      MeetingId: backendMeeting.meeting_id,
      ExternalMeetingId: backendMeeting.external_meeting_id,
      MediaRegion: backendMeeting.media_region,
      MediaPlacement: backendMeeting.media_placement,
    },
    attendee: {
      AttendeeId: backendAttendee.attendee_id,
      ExternalUserId: backendAttendee.external_user_id,
      JoinToken: backendAttendee.join_token,
    },
  });

  const initializeChimeSDK = async (meeting, attendee) => {
    try {
      const logger = new ConsoleLogger('ChimeSDK', LogLevel.INFO);
      const deviceController = new DefaultDeviceController(logger);

      const configuration = new MeetingSessionConfiguration(meeting, attendee);

      const meetingSession = new DefaultMeetingSession(
        configuration,
        logger,
        deviceController
      );

      meetingSessionRef.current = meetingSession;
      audioVideoRef.current = meetingSession.audioVideo;

      // 🎧 Bind audio output FIRST
      audioVideoRef.current.bindAudioElement(
        document.getElementById('audio-element')
      );

      // 🎤 Select microphone
      const audioInputs = await audioVideoRef.current.listAudioInputDevices();
      if (!audioInputs.length) {
        throw new Error('No microphone found');
      }

      await audioVideoRef.current.startAudioInput(audioInputs[0].deviceId);

      setupAudioObservers();

      // ▶️ Start Chime session LAST
      audioVideoRef.current.start();

      setIsConnected(true);
      startDurationTimer();
      setError('');
    } catch (err) {
      console.error('Error initializing Chime SDK:', err);
      setError('Failed to connect to the call.');
    }
  };

  const setupAudioDevices = async (deviceController) => {
    try {
      const audioInputs = await deviceController.listAudioInputDevices();
      setAudioInputDevices(audioInputs);
      if (audioInputs.length > 0) {
        await audioVideoRef.current.startAudioInput(audioInputs[0].deviceId);
        setSelectedInputDevice(audioInputs[0].deviceId);
      }

      const audioOutputs = await deviceController.listAudioOutputDevices();
      setAudioOutputDevices(audioOutputs);
      if (audioOutputs.length > 0) {
        await audioVideoRef.current.chooseAudioOutput(audioOutputs[0].deviceId);
        setSelectedOutputDevice(audioOutputs[0].deviceId);
      }

      const audioElement = document.getElementById('audio-element');
      if (audioElement) {
        audioVideoRef.current.bindAudioElement(audioElement);
      }
    } catch (err) {
      console.error('Error setting up devices:', err);
    }
  };

  const setupAudioObservers = () => {
    const observer = {
      audioVideoDidStart: () => console.log('Audio started'),
      audioVideoDidStop: () => {
        setIsConnected(false);
        cleanupCall();
      },
    };
    audioVideoRef.current.addObserver(observer);

    audioVideoRef.current.realtimeSubscribeToAttendeeIdPresence((attendeeId, present) => {
      fetchParticipants();
    });
  };

  const startCall = async () => {
    if (!attendeeName.trim()) return setError('Please enter your name');

    setLoading(true);
    setError('');
    try {
      const response = await ApiService.start(attendeeName.trim());

      const { meeting, attendee } = mapToChimeObjects(
        response.meeting,
        response.attendee
      );

      setMeetingData(response.meeting);
      setAttendeeData(response.attendee);

      await initializeChimeSDK(meeting, attendee);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to start call');
    } finally {
      setLoading(false);
    }
  };

  const joinCall = async () => {
    if (!attendeeName.trim()) return setError('Please enter your name');
    if (!meetingIdToJoin.trim()) return setError('Please enter meeting ID');

    setLoading(true);
    setError('');
    try {
      const response = await ApiService.join(
        meetingIdToJoin.trim(),
        attendeeName.trim()
      );

      const { meeting, attendee } = mapToChimeObjects(
        response.meeting,
        response.attendee
      );

      setMeetingData(response.meeting);
      setAttendeeData(response.attendee);

      await initializeChimeSDK(meeting, attendee);

    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to join meeting');
    } finally {
      setLoading(false);
    }
  };

  const toggleMute = async () => {
    if (!audioVideoRef.current) return;

    const newMutedState = !isMuted;
    newMutedState
      ? audioVideoRef.current.realtimeMuteLocalAudio()
      : audioVideoRef.current.realtimeUnmuteLocalAudio();
    setIsMuted(newMutedState);

    try {
      if (meetingData && attendeeData) {
        await ApiService.mute(meetingData.meeting_id, attendeeData.attendee_id, newMutedState);
      }
    } catch (err) {
      console.error('Mute sync failed', err);
    }
  };

  const cleanupCall = () => {
    // Stop Chime audio session
    if (audioVideoRef.current) {
      try {
        audioVideoRef.current.stop();
        audioVideoRef.current.realtimeLeave();
        audioVideoRef.current.removeAllObservers();
      } catch (err) {
        console.error('Error stopping Chime session:', err);
      }
    }

    // Clear call duration timer
    if (durationTimerRef.current) {
      clearInterval(durationTimerRef.current);
      durationTimerRef.current = null;
    }

    // Reset component state
    setIsConnected(false);
    setCallDuration(0);
    setMeetingData(null);
    setAttendeeData(null);
    setParticipants([]);
    setIsMuted(false);
    setAudioInputDevices([]);
    setAudioOutputDevices([]);
    setSelectedInputDevice('');
    setSelectedOutputDevice('');
  };

  const endCall = async () => {
    if (meetingData && attendeeData) {
      try {
        await ApiService.end(meetingData.meeting_id, attendeeData.attendee_id);
        console.log('End call API success');
      } catch (err) {
        console.error('End call API failed:', err);
      }
    } else {
      console.warn('Cannot end call: missing meetingData or attendeeData');
    }

    cleanupCall();

    if (onCallEnd) onCallEnd();
  };

  // ← Back button handler: safely end call (if active) then redirect
  const handleBack = () => {
    if (isConnected) {
      endCall(); // Clean up properly if in a call
    }
    navigate("/pms/telehealth");
  };

  const fetchParticipants = async () => {
    if (!meetingData?.meeting_id) return;

    try {
      const data = await ApiService.getStatus(meetingData.meeting_id);
      setParticipants(data.participants || []);
    } catch (err) {
      console.error('Failed to fetch participants', err);
    }
  };

  const startDurationTimer = () => {
    durationTimerRef.current = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (isConnected && meetingData) {
      fetchParticipants();
      const interval = setInterval(fetchParticipants, 5000);
      return () => clearInterval(interval);
    }
  }, [isConnected, meetingData]);

  const copyMeetingId = () => {
    navigator.clipboard.writeText(meetingData.meeting_id);
  };

  return (
    <div className="audio-call-wrapper">
      <audio id="audio-element" style={{ display: 'none' }} />

      <div className="centered-card">
        {/* ← Back Button - Top Right */}
        <button
          onClick={handleBack}
          className="back-button"
          aria-label="Back to telehealth"
        >
          Back
        </button>

        <h1>Telehealth Meetings</h1>

        {!isConnected ? (
          <>
            {error && <div className="error">{error}</div>}

            <div className="input-group">
              <label>Your Name</label>
              <input
                type="text"
                value={attendeeName}
                onChange={(e) => setAttendeeName(e.target.value)}
                placeholder="Enter your name"
                disabled={loading}
              />
            </div>

            <button
              onClick={startCall}
              disabled={loading || !attendeeName.trim()}
              className="btn-create"
            >
              {loading ? 'Creating...' : 'Create Meeting'}
            </button>

            <div className="input-group">
              <label>Meeting ID (optional)</label>
              <input
                type="text"
                value={meetingIdToJoin}
                onChange={(e) => setMeetingIdToJoin(e.target.value)}
                placeholder="Enter meeting ID to join"
                disabled={loading}
              />
            </div>

            <button
              onClick={joinCall}
              disabled={loading || !attendeeName.trim() || !meetingIdToJoin.trim()}
              className="btn-join"
            >
              {loading ? 'Joining...' : 'Join Meeting'}
            </button>
          </>
        ) : (
          <div className="active-call-dark">
            <div className="call-info">
              <h3>Audio Call in Progress</h3>
              <p className="duration">{formatDuration(callDuration)}</p>
            </div>

            <div className="participants">
              <h4>Participants ({participants.length})</h4>
              {participants.map((p) => (
                <div key={p.attendee_id} className="participant">
                  {p.attendee_name} {p.is_muted && <span>🔇</span>}
                </div>
              ))}
            </div>

            <div className="controls">
              <button onClick={toggleMute} className={`mute-btn ${isMuted ? 'muted' : ''}`}>
                {isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button onClick={endCall} className="end-btn">
                End Call
              </button>
            </div>

            <div className="meeting-id-section">
              <p>Meeting ID: {meetingData.meeting_id}</p>
              <button onClick={copyMeetingId} className="copy-btn">Copy ID</button>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .audio-call-wrapper {
          min-height: 100vh;
          background: #000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .centered-card {
          position: relative; /* Needed for absolute positioning of back button */
          background: rgba(30, 30, 40, 0.85);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border-radius: 20px;
          padding: 40px 50px;
          width: 100%;
          max-width: 420px;
          text-align: center;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Back Button */
        .back-button {
        position: absolute;
        top: 10px;
        right: 20px;
        background: rgba(255, 255, 255, 0.1);
        border: none;
        color: white;
        font-size: 14px;
        font-weight: 500;
        padding: 5px 10px;
        cursor: pointer;
        border-radius: 12px;
        transition: all 0.2s;
        backdrop-filter: blur(4px);
      }

      .back-button:hover {
        background: rgba(255, 255, 255, 0.2);
        transform: translateY(-1px);
      }

        h1 {
          color: white;
          font-size: 28px;
          margin-bottom: 40px;
          font-weight: 600;
        }

        .error {
          color: #ff6b6b;
          background: rgba(255, 107, 107, 0.15);
          padding: 12px;
          border-radius: 10px;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .input-group {
          margin-bottom: 24px;
          text-align: left;
        }

        .input-group label {
          display: block;
          color: #aaa;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .input-group input {
          width: 100%;
          padding: 14px 16px;
          background: rgba(50, 50, 60, 0.8);
          border: 1px solid rgba(100, 100, 120, 0.6);
          border-radius: 12px;
          color: white;
          font-size: 16px;
        }

        .input-group input::placeholder {
          color: #777;
        }

        .input-group input:focus {
          outline: none;
          border-color: #1e90ff;
        }

        .btn-create {
          width: 100%;
          background: #1e90ff;
          color: white;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          margin: 20px 0 30px;
          transition: background 0.3s;
        }

        .btn-create:hover:not(:disabled) {
          background: #1a7ae6;
        }

        .btn-create:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-join {
          width: 100%;
          background: rgba(70, 70, 90, 0.8);
          color: #ccc;
          border: none;
          padding: 16px;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-join:hover:not(:disabled) {
          background: rgba(90, 90, 110, 0.9);
          color: white;
        }

        /* Active Call Styles */
        .active-call-dark {
          color: white;
        }

        .call-info h3 {
          margin: 0 0 8px;
          font-size: 22px;
        }

        .duration {
          font-size: 32px;
          color: #4caf50;
          font-weight: 600;
        }

        .participants {
          margin: 30px 0;
          text-align: left;
        }

        .participants h4 {
          color: #aaa;
          margin-bottom: 12px;
        }

        .participant {
          padding: 10px 0;
          border-bottom: 1px solid rgba(100, 100, 100, 0.3);
        }

        .controls {
          display: flex;
          gap: 16px;
          margin: 30px 0;
        }

        .mute-btn {
          flex: 1;
          padding: 16px;
          border-radius: 12px;
          border: none;
          font-size: 16px;
          font-weight: 600;
          background: #4caf50;
          color: white;
        }

        .mute-btn.muted {
          background: #f44336;
        }

        .end-btn {
          flex: 1;
          padding: 16px;
          border-radius: 12px;
          border: none;
          font-size: 16px;
          font-weight: 600;
          background: #d32f2f;
          color: white;
        }

        .meeting-id-section {
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid rgba(100, 100, 100, 0.3);
        }

        .meeting-id-section p {
          color: #aaa;
          word-break: break-all;
          margin-bottom: 12px;
        }

        .copy-btn {
          background: rgba(70, 70, 90, 0.8);
          color: #ccc;
          border: none;
          padding: 10px 20px;
          border-radius: 10px;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default AudioCallComponent;
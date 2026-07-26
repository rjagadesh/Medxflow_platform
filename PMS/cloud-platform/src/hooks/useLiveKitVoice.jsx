import { useState, useEffect, useCallback, useRef } from "react";
import { Room, RoomEvent } from "livekit-client";
import config from "../services/config";

const useLiveKitVoice = () => {
  const [room, setRoom] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  const connect = useCallback(async (tokenUrl, agentName, voice, metadata) => {
    try {
      setIsConnecting(true);
      setError(null);

      // 1. Get token
      // We'll hardcode the URL relative to the current frontend origin,
      // but assuming it's proxied or pointing to the Django backend.
      // If the backend is on a different port (e.g., 8000), we might need to adjust.
      // For now, I'll assume the same origin or proxy is set up.
      // Or I'll use the environment variable if available, but for now relative path.

      const baseUrl = config.config.BASE_URL.endsWith("/")
        ? config.config.BASE_URL
        : `${config.config.BASE_URL}/`;
      const url = tokenUrl || `${baseUrl}app/voice-ai/connection-details/`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_config: {
            agents: [{ agent_name: agentName }],
          },
          voice: voice,
          ...metadata,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch token: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("response121212999", data);
      if (!data.participantToken) throw new Error("No token received");

      // 2. Connect to room
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
      });

      // Handle remote audio BEFORE connecting to ensure we catch early tracks
      newRoom.on(RoomEvent.TrackSubscribed, (track) => {
        if (track.kind === "audio") {
          const element = track.attach();
          document.body.appendChild(element); // Or manage this element in UI
        }
      });

      newRoom.on(RoomEvent.TrackUnsubscribed, (track) => {
        track.detach().forEach((element) => element.remove());
      });

      newRoom.on(RoomEvent.Disconnected, () => {
        setIsConnected(false);
        setRoom(null);
      });

      await newRoom.connect(data.serverUrl, data.participantToken);

      // 3. Publish microphone (explicitly only microphone to avoid video permissions)
      await newRoom.localParticipant.setMicrophoneEnabled(true);
      await newRoom.localParticipant.setCameraEnabled(false);

      setRoom(newRoom);
      setIsConnected(true);
    } catch (err) {
      console.error("LiveKit connection error:", err);
      setError(err);
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (room) {
      await room.disconnect();
      setRoom(null);
      setIsConnected(false);
    }
  }, [room]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (room) {
        room.disconnect();
      }
    };
  }, [room]);

  return {
    connect,
    disconnect,
    isConnected,
    isConnecting,
    error,
    room,
  };
};

export default useLiveKitVoice;

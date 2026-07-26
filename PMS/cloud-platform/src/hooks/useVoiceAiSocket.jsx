import { useState, useEffect, useRef, useCallback } from "react";

const useVoiceAiSocket = (isStarted, onMessageReceived, agentId, voiceName) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const callSidRef = useRef(
    `test-call-${Math.random().toString(36).substring(7)}`,
  );
  const streamSidRef = useRef(null);

  const isStartedRef = useRef(isStarted);

  useEffect(() => {
    isStartedRef.current = isStarted;
  }, [isStarted]);

  const connectWebSocket = useCallback(() => {
    let wsUrl = "wss://vira.droidal.com/twilio-stream?app_id=" + agentId;
    if (voiceName) {
      wsUrl += `&voice=${encodeURIComponent(voiceName)}`;
    }
    socketRef.current = new WebSocket(wsUrl);

    // Disable binary type to ensure text frames
    socketRef.current.binaryType = "blob";

    socketRef.current.onopen = () => {
      console.log("WebSocket Connected");
      setIsConnected(true);
      // Backend expects "start" event for Twilio-like behavior
      const startPayload = JSON.stringify({
        event: "start",
        start: {
          callSid: callSidRef.current,
          streamSid: `stream-${callSidRef.current}`,
          agentId: agentId,
        },
      });
      console.log("Sending start event:", startPayload);
      socketRef.current.send(startPayload);
    };

    socketRef.current.onmessage = (event) => {
      console.log("WebSocket Raw Message:", event.data);
      const message = JSON.parse(event.data);
      if (message.event === "media") {
        if (onMessageReceived) {
          onMessageReceived({
            type: "audio",
            payload: message.media.payload,
          });
        }
      } else if (message.type === "text") {
        // Fallback for text messages if the backend sends them
        if (onMessageReceived) {
          onMessageReceived(message);
        }
      }
    };

    socketRef.current.onclose = () => {
      console.log("WebSocket Disconnected");
      setIsConnected(false);
      if (isStartedRef.current) {
        // Attempt to reconnect if testing is active
        setTimeout(connectWebSocket, 3000);
      }
    };

    socketRef.current.onerror = (error) => {
      console.error("WebSocket Error:", error);
    };
  }, [isStarted, onMessageReceived, agentId, voiceName]);

  useEffect(() => {
    if (isStarted) {
      connectWebSocket();
    }
    return () => {
      if (socketRef.current) {
        socketRef.current.onclose = null; // Prevent reconnect loop during cleanup
        if (socketRef.current.readyState === WebSocket.OPEN) {
          try {
            socketRef.current.send(JSON.stringify({ event: "end" }));
          } catch (e) {
            console.error("Error sending end event:", e);
          }
        }
        socketRef.current.close();
        setIsConnected(false);
      }
    };
  }, [isStarted, connectWebSocket]);

  const sendAudio = useCallback((base64Audio) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        event: "media",
        media: {
          payload: base64Audio,
        },
      });
      socketRef.current.send(payload);
      return true;
    }
    return false;
  }, []);

  const resetSession = useCallback(() => {
    callSidRef.current = `test-call-${Math.random().toString(36).substring(7)}`;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          event: "start",
          start: {
            callSid: callSidRef.current,
            streamSid: `stream-${callSidRef.current}`,
            agentId: agentId,
          },
        }),
      );
    }
  }, [agentId]);

  return {
    isConnected,
    callSid: callSidRef.current,
    sendAudio,
    resetSession,
    socketReadyState: socketRef.current?.readyState,
  };
};

export default useVoiceAiSocket;

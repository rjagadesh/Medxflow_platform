import { useState, useEffect, useRef, useCallback } from "react";

const useVoiceAiTextSocket = (isStarted, onMessageReceived, agentId) => {
  const socketRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const sessionRef = useRef(
    `test-session-${Math.random().toString(36).substring(7)}`
  );

  const connectWebSocket = useCallback(() => {
    // New endpoint for text-based interaction
    const wsUrl = `wss://vira.droidal.com/tts/twilio-stream-tts`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onopen = () => {
      console.log("Text WebSocket Connected");
      setIsConnected(true);
      // Backend expects "setup" type
      const initPayload = JSON.stringify({
        type: "setup",
        callSid: sessionRef.current,
        timestamp: new Date().toISOString(),
      });
      socketRef.current.send(initPayload);
    };

    socketRef.current.onmessage = (event) => {
      console.log("Text WebSocket Message:", event.data);
      try {
        const message = JSON.parse(event.data);
        if (onMessageReceived) {
          onMessageReceived(message);
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    socketRef.current.onclose = () => {
      console.log("Text WebSocket Disconnected");
      setIsConnected(false);
      // Removed reconnect logic when isStarted is true to prevent unwanted reconnections
    };

    socketRef.current.onerror = (error) => {
      console.error("Text WebSocket Error:", error);
    };
  }, [isStarted, onMessageReceived, agentId]);

  useEffect(() => {
    if (isStarted) {
      connectWebSocket();
    } else {
      socketRef.current?.close();
    }
    return () => {
      socketRef.current?.close();
    };
  }, [isStarted, connectWebSocket]);

  const sendText = useCallback((text) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      const payload = JSON.stringify({
        type: "prompt",
        voicePrompt: text,
      });
      socketRef.current.send(payload);
      return true;
    }
    return false;
  }, []);

  const resetSession = useCallback(() => {
    sessionRef.current = `test-session-${Math.random().toString(36).substring(7)}`;
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      socketRef.current.send(
        JSON.stringify({
          type: "setup",
          callSid: sessionRef.current,
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, []);

  return {
    isConnected,
    sessionId: sessionRef.current,
    sendText,
    resetSession,
    socketReadyState: socketRef.current?.readyState,
  };
};

export default useVoiceAiTextSocket;

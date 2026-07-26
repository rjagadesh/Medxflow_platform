import React, { useEffect, useRef, useState } from "react";
import CONSTANT from "@/services/constant";

const LiveTranscription = ({
  meetingId,
  transcriptionActive,
  showCaptions,
}) => {
  const [captions, setCaptions] = useState([]); 
  const [currentPartial, setCurrentPartial] = useState(""); 
  const [transcriptionReady, setTranscriptionReady] = useState(false);
  
  const isReadyRef = useRef(false);
  const wsRef = useRef(null);
  const audioContextRef = useRef(null);
  const processorRef = useRef(null);
  const streamRef = useRef(null);
  const scrollRef = useRef(null);
  
  // NEW: Ref to handle the silence timeout (clearing text after speaking stops)
  const autoClearTimerRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [captions, currentPartial]);

  useEffect(() => {
    const cleanupResources = () => {
      console.log("🧹 Cleaning up transcription...");
      isReadyRef.current = false;
      setTranscriptionReady(false);
      
      if (autoClearTimerRef.current) {
        clearTimeout(autoClearTimerRef.current);
      }

      if (processorRef.current) {
        processorRef.current.onaudioprocess = null;
        processorRef.current.disconnect();
        processorRef.current = null;
      }

      if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
          audioContextRef.current.close().catch(() => {});
        }
        audioContextRef.current = null;
      }

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      if (wsRef.current) {
        wsRef.current.onclose = null; 
        wsRef.current.onmessage = null;
        wsRef.current.onerror = null;
        wsRef.current.close();
        wsRef.current = null;
      }

      setCurrentPartial("");
      setCaptions([]);
    };

    if (!transcriptionActive || !showCaptions || !meetingId) {
      cleanupResources();
      return;
    }

    const startAudioCapture = async (websocket) => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            sampleRate: 16000,
            channelCount: 1,
            echoCancellation: true,
          },
        });

        streamRef.current = stream;
        const audioContext = new AudioContext({ sampleRate: 16000 });
        const source = audioContext.createMediaStreamSource(stream);
        const processor = audioContext.createScriptProcessor(4096, 1, 1);

        source.connect(processor);
        processor.connect(audioContext.destination);

        processor.onaudioprocess = (e) => {
          if (websocket.readyState !== WebSocket.OPEN || !isReadyRef.current) return;
          
          const inputData = e.inputBuffer.getChannelData(0);
          const pcmData = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            let s = Math.max(-1, Math.min(1, inputData[i]));
            pcmData[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          websocket.send(pcmData.buffer);
        };

        audioContextRef.current = audioContext;
        processorRef.current = processor;
      } catch (err) {
        console.error("Mic access error:", err);
      }
    };

    const connectWebSocket = () => {
      // Derive the WS host from the configured API base (falls back to the current
      // origin) and switch http(s) -> ws(s). nginx proxies /ws to the backend.
      const apiBase = CONSTANT.BASE_URL || window.location.origin;
      const wsBase = apiBase.replace(/^http/, "ws").replace(/\/$/, "");
      const wsUrl = `${wsBase}/ws/transcription/${meetingId}/`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        ws.send(JSON.stringify({
          type: "start_transcription",
          language: "en-US",
          enable_speaker_identification: true,
        }));
      };

      ws.onmessage = (event) => {
        if (typeof event.data !== "string") return;
        try {
          const data = JSON.parse(event.data);
          if (data.type === "transcription_started") {
            isReadyRef.current = true;
            setTranscriptionReady(true);
            startAudioCapture(ws);
          } else if (data.type === "caption" || data.text || data.transcript) {
            handleCaption(data.caption || data);
          }
        } catch (e) {}
      };

      ws.onclose = () => {
          if (transcriptionActive) cleanupResources();
      };
    };

    const handleCaption = (captionData) => {
      let text = captionData.text || captionData.transcript || "";
      let is_final = captionData.is_final ?? captionData.final ?? false;
      if (!text || !text.trim()) return;

      // 1. Reset the auto-clear timer every time we receive new text
      if (autoClearTimerRef.current) clearTimeout(autoClearTimerRef.current);
      
      // 2. Set a new timer to clear captions after 3 seconds of silence
      autoClearTimerRef.current = setTimeout(() => {
        setCurrentPartial("");
        setCaptions([]);
      }, 3000);

      // 3. Update UI text
      if (is_final) {
        setCaptions((prev) => [...prev.slice(-1), text]);
        setCurrentPartial("");
      } else {
        setCurrentPartial(text);
      }
    };

    connectWebSocket();

    return () => cleanupResources();
  }, [meetingId, transcriptionActive, showCaptions]);

  if (!transcriptionActive || !showCaptions) return null;

  return (
    <div
      style={{
        position: "absolute",
        bottom: "80px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "90%",
        maxWidth: "1000px",
        zIndex: 100,
        pointerEvents: "none",
        textAlign: "center",
      }}
    >
      <div
        style={{
          display: "inline-block",
          minHeight: "45px",
        }}
      >
        <div style={{
          color: "white",
          fontSize: "26px", // Slightly larger for readability without a box
          fontWeight: "600",
          lineHeight: "1.4",
          fontFamily: "'Inter', system-ui, sans-serif",
          // THICK TEXT SHADOW to make text visible on any background
          textShadow: `
            -2px -2px 0 #000,  
             2px -2px 0 #000,
            -2px  2px 0 #000,
             2px  2px 0 #000,
             0px  3px 5px rgba(0,0,0,0.8)
          `
        }}>
          {/* Previous Final Sentence (dimmed) */}
          {captions.length > 0 && (
            <span style={{ color: "rgba(255,255,255,0.7)", marginRight: "10px" }}>
              {captions[captions.length - 1]}
            </span>
          )}
          
          {/* Live Partial Sentence */}
          <span>{currentPartial}</span>

          {/* Cursor indicator */}
          {currentPartial && (
            <span style={{ 
              marginLeft: "4px", 
              borderLeft: "3px solid #4CAF50", 
              animation: "blink 1s infinite",
              height: "24px",
              display: "inline-block",
              verticalAlign: "middle"
            }} />
          )}
        </div>
      </div>
      <div ref={scrollRef} />
      <style jsx>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
};

export default LiveTranscription;
import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import useVoiceAiSocket from "../../hooks/useVoiceAiSocket";
import useLiveKitVoice from "../../hooks/useLiveKitVoice";
import { useParams } from "react-router-dom";
import { atobAgentId } from "../../utils/helper";
import { encodeMulaw, decodeMulaw } from "../../utils/audio-utils";
import { ChevronLeft, ChevronRight, PhoneOff } from "lucide-react";
import { Avatar } from "@chakra-ui/react";
import { Bell, ChevronsLeft } from "lucide-react";
import "./VoiceAiChat.css";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/store/providers/auth-provider";
import UserMenu from "@/components/user-popover/user-popover";
import { ChevronsRight } from "lucide-react";
import ApiConstant from "@/services/constant";
import Dock from "./components/voice-selector-dock-animation";
import { Home } from "lucide-react";
import { Archive } from "lucide-react";
import { MdAccountBox } from "react-icons/md";
import { Settings2 } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { icon: ChevronsRight, label: "Voice Agents", active: false },
];

export const Header = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-6 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-sm lg:backdrop-blur-none lg:bg-transparent">
      <div className="flex items-center gap-3">
        <Link to="/">
          <img
            src={"/voice_ai_logo.png"}
            alt="VoiceAI Logo"
            style={{
              height: "70px",
            }}
          />
        </Link>
      </div>

      <nav className="flex items-center gap-8">
        <div className="flex items-center gap-4 pl-6 border-l border-white/10">
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.label}
                className="beamButton"
                // className={`flex  items-center gap-1 group transition-all ${
                //   item.active
                //     ? "text-[hsl(var(--primary))]"
                //     : "text-[hsl(var(--foreground)/0.6)] hover:text-[hsl(var(--foreground))]"
                // }`}
                onClick={() => {
                  navigate("/voice-ai/voice-ai-MTA=");
                }}
              >
                <span className="label">
                  <span>{item.label}</span>

                  <item.icon
                    color="#297ef6"
                    // style={{
                    //   zIndex: 100,
                    //   position: "absolute",
                    //   right: "12px",
                    //   top: "10px",
                    // }}
                    className="w-5 h-5"
                  />
                </span>
              </button>
            ))}
          </div>
          <UserMenu />
        </div>
      </nav>
    </header>
  );
};

const VoiceWaveform = ({
  isListening,
  onMicClick,
  isStarted,
  onDisconnect,
}) => {
  return (
    <div className="relative flex items-center justify-center w-full max-w-4xl h-32 my-12">
      {/* Left Blue Waves */}
      {isListening && (
        <div className="absolute left-0 right-1/2 h-full flex items-center justify-end pr-10 overflow-visible">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="wave-gradient-left"
                gradientTransform="rotate(39)"
              >
                <stop offset="0%" stopColor="#4b8ced" />
                <stop offset="100%" stopColor="#ff891a" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 0 50 Q 50 20 100 50 T 200 50 T 300 50 T 400 50"
              fill="none"
              stroke="url(#wave-gradient-left)"
              strokeWidth="2.5"
              strokeLinecap="round"
              animate={{
                d: [
                  "M 0 50 Q 50 20 100 50 T 200 50 T 300 50 T 400 50",
                  "M 0 50 Q 50 80 100 50 T 200 50 T 300 50 T 400 50",
                  "M 0 50 Q 50 20 100 50 T 200 50 T 300 50 T 400 50",
                ],
                strokeOpacity: [0.4, 0.8, 0.4],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="drop-shadow-[0_0_12px_rgba(75,140,237,1)]"
            />
            <motion.path
              d="M 0 50 Q 50 60 100 50 T 200 50 T 300 50 T 400 50"
              fill="none"
              stroke="url(#wave-gradient-left)"
              strokeWidth="1.5"
              strokeLinecap="round"
              animate={{
                d: [
                  "M 0 50 Q 50 70 100 50 T 200 50 T 300 50 T 400 50",
                  "M 0 50 Q 50 30 100 50 T 200 50 T 300 50 T 400 50",
                  "M 0 50 Q 50 70 100 50 T 200 50 T 300 50 T 400 50",
                ],
                strokeOpacity: [0.2, 0.5, 0.2],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </svg>
        </div>
      )}

      {/* Right Orange Waves */}
      {isListening && (
        <div className="absolute right-0 left-1/2 h-full flex items-center justify-start pl-10 overflow-visible">
          <svg
            className="w-full h-full overflow-visible"
            viewBox="0 0 400 100"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient
                id="wave-gradient-right"
                gradientTransform="rotate(39)"
              >
                <stop offset="0%" stopColor="#4b8ced" />
                <stop offset="100%" stopColor="#ff891a" />
              </linearGradient>
            </defs>
            <motion.path
              d="M 400 50 Q 350 80 300 50 T 200 50 T 100 50 T 0 50"
              fill="none"
              stroke="url(#wave-gradient-right)"
              strokeWidth="2.5"
              strokeLinecap="round"
              animate={{
                d: [
                  "M 400 50 Q 350 80 300 50 T 200 50 T 100 50 T 0 50",
                  "M 400 50 Q 350 20 300 50 T 200 50 T 100 50 T 0 50",
                  "M 400 50 Q 350 80 300 50 T 200 50 T 100 50 T 0 50",
                ],
                strokeOpacity: [0.4, 0.8, 0.4],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="drop-shadow-[0_0_12px_rgba(255,137,26,1)]"
            />
            <motion.path
              d="M 400 50 Q 350 40 300 50 T 200 50 T 100 50 T 0 50"
              fill="none"
              stroke="url(#wave-gradient-right)"
              strokeWidth="1.5"
              strokeLinecap="round"
              animate={{
                d: [
                  "M 400 50 Q 350 30 300 50 T 200 50 T 100 50 T 0 50",
                  "M 400 50 Q 350 70 300 50 T 200 50 T 100 50 T 0 50",
                  "M 400 50 Q 350 30 300 50 T 200 50 T 100 50 T 0 50",
                ],
                strokeOpacity: [0.2, 0.5, 0.2],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </svg>
        </div>
      )}

      {/* Center Mic Button */}
      <div
        className="relative z-10 w-28 h-28 cursor-pointer"
        onClick={onMicClick}
      >
        {/* <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" /> */}
        <img
          className="absolute"
          style={{
            top: "-65px",
            left: "50%",
            zIndex: 100,
            transform: "translate(-50%, 50%)",
            borderRadius: "50%",
          }}
          src="/mic-icon.gif"
          width={"140px"}
          height={"140px"}
        />
      </div>

      {/* Disconnect Button */}
      {isStarted && (
        <motion.button
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={onDisconnect}
          className="absolute right-1/2 translate-x-24 z-20 p-3 bg-red-500/20 hover:bg-red-500/40 border border-red-500/50 rounded-full transition-colors"
          title="Disconnect"
        >
          <PhoneOff className="w-5 h-5 text-red-400" />
        </motion.button>
      )}
    </div>
  );
};

const actions = [
  "Schedule an appointment",
  "Explain procedure",
  "Tell me a joke",
];

const QuickActions = ({ onAction }) => {
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 mt-8">
      {actions.map((action, i) => (
        <motion.button
          key={action}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + i * 0.1 }}
          onClick={() => onAction && onAction(action)}
          className="px-6 py-2 rounded-full bg-[hsl(var(--primary)/0.05)] hover:bg-[hsl(var(--primary)/0.2)] border border-[hsl(var(--primary)/0.2)] hover:border-[hsl(var(--primary)/0.5)] text-[hsl(var(--foreground)/0.8)] hover:text-white transition-all hover:scale-105 hover:shadow-glow-cyan"
        >
          <span className="text-sm font-medium tracking-wide">{action}</span>
        </motion.button>
      ))}
    </div>
  );
};

const voiceImages = [
  "https://v3b.fal.media/files/b/0a8d0329/tjQjpboJA3Gh5q7iU8IP6.png",
  "https://v3b.fal.media/files/b/0a8d0329/WfGib5-2vt1oEV6YHShrk.png",
  "https://v3b.fal.media/files/b/0a8d0329/Pt13cxYjeu2Hz0JOieVfl.png",
  "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&q=80&w=100",
  "https://v3b.fal.media/files/b/0a8d0329/zqCQNAg3Qart1WI9ionxY.png",
];

const voices = [
  "Zephyr",
  "Puck",
  "Charon",
  "Kore",
  "Fenrir",
  "Leda",
  "Orus",
  "Aoede",
  "Callirrhoe",
  "Autonoe",
  "Enceladus",
  "Iapetus",
  "Umbriel",
  "Algieba",
  "Despina",
  "Erinome",
  "Algenib",
  "Rasalgethi",
  "Laomedeia",
  "Achernar",
  "Alnilam",
  "Schedar",
  "Gacrux",
  "Pulcherrima",
  "Achird",
  "Zubenelgenubi",
  "Vindemiatrix",
  "Sadachbia",
  "Sadaltager",
  "Sulafat",
];

const greetings = {
  Puck: "How can I assist you today?",
  Charon: "Hello, I am Charon. Ready to help!",
  Kore: "Hey! What are we building today?",
  Fenrir: "Fenrir here. Let's get things done.",
};

const characters = voices.map((name, index) => ({
  name,
  image: voiceImages[index % voiceImages.length],
  greeting: greetings[name] || `Hello, I am ${name}. Ready to assist you.`,
  role: "AI Assistant",
  active: index === 0,
}));

const VoiceAiChat = () => {
  const { agent_app } = useParams();
  const agentId = agent_app ? atobAgentId(agent_app) : "10";
  const [selectedCharacter, setSelectedCharacter] = useState(
    characters.find((c) => c.active) || characters[0],
  );
  const [isStarted, setIsStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const isLiveKitMode = true;

  // LiveKit Hook
  const {
    connect: connectLiveKit,
    disconnect: disconnectLiveKit,
    isConnected: isLiveKitConnected,
    isConnecting: isLiveKitConnecting,
    room,
  } = useLiveKitVoice();

  // Ref to track listening state inside callbacks without triggering re-renders/re-connections
  const isListeningRef = useRef(false);
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  const pendingActionRef = useRef(null);

  const audioContextRef = useRef(null);
  const nextStartTimeRef = useRef(0);
  const streamRef = useRef(null);
  const processorRef = useRef(null);

  const handleSocketMessage = useCallback(async (message) => {
    if (message.type === "audio") {
      try {
        if (!audioContextRef.current) {
          audioContextRef.current = new (
            window.AudioContext || window.webkitAudioContext
          )({ sampleRate: 8000 });
        }

        const base64Audio = message.payload;
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        const pcmData = new Float32Array(len);
        for (let i = 0; i < len; i++) {
          pcmData[i] = decodeMulaw(bytes[i]) / 32768;
        }

        const audioBuffer = audioContextRef.current.createBuffer(1, len, 8000);
        audioBuffer.getChannelData(0).set(pcmData);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContextRef.current.destination);

        const currentTime = audioContextRef.current.currentTime;
        if (nextStartTimeRef.current < currentTime) {
          nextStartTimeRef.current = currentTime;
        }

        source.start(nextStartTimeRef.current);
        nextStartTimeRef.current += audioBuffer.duration;
      } catch (err) {
        console.error("Error playing audio:", err);
      }
    }
  }, []);

  const { sendAudio, socketReadyState } = useVoiceAiSocket(
    isStarted && !isLiveKitMode,
    handleSocketMessage,
    agentId,
    selectedCharacter.name,
  );

  const startStreaming = async () => {
    try {
      streamRef.current = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 8000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const audioContext = new (
        window.AudioContext || window.webkitAudioContext
      )({ sampleRate: 8000 });
      const source = audioContext.createMediaStreamSource(streamRef.current);
      // Use smaller buffer size for lower latency
      const processor = audioContext.createScriptProcessor(1024, 1, 1);

      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (!isListening) return;

        const inputData = e.inputBuffer.getChannelData(0);

        const mulawData = new Uint8Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          mulawData[i] = encodeMulaw(inputData[i] * 32767);
        }

        let binaryString = "";
        const chunk = 8192;
        for (let i = 0; i < mulawData.length; i += chunk) {
          binaryString += String.fromCharCode.apply(
            null,
            mulawData.subarray(i, i + chunk),
          );
        }

        const base64Audio = window.btoa(binaryString);
        sendAudio(base64Audio);
      };

      processorRef.current = processor;
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setIsListening(false);
    }
  };

  const stopStreaming = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (processorRef.current) {
      processorRef.current.disconnect();
    }
  };

  useEffect(() => {
    if (isLiveKitMode) return; // Skip socket streaming logic in LiveKit mode

    if (isListening && isStarted) {
      startStreaming();
    } else {
      stopStreaming();
    }
    return () => stopStreaming();
  }, [isListening, isStarted, isLiveKitMode]);

  const toggleListening = () => {
    if (isLiveKitMode) {
      if (!isStarted) {
        setIsStarted(true);
        setIsListening(true);
        // Use the configured agent name from env, or fallback to the specific one found in reference project
        connectLiveKit(null, "voiceassistant", selectedCharacter.name);
      } else {
        // In LiveKit mode, "toggleListening" effectively acts as disconnect for now
        // unless we implement mute/unmute. Since handleDisconnect is separate,
        // let's assume tapping the mic again just mutes or does nothing?
        // For parity with socket mode which toggles isListening:
        setIsListening(!isListening);
        // TODO: Implement mute/unmute in useLiveKitVoice if needed
      }
      return;
    }

    if (!isStarted) {
      setIsStarted(true);
      setIsListening(true);
      // Initialize AudioContext on user gesture to allow playback
      if (!audioContextRef.current) {
        audioContextRef.current = new (
          window.AudioContext || window.webkitAudioContext
        )({ sampleRate: 8000 });
      }
      if (audioContextRef.current.state === "suspended") {
        audioContextRef.current.resume();
      }
    } else {
      setIsListening(!isListening);
      if (!isListening && audioContextRef.current?.state === "suspended") {
        audioContextRef.current.resume();
      }
    }
  };

  const handleDisconnect = () => {
    setIsStarted(false);
    setIsListening(false);
    if (isLiveKitMode) {
      disconnectLiveKit();
    }
  };

  const handleQuickAction = async (action) => {
    if (!isLiveKitConnected || !room) {
      console.log(
        "Room not connected, connecting first before action:",
        action,
      );
      pendingActionRef.current = action;
      setIsStarted(true);
      setIsListening(true);
      connectLiveKit(null, "voiceassistant", selectedCharacter.name);
      return;
    }

    try {
      const baseUrl = ApiConstant.BASE_URL;
      const url = `${baseUrl}app/voice-ai/update-room-metadata/`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomName: room.name,
          metadata: {
            action: action,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to update room metadata: ${response.statusText}`,
        );
      }

      console.log(`Successfully updated room metadata with action: ${action}`);
    } catch (err) {
      console.error("Error updating room metadata:", err);
    }
  };

  useEffect(() => {
    if (isLiveKitConnected && room && pendingActionRef.current) {
      const action = pendingActionRef.current;
      pendingActionRef.current = null;
      console.log("Connection established, processing pending action:", action);
      handleQuickAction(action);
    }
  }, [isLiveKitConnected, room]);

  const getStatusText = () => {
    if (!isStarted) return "Tap microphone to connect";

    if (isLiveKitMode) {
      if (isLiveKitConnecting) return "Connecting...";
      if (isLiveKitConnected) return isListening ? "Listening..." : "Paused";
      return "Disconnected";
    }

    if (socketReadyState === 1)
      return isListening ? "Listening..." : "Tap to speak (Paused)";
    return "Connecting...";
  };

  const onSelectCharacter = async (char) => {
    setSelectedCharacter(char);
    if (isStarted && isLiveKitMode) {
      await disconnectLiveKit();
      connectLiveKit(null, "voiceassistant", char.name);
    }
  };

  const characterDockItems = useMemo(
    () =>
      characters.map((char) => {
        const isActive = selectedCharacter.name === char.name;
        return {
          label: char.name,
          onClick: () => onSelectCharacter(char),
          icon: (
            <div
              className={`relative p-0.5 rounded-full ${
                isActive
                  ? "bg-gradient-to-tr from-[hsl(var(--primary))] to-[hsl(var(--accent))] shadow-glow-cyan"
                  : ""
              }`}
            >
              <Avatar.Root
                size={{
                  base: "2xs",
                  "2xl": "sm",
                }}
              >
                <Avatar.Image src={char.image} />
                <Avatar.Fallback name={"AI"} />
              </Avatar.Root>

              {isActive && (
                <div className="absolute inset-0 rounded-full animate-pulse border border-[hsl(var(--primary)/0.5)]" />
              )}
            </div>
          ),
        };
      }),
    [selectedCharacter, isStarted, isLiveKitMode],
  );

  return (
    <>
      <div className="voice-ai-chat-wrapper">
        <div className="relative min-h-screen bg-[hsl(var(--background))] overflow-hidden selection:bg-[hsl(var(--primary)/0.3)]">
          {/* Background Image Container */}
          <div className="absolute inset-0 z-0">
            <img
              src="/agent-img.png"
              alt="Voice AI Assistant"
              className="w-full h-full object-cover opacity-50 scale-100"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[hsl(var(--background))] via-[hsl(var(--background)/0.6)] to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
          </div>

          <Header />

          <main className="relative z-10 flex flex-col items-center justify-center min-h-screen pt-20 px-4">
            <div className="max-w-4xl w-full text-center">
              <motion.h1
                key={`title-${selectedCharacter.name}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-4xl md:text-5xl lg:text-6xl font-medium tracking-wide text-white mb-4 "
              >
                {selectedCharacter.greeting}
              </motion.h1>
              <motion.p
                key={`subtitle-${selectedCharacter.name}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.8 }}
                className="text-lg md:text-xl text-foreground/60 max-w-2xl mx-auto mb-12 tracking-wide"
              >
                I'm {selectedCharacter.name}, your {selectedCharacter.role}.
                <br />
                {getStatusText()}
              </motion.p>
              <VoiceWaveform
                isListening={isListening}
                onMicClick={toggleListening}
                isStarted={isStarted}
                onDisconnect={handleDisconnect}
              />
              <QuickActions onAction={handleQuickAction} />
            </div>
          </main>

          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50">
            <Dock
              items={characterDockItems}
              panelHeight={68}
              baseItemSize={50}
              magnification={80}
              distance={150}
            />
          </div>

          {/* Decorative Particles/Glows */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[hsl(var(--primary)/0.1)] rounded-full blur-[120px] pointer-events-none animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[hsl(var(--accent)/0.05)] rounded-full blur-[120px] pointer-events-none animate-pulse" />
        </div>
      </div>
    </>
  );
};

export default VoiceAiChat;

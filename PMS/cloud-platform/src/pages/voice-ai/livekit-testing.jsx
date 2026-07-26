import React, { useState, useEffect, useRef, useCallback } from "react";
import useLiveKitVoice from "../../hooks/useLiveKitVoice";
import { RoomEvent } from "livekit-client";
import {
  Box,
  VStack,
  HStack,
  Text,
  Circle,
  Grid,
  GridItem,
  Card,
  Tabs,
  Flex,
  Dialog,
  Button,
  Image,
  Spinner,
} from "@chakra-ui/react";
import { avatarMap } from "../../assets/avatar";
import UserAvatar from "../../assets/icons/user-icon.svg";
import VoiceAiHeader from "./components/voice-ai-header";
import CustomButton from "../../components/button/button";
import {
  Mic,
  MicOff,
  Bot,
  RotateCcw,
  Play,
  Activity,
  Clock,
  Hash,
  Volume2,
  FileJson,
  Terminal,
  AudioLines,
  Trash,
} from "lucide-react";

import { atobAgentId } from "../../utils/helper";
import { useParams, useSearchParams } from "react-router-dom";
import { useCreateTestingOutput } from "@/hooks/mutation/voiceai/useSaveTestingOutput";
import { useGetAgentVersions } from "@/hooks/query/useGetAgentVersions";
import { useAuth } from "@/store/providers/auth-provider";
import { motion as Motion, AnimatePresence } from "framer-motion";
import { PhoneOffIcon } from "lucide-react";

const LANGUAGE_MAP = {
  Afrikaans: "af",
  Arabic: "ar",
  Armenian: "hy",
  Assamese: "as",
  Azerbaijani: "az",
  Belarusian: "be",
  Bengali: "bn",
  Bosnian: "bs",
  Bulgarian: "bg",
  Catalan: "ca",
  Cebuano: "ceb",
  Chichewa: "ny",
  Croatian: "hr",
  Czech: "cs",
  Danish: "da",
  Dutch: "nl",
  English: "en",
  Estonian: "et",
  Filipino: "fil",
  Finnish: "fi",
  French: "fr",
  Galician: "gl",
  Georgian: "ka",
  German: "de",
  Greek: "el",
  Gujarati: "gu",
  Hausa: "ha",
  Hebrew: "he",
  Hindi: "hi",
  Hungarian: "hu",
  Icelandic: "is",
  Indonesian: "id",
  Irish: "ga",
  Italian: "it",
  Japanese: "ja",
  Javanese: "jv",
  Kannada: "kn",
  Kazakh: "kk",
  Korean: "ko",
  Latvian: "lv",
  Lingala: "ln",
  Lithuanian: "lt",
  Luxembourgish: "lb",
  Macedonian: "mk",
  Malay: "ms",
  Malayalam: "ml",
  "Mandarin Chinese": "zh",
  Marathi: "mr",
  Nepali: "ne",
  Norwegian: "no",
  Pashto: "ps",
  Persian: "fa",
  Polish: "pl",
  Portuguese: "pt",
  Punjabi: "pa",
  Romanian: "ro",
  Russian: "ru",
  Serbian: "sr",
  Sindhi: "sd",
  Slovak: "sk",
  Slovenian: "sl",
  Somali: "so",
  Spanish: "es",
  Swahili: "sw",
  Swedish: "sv",
  Tamil: "ta",
  Telugu: "te",
  Thai: "th",
  Turkish: "tr",
  Ukrainian: "uk",
};

const getLanguageCode = (languageName) => {
  return LANGUAGE_MAP[languageName] || "en";
};

const VoiceVisualizer = ({ isStarted, isMicOn, voiceSrc }) => {
  return (
    <Box
      className="relative flex items-center justify-center w-full"
      h="96px"
      bg="black"
      overflow="hidden"
      position="relative"
    >
      {/* Voice Avatar - Left */}
      <Box
        position="absolute"
        left="0"
        zIndex="10"
        borderRadius="0 12px 12px 0"
        overflow="hidden"
        boxSize="90px"
        border="2px solid none"
        bg="gray.800"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {voiceSrc ? (
          <Image src={voiceSrc} w="100%" h="100%" objectFit="cover" />
        ) : (
          <Bot size={20} color="white" />
        )}
      </Box>

      {/* User Avatar - Right */}
      <Box
        position="absolute"
        right="0"
        zIndex="10"
        borderRadius="12px 0px 0px 12px"
        overflow="hidden"
        boxSize="90px"
        bg="white"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        <img src={UserAvatar} alt="User Avatar" width="100%" height="100%" />
      </Box>

      {/* Left Blue Waves */}
      {isStarted && (
        <div className="absolute left-0 right-1/2 h-full flex items-center justify-end overflow-visible">
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
            <Motion.path
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
            <Motion.path
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
      {isMicOn && (
        <div className="absolute right-0 left-1/2 h-full flex items-center justify-start overflow-visible">
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
            <Motion.path
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
            <Motion.path
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
    </Box>
  );
};

const VoiceAiLiveKitTesting = () => {
  const { agent_app } = useParams();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const version = searchParams.get("version");
  const agentId = React.useMemo(() => {
    if (!agent_app) return null;
    try {
      return atobAgentId(agent_app);
    } catch (e) {
      console.error("Failed to decode agent_app", e);
      return null;
    }
  }, [agent_app]);

  console.log("agent_app param:", agent_app);
  console.log("Decoded agentId:", agentId);

  const {
    connect: connectLiveKit,
    disconnect: disconnectLiveKit,
    isConnected: isLiveKitConnected,
    isConnecting: isLiveKitConnecting,
    room,
  } = useLiveKitVoice();

  const [isEndCallDialogOpen, setIsEndCallDialogOpen] = useState(false);
  const cancelRef = useRef();

  const onEndCallOpen = () => setIsEndCallDialogOpen(true);
  const onEndCallClose = () => setIsEndCallDialogOpen(false);

  const [isStarted, setIsStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showAgentTypingFallback, setShowAgentTypingFallback] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState("debug");
  const [transcript, setTranscript] = useState("");

  const [messages, setMessages] = useState([]);
  const messagesRef = useRef([]);
  const transcriptionHandlerRoomRef = useRef(null);
  const agentWordQueueRef = useRef([]);
  const agentWordTimerRef = useRef(null);
  const activeAgentMessageIndexRef = useRef(null);
  const lastAgentInterimTextRef = useRef("");
  const agentFinalReceivedRef = useRef(false);
  const awaitingUserFinalRef = useRef(false);
  const transcriptRef = useRef("");
  const isSpeakingRef = useRef(false);
  const userSpeechDetectedRef = useRef(false);
  const pendingUserMessageRef = useRef("");
  const pendingUserMessageIndexRef = useRef(null);
  const userMessagePendingRef = useRef(false);

  const scrollRef = useRef(null);

  const recognitionRef = useRef(null);
  const isLocalSTTActiveRef = useRef(false);
  const lastLocalSTTResultAtRef = useRef(0);

  const [testingOutput, setTestingOutput] = useState(null);

  const { mutate: createTestingOutput, isPending: isCreatingTestingOutput } =
    useCreateTestingOutput();

  const { data: versionsData } = useGetAgentVersions(agentId);

  const currentVoice = React.useMemo(() => {
    // If version param exists, try to find that version
    if (version && versionsData?.length) {
      const v = versionsData.find((v) => v.version_number === version);
      if (v) return v.voice;
    }
    // Fallback to first version (latest) or return null
    return versionsData?.[0]?.voice || null;
  }, [versionsData, version]);
  const agentName = React.useMemo(() => {
    // If version param exists, try to find that version
    if (version && versionsData?.length) {
      const v = versionsData.find((v) => v.version_number === version);
      if (v) return v.agent_name;
    }
    // Fallback to first version (latest) or return null
    return versionsData?.[0]?.agent_name || null;
  }, [versionsData, version]);

  const appendMessage = useCallback((role, content) => {
    const normalizedContent = (content || "").trim();
    if (!normalizedContent) return;

    setMessages((prev) => [
      ...prev,
      {
        role,
        content: normalizedContent,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
  }, []);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    isSpeakingRef.current = isSpeaking;
  }, [isSpeaking]);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    if (!room) {
      transcriptionHandlerRoomRef.current = null;
    }
  }, [room]);

  const clearProvisionalUserIfAny = useCallback(() => {
    pendingUserMessageRef.current = "";
    pendingUserMessageIndexRef.current = null;
    userMessagePendingRef.current = false;
  }, []);

  const appendProvisionalUserMessage = useCallback((content) => {
    if (
      pendingUserMessageIndexRef.current !== null ||
      userMessagePendingRef.current
    )
      return;
    const normalizedContent = (content || "").trim();
    if (!normalizedContent) return;

    userMessagePendingRef.current = true;
    pendingUserMessageRef.current = normalizedContent;

    setMessages((prev) => {
      pendingUserMessageIndexRef.current = prev.length;
      userMessagePendingRef.current = false;

      return [
        ...prev,
        {
          role: "user",
          content: normalizedContent,
          timestamp: new Date().toLocaleTimeString(),
        },
      ];
    });
  }, []);

  const replaceProvisionalUserMessage = useCallback(
    (finalText) => {
      const index = pendingUserMessageIndexRef.current;
      const normalizedFinal = (finalText || "").trim();

      if (index !== null) {
        setMessages((prev) => {
          if (!prev[index] || prev[index].role !== "user") return prev;
          const next = [...prev];
          next[index] = { ...next[index], content: normalizedFinal };
          pendingUserMessageIndexRef.current = null;
          return next;
        });
        clearProvisionalUserIfAny();
        return true;
      }

      if (userMessagePendingRef.current) {
        setMessages((prev) => {
          let targetIdx = -1;
          for (let i = prev.length - 1; i >= 0; i--) {
            if (prev[i].role === "user") {
              targetIdx = i;
              break;
            }
          }

          if (targetIdx >= 0) {
            const next = [...prev];
            next[targetIdx] = { ...next[targetIdx], content: normalizedFinal };
            pendingUserMessageIndexRef.current = null;
            return next;
          }
          return prev;
        });
        clearProvisionalUserIfAny();
        return true;
      }

      return false;
    },
    [clearProvisionalUserIfAny],
  );

  const clearAgentWordPump = useCallback(() => {
    if (agentWordTimerRef.current) {
      clearInterval(agentWordTimerRef.current);
      agentWordTimerRef.current = null;
    }
  }, []);

  const resetAgentStreamingState = useCallback(() => {
    clearAgentWordPump();
    agentWordQueueRef.current = [];
    activeAgentMessageIndexRef.current = null;
    lastAgentInterimTextRef.current = "";
    agentFinalReceivedRef.current = false;
    setShowAgentTypingFallback(false);
  }, [clearAgentWordPump]);

  const ensureActiveAgentMessage = useCallback(() => {
    if (activeAgentMessageIndexRef.current !== null) return;

    setMessages((prev) => {
      if (activeAgentMessageIndexRef.current !== null) return prev;

      activeAgentMessageIndexRef.current = prev.length;
      return [
        ...prev,
        {
          role: "bot",
          content: "",
          timestamp: new Date().toLocaleTimeString(),
        },
      ];
    });
  }, []);

  const appendWordToActiveAgentMessage = useCallback((word) => {
    const nextWord = (word || "").trim();
    if (!nextWord) return;

    setMessages((prev) => {
      const index = activeAgentMessageIndexRef.current;
      if (index === null || !prev[index] || prev[index].role !== "bot") {
        activeAgentMessageIndexRef.current = null;
        return prev;
      }

      const next = [...prev];
      const existing = next[index].content?.trim() || "";
      next[index] = {
        ...next[index],
        content: existing ? `${existing} ${nextWord}` : nextWord,
      };
      return next;
    });
  }, []);

  const replaceActiveAgentMessage = useCallback((content) => {
    const normalizedContent = (content || "").trim();
    setMessages((prev) => {
      const index = activeAgentMessageIndexRef.current;
      if (index === null || !prev[index] || prev[index].role !== "bot") {
        return prev;
      }

      const next = [...prev];
      next[index] = {
        ...next[index],
        content: normalizedContent,
      };
      return next;
    });
  }, []);

  const enqueueAgentWords = useCallback((words) => {
    if (!Array.isArray(words) || !words.length) return;
    agentWordQueueRef.current.push(...words);
  }, []);

  const extractAgentDeltaWords = useCallback((incomingText) => {
    const normalizedText = (incomingText || "").trim();
    if (!normalizedText) return [];

    const previousText = lastAgentInterimTextRef.current;
    if (!previousText) {
      lastAgentInterimTextRef.current = normalizedText;
      return normalizedText.split(/\s+/).filter(Boolean);
    }

    if (normalizedText === previousText) return [];

    if (normalizedText.startsWith(previousText)) {
      const deltaSuffix = normalizedText.slice(previousText.length).trim();
      lastAgentInterimTextRef.current = normalizedText;
      return deltaSuffix ? deltaSuffix.split(/\s+/).filter(Boolean) : [];
    }

    // Stable typing mode: ignore rewrite-only interim updates.
    return [];
  }, []);

  const drainAgentWordQueue = useCallback(() => {
    if (!agentWordQueueRef.current.length) {
      clearAgentWordPump();
      if (agentFinalReceivedRef.current) {
        resetAgentStreamingState();
      }
      return;
    }

    if (activeAgentMessageIndexRef.current === null) {
      ensureActiveAgentMessage();
      return;
    }

    const nextWord = agentWordQueueRef.current.shift();
    appendWordToActiveAgentMessage(nextWord);

    if (!agentWordQueueRef.current.length && agentFinalReceivedRef.current) {
      clearAgentWordPump();
      resetAgentStreamingState();
    }
  }, [
    clearAgentWordPump,
    ensureActiveAgentMessage,
    appendWordToActiveAgentMessage,
    resetAgentStreamingState,
  ]);

  const startAgentWordPump = useCallback(() => {
    if (agentWordTimerRef.current) return;
    agentWordTimerRef.current = setInterval(() => {
      drainAgentWordQueue();
    }, 70);
  }, [drainAgentWordQueue]);

  const clearLiveKitMessageBufferState = useCallback(() => {
    resetAgentStreamingState();
    awaitingUserFinalRef.current = false;
    clearProvisionalUserIfAny();
  }, [resetAgentStreamingState, clearProvisionalUserIfAny]);

  const ensureUserFirstOrdering = useCallback(() => {
    if (pendingUserMessageIndexRef.current !== null) return;

    const hasUserAtTail =
      messagesRef.current.length > 0 &&
      messagesRef.current[messagesRef.current.length - 1]?.role === "user";

    if (!hasUserAtTail) {
      if (transcriptRef.current) {
        appendProvisionalUserMessage(transcriptRef.current);
        userSpeechDetectedRef.current = false;
      } else if (userSpeechDetectedRef.current) {
        appendProvisionalUserMessage("...");
        userSpeechDetectedRef.current = false;
      }
    }
  }, [appendProvisionalUserMessage]);

  const startLocalTranscription = useCallback(
    (langCode) => {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        console.warn("SpeechRecognition not supported in this browser.");
        return;
      }

      if (recognitionRef.current) {
        return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = langCode || "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        if (finalTranscript) {
          const text = finalTranscript.trim();
          if (!text) return;

          lastLocalSTTResultAtRef.current = Date.now();
          userSpeechDetectedRef.current = true;
          const didReplace = replaceProvisionalUserMessage(text);
          if (!didReplace) {
            appendMessage("user", text);
          }
          setTranscript("");
          transcriptRef.current = "";
          userSpeechDetectedRef.current = false;
          awaitingUserFinalRef.current = false;

          if (
            isSpeakingRef.current &&
            activeAgentMessageIndexRef.current === null &&
            !agentWordQueueRef.current.length &&
            !lastAgentInterimTextRef.current
          ) {
            setShowAgentTypingFallback(true);
          }
          startAgentWordPump();
        } else if (interimTranscript) {
          const text = interimTranscript;
          lastLocalSTTResultAtRef.current = Date.now();
          userSpeechDetectedRef.current = true;
          setTranscript(text);
          transcriptRef.current = text;
          awaitingUserFinalRef.current = true;
          ensureUserFirstOrdering();
        }
      };

      recognition.onerror = (event) => {
        console.error("SpeechRecognition error", event.error);
        if (event.error === "not-allowed") {
          isLocalSTTActiveRef.current = false;
        }
      };

      recognition.onend = () => {
        if (isLocalSTTActiveRef.current) {
          try {
            recognition.start();
          } catch (e) {
            console.warn("Failed to restart recognition", e);
          }
        }
      };

      try {
        recognition.start();
        recognitionRef.current = recognition;
        isLocalSTTActiveRef.current = true;
      } catch (e) {
        console.error("Failed to start SpeechRecognition", e);
      }
    },
    [
      replaceProvisionalUserMessage,
      appendMessage,
      startAgentWordPump,
      ensureUserFirstOrdering,
    ],
  );

  const stopLocalTranscription = useCallback(() => {
    isLocalSTTActiveRef.current = false;
    lastLocalSTTResultAtRef.current = 0;
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
  }, []);

  const handleIncomingAgentTranscription = useCallback(
    (text, isFinal) => {
      ensureUserFirstOrdering();

      const normalizedText = (text || "").trim();

      if (isFinal) {
        if (activeAgentMessageIndexRef.current === null) {
          ensureActiveAgentMessage();
        }
        replaceActiveAgentMessage(normalizedText);
        agentWordQueueRef.current = [];
        agentFinalReceivedRef.current = true;
        startAgentWordPump();
        return;
      }

      const previousText = lastAgentInterimTextRef.current;

      if (previousText && !normalizedText.startsWith(previousText)) {
        if (activeAgentMessageIndexRef.current === null) {
          ensureActiveAgentMessage();
        }

        lastAgentInterimTextRef.current = normalizedText;
        replaceActiveAgentMessage(normalizedText);
        agentWordQueueRef.current = [];
        setShowAgentTypingFallback(false);
      } else {
        const deltaWords = extractAgentDeltaWords(text);
        if (deltaWords.length) {
          setShowAgentTypingFallback(false);
          enqueueAgentWords(deltaWords);
          startAgentWordPump();
        }
      }
    },
    [
      ensureUserFirstOrdering,
      extractAgentDeltaWords,
      enqueueAgentWords,
      startAgentWordPump,
      replaceActiveAgentMessage,
      ensureActiveAgentMessage,
    ],
  );

  const handleIncomingUserTranscription = useCallback(() => {
    /*
      // Arguments: rawText, text, isFinal
      const hasRecentLocalSTTResult =
        isLocalSTTActiveRef.current &&
        Date.now() - lastLocalSTTResultAtRef.current < 2500;
      if (hasRecentLocalSTTResult) return;

      userSpeechDetectedRef.current = true;
      if (isFinal) {
        const didReplace = replaceProvisionalUserMessage(text);
        if (!didReplace) {
          appendMessage("user", text);
        }
        setTranscript("");
        transcriptRef.current = "";
        userSpeechDetectedRef.current = false;
        awaitingUserFinalRef.current = false;
        if (
          isSpeakingRef.current &&
          activeAgentMessageIndexRef.current === null &&
          !agentWordQueueRef.current.length &&
          !lastAgentInterimTextRef.current
        ) {
          setShowAgentTypingFallback(true);
        }
        startAgentWordPump();
      } else {
        setTranscript(rawText || "");
        transcriptRef.current = rawText || "";
        awaitingUserFinalRef.current = !!text;
      }
      */
    // }, [replaceProvisionalUserMessage, appendMessage, startAgentWordPump]);
  }, []);

  useEffect(() => {
    if (!room) return;

    // Explicitly start audio to ensure playback works (fixes autoplay policy issues)
    room.startAudio().catch((e) => console.error("Failed to start audio:", e));

    const handleTranscription = async (reader, participant) => {
      try {
        const rawText = await reader.readAll();
        const text = (rawText || "").trim();
        const isFinalAttr =
          reader?.info?.attributes?.["lk.transcription_final"];
        const isFinal = isFinalAttr === true || isFinalAttr === "true";
        const transcribedTrackId =
          reader?.info?.attributes?.["lk.transcribed_track_id"];
        const isTranscribedLocalTrack = transcribedTrackId
          ? Array.from(room.localParticipant.trackPublications.values()).some(
              (pub) => pub.trackSid === transcribedTrackId,
            )
          : false;
        const isLocalIdentity =
          participant?.identity === room.localParticipant.identity;
        const isAgent = !(isLocalIdentity || isTranscribedLocalTrack);

        if (isAgent) {
          handleIncomingAgentTranscription(text, isFinal);
        } else {
          handleIncomingUserTranscription(rawText, text, isFinal);
        }
      } catch (error) {
        console.error("Error handling transcription:", error);
      }
    };

    const handleTrackSubscribed = (track, publication, participant) => {
      console.log("Track subscribed:", track.kind, participant.identity);
    };

    const handleActiveSpeakersChanged = (speakers) => {
      // Check if agent is speaking (anyone other than local participant)
      const agentSpeaking = speakers.some(
        (s) => s.identity !== room.localParticipant.identity,
      );

      const userSpeaking = speakers.some(
        (s) => s.identity === room.localParticipant.identity,
      );
      if (userSpeaking) {
        userSpeechDetectedRef.current = true;
      }

      setIsSpeaking(agentSpeaking);
      if (!agentSpeaking) {
        setShowAgentTypingFallback(false);
        return;
      }

      const hasUserAnchor =
        pendingUserMessageIndexRef.current !== null ||
        (messagesRef.current.length > 0 &&
          messagesRef.current[messagesRef.current.length - 1]?.role === "user");
      const hasActiveOrQueuedAgentText =
        activeAgentMessageIndexRef.current !== null ||
        agentWordQueueRef.current.length > 0 ||
        !!lastAgentInterimTextRef.current;

      if (hasUserAnchor && !hasActiveOrQueuedAgentText) {
        setShowAgentTypingFallback(true);
      }
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    if (transcriptionHandlerRoomRef.current !== room) {
      try {
        room.registerTextStreamHandler("lk.transcription", handleTranscription);
        transcriptionHandlerRoomRef.current = room;
      } catch (error) {
        const alreadyRegistered =
          error instanceof Error &&
          error.message.includes(
            'A text stream handler for topic "lk.transcription" has already been set.',
          );
        if (alreadyRegistered) {
          transcriptionHandlerRoomRef.current = room;
          console.warn(
            "Text stream handler for lk.transcription is already registered on this room.",
          );
        } else {
          console.error(
            "Failed to register text stream handler for lk.transcription:",
            error,
          );
        }
      }
    }
    room.on(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      room.off(RoomEvent.ActiveSpeakersChanged, handleActiveSpeakersChanged);
      clearLiveKitMessageBufferState();
    };
  }, [
    room,
    handleIncomingAgentTranscription,
    handleIncomingUserTranscription,
    clearLiveKitMessageBufferState,
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleListening = () => {
    if (!isStarted || (!isLiveKitConnected && !isLiveKitConnecting)) {
      clearLiveKitMessageBufferState();
      setMessages([]);
      setIsStarted(true);
      setIsListening(true);
      setTranscript("");
      transcriptRef.current = "";
      // Connect to LiveKit
      // Find language from current version or default to English
      const currentVersion = versionsData?.find(
        (v) => v.version_number === version,
      );
      const language =
        currentVersion?.language || versionsData?.[0]?.language || "English";
      const mappedLanguage = getLanguageCode(language);

      startLocalTranscription(mappedLanguage);

      connectLiveKit(null, "voiceassistant", null, {
        agentId: agentId,
        versionId: version,
        userId: user.id,
        testing: true,
        language: mappedLanguage,
      });
    } else {
      // Toggle microphone
      if (room?.localParticipant) {
        const newState = !isListening;
        room.localParticipant
          .setMicrophoneEnabled(newState)
          .then(() => {
            setIsListening(newState);
            if (newState) {
              const currentVersion = versionsData?.find(
                (v) => v.version_number === version,
              );
              const language =
                currentVersion?.language ||
                versionsData?.[0]?.language ||
                "English";
              const mappedLanguage = getLanguageCode(language);
              startLocalTranscription(mappedLanguage);
            } else {
              stopLocalTranscription();
            }
          })
          .catch((err) => console.error("Failed to toggle mic:", err));
      } else {
        const newState = !isListening;
        setIsListening(newState);
        if (newState) {
          const currentVersion = versionsData?.find(
            (v) => v.version_number === version,
          );
          const language =
            currentVersion?.language ||
            versionsData?.[0]?.language ||
            "English";
          const mappedLanguage = getLanguageCode(language);
          startLocalTranscription(mappedLanguage);
        } else {
          stopLocalTranscription();
        }
      }
    }
  };

  const onEndCallClick = () => {
    onEndCallOpen();
  };

  const confirmDisconnect = (clearData) => {
    setIsListening(false);
    disconnectLiveKit();
    stopLocalTranscription();
    clearLiveKitMessageBufferState();
    if (clearData) {
      setMessages([]);
      setIsStarted(false);
    }
    onEndCallClose();
  };

  const handleClearChat = () => {
    clearLiveKitMessageBufferState();
    setMessages([]);
    setIsStarted(false);
    stopLocalTranscription();
  };

  const resetConversation = () => {
    clearLiveKitMessageBufferState();
    setMessages([
      {
        role: "bot",
        content: "Conversation reset. How can I help you now?",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
    // For LiveKit, maybe we can just clear messages.
    // If backend state needs reset, that's handled by disconnect/connect usually.
  };

  const debugInfo = [
    { label: "Query Latency", value: "142ms", icon: <Clock size={14} /> },
    {
      label: "Call Status",
      value: isLiveKitConnected
        ? "Connected"
        : isLiveKitConnecting
          ? "Connecting"
          : "Idle",
      icon: <Activity size={14} />,
    },
    {
      label: "Token Usage",
      value: room?.name || "N/A",
      icon: <Hash size={14} />,
    },
  ];

  const jsonOutput = JSON.stringify(testingOutput || {}, null, 2);

  console.log("transcript8888", transcript);

  return (
    <Flex direction="column" h="full">
      <VoiceAiHeader />
      <Box
        p={4}
        flex={"0.99"}
        // h="calc(100vh - 90px)"
        bg="droidalBlack.300"
        borderRadius={"md"}
        color="white"
        overflow="hidden"
      >
        <Grid templateColumns="repeat(12, 1fr)" gap={6} h="100%">
          {/* First Column: Testing Area */}
          <GridItem colSpan={{ base: 12, lg: 8 }} h="100%" minH={0}>
            <VStack gap={6} align="stretch" h="100%" minH={0}>
              {/* Expanded Conversation History Card */}
              <AnimatePresence mode="wait">
                {!isStarted ? (
                  <Motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <Box
                      h="100%"
                      display="flex"
                      flexDirection="column"
                      justifyContent="center"
                      alignItems="center"
                      bg="droidalBlack.400"
                      borderRadius="xl"
                      border="1px solid"
                      borderColor="whiteAlpha.100"
                    >
                      <VStack gap={6}>
                        <HStack gap={1} align="center" justify="center">
                          <AudioLines
                            size={64}
                            color="white"
                            strokeWidth={1.5}
                          />
                        </HStack>

                        <VStack gap={2}>
                          <Text
                            fontSize="xl"
                            fontWeight="medium"
                            color="white"
                            textAlign="center"
                            letterSpacing={"widest"}
                          >
                            Test your voice agent
                          </Text>

                          <Text
                            fontSize="sm"
                            color="#90a6c6"
                            textAlign="center"
                            maxW="400px"
                            letterSpacing={"wider"}
                          >
                            Start a live test call to speak to your agent as you
                            configure and iterate.
                          </Text>
                        </VStack>

                        <CustomButton
                          onClick={toggleListening}
                          size="lg"
                          px={8}
                          variant="outline"
                          color="primary.400"
                          _hover={{
                            bg: "whiteAlpha.100",
                            borderColor: "primary.400",
                          }}
                          loading={isLiveKitConnecting}
                        >
                          START CALL
                        </CustomButton>
                      </VStack>
                    </Box>
                  </Motion.div>
                ) : (
                  <Motion.div
                    key="transcript"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    style={{
                      height: "100%",
                      width: "100%",
                      minHeight: 0,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <Card.Root
                      h="100%"
                      bg="blackAlpha.400"
                      border="1px solid"
                      borderColor="whiteAlpha.100"
                      borderRadius="xl"
                      display="flex"
                      flexDirection="column"
                      overflow="hidden"
                      minH={0}
                      position="relative"
                    >
                      <Card.Header
                        borderBottom="1px solid"
                        borderColor="whiteAlpha.100"
                        px={4}
                        py={3}
                      >
                        <HStack justify="space-between">
                          <HStack gap={4}>
                            <Text fontSize="sm" fontWeight="bold" color="white">
                              Conversation History
                            </Text>
                            <Box
                              as="button"
                              p={1}
                              onClick={resetConversation}
                              _hover={{ bg: "whiteAlpha.100" }}
                              borderRadius="md"
                              color="gray.400"
                            >
                              <RotateCcw size={14} />
                            </Box>
                          </HStack>
                          {isStarted &&
                            !isLiveKitConnected &&
                            !isLiveKitConnecting && (
                              <CustomButton
                                onClick={toggleListening}
                                size="xs"
                                variant="outline"
                                leftIcon={<Play size={14} />}
                              >
                                Start Call
                              </CustomButton>
                            )}
                        </HStack>
                      </Card.Header>
                      <VoiceVisualizer
                        isStarted={isStarted}
                        isMicOn={isListening}
                        voiceSrc={
                          currentVoice && avatarMap[currentVoice]
                            ? avatarMap[currentVoice]
                            : null
                        }
                      />
                      <HStack
                        w="full"
                        justifyContent={"space-between"}
                        color="white"
                        px={"1.5rem"}
                      >
                        <Text>{agentName ? agentName : "N/A"}</Text>
                        <Text>User</Text>
                      </HStack>
                      <Card.Body
                        p={4}
                        overflowY="auto"
                        ref={scrollRef}
                        flex="1"
                      >
                        {isLiveKitConnecting && (
                          <Box
                            position="absolute"
                            top="0"
                            left="0"
                            right="0"
                            bottom="0"
                            bg="blackAlpha.600"
                            zIndex="20"
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            flexDirection="column"
                            gap={4}
                            backdropFilter="blur(2px)"
                          >
                            <Spinner
                              size="xl"
                              color="blue.400"
                              thickness="4px"
                            />
                            <Text
                              color="white"
                              fontSize="lg"
                              fontWeight="medium"
                            >
                              Connecting...
                            </Text>
                          </Box>
                        )}
                        <VStack gap={4} align="stretch">
                          {messages.map((msg, index) => {
                            if (msg.role === "user" && !msg.content)
                              return null;
                            return (
                              <HStack
                                key={index}
                                align="start"
                                gap={3}
                                justify={
                                  msg.role === "user"
                                    ? "flex-end"
                                    : "flex-start"
                                }
                              >
                                {msg.role === "bot" && (
                                  <Circle
                                    size="24px"
                                    bg="var(--bg-blue-gradient)"
                                    color="white"
                                    overflow="hidden"
                                  >
                                    {currentVoice && avatarMap[currentVoice] ? (
                                      <Image
                                        src={avatarMap[currentVoice]}
                                        alt="Bot"
                                        w="100%"
                                        h="100%"
                                        objectFit="cover"
                                      />
                                    ) : (
                                      <Bot size={14} />
                                    )}
                                  </Circle>
                                )}
                                <Box
                                  p={3}
                                  bg={
                                    msg.role === "user"
                                      ? "var(--bg-blue-gradient)"
                                      : "whiteAlpha.100"
                                  }
                                  borderRadius="lg"
                                  maxW="85%"
                                  transition="all 0.15s ease-out"
                                >
                                  <Text
                                    fontSize="sm"
                                    color="white"
                                    transition="opacity 0.15s ease-out"
                                  >
                                    {msg.content}
                                  </Text>
                                </Box>
                              </HStack>
                            );
                          })}
                          {showAgentTypingFallback && (
                            <HStack align="start" gap={3} justify="flex-start">
                              <Circle
                                size="24px"
                                bg="var(--bg-blue-gradient)"
                                color="white"
                                overflow="hidden"
                              >
                                {currentVoice && avatarMap[currentVoice] ? (
                                  <Image
                                    src={avatarMap[currentVoice]}
                                    alt="Bot"
                                    w="100%"
                                    h="100%"
                                    objectFit="cover"
                                  />
                                ) : (
                                  <Bot size={14} />
                                )}
                              </Circle>
                              <Box
                                p={3}
                                bg="whiteAlpha.100"
                                borderRadius="lg"
                                maxW="85%"
                                transition="all 0.15s ease-out"
                              >
                                <Text
                                  fontSize="sm"
                                  color="gray.300"
                                  fontStyle="italic"
                                  transition="opacity 0.15s ease-out"
                                >
                                  Agent is typing...
                                </Text>
                              </Box>
                            </HStack>
                          )}
                        </VStack>
                      </Card.Body>

                      {/* Voice Speak Integrated at Bottom */}
                      <Box
                        p={4}
                        borderTop="1px solid"
                        borderColor="whiteAlpha.100"
                        bg="blackAlpha.200"
                      >
                        <HStack gap={4} align="center">
                          <Box
                            as="button"
                            onClick={toggleListening}
                            disabled={!isStarted}
                            display="flex"
                            alignItems="center"
                            justifyContent="center"
                            bg={
                              isListening
                                ? "var(--bg-red-gradient)"
                                : isStarted
                                  ? "var(--bg-blue-gradient)"
                                  : "gray.600"
                            }
                            _hover={{
                              bg: isListening
                                ? "var(--bg-red-gradient)"
                                : isStarted
                                  ? "var(--bg-blue-gradient)"
                                  : "gray.600",
                            }}
                            boxSize="40px"
                            borderRadius="full"
                            cursor={isStarted ? "pointer" : "not-allowed"}
                            transition="all 0.2s"
                            animationName={isListening ? "pulse" : "none"}
                            animationDuration="2s"
                            animationIterationCount="infinite"
                            border="none"
                            outline="none"
                            flexShrink={0}
                          >
                            {isSpeaking ? (
                              <Volume2 size={20} color="white" />
                            ) : isStarted && isListening ? (
                              <Mic size={20} color="white" />
                            ) : (
                              <MicOff size={20} color="white" />
                            )}
                          </Box>

                          <VStack align="start" gap={0} flex="1">
                            <Text
                              fontSize="xs"
                              color="gray.500"
                              fontWeight="bold"
                            >
                              {isLiveKitConnecting
                                ? "CONNECTING..."
                                : isLiveKitConnected
                                  ? isListening
                                    ? "LISTENING..."
                                    : "PAUSED"
                                  : "TAP TO CONNECT"}
                            </Text>
                            <Text color="white" fontSize="sm" noOfLines={1}>
                              {transcript ||
                                (isStarted
                                  ? "Your speech will appear here"
                                  : "Voice engine offline")}
                            </Text>
                          </VStack>

                          {/* Visualizer bars */}
                          <Box
                            display={"flex"}
                            gap={"24px"}
                            alignItems="center"
                          >
                            <HStack gap={1} h="20px" align="center">
                              {(isListening || isSpeaking) &&
                                [...Array(6)].map((_, i) => (
                                  <Box
                                    key={i}
                                    w="3px"
                                    bg="var(--bg-blue-gradient)"
                                    borderRadius="full"
                                    animationName="wave"
                                    animationDuration="1s"
                                    animationTimingFunction="ease-in-out"
                                    animationIterationCount="infinite"
                                    animationDelay={`${i * 0.1}s`}
                                  />
                                ))}
                            </HStack>
                            {isStarted &&
                            !isLiveKitConnected &&
                            !isLiveKitConnecting ? (
                              <CustomButton
                                size="sm"
                                variant="danger"
                                border="1px solid transparent"
                                borderRadius="4px"
                                _hover={{
                                  color: "#fff",
                                  border: "1px solid #fff",
                                }}
                                onClick={handleClearChat}
                                px={2}
                                leftIcon={<Trash size={14} />}
                              >
                                Clear Chat
                              </CustomButton>
                            ) : (
                              <CustomButton
                                size="sm"
                                variant="danger"
                                border="1px solid transparent"
                                borderRadius="4px"
                                _hover={{
                                  color: "#fff",
                                  border: "1px solid #fff",
                                }}
                                onClick={onEndCallClick}
                                px={2}
                                leftIcon={<PhoneOffIcon />}
                              >
                                End Call
                              </CustomButton>
                            )}
                          </Box>
                        </HStack>
                      </Box>
                    </Card.Root>
                  </Motion.div>
                )}
              </AnimatePresence>
            </VStack>
          </GridItem>

          {/* Second Column: Right Panel (Debug / Output JSON) */}
          <GridItem colSpan={{ base: 12, lg: 4 }} h="100%" minH={0}>
            <Tabs.Root
              value={rightPanelMode}
              onValueChange={(e) => setRightPanelMode(e.value)}
              variant="subtle"
              h="100%"
              css={{
                "&.chakra-tabs__root": {
                  display: "flex",
                  flexDirection: "column",
                },
              }}
            >
              <Tabs.List
                bg="blackAlpha.400"
                p={1}
                borderRadius="lg"
                border="1px solid"
                borderColor="whiteAlpha.100"
                mb={4}
                width="100%"
              >
                <Tabs.Trigger
                  value="debug"
                  flex={1}
                  color="gray.400"
                  _selected={{ color: "white", bg: "whiteAlpha.100" }}
                  py={2}
                  whiteSpace="nowrap"
                >
                  <Activity size={14} style={{ marginRight: "8px" }} />
                  Debug Info
                </Tabs.Trigger>
                <Tabs.Trigger
                  value="json"
                  flex={1}
                  color="gray.400"
                  _selected={{ color: "white", bg: "whiteAlpha.100" }}
                  py={2}
                  whiteSpace="nowrap"
                >
                  <FileJson size={14} style={{ marginRight: "8px" }} />
                  Output JSON
                </Tabs.Trigger>
              </Tabs.List>

              <Tabs.Content
                value="debug"
                flex={1}
                minH={0}
                m={0}
                h="100%"
                display="flex"
                flexDirection="column"
              >
                <VStack gap={6} align="stretch" h="100%" minH={0} flex={1}>
                  {/* Debug Info Card */}
                  <Card.Root
                    bg="droidalBlack.300"
                    border="1px solid whiteAlpha.100"
                    borderColor="whiteAlpha.200"
                    borderRadius="xl"
                    flexShrink={0}
                  >
                    <Card.Header borderColor="whiteAlpha.100" px={5} py={3}>
                      <HStack>
                        <Activity size={16} className="text-blue-400" />
                        <Text fontWeight="bold" fontSize="sm" color="white">
                          Debug Status
                        </Text>
                      </HStack>
                    </Card.Header>
                    <Card.Body
                      bgColor={"droidalBlack.400"}
                      borderRadius={"0px 0px 12px 12px"}
                      p={5}
                    >
                      <VStack gap={4} align="stretch">
                        {debugInfo.map((info, idx) => (
                          <HStack key={idx} justify="space-between">
                            <HStack gap={2} color="gray.400">
                              {info.icon}
                              <Text fontSize="sm">{info.label}</Text>
                            </HStack>
                            <Text
                              fontSize="sm"
                              fontWeight="bold"
                              color="blue.200"
                            >
                              {info.value}
                            </Text>
                          </HStack>
                        ))}
                      </VStack>
                    </Card.Body>
                  </Card.Root>

                  {/* Debug Queues Card - Simplified for LiveKit */}
                  <Card.Root
                    bg="droidalBlack.300"
                    border="1px solid whiteAlpha.100"
                    borderColor="whiteAlpha.200"
                    borderRadius="xl"
                    flex={1}
                    overflow="hidden"
                    display="flex"
                    flexDirection="column"
                    minH={0}
                  >
                    <Card.Header px={5} py={4}>
                      <HStack>
                        <Terminal size={18} className="text-green-400" />
                        <Text fontWeight="bold" color="white">
                          Logs
                        </Text>
                      </HStack>
                    </Card.Header>
                    <Card.Body
                      p={0}
                      overflow="hidden"
                      flex={1}
                      display="flex"
                      flexDirection="column"
                    >
                      <Box
                        bgColor={"droidalBlack.400"}
                        p={4}
                        flex="1"
                        fontFamily="monospace"
                        fontSize="xs"
                        color="green.400"
                        overflowY="auto"
                      >
                        <VStack align="start" gap={1}>
                          <Text color="gray.600">
                            [System]: Status:{" "}
                            {isLiveKitConnected
                              ? "Connected"
                              : isLiveKitConnecting
                                ? "Connecting..."
                                : "Disconnected"}
                          </Text>
                          {room && (
                            <Text color="gray.600">
                              [System]: Room SID: {room.sid}
                            </Text>
                          )}
                          {messages.map((msg, i) => (
                            <React.Fragment key={i}>
                              {/* Display simplified log for messages */}
                              <Text
                                color={
                                  msg.role === "bot" ? "blue.400" : "white"
                                }
                              >
                                [{msg.timestamp}] {msg.role.toUpperCase()}: "
                                {msg.content.substring(0, 30)}..."
                              </Text>
                            </React.Fragment>
                          ))}
                        </VStack>
                      </Box>
                    </Card.Body>
                  </Card.Root>
                </VStack>
              </Tabs.Content>

              <Tabs.Content value="json" flex={1} minH={0} m={0}>
                <Card.Root
                  bg="droidalBlack.300"
                  border="1px solid"
                  borderColor="whiteAlpha.200"
                  borderRadius="xl"
                  h="100%"
                  overflow="hidden"
                  display="flex"
                  flexDirection="column"
                  minH={0}
                >
                  <Card.Header
                    borderBottom="1px solid"
                    borderColor="whiteAlpha.100"
                    px={5}
                    py={4}
                  >
                    <HStack justify="space-between">
                      <HStack>
                        <FileJson size={18} className="text-yellow-400" />
                        <Text fontWeight="bold" color="white">
                          JSON
                        </Text>
                      </HStack>
                      <HStack gap={2}>
                        <CustomButton
                          size="xs"
                          variant="outline"
                          loading={isCreatingTestingOutput}
                          onClick={() => {
                            console.log(
                              "Generate JSON clicked. agentId:",
                              agentId,
                            );
                            createTestingOutput(
                              { id: agentId, messages: messages },
                              {
                                onSuccess: (data) => {
                                  console.log(
                                    "Create testing output success:",
                                    data,
                                  );
                                  setTestingOutput(data);
                                },
                                onError: (error) => {
                                  console.error(
                                    "Create testing output error:",
                                    error,
                                  );
                                },
                              },
                            );
                          }}
                        >
                          Generate JSON
                        </CustomButton>
                        <CustomButton
                          size="xs"
                          variant="outline"
                          onClick={() => {
                            navigator.clipboard.writeText(jsonOutput);
                          }}
                        >
                          Copy
                        </CustomButton>
                      </HStack>
                    </HStack>
                  </Card.Header>
                  <Card.Body p={0} overflow="hidden" flex={1}>
                    <Box
                      bg="black"
                      p={4}
                      h="100%"
                      fontFamily="monospace"
                      fontSize="xs"
                      color="green.400"
                      overflowY="auto"
                    >
                      <pre style={{ whiteSpace: "pre-wrap" }}>{jsonOutput}</pre>
                    </Box>
                  </Card.Body>
                </Card.Root>
              </Tabs.Content>
            </Tabs.Root>
          </GridItem>
        </Grid>
      </Box>

      <Dialog.Root
        open={isEndCallDialogOpen}
        onOpenChange={(e) => (e.open ? onEndCallOpen() : onEndCallClose())}
        role="alertdialog"
        placement="center"
        size="lg"
        initialFocusEl={() => cancelRef.current}
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bg="droidalBlack.300"
            color="white"
            border="1px solid"
            borderColor="whiteAlpha.200"
          >
            <Dialog.Header>
              <Dialog.Title fontSize="lg" m={0} fontWeight="bold">
                End Call
              </Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              Do you want to clear the chat data or gap=it for the next session?
            </Dialog.Body>

            <Dialog.Footer>
              <CustomButton
                ref={cancelRef}
                onClick={onEndCallClose}
                variant="outline"
                mr={3}
              >
                Cancel
              </CustomButton>
              <CustomButton
                variant="outline"
                onClick={() => confirmDisconnect(false)}
                mr={3}
              >
                End Call & Keep Chat
              </CustomButton>
              <CustomButton
                variant="danger"
                onClick={() => confirmDisconnect(true)}
              >
                End Call & Clear Chat
              </CustomButton>
            </Dialog.Footer>
            <Dialog.CloseTrigger />
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </Flex>
  );
};

export default VoiceAiLiveKitTesting;

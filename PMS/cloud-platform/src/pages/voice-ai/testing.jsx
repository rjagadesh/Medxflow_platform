import React, { useState, useEffect, useRef, useCallback } from "react";
import useVoiceAiTextSocket from "../../hooks/useVoiceAiTextSocket";
import useLiveKitVoice from "../../hooks/useLiveKitVoice";
import { RoomEvent } from "livekit-client";
import {
  Box,
  VStack,
  HStack,
  Text,
  Container,
  Circle,
  Grid,
  GridItem,
  Card,
  Badge,
  Separator,
  Tabs,
  Select,
  Image,
} from "@chakra-ui/react";
import { useGetAgentVersionsByApp } from "../../hooks/query/useGetAgentVersionsByApp";
import { avatarMap } from "../../assets/avatar";
import VoiceAiHeader from "./components/voice-ai-header";
import CustomButton from "../../components/button/button";
import {
  Mic,
  MicOff,
  User,
  Bot,
  RotateCcw,
  Play,
  Activity,
  Database,
  Cpu,
  Clock,
  Hash,
  Terminal,
  Volume2,
  FileJson,
  Layout,
} from "lucide-react";

import { atobAgentId } from "../../utils/helper";
import { useParams } from "react-router-dom";
import { useGetTestingOutput } from "@/hooks/query/voiceai/useGetTestingOutput";
import { useCreateTestingOutput } from "@/hooks/mutation/voiceai/useSaveTestingOutput";
import CustomSelect from "@/components/ui/select";

const VoiceAiTesting = () => {
  const { agent_app } = useParams();
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

  const { data: versionsData } = useGetAgentVersionsByApp(agentId);
  const currentVoice = React.useMemo(() => {
    if (versionsData?.length > 0) {
      return versionsData[0]?.voice;
    }
    return null;
  }, [versionsData]);

  const [isLiveKitMode, setIsLiveKitMode] = useState(false);
  const {
    connect: connectLiveKit,
    disconnect: disconnectLiveKit,
    isConnected: isLiveKitConnected,
    isConnecting: isLiveKitConnecting,
    room,
  } = useLiveKitVoice();

  const [isStarted, setIsStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rightPanelMode, setRightPanelMode] = useState("debug");
  const [transcript, setTranscript] = useState("");
  const [voices, setVoices] = useState([]); // ✅ added

  const [messages, setMessages] = useState([
    {
      role: "bot",
      content:
        "Hi this is polly from Uncommon Orthodontics. Press 'Start Testing' to begin our conversation.",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const pendingAgentMessagesRef = useRef([]);
  const agentFlushTimerRef = useRef(null);
  const awaitingUserFinalRef = useRef(false);
  const transcriptRef = useRef("");
  const pendingUserMessageRef = useRef("");
  const pendingUserMessageIndexRef = useRef(null);

  const [isMuted] = useState(false);

  const recognitionRef = useRef(null);

  // ✅ FIXED synthRef initialization
  const synthRef = useRef(null);

  const scrollRef = useRef(null);

  const audioContextRef = useRef(null);
  const nextStartTimeRef = useRef(0);

  const processorRef = useRef(null);
  const streamRef = useRef(null);

  /**
   * ✅ FIX — Load voices properly (async safe)
   */
  useEffect(() => {
    synthRef.current = window.speechSynthesis;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      console.log("Available voices:", availableVoices);
    };

    loadVoices();

    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  /**
   * ✅ FIXED speakText (stable voice selection)
   */
  const speakText = useCallback(
    (text) => {
      if (!text) return;

      const synth = synthRef.current;
      synth?.cancel();

      const utterance = new SpeechSynthesisUtterance(text);

      const preferredVoiceNames = [
        "Microsoft Aria",
        "Microsoft Jenny",
        "Google UK English Female",
        "Samantha",
        "Victoria",
        "Zira",
      ];

      const selectedVoice =
        voices.find((v) =>
          preferredVoiceNames.some((name) =>
            v.name.toLowerCase().includes(name.toLowerCase()),
          ),
        ) || voices.find((v) => v.lang.startsWith("en"));

      if (selectedVoice) {
        utterance.voice = selectedVoice;
      }

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);

      synth?.speak(utterance);
    },
    [voices],
  );

  const handleSocketMessage = useCallback(
    async (message) => {
      if (message.event === "text" || message.type === "text") {
        const botResponse = message.text || message.token;
        if (!botResponse) return;

        const botMessage = {
          role: "bot",
          content: botResponse,
          timestamp: new Date().toLocaleTimeString(),
        };

        setMessages((prev) => [...prev, botMessage]);
        speakText(botResponse);
      }
    },
    [speakText],
  );

  const { sessionId, sendText, resetSession, socketReadyState } =
    useVoiceAiTextSocket(
      isStarted && !isLiveKitMode,
      handleSocketMessage,
      agentId,
    );

  const [testingOutput, setTestingOutput] = useState(null);

  const { mutate: createTestingOutput, isPending: isCreatingTestingOutput } =
    useCreateTestingOutput();

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

  const clearProvisionalUserIfAny = useCallback(() => {
    pendingUserMessageRef.current = "";
    pendingUserMessageIndexRef.current = null;
  }, []);

  const appendProvisionalUserMessage = useCallback((content) => {
    if (pendingUserMessageIndexRef.current !== null) return;
    const normalizedContent = (content || "").trim();
    if (!normalizedContent) return;

    setMessages((prev) => {
      pendingUserMessageRef.current = normalizedContent;
      pendingUserMessageIndexRef.current = prev.length;

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

      if (index === null) return false;
      if (normalizedFinal) {
        setMessages((prev) => {
          if (!prev[index] || prev[index].role !== "user") return prev;
          const next = [...prev];
          next[index] = { ...next[index], content: normalizedFinal };
          return next;
        });
      }

      clearProvisionalUserIfAny();
      return true;
    },
    [clearProvisionalUserIfAny],
  );

  const clearAgentFlushTimer = useCallback(() => {
    if (agentFlushTimerRef.current) {
      clearTimeout(agentFlushTimerRef.current);
      agentFlushTimerRef.current = null;
    }
  }, []);

  const flushQueuedAgentMessages = useCallback(() => {
    clearAgentFlushTimer();
    if (!pendingAgentMessagesRef.current.length) return;

    const queuedMessages = [...pendingAgentMessagesRef.current];
    pendingAgentMessagesRef.current = [];

    setMessages((prev) => [
      ...prev,
      ...queuedMessages.map((content) => ({
        role: "bot",
        content,
        timestamp: new Date().toLocaleTimeString(),
      })),
    ]);
  }, [clearAgentFlushTimer]);

  const scheduleAgentFlush = useCallback(() => {
    clearAgentFlushTimer();
    agentFlushTimerRef.current = setTimeout(() => {
      flushQueuedAgentMessages();
    }, 1200);
  }, [clearAgentFlushTimer, flushQueuedAgentMessages]);

  const clearLiveKitMessageBufferState = useCallback(() => {
    clearAgentFlushTimer();
    pendingAgentMessagesRef.current = [];
    awaitingUserFinalRef.current = false;
    clearProvisionalUserIfAny();
  }, [clearAgentFlushTimer, clearProvisionalUserIfAny]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition && !recognitionRef.current) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;

            sendText(event.results[i][0].transcript);

            const userMessage = {
              role: "user",
              content: event.results[i][0].transcript,
              timestamp: new Date().toLocaleTimeString(),
            };

            setMessages((prev) => [...prev, userMessage]);
            setTranscript("");
          } else {
            interimTranscript += event.results[i][0].transcript;
            setTranscript(interimTranscript);
          }
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error("Speech recognition error:", event.error);
        // Don't set isListening false here, let onend handle it if needed
      };

      recognitionRef.current.onend = () => {
        // If it was supposed to be listening and we haven't stopped the session, restart
        if (isListening && isStarted) {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.error("Failed to restart recognition on end:", err);
          }
        }
      };
    }

    // Actual control based on state
    if (isListening && isStarted && !isLiveKitMode) {
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Recognition already started or failed to start", e);
      }
    } else {
      recognitionRef.current?.stop();
    }
  }, [isListening, isStarted, sendText, isLiveKitMode]);

  useEffect(() => {
    if (!room) return;

    // Explicitly start audio to ensure playback works (fixes autoplay policy issues)
    room.startAudio().catch((e) => console.error("Failed to start audio:", e));

    const handleTranscription = async (reader, participant) => {
      try {
        const rawText = await reader.readAll();
        const text = (rawText || "").trim();
        const isFinal =
          reader.info.attributes["lk.transcription_final"] === "true";
        const isAgent = participant.identity !== room.localParticipant.identity;

        if (isAgent) {
          if (!isFinal || !text) return;

          if (awaitingUserFinalRef.current) {
            appendProvisionalUserMessage(transcriptRef.current);
            pendingAgentMessagesRef.current.push(text);
            scheduleAgentFlush();
          } else {
            appendMessage("bot", text);
          }
        } else {
          if (isFinal) {
            const didReplace = replaceProvisionalUserMessage(text);
            if (!didReplace) {
              appendMessage("user", text);
            }
            setTranscript("");
            transcriptRef.current = "";
            awaitingUserFinalRef.current = false;
            flushQueuedAgentMessages();
          } else {
            setTranscript(rawText || "");
            transcriptRef.current = rawText || "";
            awaitingUserFinalRef.current = !!text;
          }
        }
      } catch (error) {
        console.error("Error handling transcription:", error);
      }
    };

    const handleTrackSubscribed = (track, publication, participant) => {
      console.log("Track subscribed:", track.kind, participant.identity);
    };

    room.on(RoomEvent.TrackSubscribed, handleTrackSubscribed);
    room.registerTextStreamHandler("lk.transcription", handleTranscription);

    return () => {
      room.off(RoomEvent.TrackSubscribed, handleTrackSubscribed);
      clearLiveKitMessageBufferState();
    };
  }, [
    room,
    appendMessage,
    appendProvisionalUserMessage,
    replaceProvisionalUserMessage,
    flushQueuedAgentMessages,
    scheduleAgentFlush,
    clearLiveKitMessageBufferState,
  ]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const toggleListening = () => {
    if (isLiveKitMode) {
      if (!isStarted) {
        clearLiveKitMessageBufferState();
        setIsStarted(true);
        setIsListening(true);
        setTranscript("");
        transcriptRef.current = "";
        connectLiveKit(null, "Alex-92f");
      } else {
        setIsListening(!isListening);
      }
      return;
    }

    if (!isStarted) {
      setIsStarted(true);
      setIsListening(true);
      setTranscript("");
      // Start recognition happens in useEffect when isListening changes to true
    } else {
      if (isListening) {
        recognitionRef.current?.stop();
        setIsListening(false);
        setTranscript("");
      } else {
        setTranscript("");
        try {
          recognitionRef.current?.start();
          setIsListening(true);
        } catch (err) {
          console.error("Failed to start recognition:", err);
        }
        synthRef.current?.cancel();
        setIsSpeaking(false);
      }
    }
  };

  const handleDisconnect = () => {
    setIsStarted(false);
    setIsListening(false);
    clearLiveKitMessageBufferState();
    if (isLiveKitMode) {
      disconnectLiveKit();
    }
    recognitionRef.current?.stop();
    synthRef.current?.cancel();
    setMessages([
      {
        role: "bot",
        content:
          "Hi this is polly from Uncommon Orthodontics. Press 'Start Testing' to begin our conversation.",
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);
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

    synthRef.current?.cancel();
    setIsSpeaking(false);
    resetSession();
  };

  const debugInfo = [
    { label: "Query Latency", value: "142ms", icon: <Clock size={14} /> },
    {
      label: "Speech Token Usage",
      value: "1,240 / 8,000",
      icon: <Database size={14} />,
    },
    { label: "AI Confidence Score", value: "98.4%", icon: <Cpu size={14} /> },
    {
      label: "Call Status",
      value: isStarted ? "Active" : "Idle",
      icon: <Activity size={14} />,
    },
    {
      label: "Session ID",
      value: sessionId.substring(13),
      icon: <Hash size={14} />,
    },
  ];

  const jsonOutput = JSON.stringify(testingOutput || {}, null, 2);

  return (
    <>
      <VoiceAiHeader />
      <Box
        p={4}
        h="calc(100vh - 90px)"
        bg="#1e1e1e"
        color="white"
        overflow="hidden"
      >
        <Grid templateColumns="repeat(12, 1fr)" gap={6} h="100%">
          {/* First Column: Testing Area */}
          <GridItem colSpan={{ base: 12, lg: 8 }} h="100%" minH={0}>
            <VStack gap={6} align="stretch" h="100%" minH={0}>
              {/* Expanded Conversation History Card */}
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
                    <HStack gap={3}>
                      <CustomButton
                        size="xs"
                        variant="outline"
                        onClick={() => {
                          handleDisconnect();
                          setIsLiveKitMode(!isLiveKitMode);
                        }}
                      >
                        {isLiveKitMode ? "LiveKit" : "Standard"}
                      </CustomButton>
                      {!isStarted ? (
                        <CustomButton
                          size="sm"
                          onClick={() => {
                            setIsStarted(true);
                            setIsListening(false);
                            setTranscript("");
                          }}
                          px={2}
                          leftIcon={<Play size={12} />}
                        >
                          Start Testing
                        </CustomButton>
                      ) : (
                        <CustomButton
                          size="sm"
                          variant="outline"
                          colorPalette="red"
                          onClick={handleDisconnect}
                          px={2}
                        >
                          Disconnect
                        </CustomButton>
                      )}
                    </HStack>
                  </HStack>
                </Card.Header>
                <Card.Body p={4} overflowY="auto" ref={scrollRef} flex="1">
                  <VStack gap={4} align="stretch">
                    {messages.map((msg, index) => (
                      <HStack
                        key={index}
                        align="start"
                        gap={3}
                        justify={
                          msg.role === "user" ? "flex-end" : "flex-start"
                        }
                      >
                        {msg.role === "bot" && (
                          <Circle
                            size="24px"
                            bg="blue.600"
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
                            msg.role === "user" ? "blue.600" : "whiteAlpha.100"
                          }
                          borderRadius="lg"
                          maxW="85%"
                        >
                          <Text
                            fontSize="xs"
                            fontWeight="bold"
                            mb={1}
                            color={
                              msg.role === "user"
                                ? "whiteAlpha.800"
                                : "blue.300"
                            }
                          >
                            {msg.role === "user" ? "YOU" : "BOT"}
                          </Text>
                          <Text fontSize="sm" color="white">
                            {msg.content}
                          </Text>
                        </Box>
                      </HStack>
                    ))}
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
                          ? "red.500"
                          : isStarted
                            ? "blue.500"
                            : "gray.600"
                      }
                      _hover={{
                        bg: isListening
                          ? "red.600"
                          : isStarted
                            ? "blue.600"
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
                        <MicOff size={20} color="white" />
                      ) : (
                        <Mic size={20} color="white" />
                      )}
                    </Box>

                    <VStack align="start" gap={0} flex="1">
                      <Text fontSize="xs" color="gray.500" fontWeight="bold">
                        {isLiveKitMode
                          ? isLiveKitConnecting
                            ? "CONNECTING..."
                            : isLiveKitConnected
                              ? isListening
                                ? "LISTENING (LIVEKIT)..."
                                : "PAUSED (LIVEKIT)"
                              : "TAP TO CONNECT (LIVEKIT)"
                          : isListening
                            ? "LISTENING..."
                            : isSpeaking
                              ? "SPEAKING..."
                              : isStarted
                                ? "TAP TO SPEAK"
                                : "START TESTING TO BEGIN"}
                      </Text>
                      <Text color="white" fontSize="sm" noOfLines={1}>
                        {transcript ||
                          (isStarted
                            ? "Your speech will appear here"
                            : "Voice engine offline")}
                      </Text>
                    </VStack>

                    {/* Visualizer bars */}
                    <HStack gap={1} h="20px" align="center">
                      {(isListening || isSpeaking) &&
                        [...Array(6)].map((_, i) => (
                          <Box
                            key={i}
                            w="3px"
                            bg="blue.400"
                            borderRadius="full"
                            animationName="wave"
                            animationDuration="1s"
                            animationTimingFunction="ease-in-out"
                            animationIterationCount="infinite"
                            animationDelay={`${i * 0.1}s`}
                          />
                        ))}
                    </HStack>
                  </HStack>
                </Box>
              </Card.Root>
            </VStack>
          </GridItem>

          {/* Second Column: Right Panel (Debug / Output JSON) */}
          <GridItem colSpan={{ base: 12, lg: 4 }} h="100%" minH={0}>
            <Tabs.Root
              value={rightPanelMode}
              onValueChange={(e) => setRightPanelMode(e.value)}
              variant="subtle"
              h="100%"
              display="flex"
              flexDirection="column"
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

              <Tabs.Content value="debug" flex={1} minH={0} m={0}>
                <VStack gap={6} align="stretch" h="100%" minH={0}>
                  {/* Debug Info Card */}
                  <Card.Root
                    bg="droidalBlack.300"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    borderRadius="xl"
                    flexShrink={0}
                  >
                    <Card.Header
                      borderBottom="1px solid"
                      borderColor="whiteAlpha.100"
                      px={5}
                      py={3}
                    >
                      <HStack>
                        <Activity size={16} className="text-blue-400" />
                        <Text fontWeight="bold" fontSize="sm" color="white">
                          Debug Status
                        </Text>
                      </HStack>
                    </Card.Header>
                    <Card.Body p={5}>
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

                  {/* Debug Queues Card */}
                  <Card.Root
                    bg="droidalBlack.300"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                    borderRadius="xl"
                    flex={1}
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
                      <HStack>
                        <Terminal size={18} className="text-green-400" />
                        <Text fontWeight="bold" color="white">
                          Debug Queues
                        </Text>
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
                        <VStack align="start" gap={1}>
                          <Text color="gray.600">
                            [System]: WebSocket Status:{" "}
                            {socketReadyState === WebSocket.OPEN
                              ? "Connected"
                              : "Disconnected"}
                          </Text>
                          <Text color="gray.600">
                            [System]: Session ID: {sessionId}
                          </Text>
                          {messages.map((msg, i) => (
                            <React.Fragment key={i}>
                              <Text>
                                [{msg.timestamp}] {msg.role.toUpperCase()}:
                                Sending packet to stream...
                              </Text>
                              <Text color="blue.400">
                                [{msg.timestamp}] {msg.role.toUpperCase()}
                                _PAYLOAD: "{msg.content.substring(0, 30)}..."
                              </Text>
                              <Text color="gray.600">
                                [{msg.timestamp}] {msg.role.toUpperCase()}: ACK
                                received. Seq: {100 + i}
                              </Text>
                            </React.Fragment>
                          ))}
                          {isListening && (
                            <Text className="animate-pulse">
                              _Listening for incoming stream...
                            </Text>
                          )}
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
    </>
  );
};

export default VoiceAiTesting;

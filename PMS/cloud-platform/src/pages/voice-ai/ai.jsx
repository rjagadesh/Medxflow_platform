import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  GridItem,
  Text,
  VStack,
  Accordion,
  Span,
  SimpleGrid,
  HStack,
  Flex,
} from "@chakra-ui/react";
import VoiceAiHeader from "./components/voice-ai-header";
import CustomInput from "@/components/input/input";
import CustomTextArea from "@/components/textarea/textarea";
import { useForm, Controller } from "react-hook-form";
import { useParams, useSearchParams } from "react-router-dom";
import { Expand, Mic, MicOff, Send } from "lucide-react";
import { useCreateAgentScript } from "@/hooks/mutation/useCreateAgentScript";
import { useUpdateAgentScript } from "@/hooks/mutation/useUpdateAgentScript";
import { useOptimizeScript } from "@/hooks/mutation/useOptimizeScript";
import { atobAgentId } from "@/utils/helper";
import { useGetAgentById } from "@/hooks/query/useGetAgentById";
import { useGetAgentVersions } from "@/hooks/query/useGetAgentVersions";
import { useGetAgentScriptByVersion } from "@/hooks/query/useGetAgentScriptByVersion";
import { useCreateAgentVersion } from "@/hooks/mutation/useCreateAgentVersion";
import { useCloneAgentVersion } from "@/hooks/mutation/useCloneAgentVersion";
import CustomButton from "@/components/button/button";
import { toaster } from "@/components/ui/toaster";
import VoiceAiUpload from "./components/voice-ai-upload";

const initialState = {
  script: "",
};

const VoiceAIPage = () => {
  const [isConfigExpanded, setIsConfigExpanded] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const { agent_app } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const agentId = agent_app ? atobAgentId(agent_app) : null;

  const formRef = useRef(null);
  const recognitionRef = useRef(null);

  const { mutateAsync: createScript, isPending: isCreateLoading } =
    useCreateAgentScript();
  const { mutateAsync: updateScript, isPending: isUpdateLoading } =
    useUpdateAgentScript();
  const { mutateAsync: optimizeScript, isPending: isOptimizing } =
    useOptimizeScript();
  const { mutateAsync: createVersion, isPending: isCreateVersionLoading } =
    useCreateAgentVersion();
  const { mutateAsync: cloneVersion, isPending: isCloning } =
    useCloneAgentVersion();

  const { data: fetchedAgent, isLoading: agentLoading } =
    useGetAgentById(agentId);
  const { data: agentVersionsData, isLoading: agentVersionsLoading } =
    useGetAgentVersions(agentId);
  const agentVersions = agentVersionsData || [];

  const versionParam = searchParams.get("version");
  const targetVersion = useMemo(() => {
    if (!agentVersions?.length) return null;
    if (versionParam) {
      return (
        agentVersions.find((v) => v.version_number === versionParam) ||
        agentVersions[0]
      );
    }
    return agentVersions[0];
  }, [agentVersions, versionParam]);

  const { data: scriptDataByVersion, isLoading: isScriptLoading } =
    useGetAgentScriptByVersion(targetVersion?.id);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      script: initialState.script,
    },
  });
  const values = watch();

  const handleUploadSuccess = (data) => {
    // When uploading, we combine the analyzed fields into a single script if they exist
    // or just set the script if provided.
    if (data) {
      setValue("script", data);
    } else {
      const combinedScript = `
Role: ${data.role || ""}
Context: ${data.context || ""}
Task: ${data.task || ""}
Rules: ${data.rules || ""}
Few-shot: ${data.few_shot || ""}
`.trim();
      setValue("script", combinedScript);
    }
  };

  const configObject = useMemo(() => {
    return {
      script: (values.script || "").trim(),
    };
  }, [values]);

  const configPreview = useMemo(
    () =>
      isConfigExpanded
        ? JSON.stringify(configObject, null, 2)
        : JSON.stringify(configObject),
    [configObject, isConfigExpanded],
  );

  useEffect(() => {
    if (scriptDataByVersion) {
      reset({
        script: scriptDataByVersion?.script || "",
      });
    }
  }, [scriptDataByVersion, reset]);

  const handleOptimizeScript = async () => {
    if (!chatInput.trim()) return;
    try {
      const response = await optimizeScript({
        current_script: values.script,
        user_instruction: chatInput,
        agent_id: agentId,
        version_id: targetVersion?.id,
      });
      if (response.updated_script) {
        setValue("script", response.updated_script);
        setChatInput("");
        toaster.success({
          title: "Success",
          description: "Script optimized successfully!",
        });
      }
    } catch (error) {
      toaster.error({
        title: "Error",
        description: "Failed to optimize script.",
      });
    }
  };

  const toggleMic = () => {
    if (
      !("webkitSpeechRecognition" in window) &&
      !("speechRecognition" in window)
    ) {
      toaster.error({
        title: "Error",
        description: "Speech recognition not supported in this browser.",
      });
      return;
    }

    const SpeechRecognition =
      window.webkitSpeechRecognition || window.speechRecognition;

    // If currently listening, stop the recognition
    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
      setIsListening(false);
      return;
    }

    // Create new recognition instance
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setChatInput(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  // Cleanup recognition on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const getNextVersion = (versions) => {
    if (!versions || versions.length === 0) return "1.0";

    // Extract version numbers
    const versionNumbers = versions
      .map((v) => v.version_number)
      .filter((v) => v)
      .map((v) => parseFloat(v.replace("v", "")))
      .filter((v) => !isNaN(v));

    if (versionNumbers.length === 0) return "1.0";

    const maxVersion = Math.max(...versionNumbers);
    // Increment by 0.1 and fix to 1 decimal place
    const nextVersion = (maxVersion + 0.1).toFixed(1);
    return `${nextVersion}`;
  };

  const handleSaveAsNewVersion = async (v) => {
    if (!agentVersions || agentVersions.length === 0) {
      toaster.error({
        title: "Error",
        description:
          "Please save the initial version first before creating a new version.",
      });
      return;
    }

    try {
      const nextVersion = getNextVersion(agentVersions);

      await cloneVersion({
        app: agentId,
        version_number: nextVersion,
        source_version_id: targetVersion?.id,
        script_updates: {
          script: v.script,
        },
      });

      toaster.success({
        title: "Success",
        description: "New version created successfully.",
      });

      // Update URL to switch to new version
      setSearchParams({ version: nextVersion });
    } catch (error) {
      console.error("Save as new version error:", error);
      toaster.error({
        title: "Error",
        description: "Failed to save as new version.",
      });
    }
  };

  const onSubmit = async (v) => {
    try {
      let targetVersionId = null;
      let existingScriptId = null;

      if (targetVersion) {
        targetVersionId = targetVersion.id;
      }

      if (scriptDataByVersion?.id) {
        existingScriptId = scriptDataByVersion.id;
      }

      if (!targetVersionId) {
        const versionPayload = {
          version_number: "1.0",
          status: "Draft",
          app: agentId,
        };
        const newVersion = await createVersion(versionPayload);
        targetVersionId = newVersion.id;
      }

      if (targetVersionId) {
        const scriptPayload = {
          agent: targetVersionId,
          script: v.script,
        };

        if (existingScriptId) {
          await updateScript(
            { id: existingScriptId, data: scriptPayload },
            {
              onSuccess: () => {
                toaster.success({
                  title: "Success",
                  description: "Script updated successfully!",
                });
              },
              onError: () => {
                toaster.error({
                  title: "Error",
                  description: "Failed to update script.",
                });
              },
            },
          );
        } else {
          await createScript(scriptPayload, {
            onSuccess: () => {
              toaster.success({
                title: "Success",
                description: "Script saved successfully!",
              });
            },
            onError: () => {
              toaster.error({
                title: "Error",
                description: "Failed to save script.",
              });
            },
          });
        }
      } else {
        toaster.error({
          title: "Error",
          description: "Failed to save script.",
        });
      }
    } catch (error) {
      toaster.error({
        title: "Error",
        description: error.message || "Failed to save script.",
      });
    }
  };

  return (
    <Box pb={20} pos={"relative"}>
      <VoiceAiHeader
        onSaveAsNewVersion={handleSubmit(handleSaveAsNewVersion)}
        isSaveLoading={isCloning}
      />
      <style>{`
        html {
            overflow: hidden;
        }
      `}</style>
      <form ref={formRef} onSubmit={handleSubmit(onSubmit)}>
        <VoiceAiUpload
          onUploadSuccess={handleUploadSuccess}
          agentId={agentId}
          versionId={targetVersion?.id}
          isOptimizing={isOptimizing}
        />
        <Box mb={4}>
          <Flex justify="space-between" align="center" mb={2}>
            <Text
              color="white"
              fontWeight="light"
              fontSize={{ base: "xs", "2xl": "sm", "3xl": "md" }}
              letterSpacing="wider"
            >
              Script
            </Text>
            <CustomButton
              size="xs"
              type="submit"
              loading={isUpdateLoading || isCreateLoading}
            >
              Save
            </CustomButton>
          </Flex>
          <Controller
            control={control}
            name="script"
            render={({ field }) => (
              <CustomTextArea
                placeholder="Enter your AI agent script here..."
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                h="calc(100vh - 350px)"
                overflowY="auto"
                bg="droidalBlack.300"
                borderRadius="12px"
                p={4}
              />
            )}
          />
        </Box>
      </form>

      {/* AI Chat Input Section */}
      <Flex
        position="absolute"
        bottom="20px"
        left="50%"
        transform="translateX(-50%)"
        w={{ base: "90%", "2xl": "70%" }}
        zIndex={10}
      >
        <HStack
          w="full"
          bg="droidalBlack.300"
          border="1px solid #2f4d78"
          borderRadius="50px"
          px={4}
          py={2}
          boxShadow="0 4px 12px rgba(0,0,0,0.5)"
          spacing={2}
        >
          <Box
            as="button"
            onClick={toggleMic}
            cursor="pointer"
            color={isListening ? "red.500" : "white"}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </Box>
          <CustomInput
            variant="unstyled"
            placeholder="Optimize script instruction..."
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleOptimizeScript();
            }}
            _placeholder={{ color: "gray.500" }}
            color="white"
            size="xl"
          />
          <Box
            as="button"
            onClick={handleOptimizeScript}
            cursor="pointer"
            color="white"
            disabled={isOptimizing}
          >
            {isOptimizing ? <Text fontSize="xs">...</Text> : <Send size={20} />}
          </Box>
        </HStack>
      </Flex>
    </Box>
  );
};

export default VoiceAIPage;

import { useEffect, useRef, useState } from "react";
import { Box, Text, VStack, HStack, Icon, Input } from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import { Upload, FileText, X } from "lucide-react";
import { toaster } from "@/components/ui/toaster";
import { useAnalyzeAgentFiles } from "@/hooks/mutation/useAnalyzeAgentFiles";
import Lottie from "lottie-react";
import animationData from "@/assets/lottie/ai-loader.json";
import DroidalOnlineGif from "@/assets/gif/online.gif";
import DroidalLogo4 from "@/assets/logo/logo4.svg";

const VoiceAiUpload = ({
  onUploadSuccess,
  agentId,
  versionId,
  isOptimizing,
}) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  const lottieRef = useRef(null);
  const { mutateAsync: analyzeFiles, isPending } = useAnalyzeAgentFiles();

  useEffect(() => {
    if (lottieRef.current) {
      if (isPending) {
        lottieRef.current.play();
      }
    }
  }, [isPending]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);

    if (files.length + selectedFiles.length > 10) {
      toaster.error({
        title: "Limit Exceeded",
        description: "You can upload a maximum of 10 files.",
      });
      return;
    }

    const validExtensions = [".txt", ".docx", ".pdf"];
    const validFiles = files.filter((file) => {
      const ext = file.name.toLowerCase().slice(file.name.lastIndexOf("."));
      return validExtensions.includes(ext);
    });

    if (validFiles.length !== files.length) {
      toaster.error({
        title: "Invalid File Type",
        description: "Only .txt, .docx, and .pdf files are allowed.",
      });
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    // Reset input so same file can be selected again if cleared
    e.target.value = "";
  };

  const handleRemoveFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAnalyze = async () => {
    if (selectedFiles.length === 0) return;

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });
    if (agentId) formData.append("agent_id", agentId);
    if (versionId) formData.append("version_id", versionId);

    try {
      const response = await analyzeFiles(formData);
      if (response && response.data) {
        onUploadSuccess(response.data);
        toaster.success({
          title: "Analysis Complete",
          description: "Agent Instruction has been auto-filled.",
        });
        setSelectedFiles([]);
      } else {
        toaster.error({
          title: "Analysis Failed",
          description: "Failed to analyze files.",
        });
      }
    } catch (error) {
      console.error("File analysis error:", error);
      toaster.error({
        title: "Error",
        description: "An error occurred during file analysis.",
      });
    }
  };

  return (
    <Box
      bg="droidalBlack.300"
      border="1px solid rgba(255,255,255,0.06)"
      rounded="12px"
      p={4}
      mb={4}
      pos="relative"
    >
      <VStack align="stretch" spacing={3}>
        <HStack justify="space-between">
          <Text fontWeight="bold" color="white" letterSpacing="wider">
            Call script assistance
          </Text>
          <Box w="120px" h="120px" pos="absolute" top="2" right="10">
            {isPending || isOptimizing ? (
              <img
                src={DroidalOnlineGif}
                width={"100px"}
                className="rounded-full"
                alt="MedXFlow loading"
              />
            ) : (
              <img
                src={DroidalLogo4}
                width={"110px"}
                className="rounded-full"
                alt="MedXFlow logo"
              />
            )}
          </Box>
        </HStack>

        <Text fontSize="sm" color="gray.400">
          Upload documents (PDF, DOCX, TXT) to automatically generate the call
          script. (Max 10 files)
        </Text>

        <HStack spacing={4}>
          <Input
            type="file"
            multiple
            display="none"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".txt,.docx,.pdf"
          />
          <CustomButton
            size="sm"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            leftIcon={<Upload size={16} />}
          >
            Upload Script
          </CustomButton>

          {selectedFiles.length > 0 && (
            <CustomButton size="sm" onClick={handleAnalyze} loading={isPending}>
              Analyze & Auto-Fill
            </CustomButton>
          )}
        </HStack>

        {selectedFiles.length > 0 && (
          <Box mt={2}>
            <Text fontSize="xs" color="gray.500" mb={2}>
              Selected Files ({selectedFiles.length}):
            </Text>
            <HStack wrap="wrap" spacing={2}>
              {selectedFiles.map((file, index) => (
                <HStack
                  key={index}
                  bg="rgba(255,255,255,0.1)"
                  px={2}
                  py={1}
                  rounded="md"
                  spacing={2}
                >
                  <Icon as={FileText} size={14} color="gray.300" />
                  <Text fontSize="xs" color="white" noOfLines={1} maxW="150px">
                    {file.name}
                  </Text>
                  <Icon
                    as={X}
                    size={14}
                    color="red.300"
                    cursor="pointer"
                    onClick={() => handleRemoveFile(index)}
                  />
                </HStack>
              ))}
            </HStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default VoiceAiUpload;

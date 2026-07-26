import React, { useState, useEffect } from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Grid,
  GridItem,
  IconButton,
  Spinner,
  Flex,
} from "@chakra-ui/react";
import { Plus, Copy, Trash2, Check, Save } from "lucide-react";
import CustomInput from "@/components/input/input";
import CustomButton from "@/components/button/button";
import { useParams, useSearchParams } from "react-router-dom";
import { atobAgentId } from "@/utils/helper";
import { useGetConfigJson } from "@/hooks/query/voiceai/useGetConfigJson";
import {
  useCreateConfigJson,
  useUpdateConfigJson,
} from "@/hooks/mutation/voiceai/useSaveConfigJson";
import { toaster } from "@/components/ui/toaster";
import VoiceAiHeader from "./components/voice-ai-header";
import { useGetAgentVersionsByApp } from "@/hooks/query/useGetAgentVersionsByApp";
import { useAuth } from "@/store/providers/auth-provider";

const OutputJson = () => {
  const { agent_app } = useParams();
  const { user } = useAuth();
  const agentId = agent_app ? atobAgentId(agent_app) : null;
  const [searchParams] = useSearchParams();
  const versionParam = searchParams.get("version");

  const { data: versionsByAppDataRes } = useGetAgentVersionsByApp(agentId);
  const versionData = versionsByAppDataRes?.find(
    (version) => version.version_number === versionParam,
  );
  console.log("versionData", versionData, versionsByAppDataRes);

  const [prompts, setPrompts] = useState([{ key: "", prompt: "" }]);
  const [copied1, setCopied1] = useState(false);
  const [configId, setConfigId] = useState(null);

  const { data: configData, isLoading } = useGetConfigJson({
    agent_version_id: versionData?.id,
  });
  const { mutate: createConfig, isPending: isCreating } = useCreateConfigJson();
  const { mutate: updateConfig, isPending: isUpdating } = useUpdateConfigJson();

  useEffect(() => {
    if (configData) {
      // Assuming configData is the object { id, app, config_data, ... }
      // Or it might be a list if the API returns a list, but based on the hook it's likely a single object or empty
      const data = Array.isArray(configData) ? configData[0] : configData;
      if (data && data.config_data) {
        setConfigId(data.id);
        const formattedPrompts = Object.entries(data.config_data).map(
          ([key, prompt]) => ({
            key,
            prompt,
          }),
        );
        if (formattedPrompts.length > 0) {
          setPrompts(formattedPrompts);
        }
      }
    }
  }, [configData]);

  const handleAddPrompt = () => {
    setPrompts([...prompts, { key: "", prompt: "" }]);
  };

  const handleRemovePrompt = (index) => {
    if (prompts.length > 1) {
      setPrompts(prompts.filter((_, i) => i !== index));
    }
  };

  const handleInputChange = (index, field, value) => {
    const updatedPrompts = [...prompts];
    updatedPrompts[index][field] = value;
    setPrompts(updatedPrompts);
  };

  const isDuplicateKey = (key, index) => {
    if (!key) return false;
    return prompts.some(
      (item, i) => i !== index && item.key.trim() === key.trim(),
    );
  };

  const jsonOutput = JSON.stringify(
    prompts.reduce((acc, curr) => {
      if (curr.key) acc[curr.key] = curr.prompt;
      return acc;
    }, {}),
    null,
    2,
  );

  const handleSave = () => {
    if (!versionParam) {
      toaster.error({
        title: "Error",
        description:
          "No configuration found. Please go to the Configurations page and create one first.",
      });
      return;
    }
    const hasDuplicate = prompts.some((item, index) =>
      isDuplicateKey(item.key, index),
    );
    if (hasDuplicate) {
      toaster.error({
        title: "Validation Error",
        description: "Duplicate keys found",
      });
      return;
    }

    const configObject = prompts.reduce((acc, curr) => {
      if (curr.key.trim()) acc[curr.key.trim()] = curr.prompt;
      return acc;
    }, {});

    const payload = {
      // client: user.client,
      app: agentId,
      config_data: configObject,
      agent_version_id: versionData?.id,
    };

    if (configId) {
      updateConfig(
        { id: configId, client: user.client, ...payload },
        {
          onSuccess: () => {
            toaster.success({
              title: "Success",
              description: "Config updated successfully",
            });
          },
          onError: (err) => {
            toaster.error({
              title: "Error",
              description: err.message || "Failed to update config",
            });
          },
        },
      );
    } else {
      createConfig(payload, {
        onSuccess: (data) => {
          setConfigId(data.id);
          toaster.success({
            title: "Success",
            description: "Config created successfully",
          });
        },
        onError: (err) => {
          toaster.error({
            title: "Error",
            description: err.message || "Failed to create config",
          });
        },
      });
    }
  };

  return (
    <Flex h={"full"} flexDirection={"column"}>
      <VoiceAiHeader />
      <Box
        p={6}
        borderRadius={"xl"}
        flex={"0.99"}
        className="bg-[#1e1e1e] text-white"
        overflow="hidden"
      >
        <Grid
          templateColumns="repeat(2, 1fr)"
          gap={6}
          h="100%"
          overflow="hidden"
        >
          {/* Left Side: Extraction Prompts */}
          <GridItem h="100%" overflow="hidden">
            <Box
              className="bg-droidal-black-300"
              p={6}
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              h="100%"
              maxH="100%"
              display="flex"
              flexDirection="column"
              overflow="hidden"
            >
              <HStack justify="space-between" mb={6}>
                <Text fontSize="lg" fontWeight="normal" letterSpacing="wide">
                  Extraction Prompts
                </Text>
              </HStack>

              {isLoading ? (
                <Box
                  flex={1}
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Spinner size="md" color="white" />
                </Box>
              ) : (
                <VStack
                  spacing={6}
                  align="stretch"
                  overflowY="auto"
                  flex={1}
                  pr={2}
                  css={{
                    "&::-webkit-scrollbar": { width: "4px" },
                    "&::-webkit-scrollbar-track": { background: "transparent" },
                    "&::-webkit-scrollbar-thumb": {
                      background: "rgba(255, 255, 255, 0.1)",
                      borderRadius: "24px",
                    },
                  }}
                >
                  {prompts.map((item, index) => {
                    const duplicate = isDuplicateKey(item.key, index);
                    return (
                      <HStack key={index} align="flex-start" spacing={4}>
                        <Box flex={1}>
                          <CustomInput
                            label={index === 0 ? "Key" : ""}
                            value={item.key}
                            placeholder="Enter Key"
                            invalid={duplicate}
                            showError={duplicate}
                            errorMessage={
                              duplicate ? "Duplicate key found" : ""
                            }
                            onChange={(e) =>
                              handleInputChange(index, "key", e.target.value)
                            }
                          />
                        </Box>
                        <Box flex={2}>
                          <CustomInput
                            label={index === 0 ? "Prompts" : ""}
                            value={item.prompt}
                            placeholder="Enter Prompt"
                            onChange={(e) =>
                              handleInputChange(index, "prompt", e.target.value)
                            }
                          />
                          {/* Empty box to match the height of the error text in the Key field */}
                          {duplicate && <Box h="18px" mt={2} />}
                        </Box>
                        <Box pt={index === 0 ? "30px" : "10px"}>
                          {prompts.length > 1 && (
                            <IconButton
                              aria-label="Remove prompt"
                              size="sm"
                              variant="ghost"
                              color="red.400"
                              _hover={{ bg: "whiteAlpha.100" }}
                              onClick={() => handleRemovePrompt(index)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          )}
                        </Box>
                      </HStack>
                    );
                  })}
                </VStack>
              )}

              <HStack spacing={3} mt={6} justify="flex-end">
                <CustomButton
                  size="sm"
                  onClick={handleAddPrompt}
                  leftIcon={<Plus size={16} />}
                >
                  Add
                </CustomButton>
                <CustomButton
                  size="sm"
                  variant="outline"
                  leftIcon={<Save size={16} />}
                  loading={isCreating || isUpdating}
                  onClick={handleSave}
                >
                  Save
                </CustomButton>
              </HStack>
            </Box>
          </GridItem>

          {/* Right Side: Preview and JSON Output */}
          <GridItem h="100%" overflow="hidden">
            {/* Combined Preview Card */}
            <Box
              className="bg-droidal-black-300"
              p={6}
              borderRadius="xl"
              border="1px solid"
              borderColor="whiteAlpha.200"
              h="100%"
              maxH="100%"
              display="flex"
              flexDirection="column"
              overflow="hidden"
            >
              <HStack justify="space-between" mb={6}>
                <Text fontSize="lg" fontWeight="normal" letterSpacing="wide">
                  Preview{" "}
                </Text>
                <CustomButton
                  size="sm"
                  variant={copied1 ? "solid" : "outline"}
                  onClick={() => {
                    navigator.clipboard.writeText(jsonOutput);
                    setCopied1(true);
                    setTimeout(() => setCopied1(false), 2000);
                  }}
                  leftIcon={copied1 ? <Check size={16} /> : <Copy size={16} />}
                >
                  {copied1 ? "Copied" : "Copy"}
                </CustomButton>
              </HStack>

              <Box
                bg="black"
                p={4}
                borderRadius="md"
                fontFamily="monospace"
                fontSize="sm"
                color="green.400"
                flex={1}
                overflow="auto"
                border="1px solid"
                borderColor="whiteAlpha.100"
                css={{
                  "&::-webkit-scrollbar": { width: "4px" },
                  "&::-webkit-scrollbar-track": { background: "transparent" },
                  "&::-webkit-scrollbar-thumb": {
                    background: "rgba(255, 255, 255, 0.1)",
                    borderRadius: "24px",
                  },
                }}
              >
                <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
                  {jsonOutput}
                </pre>
              </Box>
            </Box>
          </GridItem>
        </Grid>
      </Box>
    </Flex>
  );
};

export default OutputJson;

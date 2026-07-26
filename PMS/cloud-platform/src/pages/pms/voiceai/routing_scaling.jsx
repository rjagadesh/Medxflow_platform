import { useMemo, useState } from "react";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import {
  HStack,
  IconButton,
  Input,
  Text,
  VStack,
  Box,
  Flex,
  Grid,
  Checkbox,
  RadioGroup,
  Stack,
  GridItem,
  SimpleGrid,
  InputGroup,
  Image,
} from "@chakra-ui/react";
import { Phone, Plus, X, Minus } from "lucide-react";
import VoiceAiHeader from "@/pages/voice-ai/components/voice-ai-header";

const EMPTY_FUNCTION = { endpoint: "", functionName: "", key: "", headers: [] };

function Section({ title, children, ...props }) {
  return (
    <Box
      bg="droidalBlack.300"
      borderColor="#2f4d78"
      borderWidth="1px"
      rounded="lg"
      p={3}
      {...props}
    >
      {title && (
        <Text
          fontSize="xs"
          fontWeight="semibold"
          mb={3}
          color="whiteAlpha.800"
          textTransform="uppercase"
          letterSpacing="widest"
        >
          {title}
        </Text>
      )}
      {children}
    </Box>
  );
}

const normalizeFunction = (fn) => ({
  endpoint: fn?.endpoint || "",
  functionName: fn?.functionName || "",
  key: fn?.key || "",
  headers: Array.isArray(fn?.headers) ? fn.headers : [],
});

const normalizeLifecycle = (value) => ({
  retryAttempts:
    value?.retryAttempts === ""
      ? ""
      : Number.isFinite(Number(value?.retryAttempts))
        ? Number(value.retryAttempts)
        : 3,
  retryDelay:
    value?.retryDelay === ""
      ? ""
      : Number.isFinite(Number(value?.retryDelay))
        ? Number(value.retryDelay)
        : 5,
  forwardKeys: { default: [], ...(value?.forwardKeys || {}) },
  endCallKeys: { default: [], ...(value?.endCallKeys || {}) },
  forwardTo: value?.forwardTo || "Phone Number",
  phoneNumbers: Array.isArray(value?.phoneNumbers) ? value.phoneNumbers : [],
  continueRecording: !!value?.continueRecording,
  apiKeys: Array.isArray(value?.apiKeys) ? value.apiKeys : [],
  uniDirectionalFunctions: Array.isArray(value?.uniDirectionalFunctions)
    ? value.uniDirectionalFunctions.map(normalizeFunction)
    : [{ ...EMPTY_FUNCTION }],
  biDirectionalFunctions: Array.isArray(value?.biDirectionalFunctions)
    ? value.biDirectionalFunctions.map(normalizeFunction)
    : [{ ...EMPTY_FUNCTION }],
  withSystem: !!value?.withSystem,
  withApi: !!value?.withApi,
});

export function RoutingLifecycleSections({
  value,
  errors = {},
  onChange,
  showTriggerRetry = false,
  hideLLMAndRetry = false,
  showBaseSection = true,
  showFunctionPanels = true,
}) {
  const [showApiKeys, setShowApiKeys] = useState(true);

  const normalized = useMemo(() => normalizeLifecycle(value), [value]);
  const showFunctionSections = normalized.withSystem;

  const update = (patch) => {
    onChange?.({
      ...normalized,
      ...patch,
    });
  };

  const updateFunctionList = (key, nextList) => {
    update({
      [key]:
        nextList.length > 0
          ? nextList
          : [
              {
                ...EMPTY_FUNCTION,
              },
            ],
    });
  };

  const updateFunction = (key, index, field, fieldValue) => {
    updateFunctionList(
      key,
      (normalized[key] || []).map((item, i) =>
        i === index ? { ...item, [field]: fieldValue } : item,
      ),
    );
  };

  const addForwardKey = () => {
    update({
      forwardKeys: {
        ...normalized.forwardKeys,
        default: [...(normalized.forwardKeys.default || []), ""],
      },
    });
  };

  const removeForwardKey = (index) => {
    update({
      forwardKeys: {
        ...normalized.forwardKeys,
        default: (normalized.forwardKeys.default || []).filter(
          (_, i) => i !== index,
        ),
      },
    });
  };

  const updateForwardKey = (index, fieldValue) => {
    const keys = [...(normalized.forwardKeys.default || [])];
    keys[index] = fieldValue;
    update({
      forwardKeys: {
        ...normalized.forwardKeys,
        default: keys,
      },
    });
  };

  const addEndCallKey = () => {
    update({
      endCallKeys: {
        ...normalized.endCallKeys,
        default: [...(normalized.endCallKeys.default || []), ""],
      },
    });
  };

  const removeEndCallKey = (index) => {
    update({
      endCallKeys: {
        ...normalized.endCallKeys,
        default: (normalized.endCallKeys.default || []).filter(
          (_, i) => i !== index,
        ),
      },
    });
  };

  const updateEndCallKey = (index, fieldValue) => {
    const keys = [...(normalized.endCallKeys.default || [])];
    keys[index] = fieldValue;
    update({
      endCallKeys: {
        ...normalized.endCallKeys,
        default: keys,
      },
    });
  };

  const addApiKey = () => {
    update({
      apiKeys: [
        ...normalized.apiKeys,
        {
          value: "",
          enabled: true,
          isNew: true,
        },
      ],
    });
  };

  const removeApiKey = (index) => {
    update({
      apiKeys: normalized.apiKeys.filter((_, i) => i !== index),
    });
  };

  const updateApiKey = (index, patch) => {
    update({
      apiKeys: normalized.apiKeys.map((item, i) =>
        i === index ? { ...item, ...patch } : item,
      ),
    });
  };

  // Header helpers
  const addHeader = (listKey, funcIndex) => {
    const list = normalized[listKey] || [];
    const updatedList = list.map((item, i) =>
      i === funcIndex
        ? {
            ...item,
            headers: [...(item.headers || []), { key: "", value: "" }],
          }
        : item,
    );
    updateFunctionList(listKey, updatedList);
  };

  const removeHeader = (listKey, funcIndex, headerIndex) => {
    const list = normalized[listKey] || [];
    const updatedList = list.map((item, i) =>
      i === funcIndex
        ? {
            ...item,
            headers: (item.headers || []).filter((_, hi) => hi !== headerIndex),
          }
        : item,
    );
    updateFunctionList(listKey, updatedList);
  };

  const updateHeader = (listKey, funcIndex, headerIndex, field, fieldValue) => {
    const list = normalized[listKey] || [];
    const updatedList = list.map((item, i) => {
      if (i !== funcIndex) return item;
      const updatedHeaders = (item.headers || []).map((h, hi) =>
        hi === headerIndex ? { ...h, [field]: fieldValue } : h,
      );
      return { ...item, headers: updatedHeaders };
    });
    updateFunctionList(listKey, updatedList);
  };

  const renderFunctionSection = (title, listKey, prefix) => {
    const list = normalized[listKey] || [];
    return (
      <Section title={title}>
        <VStack align="stretch" gap={4}>
          {list.map((func, funcIndex) => (
            <Box
              key={`${prefix}-${funcIndex}`}
              p={3}
              bg="droidalBlack.300"
              rounded="md"
              border="1px solid"
              borderColor="#2f4d78"
            >
              <VStack align="stretch" gap={3}>
                <Flex justify="space-between" align="center" gap={4}>
                  <HStack gap={2} flex="1">
                    <Text
                      fontSize="md"
                      fontWeight="normal"
                      color="white"
                      letterSpacing="widest"
                      whiteSpace="nowrap"
                    >
                      Function #{funcIndex + 1}
                    </Text>
                    <CustomInput
                      placeholder="Function name"
                      value={func.functionName || ""}
                      onChange={(e) =>
                        updateFunction(
                          listKey,
                          funcIndex,
                          "functionName",
                          e.target.value,
                        )
                      }
                      size="xs"
                      w="200px"
                    />
                  </HStack>
                </Flex>

                <HStack gap={4} align="flex-end">
                  <Box flex="1">
                    <CustomInput
                      label="Endpoint URL"
                      value={func.endpoint || ""}
                      onChange={(e) =>
                        updateFunction(
                          listKey,
                          funcIndex,
                          "endpoint",
                          e.target.value,
                        )
                      }
                      size="xs"
                      labelProps={{
                        fontSize: "xs",
                        letterSpacing: "widest",
                        color: "white",
                        fontWeight: "light",
                      }}
                      invalid={!!errors[`${prefix}_${funcIndex}_endpoint`]}
                      showError={!!errors[`${prefix}_${funcIndex}_endpoint`]}
                      errorMessage={errors[`${prefix}_${funcIndex}_endpoint`]}
                    />
                  </Box>
                  <Box flex="1">
                    <CustomInput
                      label="Key"
                      value={func.key || ""}
                      onChange={(e) =>
                        updateFunction(
                          listKey,
                          funcIndex,
                          "key",
                          e.target.value,
                        )
                      }
                      size="xs"
                      labelProps={{
                        fontSize: "xs",
                        letterSpacing: "widest",
                        color: "white",
                        fontWeight: "light",
                      }}
                      invalid={!!errors[`${prefix}_${funcIndex}_key`]}
                      showError={!!errors[`${prefix}_${funcIndex}_key`]}
                      errorMessage={errors[`${prefix}_${funcIndex}_key`]}
                    />
                  </Box>
                </HStack>

                {/* Headers Section */}
                <Box>
                  <Text
                    fontSize="xs"
                    color="white"
                    letterSpacing="widest"
                    fontWeight="light"
                    mb={2}
                  >
                    Headers
                  </Text>
                  <VStack align="stretch" gap={2}>
                    {(func.headers || []).map((header, headerIndex) => (
                      <HStack
                        key={`${prefix}-${funcIndex}-header-${headerIndex}`}
                        gap={1}
                      >
                        <CustomInput
                          size="xs"
                          placeholder="Eg: Authorization"
                          value={header.key || ""}
                          onChange={(e) =>
                            updateHeader(
                              listKey,
                              funcIndex,
                              headerIndex,
                              "key",
                              e.target.value,
                            )
                          }
                          bg="blackAlpha.200"
                          borderColor="#2f4d78"
                          _focus={{ borderColor: "blue.500" }}
                        />
                        <Input
                          size="xs"
                          placeholder="Eg: Bearer token"
                          value={header.value || ""}
                          onChange={(e) =>
                            updateHeader(
                              listKey,
                              funcIndex,
                              headerIndex,
                              "value",
                              e.target.value,
                            )
                          }
                          bg="blackAlpha.200"
                          borderColor="#2f4d78"
                          _focus={{ borderColor: "blue.500" }}
                        />
                        <IconButton
                          size="xs"
                          onClick={() =>
                            removeHeader(listKey, funcIndex, headerIndex)
                          }
                          aria-label="Remove header"
                          variant="ghost"
                          color="#2f4d78"
                          border="1px solid #2f4d78"
                          borderRadius="4px"
                          _hover={{ bg: "transparent", color: "red.400" }}
                        >
                          <X size={12} />
                        </IconButton>
                        <IconButton
                          size="xs"
                          onClick={() => addHeader(listKey, funcIndex)}
                          aria-label="Add header"
                          variant="ghost"
                          color="#2f4d78"
                          border="1px solid #2f4d78"
                          borderRadius="4px"
                          _hover={{ bg: "transparent", color: "white" }}
                        >
                          <Plus size={12} />
                        </IconButton>
                      </HStack>
                    ))}
                    {(func.headers || []).length === 0 && (
                      <IconButton
                        size="xs"
                        onClick={() => addHeader(listKey, funcIndex)}
                        aria-label="Add header"
                        variant="ghost"
                        color="#2f4d78"
                        border="1px solid #2f4d78"
                        borderRadius="4px"
                        w="fit-content"
                        _hover={{ bg: "transparent", color: "white" }}
                      >
                        <Plus size={12} />
                      </IconButton>
                    )}
                  </VStack>
                </Box>
              </VStack>
            </Box>
          ))}
        </VStack>
      </Section>
    );
  };

  return (
    <VStack align="stretch" gap={4}>
      {showBaseSection && (
        <Section>
          <VStack align="stretch" gap={4}>
            <Grid templateColumns={"1fr"} gap={4}>
              <GridItem colSpan={2}>
                <Text
                  fontSize="xs"
                  fontWeight="semibold"
                  mb={3}
                  color="whiteAlpha.800"
                  textTransform="uppercase"
                  letterSpacing="widest"
                >
                  Call Forwarding & End Messages{" "}
                </Text>
                <SimpleGrid columns={2} gap={2}>
                  <Box>
                    <Text
                      fontSize="xs"
                      color="white"
                      letterSpacing="widest"
                      fontWeight="light"
                      mb={2}
                    >
                      Forward Messages
                    </Text>
                    <VStack align="stretch" gap={2}>
                      {(normalized.forwardKeys.default &&
                      normalized.forwardKeys.default.length > 0
                        ? normalized.forwardKeys.default
                        : [""]
                      ).map((keyVal, idx) => (
                        <HStack key={`forward-${idx}`} gap={1}>
                          <Input
                            size="xs"
                            placeholder="Key (e.g. 0)"
                            value={keyVal}
                            onChange={(e) =>
                              updateForwardKey(idx, e.target.value)
                            }
                            bg="blackAlpha.200"
                            borderColor="#2f4d78"
                            _focus={{ borderColor: "blue.500" }}
                          />
                          <IconButton
                            size="xs"
                            onClick={() => removeForwardKey(idx)}
                            aria-label="Remove key"
                            disabled={
                              (normalized.forwardKeys.default || []).length <= 1
                            }
                            variant="ghost"
                            color="#2f4d78"
                            border="1px solid #2f4d78"
                            borderRadius="4px"
                            _hover={{ bg: "transparent", color: "white" }}
                          >
                            <Minus size={14} />
                          </IconButton>
                          <IconButton
                            size="xs"
                            onClick={addForwardKey}
                            aria-label="Add key"
                            variant="ghost"
                            color="#2f4d78"
                            border="1px solid #2f4d78"
                            borderRadius="4px"
                            _hover={{ bg: "transparent", color: "white" }}
                          >
                            <Plus size={14} />
                          </IconButton>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>

                  <Box>
                    <Text
                      fontSize="xs"
                      color="white"
                      letterSpacing="widest"
                      fontWeight="light"
                      mb={2}
                    >
                      End Call Messages
                    </Text>
                    <VStack align="stretch" gap={2}>
                      {(normalized.endCallKeys.default &&
                      normalized.endCallKeys.default.length > 0
                        ? normalized.endCallKeys.default
                        : [""]
                      ).map((keyVal, idx) => (
                        <HStack key={`end-call-${idx}`} gap={1}>
                          <Input
                            size="xs"
                            placeholder="Key (e.g. 0)"
                            value={keyVal}
                            onChange={(e) =>
                              updateEndCallKey(idx, e.target.value)
                            }
                            bg="blackAlpha.200"
                            borderColor="#2f4d78"
                            _focus={{ borderColor: "blue.500" }}
                          />
                          <IconButton
                            size="xs"
                            onClick={() => removeEndCallKey(idx)}
                            aria-label="Remove key"
                            disabled={
                              (normalized.endCallKeys.default || []).length <= 1
                            }
                            variant="ghost"
                            color="#2f4d78"
                            border="1px solid #2f4d78"
                            borderRadius="4px"
                            _hover={{ bg: "transparent", color: "white" }}
                          >
                            <Minus size={14} />
                          </IconButton>
                          <IconButton
                            size="xs"
                            onClick={addEndCallKey}
                            aria-label="Add key"
                            variant="ghost"
                            color="#2f4d78"
                            border="1px solid #2f4d78"
                            borderRadius="4px"
                            _hover={{ bg: "transparent", color: "white" }}
                          >
                            <Plus size={14} />
                          </IconButton>
                        </HStack>
                      ))}
                    </VStack>
                  </Box>
                </SimpleGrid>
                <SimpleGrid columns={hideLLMAndRetry ? 2 : 1} gap={4} mt={2}>
                  <VStack align="stretch">
                    <Text
                      fontSize="xs"
                      w="full"
                      textAlign={"left"}
                      color="white"
                      letterSpacing="widest"
                      my={0}
                      fontWeight={"normal"}
                    >
                      Forward To:
                    </Text>

                    <Box w="full">
                      <InputGroup
                        startElement={
                          <Image
                            src="https://flagcdn.com/w40/us.png"
                            alt="US flag"
                            w="25px"
                            height={"25px"}
                            h="auto"
                            position={"relative"}
                            left={"-8px"}
                            borderRadius={"full"}
                          />
                        }
                      >
                        <CustomInput
                          size="xs"
                          placeholder="Enter phone number"
                          value={normalized.phoneNumbers[0] || ""}
                          onChange={(e) =>
                            update({
                              phoneNumbers: [e.target.value],
                            })
                          }
                          borderColor="#2f4d78"
                          labelProps={{
                            fontSize: "xs",
                          }}
                          _focus={{ borderColor: "blue.500" }}
                        />
                      </InputGroup>
                    </Box>
                  </VStack>

                  {hideLLMAndRetry && (
                    <Box>
                      <VStack align="stretch" gap={3}>
                        <HStack gap={4}>
                          <CustomInput
                            label="Retry"
                            type="number"
                            value={normalized.retryAttempts}
                            onChange={(e) =>
                              update({
                                retryAttempts:
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                              })
                            }
                            w="full"
                            size="xs"
                            labelProps={{
                              fontSize: "xs",
                              letterSpacing: "widest",
                              color: "white",
                              fontWeight: "light",
                            }}
                          />
                          <CustomInput
                            label="Delay (min)"
                            type="number"
                            w="full"
                            value={normalized.retryDelay}
                            onChange={(e) =>
                              update({
                                retryDelay:
                                  e.target.value === ""
                                    ? ""
                                    : Number(e.target.value),
                              })
                            }
                            size="xs"
                            labelProps={{
                              fontSize: "xs",
                              letterSpacing: "widest",
                              color: "white",
                              fontWeight: "light",
                            }}
                          />
                        </HStack>
                        {(errors.retryAttempts || errors.retryDelay) && (
                          <Text
                            fontSize="xs"
                            color="red.400"
                            letterSpacing="widest"
                            fontWeight="light"
                          >
                            {errors.retryAttempts || errors.retryDelay}
                          </Text>
                        )}
                      </VStack>
                    </Box>
                  )}
                </SimpleGrid>
              </GridItem>
              {/* {!hideLLMAndRetry && (
                <GridItem>
                  <Box w="full">
                    <Text
                      fontSize="xs"
                      fontWeight="semibold"
                      mb={3}
                      color="whiteAlpha.800"
                      textTransform="uppercase"
                      letterSpacing="widest"
                    >
                      LLM API Keys{" "}
                    </Text>
                    <VStack align="stretch" gap={2}>
                      <Flex
                        justify="space-between"
                        align="center"
                        mb={1}
                        cursor="pointer"
                        onClick={() => setShowApiKeys((prev) => !prev)}
                      >
                        <Text
                          fontSize="xs"
                          color="white"
                          letterSpacing="widest"
                        >
                          Manage Keys ({normalized.apiKeys.length})
                        </Text>
                        <Text fontSize="xs" color="primary.300">
                          {showApiKeys ? "Hide" : "Show"}
                        </Text>
                      </Flex>

                      {showApiKeys && (
                        <VStack
                          align="stretch"
                          gap={2}
                          maxH="200px"
                          overflowY="auto"
                          pr={1}
                        >
                          {normalized.apiKeys.map((keyItem, index) => (
                            <HStack key={`api-${index}`} gap={1}>
                              <Checkbox.Root
                                size="sm"
                                checked={!!keyItem.enabled}
                                onCheckedChange={({ checked }) =>
                                  updateApiKey(index, { enabled: checked })
                                }
                              >
                                <Checkbox.HiddenInput />
                                <Checkbox.Control
                                  _checked={{
                                    bgImage:
                                      "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                                  }}
                                  borderColor="#2f4d78"
                                  bgColor="black"
                                />
                              </Checkbox.Root>
                              <Input
                                flex={1}
                                size="xs"
                                value={keyItem.value || ""}
                                onChange={(e) =>
                                  updateApiKey(index, { value: e.target.value })
                                }
                                disabled={!keyItem.isNew}
                                bg="blackAlpha.200"
                                borderColor="#2f4d78"
                                _focus={{ borderColor: "blue.500" }}
                              />
                              <IconButton
                                size="xs"
                                variant="ghost"
                                color="gray.400"
                                _hover={{ color: "red.400" }}
                                onClick={() => removeApiKey(index)}
                                aria-label="Remove key"
                              >
                                <X size={12} />
                              </IconButton>
                              <IconButton
                                size="xs"
                                variant="ghost"
                                color="gray.400"
                                _hover={{ color: "blue.300" }}
                                onClick={addApiKey}
                                aria-label="Add key"
                              >
                                <Plus size={12} />
                              </IconButton>
                            </HStack>
                          ))}
                        </VStack>
                      )}
                    </VStack>
                  </Box>
                  <Text
                    fontSize="xs"
                    fontWeight="semibold"
                    my={3}
                    color="whiteAlpha.800"
                    textTransform="uppercase"
                    letterSpacing="widest"
                  >
                    Retry Settings
                  </Text>
                  <Box w="full" mb={4}>
                    <VStack align="stretch" gap={3}>
                      <HStack gap={4}>
                        <CustomInput
                          label="Attempts"
                          type="number"
                          value={normalized.retryAttempts}
                          onChange={(e) =>
                            update({
                              retryAttempts:
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                            })
                          }
                          w="full"
                          size="xs"
                          labelProps={{
                            fontSize: "xs",
                            letterSpacing: "widest",
                            color: "white",
                            fontWeight: "light",
                          }}
                        />
                        <CustomInput
                          label="Delay (min)"
                          type="number"
                          w="full"
                          value={normalized.retryDelay}
                          onChange={(e) =>
                            update({
                              retryDelay:
                                e.target.value === ""
                                  ? ""
                                  : Number(e.target.value),
                            })
                          }
                          size="xs"
                          labelProps={{
                            fontSize: "xs",
                            letterSpacing: "widest",
                            color: "white",
                            fontWeight: "light",
                          }}
                        />
                      </HStack>
                      {(errors.retryAttempts || errors.retryDelay) && (
                        <Text
                          fontSize="xs"
                          color="red.400"
                          letterSpacing="widest"
                          fontWeight="light"
                        >
                          {errors.retryAttempts || errors.retryDelay}
                        </Text>
                      )}
                    </VStack>
                  </Box>
                </GridItem>
              )} */}
            </Grid>

            <Checkbox.Root
              size="sm"
              checked={normalized.continueRecording}
              onCheckedChange={({ checked }) =>
                update({
                  continueRecording: checked,
                })
              }
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control
                _checked={{
                  bgImage:
                    "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                }}
                borderColor="#2f4d78"
                bgColor="black"
              />
              <Checkbox.Label
                letterSpacing="wider"
                fontSize="xs"
                color="gray.300"
              >
                Continue Recording after forwarding
              </Checkbox.Label>
            </Checkbox.Root>
          </VStack>
        </Section>
      )}

      {showFunctionPanels && showFunctionSections && (
        <SimpleGrid w="full" columns={2} gap={4}>
          {renderFunctionSection(
            "API Input",
            "uniDirectionalFunctions",
            "uniDirectional",
          )}

          {renderFunctionSection(
            "API Output",
            "biDirectionalFunctions",
            "biDirectional",
          )}
        </SimpleGrid>
      )}
    </VStack>
  );
}

export default function RoutingAndAgentScale() {
  return (
    <Flex direction="column" h="full">
      <VoiceAiHeader />
      <Box
        h="calc(100% - 8px)"
        bg="#1e1e1e"
        color="white"
        rounded="2xl"
        display="flex"
        flexDirection="column"
        overflow="hidden"
        p={4}
      >
        <Box
          border="1px solid #2f4d78"
          rounded="lg"
          p={6}
          bg="droidalBlack.300"
          textAlign="center"
        >
          <Text fontSize="md" fontWeight="semibold" letterSpacing="wide" mb={2}>
            Routing and Scaling
          </Text>
          <Text fontSize="sm" color="gray.300" letterSpacing="wide">
            Settings have been moved to the Basics page.
          </Text>
        </Box>
      </Box>
    </Flex>
  );
}

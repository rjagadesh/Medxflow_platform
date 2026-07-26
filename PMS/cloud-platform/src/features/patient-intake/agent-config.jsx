import { useCallback, useMemo, useRef, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Grid,
  GridItem,
  Heading,
  HStack,
  Text,
  VStack,
  Spacer,
  Badge,
  Accordion,
  Span,
} from "@chakra-ui/react";
import CustomButton from "@/components/button/button";
import CustomSelect from "@/components/ui/select";
import CustomInput from "@/components/input/input";
import CustomTextArea from "@/components/textarea/textarea";
import { toaster } from "@/components/ui/toaster";
import { useForm, Controller } from "react-hook-form";

const MAX_FILES = 10;

function tryParseJSON(s) {
  try {
    return JSON.parse(s);
  } catch (e) {
    return null;
  }
}

const initialState = {
  agent_name: "",
  agent_description: "",
  role: "",
  few_shot: "",
  task: "",
  rules: "",
  context: "",
};

const AgentConfigForm = () => {
  const fileInputRef = useRef(null);
  const [accordionKey, setAccordionKey] = useState();
  const [attachments, setAttachments] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [activity, setActivity] = useState([]);
  const [output, setOutput] = useState(
    "No output yet. Run a test to see the agent response and attachments summary."
  );
  const [runCount, setRunCount] = useState(0);
  const [lastRun, setLastRun] = useState("never");
  const [previewIndex, setPreviewIndex] = useState(null);
  const [testInput, setTestInput] = useState(initialState.testInput);

  const {
    control,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      agent_name: initialState.agent_name,
      agent_description: initialState.agent_description,
      role: initialState.role,
      context: "",
      task: "",
      few_shot: initialState.few_shot,
      rules: "",
      concurrency: initialState.concurrency,
      timeout: initialState.timeout,
      envVars: initialState.envVars,
      triggerType: initialState.triggerType,
      notifyEmails: initialState.notifyEmails,
    },
  });

  const values = watch();

  const addActivity = useCallback((text) => {
    const t = new Date().toLocaleString();
    setActivity((prev) => [`[${t}] ${text}`, ...prev]);
  }, []);

  const configObject = useMemo(() => {
    return {
      agent_name: (values.agent_name || "").trim() || "",
      agent_description: (values.agent_description || "").trim(),
      role: values.role || "",
      few_shot: (values.few_shot || "").trim(),
      task: (values.task || "").trim(),
      rules: (values.rules || "").trim(),
      context: (values.context || "").trim(),
    };
  }, [values]);

  const configPreview = useMemo(
    () => JSON.stringify(configObject, null, 2),
    [configObject]
  );

  const resetAll = () => {
    reset({
      agent_name: initialState.agent_name,
      agent_description: initialState.agent_description,
      role: initialState.role,
      context: "",
      task: "",
      few_shot: initialState.few_shot,
      rules: "",
      concurrency: initialState.concurrency,
      timeout: initialState.timeout,
      envVars: initialState.envVars,
      triggerType: initialState.triggerType,
      notifyEmails: initialState.notifyEmails,
    });
    setAttachments([]);
    setActivity([]);
    setOutput(
      "No output yet. Run a test to see the agent response and attachments summary."
    );
    setRunCount(0);
    setLastRun("never");
    setPreviewIndex(null);
    setTestInput(initialState.testInput);
  };

  // Files
  const readFilePreview = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      const obj = { name: file.name, size: file.size, type: file.type, file };
      reader.onload = (ev) => {
        obj.preview = file.type.startsWith("image/")
          ? ev.target.result
          : file.type.startsWith("text/") ||
            /\.(txt|csv|json|log)$/i.test(file.name)
          ? String(ev.target.result).slice(0, 2000)
          : "";
        try {
          obj.url = URL.createObjectURL(file);
        } catch {}
        resolve(obj);
      };

      if (file.type.startsWith("image/")) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });

  const handleFiles = async (fileList) => {
    const room = Math.max(0, MAX_FILES - attachments.length);
    const files = Array.from(fileList).slice(0, room);
    const items = await Promise.all(files.map(readFilePreview));
    setAttachments((prev) => [...prev, ...items]);
  };

  const onDrop = async (e) => {
    e.preventDefault();
    setIsDragActive(false);
    await handleFiles(e.dataTransfer.files);
  };

  const runTest = async () => {
    const input = (testInput || "").trim();
    if (!input && attachments.length === 0) {
      toaster({
        status: "warning",
        description: "Provide input or an attachment",
      });
      return;
    }
    addActivity(
      `Test started — input length ${input.length}, attachments: ${attachments.length}`
    );
    setOutput("Processing... (attachments will be listed below)");

    await new Promise((res) => setTimeout(res, 600 + Math.random() * 800));

    const parsed = tryParseJSON(input);
    const attSummary = attachments.map((a) => ({
      name: a.name,
      size_kb: +(a.size / 1024).toFixed(1),
      type: a.type || "unknown",
    }));

    const response = {
      request: parsed || input,
      attachments: attSummary,
      response: {
        status: "success",
        message: "Agent processed input and attachments (simulated)",
        extracted: {
          summary: "Simulated extraction — replace with real agent logic",
          fields:
            parsed && typeof parsed === "object" ? Object.keys(parsed) : [],
        },
      },
      runtime_ms: (Math.random() * 200 + 50).toFixed(0),
    };

    setOutput(JSON.stringify(response, null, 2));
    addActivity("Test finished — status: success");
    setLastRun(new Date().toLocaleString());
    setRunCount((c) => c + 1);
  };

  const simulateDebugRun = () => {
    setOutput("Running debug checks...");
    setTimeout(() => {
      const sample = {
        status: "ok",
        checks: ["prompt length", "env present", "trigger set"],
        note: "This is a simulated debug — integrate real health checks via API.",
      };
      setOutput(JSON.stringify(sample, null, 2));
      addActivity("Debug finished — all checks OK");
    }, 900);
  };

  const items = [
    {
      label: "Basic Information",
      value: "1",
      render: () => {
        return (
          <VStack align="stretch" spacing={3}>
            <Box>
              <Controller
                control={control}
                name="agent_name"
                rules={{ required: "Agent name is required" }}
                render={({ field }) => (
                  <CustomInput
                    label="Agent Name"
                    placeholder="ClaimsProcessor v1 — required"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                  />
                )}
              />
              {errors.agent_name && (
                <Text color="red.300" fontSize="xs">
                  {errors.agent_name.message}
                </Text>
              )}
            </Box>

            <Box>
              <Controller
                control={control}
                name="agent_description"
                render={({ field }) => (
                  <CustomTextArea
                    label="Short Description"
                    placeholder="Describe agent purpose, input/output briefly"
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    minH="110px"
                  />
                )}
              />
            </Box>

            {/* <Text
              fontWeight="bold"
              letterSpacing={"wider"}
              color="white"
              fontSize={{
                base: "sm",
                "2xl": "md",
              }}
              my={2}
            >
              Role & Behavior
            </Text>

            <Box>
              <CustomTextArea
                label="Task Prompt / Few-Shot Examples"
                placeholder="Provide prompt or few-shot examples. Use JSON for structured data."
                value={form.fewShot}
                onChange={handleChange("fewShot")}
                minH="110px"
              />
            </Box>

            <Text
              fontWeight="bold"
              letterSpacing={"wider"}
              color="white"
              fontSize={{
                base: "sm",
                "2xl": "md",
              }}
              my={2}
            >
              Execution Settings
            </Text>

            <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap={3}>
              <Box>
                <CustomInput
                  label="Concurrency"
                  value={form.concurrency}
                  onChange={handleChange("concurrency")}
                />
              </Box>
              <Box>
                <CustomInput
                  label="Timeout (s)"
                  value={form.timeout}
                  onChange={handleChange("timeout")}
                />
              </Box>
            </Grid>

            <Box>
              <CustomTextArea
                label="Environment Variables (JSON)"
                value={form.envVars}
                onChange={handleChange("envVars")}
                minH="110px"
              />
            </Box>

            <Text
              fontWeight="bold"
              letterSpacing={"wider"}
              color="white"
              my={2}
              fontSize={{
                base: "sm",
                "2xl": "md",
              }}
            >
              Triggers & Notifications
            </Text>

            <Box>
              <Text fontSize="sm" color="gray.400" mb={1}>
                Trigger
              </Text>
              <CustomSelect
                options={[
                  { value: "manual", label: "Manual" },
                  { value: "http", label: "HTTP" },
                  { value: "schedule", label: "Schedule" },
                  { value: "queue", label: "Queue" },
                ]}
                value={form.triggerType}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, triggerType: v }))
                }
                placeholder="Select trigger"
                w="full"
                css={{
                  borderRadius: "4px",
                  "& button": {
                    borderColor: "#2f4d78",
                  },
                }}
              />
            </Box>

            <Box>
              <CustomInput
                label="Notification Email(s)"
                placeholder="ops-team@company.com, summary@droidal.com"
                value={form.notifyEmails}
                onChange={handleChange("notifyEmails")}
              />
            </Box>

            <Flex gap={2} justify="flex-end" pt={2}>
              <CustomButton
                variant="danger"
                size="sm"
                onClick={() => {
                  if (window.confirm("Discard changes?")) resetAll();
                }}
              >
                Cancel
              </CustomButton>
              <CustomButton
                variant="outline"
                size="sm"
                onClick={() => {
                  addActivity("Draft saved locally");
                }}
              >
                Save Draft
              </CustomButton>
              <CustomButton
                size="sm"
                onClick={() => {
                  addActivity("Save & Debug started");
                  simulateDebugRun();
                }}
              >
                Save & Debug
              </CustomButton>
            </Flex> */}
          </VStack>
        );
      },
    },
    {
      label: "Role",
      value: "2",
      render: () => {
        return (
          <Box>
            {/* <Text fontSize="sm" color="gray.400" mb={1}>
              Role
            </Text>
            <CustomSelect
              options={[
                { value: "assistant", label: "Assistant" },
                { value: "extractor", label: "Data Extractor" },
                { value: "scheduler", label: "Scheduler" },
                { value: "custom", label: "Custom" },
              ]}
              value={form.role}
              onValueChange={(v) => setForm((f) => ({ ...f, role: v }))}
              placeholder="Select role"
              w="full"
              css={{
                borderRadius: "4px",
                "& button": {
                  borderColor: "#2f4d78",
                },
              }}
            /> */}
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <CustomTextArea
                  label="Roles"
                  placeholder="Describe the agent's role in detail."
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  minH="110px"
                />
              )}
            />
          </Box>
        );
      },
    },
    {
      label: "Context",
      value: "3",
      render: () => {
        return (
          <Box>
            <Controller
              control={control}
              name="context"
              render={({ field }) => (
                <CustomTextArea
                  label="Context"
                  placeholder="Provide any relevant context for the agent."
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  minH="110px"
                />
              )}
            />
          </Box>
        );
      },
    },
    {
      label: "Task",
      value: "4",
      render: () => {
        return (
          <Box>
            <Controller
              control={control}
              name="task"
              render={({ field }) => (
                <CustomTextArea
                  label="Task Description"
                  placeholder="Describe the specific tasks the agent should perform."
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  minH="110px"
                />
              )}
            />
          </Box>
        );
      },
    },
    {
      label: "Few-shot",
      value: "5",
      render: () => {
        return (
          <Box>
            <Controller
              control={control}
              name="few_shot"
              render={({ field }) => (
                <CustomTextArea
                  label="Few-shot Examples"
                  placeholder="Provide few-shot examples to guide the agent's behavior."
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  minH="110px"
                />
              )}
            />
          </Box>
        );
      },
    },
    {
      label: "Rules",
      render: () => {
        return (
          <Box>
            <Controller
              control={control}
              name="rules"
              render={({ field }) => (
                <CustomTextArea
                  label="Rules"
                  placeholder="Provide any rules or constraints for the agent's behavior."
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  minH="110px"
                />
              )}
            />
          </Box>
        );
      },
    },
  ];

  return (
    <Box pb={6}>
      <style>
        <style>{`
        html {
            overflow: hidden;
        }
      `}</style>
      </style>
      <Grid templateColumns={{ base: "1fr", xl: "1fr 430px" }} gap={4}>
        <GridItem>
          <Accordion.Root multiple collapsible>
            {items.map((item, index) => (
              <Accordion.Item
                bgColor={"droidalBlack.300"}
                mb={2}
                key={index}
                value={item.value}
                px={{
                  base: 3,
                  "2xl": 4,
                  "3xl": 6,
                }}
                letterSpacing="widest"
                transition={"all .2s ease-in-out"}
                cursor="pointer"
                border={"1px solid #2f4d78"}
                _hover={{
                  outlineColor: "transparent",
                  border: "1px solid transparent",
                  bgClip: "padding-box, border-box",
                  backgroundOrigin: "padding-box, border-box",
                  backgroundImage:
                    "linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
                }}
                py={{
                  base: 1,
                }}
                borderRadius="12px"
              >
                <Accordion.ItemTrigger>
                  <Span flex="1" color={"white"}>
                    {item.label}
                  </Span>
                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody>{item.render()}</Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            ))}
          </Accordion.Root>
          <Flex gap={2} justify="flex-end" pt={2}>
            <CustomButton
              onClick={() => {
                // Handle save or create action
              }}
            >
              Save
            </CustomButton>
          </Flex>
          <Box
            mt={4}
            bg="droidalBlack.300"
            border="1px solid rgba(255,255,255,0.06)"
            rounded="12px"
            boxShadow="0 10px 30px rgba(2,6,23,0.6)"
            p={4}
            bgColor={"droidalBlack.300"}
          >
            <Text
              fontWeight="bold"
              letterSpacing={"wider"}
              color="white"
              mb={3}
              fontSize={{
                base: "sm",
                "2xl": "md",
              }}
            >
              Preview / Generated Configuration (JSON)
            </Text>
            <Box
              as="pre"
              fontFamily="mono"
              fontSize="sm"
              bg="droidalBlack.200"
              color="white"
              rounded="8px"
              p={3}
              h="220px"
              overflow="auto"
            >
              {configPreview}
            </Box>
          </Box>
        </GridItem>

        {/* Right: Testing Console */}
        <GridItem>
          <Box
            bg="droidalBlack.300"
            border="1px solid rgba(255,255,255,0.06)"
            rounded="12px"
            boxShadow="0 10px 30px rgba(2,6,23,0.6)"
            p={4}
          >
            <Text
              fontWeight="bold"
              letterSpacing={"wider"}
              color="white"
              mb={3}
              fontSize={{
                base: "sm",
                "2xl": "md",
              }}
            >
              Testing Console
            </Text>

            <Box>
              <CustomTextArea
                label="Test Input (JSON or plain text)"
                value={testInput}
                onChange={(e) => setTestInput(e.target.value)}
                minH="110px"
              />
            </Box>

            <Box mt={3}>
              <Text fontSize="sm" color="gray.400" mb={1}>
                Attachments (for input)
              </Text>
              <Box
                role="button"
                tabIndex={0}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={onDrop}
                border={"2px dashed"}
                borderColor={isDragActive ? "cyan.400" : "whiteAlpha.300"}
                bg={isDragActive ? "rgba(0,194,216,0.02)" : "transparent"}
                rounded="10px"
                p={3}
                textAlign="center"
                color="gray.400"
              >
                Drag & drop files here or click to select (images, pdf, txt,
                csv). Maximum 10 files.
              </Box>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                style={{ display: "none" }}
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />

              {/* Attachment list */}
              <VStack align="stretch" spacing={2} mt={3}>
                {attachments.map((f, idx) => (
                  <Flex
                    key={`${f.name}-${idx}`}
                    align="center"
                    justify="space-between"
                    bg="rgba(255,255,255,0.03)"
                    rounded="8px"
                    p={2}
                    gap={3}
                  >
                    <HStack spacing={3} align="center">
                      {/* Icon/thumbnail */}
                      {f.type?.startsWith("image/") ? (
                        <Box
                          as="img"
                          src={f.preview}
                          alt={f.name}
                          w="36px"
                          h="36px"
                          objectFit="cover"
                          rounded="6px"
                        />
                      ) : (
                        <Box
                          as="img"
                          alt={f.name}
                          w="36px"
                          h="36px"
                          rounded="6px"
                          src={`data:image/svg+xml;utf8,${encodeURIComponent(
                            `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36'><rect width='36' height='36' fill='#072234'/><text x='18' y='22' font-size='12' fill='#bfefff' text-anchor='middle'>${
                              f.name.split(".").pop()?.toUpperCase() || "FILE"
                            }</text></svg>`
                          )}`}
                        />
                      )}
                      <Box>
                        <Text fontSize="sm">{f.name}</Text>
                        <Text fontSize="xs" color="gray.400">
                          {(f.size / 1024).toFixed(1)} KB •{" "}
                          {f.type || "unknown"}
                        </Text>
                      </Box>
                    </HStack>

                    <HStack>
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => setPreviewIndex(idx)}
                      >
                        Preview
                      </Button>
                      <Button
                        variant="ghost"
                        colorPalette="red"
                        size="xs"
                        onClick={() =>
                          setAttachments((prev) =>
                            prev.filter((_, i) => i !== idx)
                          )
                        }
                      >
                        Remove
                      </Button>
                    </HStack>
                  </Flex>
                ))}
              </VStack>

              {/* Preview area below attachments */}
              {previewIndex !== null && attachments[previewIndex] && (
                <Box
                  mt={3}
                  bg="#021425"
                  p={3}
                  rounded="8px"
                  color="#cfeeff"
                  fontSize="sm"
                >
                  {attachments[previewIndex].type?.startsWith("image/") ? (
                    <HStack align="start" spacing={3}>
                      <Box
                        as="img"
                        src={attachments[previewIndex].preview}
                        maxH="200px"
                        maxW="220px"
                        rounded="6px"
                      />
                      <Box>
                        <Text fontWeight="semibold">
                          {attachments[previewIndex].name}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {(attachments[previewIndex].size / 1024).toFixed(1)}{" "}
                          KB
                        </Text>
                      </Box>
                    </HStack>
                  ) : /\.(txt|csv|json|log)$/i.test(
                      attachments[previewIndex].name || ""
                    ) || attachments[previewIndex].type === "text/plain" ? (
                    <Box>
                      <Text fontWeight="semibold">
                        {attachments[previewIndex].name}
                      </Text>
                      <Box
                        as="pre"
                        whiteSpace="pre-wrap"
                        mt={2}
                        bg="#01141b"
                        p={2}
                        rounded="6px"
                        h="160px"
                        overflow="auto"
                      >
                        {attachments[previewIndex].preview ||
                          "No preview available"}
                      </Box>
                    </Box>
                  ) : (
                    <Box>
                      <Text fontWeight="semibold">
                        {attachments[previewIndex].name}
                      </Text>
                      <Text mt={2}>
                        Cannot preview this file type. Use download to open
                        locally.
                      </Text>
                    </Box>
                  )}
                </Box>
              )}
            </Box>

            <Flex gap={2} mt={3} align="center">
              <HStack>
                <CustomButton size="sm" onClick={runTest}>
                  Run Test
                </CustomButton>
                <CustomButton
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setActivity([]);
                    addActivity("Activity log cleared");
                  }}
                >
                  Clear Log
                </CustomButton>
              </HStack>
              <Spacer />
              <Box textAlign="right">
                <Text className="muted" fontSize="sm" color="gray.400">
                  Last run: <b>{lastRun}</b>
                </Text>
                <Text className="muted" fontSize="sm" color="gray.400">
                  Tests performed: <b>{runCount}</b>
                </Text>
              </Box>
            </Flex>

            <Text
              fontWeight="bold"
              letterSpacing={"wider"}
              color="white"
              my={3}
              fontSize={{
                base: "sm",
                "2xl": "md",
              }}
            >
              Live Output
            </Text>
            <Box
              as="pre"
              fontFamily="mono"
              fontSize="sm"
              bg="droidalBlack.200"
              color="white"
              rounded="8px"
              p={3}
              h="180px"
              overflow="auto"
              whiteSpace="pre-wrap"
              overflowX="hidden"
            >
              {output}
            </Box>
          </Box>
        </GridItem>
      </Grid>
    </Box>
  );
};

export default AgentConfigForm;

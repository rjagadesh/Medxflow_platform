import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Code,
  Heading,
  Table,
  Badge,
  Tabs,
  Button,
  Separator,
} from "@chakra-ui/react";
import {
  Copy,
  Check,
  Server,
  Code as CodeIcon,
  FileJson,
  Activity,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { toaster } from "@/components/ui/toaster";
import VoiceAiHeader from "./components/voice-ai-header";
import { Span } from "@chakra-ui/react";
import CustomButton from "@/components/button/button";

const ApiDocs = () => {
  const navigate = useNavigate();
  const { agent_app } = useParams();
  const [copied, setCopied] = useState(false);

  const BASE_URL = "https://droidal.ai/app"; // Replace with actual base URL

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toaster.create({
      title: "Copied to clipboard",
      type: "success",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  const endpoints = [
    {
      id: "tasks",
      method: "GET",
      path: "/agentsapp/tasks/",
      title: "List Tasks",
      description: "Retrieve a list of all tasks associated with the agent.",
      params: [
        {
          key: "apikey",
          type: "string",
          description: "Get your API key from the Settings page.",
          required: true,
        },
        {
          key: "page",
          type: "integer",
          description: "Page number for pagination.",
        },
        {
          key: "page_size",
          type: "integer",
          description: "Number of items per page.",
        },
        {
          key: "status",
          type: "string",
          description:
            "Filter tasks by status (e.g., SUCCESS, FAILED, NEW, PENDING).",
        },
      ],
      code: `import requests

url = "${BASE_URL}/agentsapp/tasks/"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
params = {
    "page": 1,
    "page_size": 10
}

response = requests.get(url, headers=headers, params=params)

if response.status_code == 200:
    print(response.json())
else:
    print(f"Error: {response.status_code}")
`,
    },
    {
      id: "tasks-pending",
      method: "GET",
      path: "/agentsapp/tasks/pending/",
      title: "List Pending Tasks",
      description:
        "Retrieves the next available task for an agent. The endpoint automatically manages task assignment, retry attempts, and failure handling.",
      params: [
        {
          key: "page",
          type: "integer",
          description: "Page number for pagination.",
        },
        {
          key: "page_size",
          type: "integer",
          description: "Number of items per page.",
        },
      ],
      code: `import requests

url = "${BASE_URL}/agentsapp/tasks/pending/"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}

response = requests.get(url, headers=headers)

if response.status_code == 200:
    print(response.json())
else:
    print(f"Error: {response.status_code}")
`,
    },
    {
      id: "tasks-create",
      method: "POST",
      path: "/agentsapp/tasks/create/",
      title: "Create Task",
      description:
        "Creates one or more tasks and adds them to the agent processing queue associated with the provided API key. The API validates the API key, links each task to the corresponding application, and supports both single and batch task creation. Task status and retry information are automatically normalized, and optional creation timestamps (i.e., created_at) are processed when provided.",
      payload: [
        {
          key: "apikey",
          type: "string",
          description: "Get your API key from the Settings page.",
          required: true,
        },
        {
          key: "data",
          type: "object",
          description:
            "Task data container. Can contain either a single task object or a list of tasks under the tasks key.",
          required: false,
        },
      ],
      code: `
# Create Single Task

import requests

API_URL = "f{BASE_URL}/agent-task/create/"

payload = {
    "apikey": "abc123",
    "data": {
        "task_id": "T001",
        "customer": "John Doe",
        "priority": "high"
    }
}

response = requests.post(API_URL, json=payload)

print("Status Code:", response.status_code)
print("Response:", response.json())

---------------------------------------------------------------------------------------
# Create Multiple Tasks

import requests

API_URL = "f{BASE_URL}/agent-task/create/"

payload = {
    "apikey": "abc123",
    "data": {
        "tasks": [
            {
                "task": {
                    "task_id": "T001",
                    "customer": "John"
                },
                "status": "NEW"
            },
            {
                "task": {
                    "task_id": "T002",
                    "customer": "Alice"
                },
                "status": "retry2",
                "created_date": "2026-02-27T10:30:00Z"
            }
        ]
    }
}

response = requests.post(API_URL, json=payload)

print("Status Code:", response.status_code)
print("Response:", response.json())
`,
    },
  ];

  return (
    <Flex direction="column" h="full">
      <VoiceAiHeader />
      <Box
        p={{ base: 4, md: 6 }}
        bg="droidalBlack.400"
        borderRadius="2xl"
        flex="0.99"
        color="white"
        overflow="hidden"
        className="flex"
        pos={"relative"}
      >
        <CustomButton
          pos="absolute"
          top={4}
          right={"20"}
          variant="outline"
          zIndex={100}
          onClick={() =>
            navigate(`/voice-ai/voice-ai-MTA=/${agent_app}/dashboard/`)
          }
        >
          Back
        </CustomButton>
        {/* Sidebar */}
        <Box
          w="300px"
          bg="#252526"
          borderRight="1px solid #333"
          p={4}
          overflowY="auto"
        >
          <Heading
            size="md"
            mb={6}
            textTransform="uppercase"
            color="primary.400"
            letterSpacing={"widest"}
          >
            API Documentation
          </Heading>
          <VStack align="start" gap={4}>
            <Text
              fontWeight="normal"
              letterSpacing={"widest"}
              color="gray.400"
              fontSize="sm"
            >
              INTRODUCTION
            </Text>
            <HStack
              cursor="pointer"
              _hover={{ color: "blue.300" }}
              onClick={() =>
                document
                  .getElementById("intro")
                  .scrollIntoView({ behavior: "smooth" })
              }
            >
              <Server size={16} />
              <Text fontSize="sm" letterSpacing={"widest"} fontWeight={"light"}>
                Base URL
              </Text>
            </HStack>

            <Text
              fontWeight="normal"
              letterSpacing={"widest"}
              color="gray.400"
              fontSize="sm"
              mt={4}
            >
              ENDPOINTS
            </Text>
            {endpoints.map((ep) => (
              <HStack
                key={ep.id}
                cursor="pointer"
                _hover={{ color: "blue.300" }}
                onClick={() =>
                  document
                    .getElementById(ep.id)
                    .scrollIntoView({ behavior: "smooth" })
                }
                w="full"
              >
                <Span
                  bgColor={ep.method === "GET" ? "green.800" : "red.800"}
                  borderRadius={"lg"}
                  color={ep.method === "GET" ? "green.200" : "red.200"}
                  fontSize="xs"
                  variant="solid"
                  w="50px"
                  textAlign="center"
                  letterSpacing={"wider"}
                  display={"inline-block"}
                  py={1}
                >
                  {ep.method}
                </Span>
                <Text
                  fontSize="sm"
                  letterSpacing={"widest"}
                  fontWeight={"light"}
                  isTruncated
                >
                  {ep.title}
                </Text>
              </HStack>
            ))}
          </VStack>
        </Box>

        {/* Main Content */}
        <Box flex="1" p={8} overflowY="auto">
          {/* Introduction Section */}
          <Box id="intro" mb={10}>
            <Heading size="lg" letterSpacing={"widest"} mb={4}>
              Introduction
            </Heading>
            <Text
              color="gray.300"
              fontWeight={"light"}
              letterSpacing={"wider"}
              mb={4}
            >
              Welcome to the Voice AI API documentation. This API allows you to
              manage tasks and interact with the Voice AI agent
              programmatically.
            </Text>
            <Box bg="#2d2d2d" p={4} borderRadius="md" border="1px solid #333">
              <Text color="gray.400" fontSize="sm" mb={2}>
                BASE URL
              </Text>
              <HStack justify="space-between">
                <Code bg="transparent" color="green.300" fontSize="md">
                  {BASE_URL}
                </Code>
                <Button
                  size="xs"
                  onClick={() => handleCopy(BASE_URL)}
                  variant="ghost"
                  color="gray.400"
                  _hover={{ bg: "whiteAlpha.300", color: "white" }}
                >
                  {copied ? (
                    <Check size={16} color="green" />
                  ) : (
                    <Copy size={16} />
                  )}
                </Button>
              </HStack>
            </Box>
          </Box>

          <Separator borderColor="#333" mb={10} />

          {/* Endpoints Section */}
          {endpoints.map((ep) => (
            <Box key={ep.id} id={ep.id} mb={12}>
              <HStack mb={4} align="center">
                <Badge
                  colorScheme={ep.method === "GET" ? "green" : "blue"}
                  fontSize="md"
                  px={2}
                  py={1}
                  variant="solid"
                >
                  {ep.method}
                </Badge>
                <Heading
                  size="md"
                  fontWeight={"normal"}
                  margin={0}
                  letterSpacing={"widest"}
                >
                  {ep.title}
                </Heading>
              </HStack>

              <Box
                bg="#2d2d2d"
                p={3}
                borderRadius="md"
                mb={4}
                border="1px solid #333"
              >
                <Code bg="transparent" color="yellow.300">
                  {ep.path}
                </Code>
              </Box>

              <Text
                color="gray.300"
                fontWeight={"light"}
                letterSpacing={"wider"}
                mb={6}
              >
                {ep.description}
              </Text>

              <Tabs.Root variant="enclosed" defaultValue="params">
                <Tabs.List bg="#000" borderBottomColor="#333">
                  <Tabs.Trigger
                    value="params"
                    _selected={{
                      borderColor: "blue.400",
                      bg: "var(--bg-blue-gradient) !important",
                      color: "#fff",
                      borderRadius: "lg",
                      letterSpacing: "wider",
                      fontWeight: "light",
                    }}
                  >
                    {ep.method === "POST" ? "Payload" : "Parameters"}
                  </Tabs.Trigger>
                  <Tabs.Trigger
                    value="code"
                    _selected={{
                      borderColor: "blue.400",
                      bg: "var(--bg-blue-gradient) !important",
                      color: "#fff",
                      borderRadius: "lg",
                      letterSpacing: "wider",
                      fontWeight: "light",
                    }}
                  >
                    Code
                  </Tabs.Trigger>
                </Tabs.List>

                <Tabs.Content
                  value="params"
                  p={4}
                  bg="#252526"
                  borderRadius="0 0 md md"
                  border="1px solid #333"
                  borderTop="none"
                >
                  <Table.Root size="sm" variant="simple">
                    <Table.Header>
                      <Table.Row>
                        <Table.ColumnHeader
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          color="gray.400"
                        >
                          Key
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          color="gray.400"
                        >
                          Type
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          color="gray.400"
                        >
                          Description
                        </Table.ColumnHeader>
                        <Table.ColumnHeader
                          letterSpacing={"wider"}
                          fontWeight={"light"}
                          color="gray.400"
                        >
                          Required
                        </Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {(ep.payload || ep.params).map((param, idx) => (
                        <Table.Row key={idx} _hover={{ bg: "whiteAlpha.50" }}>
                          <Table.Cell
                            letterSpacing={"wider"}
                            fontWeight="medium"
                            color="blue.300"
                          >
                            {param.key}
                          </Table.Cell>
                          <Table.Cell
                            letterSpacing={"wider"}
                            color="purple.300"
                          >
                            {param.type}
                          </Table.Cell>
                          <Table.Cell letterSpacing={"wider"} color="gray.300">
                            {param.description}
                          </Table.Cell>
                          <Table.Cell>
                            {param.required ? (
                              <Badge colorScheme="red" variant="subtle">
                                Required
                              </Badge>
                            ) : (
                              <Badge colorScheme="gray" variant="subtle">
                                Optional
                              </Badge>
                            )}
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Tabs.Content>

                <Tabs.Content
                  value="code"
                  p={0}
                  bg="#1e1e1e"
                  borderRadius="0 0 md md"
                  border="1px solid #333"
                  borderTop="none"
                >
                  <Box position="relative">
                    <Button
                      position="absolute"
                      top={2}
                      right={2}
                      size="xs"
                      onClick={() => handleCopy(ep.code)}
                      variant="ghost"
                      bg="whiteAlpha.200"
                      color="gray.400"
                      _hover={{ bg: "whiteAlpha.300", color: "white" }}
                    >
                      {copied ? <Check size={14} /> : <Copy size={14} />}
                    </Button>
                    <Code
                      display="block"
                      whiteSpace="pre"
                      p={4}
                      bg="#1e1e1e"
                      color="green.300"
                      overflowX="auto"
                      fontFamily="monospace"
                      fontSize="sm"
                    >
                      {ep.code}
                    </Code>
                  </Box>
                </Tabs.Content>
              </Tabs.Root>
            </Box>
          ))}
        </Box>
      </Box>
    </Flex>
  );
};

export default ApiDocs;

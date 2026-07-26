import { Box, Heading, Text, VStack, Code } from "@chakra-ui/react";

export default function FileManagerIntegrationDocs() {
  return (
    <Box
      bg="#1e1e1eff"
      color="white"
      p={8}
      borderRadius="lg"
      fontFamily="monospace"
      lineHeight="1.7"
      overflowY="auto"
      maxH="80vh"
    >
      <Heading color="white" size="lg" mb={6}>
        🗂️ MedXFlow File Manager API Integration
      </Heading>

      <Text fontSize="sm" color="white" mb={4}>
        This guide explains how to integrate your <b>backend File Manager</b>{" "}
        with the MedXFlow website. Each endpoint supports secure JWT-based
        authentication and JSON responses.
      </Text>

      <VStack align="start" spacing={8} fontSize="sm">
        {/* BASE URL */}
        <Box>
          <Heading size="sm" color="white"></Heading>
          <Code
            display="block"
            color={"white"}
            bg="gray.800"
            p={3}
            borderRadius="md"
            mt={2}
          >
            https://api.droidal.ai/app/filemanager/
          </Code>
        </Box>

        {/* AUTHENTICATION */}
        <Box>
          <Heading size="sm" color="white">
            🔐 Authentication
          </Heading>
          <Text mt={2}>All endpoints require a valid JWT token:</Text>
          <Code
            color={"white"}
            display="block"
            bg="gray.800"
            p={3}
            borderRadius="md"
            mt={2}
          >
            {`Authorization: Bearer <ACCESS_TOKEN>`}
          </Code>
        </Box>

        {/* LIST FILES */}
        <Box>
          <Heading size="sm" color="white">
            📁 List Files
          </Heading>
          <Text mt={2}>Retrieve files and folders in a given path.</Text>
          <Code
            display="block"
            bg="gray.800"
            color={"white"}
            p={3}
            borderRadius="md"
            mt={2}
            whiteSpace="pre"
          >
            {`POST /app/filemanager/list_files
{
  "file_paths": ["root/Projects"]
}`}
          </Code>
        </Box>

        {/* UPLOAD FILES */}
        <Box>
          <Heading size="sm" color="white">
            ⬆️ Upload Files
          </Heading>
          <Text mt={2}>
            Upload one or more files, optionally including folder structure.
          </Text>
          <Code
            color={"white"}
            display="block"
            bg="gray.800"
            p={3}
            borderRadius="md"
            mt={2}
            whiteSpace="pre"
          >
            {`POST /app/filemanager/upload/
Form Data:
  parent = root
  folders = ["Designs"]
  files = [sample.pdf, logo.png]`}
          </Code>
        </Box>

        {/* DOWNLOAD FILES */}
        <Box>
          <Heading size="sm" color="white">
            ⬇️ Download Files
          </Heading>
          <Text mt={2}>
            Download selected files or folders as a ZIP archive.
          </Text>
          <Code
            color={"white"}
            display="block"
            bg="gray.800"
            p={3}
            borderRadius="md"
            mt={2}
            whiteSpace="pre"
          >
            {`POST /app/filemanager/download_files
{
  "file_paths": [
    "root/Projects/Designs",
    "root/Projects/Notes.txt"
  ]
}`}
          </Code>
        </Box>

        {/* CREATE FOLDER */}
        <Box>
          <Heading size="sm" color="white">
            📂 Create Folder
          </Heading>
          <Text mt={2}>Create a new folder under a parent directory.</Text>
          <Code
            color={"white"}
            display="block"
            bg="gray.800"
            p={3}
            borderRadius="md"
            mt={2}
            whiteSpace="pre"
          >
            {`POST /app/filemanager/create-folder/
{
  "name": "MyNewFolder",
  "parent": 1202
}`}
          </Code>
        </Box>

        {/* DELETE FILE/FOLDER */}
        <Box>
          <Heading size="sm" color="white">
            🗑️ Delete File or Folder
          </Heading>
          <Text mt={2}>Delete a specific file or folder by its ID.</Text>
          <Code
            color={"white"}
            display="block"
            bg="gray.800"
            p={3}
            borderRadius="md"
            mt={2}
            whiteSpace="pre"
          >
            {`DELETE /app/filemanager/<file_id>/`}
          </Code>
        </Box>

        <Text fontSize="xs" color="white" align="center" w="100%" pt={4}>
          © {new Date().getFullYear()} MedXFlow — File Manager Integration
          Guide
        </Text>
      </VStack>
    </Box>
  );
}

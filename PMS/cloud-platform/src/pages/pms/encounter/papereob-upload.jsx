import CustomButton from "@/components/button/button";
import { useUploadEob } from "@/hooks/query/pms/eob/useUploadEobClaimSubmission";
import {
  Button,
  CloseButton,
  Dialog,
  Portal,
  Input,
  Box,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useRef, useState } from "react";

export default function PaperEobUpload() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  const handleFileSelect = (f) => {
    if (!f) return;
    setFile(f);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFileSelect(e.dataTransfer.files?.[0]);
  };

  const { mutate: createeob, isPending } = useUploadEob();

  const handleSave = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    createeob(formData, {
      onSuccess: () => {
        alert("File uploaded successfully");
        setFile(null);
      },
      onError: () => {
        alert("File uploaded successfully");
        setFile(null);
      },
    });
  };

  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <CustomButton variant="outline">Upload Paper EOB</CustomButton>
      </Dialog.Trigger>

      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="#2e2e2eff" color="white">
            <Dialog.Header>
              <Dialog.Title>Upload Paper EOB</Dialog.Title>
            </Dialog.Header>

            <Dialog.Body>
              {/* Hidden Input */}
              <Input
                ref={inputRef}
                type="file"
                display="none"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={(e) => handleFileSelect(e.target.files?.[0])}
              />

              {/* Dropzone */}
              <Box
                border="2px dashed"
                borderColor={file ? "green.400" : "gray.500"}
                borderRadius="md"
                p={6}
                textAlign="center"
                cursor="pointer"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                _hover={{ borderColor: "gray.300" }}
              >
                {!file ? (
                  <Text color="gray.300">
                    Drag & drop file here or <b>click to upload</b>
                  </Text>
                ) : (
                  <VStack spacing={2}>
                    {file.type.startsWith("image/") && (
                      <Box
                        as="img"
                        src={URL.createObjectURL(file)}
                        maxH="120px"
                        borderRadius="md"
                      />
                    )}
                    <Text fontSize="sm">{file.name}</Text>
                    <Text fontSize="xs" color="gray.400">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </Text>
                  </VStack>
                )}
              </Box>
            </Dialog.Body>

            <Dialog.Footer justifyContent="space-between">
              {/* Left slot (reserved space) */}
              <Box minW="80px">
                {file && (
                  <CustomButton variant="outline" onClick={() => setFile(null)}>
                    Remove
                  </CustomButton>
                )}
              </Box>

              {/* Right slot (always fixed) */}
              <Box display="flex" gap={2}>
                <Dialog.ActionTrigger asChild>
                  <CustomButton variant="outline" color="white">
                    Cancel
                  </CustomButton>
                </Dialog.ActionTrigger>

                <CustomButton
                  onClick={handleSave}
                  loading={isPending}
                  disabled={!file || isPending}
                  color="white"
                >
                  Save
                </CustomButton>
              </Box>
            </Dialog.Footer>

            <Dialog.CloseTrigger asChild>
              <CloseButton size="sm" />
            </Dialog.CloseTrigger>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

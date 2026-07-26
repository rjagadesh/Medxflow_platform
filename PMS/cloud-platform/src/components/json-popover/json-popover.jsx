"use client";

import { useState } from "react";
import { Popover, Button, IconButton, Box, Text, Code } from "@chakra-ui/react";
import { Copy, Check } from "lucide-react";
import { toaster } from "../ui/toaster";
import { CopyIcon } from "lucide-react";

export function JsonCopyPopover({ data, title = "JSON Payload", trigger }) {
  const [copied, setCopied] = useState(false);

  const jsonString = JSON.stringify(data, null, 2);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(jsonString);
      setCopied(true);
      toaster.success({
        title: "Copied!",
        description: "JSON payload copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toaster.success({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
      });
    }
  };

  //   <Popover.Root>
  //   <Popover.Trigger />
  //   <Popover.Positioner>
  //     <Popover.Content>
  //       <Popover.CloseTrigger />
  //       <Popover.Arrow>
  //         <Popover.ArrowTip />
  //       </Popover.Arrow>
  //       <Popover.Body>
  //         <Popover.Title />
  //       </Popover.Body>
  //     </Popover.Content>
  //   </Popover.Positioner>
  // </Popover.Root>

  return (
    <Popover.Root placement="bottom-start">
      <Popover.Trigger>
        {trigger || (
          <Button variant="outline" size="sm">
            View Payload
          </Button>
        )}
      </Popover.Trigger>
      <Popover.Positioner>
        <Popover.Content width="400px" maxWidth="90vw">
          <Popover.Header>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
            >
              <Text fontSize="sm" fontWeight="medium">
                {title}
              </Text>
              <IconButton
                aria-label="Copy JSON"
                size="sm"
                variant="subtle"
                onClick={copyToClipboard}
              >
                {copied ? (
                  <Check size={16} color="green" />
                ) : (
                  <CopyIcon size={16} color="gray" />
                )}
              </IconButton>
            </Box>
          </Popover.Header>
          <Popover.Body p={0}>
            <Box
              maxHeight="256px"
              overflowY="auto"
              p={4}
              bg="gray.50"
              _dark={{ bg: "gray.800" }}
            >
              <Code
                display="block"
                whiteSpace="pre-wrap"
                wordBreak="break-all"
                fontSize="xs"
                fontFamily="mono"
                color="gray.600"
                _dark={{ color: "gray.300" }}
              >
                {jsonString}
              </Code>
            </Box>
          </Popover.Body>
        </Popover.Content>
      </Popover.Positioner>
    </Popover.Root>
  );
}

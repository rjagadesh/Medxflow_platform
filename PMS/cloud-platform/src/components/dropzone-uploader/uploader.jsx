"use client";

import React, { useState, useEffect } from "react";
import { LuUpload } from "react-icons/lu";
import { Box } from "@chakra-ui/react/box";
import { Icon } from "@chakra-ui/react/icon";
import { FileUpload } from "@chakra-ui/react/file-upload";

/**
 * A reusable DropzoneUploader using Chakra UI's FileUpload components.
 * Supports controlled and uncontrolled usage.
 */
export function DropzoneUploader({
  value: controlledFiles,
  onChange,
  accept,
  maxFiles = Number.MAX_SAFE_INTEGER,
  children,
  ...rest
}) {
  const [internalFiles, setInternalFiles] = useState([]);

  // Sync internal state when controlled prop changes
  useEffect(() => {
    if (controlledFiles !== undefined) {
      setInternalFiles(controlledFiles);
    }
  }, [controlledFiles]);

  const handleChange = (details) => {
    const files = details.acceptedFiles;
    if (controlledFiles !== undefined) {
      onChange?.(files);
    } else {
      setInternalFiles(files);
      onChange?.(files);
    }
  };

  return (
    <FileUpload.Root
      accept={accept}
      maxFiles={maxFiles}
      onFileChange={handleChange}
      // Using controlled acceptedFiles prop if available
      acceptedFiles={controlledFiles ?? internalFiles}
      gap="2"
      w={"full"}
      className="!bg-transparent"
      {...rest}
    >
      <FileUpload.HiddenInput />

      <FileUpload.Dropzone
        className="bg-transparent! min-h-[180px]!"
        w={"full"}
      >
        <Icon as={LuUpload} boxSize={6} color="gray.100" />
        <Box color={'white'}>{children ?? "Drag & drop or click to upload"}</Box>
      </FileUpload.Dropzone>

      {/* Displays files with per-file remove action */}
      <FileUpload.List clearable />
    </FileUpload.Root>
  );
}

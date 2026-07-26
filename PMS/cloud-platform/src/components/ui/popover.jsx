"use client";

import FileManagerIntegrationDocs from "@/pages/Utilities/Integration-doc";
import {
  Button,
  CloseButton,
  Dialog,
  Portal,
  Text,
  VStack,
  Code,
  Box,
  Heading,
} from "@chakra-ui/react";

export const PopOverContentFile = () => {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button
          border="none"
          boxShadow="lg"
          borderRadius="md"
          w="50px"
          color={"grey"}
          background={"transparent"}
          _hover={{ color: "white", bg: "transparent" }}
        >
          &lt; &gt;
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner max-width="700px">
          <Dialog.Content
            maxW="1500px"
            width="1500px"
            color="white"
            background={"#2e2e2eff"}
            p={6}
            borderRadius="lg"
            maxH="80vh"
            overflowY="auto"
          >
            <Dialog.CloseTrigger asChild>
              <CloseButton
                color={"white"}
                _hover={{ bg: "gray.700" }}
                _active={{ color: "black" }}
              />
            </Dialog.CloseTrigger>
            <FileManagerIntegrationDocs />
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

import React from "react";
import { Dialog, Portal, CloseButton } from "@chakra-ui/react";
import Vitals from "./vitals";

const VitalsDialog = ({ isOpen, onClose }) => {
  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => !details.open && onClose()}
      placement="center"
      motionPreset="slide-in-bottom"
      size="full"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content
            bgColor="droidalBlack.300"
            color="white"
            borderRadius="md"
          >
            <Dialog.CloseTrigger asChild>
              <CloseButton
                size="lg"
                pos="absolute"
                top="2"
                right="2"
                color="droidalGray.300"
                _hover={{ color: "white", bgColor: "transparent" }}
                onClick={onClose}
                zIndex="1000"
              />
            </Dialog.CloseTrigger>

            <Dialog.Body p={0} h="full">
              <Vitals onClose={onClose} />
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default VitalsDialog;

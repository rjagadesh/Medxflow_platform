import React, { useRef } from "react";
import { Button, CloseButton } from "@chakra-ui/react/button";
import { Dialog } from "@chakra-ui/react/dialog";
import { Portal } from "@chakra-ui/react/portal";
import CustomButton from "../button/button";

function ConfirmationDialog({
  onConfirm,
  title,
  description,
  loading,
  open,
  onClose,
}) {
  const cancelRef = useRef();

  const handleConfirm = () => {
    const result = onConfirm();
    if (result) {
      onClose(false);
    }
  };

  return (
    <>
      {open && (
        <Dialog.Root
          open={open}
          onOpenChange={(details) => onClose(details.open)}
          role="alertdialog" // Accessible confirmation dialog
          size="md" // Small size for compact dialog
          motionPreset="scale" // Smooth opening animation
          placement="center"
        >
          <Dialog.Trigger />
          <Portal>
            <Dialog.Backdrop />
            <Dialog.Positioner>
              <Dialog.Content className="!bg-droidal-black-300">
                <Dialog.Header>
                  <Dialog.Title m={0} className="!text-white">
                    {title}
                  </Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <CloseButton size="sm" />
                  </Dialog.CloseTrigger>
                </Dialog.Header>
                <Dialog.Body>
                  <p className="!text-white">{description}</p>
                </Dialog.Body>
                <Dialog.Footer>
                  <Dialog.ActionTrigger asChild>
                    <CustomButton
                      ref={cancelRef}
                      variant={"outline"}
                      color="#fff"
                      _hover={{
                        bg: "transparent",
                      }}
                      onClick={() => onClose(false)}
                      w="85px"
                    >
                      No
                    </CustomButton>
                  </Dialog.ActionTrigger>
                  <CustomButton
                    onClick={handleConfirm}
                    ml={3}
                    loading={loading}
                    w="85px"
                  >
                    Yes
                  </CustomButton>
                </Dialog.Footer>
              </Dialog.Content>
            </Dialog.Positioner>
          </Portal>
        </Dialog.Root>
      )}
    </>
  );
}

export default ConfirmationDialog;

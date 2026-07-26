import React, { useRef, useState } from "react";
import { Button, CloseButton } from "@chakra-ui/react/button";
import { Dialog } from "@chakra-ui/react/dialog";
import { Portal } from "@chakra-ui/react/portal";
import CustomButton from "../button/button";
import { Trash2 } from "lucide-react";

function ConfirmationDialog({
  onConfirm,
  buttonName,
  title,
  description,
  loading,
  buttonProps,
  onButtonClick = () => {},
  checkPermission = () => true,
  customTriggerButton,
}) {
  const [open, setOpen] = useState(false);
  const cancelRef = useRef();

  const handleConfirm = async () => {
    const result = await onConfirm();
    if (result) {
      setOpen(false);
    }
  };

  return (
    <>
      {customTriggerButton && (
        <button
          onClick={() => {
            if (checkPermission()) {
              setOpen(true);
            }
          }}
          className="flex items-center cursor-pointer w-full px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </button>
      )}

      {!customTriggerButton && (
        <CustomButton
          onClick={() => {
            if (checkPermission()) {
              setOpen(true);
            }
          }}
          {...buttonProps}
        >
          {buttonName}
        </CustomButton>
      )}

      {open && (
        <Dialog.Root
          open={open}
          onOpenChange={(details) => setOpen(details.open)}
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
                      onClick={() => setOpen(false)}
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

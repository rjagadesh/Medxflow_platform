import { useEffect, useState } from "react";
import { Button, Dialog, Portal } from "@chakra-ui/react";
import { Copy, TextIcon } from "lucide-react";
import { toaster } from "../ui/toaster";
import CustomButton from "../button/button";

const CopyToClipboard = ({ data, className }) => {
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(data);
      toaster.success({
        title: "Copied!",
        description: "JSON payload copied to clipboard",
      });
    } catch (error) {
      toaster.success({
        title: "Failed to copy",
        description: "Could not copy to clipboard",
      });
    }
  };
  return <Copy className={className} onClick={copyToClipboard} />;
};

export default function TextViewer({ url = "", isDisabled, onDownload }) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (url) {
      fetch(url.replace("http://", "https://"))
        .then((res) => res.text())
        .then((text) => {
          setText(text);
        })
        .catch((e) => {
          console.error(e);
        });
    }
  }, [url]);

  return (
    <Dialog.Root scrollBehavior={"inside"} size={"xl"} placement="center">
      <Dialog.Trigger asChild>
        <Button variant="plain" disabled={isDisabled} color="white">
          {!isDisabled && <TextIcon />}
          {isDisabled && (
            <div className="relative">
              <TextIcon />
              <span className="w-[2px] absolute -top-1 rotate-45 right-3 h-8 inline-block bg-white " />
            </div>
          )}
        </Button>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner padding="4">
          <Dialog.Content rounded="md" bg="droidalBlack.300" color="white">
            <Dialog.Header>
              <Dialog.Title>Text Viewer</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body h="full">
              <CopyToClipboard
                className="absolute top-20 right-3"
                data={text}
              />
              <pre className="max-h-80 overflow-auto rounded-md border bg-muted/50 p-3 font-mono text-sm leading-relaxed">
                {text || "No text loaded yet."}
              </pre>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger className="!static">
                <CustomButton variant="outline">Close</CustomButton>
              </Dialog.ActionTrigger>

              <CustomButton onClick={() => onDownload()}>Download</CustomButton>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

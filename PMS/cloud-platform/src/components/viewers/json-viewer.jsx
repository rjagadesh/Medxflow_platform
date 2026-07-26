import { useEffect, useMemo, useState } from "react";
import { Button, CloseButton, Dialog, Portal } from "@chakra-ui/react";
import { BracesIcon, Copy } from "lucide-react";
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

export default function JsonViewer({
  url = "",
  isDisabled,
  jsonData,
  children,
}) {
  const [raw, setRaw] = useState("");
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState("data.json");

  function parseNow() {
    try {
      const parsed = JSON.parse(raw);
      setData(parsed);
      setError(null);
    } catch (e) {
      setData(null);
      setError(e?.message ?? "Invalid JSON");
    }
  }

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      setRaw(content);
      setFileName(file.name);
      const parsed = JSON.parse(content);
      setData(parsed);
      setError(null);
    } catch (e) {
      setData(null);
      setError(e?.message ?? "Invalid JSON");
    }
  }

  const pretty = useMemo(() => {
    if (!data) return "";
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return "";
    }
  }, [data]);

  useEffect(() => {
    if (url) {
      fetch(url.replace("http://", "https://"))
        .then((res) => res.text())
        .then((text) => {
          setRaw(text);
          const parsed = JSON.parse(text);
          setData(parsed);
          setError(null);
        })
        .catch((e) => {
          setData(null);
          setError(e?.message ?? "Invalid JSON");
        });
    } else if (jsonData) {
      if (typeof jsonData === "string") {
        setRaw(jsonData);
        try {
          const parsed = JSON.parse(jsonData);
          setData(parsed);
          setError(null);
        } catch (e) {
          setData(null);
          setError(e?.message ?? "Invalid JSON");
        }
      } else {
        setRaw(JSON.stringify(jsonData, null, 2));
        setData(jsonData);
        setError(null);
      }
    }
  }, [url, jsonData]);

  const handleDownload = () => {
    if (!data) {
      toaster.error({
        title: "No data to download",
        description: "Please load or paste valid JSON first.",
      });
      return;
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "data.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toaster.success({
      title: "Download started",
      description: `File: ${fileName || "data.json"}`,
    });
  };

  return (
    <Dialog.Root size={"xl"} scrollBehavior={"inside"} placement="center">
      <Dialog.Trigger asChild>
        {children || (
          <Button variant="plain" disabled={isDisabled} color="white">
            {!isDisabled && <BracesIcon />}

            {isDisabled && (
              <div className="relative">
                <BracesIcon />
                <span className="w-[2px] absolute -top-1 rotate-45 right-3 h-[30px] inline-block bg-white" />
              </div>
            )}
          </Button>
        )}
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner padding="4">
          <Dialog.Content rounded="md" bg="droidalBlack.300" color="white">
            <Dialog.Header>
              <Dialog.Title>JSON Viewer</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body h="full">
              <CopyToClipboard className="absolute top-20 right-3" data={raw} />
              <pre className=" overflow-auto rounded bg-muted/50 p-3 font-mono text-sm leading-relaxed">
                {pretty || "No JSON parsed yet."}
              </pre>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger>
                <CustomButton variant="outline" onClick={() => {}}>
                  Close
                </CustomButton>
              </Dialog.ActionTrigger>
              <CustomButton onClick={handleDownload}>Download</CustomButton>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}

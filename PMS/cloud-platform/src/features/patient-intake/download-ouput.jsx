import { toaster } from "@/components/ui/toaster";
import JsonViewer from "@/components/viewers/json-viewer";
import TextViewer from "@/components/viewers/text-viewe";
import { useGetOutputFiles } from "@/hooks/query/agentsapp/useGetOutputFiles";
import { PlayIcon } from "lucide-react";
import { Button } from "@chakra-ui/react/button";
import { HStack } from "@chakra-ui/react";

const DownloadOutput = ({
  agentId = "",
  api_key = "",
  activePlayer,
  setCurrentFiles = () => {},
}) => {
  console.log("activePlayer", activePlayer);
  const { data: files } = useGetOutputFiles({
    agentid: agentId,
    secretkey: api_key,
  });

  async function downloadFile(url, filename) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const blob = await response.blob();
    const a = document.createElement("a");
    const objectUrl = URL.createObjectURL(blob);

    a.href = objectUrl;
    a.download = filename || "download";
    document.body.appendChild(a);
    a.click();

    URL.revokeObjectURL(objectUrl);
    a.remove();

    return { success: true, filename };
  }

  const handleDownload = (mime_type) => {
    try {
      const findExtension = files.files.find((file) =>
        file.mime_type.endsWith(mime_type)
      );

      if (findExtension) {
        toaster.promise(
          downloadFile(
            findExtension.file_url?.replace("http://", "https://"),
            findExtension.file_name
          ),
          {
            success: {
              title: "Successfully uploaded!",
              description: "Looks great",
            },
            error: {
              title: "Upload failed",
              description: "Something wrong with the upload",
            },
            loading: { title: "downloading...", description: "Please wait" },
          }
        );
      } else {
        toaster.warning({ title: "Error", description: "File not found" });
      }
    } catch (e) {
      console.log(e);
    }
  };

  const fileUrlByMime = (mime_type) => {
    const findExtension = files?.files?.find((file) =>
      file.mime_type.endsWith(mime_type)
    );
    return findExtension?.file_url;
  };

  const isAudioDisabled = !fileUrlByMime("audio/x-wav");

  return (
    <HStack>
      <TextViewer
        isDisabled={!fileUrlByMime("text/plain")}
        url={fileUrlByMime("text/plain")}
        onDownload={() => handleDownload("text/plain")}
      />
      <JsonViewer
        isDisabled={!fileUrlByMime("application/json")}
        url={fileUrlByMime("application/json")}
        onDownload={() => handleDownload("application/json")}
      />{" "}
      <Button
        variant={"plain"}
        onClick={() => {
          setCurrentFiles(files?.files || []);
        }}
        disabled={isAudioDisabled}
        aria-label="Play audio and open player"
      >
        <>
          {!isAudioDisabled && <PlayIcon color="#fff" />}
          {isAudioDisabled && (
            <div className="relative">
              <PlayIcon color="#fff" />
              <span className="w-[2px] absolute -top-1 rotate-45 right-3 h-8 inline-block bg-white" />
            </div>
          )}
        </>
      </Button>
    </HStack>
  );
};

export default DownloadOutput;

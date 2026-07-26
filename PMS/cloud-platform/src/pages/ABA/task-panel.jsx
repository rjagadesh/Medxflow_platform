import { useState, useMemo, useRef, useEffect } from "react";
import {
  Bleed,
  Box,
  Button,
  Center,
  HStack,
  IconButton,
  Text,
} from "@chakra-ui/react";
// import { useGetTasksFile } from "@/hooks/task/useTasksFile";
import { useNavigate, useParams } from "react-router-dom";
import { useGetTasksFile } from "@/hooks/query/task/useGetTasksFile";
import CustomSelect from "@/components/ui/select";
import { useGetTasksByProjectId } from "@/hooks/query/task/useTasks";
import CustomButton from "@/components/button/button";
import ABACodeBuilder from "./code-builder";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Code2Icon,
  CodeIcon,
  Expand,
  FileText,
  GitBranch,
  History,
  Menu,
  ShrinkIcon,
} from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";
import { Tooltip } from "@/components/ui/tooltip";
import AudioPlayer from "@/components/viewers/audio-player";
import { AspectRatio } from "@chakra-ui/react";

// Assuming PreviewTabs and dummyCode are declared/imported elsewhere

function TaskDetailsPanel() {
  const [fullscreen, setFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const { id, pod_id } = useParams();
  const { data: tasks = [] } = useGetTasksByProjectId(pod_id);
  const elementRef = useRef(null);
  const navigate = useNavigate();

  const getTabIcon = (tab) => {
    switch (tab) {
      case "ptt files":
        return <FileText size={18} />;
      case "flowChart":
        return <GitBranch size={18} />;
      case "steps":
        return <History size={18} />;
      case "Code Builder":
        return <Code2Icon size={18} />;
      case "code":
        return <CodeIcon size={18} />;
      default:
        return <Menu size={18} />;
    }
  };

  const getDisplayName = (tab) => {
    switch (tab) {
      case "ptt files":
        return "PTT Files";
      case "flowChart":
        return "Flow Chart";
      case "steps":
        return "Steps";
      case "Code Builder":
        return "Legacy Code Builder";
      default:
        return tab;
    }
  };

  const toggleFullScreen = () => {
    const el = elementRef.current;

    if (!document.fullscreenElement) {
      // Enter fullscreen
      if (el.requestFullscreen) {
        el.requestFullscreen();
      } else if (el.mozRequestFullScreen) {
        el.mozRequestFullScreen(); // Firefox
      } else if (el.webkitRequestFullscreen) {
        el.webkitRequestFullscreen(); // Chrome, Safari, Opera
      } else if (el.msRequestFullscreen) {
        el.msRequestFullscreen(); // IE/Edge
      }
    } else {
      // Exit fullscreen
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
  };

  const selectTask = tasks?.find((task) => task.id === Number(id));

  console.log("selectTask", tasks, selectTask);

  const [activeTab, setActiveTab] = useQueryState(
    "active-tab",
    parseAsString.withDefault("PDD files")
  );
  const [activePreview, setActivePreview] = useState("pdf"); // default preview

  const [selectedPdf, setSelectedPDF] = useState("");
  const [selectedaudio, setSelectedAUDIO] = useState("");
  const [selectedVideo, setSelectedVIDEO] = useState("");
  const [selectedTxt, setSelectedTXT] = useState("");
  const [selectedDox, setSelectedDox] = useState("");

  // Fetch task files by id
  const { data: filesData, isLoading } = useGetTasksFile(id);
  console.log(filesData);

  // Define which extensions are code files
  const codeExtensions = [
    "js",
    "ts",
    "jsx",
    "tsx",
    "css",
    "html",
    "py",
    "java",
    "cpp",
  ];

  // Categorize files by extension
  const categorizedFiles = useMemo(() => {
    const categories = {
      pdf: [],
      text: [],
      audio: [],
      video: [],
      code: [],
      others: [],
      doc: [],
    };

    if (!filesData?.files) return categories;

    filesData.files.forEach(({ file_name, file_url }) => {
      const ext = file_name.split(".").pop().toLowerCase();
      if (ext === "pdf") categories.pdf.push({ file_name, file_url });
      else if (ext === "txt") categories.text.push({ file_name, file_url });
      else if (ext === "mp3") categories.audio.push({ file_name, file_url });
      else if (ext === "mp4") categories.video.push({ file_name, file_url });
      else if (ext === "docx") categories.doc.push({ file_name, file_url });
      else if (codeExtensions.includes(ext))
        categories.code.push({ file_name, file_url });
      else categories.others.push({ file_name, file_url });
    });

    return categories;
  }, [filesData]);

  const tabs = ["PDD files", "steps", "code", "flowChart", "Code Builder"];

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  if (isLoading) {
    return (
      <div className="h-full flex text-white items-center justify-center">
        Loading files...
      </div>
    );
  }

  if (id === "none") {
    return (
      <Center height={"60vh"} flexDirection={"column"} gap={2}>
        <Text fontSize={"xl"} color={"white"} letterSpacing={"widest"}>
          Task not found
        </Text>
        <Text color={"gray.300"} letterSpacing={"widest"}>
          Get started by creating your first task.{" "}
        </Text>
        <Button
          mt={2}
          onClick={() => {
            navigate(`/aba/pods/${pod_id}/create-task`);
          }}
          colorPalette={"gray"}
          variant={"subtle"}
        >
          Create Task
        </Button>
      </Center>
    );
  }

  return (
    <div className="flex text-white h-full">
      {/* Left Tabs */}
      <div
        className={`${
          isExpanded ? "w-[220px]" : "w-10 2xl:w-14 3xl:w-16"
        } transition-all duration-300 border-r py-4 border-[#585757] bg-droidal-black-300 relative`}
      >
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="absolute -right-3 top-6 bg-gray-800 border border-[#585757] rounded-full p-1 hover:bg-gray-700 transition-colors"
        >
          {isExpanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
        </button>

        {/* Header */}
        {isExpanded && (
          <h3 className="font-semibold mb-4 px-8 text-white">
            Task -{" "}
            <span className="text-gray-400">{selectTask?.task_name}</span>
          </h3>
        )}

        {/* Navigation Items */}
        <ul className="space-y-1">
          {tabs.map((tab) => {
            const displayName = getDisplayName(tab);
            const icon = getTabIcon(tab);

            return (
              <li key={tab}>
                <div
                  className={`flex items-center ${
                    isExpanded ? "justify-start px-6" : "justify-center"
                  } gap-3 p-2 cursor-pointer rounded transition-all duration-200 ${
                    activeTab === tab
                      ? "bg-gray-800 text-white font-semibold"
                      : "hover:bg-gray-800 hover:text-white text-gray-300"
                  }`}
                  onClick={() => setActiveTab(tab)}
                  title={!isExpanded ? displayName : ""}
                >
                  <span className="flex-shrink-0 text-gray-400">{icon}</span>
                  {isExpanded && (
                    <span className="whitespace-nowrap overflow-hidden">
                      {displayName.toUpperCase()}
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>

        {/* Collapsed state indicator */}
        {!isExpanded && (
          <div className="mt-4 text-center">
            <div className="w-8 h-px bg-gray-600 mx-auto"></div>
          </div>
        )}
      </div>

      {/* Right Preview */}
      <div className="flex-1 bg-droidal-black-300 px-4 py-2 2xl:p-4 overflow-auto">
        <HStack mb="1" align={"center"}>
          <IconButton
            onClick={() => navigate("/aba/workspace/")}
            className="dark !bg-droidal-black-200"
          >
            <ArrowLeft />
          </IconButton>

          <Text
            color={"white"}
            letterSpacing={"widest"}
            fontSize={{
              base: "sm",
              "2xl": "md",
              "3xl": "lg",
            }}
            className="font-semibold"
          >
            Preview -{" "}
            {activeTab === "Files"
              ? activePreview.toUpperCase()
              : activeTab.toUpperCase()}
          </Text>
          <HStack></HStack>

          <HStack>
            {activeTab === "Code Builder" && (
              <IconButton
                bgColor={"droidalBlack.400"}
                border="1"
                size="lg"
                borderColor={"droidalBlack.100"}
                className="dark"
                onClick={() => {
                  toggleFullScreen();
                }}
              >
                {fullscreen && <ShrinkIcon />}
                {!fullscreen && <Expand />}
              </IconButton>
            )}
          </HStack>

          {/* Preview Type Buttons */}
          {activeTab === "PDD files" && (
            <div className="flex space-x-4 mb-1 border-b border-[#585757]">
              {["pdf", "audio", "video", "text", "docx"].map((type) => (
                <button
                  key={type}
                  onClick={() => setActivePreview(type)}
                  className={`px-4 py-1 font-semibold rounded-t ${
                    activePreview === type
                      ? "border-b-2 border-blue-600 text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  {type.toUpperCase()}
                </button>
              ))}
            </div>
          )}
          <HStack>
            {activeTab === "PDD files" && (
              <IconButton
                bgColor={"droidalBlack.400"}
                border="1"
                size="lg"
                borderColor={"droidalBlack.100"}
                className="dark"
                onClick={() => {
                  toggleFullScreen();
                }}
              >
                {fullscreen && <ShrinkIcon />}
                {!fullscreen && <Expand />}
              </IconButton>
            )}
          </HStack>
        </HStack>
        <Box className="border border-[#585757] rounded-lg px-0 py-4 h-[75vh] flex flex-col justify-start items-center overflow-auto bg-transparent">
          {/* PDF Preview */}
          {activeTab === "PDD files" &&
            activePreview === "pdf" &&
            categorizedFiles.pdf.length > 0 && (
              <Bleed
                ref={elementRef}
                inline={4}
                w="full"
                position={"relative"}
                h="full"
                block={4}
              >
                <div
                  style={{
                    right: 350,
                    top: 15,
                  }}
                  className="absolute z-10"
                >
                  {fullscreen && (
                    <IconButton
                      bgColor={"droidalBlack.400"}
                      border="1"
                      size="lg"
                      borderColor={"droidalBlack.100"}
                      className="dark"
                      onClick={() => {
                        toggleFullScreen();
                      }}
                    >
                      <ShrinkIcon />
                    </IconButton>
                  )}
                </div>
                <div className="flex w-full h-full gap-4">
                  {/* PDF buttons on the left */}
                  <div className="w-1/10 flex flex-col h-full overflow-auto border-r border-gray-300 pr-2">
                    {categorizedFiles.pdf.map((file, index) => (
                      <div style={{ paddingLeft: "20px" }}>
                        <Tooltip content={file.file_name}>
                          <img
                            key={index}
                            src="/pdf-svgrepo-com.svg"
                            className={[
                              "m-1 ml-4",
                              selectedPdf === file.file_url ? "" : "grayscale",
                            ].join(" ")}
                            style={{ width: "50px", height: "50px" }}
                            onClick={() => setSelectedPDF(file.file_url)}
                          />
                        </Tooltip>
                        <span className="text-[11px]">{file.file_name}</span>
                      </div>
                    ))}
                  </div>

                  {/* PDF Preview on the right */}
                  <div className="flex-1">
                    {selectedPdf ? (
                      <iframe
                        src={selectedPdf}
                        title="PDF Preview"
                        className="w-full h-full rounded-lg"
                        style={{ minHeight: "500px" }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        Select a PDF to preview
                      </div>
                    )}
                  </div>
                </div>
              </Bleed>
            )}

          {/* Audio Preview */}
          {activeTab === "PDD files" &&
            activePreview === "audio" &&
            categorizedFiles.audio.length > 0 && (
              <Bleed
                ref={elementRef}
                inline={4}
                w="full"
                position={"relative"}
                h="full"
                block={4}
              >
                <div
                  style={{
                    right: 350,
                    top: 15,
                  }}
                  className="absolute z-10"
                >
                  {fullscreen && (
                    <IconButton
                      bgColor={"droidalBlack.400"}
                      border="1"
                      size="lg"
                      borderColor={"droidalBlack.100"}
                      className="dark"
                      onClick={() => {
                        toggleFullScreen();
                      }}
                    >
                      <ShrinkIcon />
                    </IconButton>
                  )}
                </div>
                <div className="flex w-full h-full gap-4">
                  {/* PDF buttons on the left */}
                  <div className="w-1/10 flex flex-col h-full overflow-auto border-r border-gray-300 pr-2">
                    {categorizedFiles.audio.map((file, index) => (
                      <div style={{ paddingLeft: "10px" }}>
                        <Tooltip content={file.file_name}>
                          <img
                            key={index}
                            src="/mp3.png"
                            className={[
                              "m-1 ml-5",
                              selectedaudio === file.file_url
                                ? ""
                                : "grayscale",
                            ].join(" ")}
                            style={{ width: "50px", height: "50px" }}
                            onClick={() => setSelectedAUDIO(file.file_url)}
                          />
                        </Tooltip>
                        <span className="text-[11px]">{file.file_name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex-1 h-full flex items-center justify-center">
                    {selectedaudio ? (
                      <AudioPlayer
                        title={"Audio Player"}
                        src={selectedaudio}
                        isAba={true}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        Select a Audio to play
                      </div>
                    )}
                  </div>
                </div>
              </Bleed>
            )}
          {/* Video Preview */}
          {activeTab === "PDD files" &&
            activePreview === "video" &&
            categorizedFiles.video.length > 0 && (
              <Bleed
                ref={elementRef}
                inline={4}
                w="full"
                position={"relative"}
                h="full"
                block={4}
              >
                <div
                  style={{
                    right: 350,
                    top: 15,
                  }}
                  className="absolute z-10"
                >
                  {fullscreen && (
                    <IconButton
                      bgColor={"droidalBlack.400"}
                      border="1"
                      size="lg"
                      borderColor={"droidalBlack.100"}
                      className="dark"
                      onClick={() => {
                        toggleFullScreen();
                      }}
                    >
                      <ShrinkIcon />
                    </IconButton>
                  )}
                </div>
                <div className="flex w-full h-full gap-4">
                  {/* PDF buttons on the left */}
                  <div className="w-1/10 flex flex-col h-full overflow-auto border-r border-gray-300 pr-2">
                    {categorizedFiles.video.map((file, index) => (
                      <div style={{ paddingLeft: "10px" }}>
                        <Tooltip content={file.file_name}>
                          <img
                            key={index}
                            src="/video.png"
                            className={[
                              "m-1 ml-5",
                              selectedVideo === file.file_url
                                ? ""
                                : "grayscale",
                            ].join(" ")}
                            style={{ width: "50px", height: "50px" }}
                            onClick={() => setSelectedVIDEO(file.file_url)}
                          />
                        </Tooltip>
                        <span className="text-[11px]">{file.file_name}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 h-full flex items-center justify-center">
                    {selectedVideo ? (
                      // <AspectRatio ratio={16 / 9}>
                      <video
                        key={selectedVideo}
                        controls
                        className="w-full rounded-lg h-full"
                      >
                        <source src={selectedVideo} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      // </AspectRatio>
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <p>No video files available.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Bleed>
            )}

          {/* Text Files */}
          {activeTab === "PDD files" &&
            activePreview === "text" &&
            categorizedFiles.text.length > 0 && (
              <Bleed
                ref={elementRef}
                inline={4}
                w="full"
                position={"relative"}
                h="full"
                block={4}
              >
                <div
                  style={{
                    right: 350,
                    top: 15,
                  }}
                  className="absolute z-10"
                >
                  {fullscreen && (
                    <IconButton
                      bgColor={"droidalBlack.400"}
                      border="1"
                      size="lg"
                      borderColor={"droidalBlack.100"}
                      className="dark"
                      onClick={() => {
                        toggleFullScreen();
                      }}
                    >
                      <ShrinkIcon />
                    </IconButton>
                  )}
                </div>
                <div className="flex w-full h-full gap-4">
                  {/* PDF buttons on the left */}
                  <div className="w-1/10 flex flex-col  h-full overflow-auto border-r border-gray-300 pr-2">
                    {categorizedFiles.text.map((file, index) => (
                      <div style={{ paddingLeft: "10px" }}>
                        <Tooltip content={file.file_name}>
                          <img
                            key={index}
                            src="/txt-file.png"
                            className={[
                              "m-1 ml-5",
                              selectedTxt === file.file_url ? "" : "grayscale",
                            ].join(" ")}
                            style={{ width: "50px", height: "50px" }}
                            onClick={() => setSelectedTXT(file.file_url)}
                          />
                        </Tooltip>
                        <span className="text-[11px]">{file.file_name}</span>
                      </div>
                    ))}
                  </div>
                  <div className="w-full mx-auto">
                    {selectedTxt ? (
                      <iframe
                        className="w-full h-full"
                        src={selectedTxt}
                        title="Text File"
                        style={{ minHeight: 300 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <p>No Text files available.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Bleed>
            )}
          {activeTab === "PDD files" &&
            activePreview === "docx" &&
            categorizedFiles.doc.length > 0 && (
              <Bleed
                ref={elementRef}
                inline={4}
                w="full"
                position={"relative"}
                h="full"
                block={4}
              >
                <div
                  style={{
                    right: 350,
                    top: 15,
                  }}
                  className="absolute z-10"
                >
                  {fullscreen && (
                    <IconButton
                      bgColor={"droidalBlack.400"}
                      border="1"
                      size="lg"
                      borderColor={"droidalBlack.100"}
                      className="dark"
                      onClick={() => {
                        toggleFullScreen();
                      }}
                    >
                      <ShrinkIcon />
                    </IconButton>
                  )}
                </div>
                <div className="flex w-full h-full gap-4">
                  {/* DOCX buttons on the left */}
                  <div className="w-1/10 flex flex-col h-full overflow-auto border-r border-gray-300 pr-2">
                    {categorizedFiles.doc.map((file, index) => (
                      <div style={{ paddingLeft: "10px" }}>
                        <Tooltip content={file.file_name} key={index}>
                          <img
                            src="/word.png"
                            className={[
                              "m-1 ml-5 cursor-pointer",
                              selectedDox === file.file_url ? "" : "grayscale",
                            ].join(" ")}
                            style={{
                              width: "50px",
                              height: "50px",
                            }}
                            onClick={() => setSelectedDox(file.file_url)}
                          />
                        </Tooltip>
                        <span className="text-[11px]">{file.file_name}</span>
                      </div>
                    ))}
                  </div>

                  {/* DOCX preview */}
                  <div className="w-full mx-auto">
                    {selectedDox ? (
                      <iframe
                        className="w-full h-full"
                        src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(
                          selectedDox
                        )}`}
                        title="Document File"
                        style={{ minHeight: 300 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <p>No Document files available.</p>
                      </div>
                    )}
                  </div>
                </div>
              </Bleed>
            )}

          {/* Code Files */}
          {activeTab === "code" &&
            (categorizedFiles.code.length ? (
              <div className="w-full overflow-auto h-full bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
                {categorizedFiles.code.map(({ file_name, file_url }, idx) => (
                  <div key={idx} className="mb-2 h-full">
                    <iframe
                      className="w-full h-full"
                      src={file_url}
                      title="Text File"
                      style={{ minHeight: 300 }}
                    />
                    {/* {file_name} */}
                  </div>
                ))}
              </div>
            ) : (
              <p>No code files available.</p>
            ))}

          {/* Steps Here */}
          {activeTab === "steps" &&
            (categorizedFiles.others.length ? (
              (() => {
                const stepsFile = categorizedFiles.others.find(
                  (f) => f.file_name === "recorded_steps.json"
                );

                return stepsFile ? (
                  <div className="w-full overflow-auto h-full bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
                    <iframe
                      className="w-full h-full"
                      src={stepsFile.file_url}
                      title="Text File"
                      style={{ minHeight: 300 }}
                    />
                    {/* {stepsFile.file_name} */}
                  </div>
                ) : (
                  <p>No steps available.</p>
                );
              })()
            ) : (
              <p>No steps available.</p>
            ))}

          {/* Tabs without preview */}
          {activeTab === "flowChart" &&
            (categorizedFiles.others.length ? (
              (() => {
                const stepsFile = categorizedFiles.others.find(
                  (f) => f.file_name === "flowchart.json"
                );

                return stepsFile ? (
                  <div className="w-full overflow-auto h-full bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
                    <iframe
                      className="w-full h-full"
                      src={stepsFile.file_url}
                      title="Text File"
                      style={{ minHeight: 300 }}
                    />
                    {/* {stepsFile.file_name} */}
                  </div>
                ) : (
                  <p>Flow Chart Content Here</p>
                );
              })()
            ) : (
              <p>Flow Chart Content Here</p>
            ))}
          {/* {activeTab === "flowChart" && <div>Flow Chart Content Here</div>} */}
          {activeTab === "Code Builder" && (
            <Bleed
              ref={elementRef}
              inline={4}
              w="full"
              position={"relative"}
              h="full"
              block={4}
            >
              <div
                style={{
                  right: 350,
                  top: 15,
                }}
                className="absolute z-10"
              >
                {fullscreen && (
                  <IconButton
                    bgColor={"droidalBlack.400"}
                    border="1"
                    size="lg"
                    borderColor={"droidalBlack.100"}
                    className="dark"
                    onClick={() => {
                      toggleFullScreen();
                    }}
                  >
                    <ShrinkIcon />
                  </IconButton>
                )}
              </div>
              <ABACodeBuilder taskName={selectTask?.task_name} />
            </Bleed>
          )}
        </Box>
      </div>
    </div>
  );
}

export default TaskDetailsPanel;

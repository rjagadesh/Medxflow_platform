import React, {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import {
  Box,
  HStack,
  Text,
  Button,
  Input,
  VStack,
  Tabs,
  Code,
  Flex,
  Menu,
  IconButton,
  Slider,
  Center,
  Spinner,
} from "@chakra-ui/react";
import {
  Search,
  Download,
  FileText,
  User,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileJson,
  Activity,
  Filter,
  Check,
  Plus,
  X,
  Calendar,
  Clock,
  PanelRightClose,
  PanelRightOpen,
  EditIcon,
} from "lucide-react";
import GenericTable from "../../components/table/table";
import CustomSelect from "../../components/ui/select";
import CustomButton from "@/components/button/button";
import { toaster } from "@/components/ui/toaster";
import { PhoneIncomingIcon } from "lucide-react";
import { PhoneOutgoingIcon } from "lucide-react";
import VoiceAiHeader from "./components/voice-ai-header";
import DateRangeCalendar from "../../components/data-range-picker/date-range-picker";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { parseAsString, useQueryStates } from "nuqs";
import { useGetCallLogs } from "@/hooks/query/voiceai/useGetCallLogs";
import { useGetRequest } from "@/hooks/query/agents-app/useGetRequest";
import { useGetAPIkey } from "@/hooks/query/agentsapp/useGetAPIkey";
import { useGetColumnData } from "@/hooks/query/admin/useGetColumnData";
import { useGetOutputFiles } from "@/hooks/query/agentsapp/useGetOutputFiles";
import { useGetStatusCount } from "@/hooks/query/agentsapp/useGetStatusCount";
import { atobAgentId, convertNumberToShortHand } from "@/utils/helper";
import getStatusIcon from "@/utils/status-icon";
import { ArrowRight } from "lucide-react";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import { useAuth } from "@/store/providers/auth-provider";
import { useExportAgentTasks } from "@/utils/ExportAgentsTasks";
import AudioPlayer from "@/components/viewers/audio-player";
import { JsonCopyPopover } from "@/components/json-popover/json-popover";
import { Maximize2Icon } from "lucide-react";
import JsonViewer from "@/components/viewers/json-viewer";
import { CodeIcon } from "lucide-react";
import RequestForm from "../../features/insurance-verification/modal/request";
import { ChevronsRight } from "lucide-react";
import {
  downloadTextFile,
  downloadJsonFile,
  fetchAudioUrl,
} from "@/utils/download-utils";
import { SettingsIcon } from "lucide-react";
import { DownloadIcon } from "lucide-react";
import { format } from "date-fns";
import { Tooltip } from "@/components/ui/tooltip";

const RequestEditButton = ({ row, onEdit }) => {
  return (
    <Button
      variant="outline"
      size="sm"
      color="white"
      borderRadius={"lg"}
      borderColor="gray.600"
      _hover={{ bg: "whiteAlpha.200" }}
      px={2}
      title="Edit"
      onClick={(e) => {
        e.stopPropagation();
        onEdit(row);
      }}
    >
      <EditIcon size={16} />
    </Button>
  );
};

function formatSeconds(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${parseInt(seconds.toString().padStart(2, "0"))}`;
}

const VoiceAiDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("records");
  const [selectedRow, setSelectedRow] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useQueryStates({
    search: parseAsString.withDefault(""),
    "search-in": parseAsString.withDefault(""),
    clicked: parseAsString.withDefault("0"),
  });
  const { agent_app } = useParams();
  const agentId = agent_app ? atobAgentId(agent_app) : "";
  const [page, setPage] = useState(1);

  const [leftPanelWidth, setLeftPanelWidth] = useState(65);
  const [isResizing, setIsResizing] = useState(false);
  const [isRightPanelShrunk, setIsRightPanelShrunk] = useState(true);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Constrain between 20% and 80%
      if (newLeftWidth >= 20 && newLeftWidth <= 80) {
        setLeftPanelWidth(newLeftWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "none";
      document.body.style.cursor = "col-resize";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [isResizing]);

  // Get values from URL
  const status = searchParams.get("status") || "All";
  const direction = searchParams.get("direction") || "All";
  const ordering = searchParams.get("ordering") || "-created_at";

  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const dateRange = useMemo(() => {
    return {
      startDate: startDateParam
        ? new Date(startDateParam)
        : new Date(new Date().setDate(new Date().getDate() - 30)),
      endDate: endDateParam ? new Date(endDateParam) : new Date(),
    };
  }, [startDateParam, endDateParam]);

  const { data: { api_key = "" } = {} } = useGetAPIkey(agentId);
  const { data: kpiStatus = {} } = useGetStatusCount(api_key);
  const { data: selectedAppData = {} } = useGetColumnData(agentId, true);
  const { hasPermission } = usePermissions();

  console.log("selectedAppData", selectedAppData);

  const [editRowData, setEditRowData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { refetch: exportRefetch } = useExportAgentTasks(agentId, [
    {
      startDate: format(dateRange.startDate, "yyyy-MM-dd") + "T00:00:00.000Z",
      endDate: format(dateRange.endDate, "yyyy-MM-dd") + "T23:59:59.000Z",
      key: "selection",
    },
  ]);

  const handleExport = async () => {
    if (!hasPermission("requests_table_view_export", "create")) {
      toaster.error({
        title: "Permission Denied",
        description: "You do not have permission to export records.",
      });
      return;
    }
    try {
      await exportRefetch();
    } catch (err) {
      console.error("Error exporting CSV:", err);
      toaster.error({
        title: "Export Failed",
        description:
          typeof err === "string"
            ? err
            : "There was an error exporting the CSV.",
      });
    }
  };

  const { data: requestData = {}, isLoading: isRequestLoading } = useGetRequest(
    {
      api_key,
      enabled: !!api_key && activeTab === "records",
      appId: agentId,
      status: status !== "All" ? status : undefined,
      page_size: 10,
      page: page,
      ordering,
      direction: direction !== "All" ? direction : undefined,
      [`data__${searchQuery["search-in"]}`]: searchQuery.search,
      clicked: searchQuery.clicked,
      start_date: format(dateRange.startDate, "yyyy-MM-dd"),
      end_date: format(dateRange.endDate, "yyyy-MM-dd"),
    },
  );

  const { data: callLogsData = [], isLoading: isCallLogsLoading } =
    useGetCallLogs({
      api_key,
      enabled: !!api_key && !!user?.id,
      appId: agentId,
      userId: user?.id,
      // status: status !== "All" ? status : undefined,
      // page_size: 10,
      // page: page,
      // ordering,
      // direction: direction !== "All" ? direction : undefined,
      // [`data__${searchQuery["search-in"]}`]: searchQuery.search,
      // clicked: searchQuery.clicked,
    });

  const isLoading =
    activeTab === "records" ? isRequestLoading : isCallLogsLoading;

  // Output Files Logic
  const { data: outputFiles } = useGetOutputFiles(
    {
      agentid: selectedRow?.id,
      secretkey: api_key,
    },
    { enabled: !!selectedRow && !!api_key },
  );

  const [audioUrl, setAudioUrl] = useState(null);
  const [transcriptText, setTranscriptText] = useState("");
  const [jsonText, setJsonText] = useState("");
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);
  const [isJsonLoading, setIsJsonLoading] = useState(false);

  useEffect(() => {
    let isActive = true;
    const files =
      outputFiles?.files || (Array.isArray(outputFiles) ? outputFiles : []);

    // --- AUDIO ---
    setAudioUrl(null);
    const loadAudio = async () => {
      if (selectedRow?.recording_s3_url) {
        const resolvedUrl = await fetchAudioUrl(selectedRow.recording_s3_url);
        if (isActive) {
          setAudioUrl(resolvedUrl || null);
        }
        return;
      }

      const audioFile = files.find(
        (f) =>
          f.mime_type?.startsWith("audio/") ||
          f.file_name?.endsWith(".wav") ||
          f.file_name?.endsWith(".mp3"),
      );
      if (isActive) {
        setAudioUrl(
          audioFile?.file_url?.replace("http://", "https://") || null,
        );
      }
    };

    loadAudio().catch((err) => {
      console.error("Failed to load audio URL", err);
      if (isActive) {
        setAudioUrl(null);
      }
    });

    // --- TRANSCRIPT ---
    const transcriptUrl = selectedRow?.transcript_s3_url
      ? selectedRow.transcript_s3_url.replace("http://", "https://")
      : files
          .find((f) => f.mime_type === "text/plain")
          ?.file_url?.replace("http://", "https://");

    if (transcriptUrl) {
      if (isActive) setIsTranscriptLoading(true);
      downloadTextFile(transcriptUrl)
        .then((text) => {
          if (isActive) {
            setTranscriptText(text);
            setIsTranscriptLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load transcript", err);
          if (isActive) setIsTranscriptLoading(false);
        });
    } else {
      if (isActive) {
        setTranscriptText("");
        setIsTranscriptLoading(false);
      }
    }

    // --- JSON ---
    const jsonUrl = selectedRow?.extracted_s3_url
      ? selectedRow.extracted_s3_url.replace("http://", "https://")
      : files
          .find((f) => f.mime_type === "application/json")
          ?.file_url?.replace("http://", "https://");

    if (jsonUrl) {
      if (isActive) setIsJsonLoading(true);
      downloadJsonFile(jsonUrl)
        .then((data) => {
          if (isActive) {
            setJsonText(JSON.stringify(data, null, 2));
            setIsJsonLoading(false);
          }
        })
        .catch((err) => {
          console.error("Failed to load JSON", err);
          if (isActive) setIsJsonLoading(false);
        });
    } else {
      if (isActive) {
        setJsonText("");
        setIsJsonLoading(false);
      }
    }

    return () => {
      isActive = false;
    };
  }, [outputFiles, selectedRow]);

  // Helper to update params
  const updateParam = useCallback(
    (key, value) => {
      console.log("updateParam", key, value);
      const prev = new URLSearchParams(searchParams);
      if (value && value !== "All" && value !== "all" && value !== "") {
        prev.set(key, value);
      } else {
        prev.delete(key);
      }
      setSearchParams(prev);
      setPage(1); // Reset page on filter change
    },
    [searchParams, setSearchParams],
  );

  const updateDateRange = (range) => {
    const prev = new URLSearchParams(searchParams);
    if (range?.startDate) prev.set("startDate", range.startDate.toISOString());
    if (range?.endDate) prev.set("endDate", range.endDate.toISOString());
    setSearchParams(prev);
    setPage(1); // Reset page on date change
  };

  const handleSearch = () => {
    if (!searchQuery["search-in"]) {
      toaster.error({
        title: "Error",
        description: "Select the `search In` field",
      });
      return;
    }
    if (!searchQuery.search) {
      toaster.error({
        title: "Error",
        description: "Enter the value to search",
      });
      return;
    }
    setSearchQuery((prev) => ({
      ...prev,
      clicked: String((Number(prev.clicked) || 0) + 1),
    }));
    setPage(1);
  };

  const handleClear = () => {
    setSearchQuery({
      search: "",
      "search-in": "",
      clicked: "0",
    });
  };

  const handleResetTableFilters = useCallback(() => {
    const prev = new URLSearchParams(searchParams);
    ["status", "direction", "ordering", "startDate", "endDate"].forEach((key) =>
      prev.delete(key),
    );
    setSearchParams(prev);
    setSearchQuery({
      search: "",
      "search-in": "",
      clicked: "0",
    });
    setPage(1);
  }, [searchParams, setSearchParams, setSearchQuery]);

  const handleSortChange = (value) => {
    updateParam("ordering", value);
  };

  const kpiCounts = useMemo(() => {
    return {
      completed: kpiStatus["SUCCESS"] || 0,
      failed: kpiStatus["FAILURE"] || 0,
    };
  }, [kpiStatus]);

  const statusOptions = useMemo(() => {
    // const dynamicStatuses = Object.keys(kpiStatus || {}).filter(Boolean);
    // const fallbackStatuses = ["SUCCESS", "FAILURE", "PENDING", "FAILED", "NEW"];
    // const uniqueStatuses = Array.from(
    //   new Set(
    //     [...dynamicStatuses, ...fallbackStatuses, status].filter(
    //       (s) => s && s !== "All",
    //     ),
    //   ),
    // );
    return [
      {
        label: "All",
        value: "All",
      },
      {
        label: "Completed",
        value: "SUCCESS",
      },
      {
        label: "Failed",
        value: "FAILURE",
      },
      {
        label: "Call In Progress",
        value: "PENDING",
      },
      {
        label: "New",
        value: "NEW",
      },
    ];
  }, []);

  const formatFilterLabel = (value) => {
    if (value === "All") return "All";
    return String(value)
      .toLowerCase()
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      status !== "All" ||
      direction !== "All" ||
      searchParams.get("ordering") ||
      searchParams.get("startDate") ||
      searchParams.get("endDate") ||
      searchQuery.search ||
      searchQuery["search-in"],
    );
  }, [status, direction, searchParams, searchQuery]);

  const filteredData = useMemo(() => {
    if (activeTab === "records") {
      return (
        requestData?.results?.map((item) => {
          return {
            ...item?.data,
            ...(item?.calllog || {}),
            ...item,
          };
        }) || []
      );
    } else {
      const results = Array.isArray(callLogsData)
        ? callLogsData
        : callLogsData?.results || [];
      return results
        .filter((item) => !item.agent_task)
        .map((item) => {
          return {
            ...item,
          };
        });
    }
  }, [requestData, callLogsData, activeTab]);

  useMemo(() => {
    if (!selectedRow && filteredData.length > 0) {
      setSelectedRow(filteredData[0]);
    }
  }, [filteredData, selectedRow]);

  console.log("selectedRow", selectedRow, filteredData, api_key);
  const columns = useMemo(() => {
    if (activeTab === "records") {
      return [
        {
          title: "Queue Uploaded At",
          accessor_key: "created_at",
          render: (value) => (
            <HStack gap={2}>
              <Text>{value ? new Date(value).toLocaleString() : "N/A"}</Text>
            </HStack>
          ),
        },
        {
          title: "From",
          accessor_key: "latest_call_from_number",
          render: (_, row) => (
            <HStack gap={2}>
              <Text>{row.from_number ? row.from_number : "N/A"}</Text>
            </HStack>
          ),
        },
        {
          title: "To",
          accessor_key: "latest_call_to_number",
          render: (value, row) => (
            <HStack gap={2}>
              <Text>{row.to_number ? row.to_number : "N/A"}</Text>
            </HStack>
          ),
        },
        {
          title: "Start Time",
          accessor_key: "latest_call_start_time",
          render: (_, row) => (
            <HStack gap={2}>
              <Text>
                {row.start_time
                  ? new Date(row.start_time).toLocaleString()
                  : "N/A"}
              </Text>
            </HStack>
          ),
        },
        {
          title: "End Time",
          accessor_key: "latest_call_end_time",
          render: (_, row) => (
            <HStack gap={2}>
              <Text>
                {row.end_time ? new Date(row.end_time).toLocaleString() : "N/A"}
              </Text>
            </HStack>
          ),
        },
        // {
        //   title: (
        //     <HStack align="center" px={0} gap={2}>
        //       <Text>Direction</Text>
        //       <Menu.Root>
        //         <Menu.Trigger asChild>
        //           <IconButton
        //             size="xs"
        //             variant="ghost"
        //             color={direction !== "All" ? "blue.400" : "gray.400"}
        //             onClick={(e) => e.stopPropagation()}
        //           >
        //             <Filter size={14} />
        //           </IconButton>
        //         </Menu.Trigger>
        //         <Menu.Positioner>
        //           <Menu.Content
        //             zIndex={100}
        //             bg="droidalBlack.300"
        //             border="1px solid"
        //             borderColor="whiteAlpha.200"
        //           >
        //             {["All", "incoming", "outgoing"].map((opt) => (
        //               <Menu.Item
        //                 key={opt}
        //                 value={opt}
        //                 bg="transparent"
        //                 _hover={{ bg: "whiteAlpha.100" }}
        //                 cursor="pointer"
        //                 onClick={(e) => {
        //                   e.stopPropagation();
        //                   updateParam("direction", opt);
        //                 }}
        //                 p={2}
        //               >
        //                 <HStack justify="space-between" width="full" gap={4}>
        //                   <Text color="white">
        //                     {opt === "All"
        //                       ? "All"
        //                       : opt.charAt(0).toUpperCase() + opt.slice(1)}
        //                   </Text>
        //                   {direction === opt && (
        //                     <Check size={14} color="white" />
        //                   )}
        //                 </HStack>
        //               </Menu.Item>
        //             ))}
        //           </Menu.Content>
        //         </Menu.Positioner>
        //       </Menu.Root>
        //     </HStack>
        //   ),
        //   accessor_key: "direction",
        //   render: (value) => {
        //     return (
        //       <HStack
        //         color={
        //           value
        //             ? value === "incoming"
        //               ? "blue.500"
        //               : "orange.500"
        //             : "inherit"
        //         }
        //         gap={2}
        //         justify={"center"}
        //       >
        //         {value ? (
        //           value === "incoming" ? (
        //             <>
        //               <PhoneIncomingIcon />
        //               <span>Incoming</span>
        //             </>
        //           ) : (
        //             <>
        //               <PhoneOutgoingIcon />
        //               <span>Outgoing</span>
        //             </>
        //           )
        //         ) : (
        //           <>
        //             <span>N/a</span>
        //           </>
        //         )}
        //       </HStack>
        //     );
        //   },
        // },
        {
          title: "Duration",
          accessor_key: "latest_call_duration_seconds",
          render: (_, row) => (
            <HStack gap={2}>
              <Text>
                {row.calllog?.duration
                  ? formatSeconds(row.calllog.duration)
                  : "N/A"}
              </Text>
            </HStack>
          ),
        },
        ...(selectedAppData?.columns
          ?.filter((column) => column.active)
          ?.map((column) => {
            return {
              ...column,
              title: column.name,
              accessor_key: column.name,
              render: (column_value) => {
                return column_value ? column_value : "N/A";
              },
            };
          }) || []),
        {
          title: (
            <HStack align="center" px={0} gap={2}>
              <Text>Status</Text>
              <Menu.Root>
                <Menu.Trigger asChild>
                  <IconButton
                    size="xs"
                    variant="ghost"
                    color={status !== "All" ? "blue.400" : "gray.400"}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Filter size={14} />
                  </IconButton>
                </Menu.Trigger>
                <Menu.Positioner>
                  <Menu.Content
                    zIndex={100}
                    bg="droidalBlack.300"
                    border="1px solid"
                    borderColor="whiteAlpha.200"
                  >
                    {statusOptions.map((opt) => (
                      <Menu.Item
                        key={opt.value}
                        value={opt.value}
                        bg="transparent"
                        _hover={{ bg: "whiteAlpha.100" }}
                        cursor="pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          updateParam("status", opt.value);
                        }}
                        p={2}
                      >
                        <HStack justify="space-between" width="full" gap={4}>
                          <Text color="white">{opt.label}</Text>
                          {status === opt.value && (
                            <Check size={14} color="white" />
                          )}
                        </HStack>
                      </Menu.Item>
                    ))}
                  </Menu.Content>
                </Menu.Positioner>
              </Menu.Root>
            </HStack>
          ),
          accessor_key: "status",
          tableProps: { "data-sticky": "end0" },

          render: (value) => (
            <>
              {value === "SUCCESS"
                ? getStatusIcon("completed")
                : value === "PENDING"
                  ? getStatusIcon("Call In Progress")
                  : getStatusIcon(value)}{" "}
            </>
          ),
        },
        {
          title: "Actions",
          accessor_key: "actions",
          tableProps: { "data-sticky": "end" },
          render: (_, row) => (
            <HStack
              gap={{
                base: 1,
                "3xl": 2,
              }}
            >
              {selectedRow?.id === row?.id ? (
                <HStack>
                  <RequestEditButton
                    row={row}
                    onEdit={(rowData) => {
                      if (
                        hasPermission(
                          "requests_table_edit_process_delete",
                          "create",
                        )
                      ) {
                        setEditRowData(rowData);
                        setIsEditModalOpen(true);
                      }
                    }}
                  />
                  <HStack gap={0} justify={"flex-end"}>
                    <ChevronsRight className="relative -right-2" />
                    <ChevronsRight />
                  </HStack>
                </HStack>
              ) : (
                <>
                  <RequestEditButton
                    row={row}
                    onEdit={(rowData) => {
                      if (
                        hasPermission(
                          "requests_table_edit_process_delete",
                          "create",
                        )
                      ) {
                        setEditRowData(rowData);
                        setIsEditModalOpen(true);
                      }
                    }}
                  />
                  <CustomButton
                    size="xs"
                    onClick={() => {
                      setSelectedRow(row);
                      setIsRightPanelShrunk(false);
                    }}
                  >
                    <span className="inline-flex gap-2">
                      <span>View</span> <ArrowRight />
                    </span>
                  </CustomButton>
                </>
              )}
            </HStack>
          ),
        },
      ];
    } else {
      return [
        {
          title: "Date",
          accessor_key: "created_at",
          render: (value) => (
            <HStack gap={2}>
              <Text>{value ? value : "N/A"}</Text>
            </HStack>
          ),
        },
        {
          title: "From",
          accessor_key: "from_number",
          render: (value) => (
            <HStack gap={2}>
              <Text>{value ? value : "N/A"}</Text>
            </HStack>
          ),
        },
        {
          title: "To",
          accessor_key: "to_number",
          render: (value) => (
            <HStack gap={2}>
              <Text>{value ? value : "N/A"}</Text>
            </HStack>
          ),
        },
        // {
        //   title: "Direction",
        //   accessor_key: "direction",
        //   render: (value) => (
        //     <HStack
        //       color={
        //         value
        //           ? value === "incoming"
        //             ? "blue.500"
        //             : "orange.500"
        //           : "inherit"
        //       }
        //       gap={2}
        //       justify={"center"}
        //     >
        //       {value ? (
        //         value === "incoming" ? (
        //           <>
        //             <PhoneIncomingIcon />
        //             <span>Incoming</span>
        //           </>
        //         ) : (
        //           <>
        //             <PhoneOutgoingIcon />
        //             <span>Outgoing</span>
        //           </>
        //         )
        //       ) : (
        //         <>
        //           <span>N/a</span>
        //         </>
        //       )}
        //     </HStack>
        //   ),
        // },
        {
          title: "Duration",
          accessor_key: "duration_seconds",
          render: (value, row) => (
            <HStack gap={2}>
              <Text>
                {row.duration_formatted
                  ? row.duration_formatted
                  : value
                    ? value + "s"
                    : "N/A"}
              </Text>
            </HStack>
          ),
        },
        {
          title: "Status",
          accessor_key: "status",
          tableProps: { "data-sticky": "end0" },
          render: (value) => getStatusIcon(value),
        },
        {
          title: "Actions",
          accessor_key: "actions",
          tableProps: { "data-sticky": "end" },
          render: (_, row) => (
            <HStack gap={2}>
              {selectedRow?.id === row?.id ? (
                <HStack gap={0} justify={"flex-end"}>
                  <ChevronsRight className="relative -right-2" />
                  <ChevronsRight />
                </HStack>
              ) : (
                <CustomButton
                  size="xs"
                  onClick={() => {
                    setSelectedRow(row);
                    setIsRightPanelShrunk(false);
                  }}
                >
                  <span className="inline-flex gap-2">
                    <span>View</span> <ArrowRight />
                  </span>
                </CustomButton>
              )}
            </HStack>
          ),
        },
      ];
    }
  }, [
    activeTab,
    direction,
    selectedRow?.id,
    selectedAppData,
    status,
    statusOptions,
    updateParam,
  ]);

  console.log("transcriptText1212", transcriptText);
  console.log("filteredData", filteredData);
  console.log("callLogsData", callLogsData);
  return (
    <Flex direction="column" h="full" overflow="hidden">
      <VoiceAiHeader />
      <Flex
        direction="column"
        bg="#1e1e1e"
        color="white"
        overflow="hidden"
        p={4}
        gap={4}
        flex="0.99"
        borderRadius={"xl"}
      >
        {/* Header & Filters Section */}
        <Box flexShrink={0}>
          <Box
            bg="droidalBlack.300"
            p={3}
            borderRadius="xl"
            className="bg-droidal-black-300"
          >
            <Flex justify="space-between" align="center" gap={4} wrap="nowrap">
              <HStack gap={4} minW="200px">
                <Text fontSize="xl" m={0} fontWeight="normal">
                  Records
                </Text>
                <HStack gap={2} fontSize="sm" color="gray.400">
                  <Text color="green.400">
                    Completed({convertNumberToShortHand(kpiCounts.completed)})
                  </Text>
                  <Text>|</Text>
                  <Text color="red.400">
                    Failed({convertNumberToShortHand(kpiCounts.failed)})
                  </Text>
                </HStack>
              </HStack>

              <HStack
                gap={0}
                // pl={{ "3xl": "50px" }}
                align="center"
                flex="1"
                minW="0"
                justifyContent={"center"}
              >
                <Input
                  placeholder="Search..."
                  bg="droidalBlack.300"
                  border="1px solid #2f4d78"
                  px={3}
                  borderRight={"none"}
                  borderRadius="4px 0px 0px 4px"
                  size="sm"
                  value={searchQuery.search}
                  onChange={(e) =>
                    setSearchQuery((prev) => ({
                      ...prev,
                      search: e.target.value,
                    }))
                  }
                  w="150px"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                  _focus={{ boxShadow: "none", bg: "droidalBlack.300" }}
                />
                <HStack gap={0}>
                  <Box className="relative">
                    <CustomSelect
                      borderRadius="0px"
                      className="relative"
                      value={[searchQuery["search-in"]]}
                      onValueChange={(val) => {
                        setSearchQuery((prev) => ({
                          ...prev,
                          "search-in": val[0],
                        }));
                      }}
                      size="sm"
                      options={selectedAppData?.columns?.map((column) => ({
                        label: column.name,
                        value: column.name,
                      }))}
                      css={{
                        "& button": {
                          borderRadius: "0px !important",
                          borderColor: "#2f4d78",
                          fontSize: "12px",
                        },
                      }}
                      placeholder="Select Field"
                      _placeholder={{ color: "gray.400" }}
                      w="130px"
                      borderRight="none"
                    />
                    <IconButton
                      aria-label="clear"
                      size="xs"
                      onClick={handleClear}
                      variant="ghost"
                      color="#2f4d78"
                      position={"absolute"}
                      className="right-5 top-0.5"
                      _hover={{ bg: "transparent", color: "white" }}
                    >
                      <X size={14} />
                    </IconButton>
                  </Box>
                  <IconButton
                    aria-label="clear"
                    size="sm"
                    onClick={handleSearch}
                    variant="outline"
                    color="#2f4d78"
                    border="1px solid #2f4d78"
                    borderRadius={"0px 4px 4px 0px"}
                    _hover={{ bg: "transparent", color: "white" }}
                  >
                    <Search size={12} />
                  </IconButton>
                </HStack>
              </HStack>

              <HStack gap={3} flexShrink={0}>
                <DateRangeCalendar
                  date={dateRange}
                  inputProps={{
                    size: "sm",
                  }}
                  onChange={updateDateRange}
                />

                <RequestForm
                  isVoiceAi={true}
                  inputs={selectedAppData?.columns || []}
                >
                  <CustomButton size="sm" leftIcon={<Plus size={16} />}>
                    Add Record
                  </CustomButton>
                </RequestForm>
                <Tooltip content="View API documentation, endpoints, and usage examples">
                  <IconButton
                    aria-label="code"
                    size="sm"
                    onClick={() => navigate("api-docs")}
                    variant="ghost"
                    color="#2f4d78"
                    border="1px solid #2f4d78"
                    borderRadius={"4px"}
                    _hover={{ bg: "transparent", color: "white" }}
                  >
                    <CodeIcon size={16} />
                  </IconButton>
                </Tooltip>
                <Tooltip content="Manage your agent's input">
                  <IconButton
                    aria-label="code"
                    size="sm"
                    onClick={() => {
                      navigate("input");
                    }}
                    variant="ghost"
                    color="#2f4d78"
                    border="1px solid #2f4d78"
                    borderRadius={"4px"}
                    _hover={{ bg: "transparent", color: "white" }}
                  >
                    <SettingsIcon size={16} />
                  </IconButton>
                </Tooltip>
              </HStack>
            </Flex>
          </Box>
        </Box>

        {/* Main Content Area */}
        <Flex
          flex="1"
          gap={selectedRow ? 0 : 4}
          overflow="hidden"
          ref={containerRef}
        >
          {/* Table Panel */}
          <Box
            flex={selectedRow ? "none" : "1"}
            w={
              selectedRow
                ? isRightPanelShrunk
                  ? "calc(100% - 48px)"
                  : `${leftPanelWidth}%`
                : "100%"
            }
            transition={isResizing ? "none" : "width 0.3s ease"}
            h="full"
            overflow="hidden"
          >
            <Tabs.Root
              value={activeTab}
              onValueChange={(e) => {
                setActiveTab(e.value);
                setPage(1);
                setSelectedRow(null);
              }}
              variant="line"
              h="full"
              display="flex"
              flexDirection="column"
              css={{
                "& [data-selected][data-orientation=horizontal]": {
                  color: "#fff !important",
                },
                "& [data-selected][data-orientation=horizontal]::before": {
                  backgroundColor: "primary.400 !important",
                },
              }}
            >
              <Tabs.List
                position={"relative"}
                borderBottomColor="whiteAlpha.100"
                px={2}
              >
                <Tabs.Trigger value="records" fontSize="sm">
                  Outbound
                </Tabs.Trigger>
                <Tabs.Trigger value="call-log" fontSize="sm">
                  Inbound
                </Tabs.Trigger>
                <Button
                  position={"absolute"}
                  right={"4"}
                  variant="outline"
                  size="sm"
                  color="white"
                  borderColor="gray.600"
                  _hover={{ bg: "whiteAlpha.200" }}
                  px={4}
                  title="CSV export"
                  onClick={() => {
                    if (filteredData?.length === 0) {
                      return toaster.error({
                        title: "Error",
                        description: "No data to export",
                      });
                    }
                    handleExport();
                  }}
                >
                  <DownloadIcon />
                  Export
                </Button>
              </Tabs.List>

              <Tabs.Content
                className="!p-0"
                value="records"
                flex="1"
                overflow="hidden"
                p={0}
              >
                <GenericTable
                  data={filteredData}
                  columns={columns}
                  pagination={true}
                  count={requestData.count || 0}
                  page={page}
                  onPageChange={setPage}
                  sort={ordering}
                  onSortClick={handleSortChange}
                  isFiltered={hasActiveFilters}
                  onResetFilters={handleResetTableFilters}
                  loader={isLoading}
                  selectedRow={selectedRow}
                  onRowClick={(id) => {
                    setSelectedRow(id);
                    setIsRightPanelShrunk(false);
                  }}
                  selection={{
                    selectable: false,
                    checkboxProps: {},
                    onSelectChange: () => {},
                  }}
                  bodyHeight="calc(100vh - 280px)"
                />
              </Tabs.Content>
              <Tabs.Content
                className="!p-0"
                value="call-log"
                flex="1"
                overflow="hidden"
                p={0}
              >
                <GenericTable
                  data={filteredData}
                  columns={columns}
                  pagination={true}
                  count={
                    Array.isArray(callLogsData)
                      ? callLogsData.length
                      : callLogsData.count || 0
                  }
                  page={page}
                  onPageChange={setPage}
                  isFiltered={hasActiveFilters}
                  onResetFilters={handleResetTableFilters}
                  loader={isLoading}
                  selectedRow={selectedRow}
                  onRowClick={(id) => {
                    setSelectedRow(id);
                  }}
                  selection={{
                    selectable: false,
                    checkboxProps: {},
                    onSelectChange: () => {},
                  }}
                  bodyHeight="calc(100vh - 280px)"
                />
              </Tabs.Content>
            </Tabs.Root>
          </Box>

          {/* Resize Handle */}
          {selectedRow && !isRightPanelShrunk && (
            <Box
              w="16px"
              cursor="col-resize"
              display="flex"
              alignItems="center"
              justifyContent="center"
              onMouseDown={(e) => {
                e.preventDefault();
                setIsResizing(true);
              }}
              _hover={{ "& > div": { bg: "primary.400" } }}
              flexShrink={0}
            >
              <Box
                w="4px"
                h="40px"
                bg={isResizing ? "primary.400" : "whiteAlpha.200"}
                borderRadius="full"
                transition="background-color 0.2s"
              />
            </Box>
          )}

          {/* Details Panel */}
          {selectedRow && (
            <Box
              flex={isRightPanelShrunk ? "none" : "1"}
              w={isRightPanelShrunk ? "48px" : "auto"}
              bg="droidalBlack.300"
              borderRadius="xl"
              overflow="hidden"
              className="bg-droidal-black-300"
              display="flex"
              flexDirection="column"
              minH="0"
              border="1px solid"
              borderColor="whiteAlpha.100"
              transition="width 0.3s ease"
            >
              {/* Details Header */}
              <HStack
                justify={isRightPanelShrunk ? "center" : "space-between"}
                px={isRightPanelShrunk ? 1 : 4}
                py={3}
                borderBottom="1px solid"
                borderColor="whiteAlpha.100"
                flexShrink={0}
              >
                {!isRightPanelShrunk && (
                  <>
                    <HStack gap={3}>
                      <Text fontWeight="medium" fontSize="xs">
                        {selectedRow.from_number ||
                          selectedRow.fromPhoneNumber ||
                          selectedRow.phoneNumber}
                      </Text>
                    </HStack>
                    <HStack gap={4} color="gray.400" fontSize="xs">
                      {(selectedRow.created_at || selectedRow.date) && (
                        <HStack>
                          <Calendar size={12} />
                          <Text>
                            {selectedRow.start_time
                              ? new Date(
                                  selectedRow.start_time,
                                ).toLocaleString()
                              : new Date(
                                  selectedRow.created_at,
                                ).toLocaleString()}
                          </Text>
                        </HStack>
                      )}{" "}
                      {(selectedRow.duration_formatted ||
                        selectedRow.duration_seconds ||
                        selectedRow.duration) && (
                        <HStack>
                          <Clock size={12} />
                          <Text>{formatSeconds(selectedRow.duration)}</Text>
                        </HStack>
                      )}{" "}
                    </HStack>
                  </>
                )}
                <IconButton
                  aria-label={isRightPanelShrunk ? "Expand" : "Shrink"}
                  size="md"
                  variant="ghost"
                  color="gray.400"
                  _hover={{ color: "white", bg: "whiteAlpha.200" }}
                  onClick={() => setIsRightPanelShrunk(!isRightPanelShrunk)}
                >
                  {isRightPanelShrunk ? (
                    <PanelRightOpen size={24} />
                  ) : (
                    <PanelRightClose size={24} />
                  )}
                </IconButton>
              </HStack>

              {!isRightPanelShrunk && (
                <Tabs.Root
                  defaultValue="transcript"
                  variant="line"
                  flex="1"
                  display="flex"
                  flexDirection="column"
                  overflow="hidden"
                  minH="0"
                  css={{
                    "& [data-selected][data-orientation=horizontal]": {
                      color: "#fff !important",
                    },
                    "& [data-selected][data-orientation=horizontal]::before": {
                      backgroundColor: "primary.400 !important",
                    },
                  }}
                >
                  <Tabs.List
                    color={"red"}
                    px={4}
                    pt={2}
                    borderBottomColor="whiteAlpha.100"
                  >
                    <Tabs.Trigger
                      color={"#90a6c6"}
                      value="audio"
                      fontSize="sm"
                      pb={2}
                    >
                      <Volume2 size={14} style={{ marginRight: "6px" }} />
                      Audio
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      color={"#90a6c6"}
                      value="json"
                      fontSize="sm"
                      pb={2}
                    >
                      <FileJson size={14} style={{ marginRight: "6px" }} />
                      Output
                    </Tabs.Trigger>
                    <Tabs.Trigger
                      color={"#90a6c6"}
                      value="transcript"
                      fontSize="sm"
                      pb={2}
                    >
                      <FileText size={14} style={{ marginRight: "6px" }} />
                      Transcript
                    </Tabs.Trigger>
                  </Tabs.List>

                  <Tabs.Content
                    value="transcript"
                    flex="1"
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                    minH="0"
                    p={0}
                    m={0}
                  >
                    <Box flex="1" minH="0" p={4}>
                      {isTranscriptLoading ? (
                        <Center h="100%">
                          <Spinner color="white" />
                        </Center>
                      ) : transcriptText ? (
                        <Box
                          h={"calc(100vh - 320px)"}
                          overflowY="auto"
                          fontSize="sm"
                          color="gray.200"
                        >
                          {transcriptText.split("\n").map((line, index) => {
                            if (!line.trim()) return null;
                            const match = line.match(
                              /^(?:\[(.*?)\]\s*)?(AI|USER):\s*(.*)\r?$/i,
                            );
                            if (match) {
                              const [_, __, speaker, message] = match;
                              return (
                                <Box key={index} mb={2}>
                                  <Text
                                    as="span"
                                    color={
                                      speaker === "AI"
                                        ? "green.400"
                                        : "blue.400"
                                    }
                                    fontWeight="bold"
                                    mr={1}
                                  >
                                    {speaker}:
                                  </Text>
                                  <Text as="span">{message}</Text>
                                </Box>
                              );
                            }
                            return (
                              <Box key={index} mb={2}>
                                {line}
                              </Box>
                            );
                          })}
                        </Box>
                      ) : (
                        <Text color="gray.500" textAlign="center" py={4}>
                          No transcript available
                        </Text>
                      )}
                    </Box>
                  </Tabs.Content>

                  <Tabs.Content
                    value="audio"
                    flex="1"
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                    minH="0"
                    p={0}
                    m={0}
                  >
                    <Box flex="1" overflowY="auto" minH="0" p={4}>
                      {audioUrl ? (
                        <Box bg="blackAlpha.400" p={3} borderRadius="lg">
                          <AudioPlayer
                            key={`${selectedRow?.id || "recording"}-${audioUrl || "none"}`}
                            src={audioUrl}
                            title={
                              selectedRow.from_number ||
                              selectedRow.fromPhoneNumber ||
                              selectedRow.phoneNumber ||
                              "Recording"
                            }
                            isAba={true}
                            showCloseButton={false}
                            onLoadError={async () => {
                              if (selectedRow?.recording_s3_url) {
                                const resolvedUrl = await fetchAudioUrl(
                                  selectedRow.recording_s3_url,
                                );
                                setAudioUrl(resolvedUrl || null);
                              }
                            }}
                          />
                        </Box>
                      ) : (
                        <Center
                          flexDirection={"column"}
                          flex={1}
                          height={"full"}
                        >
                          <Text color="gray.400" textAlign="center">
                            No audio recording available
                          </Text>
                          <Text color="gray.500" textAlign="center" py={4}>
                            Turn on call recording to ensure all calls are
                            stored and accessible
                          </Text>
                        </Center>
                      )}
                    </Box>
                  </Tabs.Content>

                  <Tabs.Content
                    value="json"
                    flex="1"
                    display="flex"
                    flexDirection="column"
                    overflow="hidden"
                    minH="0"
                    p={0}
                    m={0}
                  >
                    <Box flex="1" overflowY="auto" minH="0" p={4}>
                      {isJsonLoading ? (
                        <Center h="100%">
                          <Spinner color="white" />
                        </Center>
                      ) : (
                        <>
                          <HStack mb={4} gap={2} justify="space-between">
                            <HStack gap={2}>
                              <FileJson size={14} color="gray" />
                              <Text fontSize="sm" fontWeight="medium">
                                Output Data
                              </Text>
                            </HStack>
                          </HStack>
                          <Code
                            display="block"
                            whiteSpace="pre"
                            p={3}
                            fontSize="xs"
                            bg="black"
                            color="green.300"
                            borderRadius="md"
                            overflowX="auto"
                            fontFamily="monospace"
                            height="calc(100vh - 50vh)"
                          >
                            {jsonText || "No JSON data"}
                          </Code>
                        </>
                      )}
                    </Box>
                  </Tabs.Content>
                </Tabs.Root>
              )}
            </Box>
          )}
        </Flex>
      </Flex>
      {isEditModalOpen && (
        <RequestForm
          mode="edit"
          isVoiceAi={true}
          inputs={selectedAppData.columns || []}
          initialValues={editRowData}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditRowData(null);
          }}
          checkPermission={() => true}
        />
      )}
    </Flex>
  );
};

export default VoiceAiDashboard;

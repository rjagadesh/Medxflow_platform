import CustomButton from "@/components/button/button";
import GenericTable from "@/components/table/table";
import CustomSelect from "@/components/ui/select";
import { toaster } from "@/components/ui/toaster";
import AudioPlayer from "@/components/viewers/audio-player";
import RequestForm from "@/features/insurance-verification/modal/request";
import DocumentsViewer from "@/features/patient-intake/DocumentViewer";
import DownloadOutput from "@/features/patient-intake/download-ouput";
import { useDeleteRequest } from "@/hooks/mutation/agentsapp/useDeleteRequest";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import { useGetColumnData } from "@/hooks/query/admin/useGetColumnData";
import { useGetRequest } from "@/hooks/query/agents-app/useGetRequest";
import { useExportAgentTasks } from "@/hooks/query/agentsapp/useExportRequest";
import { useGetAPIkey } from "@/hooks/query/agentsapp/useGetAPIkey";
import { useGetAgentById } from "@/hooks/query/useGetAgentById";
import DateRangeCalendar from "@/utils/datepicker";
import { atobAgentId, atobDepartmentId } from "@/utils/helper";
import getStatusIcon from "@/utils/status-icon";
import { HStack, Input, InputGroup, Text } from "@chakra-ui/react";
import { parseAsString, useQueryStates } from "nuqs";
import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import UnauthorizedPage from "../unauthorized";
import { CloseButton, Dialog, Portal } from "@chakra-ui/react";
// import PdfSignPage from "./docusign";
import PDFIcon from "@/assets/icons/pdf.svg?react";
import { Box } from "@chakra-ui/react";
import CustomInput from "@/components/input/input";
import { EditIcon } from "lucide-react";
import { Button } from "@chakra-ui/react";

const fileUrlByMime = (files, mime_type) => {
  const findExtension = files?.find((file) =>
    file.mime_type.endsWith(mime_type),
  );
  return findExtension?.file_url;
};

export default function RequestTable() {
  const [searchParams, setSearchParams] = useQueryStates({
    search: parseAsString.withDefault(""),
    "search-in": parseAsString.withDefault(""),
    clicked: parseAsString.withDefault("0"),
  });
  const { agent_app } = useParams();
  const agentId = atobAgentId(agent_app);
  const { department_id } = useParams();
  const departmentId = atobDepartmentId(department_id);
  const [currentFiles, setCurrentFiles] = useState([]);
  const { data: agentData } = useGetAgentById(agentId);
  const { hasPermission } = usePermissions();

  const [editRowData, setEditRowData] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const { data: { api_key = "" } = {} } = useGetAPIkey(agentId);
  const { data: selectedAppData = {}, isLoading: headerLoading } =
    useGetColumnData(agentId);
  const { isPending: isDeletePending, mutateAsync: deleteRequests } =
    useDeleteRequest(api_key);

  const [query, setQuery] = useQueryStates({
    // search: parseAsString.withDefault(""),
    ordering: parseAsString.withDefault(""),
    page: parseAsString.withDefault(1),
    status: parseAsString.withDefault(""),
  });

  const ExportTable = () => {
    return (
      <DateRangeCalendar
        agent_id={agentId}
        checkPermission={() => {
          return hasPermission("requests_table_view_export", "create");
        }}
      />
    );
  };

  const { data: requestData = {}, isLoading } = useGetRequest({
    api_key,
    enabled: !!api_key,
    appId: agentId,
    status: query.status,
    page_size: 10,
    page: query.page || 1,
    ordering: query.ordering,
    [`data__${searchParams["search-in"]}`]: searchParams.search,
    clicked: searchParams.clicked,
  });

  const onPageChange = (v) => {
    setQuery((prev) => ({
      ...prev,
      page: v,
    }));
  };

  const onSortChange = (v) => {
    setQuery((prev) => ({
      ...prev,
      ordering: v,
    }));
  };
  const columnsData = useMemo(() => {
    return [
      ...(selectedAppData?.columns?.map((column) => {
        if (column.type === "file") {
          return {
            title: "Documents",
            accessor_key: "",
            tableProps: { "data-sticky": "end0" },
            render: (_, row) => (
              <DocumentsViewer
                agentId={row.id}
                api_key={api_key}
                inputs={selectedAppData.columns || []}
                initialValues={row}
                agentData={agentData}
              />
            ),
          };
        }

        return {
          ...column,
          title: column.name,
          accessor_key: column.name,
          render: (column_value) => {
            return column_value ? column_value : "N/A";
          },
        };
      }) || []),
      // ...(agentId === "115"
      //   ? [
      //       {
      //         title: "Document",
      //         accessor_key: "",
      //         tableProps: { "data-sticky": "end0" },
      //         render: () => (
      //           <Dialog.Root
      //             role="alertdialog" // Accessible confirmation dialog
      //             size="full" // Small size for compact dialog
      //             motionPreset="scale" // Smooth opening animation
      //             placement="center"
      //             scrollBehavior={"inside"}
      //           >
      //             <Dialog.Trigger>
      //               <PDFIcon height={30} width={30} />
      //             </Dialog.Trigger>
      //             <Portal>
      //               <Dialog.Backdrop />
      //               <Dialog.Positioner>
      //                 <Dialog.Content className="!bg-droidal-black-300">
      //                   <Dialog.Header>
      //                     <Dialog.Title m={0} className="!text-white">
      //                       View PDF
      //                     </Dialog.Title>
      //                     <Dialog.CloseTrigger asChild>
      //                       <CloseButton size="sm" />
      //                     </Dialog.CloseTrigger>
      //                   </Dialog.Header>
      //                   <Dialog.Body>
      //                     <PdfSignPage />
      //                   </Dialog.Body>
      //                   <Dialog.Footer>
      //                     <Dialog.ActionTrigger asChild>
      //                       <CustomButton
      //                         variant={"outline"}
      //                         color="#fff"
      //                         _hover={{
      //                           bg: "transparent",
      //                         }}
      //                         onClick={() => {}}
      //                         w="85px"
      //                       >
      //                         Cancel
      //                       </CustomButton>
      //                     </Dialog.ActionTrigger>
      //                   </Dialog.Footer>
      //                 </Dialog.Content>
      //               </Dialog.Positioner>
      //             </Portal>
      //           </Dialog.Root>
      //         ),
      //       },
      //     ]
      //   : []),
      ...(departmentId === "10"
        ? [
            {
              title: "Output",
              accessor_key: "",
              tableProps: { "data-sticky": "end0" },
              render: (_, row) => (
                <DownloadOutput
                  agentId={row.id}
                  rowId={row.id}
                  api_key={api_key}
                  setCurrentFiles={setCurrentFiles}
                />
              ),
            },
          ]
        : []),
      ...(selectedAppData?.columns?.length > 0
        ? [
            {
              title: "Status",
              accessor_key: "status",
              tableProps: { "data-sticky": "end" },
              render: (status, rowData) => (
                <HStack>
                  {getStatusIcon(status)}{" "}
                  <RequestForm
                    mode="edit"
                    inputs={selectedAppData.columns || []}
                    initialValues={rowData}
                    checkPermission={() => {
                      return hasPermission(
                        "requests_table_edit_process_delete",
                        "create",
                      );
                    }}
                    leftIcon={<EditIcon />}
                    onClick={() => {
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
                  >
                    Edit
                  </RequestForm>
                </HStack>
              ),
            },
          ]
        : []),
    ];
  }, [
    agentData,
    agentId,
    api_key,
    selectedAppData.columns,
    hasPermission,
    setEditRowData,
    setIsEditModalOpen,
  ]);

  const updateData = useMemo(() => {
    return requestData?.results?.map((item) => {
      return {
        ...item?.data,
        ...item,
      };
    });
  }, [requestData]);

  if (!hasPermission("requests_table_view_export", "view")) {
    return <UnauthorizedPage />;
  }

  return (
    <div>
      <div className="pt-">
        {/* Header */}

        {/* Main Table Card */}
        <div className="bg-droidal-black-300 rounded-2xl shadow-sm">
          {/* Table Header */}
          <div className="p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-y-4 lg:gap-y-0">
              <HStack
                bg="droidalBlack.300"
                p={4}
                display="flex"
                alignItems="center"
                justifyContent={"space-between"}
                gap={4}
                rounded="md"
                w="full"
              >
                <Text
                  as="h2"
                  fontSize={{
                    base: "md",
                    md: "lg",
                  }}
                  className="font-semibold text-white"
                >
                  Requests
                </Text>
                <HStack alignItems={"center"}>
                  <CustomSelect
                    options={[
                      {
                        label: "All",
                        value: "",
                      },
                      {
                        label: "Success",
                        value: "SUCCESS",
                      },
                      { label: "Failure", value: "FAILURE" },
                      { label: "Pending", value: "PENDING" },
                      { label: "New", value: "NEW" },
                    ]}
                    placeholder="Select Alert Type"
                    borderRadius="4px !important"
                    borderColor="#2f4d78"
                    css={{
                      "& button": {
                        borderRadius: "4px !important",
                        borderColor: "#2f4d78",
                        color: "white !important",
                      },
                    }}
                    size={"md"}
                    color="white"
                    value={[query.status]}
                    onValueChange={(v) => {
                      setQuery((prev) => ({
                        ...prev,
                        status: v[0],
                      }));
                    }}
                    width="full"
                  />
                  <Text
                    color="white"
                    fontSize="sm"
                    whiteSpace="nowrap"
                    fontWeight="light"
                  >
                    Look For:
                  </Text>
                  <CustomInput
                    value={searchParams.search}
                    onChange={(e) =>
                      setSearchParams((prev) => ({
                        ...prev,
                        search: e.target.value,
                      }))
                    }
                    placeholder="Search..."
                    h="40px"
                  />

                  <Text
                    color="white"
                    fontSize="sm"
                    whiteSpace="nowrap"
                    fontWeight="light"
                  >
                    Search In:
                  </Text>
                  <Box w="200px">
                    <CustomSelect
                      value={[searchParams["search-in"]]}
                      onValueChange={(val) => {
                        setSearchParams((prev) => ({
                          ...prev,
                          "search-in": val[0],
                        }));
                      }}
                      options={selectedAppData?.columns?.map((column) => ({
                        label: column.name,
                        value: column.name,
                      }))}
                      css={{
                        "& button": {
                          borderRadius: "4px !important",
                          borderColor: "#2f4d78",
                          color: "white !important",
                        },
                      }}
                      placeholder="Select Column"
                    />
                  </Box>
                  <CustomButton
                    onClick={() => {
                      if (!searchParams["search-in"]) {
                        toaster.error({
                          title: "Error",
                          description: "Select the `search In` field",
                        });
                        return;
                      }
                      if (!searchParams.search) {
                        toaster.error({
                          title: "Error",
                          description: "Enter the value to search",
                        });
                        return;
                      }
                      setSearchParams((prev) => ({
                        ...prev,
                        clicked: String((Number(prev.clicked) || 0) + 1),
                      }));
                      setQuery((prev) => ({
                        ...prev,
                        page: 1,
                      }));
                    }}
                    h="40px"
                  >
                    Find Now
                  </CustomButton>
                  <CustomButton
                    variant="outline"
                    onClick={() => {
                      setSearchParams({
                        search: "",
                        "search-in": "",
                        clicked: "0",
                      });
                    }}
                    h="40px"
                  >
                    Clear
                  </CustomButton>

                  {/* Filter & Export */}

                  <ExportTable agentId={agentId} />
                </HStack>
              </HStack>
            </div>
          </div>

          <GenericTable
            columns={columnsData || []}
            columnSettings={selectedAppData}
            data={updateData || []}
            count={requestData.count || 0}
            onPageChange={(v) => {
              onPageChange(v);
            }}
            loader={isLoading}
            headerLoading={headerLoading}
            page={query.page || 1}
            sort={query.ordering}
            onSortClick={onSortChange}
            selection={{
              selectable: true,
              checkboxProps: {
                disabled: (row) =>
                  ["SUCCESS", "PENDING", "FAILURE", "FAILED"].includes(
                    row.status,
                  ),
              },
              onSelectAllChange: (allRows) =>
                allRows
                  .filter((row) => row.status === "NEW")
                  ?.map((row) => row.id),
              checkPermission: () => {
                return hasPermission(
                  "requests_table_edit_process_delete",
                  "delete",
                );
              },
              onConfirm: async (selectedRows) => {
                try {
                  const promise = new Promise((resolve, reject) => {
                    deleteRequests(
                      {
                        ids: selectedRows,
                      },
                      {
                        onSuccess: () => {
                          toaster.success({
                            title: "Success",
                            description: "Request deleted successfully",
                          });
                          resolve(true);
                        },
                        onError: () => {
                          toaster.error({
                            title: "Error",
                            description: "Error deleting request",
                          });
                          reject(false);
                        },
                      },
                    );
                  });
                  return promise;
                } catch (err) {
                  console.log("err", err);
                }
              },
              loading: isDeletePending,
            }}
            bodyHeight={"calc(100vh - 330px)"}
          />
          <AudioPlayer
            title={"Audio Player"}
            src={fileUrlByMime(currentFiles, "audio/x-wav")}
            onClose={() => setCurrentFiles([])}
          />
          {/* <ReactH5AudioPlayer autoPlay src={"/audio/audio.wav"} /> */}
        </div>
      </div>
      {isEditModalOpen && (
        <RequestForm
          mode="edit"
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
    </div>
  );
}

import GenericTable from "@/components/table/table";
import getStatusIcon from "@/utils/status-icon";
import { useMemo, useState } from "react";
import DownloadOutput from "./download-ouput";
import { useGetRequest } from "@/hooks/query/agents-app/useGetRequest";
import { parseAsString, useQueryStates } from "nuqs";
import { atobAgentId, atobDepartmentId } from "@/utils/helper";
import AudioPlayer from "@/components/viewers/audio-player";
import { Box, HStack, Dialog, Portal, CloseButton } from "@chakra-ui/react";
import DocumentsViewer from "./DocumentViewer";
import CustomButton from "@/components/button/button";
import { EditIcon } from "lucide-react";
import RequestForm from "../insurance-verification/modal/request";
import { useGetAgentById } from "@/hooks/query/useGetAgentById";
import { usePermissions } from "@/hooks/mutation/permission/usePermissions";
import { useParams } from "react-router-dom";
import PdfSignPage from "@/pages/patientIntake/docusign";
import PDFIcon from "@/assets/icons/pdf.svg?react";

const fileUrlByMime = (files, mime_type) => {
  const findExtension = files?.find((file) =>
    file.mime_type.endsWith(mime_type)
  );
  return findExtension?.file_url;
};

export default function RecentRequests({
  rightAction,
  api_key,
  agent_app,
  status = null,
  selectedAppData,
  headerLoading = false,
}) {
  // const { data: selectedAppData = {} } = useGetColumnData();
  const [currentFiles, setCurrentFiles] = useState([]);
  const { department_id } = useParams();
  const agentId = atobAgentId(agent_app);
  const departmentId = atobDepartmentId(department_id);
  const { data: agentData } = useGetAgentById(agentId);
  const { hasPermission } = usePermissions();

  const [query, setQuery] = useQueryStates({
    // search: parseAsString.withDefault(""),
    ordering: parseAsString.withDefault(""),
    page: parseAsString.withDefault(1),
  });

  console.log("agentData", agentData);

  const { data: requestData = {}, isLoading } = useGetRequest({
    api_key,
    enabled: !!api_key,
    appId: agent_app,
    status,
    page_size: 10,
    page: query.page || 1,
    ordering: query.ordering,
  });

  console.log("selectedAppData999", selectedAppData);

  const updateData = useMemo(() => {
    return requestData?.results?.map((item) => {
      return {
        ...item?.data,
        ...item,
      };
    });
  }, [requestData]);

  console.log("updateData", updateData, selectedAppData);

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
                agentData={agentData}
                inputs={selectedAppData.columns || []}
                initialValues={row}
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
      ...(agentId === "115"
        ? [
            {
              title: "Document",
              accessor_key: "",
              tableProps: { "data-sticky": "end0" },
              render: (_, row) => (
                <Dialog.Root
                  role="alertdialog" // Accessible confirmation dialog
                  size="full" // Small size for compact dialog
                  motionPreset="scale" // Smooth opening animation
                  placement="center"
                  scrollBehavior={"inside"}
                >
                  <Dialog.Trigger>
                    <PDFIcon height={30} width={30} />
                  </Dialog.Trigger>
                  <Portal>
                    <Dialog.Backdrop />
                    <Dialog.Positioner>
                      <Dialog.Content className="!bg-droidal-black-300">
                        <Dialog.Header>
                          <Dialog.Title m={0} className="!text-white">
                            View PDF
                          </Dialog.Title>
                          <Dialog.CloseTrigger asChild>
                            <CloseButton size="sm" />
                          </Dialog.CloseTrigger>
                        </Dialog.Header>
                        <Dialog.Body>
                          <PdfSignPage api_key={api_key} initialValues={row} />
                        </Dialog.Body>
                        <Dialog.Footer>
                          <Dialog.ActionTrigger asChild>
                            <CustomButton
                              variant={"outline"}
                              color="#fff"
                              _hover={{
                                bg: "transparent",
                              }}
                              onClick={() => {}}
                              w="85px"
                            >
                              Cancel
                            </CustomButton>
                          </Dialog.ActionTrigger>
                        </Dialog.Footer>
                      </Dialog.Content>
                    </Dialog.Positioner>
                  </Portal>
                </Dialog.Root>
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
                    checkPermission={() => {
                      return hasPermission(
                        "requests_table_edit_process_delete",
                        "create"
                      );
                    }}
                    inputs={selectedAppData.columns || []}
                    initialValues={rowData}
                  />
                </HStack>
              ),
            },
          ]
        : []),
    ];
  }, [agentData, departmentId, api_key, selectedAppData.columns]);

  console.log("selectedAppData9999", selectedAppData);
  console.log("columnsData999", columnsData);

  const onPageChange = (v) => {
    setQuery((prev) => ({
      ...prev,
      page: v,
    }));
  };

  const onSortChange = (v) => {
    console.log("00000v", v);
    setQuery((prev) => ({
      ...prev,
      ordering: v,
    }));
  };

  return (
    <Box mt={3}>
      <GenericTable
        title="Recent Requests"
        columns={columnsData || []}
        rightAction={rightAction}
        columnSettings={selectedAppData}
        data={updateData || []}
        count={requestData.count || 0}
        onPageChange={(v) => {
          onPageChange(v);
        }}
        bodyHeight={{
          base: "calc(100vh - 380px)",
          "2xl": "calc(100vh - 430px)",
          "3xl": "calc(100vh - 440px)",
        }}
        sort={query.ordering}
        onSortClick={onSortChange}
        loader={isLoading}
        headerLoading={headerLoading}
        page={query.page || 1}
      />
      <AudioPlayer
        title={"Audio Player"}
        src={fileUrlByMime(currentFiles, "audio/x-wav")}
        onClose={() => setCurrentFiles([])}
      />
    </Box>
  );
}

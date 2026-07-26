import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  Image,
  Dialog,
  Portal,
  IconButton,
  Button,
  Badge,
  Textarea,
} from "@chakra-ui/react";
import { X, Upload, Eye, Trash2, Pencil } from "lucide-react";
import { DropzoneUploader } from "../../../components/dropzone-uploader/uploader";
import GenericTable from "../../../components/table/table";
import getStatusIcon from "../../../utils/status-icon";
import CustomSelect from "../../../components/ui/select";
import CustomButton from "@/components/button/button";
import { useParams } from "react-router-dom";
import { useGetPatientDocumentsById } from "../../../hooks/query/pms/patient/useGetDocuments";
import {
  useUploadPatientDocs,
  useUpdatePatientDocuments,
  useDeletePatientDocument,
} from "../../../hooks/mutation/pms/patient/useUploadDocs";
import ApiConstant from "@/services/constant";
import { toaster } from "@/components/ui/toaster";

const BASE_URL = ApiConstant.BASE_URL;

const DocumentsView = () => {
  const params = useParams();
  const id = params.id ?? params.patient_id;
  const { data: documentsData, isLoading } = useGetPatientDocumentsById(id);
  const { mutate: uploadDocs, isPending: isUploading } = useUploadPatientDocs();
  const { mutate: updateDocs, isPending: isUpdating } =
    useUpdatePatientDocuments();
  const { mutate: deleteDocs } = useDeletePatientDocument();

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);

  // For deletion confirmation
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState(null);

  // Upload/Edit states
  const [uploadStatus, setUploadStatus] = useState(["Pending"]);
  const [uploadLabel, setUploadLabel] = useState([]);
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadAppointment, setUploadAppointment] = useState(null);

  const resetForm = () => {
    setIsUploadOpen(false);
    setIsEditMode(false);
    setSelectedDocumentId(null);
    setUploadFiles([]);
    setUploadLabel([]);
    setUploadNotes("");
    setUploadStatus(["Pending"]);
    setUploadAppointment(null);
  };

  const handleSave = () => {
    if (!isEditMode && uploadFiles.length === 0) {
      toaster.warning({
        title: "Validation Error",
        description: "Please select a file to upload",
      });
      return;
    }

    const formData = new FormData();
    formData.append("patient", id);
    formData.append("appointment", uploadAppointment || "");
    if (uploadFiles.length > 0) {
      formData.append("file", uploadFiles[0]);
    }
    formData.append("label", uploadLabel[0] || "");
    formData.append("notes", uploadNotes);
    formData.append("status", uploadStatus[0] || "New");

    if (isEditMode) {
      formData.append("id", selectedDocumentId);
      updateDocs(
        { data: formData, id: selectedDocumentId },
        {
          onSuccess: () => {
            resetForm();
            toaster.success({
              title: "Success",
              description: "Document updated successfully",
            });
          },
          onError: (error) => {
            toaster.error({
              title: "Update Failed",
              description: error.message || "Failed to update document",
            });
          },
        },
      );
    } else {
      uploadDocs(
        { data: formData, id },
        {
          onSuccess: () => {
            resetForm();
            toaster.success({
              title: "Success",
              description: "Document uploaded successfully",
            });
          },
          onError: (error) => {
            toaster.error({
              title: "Upload Failed",
              description: error.message || "Failed to upload document",
            });
          },
        },
      );
    }
  };

  const handleEdit = (row) => {
    setIsEditMode(true);
    setSelectedDocumentId(row.id);
    setUploadStatus([row.status]);
    setUploadLabel([row.label]);
    setUploadNotes(row.notes);
    setUploadAppointment(row.appointment);
    setUploadFiles([]);
    setIsUploadOpen(true);
  };

  const handleDeleteClick = (row) => {
    setDocumentToDelete(row);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (documentToDelete) {
      deleteDocs(
        { id: documentToDelete.id, documentId: documentToDelete.id },
        {
          onSuccess: () => {
            toaster.success({
              title: "Success",
              description: "Document deleted successfully",
            });
            setIsDeleteDialogOpen(false);
            setDocumentToDelete(null);
          },
          onError: (error) => {
            toaster.error({
              title: "Delete Failed",
              description: error.message || "Failed to delete document",
            });
            setIsDeleteDialogOpen(false);
            setDocumentToDelete(null);
          },
        },
      );
    }
  };

  const cancelDelete = () => {
    setIsDeleteDialogOpen(false);
    setDocumentToDelete(null);
  };

  const openUpload = () => {
    resetForm();
    setIsUploadOpen(true);
  };

  const statusOptions = [
    { label: "Old", value: "Old" },
    { label: "New", value: "New" },
  ];

  const labelOptions = [
    { label: "Photo Id", value: "Photo Id" },
    { label: "Insurance Card", value: "Insurance Card" },
    { label: "Medical Records", value: "Medical Records" },
    { label: "Miscellaneous", value: "Miscellaneous" },
  ];

  const renderViewer = (file) => {
    if (!file) return null;

    const fileUrl = file.file_path
      ? `${BASE_URL}${file.file_path.startsWith("/") ? file.file_path.substring(1) : file.file_path}/`
      : "";

    if (
      file.file_name?.toLowerCase().endsWith(".jpg") ||
      file.file_name?.toLowerCase().endsWith(".jpeg") ||
      file.file_name?.toLowerCase().endsWith(".png")
    ) {
      return (
        <Box
          border="1px solid"
          borderColor="droidalGray.300"
          borderRadius="md"
          overflow="hidden"
          bg="black"
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          <Image
            src={fileUrl}
            alt={file.file_name || "Document"}
            objectFit="contain"
            maxH="70vh"
            w="auto"
          />
        </Box>
      );
    }
    if (file.file_name?.toLowerCase().endsWith(".pdf")) {
      return (
        <Box
          height="70vh"
          border="1px solid"
          borderColor="droidalGray.300"
          borderRadius="md"
          overflow="hidden"
          bg="white"
        >
          <iframe
            src={fileUrl}
            width="100%"
            height="100%"
            title={file.file_name || "Document"}
          ></iframe>
        </Box>
      );
    }
    return (
      <Text color="red.300" mt={2}>
        Preview not available for this file type.
      </Text>
    );
  };

  const COLUMNS = [
    {
      title: "Date",
      accessor_key: "created_at",
      render: (created_at) =>
        created_at ? new Date(created_at).toLocaleDateString() : "-",
    },
    {
      title: "Name",
      accessor_key: "file_name",
    },
    {
      title: "Status",
      accessor_key: "status",
      render: (status) => getStatusIcon(status),
    },
    {
      title: "Label",
      accessor_key: "label",
    },
    {
      title: "Notes",
      accessor_key: "notes",
    },
    {
      title: "Actions",
      render: (_, row) => (
        <Flex gap={2}>
          <IconButton
            size="sm"
            variant="ghost"
            color="blue.500"
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(row);
            }}
          >
            <Eye size={16} />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            color="yellow.500"
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(row);
            }}
          >
            <Pencil size={16} />
          </IconButton>
          <IconButton
            size="sm"
            variant="ghost"
            color="red.500"
            _hover={{ bg: "whiteAlpha.200" }}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(row);
            }}
          >
            <Trash2 size={16} />
          </IconButton>
        </Flex>
      ),
    },
  ];

  return (
    <Box flex={1} p={6} height="full" bg="droidalBlack.400" overflowY="auto">
      <GenericTable
        title="Documents"
        columns={COLUMNS}
        data={Array.isArray(documentsData) ? documentsData : []}
        count={Array.isArray(documentsData) ? documentsData.length : 0}
        rightAction={
          <CustomButton
            onClick={openUpload}
            leftIcon={<Upload size={16} style={{ marginRight: "8px" }} />}
          >
            Upload
          </CustomButton>
        }
        pagination={false}
        loading={isLoading}
      />

      {/* Upload/Edit Dialog */}
      <Dialog.Root
        open={isUploadOpen}
        onOpenChange={(details) => !details.open && resetForm()}
        size="lg"
        placement="center"
      >
        <Portal
          container={{
            current: document.getElementById("layout-main-content"),
          }}
        >
          <Dialog.Backdrop
            bg="blackAlpha.500"
            backdropFilter="blur(4px)"
            backdropBlur="lg"
          />
          <Dialog.Positioner>
            <Dialog.Content
              bg="droidalBlack.300"
              maxW="600px"
              w="full"
              borderRadius="md"
            >
              <Dialog.Header
                borderBottom="1px solid"
                borderColor="droidalGray.300"
                pb={4}
              >
                <Flex justify="space-between" align="center">
                  <Dialog.Title
                    color="white"
                    fontSize="xl"
                    fontWeight="light"
                    m={0}
                  >
                    {isEditMode ? "Edit Document" : "Upload Documents"}
                  </Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      color="white"
                      _hover={{ bg: "droidalGray.500" }}
                      onClick={resetForm}
                    >
                      <X size={20} />
                    </IconButton>
                  </Dialog.CloseTrigger>
                </Flex>
              </Dialog.Header>
              <Dialog.Body p={6}>
                <VStack gap={4} align="stretch">
                  <Box>
                    <Text
                      color="white"
                      mb={2}
                      fontSize="sm"
                      fontWeight="light"
                      letterSpacing="wider"
                    >
                      Status
                    </Text>
                    <CustomSelect
                      value={uploadStatus}
                      onValueChange={(val) => setUploadStatus(val)}
                      options={statusOptions}
                      placeholder="Select Status"
                    />
                  </Box>
                  <Box>
                    <Text
                      color="white"
                      mb={2}
                      fontSize="sm"
                      fontWeight="light"
                      letterSpacing="wider"
                    >
                      Label
                    </Text>
                    <CustomSelect
                      value={uploadLabel}
                      onValueChange={(val) => setUploadLabel(val)}
                      options={labelOptions}
                      placeholder="Select Label"
                    />
                  </Box>
                  <Box>
                    <Text
                      color="white"
                      mb={2}
                      fontSize="sm"
                      fontWeight="light"
                      letterSpacing="wider"
                    >
                      Notes
                    </Text>
                    <Textarea
                      value={uploadNotes}
                      onChange={(e) => setUploadNotes(e.target.value)}
                      placeholder="Enter Notes"
                      color="white"
                      borderColor="#2f4d78"
                      _hover={{ borderColor: "#00BBF2" }}
                      _focus={{
                        borderColor: "#00BBF2",
                        boxShadow: "0 0 0 1px #00BBF2",
                      }}
                    />
                  </Box>
                  <Box>
                    <Text
                      color="white"
                      mb={2}
                      fontSize="sm"
                      fontWeight="light"
                      letterSpacing="wider"
                    >
                      File
                    </Text>
                    {uploadFiles.length > 0 ? (
                      <Badge
                        variant="surface"
                        colorScheme="blue"
                        display="flex"
                        alignItems="center"
                        justifyContent="space-between"
                        gap={2}
                        p={3}
                        borderRadius="md"
                        bg="whiteAlpha.200"
                        color="white"
                      >
                        <Text noOfLines={1} maxW="80%">
                          {uploadFiles[0].name}
                        </Text>
                        <X
                          size={16}
                          cursor="pointer"
                          onClick={() => setUploadFiles([])}
                          style={{ flexShrink: 0 }}
                        />
                      </Badge>
                    ) : (
                      <DropzoneUploader
                        value={uploadFiles}
                        onChange={setUploadFiles}
                        maxFiles={1}
                        accept="image/*,application/pdf"
                      />
                    )}
                  </Box>
                </VStack>
              </Dialog.Body>
              <Dialog.Footer
                borderTop="1px solid"
                borderColor="droidalGray.300"
                pt={4}
              >
                <Button
                  onClick={resetForm}
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "droidalGray.500" }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={
                    isUploading ||
                    isUpdating ||
                    (!isEditMode && uploadFiles.length === 0)
                  }
                >
                  {isUploading || isUpdating ? "Saving..." : "Save"}
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Document Viewer Modal */}
      <Dialog.Root
        open={!!selectedFile}
        onOpenChange={(details) => !details.open && setSelectedFile(null)}
        size="xl"
        placement="center"
      >
        <Portal
          container={{
            current: document.getElementById("layout-main-content"),
          }}
        >
          <Dialog.Backdrop
            bg="blackAlpha.500"
            backdropFilter="blur(4px)"
            backdropBlur="lg"
          />
          <Dialog.Positioner>
            <Dialog.Content
              bg="droidalBlack.300"
              maxW="900px"
              w="full"
              borderRadius="md"
            >
              <Dialog.Header
                borderBottom="1px solid"
                borderColor="droidalGray.300"
                pb={4}
              >
                <Flex justify="space-between" align="center">
                  <Dialog.Title
                    color="white"
                    fontSize="xl"
                    fontWeight="light"
                    m={0}
                  >
                    {selectedFile?.file_name || "Document"}
                  </Dialog.Title>
                  <Dialog.CloseTrigger asChild>
                    <IconButton
                      size="sm"
                      variant="ghost"
                      color="white"
                      _hover={{ bg: "droidalGray.500" }}
                      onClick={() => setSelectedFile(null)}
                    >
                      <X size={20} />
                    </IconButton>
                  </Dialog.CloseTrigger>
                </Flex>
              </Dialog.Header>
              <Dialog.Body p={0} borderRadius={"none"}>
                {selectedFile && renderViewer(selectedFile)}
              </Dialog.Body>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>

      {/* Delete Confirmation Dialog */}
      <Dialog.Root
        open={isDeleteDialogOpen}
        onOpenChange={(details) => !details.open && cancelDelete()}
        leastDestructiveRef={undefined}
      >
        <Portal>
          <Dialog.Backdrop bg="blackAlpha.600" backdropFilter="blur(4px)" />
          <Dialog.Positioner>
            <Dialog.Content
              bg="droidalBlack.300"
              borderRadius="md"
              maxW="500px"
              w="full"
            >
              <Dialog.Header
                borderBottom="1px solid"
                borderColor="droidalGray.300"
                pb={4}
              >
                <Dialog.Title color="white" fontSize="xl">
                  Delete Document
                </Dialog.Title>
              </Dialog.Header>
              <Dialog.Body py={6}>
                <Text color="whiteAlpha.800">
                  Are you sure you want to delete{" "}
                  <Text as="span" fontWeight="bold">
                    {documentToDelete?.file_name}
                  </Text>
                  ? This action cannot be undone.
                </Text>
              </Dialog.Body>
              <Dialog.Footer
                borderTop="1px solid"
                borderColor="droidalGray.300"
                pt={4}
              >
                <Button
                  variant="ghost"
                  color="white"
                  _hover={{ bg: "droidalGray.500" }}
                  onClick={cancelDelete}
                >
                  Cancel
                </Button>
                <Button colorScheme="red" ml={3} onClick={confirmDelete}>
                  Delete
                </Button>
              </Dialog.Footer>
            </Dialog.Content>
          </Dialog.Positioner>
        </Portal>
      </Dialog.Root>
    </Box>
  );
};

export default DocumentsView;

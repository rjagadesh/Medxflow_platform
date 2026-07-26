import { apiRoutes } from "@/services/api";
import apiRequest from "@/services/api-request";
import { useMutation, useQueryClient } from "@tanstack/react-query";

export const useUploadDocs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) =>
      apiRequest(apiRoutes.patient.patientDocumentUpload, {
        payload: data,
        header: {
          contentType: "multipart/form-data",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["upload-patient-docs"]);
    },
  });
};

export const useUploadPatientDocs = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, id }) =>
      apiRequest(apiRoutes.patient.patientDocumentsUpload, {
        payload: data,
        header: {
          contentType: "multipart/form-data",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["get-patient-documents"]);
    },
  });
};

export const useUpdatePatientDocuments = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ data, id }) =>
      apiRequest(apiRoutes.patient.updatePatientDocuments, {
        payload: data,
        metadata: { id },
        header: {
          contentType: "multipart/form-data",
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["get-patient-documents"]);
    },
  });
};

export const useDeletePatientDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, documentId }) =>
      apiRequest(apiRoutes.patient.deletePatientDocument, {
        metadata: { id },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["get-patient-documents"]);
    },
  });
};

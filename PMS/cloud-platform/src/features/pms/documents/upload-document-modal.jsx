"use client";

import {
  Dialog,
  Portal,
  Field,
  VStack,
  Box,
  Text,
  Checkbox,
} from "@chakra-ui/react";
import { Controller, useForm } from "react-hook-form";
import { useState } from "react";
import { DropzoneUploader } from "@/components/dropzone-uploader/uploader";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import CustomTextArea from "@/components/textarea/textarea";
import { toaster } from "@/components/ui/toaster";
import { useUploadPatientDocs } from "@/hooks/mutation/pms/patient/useUploadDocs";

const UploadDocumentModal = ({ patientId, onUploaded } = {}) => {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState([]);
  const { mutate: uploadDocs, isPending: isUploading } = useUploadPatientDocs();

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      document_label: "",
      name: "",
      status: "NEW",
      claim_processing: "",
      include_with_claim: false,
      document_type: "",
      notes: "",
    },
  });

  const handleFileChange = (newFiles) => {
    setFiles(newFiles);
  };

  const onSubmit = (data) => {
    if (!files.length) {
      toaster.error({
        title: "No file",
        description: "Please attach a document before uploading",
      });
      return;
    }

    // This modal is currently mounted on the global documents page, which has
    // no patient in context. Uploads are patient-scoped on the backend
    // (POST /patient/documents-process/ requires a patient id), so without a
    // patientId there is nothing valid to post — surface that honestly rather
    // than faking success.
    // TODO: pass `patientId` down from a patient-scoped documents view, or add
    // a patient picker to this modal, to enable global uploads.
    if (!patientId) {
      toaster.error({
        title: "No patient selected",
        description:
          "Documents must be attached to a patient. Open this from a patient's chart to upload.",
      });
      return;
    }

    const formData = new FormData();
    formData.append("patient", patientId);
    formData.append("file", files[0]);
    formData.append("label", data.document_label || "");
    formData.append("name", data.name || "");
    formData.append("status", data.status || "NEW");
    formData.append("document_type", data.document_type || "");
    formData.append("include_with_claim", data.include_with_claim ? "true" : "false");
    formData.append("notes", data.notes || "");

    uploadDocs(
      { data: formData, id: patientId },
      {
        onSuccess: () => {
          toaster.success({
            title: "Success",
            description: "Document uploaded successfully",
          });
          reset();
          setFiles([]);
          setOpen(false);
          onUploaded?.();
        },
        onError: (error) => {
          toaster.error({
            title: "Upload failed",
            description: error?.detail || "Could not upload the document",
          });
        },
      }
    );
  };

  return (
    <Dialog.Root
      scrollBehavior="inside"
      size="lg"
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
    >
      <Dialog.Trigger asChild>
        <CustomButton onClick={() => setOpen(true)}>
          Upload Document
        </CustomButton>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content className="!bg-droidal-black-300 h-full overflow-auto">
            <Dialog.Header>
              <Dialog.Title m={0} className="text-white">
                Upload Document
              </Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <form id="upload-document-form" onSubmit={handleSubmit(onSubmit)}>
                <VStack gap={4} align="stretch">
                  <Box>
                    <Field.Root invalid={false}>
                      <Field.Label className="!text-white mb-2 block">
                        File
                      </Field.Label>
                      <DropzoneUploader
                        value={files}
                        maxFiles={1}
                        onChange={handleFileChange}
                      >
                        <Box>
                          <Text color={"gray.300"} fontWeight={"semibold"}>
                            Upload Document
                          </Text>
                          <Text color={"gray.400"} fontWeight={"normal"}>
                            Drag & drop or click to upload
                          </Text>
                        </Box>
                      </DropzoneUploader>
                    </Field.Root>
                  </Box>

                  <CustomInput
                    label="Document Label"
                    invalid={!!errors.document_label}
                    showError={!!errors.document_label}
                    errorMessage={errors.document_label?.message}
                    size="sm"
                    {...register("document_label")}
                  />

                  <CustomInput
                    label="Name"
                    invalid={!!errors.name}
                    showError={!!errors.name}
                    errorMessage={errors.name?.message}
                    size="sm"
                    {...register("name", { required: "Name is required" })}
                  />

                  <Field.Root invalid={!!errors.status}>
                    <Field.Label
                      color="white"
                      fontWeight={"light"}
                      fontSize={{
                        base: "xs",
                        "2xl": "sm",
                        "3xl": "md",
                      }}
                      letterSpacing={"wider"}
                    >
                      Status
                    </Field.Label>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          placeholder="Select Status"
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          options={[
                            { value: "NEW", label: "New" },
                            { value: "REVIEW", label: "Review" },
                            { value: "PROCESSED", label: "Processed" },
                          ]}
                          borderColor="#2f4d78"
                          css={{
                            "& button": {
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                              color: "white !important",
                            },
                          }}
                          width="full"
                        />
                      )}
                    />
                    <Field.ErrorText>{errors.status?.message}</Field.ErrorText>
                  </Field.Root>

                  <Text
                    color="white"
                    fontWeight={"light"}
                    fontSize={{
                      base: "xs",
                      "2xl": "sm",
                      "3xl": "md",
                    }}
                    letterSpacing={"wider"}
                  >
                    Claim Processing
                  </Text>

                  <Field.Root>
                    <Controller
                      name="include_with_claim"
                      control={control}
                      render={({ field }) => (
                        <Checkbox.Root
                          checked={field.value}
                          onCheckedChange={({ checked }) =>
                            field.onChange(checked)
                          }
                          className="text-white"
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label className="text-white">
                            Include with claim
                          </Checkbox.Label>
                        </Checkbox.Root>
                      )}
                    />
                  </Field.Root>

                  <Field.Root invalid={!!errors.document_type}>
                    <Field.Label
                      color="white"
                      fontWeight={"light"}
                      fontSize={{
                        base: "xs",
                        "2xl": "sm",
                        "3xl": "md",
                      }}
                      letterSpacing={"wider"}
                    >
                      Document Type
                    </Field.Label>
                    <Controller
                      name="document_type"
                      control={control}
                      render={({ field }) => (
                        <CustomSelect
                          placeholder="Select Document Type"
                          value={[field.value]}
                          onValueChange={(v) => field.onChange(v[0])}
                          options={[
                            {
                              value: "02",
                              label: "02 - Support Data for Claim",
                            },
                            { value: "03", label: "03 - Other" },
                          ]}
                          width="full"
                          borderColor="#2f4d78"
                          css={{
                            "& button": {
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                              color: "white !important",
                            },
                          }}
                        />
                      )}
                    />
                    <Field.ErrorText>
                      {errors.document_type?.message}
                    </Field.ErrorText>
                  </Field.Root>

                  <CustomTextArea
                    label="Notes"
                    invalid={!!errors.notes}
                    showError={!!errors.notes}
                    errorMessage={errors.notes?.message}
                    {...register("notes")}
                  />
                </VStack>
              </form>
            </Dialog.Body>
            <Dialog.Footer>
              <CustomButton variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </CustomButton>
              <CustomButton
                type="submit"
                form="upload-document-form"
                loading={isUploading}
              >
                Add
              </CustomButton>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default UploadDocumentModal;

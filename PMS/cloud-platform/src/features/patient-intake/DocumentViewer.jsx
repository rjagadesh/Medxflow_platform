import { toaster } from "@/components/ui/toaster";
import JsonViewer from "@/components/viewers/json-viewer";
import TextViewer from "@/components/viewers/text-viewe";
import { useGetOutputFiles } from "@/hooks/query/agentsapp/useGetOutputFiles";
import {
  Box,
  Center,
  HStack,
  SimpleGrid,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
import PdfViewer from "../helper/pdfViewer";
import { Controller, useForm } from "react-hook-form";
import CustomButton from "@/components/button/button";
import { useUpdateRequest } from "@/hooks/mutation/agentsapp/useUpdateRequest";
import CustomSelect from "@/components/ui/select";
import PDFIcon from "@/assets/icons/pdf.svg?react";
import { Field, Textarea } from "@chakra-ui/react";

const CustomTextArea = ({
  label,
  placeholder,
  invalid,
  showError,
  errorMessage = "",
  ...rest
}) => {
  return (
    <Field.Root invalid={invalid}>
      <Field.Label
        color="gray.300"
        fontWeight={"light"}
        fontSize={{
          base: "2xs",
          "2xl": "xs",
          "3xl": "sm",
        }}
        letterSpacing={"wider"}
      >
        {label}
      </Field.Label>

      <Textarea
        placeholder={placeholder}
        color="white"
        _placeholder={{ letterSpacing: "widest" }}
        letterSpacing="widest"
        borderColor={"#2f4d78"}
        borderRadius={"8px"}
        transition={"all .2s ease-in-out"}
        bgColor={"droidalBlack.200"}
        fontWeight={"medium"}
        _hover={{
          outlineColor: "transparent",
          border: "1px solid transparent",
          bgClip: "padding-box, border-box",
          backgroundOrigin: "padding-box, border-box",
          backgroundImage:
            "linear-gradient(#1A1A1A, #1A1A1A), linear-gradient(180deg,rgba(0, 91, 127, 1) 0%,rgba(0, 187, 242, 1) 72%)",
        }}
        {...rest}
      />
      {showError && <Field.ErrorText>{errorMessage}</Field.ErrorText>}
    </Field.Root>
  );
};

const DocumentsViewer = ({
  agentId = "",
  api_key = "",
  inputs = [],
  initialValues = {},
  agentData = {},
}) => {
  const [activeTextArea, setActiveTextArea] = useState(null);
  const formRef = useRef(null);
  const { data: files } = useGetOutputFiles({
    agentid: agentId,
    secretkey: api_key,
  });

  const { mutate: updateRequest, isPending: updateRequestPending } =
    useUpdateRequest(api_key, initialValues?.id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm();

  const activeInputs = inputs.filter(
    (input) => input.active && input.type !== "file"
  );

  const [openState, setOpenState] = useState({
    type: null,
    title: "",
    subtitle: "",
    content: "",
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

  const onSubmit = (data) => {
    if (initialValues.id) {
      updateRequest(
        {
          data: {
            ...data,
            Status: undefined,
            status: undefined,
          },
          status: data.status,
        },
        {
          onSuccess: () => {
            reset();
            toaster.success({
              title: "Success",
              description: "Request updated successfully",
            });
            setOpenState({ type: null, title: "", content: "" });
          },
          onError: (error) => {
            console.log("error", error);
            toaster.error({
              title: "Error",
              description: error.message || "Error updating request",
            });
          },
        }
      );
    }
  };

  console.log("activeTextArea", activeTextArea);

  useEffect(() => {
    reset({
      ...initialValues?.data,
      status: initialValues?.status,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues?.data, initialValues?.status]);

  return (
    <HStack>
      <Center>
        {files?.files?.map((file) => {
          if (file.mime_type === "application/pdf") {
            return (
              <button
                className="cursor-pointer"
                onClick={() => {
                  setOpenState({
                    type: "pdf",
                    title: file.file_name,
                    content:
                      file.file_url?.replace("http://", "https://") + "/",
                  });
                }}
              >
                <PDFIcon height={30} width={30} />
              </button>

              // </IconButton>
            );
          } else if (file.mime_type === "text/plain") {
            return (
              <TextViewer
                isDisabled={!fileUrlByMime("text/plain")}
                url={fileUrlByMime("text/plain")}
                onDownload={() => handleDownload("text/plain")}
              />
            );
          } else if (file.mime_type === "application/json") {
            return (
              <JsonViewer
                isDisabled={!fileUrlByMime("application/json")}
                url={fileUrlByMime("application/json")}
                onDownload={() => handleDownload("application/json")}
              />
            );
          }
        })}
      </Center>

      <PdfViewer
        isOpen={openState.type === "pdf"}
        onClose={(state) => {
          if (!state) {
            setOpenState({ type: null, title: "", content: "" });
          }
        }}
        title={<>{agentData.app_name}</>}
        subtitle={openState.title}
        pdfUrl={openState.content}
        formRender={
          <>
            <form
              ref={formRef}
              id="member-form"
              className="flex flex-col gap-8"
              onSubmit={handleSubmit(onSubmit)}
            >
              <SimpleGrid minChildWidth={"220px"} gap="5">
                {activeInputs.map((input) => (
                  <CustomTextArea
                    key={input.name + activeTextArea}
                    label={input.name}
                    invalid={!!errors[input.name]}
                    showError={!!errors[input.name]}
                    errorMessage={errors[input.name]?.message}
                    truncate={activeTextArea === input.name ? false : true}
                    autoresize={activeTextArea === input.name ? true : false}
                    rows={activeTextArea === input.name ? "auto" : 1}
                    onFocus={() => {
                      setActiveTextArea(input.name);
                    }}
                    onBlur={() => {
                      setActiveTextArea(null);
                    }}
                    {...register(input.name, {
                      required: "This field is required",
                    })}
                  />
                ))}
              </SimpleGrid>
            </form>
          </>
        }
        renderFooter={
          <>
            <Box className="flex-1 flex justify-end">
              <HStack>
                <VStack>
                  <Controller
                    name="status"
                    control={control}
                    rules={{ required: "Status selection is required" }}
                    render={({ field }) => {
                      console.log("field", field);
                      return (
                        <CustomSelect
                          placeholder="Select status"
                          value={[field.value]}
                          options={[
                            {
                              value: "NEW",
                              label: "New",
                            },
                            {
                              value: "SUCCESS",
                              label: "Success",
                            },
                            {
                              value: "PENDING",
                              label: "Pending",
                            },
                            {
                              value: "FAILURE",
                              label: "Failed",
                            },
                            {
                              value: "NEEDS-ATTENTION",
                              label: "Needs Attention",
                            },
                          ]}
                          onValueChange={(v) => field.onChange(v[0])}
                          w="200px"
                          borderColor="#2f4d78"
                          css={{
                            "& button": {
                              borderRadius: "4px !important",
                              borderColor: "#2f4d78",
                            },
                          }}
                          size="sm"
                        />
                      );
                    }}
                  />
                  {errors.status && (
                    <Text fontSize="xs" letterSpacing="wider" color="red">
                      {errors.status.message}
                    </Text>
                  )}
                </VStack>
                <CustomButton
                  type="submit"
                  onClick={() => formRef.current?.requestSubmit()}
                  loading={updateRequestPending}
                >
                  Submit
                </CustomButton>
              </HStack>
            </Box>
          </>
        }
      />
    </HStack>
  );
};

export default DocumentsViewer;

// import { useEffect, useMemo, useRef, useState } from "react";
// import {
//   Box,
//   GridItem,
//   SimpleGrid,
//   Text,
//   Heading,
//   VStack,
//   HStack,
//   Button,
//   Separator,
// } from "@chakra-ui/react";
// import CustomInput from "@/components/input/input";
// import CustomTextArea from "@/components/textarea/textarea";
// import CustomButton from "@/components/button/button";
// import UserMenu from "@/components/user-popover/user-popover";
// import { BellIcon } from "lucide-react";
// import { useForm } from "react-hook-form";
// import { useCreateMinutesOfMeetings } from "@/hooks/mutation/minutes-of-meeting/useCreateMinutesOfMeetings";
// import { useGetMinutesOfMeetingsById } from "@/hooks/query/minutes-of-meetings/useGetMinutesOfMeetingsById";
// import { useParams } from "react-router-dom";
// import { toaster } from "@/components/ui/toaster";

// const MinutesOfMeetingForm = () => {
//   const { id } = useParams();
//   const mode = id ? "edit" : "add";
//   console.log("mode1212", mode);
//   const {
//     register,
//     handleSubmit,
//     watch,
//     formState: { errors, isSubmitted },
//     reset,
//   } = useForm({
//     defaultValues: {
//       name: "",
//       date: new Date().toISOString().slice(0, 10),
//       transcription: "",
//       files: [],
//     },
//   });
//   const {
//     data: initialValues,
//     isLoading,
//     isPlaceholderData,
//   } = useGetMinutesOfMeetingsById(id, {
//     enabled: mode === "edit",
//   });

//   console.log("initialValues", initialValues);

//   const [details, setDetails] = useState("");
//   const [files, setFiles] = useState([]);
//   const [isDragActive, setIsDragActive] = useState(false);
//   const fileInputRef = useRef(null);

//   const watchTitle = watch("title") || "";
//   const watchDate = watch("date") || "";
//   const watchTranscript = watch("transcript") || "";
//   const watchFiles = watch("files") || [];
//   const { mutate: createMinutesOfMeeting, isPending: createPending } =
//     useCreateMinutesOfMeetings();
//   const { mutate: updateMinutesOfMeeting, isPending: updatePending } =
//     useCreateMinutesOfMeetings();

//   const formattedDate = useMemo(() => {
//     if (!watchDate) return "No date selected";
//     try {
//       return new Date(watchDate).toLocaleDateString(undefined, {
//         year: "numeric",
//         month: "short",
//         day: "2-digit",
//       });
//     } catch {
//       return watchDate;
//     }
//   }, [watchDate]);

//   const readFilePreview = (file) =>
//     new Promise((resolve) => {
//       const reader = new FileReader();
//       const obj = { name: file.name, size: file.size, type: file.type, file };
//       reader.onload = (ev) => {
//         obj.preview = file.type.startsWith("image/")
//           ? ev.target.result
//           : file.type.startsWith("text/") ||
//             /\.(txt|csv|json|log)$/i.test(file.name)
//           ? String(ev.target.result).slice(0, 2000)
//           : "";
//         resolve(obj);
//       };

//       if (file.type.startsWith("image/")) reader.readAsDataURL(file);
//       else reader.readAsText(file);
//     });

//   const handleFiles = async (fileList) => {
//     const incoming = Array.from(fileList || []);
//     const items = await Promise.all(incoming.map(readFilePreview));
//     setFiles((prev) => [...prev, ...items]);
//   };

//   const onDrop = (e) => {
//     e.preventDefault();
//     setIsDragActive(false);
//     if (e.dataTransfer?.files?.length) {
//       handleFiles(e.dataTransfer.files);
//     }
//   };

//   const hasContent =
//     watchTitle.trim() || details.trim() || watchTranscript.trim();

//   const onSubmit = (data) => {
//     const formData = new FormData();
//     Object.entries(data).forEach(([key, value]) => {
//       formData.append(key, value);
//     });
//     console.log("filesData", files);
//     formData.append("transcription_file", files?.[0]?.file);
//     if (initialValues.id) {
//       formData.append("id", initialValues.id || "");
//       updateMinutesOfMeeting({
//         id: initialValues.id,
//         formData: formData,
//       });
//     } else {
//       createMinutesOfMeeting(formData, {
//         onSuccess: () => {
//           toaster.success({
//             title: "Minutes of Meeting Created",
//             description: "Minutes of Meeting created successfully",
//           });
//           reset({
//             title: "",
//             date: new Date().toISOString().slice(0, 10),
//             transcription: "",
//           });
//           setFiles([]);
//         },
//       });
//     }
//   };

//   useEffect(() => {
//     if (initialValues && mode === "edit") {
//       reset({
//         name: initialValues.name,
//         date: initialValues.date,
//         transcription: initialValues.transcription,
//       });
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [initialValues, mode]);

//   return (
//     <>
//       <Box className="top-4 py-4 right-4 z-50 flex items-center justify-between w-full gap-4">
//         <VStack justify={"space-between"} gap="2" align={"flex-start"}>
//           <Text
//             color="#fff"
//             fontSize={{
//               base: "lg",
//               "2xl": "22px",
//               "3xl": "2xl",
//             }}
//             letterSpacing={"widest"}
//           >
//             Minutes of Meeting
//           </Text>
//         </VStack>

//         <div className="flex items-center justify-end gap-4">
//           <div className="flex items-center gap-4">
//             <UserMenu />
//             <BellIcon color="#fff" size={24} />
//           </div>
//         </div>
//       </Box>

//       <Box pb={6}>
//         <form onSubmit={handleSubmit(onSubmit)} noValidate>
//           <SimpleGrid columns={{ base: 1, lg: 2 }} gap={4}>
//             {/* Left: Inputs */}
//             <GridItem>
//               <Box
//                 bg="droidalBlack.300"
//                 border="1px solid rgba(255,255,255,0.06)"
//                 rounded="12px"
//                 boxShadow="0 10px 30px rgba(2,6,23,0.6)"
//                 p={4}
//               >
//                 <VStack align="stretch" spacing={4}>
//                   <CustomInput
//                     label="Meeting Title"
//                     placeholder="e.g. Sprint Planning  Week 42"
//                     {...register("name", {
//                       required: "Meeting title is required",
//                     })}
//                     invalid={!!errors.name}
//                     showError={!!errors.name}
//                     errorMessage={errors.name?.message}
//                   />

//                   <CustomInput
//                     label="Meeting Date"
//                     helperText="Defaults to today. You can clear this field if not needed."
//                     type="date"
//                     {...register("date")}
//                   />

//                   <CustomTextArea
//                     label="Transcript"
//                     placeholder="Paste or type the raw meeting transcript here..."
//                     minH="140px"
//                     autoresize
//                     {...register("transcription", {
//                       required:
//                         files.length === 0 ? "Transcript is required" : false,
//                     })}
//                   />

//                   <HStack my={4}>
//                     <Separator borderColor={"#2f4d78"} flex="1" />
//                     <Text color={"#2f4d78"} flexShrink="0">
//                       Or
//                     </Text>
//                     <Separator borderColor={"#2f4d78"} flex="1" />
//                   </HStack>

//                   <Box>
//                     <Text fontSize="sm" color="gray.300" mb={1}>
//                       Attachments (supporting files)
//                     </Text>
//                     <Box
//                       role="button"
//                       tabIndex={0}
//                       onClick={() => fileInputRef.current?.click()}
//                       onDragOver={(e) => {
//                         e.preventDefault();
//                         setIsDragActive(true);
//                       }}
//                       onDragLeave={() => setIsDragActive(false)}
//                       onDrop={onDrop}
//                       border="2px dashed"
//                       borderColor={isDragActive ? "cyan.400" : "whiteAlpha.300"}
//                       bg={isDragActive ? "rgba(0,194,216,0.02)" : "transparent"}
//                       rounded="10px"
//                       p={3}
//                       textAlign="center"
//                       color="gray.400"
//                     >
//                       Drag & drop files here or click to upload (agenda, slides,
//                       documents...)
//                     </Box>
//                     <input
//                       ref={fileInputRef}
//                       type="file"
//                       multiple
//                       style={{ display: "none" }}
//                       onChange={(e) =>
//                         e.target.files && handleFiles(e.target.files)
//                       }
//                     />
//                     {watchTranscript.length === 0 &&
//                       files.length === 0 &&
//                       isSubmitted && (
//                         <Text color={"red.600"}>
//                           Attachment or Transcript is required
//                         </Text>
//                       )}

//                     {!!files.length && (
//                       <VStack
//                         align="stretch"
//                         spacing={1}
//                         mt={3}
//                         maxH="120px"
//                         overflow="auto"
//                       >
//                         {files.map((f, idx) => (
//                           <HStack
//                             key={`${f.name}-${idx}`}
//                             justify="space-between"
//                             spacing={3}
//                             bg="rgba(255,255,255,0.03)"
//                             rounded="8px"
//                             p={2}
//                           >
//                             <HStack spacing={3} align="center">
//                               {f.type?.startsWith("image/") ? (
//                                 <Box
//                                   as="img"
//                                   src={f.preview}
//                                   alt={f.name}
//                                   w="36px"
//                                   h="36px"
//                                   objectFit="cover"
//                                   rounded="6px"
//                                 />
//                               ) : (
//                                 <Box
//                                   as="img"
//                                   alt={f.name}
//                                   w="36px"
//                                   h="36px"
//                                   rounded="6px"
//                                   src={`data:image/svg+xml;utf8,${encodeURIComponent(
//                                     `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36'><rect width='36' height='36' fill='#072234'/><text x='18' y='22' font-size='12' fill='#bfefff' text-anchor='middle'>${
//                                       f.name.split(".").pop()?.toUpperCase() ||
//                                       "FILE"
//                                     }</text></svg>`
//                                   )}`}
//                                 />
//                               )}
//                               <Box>
//                                 <Text fontSize="sm" color="white" noOfLines={1}>
//                                   {f.name}
//                                 </Text>
//                                 <Text fontSize="xs" color="gray.400">
//                                   {(f.size / 1024).toFixed(1)} KB
//                                 </Text>
//                               </Box>
//                             </HStack>
//                             <HStack spacing={2}>
//                               <Button
//                                 size="xs"
//                                 variant="ghost"
//                                 colorPalette="red"
//                                 onClick={() =>
//                                   setFiles((prev) =>
//                                     prev.filter((_, i) => i !== idx)
//                                   )
//                                 }
//                               >
//                                 Remove
//                               </Button>
//                             </HStack>
//                           </HStack>
//                         ))}
//                       </VStack>
//                     )}
//                   </Box>
//                 </VStack>
//               </Box>
//             </GridItem>

//             {/* Right: Output Viewer */}
//             <GridItem>
//               <Box
//                 bg="droidalBlack.300"
//                 border="1px solid rgba(255,255,255,0.06)"
//                 rounded="12px"
//                 boxShadow="0 10px 30px rgba(2,6,23,0.6)"
//                 p={4}
//               >
//                 <Text
//                   fontWeight="medium"
//                   letterSpacing="wider"
//                   color="white"
//                   mb={3}
//                   fontSize={{ base: "sm", "2xl": "md" }}
//                 >
//                   Output
//                 </Text>
//                 {initialValues?.output_file && (
//                   <iframe
//                     src={initialValues?.output_file}
//                     className="w-full h-[75vh] border-0"
//                     title={"Minutes of Meeting"}
//                   />
//                 )}
//               </Box>
//             </GridItem>
//           </SimpleGrid>
//           <Box display="flex" justifyContent="flex-end" mt={4}>
//             <CustomButton type="submit">Save</CustomButton>
//           </Box>
//         </form>
//       </Box>
//     </>
//   );
// };

// export default MinutesOfMeetingForm;

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Box,
  GridItem,
  SimpleGrid,
  Text,
  Heading,
  VStack,
  HStack,
  Button,
  Separator,
} from "@chakra-ui/react";
import CustomInput from "@/components/input/input";
import CustomTextArea from "@/components/textarea/textarea";
import CustomButton from "@/components/button/button";
import UserMenu from "@/components/user-popover/user-popover";
import { BellIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useCreateMinutesOfMeetings } from "@/hooks/mutation/minutes-of-meeting/useCreateMinutesOfMeetings";
import { useGetMinutesOfMeetingsById } from "@/hooks/query/minutes-of-meetings/useGetMinutesOfMeetingsById";
import { useNavigate, useParams } from "react-router-dom";
import { toaster } from "@/components/ui/toaster";
import { useUpdateMinutesOfMeetings } from "@/hooks/mutation/minutes-of-meeting/useUpdateMinutesOfMeetings";
import DocxViewer from "@/components/docx-viewer/docx-viewer";
// import DocumentEditorModal from "@/components/docx-editor/docx-editor";

const MinutesOfMeetingForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const mode = id ? "edit" : "add";
  const [open, setOpen] = useState(false);
  console.log("mode1212", mode);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted },
    reset,
  } = useForm({
    defaultValues: {
      name: `Minutes of Meeting - ${new Date().toISOString().slice(0, 10)}`,
      date: new Date().toISOString().slice(0, 10),
      transcription: "",
      files: [],
    },
  });
  const {
    data: initialValues,
    isLoading,
    isPlaceholderData,
  } = useGetMinutesOfMeetingsById(id, {
    enabled: mode === "edit",
  });

  console.log("initialValues", initialValues);

  const [details, setDetails] = useState("");
  const [files, setFiles] = useState([]);
  const [existingFile, setExistingFile] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const watchTitle = watch("title") || "";
  const watchDate = watch("date") || "";
  const watchTranscript = watch("transcript") || "";
  const watchFiles = watch("files") || [];
  const { mutate: createMinutesOfMeeting, isPending: createPending } =
    useCreateMinutesOfMeetings();
  const { mutate: updateMinutesOfMeeting, isPending: updatePending } =
    useUpdateMinutesOfMeetings();

  const formattedDate = useMemo(() => {
    if (!watchDate) return "No date selected";
    try {
      return new Date(watchDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });
    } catch {
      return watchDate;
    }
  }, [watchDate]);

  const readFilePreview = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      const obj = { name: file.name, size: file.size, type: file.type, file };
      reader.onload = (ev) => {
        obj.preview = file.type.startsWith("image/")
          ? ev.target.result
          : file.type.startsWith("text/") ||
            /\.(txt|csv|json|log)$/i.test(file.name)
          ? String(ev.target.result).slice(0, 2000)
          : "";
        resolve(obj);
      };

      if (file.type.startsWith("image/")) reader.readAsDataURL(file);
      else reader.readAsText(file);
    });

  const handleFiles = async (fileList) => {
    const incoming = Array.from(fileList || []);
    const items = await Promise.all(incoming.map(readFilePreview));
    setFiles((prev) => [...prev, ...items]);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer?.files?.length) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const hasContent =
    watchTitle.trim() || details.trim() || watchTranscript.trim();

  const onSubmit = (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    console.log("filesData", files);
    if (initialValues.id) {
      formData.append("id", initialValues.id || "");

      if (files.length > 0) {
        formData.append("transcription_file", files?.[0]?.file);
        formData.append("changed", "true");
      }
      if (data.transcription !== initialValues.transcription) {
        formData.append("changed", "true");
      }
      updateMinutesOfMeeting(
        {
          id: initialValues.id,
          formData: formData,
        },
        {
          onSuccess: () => {
            toaster.success({
              title: "Minutes of Meeting Updated",
              description: "Minutes of Meeting updated successfully",
            });
            reset({
              title: "",
              date: new Date().toISOString().slice(0, 10),
              transcription: "",
            });
            setFiles([]);
          },
          onError: (error) => {
            console.log("error", error);
            toaster.error({
              title: "Error",
              description: error.message || "Error updating minutes of meeting",
            });
          },
        }
      );
    } else {
      formData.append("transcription_file", files?.[0]?.file);

      createMinutesOfMeeting(formData, {
        onSuccess: (res) => {
          toaster.success({
            title: "Minutes of Meeting Created",
            description: "Minutes of Meeting created successfully",
          });
          navigate(`/smart-drive/minutes-of-meeting/view/${res.id}`);
          reset({
            title: "",
            date: new Date().toISOString().slice(0, 10),
            transcription: "",
          });
          setFiles([]);
        },
        onError: (error) => {
          console.log("error", error);
          toaster.error({
            title: "Error",
            description: error.message || "Error creating minutes of meeting",
          });
        },
      });
    }
  };

  useEffect(() => {
    if (initialValues && mode === "edit") {
      reset({
        name: initialValues.name,
        date: initialValues.date,
        transcription: initialValues.transcription,
      });

      // Set existing file from output_file
      if (initialValues.output_file) {
        const fileName =
          initialValues.output_file.split("/").pop() || "existing-file.pdf";
        setExistingFile({
          name: fileName,
          url: initialValues.output_file,
          isExisting: true,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues, mode]);

  const removeExistingFile = () => {
    setExistingFile(null);
  };

  return (
    <>
      <Box className="top-4 py-4 right-4 z-50 flex items-center justify-between w-full gap-4">
        <VStack justify={"space-between"} gap="2" align={"flex-start"}>
          <Text
            color="#fff"
            fontSize={{
              base: "lg",
              "2xl": "22px",
              "3xl": "2xl",
            }}
            letterSpacing={"widest"}
          >
            Minutes of Meeting
          </Text>
        </VStack>

        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-4">
            <UserMenu />
            <BellIcon color="#fff" size={24} />
          </div>
        </div>
      </Box>

      <Box pb={6}>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <SimpleGrid columns={{ base: 1 }} gap={4}>
            {/* Left: Inputs */}
            <GridItem>
              <Box
                bg="droidalBlack.300"
                border="1px solid rgba(255,255,255,0.06)"
                rounded="12px"
                boxShadow="0 10px 30px rgba(2,6,23,0.6)"
                p={4}
              >
                <VStack align="stretch" spacing={4}>
                  <SimpleGrid columns={{ base: 2 }} gap={4}>
                    <GridItem>
                      <CustomInput
                        label="Meeting Title"
                        placeholder="e.g. Sprint Planning  Week 42"
                        {...register("name", {
                          required: "Meeting title is required",
                        })}
                        invalid={!!errors.name}
                        showError={!!errors.name}
                        errorMessage={errors.name?.message}
                      />
                    </GridItem>
                    <GridItem>
                      <CustomInput
                        label="Meeting Date"
                        helperText="Defaults to today. You can clear this field if not needed."
                        type="date"
                        {...register("date")}
                      />
                    </GridItem>
                  </SimpleGrid>

                  <CustomTextArea
                    label="Transcript"
                    placeholder="Paste or type the raw meeting transcript here..."
                    minH="140px"
                    autoresize
                    {...register("transcription", {
                      required:
                        files.length === 0 && !existingFile
                          ? "Transcript is required"
                          : false,
                    })}
                  />

                  <HStack my={4}>
                    <Separator borderColor={"#2f4d78"} flex="1" />
                    <Text color={"#2f4d78"} flexShrink="0">
                      Or
                    </Text>
                    <Separator borderColor={"#2f4d78"} flex="1" />
                  </HStack>

                  <Box>
                    <Text fontSize="sm" color="gray.300" mb={1}>
                      Attachments (supporting files)
                    </Text>
                    <Box
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragActive(true);
                      }}
                      onDragLeave={() => setIsDragActive(false)}
                      onDrop={onDrop}
                      border="2px dashed"
                      borderColor={isDragActive ? "cyan.400" : "whiteAlpha.300"}
                      bg={isDragActive ? "rgba(0,194,216,0.02)" : "transparent"}
                      rounded="10px"
                      p={3}
                      textAlign="center"
                      color="gray.400"
                    >
                      Drag & drop files here or click to upload(Docx or text)
                    </Box>
                    <input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      style={{ display: "none" }}
                      accept="application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain"
                      onChange={(e) =>
                        e.target.files && handleFiles(e.target.files)
                      }
                    />
                    {watchTranscript.length === 0 &&
                      files.length === 0 &&
                      !existingFile &&
                      isSubmitted && (
                        <Text color={"red.600"}>
                          Attachment or Transcript is required
                        </Text>
                      )}

                    {/* Show existing file from edit mode */}
                    {existingFile && files.length === 0 && (
                      <VStack
                        align="stretch"
                        spacing={1}
                        mt={3}
                        maxH="120px"
                        overflow="auto"
                      >
                        <HStack
                          justify="space-between"
                          spacing={3}
                          bg="rgba(255,255,255,0.03)"
                          rounded="8px"
                          p={2}
                        >
                          <HStack spacing={3} align="center">
                            <Box
                              as="img"
                              alt={existingFile.name}
                              w="36px"
                              h="36px"
                              rounded="6px"
                              src={`data:image/svg+xml;utf8,${encodeURIComponent(
                                `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36'><rect width='36' height='36' fill='#072234'/><text x='18' y='22' font-size='12' fill='#bfefff' text-anchor='middle'>${
                                  existingFile.name
                                    .split(".")
                                    .pop()
                                    ?.toUpperCase() || "FILE"
                                }</text></svg>`
                              )}`}
                            />
                            <Box>
                              <Text fontSize="sm" color="white" noOfLines={1}>
                                {existingFile.name}
                              </Text>
                              <Text fontSize="xs" color="gray.400">
                                Existing file
                              </Text>
                            </Box>
                          </HStack>
                          <HStack spacing={2}>
                            <Button
                              size="xs"
                              variant="ghost"
                              colorPalette="red"
                              onClick={removeExistingFile}
                            >
                              Remove
                            </Button>
                          </HStack>
                        </HStack>
                      </VStack>
                    )}

                    {/* Show newly uploaded files */}
                    {!!files.length && (
                      <VStack
                        align="stretch"
                        spacing={1}
                        mt={3}
                        maxH="120px"
                        overflow="auto"
                      >
                        {files.map((f, idx) => (
                          <HStack
                            key={`${f.name}-${idx}`}
                            justify="space-between"
                            spacing={3}
                            bg="rgba(255,255,255,0.03)"
                            rounded="8px"
                            p={2}
                          >
                            <HStack spacing={3} align="center">
                              {f.type?.startsWith("image/") ? (
                                <Box
                                  as="img"
                                  src={f.preview}
                                  alt={f.name}
                                  w="36px"
                                  h="36px"
                                  objectFit="cover"
                                  rounded="6px"
                                />
                              ) : (
                                <Box
                                  as="img"
                                  alt={f.name}
                                  w="36px"
                                  h="36px"
                                  rounded="6px"
                                  src={`data:image/svg+xml;utf8,${encodeURIComponent(
                                    `<svg xmlns='http://www.w3.org/2000/svg' width='36' height='36'><rect width='36' height='36' fill='#072234'/><text x='18' y='22' font-size='12' fill='#bfefff' text-anchor='middle'>${
                                      f.name.split(".").pop()?.toUpperCase() ||
                                      "FILE"
                                    }</text></svg>`
                                  )}`}
                                />
                              )}
                              <Box>
                                <Text fontSize="sm" color="white" noOfLines={1}>
                                  {f.name}
                                </Text>
                                <Text fontSize="xs" color="gray.400">
                                  {(f.size / 1024).toFixed(1)} KB
                                </Text>
                              </Box>
                            </HStack>
                            <HStack spacing={2}>
                              <Button
                                size="xs"
                                variant="ghost"
                                colorPalette="red"
                                onClick={() =>
                                  setFiles((prev) =>
                                    prev.filter((_, i) => i !== idx)
                                  )
                                }
                              >
                                Remove
                              </Button>
                            </HStack>
                          </HStack>
                        ))}
                      </VStack>
                    )}
                  </Box>
                </VStack>
              </Box>
            </GridItem>

            {/* Right: Output Viewer */}
            <GridItem>
              <Box
                bg="droidalBlack.300"
                border="1px solid rgba(255,255,255,0.06)"
                rounded="12px"
                boxShadow="0 10px 30px rgba(2,6,23,0.6)"
                p={4}
              >
                <HStack
                  justifyContent={"space-between"}
                  alignContent={"center"}
                >
                  <Text
                    fontWeight="medium"
                    letterSpacing="wider"
                    color="white"
                    mb={3}
                    fontSize={{ base: "sm", "2xl": "md" }}
                  >
                    Output
                  </Text>
                </HStack>
                {/* <DocumentEditor readOnly={true} /> */}
                {initialValues?.output_file && (
                  <DocxViewer
                    url={initialValues?.output_file?.replace(
                      "http://",
                      "https://"
                    )}
                  />
                )}
              </Box>
            </GridItem>
          </SimpleGrid>
          <Box display="flex" justifyContent="flex-end" mt={4}>
            <CustomButton type="submit">Save</CustomButton>
          </Box>
        </form>
      </Box>
      {/* {open && (
        <DocumentEditorModal
          open={open}
          onClose={(v) => {
            setOpen(v ?? false);
          }}
          url={initialValues?.output_file}
        />
      )} */}
    </>
  );
};

export default MinutesOfMeetingForm;

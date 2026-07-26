import { useState, useEffect } from "react";
import {
  Box,
  Heading,
  VStack,
  HStack,
  Button,
  Text,
  Dialog,
  Portal,
  Input,
  Stack,
  Separator,
  IconButton,
} from "@chakra-ui/react";
import CustomInput from "@/components/input/input";
import CustomButton from "@/components/button/button";
import { useForm, Controller } from "react-hook-form";
import { toaster } from "@/components/ui/toaster";
import ReactQuill, { Quill } from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import BlotFormatter from "quill-blot-formatter";
import { Plus, Trash2, PenLine, Settings, BellIcon } from "lucide-react";
import CustomBreadcrumb from "@/components/breadcrumb/breadcrumb";
import UserMenu from "@/components/user-popover/user-popover";
import { useGetMinutesOfMeetings } from "@/hooks/query/minutes-of-meetings/useGetMinutesOfMeetings";
import CustomSelect from "@/components/ui/select";

Quill.register("modules/blotFormatter", BlotFormatter);

// Custom styles for ReactQuill dark mode
const quillStyles = {
  ".ql-toolbar": {
    backgroundColor: "#e2e8f0",
    borderTopLeftRadius: "8px",
    borderTopRightRadius: "8px",
    borderColor: "rgba(255,255,255,0.1) !important",
  },
  ".ql-container": {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderBottomLeftRadius: "8px",
    borderBottomRightRadius: "8px",
    borderColor: "rgba(255,255,255,0.1) !important",
    color: "white",
    fontSize: "16px",
  },
  ".ql-editor": {
    minHeight: "200px",
  },
  ".ql-editor.ql-blank::before": {
    color: "rgba(255,255,255,0.4)",
    fontStyle: "normal",
  },
};

const modules = {
  toolbar: [
    [{ header: [1, 2, false] }],
    ["bold", "italic", "underline", "strike", "blockquote"],
    [
      { list: "ordered" },
      { list: "bullet" },
      { indent: "-1" },
      { indent: "+1" },
    ],
    ["link", "image"],
    ["clean"],
  ],
  blotFormatter: {},
};

const SignatureManager = ({ isOpen, onClose, onInsert }) => {
  const [signatures, setSignatures] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSignature, setCurrentSignature] = useState({
    title: "",
    content: "",
  });

  useEffect(() => {
    const saved = localStorage.getItem("mail_signatures");
    if (saved) {
      setSignatures(JSON.parse(saved));
    }
  }, []);

  const saveSignatures = (newSignatures) => {
    setSignatures(newSignatures);
    localStorage.setItem("mail_signatures", JSON.stringify(newSignatures));
  };

  const handleSave = () => {
    if (!currentSignature.title || !currentSignature.content) {
      toaster.error({
        title: "Error",
        description: "Title and content are required",
      });
      return;
    }

    let newSignatures;
    if (currentSignature.id) {
      newSignatures = signatures.map((s) =>
        s.id === currentSignature.id ? currentSignature : s
      );
    } else {
      newSignatures = [...signatures, { ...currentSignature, id: Date.now() }];
    }

    saveSignatures(newSignatures);
    setIsEditing(false);
    setCurrentSignature({ title: "", content: "" });
    toaster.success({ title: "Success", description: "Signature saved" });
  };

  const handleDelete = (id) => {
    const newSignatures = signatures.filter((s) => s.id !== id);
    saveSignatures(newSignatures);
    toaster.success({ title: "Success", description: "Signature deleted" });
  };

  const handleEdit = (sig) => {
    setCurrentSignature(sig);
    setIsEditing(true);
  };

  const handleAddNew = () => {
    setCurrentSignature({ title: "", content: "" });
    setIsEditing(true);
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(details) => !details.open && onClose()}
      size="lg"
      placement={"center"}
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content bg="droidalBlack.300" color="white" maxW="600px">
            <Dialog.Header>
              <Dialog.Title m={0} fontSize="lg" fontWeight="light">
                {isEditing
                  ? currentSignature.id
                    ? "Edit Signature"
                    : "New Signature"
                  : "Manage Signatures"}
              </Dialog.Title>
              <Dialog.CloseTrigger onClick={onClose} />
            </Dialog.Header>
            <Dialog.Body>
              {isEditing ? (
                <VStack spacing={4} align="stretch">
                  <Box>
                    <Text mb={2} fontSize="sm" color="gray.300">
                      Title
                    </Text>
                    <Input
                      value={currentSignature.title}
                      onChange={(e) =>
                        setCurrentSignature({
                          ...currentSignature,
                          title: e.target.value,
                        })
                      }
                      placeholder="e.g. Professional, Casual"
                      color="white"
                      bg="rgba(255,255,255,0.05)"
                      borderColor="rgba(255,255,255,0.1)"
                    />
                  </Box>
                  <Box sx={quillStyles}>
                    <Text mb={2} fontSize="sm" color="gray.300">
                      Content
                    </Text>
                    <ReactQuill
                      value={currentSignature.content}
                      onChange={(val) => {
                        console.log("Signature content changed:", val);
                        setCurrentSignature({
                          ...currentSignature,
                          content: val,
                        });
                      }}
                      theme="snow"
                      modules={modules}
                    />
                  </Box>
                  <HStack justify="flex-end" mt={4}>
                    <CustomButton
                      variant="plain"
                      color="white"
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </CustomButton>
                    <CustomButton onClick={handleSave}>
                      Save Signature
                    </CustomButton>
                  </HStack>
                </VStack>
              ) : (
                <VStack spacing={4} align="stretch">
                  {signatures.length === 0 ? (
                    <Text color="gray.400" textAlign="center" py={8}>
                      No signatures found. Create one to get started.
                    </Text>
                  ) : (
                    signatures.map((sig) => (
                      <HStack
                        key={sig.id}
                        justify="space-between"
                        p={3}
                        bg="rgba(255,255,255,0.05)"
                        rounded="md"
                      >
                        <VStack align="start" spacing={0}>
                          <Text fontWeight="bold">{sig.title}</Text>
                          <Text
                            fontSize="xs"
                            color="gray.400"
                            noOfLines={1}
                            dangerouslySetInnerHTML={{
                              __html: sig.content.replace(/<[^>]*>?/gm, ""),
                            }}
                          />
                        </VStack>
                        <HStack>
                          {onInsert && (
                            <Button
                              size="sm"
                              variant="ghost"
                              color="cyan.400"
                              onClick={() => onInsert(sig)}
                            >
                              Insert
                            </Button>
                          )}
                          <IconButton
                            size="sm"
                            variant="ghost"
                            aria-label="Edit"
                            onClick={() => handleEdit(sig)}
                          >
                            <PenLine size={16} />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="ghost"
                            color="red.400"
                            aria-label="Delete"
                            onClick={() => handleDelete(sig.id)}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </HStack>
                      </HStack>
                    ))
                  )}
                  <Button
                    variant="outline"
                    color="white"
                    borderColor="rgba(255,255,255,0.2)"
                    onClick={handleAddNew}
                  >
                    <Plus size={16} /> Add New Signature
                  </Button>
                </VStack>
              )}
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

const MailBox = () => {
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const { data: meetings, isLoading } = useGetMinutesOfMeetings();
  const {
    register,
    handleSubmit,
    control,
    setValue,
    getValues,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      to: "",
      subject: "",
      body: "",
    },
  });

  const onSubmit = (data) => {
    console.log("Sending mail:", data);
    toaster.success({
      title: "Mail Sent",
      description: "Mail sent successfully",
    });
    reset();
  };

  const handleSaveTemplate = (data) => {
    console.log("Saving template:", data);
    toaster.success({
      title: "Template Saved",
      description: "Mail saved as template successfully",
    });
  };

  const insertSignature = (sig) => {
    const currentBody = getValues("body") || "";
    setValue("body", currentBody + "<br/><br/>" + sig.content);
    setIsSignatureModalOpen(false);
    toaster.success({ title: "Success", description: "Signature inserted" });
  };

  return (
    <>
      <Box className="top-4 py-6 right-4 z-50 flex items-center justify-between w-full gap-4">
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
            SmartDrive: Minutes of Meetings
          </Text>
          <CustomBreadcrumb dashboardType={"SmartDrive"} />
        </VStack>

        <div className="flex items-center justify-end gap-4">
          <div className="flex items-center gap-4">
            <UserMenu />
            <BellIcon color="#fff" size={24} />
          </div>
        </div>
      </Box>
      <Box
        bg="droidalBlack.300"
        border="1px solid rgba(255,255,255,0.06)"
        rounded="12px"
        boxShadow="0 10px 30px rgba(2,6,23,0.6)"
        p={6}
      >
        <HStack justify="space-between" mb={6}>
          <Heading size="md" color="white" letterSpacing="wider">
            Compose Mail
          </Heading>
          <CustomSelect
            placeholder="Choose the MoM to attach"
            width="300px"
            options={
              meetings
                ? meetings.map((meeting) => ({
                    value: meeting.id,
                    label: meeting.name,
                  }))
                : []
            }
          />
        </HStack>
        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <VStack spacing={4} align="stretch">
            <CustomInput
              label="To"
              placeholder="recipient@example.com"
              {...register("to", {
                required: "Recipient is required",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "Invalid email address",
                },
              })}
              invalid={!!errors.to}
              showError={!!errors.to}
              errorMessage={errors.to?.message}
            />
            <CustomInput
              label="Subject"
              placeholder="Mail Subject"
              {...register("subject", {
                required: "Subject is required",
              })}
              invalid={!!errors.subject}
              showError={!!errors.subject}
              errorMessage={errors.subject?.message}
            />

            <Box sx={quillStyles}>
              <Text
                color="white"
                fontWeight={"light"}
                fontSize={{ base: "xs", "2xl": "sm", "3xl": "md" }}
                letterSpacing={"wider"}
                mb={2}
              >
                Message
              </Text>
              <Controller
                name="body"
                control={control}
                rules={{ required: "Message body is required" }}
                render={({ field }) => (
                  <ReactQuill
                    theme="snow"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Type your message here..."
                    modules={modules}
                  />
                )}
              />
              {errors.body && (
                <Text color="red.500" fontSize="sm" mt={1}>
                  {errors.body.message}
                </Text>
              )}
            </Box>

            <HStack justify="space-between" mt={4}>
              <Button
                variant="outline"
                size="sm"
                color="white"
                borderColor="rgba(255,255,255,0.2)"
                onClick={() => setIsSignatureModalOpen(true)}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                <Settings size={16} /> Manage Signatures
              </Button>

              <HStack spacing={4}>
                <Button
                  variant="outline"
                  onClick={handleSubmit(handleSaveTemplate)}
                  color="white"
                  borderColor="rgba(255,255,255,0.2)"
                  _hover={{ bg: "whiteAlpha.100" }}
                >
                  Save as Template
                </Button>
                <CustomButton type="submit">Send Mail</CustomButton>
              </HStack>
            </HStack>
          </VStack>
        </form>

        <SignatureManager
          isOpen={isSignatureModalOpen}
          onClose={() => setIsSignatureModalOpen(false)}
          onInsert={insertSignature}
        />
      </Box>
    </>
  );
};

export default MailBox;

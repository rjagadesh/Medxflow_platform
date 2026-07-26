import React, { useState } from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Menu,
  Portal,
  Bleed,
  Checkbox,
  Button,
  Spinner,
} from "@chakra-ui/react";
import {
  ChevronDown,
  ExternalLink,
  CheckCircle,
  SquarePlusIcon,
  SquareMinusIcon,
} from "lucide-react";
import CustomSelect from "@/components/ui/select";
import { Outlet, useNavigate, useParams } from "react-router-dom";
import {
  LABS,
  DOCUMENTS,
  noteSections,
  noteTypeSections,
} from "./encounter-notes-data";
import VitalsNotes from "@/features/pms/encounter-notes/vitals-notes";
import { useGetPatientById } from "@/hooks/query/pms/pms_appointments/useGetPatientById";
import { format } from "date-fns";
import { useGetAppointmentById } from "@/hooks/query/pms/pms_appointments/useGetAppointments";
import {
  EncounterNotesProvider,
  useEncounterNotes,
} from "./encounter-notes-context";
import { useGetClinicalNote } from "@/hooks/query/pms/clinical-notes/useGetClinicalNote";
import { useGetClinicalNotesByPatient } from "@/hooks/query/pms/clinical-notes/useGetClinicalNotesByPatient";
import { useSaveClinicalNote } from "@/hooks/mutation/pms/clinical-notes/useSaveClinicalNote";
import { useSignOffClinicalNote } from "@/hooks/mutation/pms/clinical-notes/useSignOffClinicalNote";
import ConfirmationDialog from "@/components/confirmation-dialog/confirmation-dialog";
import { useDebounce } from "@/hooks/useDebounce";
import { toaster } from "@/components/ui/toaster";
import { ChevronLeft } from "lucide-react";
import { ArrowLeft } from "lucide-react";

// --- Sub-Components ---
const PatientHeader = ({ patient }) => {
  const navigate = useNavigate();
  return (
    <Flex
      justify="space-between"
      align="center"
      bg="droidalBlack.300"
      p={2}
      borderBottom="1px solid #2f4d78"
    >
      <HStack gap={2} px={2}>
        <Button
          size="sm"
          variant="solid"
          color="white"
          borderColor="droidalGray.300"
          fontWeight="normal"
          onClick={() => {
            navigate(-1);
          }}
          _hover={{ bg: "whiteAlpha.100" }}
        >
          <ArrowLeft />
          Back
        </Button>
        <Text
          letterSpacing={"wider"}
          fontWeight="light"
          fontSize="md"
          color="white"
        >
          {patient?.full_name} ({patient?.gender})
        </Text>
        <Text
          letterSpacing={"wider"}
          fontWeight="light"
          fontSize="sm"
          color="droidalGray.400"
        >
          Legal Name: {patient?.full_name} • MRN: {patient?.mrn} • DOB:{" "}
          {patient?.dob ? format(new Date(patient.dob), "dd MMM yyyy") : ""} (
          {patient?.age} Year old)
        </Text>
      </HStack>
      {/* <HStack gap={2}>
      <CustomSelect
        options={[{ label: "Actions", value: "actions" }]}
        placeholder="Actions"
        w="120px"
        size="sm"
        css={{
          borderRadius: "4px !important",
          borderColor: "#2f4d78",
        }}
        borderColor="#2f4d78"
      />
    </HStack> */}
    </Flex>
  );
};

const PatientCard = ({ patient }) => (
  <Box bg="droidalBlack.300" borderRadius="md" p={3} border="1px solid #2f4d78">
    <Text letterSpacing={"wider"} fontWeight="light" color="white" mb={2}>
      {patient?.full_name}
    </Text>
    <HStack align="start" gap={3} mb={3}>
      <img
        width={80}
        src={
          patient?.profile_picture
            ? patient.profile_picture.replace("http://", "https://") + "/"
            : "/PersonPlaceholder.png"
        }
        height={80}
        style={{
          borderRadius: "12px",
          objectPosition: "center",
          objectFit: "contain",
        }}
        className="border-[0.5px] border-gray-300"
      />
      <VStack align="start" gap={0}>
        <Text
          letterSpacing={"wider"}
          fontWeight="light"
          fontSize="xs"
          color="white"
        >
          {patient?.dob ? format(new Date(patient.dob), "dd MMM yyyy") : ""} (
          {patient?.age} year old)
        </Text>
        <Text
          letterSpacing={"wider"}
          fontWeight="light"
          fontSize="xs"
          color="droidalGray.400"
        >
          Sex: {patient?.gender}
        </Text>
        <Text
          letterSpacing={"wider"}
          fontWeight="light"
          fontSize="xs"
          color="droidalGray.400"
        >
          {patient?.mobile_phone}
        </Text>
        <Text
          letterSpacing={"wider"}
          fontWeight="light"
          fontSize="xs"
          color="droidalGray.400"
        >
          {patient?.insurance_name?.displayName}
        </Text>
      </VStack>
    </HStack>
    <VStack align="stretch" gap={1}>
      {["Facesheet", "Immunizations", "Flowsheets"].map((item) => (
        <Flex
          key={item}
          justify="space-between"
          align="center"
          cursor="pointer"
          _hover={{ color: "primary.400" }}
        >
          <Text
            letterSpacing={"wider"}
            fontWeight="light"
            fontSize="sm"
            color="white"
          >
            {item}
          </Text>
          <ExternalLink size={12} color="gray" />
        </Flex>
      ))}
    </VStack>
  </Box>
);

const SidebarSection = ({ title, children, action }) => (
  <Box
    bg="droidalBlack.300"
    borderRadius="md"
    border="1px solid #2f4d78"
    overflow="hidden"
  >
    <Flex
      justify="space-between"
      align="center"
      p={2}
      borderBottom="1px solid #2f4d78"
      bg="droidalBlack.400"
    >
      <Text
        letterSpacing={"wider"}
        fontWeight="light"
        fontSize="sm"
        color="white"
      >
        {title}
      </Text>
      {action &&
        (typeof action === "string" ? (
          <Text
            fontSize="xs"
            color="primary.400"
            cursor="pointer"
            _hover={{ textDecoration: "underline" }}
          >
            {action}
          </Text>
        ) : (
          action
        ))}
    </Flex>
    <Box p={2} maxH="200px" overflowY="auto">
      {children}
    </Box>
  </Box>
);

const EncounterNotesContent = ({ visibleSections, setVisibleSections }) => {
  const [noteDate, setNoteDate] = useState(new Date("2024-10-25"));
  const [noteTime, setNoteTime] = useState("11:30");
  const [assignedTo, setAssignedTo] = useState("diana_hudson");
  const [activeSection, setActiveSection] = useState("Subjective");
  const [selectedNoteType, setSelectedNoteType] = useState("SOAP");
  const { patient_id, appointment_id } = useParams();
  const { data: patient } = useGetPatientById(patient_id);
  const { data: appointmentData } = useGetAppointmentById(appointment_id);
  const { data: clinicalNoteData, isLoading: isLoadingClinicalNote } =
    useGetClinicalNote(appointment_id, patient_id);

  const { data: pastNotesDataRes, isLoading: isLoadingPastNotes } =
    useGetClinicalNotesByPatient(patient_id);

  const { notes: pastNotesData = [] } = pastNotesDataRes;
  const pastNotesDataFilter = pastNotesData.filter(
    (note) => note.id === clinicalNoteData?.id,
  );
  console.log("clinicalNoteData", clinicalNoteData);
  const { mutate: saveClinicalNote, isPending: isSaving } =
    useSaveClinicalNote();
  const { mutateAsync: signOffClinicalNoteAsync, isPending: isSigningOff } =
    useSignOffClinicalNote();
  const [lastSaved, setLastSaved] = useState(null);

  // console.log("patient1212", patient);
  console.log("clinicalNoteData", clinicalNoteData);

  const { notesState, setNotesState } = useEncounterNotes();
  console.log("data11notesState", notesState);

  React.useEffect(() => {
    if (clinicalNoteData?.updated_at) {
      setLastSaved(new Date(clinicalNoteData.updated_at));
    }
  }, [clinicalNoteData]);

  const hasLoadedNotes = React.useRef(false);

  React.useEffect(() => {
    hasLoadedNotes.current = false;
  }, [appointment_id]);

  React.useEffect(() => {
    if (clinicalNoteData && !hasLoadedNotes.current) {
      console.log("Populating clinical note data...", clinicalNoteData);
      if (clinicalNoteData.active_section) {
        setVisibleSections(clinicalNoteData.active_section);
      }
      if (clinicalNoteData.sections_notes) {
        setNotesState(clinicalNoteData.sections_notes);
      }
      if (clinicalNoteData.notes_type) {
        setSelectedNoteType(clinicalNoteData.notes_type);
      }
      if (clinicalNoteData.assigned_to) {
        setAssignedTo(String(clinicalNoteData.assigned_to));
      }
      hasLoadedNotes.current = true;
    }
  }, [clinicalNoteData, appointment_id, setNotesState, setVisibleSections]);

  // --- Auto Save Logic ---
  const payloadToDebounce = React.useMemo(() => {
    return {
      notesState,
      visibleSections,
      assignedTo,
      selectedNoteType,
    };
  }, [notesState, visibleSections, assignedTo, selectedNoteType]);

  const debouncedPayloadData = useDebounce(payloadToDebounce, 10000);
  const isMounted = React.useRef(false);

  React.useEffect(() => {
    if (isLoadingClinicalNote) return;
    if (!isMounted.current) {
      isMounted.current = true;
      return;
    }

    if (appointmentData && patient) {
      const autoSavePayload = {
        notes_type: debouncedPayloadData.selectedNoteType,
        assigned_to: debouncedPayloadData.assignedTo
          ? Number(debouncedPayloadData.assignedTo)
          : null,
        appointment_id: Number(appointment_id),
        patient_id: patient_id,
        active_sections: debouncedPayloadData.visibleSections,
        sections_notes: debouncedPayloadData.notesState,
      };

      console.log("Auto-saving Clinical Note...", autoSavePayload);
      saveClinicalNote(
        {
          appointmentId: appointment_id,
          patientId: patient_id,
          data: autoSavePayload,
        },
        {
          onSuccess: () => {
            setLastSaved(new Date());
          },
        },
      );
    }
  }, [
    debouncedPayloadData,
    appointmentData,
    patient,
    appointment_id,
    patient_id,
    saveClinicalNote,
    isLoadingClinicalNote,
  ]);
  // -----------------------

  const handleSave = () => {
    const currentDate = new Date().toISOString().split("T")[0];
    const userId = 1; // Default user ID (replace with actual user context if available)

    const payload = {
      notes_type: selectedNoteType,
      assigned_to: assignedTo ? Number(assignedTo) : null,
      appointment_id: Number(appointment_id),
      patient_id: patient_id,
      active_section: visibleSections,
      sections_notes: notesState,
      sign_off_by: userId,
      sign_off_at: currentDate,
      saved_at: currentDate,
      saved_by: userId,
      created_at: currentDate,
      updated_at: currentDate,
    };

    console.log("Saving Clinical Note Payload:", payload);
    saveClinicalNote(
      {
        appointmentId: appointment_id,
        patientId: patient_id,
        data: payload,
      },
      {
        onSuccess: () => {
          setLastSaved(new Date());
        },
      },
    );
  };

  const handleSignOff = async () => {
    if (clinicalNoteData?.id) {
      try {
        await signOffClinicalNoteAsync(clinicalNoteData.id, {
          onSuccess: () => {
            toaster.success({
              title: "Clinical Note Signed Off",
              description:
                "The clinical note has been signed off successfully.",
            });
          },
          onError: () => {
            toaster.error({
              title: "Error",
              description: "Failed to sign off clinical note.",
            });
          },
        });
        return true;
      } catch (error) {
        console.error("Error signing off clinical note:", error);
        return false;
      }
    }
    return false;
  };

  React.useEffect(() => {
    if (appointmentData) {
      if (appointmentData.date) {
        setNoteDate(new Date(appointmentData.date));
      }
      if (appointmentData.time) {
        // time might be "17:30:00", we need "17:30" for input type=time
        const timeStr = appointmentData.time.substring(0, 5);
        setNoteTime(timeStr);
      }
      if (appointmentData.provider) {
        setAssignedTo(String(appointmentData.provider));
      } else if (appointmentData.provider_name) {
        // Fallback or logic if provider ID logic differs
      }
    }
  }, [appointmentData]);

  const availableSections = noteSections.filter(
    (s) => !visibleSections.includes(s.value),
  );

  return (
    <Bleed inline={"4"}>
      <Box h="calc(100vh)">
        <Flex direction="column" bg="droidalBlack.500" color="white">
          {/* 1. Top Header */}
          <PatientHeader patient={patient} />

          <Flex flex="1" px={2} overflow="hidden">
            {/* 2. Left Sidebar */}
            <VStack
              w="280px"
              minW="280px"
              p={2}
              gap={2}
              align="stretch"
              borderRight="1px solid #2f4d78"
              overflowY="auto"
              className="custom-scrollbar"
            >
              <PatientCard patient={patient} />

              <SidebarSection title="Patient Notes">
                <VStack align="stretch" gap={2}>
                  {isLoadingPastNotes ? (
                    <Spinner size="sm" color="white" />
                  ) : pastNotesDataFilter?.length > 0 ? (
                    pastNotesDataFilter.map((note, idx) => (
                      <Box
                        key={note.id || idx}
                        cursor="pointer"
                        _hover={{ bg: "whiteAlpha.100" }}
                        p={1}
                        borderRadius="sm"
                      >
                        <Text
                          letterSpacing={"wider"}
                          fontWeight="light"
                          fontSize="xs"
                          color="white"
                        >
                          {note.updated_at
                            ? format(new Date(note.updated_at), "MM/dd/yyyy")
                            : format(new Date(), "MM/dd/yyyy")}
                        </Text>
                        <Flex justify="space-between" align="center">
                          <Text
                            letterSpacing={"wider"}
                            fontWeight="light"
                            fontSize="xs"
                            color="droidalGray.400"
                            isTruncated
                          >
                            -{" "}
                            {note.notes_type ||
                              (note.sections_notes &&
                                Object.values(note.sections_notes)[0]) ||
                              "Clinical Note"}
                          </Text>
                          <ChevronDown size={12} color="gray" />
                        </Flex>
                      </Box>
                    ))
                  ) : (
                    <Text fontSize="xs" color="droidalGray.400">
                      No past notes found.
                    </Text>
                  )}
                  {/* <Text
                    letterSpacing={"wider"}
                    fontWeight="light"
                    fontSize="xs"
                    color="primary.400"
                    cursor="pointer"
                  >
                    Load more...
                  </Text> */}
                </VStack>
              </SidebarSection>

              <SidebarSection
                title="Note Sections"
                action={
                  <Menu.Root>
                    <Menu.Trigger>
                      <Text
                        fontSize="xs"
                        color="primary.400"
                        cursor="pointer"
                        _hover={{ textDecoration: "underline" }}
                      >
                        Add Optional
                      </Text>
                    </Menu.Trigger>
                    <Portal>
                      <Menu.Positioner>
                        <Menu.Content
                          maxH="300px"
                          overflowY="auto"
                          bg="droidalBlack.300"
                          borderColor="#2f4d78"
                        >
                          {availableSections.map((s) => (
                            <Menu.Item
                              key={s.value}
                              onClick={() => {
                                setVisibleSections([
                                  ...visibleSections,
                                  s.value,
                                ]);
                                setActiveSection(s.value);
                              }}
                              bg="droidalBlack.300"
                              _hover={{ bg: "whiteAlpha.100" }}
                              color="white"
                            >
                              {s.label}{" "}
                              <Menu.ItemCommand>
                                <SquarePlusIcon color="#2f4d78" size="14" />
                              </Menu.ItemCommand>
                            </Menu.Item>
                          ))}
                        </Menu.Content>
                      </Menu.Positioner>
                    </Portal>
                  </Menu.Root>
                }
              >
                <VStack align="stretch" gap={0}>
                  {visibleSections.map((section) => (
                    <Flex
                      key={section}
                      justify="space-between"
                      align="center"
                      p={1}
                      cursor="pointer"
                      bg={
                        activeSection === section
                          ? "primary.900"
                          : "transparent"
                      }
                      _hover={{ bg: "whiteAlpha.100" }}
                      onClick={() => setActiveSection(section)}
                    >
                      <Text
                        fontSize="sm"
                        color={
                          activeSection === section
                            ? "white"
                            : "droidalGray.400"
                        }
                      >
                        {section}
                      </Text>
                      <SquareMinusIcon
                        size={12}
                        color={activeSection === section ? "white" : "gray"}
                      />
                    </Flex>
                  ))}
                </VStack>
              </SidebarSection>

              <SidebarSection title="Labs/Studies">
                <VStack align="stretch" gap={2}>
                  {LABS.map((lab, idx) => (
                    <Box key={idx} p={1} borderBottom="1px solid #333">
                      <Text
                        letterSpacing={"wider"}
                        fontWeight="light"
                        fontSize="xs"
                        color="white"
                      >
                        {lab.date} - {lab.name}
                      </Text>
                    </Box>
                  ))}
                </VStack>
              </SidebarSection>

              <SidebarSection title="Documents" action="Filter by Label: All">
                <VStack align="stretch" gap={2}>
                  {DOCUMENTS.map((doc, idx) => (
                    <Box key={idx} p={1}>
                      <Flex justify="space-between">
                        <Text fontSize="xs" color="white" isTruncated>
                          {doc.date} - {doc.name}
                        </Text>
                        <HStack gap={1}>
                          <ExternalLink size={10} color="gray" />
                          <CheckCircle size={10} color="gray" />
                        </HStack>
                      </Flex>
                      <Text
                        letterSpacing={"wider"}
                        fontWeight="light"
                        fontSize="xs"
                        color="droidalGray.300"
                      >
                        {doc.type}
                      </Text>
                    </Box>
                  ))}
                  <Text
                    letterSpacing={"wider"}
                    fontWeight="light"
                    fontSize="xs"
                    color="primary.400"
                    cursor="pointer"
                  >
                    Load more...
                  </Text>
                </VStack>
              </SidebarSection>
            </VStack>

            {/* 3. Main Content Outlet */}
            <Box flex="1" overflowY="auto" className="custom-scrollbar">
              <Outlet
                context={{
                  noteDate,
                  setNoteDate,
                  noteTime,
                  setNoteTime,
                  assignedTo,
                  setAssignedTo,
                  activeSection,
                  setActiveSection,
                  selectedNoteType,
                  setSelectedNoteType,
                  visibleSections,
                  setVisibleSections,
                  appointmentData,
                }}
              />
            </Box>
          </Flex>
          {/* Footer */}
          <Flex
            position="sticky"
            bottom={0}
            zIndex={10}
            bg="droidalBlack.500"
            h="50px"
            borderTop="1px solid #2f4d78"
            align="center"
            px={4}
            justify="space-between"
          >
            {/* <HStack gap={4}>
            <Button
              size="sm"
              variant="outline"
              color="white"
              borderColor="droidalGray.300"
              fontWeight="normal"
              onClick={() => {}}
              _hover={{ bg: "whiteAlpha.100" }}
            >
              Capture Charge
            </Button>
            <Button
              size="sm"
              variant="outline"
              color="white"
              borderColor="droidalGray.300"
              fontWeight="normal"
              onClick={() => {}}
              _hover={{ bg: "whiteAlpha.100" }}
            >
              Copy
            </Button>

            <HStack
              gap={3}
              pl={2}
              borderLeft="1px solid"
              borderColor="droidalGray.300"
              >
              <Text letterSpacing={"wider"} fontWeight="light" fontSize="sm">
                ToC:
              </Text>

              <Checkbox.Root
                size={{
                  base: "sm",
                  "2xl": "md",
                  "3xl": "lg",
                }}
                aria-label="Select all rows"
                onCheckedChange={() => {}}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control
                  _checked={{
                    bgImage:
                      "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                  }}
                  borderColor="#2f4d78"
                  bgColor={"black"}
                />
                <Checkbox.Label color={"droidalGray.400"}>
                  Receiving
                </Checkbox.Label>
              </Checkbox.Root>
              <Checkbox.Root
                size={{
                  base: "sm",
                  "2xl": "md",
                  "3xl": "lg",
                }}
                aria-label="Select all rows"
                onCheckedChange={() => {}}
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control
                  _checked={{
                    bgImage:
                      "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                  }}
                  borderColor="#2f4d78"
                  bgColor={"black"}
                />
                <Checkbox.Label color={"droidalGray.400"}>
                  Transferring
                </Checkbox.Label>
              </Checkbox.Root>

              <Button
                size="sm"
                variant="outline"
                color="white"
                borderColor="droidalGray.300"
                fontWeight="normal"
                onClick={() => {}}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Care Coordination
              </Button>
              <Button
                size="sm"
                variant="outline"
                color="white"
                borderColor="droidalGray.300"
                fontWeight="normal"
                onClick={() => {}}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Care Checklist
              </Button>
            </HStack>
          </HStack> */}

            <HStack gap={4}>
              {/* <Checkbox.Root
              size={{
                base: "sm",
                "2xl": "md",
                "3xl": "lg",
              }}
              aria-label="Select all rows"
              onCheckedChange={() => {}}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control
                _checked={{
                  bgImage:
                    "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                }}
                borderColor="#2f4d78"
                bgColor={"black"}
              />
              <Checkbox.Label color={"droidalGray.400"}>
                Mark as Confidential Note
              </Checkbox.Label>
            </Checkbox.Root> */}

              <Button
                size="sm"
                variant="outline"
                color="white"
                borderColor="droidalGray.300"
                fontWeight="normal"
                onClick={handleSave}
                _hover={{ bg: "whiteAlpha.100" }}
              >
                Save & Close
                {/* <ChevronDown /> */}
              </Button>
              <HStack gap={2}>
                {isSaving && <Spinner size="xs" color="droidalGray.300" />}
                <Text
                  fontSize="xs"
                  color="droidalGray.300"
                  textDecoration="underline"
                >
                  {isSaving
                    ? "Saving..."
                    : lastSaved
                      ? `Last Saved ${format(lastSaved, "hh:mm a")}`
                      : ""}
                </Text>
              </HStack>
            </HStack>
            <HStack gap={1}>
              <ConfirmationDialog
                title="Sign Clinical Note"
                description="Are you sure you want to sign off this clinical note? This action cannot be undone."
                onConfirm={handleSignOff}
                loading={isSigningOff}
                buttonName="Sign"
                buttonProps={{
                  size: "sm",
                  variant: "outline",
                  color: "white",
                  borderColor: "droidalGray.300",
                  fontWeight: "normal",
                  _hover: { bg: "whiteAlpha.100" },
                }}
              />
            </HStack>
          </Flex>
        </Flex>
      </Box>
    </Bleed>
  );
};

const EncounterNotes = () => {
  const [visibleSections, setVisibleSections] = useState(
    noteTypeSections["SOAP"] || [],
  );

  return (
    <EncounterNotesProvider visibleSections={visibleSections}>
      <EncounterNotesContent
        visibleSections={visibleSections}
        setVisibleSections={setVisibleSections}
      />
    </EncounterNotesProvider>
  );
};

export default EncounterNotes;

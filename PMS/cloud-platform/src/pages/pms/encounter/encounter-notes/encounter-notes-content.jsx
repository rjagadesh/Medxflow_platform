import React from "react";
import {
  Box,
  Flex,
  Text,
  VStack,
  HStack,
  Button,
  Checkbox,
} from "@chakra-ui/react";
import { ChevronDown, CalendarIcon } from "lucide-react";
import CustomSelect from "@/components/ui/select";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import { Link, useOutletContext, useParams } from "react-router-dom";
import CustomInput from "@/components/input/input";
import { Heading } from "@chakra-ui/react";
import FreeTextNote from "@/features/pms/encounter-notes/free-form-text";
import { noteTypes, noteTypeSections } from "./encounter-notes-data";
import VitalsNotes from "@/features/pms/encounter-notes/vitals-notes";
import AssessmentsNotes from "@/features/pms/encounter-notes/assessment-notes";
import { useGetAppointmentById } from "@/hooks/query/pms/pms_appointments/useGetAppointments";
import { useGetMinimalProviders } from "@/hooks/query/pms/pms_appointments/useGetProviders";
import AllergiesDialog from "../../patient-view/allergies-dialog";
import MedicationsDialog from "../../patient-view/medications-dialog";

const EncounterNotesContent = () => {
  const { appointment_id } = useParams();
  const { data: appointmentRes } = useGetAppointmentById(appointment_id);
  const { data: providersData = [] } = useGetMinimalProviders();
  const { appointment } = appointmentRes || {};
  console.log("appointment1212", appointment, appointmentRes);
  const {
    noteDate,
    setNoteDate,
    assignedTo,
    setAssignedTo,
    // activeSection, setActiveSection,
    selectedNoteType,
    setSelectedNoteType,
    visibleSections,
    setVisibleSections,
    setActiveSection, // Need this to update sidebar
    noteTime,
    setNoteTime,
    appointmentData,
  } = useOutletContext();

  const isAppointmentLinked = !!appointmentData;

  React.useEffect(() => {
    if (appointment) {
      if (appointment.date) {
        setNoteDate(new Date(appointment.date));
      }
      if (appointment.time) {
        const timeParts = appointment.time.split(":");
        if (timeParts.length >= 2) {
          setNoteTime(`${timeParts[0]}:${timeParts[1]}`);
        } else {
          setNoteTime(appointment.time);
        }
      }
      if (appointment.provider || appointment.provider_name) {
        setAssignedTo(
          String(appointment.provider || appointment.provider_name),
        );
      }
    }
  }, [appointment, setNoteDate, setNoteTime, setAssignedTo]);

  const fetchedProviders = React.useMemo(() => {
    return providersData.map((p) => ({
      label:
        p.provider_name ||
        `${p.first_name || ""} ${p.last_name || ""}`.trim() ||
        `Provider ${p.provider_id || p.id}`,
      value: String(p.provider_id || p.id),
    }));
  }, [providersData]);

  const providerOptions = React.useMemo(() => {
    const data = appointment || appointmentData;
    let options = [...fetchedProviders];

    if (data && (data.provider || data.provider_name)) {
      const val = String(data.provider || data.provider_name);
      const exists = options.some((p) => String(p.value) === val);
      if (!exists) {
        options = [
          ...options,
          {
            label: data.provider_name || "Unknown Provider",
            value: val,
          },
        ];
      }
    }
    return options;
  }, [fetchedProviders, appointment, appointmentData]);

  const handleNoteTypeChange = (val) => {
    const newValue = val[0];
    if (newValue) {
      setSelectedNoteType(newValue);
      setVisibleSections(noteTypeSections[newValue] || []);
      // Optionally set active section to the first one
      if (noteTypeSections[newValue]?.length > 0) {
        setActiveSection(noteTypeSections[newValue][0]);
      }
    }
  };

  const renderSectionContent = (section) => {
    switch (section) {
      case "Allergies":
        return (
          <FreeTextNote
            title={section}
            placeholder={`Enter ${section} notes...`}
            extraActions={<AllergiesDialog />}
          />
        );
      case "Medications":
        return (
          <FreeTextNote
            title={section}
            placeholder={`Enter ${section} notes...`}
            extraActions={<MedicationsDialog />}
          />
        );
      case "Vitals":
        return <VitalsNotes />;
      case "Assessment":
        return <AssessmentsNotes />;

      default:
        return (
          <FreeTextNote
            title={section}
            placeholder={`Enter ${section} notes...`}
          />
        );
    }
  };

  return (
    <>
      <Flex direction="column" w="full">
        <Box flex="1" p={4} overflowY="auto" bgColor="droidalBlack.300">
          {/* Note Header Controls */}
          <Flex gap={4} mb={0} align="flex-start" wrap="wrap">
            <CustomSelect
              options={noteTypes}
              value={[selectedNoteType]}
              onValueChange={handleNoteTypeChange}
              size="sm"
              width="170px"
              css={{
                borderRadius: "4px !important",
                borderColor: "#2f4d78",
              }}
              borderColor="#2f4d78"
            />

            <Button
              size="sm"
              variant="outline"
              color="white"
              borderColor="droidalGray.300"
              fontWeight="normal"
              onClick={() => {}}
              _hover={{ bg: "whiteAlpha.100" }}
            >
              SALT Notes
              <ChevronDown />
            </Button>

            <HStack gap={2}>
              <Box>
                <CustomDatePicker
                  value={noteDate}
                  onValueChange={setNoteDate}
                  inputProps={{
                    size: "sm",
                    width: "170px",
                    disabled: isAppointmentLinked,
                  }}
                  endElement={<CalendarIcon color="#2f4d78" />}
                />
              </Box>
              <Box w="100px">
                <CustomInput
                  type="time"
                  value={noteTime}
                  onChange={(e) => setNoteTime(e.target.value)}
                  size="sm"
                  disabled={isAppointmentLinked}
                />
              </Box>
            </HStack>
            <Flex gap={4} align="center">
              <Text
                letterSpacing={"wider"}
                fontWeight="light"
                fontSize="sm"
                color="droidalGray.400"
                w="80px"
              >
                Assigned To:
              </Text>
              <Box w="200px">
                <CustomSelect
                  options={providerOptions}
                  value={[assignedTo]}
                  onValueChange={(val) => setAssignedTo(val[0])}
                  size="sm"
                  css={{
                    borderRadius: "4px !important",
                    borderColor: "#2f4d78",
                  }}
                  borderColor="#2f4d78"
                />
              </Box>
            </Flex>
          </Flex>

          <Flex my={2} justify="center">
            <Heading
              fontSize="xl"
              m={0}
              letterSpacing={"wider"}
              fontWeight="light"
            >
              {selectedNoteType}
            </Heading>
          </Flex>

          {/* DYNAMIC SECTIONS */}
          <VStack align="stretch" gap={6}>
            {visibleSections.map((section) => renderSectionContent(section))}

            {/* <Box pt={4} pb={10}>
              <Text letterSpacing={"wider"} fontWeight="light" fontSize="lg">
                Diana Hudson, MD
              </Text>
            </Box> */}
          </VStack>
        </Box>

        {/* 4. Bottom Footer */}
      </Flex>
    </>
  );
};

export default EncounterNotesContent;

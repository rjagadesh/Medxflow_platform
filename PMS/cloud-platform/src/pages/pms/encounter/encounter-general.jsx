import React, {
  useState,
  useRef,
  useEffect,
  forwardRef,
  useImperativeHandle,
} from "react";
import {
  Box,
  Text,
  VStack,
  HStack,
  Grid,
  Checkbox,
  Flex,
  IconButton,
  Textarea,
  Accordion,
} from "@chakra-ui/react";
import { LuX, LuChevronRight, LuChevronLeft, LuSettings } from "react-icons/lu";
import { DndProvider, useDrag, useDrop } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import CustomButton from "@/components/button/button";
import CustomInput from "@/components/input/input";
import CustomSelect from "@/components/ui/select";
import ProcedureSection from "./encounter-procedure";
import CustomDatePicker from "@/components/date-picker/single-datepicker";
import { Calendar1Icon } from "lucide-react";
import { toaster } from "@/components/ui/toaster";
import { Wand2 } from "lucide-react";
import CustomAmountInput from "@/components/input/amountInput";
import { useGetAutoFillEncounter } from "@/hooks/query/pms/encounter/useGetEncounters";

const INPUT_MAX_WIDTH = "380px"; // ← adjust this value to match your design

const InputGroupWithX = ({
  placeholder,
  label,
  value,
  onClick,
  onClear,
  ...props
}) => {
  return (
    <Box
      w="full"
      maxW={INPUT_MAX_WIDTH}
      {...props}
      opacity={props.readOnly ? 0.7 : 1}
      pointerEvents={props.readOnly ? "none" : "auto"}
    >
      {label && (
        <Text
          fontSize="sm"
          mb={1}
          color="white"
          letterSpacing="wide"
          fontWeight="light"
        >
          {label}
        </Text>
      )}
      <HStack spacing={1} w="full" maxW="100%">
        <Box
          flex={1}
          bg="droidalBlack.300"
          border="1px solid #2f4d78"
          px={3}
          py={1}
          cursor={props.readOnly ? "default" : "pointer"}
          _hover={{ borderColor: props.readOnly ? "#2f4d78" : "#00BBF2" }}
          onClick={props.readOnly ? null : onClick}
          h="32px"
          display="flex"
          alignItems="center"
          minW={0}
          maxW="100%"
          overflow="hidden"
        >
          <Text
            fontSize="sm"
            color={value ? "white" : "#90a6c6"}
            overflow="hidden"
            textOverflow="ellipsis"
            whiteSpace="nowrap"
            w="100%"
            flexShrink={1}
          >
            {value || placeholder}
          </Text>
        </Box>
        {onClear && value && !props.readOnly && (
          <IconButton
            aria-label="Clear"
            size="xs"
            variant="ghost"
            color="white"
            _hover={{ bg: "red.500" }}
            onClick={onClear}
            h="32px"
            minW="32px"
            border="1px solid #2f4d78"
            flexShrink={0}
          >
            <LuX size={14} />
          </IconButton>
        )}
      </HStack>
    </Box>
  );
};

const SectionHeader = ({ children }) => (
  <Text
    fontSize="md"
    fontWeight="medium"
    mb={3}
    pb={2}
    borderBottom="1px solid #2f4d78"
    color="white"
  >
    {children}
  </Text>
);

const AMBULANCE_CERTIFICATIONS = [
  "01 - Patient was admitted to a hospital",
  "02 - Patient was bed confined before the ambulance service",
  "03 - Patient was bed confined after the ambulance service",
  "04 - Patient was moved by stretcher",
  "05 - Patient was unconscious or in shock",
  "06 - Patient was transported in an emergency situation",
  "07 - Patient had to be physically restrained",
  "08 - Patient had visible hemorrhaging",
  "09 - Ambulance service was medically necessary",
];

const DraggableItem = ({
  children,
  index,
  moveItem,
  dragType,
  orientation = "vertical",
}) => {
  const ref = useRef(null);
  const [{ isDragging }, drag] = useDrag({
    type: dragType,
    item: { index },
    collect: (monitor) => ({ isDragging: monitor.isDragging() }),
  });
  const [, drop] = useDrop({
    accept: dragType,
    hover: (item, monitor) => {
      if (!ref.current) return;
      const dragIndex = item.index;
      const hoverIndex = index;
      if (dragIndex === hoverIndex) return;

      const hoverBoundingRect = ref.current.getBoundingClientRect();
      const clientOffset = monitor.getClientOffset();

      if (orientation === "vertical") {
        const hoverMiddleY =
          (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;
        const hoverClientY = clientOffset.y - hoverBoundingRect.top;
        if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) return;
        if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) return;
      }
      if (orientation === "horizontal") {
        const hoverMiddleX =
          (hoverBoundingRect.right - hoverBoundingRect.left) / 2;
        const hoverClientX = clientOffset.x - hoverBoundingRect.left;
        if (dragIndex < hoverIndex && hoverClientX < hoverMiddleX) return;
        if (dragIndex > hoverIndex && hoverClientX > hoverMiddleX) return;
      }

      moveItem(dragIndex, hoverIndex);
      item.index = hoverIndex;
    },
  });
  drag(drop(ref));

  return (
    <Box
      ref={ref}
      opacity={isDragging ? 0.5 : 1}
      cursor={isDragging ? "grabbing" : "grab"}
      bg={isDragging ? "droidalBlack.400" : "transparent"}
      p={1}
      borderRadius="md"
      transition="all 0.2s"
      border={dragType ? "1px dashed rgba(255, 255, 255, 0.3)" : "none"}
      _hover={{
        border: dragType ? "1px dashed rgba(255, 255, 255, 0.8)" : "none",
      }}
    >
      {children}
    </Box>
  );
};

const CustomizableSection = ({
  title,
  sectionKey,
  layoutOrder,
  setLayoutOrder,
  children,
  gridCols = "2fr 1fr 1fr",
  orientation = "vertical",
  isCustomizing,
}) => {
  const currentOrder =
    layoutOrder[sectionKey] ||
    Array.from({ length: children.length }, (_, i) => i);

  const moveItem = (fromIndex, toIndex) => {
    setLayoutOrder((prev) => {
      const currentList =
        prev[sectionKey] ||
        Array.from({ length: children.length }, (_, i) => i);
      const newOrder = [...currentList];
      const [removed] = newOrder.splice(fromIndex, 1);
      newOrder.splice(toIndex, 0, removed);
      return { ...prev, [sectionKey]: newOrder };
    });
  };

  const templateColumns =
    typeof gridCols === "object" ? gridCols : { base: "1fr", xl: gridCols };

  return (
    <Box>
      {title && (
        <Flex justify="space-between" align="center" mb={4}>
          <SectionHeader>{title}</SectionHeader>
        </Flex>
      )}
      <Grid templateColumns={templateColumns} gap={6}>
        {isCustomizing
          ? currentOrder.map((originalIndex, loopIndex) => (
              <DraggableItem
                key={originalIndex}
                index={loopIndex}
                moveItem={moveItem}
                dragType={sectionKey}
                orientation={orientation}
              >
                {children[originalIndex]}
              </DraggableItem>
            ))
          : currentOrder.map((originalIndex) => (
              <Box key={originalIndex}>{children[originalIndex]}</Box>
            ))}
      </Grid>
    </Box>
  );
};

const PLACE_OF_SERVICE_OPTIONS = [
  { label: "11 - Office", value: "11" },
  { label: "12 - Home", value: "12" },
  { label: "21 - Inpatient Hospital", value: "21" },
  { label: "22 - On Campus-Outpatient Hospital", value: "22" },
  { label: "23 - Emergency Room - Hospital", value: "23" },
  { label: "24 - Ambulatory Surgical Center", value: "24" },
  { label: "31 - Skilled Nursing Facility", value: "31" },
  { label: "32 - Nursing Facility", value: "32" },
  { label: "49 - Independent Clinic", value: "49" },
  { label: "50 - Federally Qualified Health Center", value: "50" },
  { label: "02 - Telehealth Provided in Patient's Home", value: "02" },
  {
    label: "10 - Telehealth Provided Other than in Patient's Home",
    value: "10",
  },
];

const PLACE_OF_SERVICE_TO_ENCOUNTER_MODE = {
  11: "In Office",
  12: "In Home",
  21: "Inpatient Hospital",
  22: "Outpatient Hospital (On Campus)",
  23: "Emergency Room - Hospital",
  24: "Ambulatory Surgical Center",
  31: "Skilled Nursing Facility",
  32: "Nursing Facility",
  49: "Independent Clinic",
  50: "Federally Qualified Health Center",
  "02": "Telehealth - Patient Home",
  10: "Telehealth - Other Location",
};

const EncounterGeneral = forwardRef(
  (
    {
      selectedPatient,
      selectedAppointment,
      setSelectedAppointment,
      handleFindPatient,
      handleFindAppointment,
      setSelectedPatient,
      selectedPriorAuth,
      setSelectedPriorAuth,
      handleFindPriorAuth,
      setSelectedProvider,
      selectedProvider,
      handleFindProvider,
      setIsAutofilling,
      isEditMode,
      isLoadingEncounter,
      serviceLines,
      providers,
      ambulanceDetail,
      placeOfService,
      encounterFromDate,
      encounterThroughDate,
      postDate,
      batchNumber,
      doNotSendElectronically,
      paymentAmount,
      hospitalizedFrom,
      hospitalizedTo,
      submitReason,
      payerDocControl,
      claimCode10d,
      additionalClaimInfo,
      eclaimNoteType,
      eclaimNote,
      status,
      isAppt,
    },
    ref
  ) => {

    // Local state
    const [localPlaceOfService, setLocalPlaceOfService] = useState(
      placeOfService || "11"
    );
    const [localEncounterFromDate, setLocalEncounterFromDate] = useState(
      encounterFromDate || null
    );
    const [localEncounterThroughDate, setLocalEncounterThroughDate] = useState(
      encounterThroughDate || null
    );
    const [localPostDate, setLocalPostDate] = useState(postDate || null);
    const [localBatchNumber, setLocalBatchNumber] = useState(batchNumber || "");
    const [localDoNotSendElectronically, setLocalDoNotSendElectronically] =
      useState(doNotSendElectronically || false);
    const [localPaymentAmount, setLocalPaymentAmount] = useState(
      paymentAmount || ""
    );
    const [localAmbulanceDetail, setLocalAmbulanceDetail] = useState(
      ambulanceDetail || {
        emergency: false,
        patient_weight_lbs: 0,
        transport_miles: "",
        pickup_address: "",
        dropoff_address: "",
        transport_code: "",
        reason_code: "",
        start_time: "00:00",
        end_time: "00:00",
        certification_reasons: "",
        round_trip_description: "",
        stretcher_purpose: "",
        encounter: 1,
      }
    );
    const [localHospitalizedFrom, setLocalHospitalizedFrom] = useState(
      hospitalizedFrom || ""
    );
    const [localHospitalizedTo, setLocalHospitalizedTo] = useState(
      hospitalizedTo || null
    );
    const [localSubmitReason, setLocalSubmitReason] = useState(
      submitReason || ""
    );
    const [localPayerDocControl, setLocalPayerDocControl] = useState(
      payerDocControl || ""
    );
    const [localClaimCode10d, setLocalClaimCode10d] = useState(
      claimCode10d || ""
    );
    const [localAdditionalClaimInfo, setLocalAdditionalClaimInfo] = useState(
      additionalClaimInfo || ""
    );
    const [localEclaimNoteType, setLocalEclaimNoteType] = useState(
      eclaimNoteType || ""
    );
    const [localEclaimNote, setLocalEclaimNote] = useState(eclaimNote || "");

    const [localServiceLines, setLocalServiceLines] = useState(serviceLines || []);

    const procedureRef = useRef();

    // Sync props to local state
    useEffect(() => {
      if (serviceLines && serviceLines.length > 0) {
        setLocalServiceLines(serviceLines);
      }
    }, [serviceLines]);

    console.log("Rendering EncounterGeneral", serviceLines, localServiceLines);
    useEffect(() => {
      setLocalPlaceOfService(placeOfService || "11");
    }, [placeOfService]);
    useEffect(() => {
      setLocalEncounterFromDate(encounterFromDate || null);
    }, [encounterFromDate]);
    useEffect(() => {
      setLocalEncounterThroughDate(encounterThroughDate || null);
    }, [encounterThroughDate]);
    useEffect(() => {
      setLocalPostDate(postDate || null);
    }, [postDate]);
    useEffect(() => {
      setLocalBatchNumber(batchNumber || "");
    }, [batchNumber]);
    useEffect(() => {
      setLocalDoNotSendElectronically(doNotSendElectronically || false);
    }, [doNotSendElectronically]);
    useEffect(() => {
      setLocalPaymentAmount(paymentAmount || "");
    }, [paymentAmount]);
    useEffect(() => {
      if (ambulanceDetail) setLocalAmbulanceDetail(ambulanceDetail);
    }, [ambulanceDetail]);
    useEffect(() => {
      setLocalHospitalizedFrom(hospitalizedFrom || "");
    }, [hospitalizedFrom]);
    useEffect(() => {
      setLocalHospitalizedTo(hospitalizedTo || null);
    }, [hospitalizedTo]);
    useEffect(() => {
      setLocalSubmitReason(submitReason || "");
    }, [submitReason]);
    useEffect(() => {
      setLocalPayerDocControl(payerDocControl || "");
    }, [payerDocControl]);
    useEffect(() => {
      setLocalClaimCode10d(claimCode10d || "");
    }, [claimCode10d]);
    useEffect(() => {
      setLocalAdditionalClaimInfo(additionalClaimInfo || "");
    }, [additionalClaimInfo]);
    useEffect(() => {
      setLocalEclaimNoteType(eclaimNoteType || "");
    }, [eclaimNoteType]);
    useEffect(() => {
      setLocalEclaimNote(eclaimNote || "");
    }, [eclaimNote]);

    const [isCustomizing, setIsCustomizing] = useState(false);
    const [availableCerts, setAvailableCerts] = useState(
      AMBULANCE_CERTIFICATIONS
    );
    const [selectedCerts, setSelectedCerts] = useState([]);
    const [selectedAvailable, setSelectedAvailable] = useState([]);
    const [selectedSelected, setSelectedSelected] = useState([]);
    const [encounterMode, setEncounterMode] = useState("");
    const [layoutOrder, setLayoutOrder] = useState({
      topRow: [0, 1, 2, 3],
      providerRow: [0, 1, 2],
      patientInputs: [0, 1, 2, 3, 4],
      providerCol1: [0, 1, 2],
      providerCol2: [0, 1, 2, 3, 4],
      providerCol3: [0],
    });
    const [location, setLocation] = useState("");

    const { refetch: fetchAutoFill } = useGetAutoFillEncounter(
      selectedAppointment?.id,
      { enabled: false }
    );

    const handleAutoFill = async () => {
      setIsAutofilling(true);
      try {
        const result = await fetchAutoFill();
        console.log("Auto Fill Response:", result.data);
        if (result.data?.Cpt_codes) {
          procedureRef.current?.populateFromAutoFill(result.data.Cpt_codes);
        }
      } catch (error) {
        console.error("Auto Fill Error:", error);
        toaster.error({ title: "Error", description: "Failed to fetch autofill data" });
      } finally {
        setIsAutofilling(false);
      }
    };

    useImperativeHandle(ref, () => ({
      getData: () => ({
        placeOfService: localPlaceOfService,
        encounterFromDate: localEncounterFromDate,
        encounterThroughDate: localEncounterThroughDate,
        postDate: localPostDate,
        batchNumber: localBatchNumber,
        doNotSendElectronically: localDoNotSendElectronically,
        paymentAmount: localPaymentAmount,
        ambulanceDetail: localAmbulanceDetail,
        hospitalizedFrom: localHospitalizedFrom,
        hospitalizedTo: localHospitalizedTo,
        submitReason: localSubmitReason,
        payerDocControl: localPayerDocControl,
        claimCode10d: localClaimCode10d,
        additionalClaimInfo: localAdditionalClaimInfo,
        eclaimNoteType: localEclaimNoteType,
        eclaimNote: localEclaimNote,
        serviceLines: procedureRef.current?.getRows() || localServiceLines,
        totalCharges:
          procedureRef.current?.getTotals()?.grandTotalCharge || "0.00",
      }),
      syncServiceLines: () => {
        if (procedureRef.current) {
          setLocalServiceLines(procedureRef.current.getRows());
        }
      },
    }));

    const moveRight = () => {
      const newSelected = [...selectedCerts, ...selectedAvailable].sort(
        (a, b) =>
          AMBULANCE_CERTIFICATIONS.indexOf(a) -
          AMBULANCE_CERTIFICATIONS.indexOf(b)
      );
      const newAvailable = availableCerts.filter(
        (item) => !selectedAvailable.includes(item)
      );
      setSelectedCerts(newSelected);
      setAvailableCerts(newAvailable);
      setSelectedAvailable([]);
      setLocalAmbulanceDetail((prev) => ({
        ...prev,
        certification_reasons: newSelected.join(", "),
      }));
    };

    const moveLeft = () => {
      const newAvailable = [...availableCerts, ...selectedSelected].sort(
        (a, b) =>
          AMBULANCE_CERTIFICATIONS.indexOf(a) -
          AMBULANCE_CERTIFICATIONS.indexOf(b)
      );
      const newSelected = selectedCerts.filter(
        (item) => !selectedSelected.includes(item)
      );
      setAvailableCerts(newAvailable);
      setSelectedCerts(newSelected);
      setSelectedSelected([]);
      setLocalAmbulanceDetail((prev) => ({
        ...prev,
        certification_reasons: newSelected.join(", "),
      }));
    };

    useEffect(() => {
      if (selectedAppointment) {
        if (selectedAppointment.location) {
          setLocation(selectedAppointment.location);
        }
        if (selectedAppointment.date) {
          setLocalEncounterFromDate(new Date(selectedAppointment.date));
        }
      } else {
        setLocation("");
        setLocalEncounterFromDate(null);
      }
    }, [selectedAppointment]);

    useEffect(() => {
      if (
        localAmbulanceDetail?.certification_reasons &&
        selectedCerts.length === 0
      ) {
        const certs = localAmbulanceDetail.certification_reasons
          .split(", ")
          .map((s) => s.trim())
          .filter(Boolean);
        if (certs.length > 0) {
          setSelectedCerts(certs);
          setAvailableCerts((prev) => prev.filter((c) => !certs.includes(c)));
        }
      }
    }, [localAmbulanceDetail?.certification_reasons]);

    useEffect(() => {
      if (
        localPlaceOfService &&
        PLACE_OF_SERVICE_TO_ENCOUNTER_MODE[localPlaceOfService]
      ) {
        setEncounterMode(
          PLACE_OF_SERVICE_TO_ENCOUNTER_MODE[localPlaceOfService]
        );
      } else {
        setEncounterMode("");
      }
    }, [localPlaceOfService]);

    const appointmentDisplayValue = selectedAppointment
      ? `${
          selectedAppointment.date
        } - ${selectedAppointment.time?.slice(0, 5)} - ${
          selectedAppointment.patient_name
        }`
      : "";

    const patientInputFields = [
      <InputGroupWithX
        key="appt"
        placeholder="Appointment..."
        value={appointmentDisplayValue}
        onClick={handleFindAppointment}
        onClear={() => setSelectedAppointment(null)}
        readOnly={isAppt}
      />,
      <InputGroupWithX
        key="patient"
        placeholder="Patient..."
        value={
          selectedPatient
            ? `${selectedPatient.first_name || ""} ${
                selectedPatient.last_name || ""
              }`.trim()
            : ""
        }
        onClick={handleFindPatient}
        onClear={() => setSelectedPatient(null)}
        readOnly={isAppt}
      />,
      <InputGroupWithX
        key="case"
        placeholder="Case..."
        onClick={() => console.log("Find Case")}
      />,
      <InputGroupWithX
        key="prior"
        placeholder="Prior Authorization..."
        value={selectedPriorAuth ? selectedPriorAuth.auth_number : ""}
        onClick={handleFindPriorAuth}
        onClear={() => setSelectedPriorAuth(null)}
      />,
      <Box w="full" minW={0}>
        <Text fontSize="sm" mb={1} color="white">
          Primary Insurance:{" "}
          <Text as="span" fontWeight="semibold">
            {selectedAppointment?.insurance_name?.displayName || ""}
          </Text>
        </Text>
      </Box>


      // <InputGroupWithX
      //   key="insurance"
      //   label="Primary Insurance:"
      //   placeholder="Primary Insurance..."
      //   value={selectedAppointment?.insurance_name?.displayName || ""}
      //   onClick={() => {}}
      // />,
    ];

    const providerField = (label, key, providerData, readOnly = false) => (
      <HStack
        align="center"
        w="full"
        maxW={INPUT_MAX_WIDTH}
        opacity={readOnly ? 0.7 : 1}
        pointerEvents={readOnly ? "none" : "auto"}
      >
        <Text
          fontSize="sm"
          fontWeight="light"
          letterSpacing="wide"
          w="140px"
          flexShrink={0}
          minW="140px"
        >
          {label}:
        </Text>
        <Box flex={1} minW={0} maxW="100%">
          <Box
            bg="droidalBlack.300"
            border="1px solid #2f4d78"
            px={3}
            py={1}
            cursor={readOnly ? "default" : "pointer"}
            _hover={{ borderColor: readOnly ? "#2f4d78" : "#00BBF2" }}
            onClick={readOnly ? null : () => handleFindProvider(key)}
            h="32px"
            display="flex"
            alignItems="center"
            minW={0}
            maxW="100%"
            overflow="hidden"
          >
            <Text
              fontSize="sm"
              color={providerData ? "white" : "#90a6c6"}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              w="100%"
              flexShrink={1}
            >
              {providerData?.name || "Select..."}
            </Text>
          </Box>
        </Box>
      </HStack>
    );

    const col1Fields = [
      providerField("Scheduling", "scheduling", providers.scheduling, isAppt),
      providerField("Rendering", "rendering", providers.rendering, isAppt),
      providerField("Supervising", "supervising", providers.supervising),
    ];

    const col2Fields = [
      providerField("Referring", "referring", providers.referring),
      <HStack
        key="location"
        align="center"
        w="full"
        maxW={INPUT_MAX_WIDTH}
        opacity={isAppt ? 0.7 : 1}
        pointerEvents={isAppt ? "none" : "auto"}
      >
        <Text
          fontSize="sm"
          fontWeight="light"
          letterSpacing="wide"
          w="140px"
          flexShrink={0}
          minW="140px"
        >
          Location:
        </Text>
        <Box flex={1} minW={0} maxW="100%">
          <Box
            bg="droidalBlack.300"
            border="1px solid #2f4d78"
            px={3}
            py={1}
            h="32px"
            display="flex"
            alignItems="center"
            minW={0}
            maxW="100%"
            overflow="hidden"
          >
            <Text
              fontSize="sm"
              color={location ? "white" : "#90a6c6"}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              w="100%"
              flexShrink={1}
            >
              {location || "None"}
            </Text>
          </Box>
        </Box>
      </HStack>,
      <HStack align="center" w="full" maxW={INPUT_MAX_WIDTH} key="pos">
        <Text
          fontSize="sm"
          fontWeight="light"
          letterSpacing="wide"
          w="140px"
          flexShrink={0}
          minW="140px"
        >
          Place Of Service:
        </Text>
        <Box flex={1} minW={0}>
          <CustomSelect
            options={PLACE_OF_SERVICE_OPTIONS}
            value={[localPlaceOfService]}
            onValueChange={(val) => setLocalPlaceOfService(val[0] || "")}
            w="full"
            h="32px"
          />
        </Box>
      </HStack>,
      <HStack align="center" w="full" maxW={INPUT_MAX_WIDTH} key="mode">
        <Text
          fontSize="sm"
          fontWeight="light"
          letterSpacing="wide"
          w="140px"
          flexShrink={0}
          minW="140px"
        >
          Encounter Mode:
        </Text>
        <Box flex={1} minW={0} maxW="100%">
          <Box
            bg="droidalBlack.300"
            border="1px solid #2f4d78"
            px={3}
            py={1}
            h="32px"
            display="flex"
            alignItems="center"
            minW={0}
            maxW="100%"
            overflow="hidden"
          >
            <Text
              fontSize="sm"
              color={encounterMode ? "white" : "#90a6c6"}
              overflow="hidden"
              textOverflow="ellipsis"
              whiteSpace="nowrap"
              w="100%"
              flexShrink={1}
            >
              {encounterMode || "Select Place of Service"}
            </Text>
          </Box>
        </Box>
      </HStack>,

      <HStack align="center" w="full" maxW={INPUT_MAX_WIDTH} key="elec">
        <Checkbox.Root
          checked={localDoNotSendElectronically}
          onCheckedChange={(e) => setLocalDoNotSendElectronically(!!e.checked)}
        >
          <Checkbox.HiddenInput />
          <Checkbox.Control border="1px solid #2f4d78" />
          <Checkbox.Label color="yellow" fontSize="sm">
            {localDoNotSendElectronically
              ? "Claims will not send electronically"
              : "Claims will send Electronically"}
          </Checkbox.Label>
        </Checkbox.Root>
      </HStack>,
    ];

    const col3Fields = [];

    console.log(localAmbulanceDetail);
    console.log("Host", localHospitalizedFrom);
    return (
      <DndProvider backend={HTML5Backend}>
        <VStack spacing={6} align="stretch">
          <Flex justify="flex-end">
            <CustomButton
              size="sm"
              leftIcon={<LuSettings size={16} />}
              onClick={() => setIsCustomizing(!isCustomizing)}
              mr={3}
            >
              {isCustomizing ? "Done" : "Customize Layout"}
            </CustomButton>
            <CustomButton
              size="sm"
              leftIcon={<Wand2 size={16} />}
              onClick={() => {
                console.log("Current Status in EncounterGeneral:", status);
                handleAutoFill();
              }}
              disabled={status && status !== "not_started" && status !== "draft"}
            >
              Auto Fill
            </CustomButton>
          </Flex>

          <CustomizableSection
            sectionKey="topRow"
            layoutOrder={layoutOrder}
            setLayoutOrder={setLayoutOrder}
            orientation="horizontal"
            isCustomizing={isCustomizing}
            gridCols={{
              base: "1fr",
              lg: "1fr 1fr",
              "2xl": "0.8fr 1.4fr 0.9fr 1.7fr",
            }}
          >
            {[
              <Box key="patient">
                <SectionHeader>Patient</SectionHeader>
                <Grid templateColumns="1fr" gap={4}>
                  <VStack gap={3} align="stretch">
                    {layoutOrder.patientInputs.map((idx, loopIndex) =>
                      isCustomizing ? (
                        <DraggableItem
                          key={idx}
                          index={loopIndex}
                          moveItem={(from, to) => {
                            setLayoutOrder((prev) => {
                              const newOrder = [...prev.patientInputs];
                              const [removed] = newOrder.splice(from, 1);
                              newOrder.splice(to, 0, removed);
                              return { ...prev, patientInputs: newOrder };
                            });
                          }}
                          dragType="patientInputs"
                        >
                          {patientInputFields[idx]}
                        </DraggableItem>
                      ) : (
                        <Box key={idx} p={1} minW={0}>
                          {patientInputFields[idx]}
                        </Box>
                      )
                    )}
                  </VStack>
                </Grid>
              </Box>,

              <Box key="dates">
                <SectionHeader>Dates</SectionHeader>
                <VStack gap={3} align="stretch">
                  <HStack minW={0}>
                    <Text
                      fontSize="sm"
                      letterSpacing="wide"
                      fontWeight="light"
                      w="120px"
                      flexShrink={0}
                    >
                      From Date:
                    </Text>
                    <Box w="full" minW={0}>
                      <CustomDatePicker
                        value={localEncounterFromDate}
                        onValueChange={setLocalEncounterFromDate}
                        endElement={false}
                        readOnly={isAppt}
                        disabled={isAppt}
                      />
                    </Box>
                  </HStack>
                  <HStack minW={0}>
                    <Text
                      fontSize="sm"
                      letterSpacing="wide"
                      fontWeight="light"
                      w="120px"
                      flexShrink={0}
                    >
                      Through Date:
                    </Text>
                    <Box w="full" minW={0}>
                      <CustomDatePicker
                        value={localEncounterThroughDate}
                        minDate={
                          localEncounterFromDate
                            ? new Date(localEncounterFromDate)
                            : null
                        }
                        onValueChange={(date) => {
                          if (
                            localEncounterFromDate &&
                            new Date(date) < new Date(localEncounterFromDate)
                          ) {
                            toaster.create({
                              title: "Invalid Date",
                              description:
                                "Through Date cannot be before From Date",
                              type: "error",
                            });
                            return;
                          }
                          setLocalEncounterThroughDate(date);
                        }}
                        endElement={false}
                      />
                    </Box>
                  </HStack>
                  <HStack minW={0}>
                    <Text
                      fontSize="sm"
                      letterSpacing="wide"
                      fontWeight="light"
                      w="120px"
                      flexShrink={0}
                    >
                      Post Date:
                    </Text>
                    <Box w="full" minW={0}>
                      <CustomDatePicker
                        value={localPostDate}
                        minDate={
                          localEncounterFromDate
                            ? new Date(localEncounterFromDate)
                            : null
                        }
                        onValueChange={(date) => {
                          if (
                            localEncounterFromDate &&
                            new Date(date) < new Date(localEncounterFromDate)
                          ) {
                            toaster.create({
                              title: "Invalid Date",
                              description:
                                "Post Date cannot be before From Date",
                              type: "error",
                            });
                            return;
                          }
                          setLocalPostDate(date);
                        }}
                        endElement={false}
                      />
                    </Box>
                  </HStack>
                  <HStack minW={0}>
                    <Text
                      fontSize="sm"
                      letterSpacing="wide"
                      fontWeight="light"
                      w="120px"
                      flexShrink={0}
                    >
                      Batch #:
                    </Text>
                    <CustomInput
                      h="32px"
                      w="full"
                      value={localBatchNumber}
                      onChange={(e) => setLocalBatchNumber(e.target.value)}
                      placeholder="Enter batch number..."
                    />
                  </HStack>
                </VStack>
              </Box>,

              <Box key="payment">
                <SectionHeader>Payment</SectionHeader>
                <VStack gap={3} align="stretch">
                  <HStack minW={0}>
                    <Text
                      fontSize="sm"
                      fontWeight="light"
                      letterSpacing="wide"
                      w="180px"
                      flexShrink={0}
                    >
                      Copay Due:
                    </Text>
                    <Text fontSize="xs" color="white">
                      ${selectedAppointment?.copay_amt || "0.00"}
                    </Text>
                  </HStack>
                  <HStack minW={0}>
                    <Text
                      fontSize="sm"
                      fontWeight="light"
                      letterSpacing="wide"
                      w="120px"
                      flexShrink={0}
                    >
                      Payment Amount:
                    </Text>
                    <Box flex={1} minW={0}>
                      <CustomAmountInput
                        value={localPaymentAmount}
                        onChange={(e) => setLocalPaymentAmount(e.target.value)}
                        placeholder="$0.00"
                        h="32px"
                        w="full"
                        // Optional: Add specific styling if needed
                        bg="droidalBlack.300"
                        _hover={{
                          borderColor: "#00BBF2",
                        }}
                        leftAddon={null}
                      />
                    </Box>
                  </HStack>
                </VStack>
              </Box>,

              <Box key="providerGroup">
                <Grid
                  templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                  gap={4}
                >
                  <CustomizableSection
                    title="Provider"
                    sectionKey="providerCol1"
                    layoutOrder={layoutOrder}
                    setLayoutOrder={setLayoutOrder}
                    isCustomizing={isCustomizing}
                    gridCols="1fr"
                  >
                    {col1Fields}
                  </CustomizableSection>
                  <CustomizableSection
                    title="&nbsp;"
                    sectionKey="providerCol2"
                    layoutOrder={layoutOrder}
                    setLayoutOrder={setLayoutOrder}
                    isCustomizing={isCustomizing}
                    gridCols="1fr"
                  >
                    {col2Fields}
                  </CustomizableSection>
                  <CustomizableSection
                    title="&nbsp;"
                    sectionKey="providerCol3"
                    layoutOrder={layoutOrder}
                    setLayoutOrder={setLayoutOrder}
                    isCustomizing={isCustomizing}
                    gridCols="1fr"
                  >
                    {col3Fields}
                  </CustomizableSection>
                </Grid>
              </Box>,
            ]}
          </CustomizableSection>

          <Box mt="-16">
            <SectionHeader>Procedure</SectionHeader>
            <ProcedureSection
              initialRows={localServiceLines}
              ref={procedureRef}
            />
          </Box>

          <Accordion.Root
            multiple
            defaultValue={["hospital", "misc", "ambulance"]}
            collapsible
          >
            <Accordion.Item value="hospital">
              <Accordion.ItemTrigger
                bg="droidalBlack.400"
                _hover={{ bg: "droidalBlack.300" }}
                py={3}
                px={4}
                border="1px solid #2f4d78"
                borderBottom="none"
                borderRadius="md md none none"
              >
                <Text
                  flex="1"
                  textAlign="left"
                  fontSize="md"
                  fontWeight="medium"
                  color="white"
                >
                  Hospitalization Dates
                </Text>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody
                  p={6}
                  bg="droidalBlack.300"
                  border="1px solid #2f4d78"
                  borderTop="none"
                  borderRadius="none none md md"
                >
                  <Grid
                    templateColumns={{ base: "1fr", md: "1fr 1fr" }}
                    gap={8}
                  >
                    <HStack align="center" spacing={4}>
                      <Text
                        fontSize="sm"
                        minW="160px"
                        color="white"
                        fontWeight="light"
                        letterSpacing="wide"
                      >
                        Start Date:
                      </Text>
                      <Box flex={1}>
                        <CustomDatePicker
                          value={localHospitalizedFrom}
                          onValueChange={setLocalHospitalizedFrom}
                          inputProps={{ h: "40px" }}
                          endElement={
                            <Calendar1Icon
                              className="text-gray-400"
                              size={18}
                            />
                          }
                        />
                      </Box>
                    </HStack>
                    <HStack align="center" spacing={4}>
                      <Text
                        fontSize="sm"
                        minW="160px"
                        color="white"
                        fontWeight="light"
                        letterSpacing="wide"
                      >
                        End Date:
                      </Text>
                      <Box flex={1}>
                        <CustomDatePicker
                          value={localHospitalizedTo}
                          onValueChange={setLocalHospitalizedTo}
                          inputProps={{ h: "40px" }}
                          endElement={
                            <Calendar1Icon
                              className="text-gray-400"
                              size={18}
                            />
                          }
                        />
                      </Box>
                    </HStack>
                  </Grid>
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>

            <Accordion.Item value="misc">
              <Accordion.ItemTrigger
                bg="droidalBlack.400"
                _hover={{ bg: "droidalBlack.300" }}
                py={3}
                px={4}
                border="1px solid #2f4d78"
                borderBottom="none"
              >
                <Text
                  flex="1"
                  textAlign="left"
                  fontSize="md"
                  fontWeight="medium"
                  color="white"
                >
                  Miscellaneous (CMS-1500)
                </Text>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody
                  p={6}
                  bg="droidalBlack.300"
                  border="1px solid #2f4d78"
                  borderTop="none"
                >
                  <Grid
                    templateColumns={{ base: "1fr", lg: "1fr 1fr" }}
                    gap={8}
                  >
                    <VStack spacing={5} align="stretch">
                      <HStack align="center" spacing={4}>
                        <Text
                          fontSize="sm"
                          minW="160px"
                          color="white"
                          fontWeight="light"
                          letterSpacing="wide"
                        >
                          Submit Reason:
                        </Text>
                        <CustomSelect
                          options={[
                            { label: "1 - Original", value: "1" },
                            { label: "7 - Replacement", value: "7" },
                            { label: "8 - Void", value: "8" },
                          ]}
                          value={localSubmitReason ? [localSubmitReason] : []}
                          onValueChange={(val) =>
                            setLocalSubmitReason(val[0] || "")
                          }
                          height="40px"
                          w="full"
                        />
                      </HStack>
                      <HStack align="center" spacing={4}>
                        <Text
                          fontSize="sm"
                          minW="160px"
                          color="white"
                          fontWeight="light"
                          letterSpacing="wide"
                        >
                          Payer Doc Ctrl #:
                        </Text>
                        <CustomInput
                          h="40px"
                          value={localPayerDocControl}
                          onChange={(e) =>
                            setLocalPayerDocControl(e.target.value)
                          }
                          placeholder="Enter payer control number..."
                        />
                      </HStack>
                      <HStack align="center" spacing={4}>
                        <Text
                          fontSize="sm"
                          minW="160px"
                          color="white"
                          fontWeight="light"
                          letterSpacing="wide"
                        >
                          Claim Code (Box 10d):
                        </Text>
                        <CustomInput
                          h="40px"
                          value={localClaimCode10d}
                          onChange={(e) => setLocalClaimCode10d(e.target.value)}
                          placeholder="e.g. 12345"
                        />
                      </HStack>
                      <HStack align="center" spacing={4}>
                        <Text
                          fontSize="sm"
                          minW="160px"
                          color="white"
                          fontWeight="light"
                          letterSpacing="wide"
                        >
                          Add'l Claim Info (Box 19):
                        </Text>
                        <CustomInput
                          h="40px"
                          value={localAdditionalClaimInfo}
                          onChange={(e) =>
                            setLocalAdditionalClaimInfo(e.target.value)
                          }
                          placeholder="Additional information..."
                        />
                      </HStack>
                    </VStack>
                    <VStack spacing={5} align="stretch">
                      <HStack align="center" spacing={4}>
                        <Text
                          fontSize="sm"
                          minW="160px"
                          color="white"
                          fontWeight="light"
                          letterSpacing="wide"
                        >
                          E-Claim Note Type:
                        </Text>
                        <CustomSelect
                          options={[
                            { label: "None", value: "" },
                            {
                              label: "ADD - Additional Information",
                              value: "ADD",
                            },
                          ]}
                          value={
                            localEclaimNoteType ? [localEclaimNoteType] : []
                          }
                          onValueChange={(val) =>
                            setLocalEclaimNoteType(val[0] || "")
                          }
                          height="40px"
                          w="full"
                        />
                      </HStack>
                      <VStack align="stretch" spacing={2}>
                        <Text
                          fontSize="sm"
                          color="white"
                          fontWeight="light"
                          letterSpacing="wide"
                        >
                          E-Claim Note:
                        </Text>
                        <Textarea
                          bg="droidalBlack.300"
                          border="1px solid #2f4d78"
                          _hover={{ borderColor: "#00BBF2" }}
                          _focus={{
                            borderColor: "#00BBF2",
                            boxShadow: "0 0 0 2px #00BBF2",
                          }}
                          resize="vertical"
                          minH="100px"
                          fontSize="sm"
                          value={localEclaimNote}
                          onChange={(e) => setLocalEclaimNote(e.target.value)}
                          placeholder="Enter additional notes for electronic claim..."
                        />
                      </VStack>
                    </VStack>
                  </Grid>
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>

            <Accordion.Item value="ambulance">
              <Accordion.ItemTrigger
                bg="droidalBlack.400"
                _hover={{ bg: "droidalBlack.300" }}
                py={3}
                px={4}
                border="1px solid #2f4d78"
                borderRadius="none none md md"
              >
                <Text
                  flex="1"
                  textAlign="left"
                  fontSize="md"
                  fontWeight="medium"
                  color="white"
                >
                  Ambulance
                </Text>
                <Accordion.ItemIndicator />
              </Accordion.ItemTrigger>
              <Accordion.ItemContent>
                <Accordion.ItemBody
                  p={6}
                  bg="droidalBlack.300"
                  border="1px solid #2f4d78"
                  borderTop="none"
                  borderRadius="none none md md"
                >
                  <Grid
                    templateColumns={{ base: "1fr", xl: "1fr 1fr" }}
                    gap={10}
                  >
                    <VStack spacing={5} align="stretch">
                      <HStack align="center" spacing={4}>
                        <Text
                          fontSize="sm"
                          minW="160px"
                          color="white"
                          fontWeight="light"
                        >
                          Emergency?
                        </Text>
                        <Checkbox.Root
                          checked={localAmbulanceDetail?.emergency}
                          onCheckedChange={(e) =>
                            setLocalAmbulanceDetail((prev) => ({
                              ...prev,
                              emergency: !!e.checked,
                            }))
                          }
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control
                            size="lg"
                            border="1px solid #2f4d78"
                          />
                        </Checkbox.Root>
                      </HStack>
                      <HStack align="center" spacing={4}>
                        <Text
                          fontSize="sm"
                          minW="160px"
                          color="white"
                          fontWeight="light"
                        >
                          Patient Weight (lbs):
                        </Text>
                        <CustomInput
                          h="40px"
                          value={localAmbulanceDetail?.patient_weight_lbs || ""}
                          onChange={(e) =>
                            setLocalAmbulanceDetail((prev) => ({
                              ...prev,
                              patient_weight_lbs: e.target.value,
                            }))
                          }
                          placeholder="e.g. 180"
                        />
                      </HStack>
                      <HStack align="center" spacing={4}>
                        <Text
                          fontSize="sm"
                          minW="160px"
                          color="white"
                          fontWeight="light"
                        >
                          Transport Distance (miles):
                        </Text>
                        <CustomInput
                          h="40px"
                          value={localAmbulanceDetail?.transport_miles || ""}
                          onChange={(e) =>
                            setLocalAmbulanceDetail((prev) => ({
                              ...prev,
                              transport_miles: e.target.value,
                            }))
                          }
                          placeholder="e.g. 25"
                        />
                      </HStack>
                      <HStack align="center" spacing={4}>
                        <Text
                          fontSize="sm"
                          minW="160px"
                          color="white"
                          fontWeight="light"
                        >
                          Pick Up Address:
                        </Text>
                        <CustomInput
                          h="40px"
                          value={localAmbulanceDetail?.pickup_address || ""}
                          onChange={(e) =>
                            setLocalAmbulanceDetail((prev) => ({
                              ...prev,
                              pickup_address: e.target.value,
                            }))
                          }
                          placeholder="Enter pick up address..."
                        />
                      </HStack>
                      <HStack align="center" spacing={4}>
                        <Text
                          fontSize="sm"
                          minW="160px"
                          color="white"
                          fontWeight="light"
                        >
                          Drop Off Address:
                        </Text>
                        <CustomInput
                          h="40px"
                          value={localAmbulanceDetail?.dropoff_address || ""}
                          onChange={(e) =>
                            setLocalAmbulanceDetail((prev) => ({
                              ...prev,
                              dropoff_address: e.target.value,
                            }))
                          }
                          placeholder="Enter drop off address..."
                        />
                      </HStack>
                      <HStack align="center" spacing={4}>
                        <Text
                          fontSize="sm"
                          minW="160px"
                          color="white"
                          fontWeight="light"
                        >
                          Time of Service:
                        </Text>
                        <CustomInput
                          type="time"
                          h="40px"
                          value={localAmbulanceDetail?.start_time || ""}
                          onChange={(e) =>
                            setLocalAmbulanceDetail((prev) => ({
                              ...prev,
                              start_time: e.target.value,
                            }))
                          }
                        />
                        <Text color="white" fontSize="sm">
                          to
                        </Text>
                        <CustomInput
                          type="time"
                          h="40px"
                          value={localAmbulanceDetail?.end_time || ""}
                          onChange={(e) =>
                            setLocalAmbulanceDetail((prev) => ({
                              ...prev,
                              end_time: e.target.value,
                            }))
                          }
                        />
                      </HStack>

                      <VStack align="stretch" spacing={3}>
                        <Text
                          fontSize="sm"
                          color="white"
                          fontWeight="light"
                          letterSpacing="wide"
                        >
                          Ambulance Certification Reasons
                        </Text>
                        <Grid templateColumns="1fr auto 1fr" gap={4} h="200px">
                          <VStack
                            spacing={0}
                            border="1px solid #2f4d78"
                            bg="droidalBlack.400"
                            borderRadius="md"
                            overflow="hidden"
                          >
                            <Box
                              px={3}
                              py={2}
                              bg="droidalBlack.500"
                              borderBottom="1px solid #2f4d78"
                            >
                              <Text
                                fontSize="sm"
                                color="white"
                                fontWeight="medium"
                              >
                                Available
                              </Text>
                            </Box>
                            <Box flex={1} overflowY="auto" p={1}>
                              {availableCerts.map((cert) => (
                                <Box
                                  key={cert}
                                  px={3}
                                  py={2}
                                  cursor="pointer"
                                  bg={
                                    selectedAvailable.includes(cert)
                                      ? "#00BBF2"
                                      : "transparent"
                                  }
                                  _hover={{
                                    bg: selectedAvailable.includes(cert)
                                      ? "#00BBF2"
                                      : "droidalBlack.300",
                                  }}
                                  onClick={() => {
                                    setSelectedAvailable((prev) =>
                                      prev.includes(cert)
                                        ? prev.filter((c) => c !== cert)
                                        : [...prev, cert]
                                    );
                                  }}
                                >
                                  <Text fontSize="xs" color="white" isTruncated>
                                    {cert}
                                  </Text>
                                </Box>
                              ))}
                            </Box>
                          </VStack>

                          <VStack justify="center" spacing={3}>
                            <CustomButton
                              size="sm"
                              onClick={moveRight}
                              leftIcon={<LuChevronRight size={16} />}
                              isDisabled={selectedAvailable.length === 0}
                            />
                            <CustomButton
                              size="sm"
                              onClick={moveLeft}
                              leftIcon={<LuChevronLeft size={16} />}
                              isDisabled={selectedSelected.length === 0}
                            />
                          </VStack>

                          <VStack
                            spacing={0}
                            border="1px solid #2f4d78"
                            bg="droidalBlack.400"
                            borderRadius="md"
                            overflow="hidden"
                          >
                            <Box
                              px={3}
                              py={2}
                              bg="droidalBlack.500"
                              borderBottom="1px solid #2f4d78"
                            >
                              <Text
                                fontSize="sm"
                                color="white"
                                fontWeight="medium"
                              >
                                Selected
                              </Text>
                            </Box>
                            <Box flex={1} overflowY="auto" p={1}>
                              {selectedCerts.map((cert) => (
                                <Box
                                  key={cert}
                                  px={3}
                                  py={2}
                                  cursor="pointer"
                                  bg={
                                    selectedSelected.includes(cert)
                                      ? "#00BBF2"
                                      : "transparent"
                                  }
                                  _hover={{
                                    bg: selectedSelected.includes(cert)
                                      ? "#00BBF2"
                                      : "droidalBlack.300",
                                  }}
                                  onClick={() => {
                                    setSelectedSelected((prev) =>
                                      prev.includes(cert)
                                        ? prev.filter((c) => c !== cert)
                                        : [...prev, cert]
                                    );
                                  }}
                                >
                                  <Text fontSize="xs" color="white" isTruncated>
                                    {cert}
                                  </Text>
                                </Box>
                              ))}
                            </Box>
                          </VStack>
                        </Grid>
                      </VStack>
                    </VStack>

                    <VStack spacing={6} align="stretch">
                      <VStack align="stretch" spacing={2}>
                        <Text
                          fontSize="sm"
                          color="white"
                          fontWeight="light"
                          letterSpacing="wide"
                        >
                          Round Trip Purpose Description
                        </Text>
                        <Textarea
                          bg="droidalBlack.300"
                          border="1px solid #2f4d78"
                          _focus={{
                            borderColor: "#00BBF2",
                            boxShadow: "0 0 0 2px #00BBF2",
                          }}
                          minH="120px"
                          resize="vertical"
                          fontSize="sm"
                          value={
                            localAmbulanceDetail?.round_trip_description || ""
                          }
                          onChange={(e) =>
                            setLocalAmbulanceDetail((prev) => ({
                              ...prev,
                              round_trip_description: e.target.value,
                            }))
                          }
                          placeholder="Describe reason for round trip..."
                        />
                      </VStack>
                      <VStack align="stretch" spacing={2}>
                        <Text
                          fontSize="sm"
                          color="white"
                          fontWeight="light"
                          letterSpacing="wide"
                        >
                          Stretcher Purpose
                        </Text>
                        <Textarea
                          bg="droidalBlack.300"
                          border="1px solid #2f4d78"
                          _focus={{
                            borderColor: "#00BBF2",
                            boxShadow: "0 0 0 2px #00BBF2",
                          }}
                          minH="120px"
                          resize="vertical"
                          fontSize="sm"
                          value={localAmbulanceDetail?.stretcher_purpose || ""}
                          onChange={(e) =>
                            setLocalAmbulanceDetail((prev) => ({
                              ...prev,
                              stretcher_purpose: e.target.value,
                            }))
                          }
                          placeholder="Explain why stretcher was medically necessary..."
                        />
                      </VStack>
                    </VStack>
                  </Grid>
                </Accordion.ItemBody>
              </Accordion.ItemContent>
            </Accordion.Item>
          </Accordion.Root>
        </VStack>
      </DndProvider>
    );
  }
);

export default EncounterGeneral;

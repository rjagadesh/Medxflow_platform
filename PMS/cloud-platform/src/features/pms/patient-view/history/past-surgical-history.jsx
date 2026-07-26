import React, { useEffect, useState } from "react";
import {
  Checkbox,
  Box,
  Text,
  SimpleGrid,
  Textarea,
  Button,
  VStack,
  Flex,
  Bleed,
  Icon,
} from "@chakra-ui/react";
import { FaRegCommentDots } from "react-icons/fa";
import { useNavigate, useParams } from "react-router-dom";
import { useGetPatientHistory } from "@/hooks/query/pms/patient-history/useGetPatientHistory";
import { useSavePatientHistory } from "@/hooks/mutation/pms/patient-history/useSavePatientHistory";
import { toaster } from "@/components/ui/toaster";

const column1 = [
  { label: "Vasectomy", hasComment: false },
  { label: "Tonsillectomy/Adenoidectomy", hasComment: false },
  { label: "TURP", hasComment: false },
  { label: "T&A/TSO", hasComment: false },
  { label: "Spinal fusion", hasComment: false },
  { label: "Skin cancer excision", hasComment: false },
  { label: "Sinus surgery", hasComment: false },
  { label: "Rotator cuff surgery", hasComment: false },
  { label: "Prostatectomy", hasComment: false },
];

const column2 = [
  { label: "Prostate surgery", hasComment: false },
  { label: "Pacemaker/defibrillator", hasComment: false },
  { label: "PTCA/PCI", hasComment: false },
  { label: "Nasal surgery", hasComment: true },
  { label: "Laminotomy", hasComment: false },
  { label: "LASIK", hasComment: false },
  { label: "Knee arthroplasty", hasComment: false },
  { label: "Inguinal hernia repair", hasComment: false },
  { label: "Hysterectomy", hasComment: false },
];

const column3 = [
  { label: "Hip replacement", hasComment: false },
  { label: "Hip arthroplasty", hasComment: false },
  { label: "Hemorrhoid surgery", hasComment: false },
  { label: "Dilation and curettage", hasComment: false },
  { label: "Cholecystectomy/bile duct", hasComment: false },
  { label: "Cesarean section", hasComment: false },
  { label: "Cataract/lens surgery", hasComment: false },
  { label: "Carpal tunnel release surgery", hasComment: false },
  { label: "Carotid endarterectomy/stent", hasComment: false },
];

const column4 = [
  { label: "CABG", hasComment: false },
  { label: "Breast reduction/mastectomy", hasComment: false },
  { label: "Bilateral tubal ligation", hasComment: false },
  { label: "Bariatric surgery/gastric bypass", hasComment: false },
  { label: "Back surgery", hasComment: false },
  { label: "Appendectomy", hasComment: false },
  { label: "Aneurysm repair", hasComment: false },
];

const PastSurgicalHistory = () => {
  const { patient_id: patientId } = useParams();
  const [selectedSurgeries, setSelectedSurgeries] = useState([]);
  const [existingNames, setExistingNames] = useState([]);
  const [notes, setNotes] = useState("");
  const [customItems] = useState(["Colonoscopy"]);
  const navigate = useNavigate();

  const { data: historyData } = useGetPatientHistory(patientId, "surgical");
  const { mutate: saveHistory, isPending: isSaving } = useSavePatientHistory();

  // Seed the selected surgeries from previously saved history
  useEffect(() => {
    const names = (historyData?.history || []).map((h) => h.name);
    if (names.length) {
      setExistingNames(names);
      setSelectedSurgeries((prev) =>
        Array.from(new Set([...prev, ...names]))
      );
    }
  }, [historyData]);

  const handleSave = () => {
    // POST appends, so only create surgeries that aren't already saved.
    // NOTE: unchecking does not delete an existing entry yet (needs a DELETE
    // pass keyed on entry id) — TODO when the UI exposes per-row removal.
    const newItems = selectedSurgeries
      .filter((name) => !existingNames.includes(name))
      .map((name) => ({
        patient: patientId,
        history_type: "surgical",
        name,
      }));

    if (!newItems.length) {
      toaster.info?.({
        title: "No changes",
        description: "No new surgeries to save",
      });
      navigate(-1);
      return;
    }

    saveHistory(newItems, {
      onSuccess: () => {
        toaster.success({
          title: "Saved",
          description: "Past surgical history has been saved",
        });
        navigate(-1);
      },
      onError: (error) => {
        toaster.error({
          title: "Error",
          description: error?.detail || "Failed to save history",
        });
      },
    });
  };

  const handleSurgeryChange = (surgery, checked) => {
    if (checked) {
      setSelectedSurgeries([...selectedSurgeries, surgery]);
    } else {
      setSelectedSurgeries(selectedSurgeries.filter((s) => s !== surgery));
    }
  };

  const renderSurgeryItem = (item) => (
    <Flex key={item.label} align="center" gap={2} position={"relative"}>
      <Checkbox.Root
        checked={selectedSurgeries.includes(item.label)}
        onCheckedChange={(e) => handleSurgeryChange(item.label, !!e.checked)}
      >
        <Checkbox.HiddenInput />
        <Checkbox.Control
          _checked={{
            bgImage:
              "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
          }}
          borderColor="#2f4d78"
          bgColor={"black"}
        >
          <Checkbox.Indicator />
        </Checkbox.Control>
        <Checkbox.Label
          letterSpacing={"widest"}
          color="white"
          fontSize="xs"
          lineHeight="1.2"
          fontWeight={"light"}
          mr={1}
        >
          {item.label}
        </Checkbox.Label>
      </Checkbox.Root>
      {item.hasComment && (
        <Icon as={FaRegCommentDots} color="primary.400" boxSize={3} />
      )}
    </Flex>
  );

  return (
    <Box
      p={6}
      h={"full"}
      flex={1}
      bg="droidalBlack.400"
      borderRadius="md"
      color="white"
    >
      <Text fontSize="2xl" fontWeight="light" mb={6}>
        Past Surgical History
      </Text>

      {/* Common Surgeries Section */}
      <Box mb={6}>
        <Text fontSize="sm" fontWeight="bold" mb={3} color="white">
          Common Surgeries
        </Text>
        <SimpleGrid columns={[1, 2, 4]} gap={6} mb={6} alignItems="start">
          <VStack align="start" gap={1}>
            {column1.map(renderSurgeryItem)}
          </VStack>
          <VStack align="start" gap={1}>
            {column2.map(renderSurgeryItem)}
          </VStack>
          <VStack align="start" gap={1}>
            {column3.map(renderSurgeryItem)}
          </VStack>
          <VStack align="start" gap={1}>
            {column4.map(renderSurgeryItem)}
          </VStack>
        </SimpleGrid>
      </Box>

      {/* Custom Items */}
      <Box mb={6}>
        <Text fontSize="sm" fontWeight="bold" mb={2}>
          Custom Items
        </Text>
        <VStack align="start" gap={2} mb={4}>
          {customItems.map((item) => (
            <Checkbox.Root
              key={item}
              checked={selectedSurgeries.includes(item)}
              onCheckedChange={(e) => handleSurgeryChange(item, !!e.checked)}
            >
              <Checkbox.HiddenInput />
              <Checkbox.Control
                _checked={{
                  bgImage:
                    "linear-gradient(0deg,rgba(0, 91, 127, 1) 0%, rgba(0, 187, 242, 1) 72%)",
                }}
                borderColor="#2f4d78"
                bgColor={"black"}
              >
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Checkbox.Label
                letterSpacing={"widest"}
                color="white"
                fontSize="xs"
                fontWeight={"light"}
              >
                {item}
              </Checkbox.Label>
            </Checkbox.Root>
          ))}
        </VStack>
        <Flex gap={4}>
          <Button
            size="sm"
            variant="outline"
            borderColor="droidalGray.300"
            color="white"
            _hover={{ bg: "droidalGray.600" }}
          >
            + Custom Item
          </Button>
          <Button
            size="sm"
            variant="outline"
            borderColor="droidalGray.300"
            color="white"
            _hover={{ bg: "droidalGray.600" }}
          >
            Edit Custom Items
          </Button>
        </Flex>
      </Box>

      {/* Comments */}
      <VStack align="stretch" gap={2}>
        <Text fontSize="md" fontWeight="medium">
          Comments:
        </Text>
        <Textarea
          placeholder=""
          bg="droidalBlack.300"
          color="white"
          borderColor="droidalGray.300"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          _placeholder={{ color: "droidalGray.400" }}
          rows={4}
          maxLength={2000}
        />
        <Text fontSize="xs" color="droidalGray.400" textAlign="right">
          {2000 - notes.length} characters remaining
        </Text>
      </VStack>

      {/* Footer */}
      <Bleed
        inline={4}
        mt={6}
        display={"flex"}
        justifyContent="flex-end"
        gap={4}
        position="absolute"
        w="calc(100vw - 170px)"
        bottom={0}
        zIndex={10}
        bg="droidalBlack.500"
        h="60px"
        borderTop="1px solid #2f4d78"
        alignItems="center"
        px={4}
      >
        <Button
          variant="outline"
          borderColor="droidalGray.300"
          color="white"
          _hover={{ bg: "droidalGray.600" }}
          onClick={() => {
            navigate(-1);
          }}
        >
          Cancel
        </Button>
        <Button
          bg="primary.500"
          color="white"
          _hover={{ bg: "primary.600" }}
          loading={isSaving}
          onClick={handleSave}
        >
          Save
        </Button>
      </Bleed>
    </Box>
  );
};

export default PastSurgicalHistory;

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
import CustomSelect from "../../../../components/ui/select";
import { useNavigate, useParams } from "react-router-dom";
import { useGetPatientHistory } from "@/hooks/query/pms/patient-history/useGetPatientHistory";
import { useSavePatientHistory } from "@/hooks/mutation/pms/patient-history/useSavePatientHistory";
import { toaster } from "@/components/ui/toaster";

const bloodTypeOptions = [
  { label: "A", value: "A" },
  { label: "B", value: "B" },
  { label: "AB", value: "AB" },
  { label: "O", value: "O" },
];

const rhOptions = [
  { label: "+", value: "+" },
  { label: "-", value: "-" },
];

const column1 = [
  {
    title: "Head",
    items: [{ label: "Trauma", hasComment: false }],
  },
  {
    title: "Eyes",
    items: [
      { label: "Wears glasses/contacts", hasComment: false },
      { label: "Glaucoma" },
      { label: "Cataracts" },
      { label: "Blindness" },
    ],
  },
  {
    title: "Ears",
    items: [{ label: "Hearing aids" }],
  },
  {
    title: "Nose/Sinuses",
    items: [{ label: "Sinus infections" }, { label: "Allergic Rhinitis" }],
  },
  {
    title: "Mouth/Throat/Teeth",
    items: [{ label: "Dentures" }],
  },
  {
    title: "Cardiovascular",
    items: [
      { label: "Other heart disease" },
      { label: "Myocardial infarction" },
      { label: "Murmur" },
      { label: "HTN" },
      { label: "Dysrhythmia" },
      { label: "DVT" },
      { label: "Angina" },
      { label: "Aneurysm" },
    ],
  },
];

const column2 = [
  {
    title: "Respiratory",
    items: [
      { label: "Pneumonia" },
      { label: "Pleuritis" },
      { label: "COPD - Bronchitis/Emphysema" },
      { label: "Bronchitis" },
      { label: "Asthma" },
    ],
  },
  {
    title: "Gastrointestinal",
    items: [
      { label: "Ulcer" },
      { label: "Jaundice" },
      { label: "Hiatal hernia" },
      { label: "Hepatitis" },
      { label: "Hemorrhoids" },
      { label: "Heartburn" },
      { label: "Gallbladder disease" },
      { label: "GERD" },
      { label: "Cirrhosis" },
    ],
  },
  {
    title: "Genitourinary",
    items: [
      { label: "UTI(s)" },
      { label: "STDs" },
      { label: "Other kidney disease" },
      { label: "Nephrolithiasis" },
      { label: "Incontinence" },
      { label: "Hernia" },
    ],
  },
];

const column3 = [
  {
    title: "Musculoskeletal",
    items: [{ label: "M/S injury" }, { label: "Gout" }, { label: "Arthritis" }],
  },
  {
    title: "Skin",
    items: [
      { label: "Psoriasis" },
      { label: "Other skin condition(s)" },
      { label: "Mole(s)" },
      { label: "Dermatitis" },
    ],
  },
  {
    title: "Neurological",
    items: [
      { label: "TIA" },
      { label: "Stroke" },
      { label: "Severe headaches, migraines" },
      { label: "Seizures" },
      { label: "Epilepsy" },
    ],
  },
  {
    title: "Psychiatric",
    items: [
      { label: "Suicide attempts" },
      { label: "Suicidal ideation" },
      { label: "Hallucinations, delusions" },
      { label: "Depression" },
      { label: "Bipolar disorder" },
    ],
  },
];

const column4 = [
  {
    title: "Endocrine",
    items: [
      { label: "Type II DM" },
      { label: "Type I DM" },
      { label: "Thyroiditis" },
      { label: "Thyroid disease" },
      { label: "Hypothyroidism" },
      { label: "Hyperlipidemia" },
      { label: "Goiter" },
    ],
  },
  {
    title: "Heme/Onc",
    items: [{ label: "Cancer" }, { label: "Anemia" }],
  },
  {
    title: "Infectious",
    items: [
      { label: "Tuberculosis (exposure)" },
      { label: "Tuberculosis (dz)" },
      { label: "STDs" },
      { label: "HIV" },
    ],
  },
];

const PastMedicalHistory = () => {
  const { patient_id: patientId } = useParams();
  const [selectedConditions, setSelectedConditions] = useState([]);
  const [existingNames, setExistingNames] = useState([]);
  const [bloodType, setBloodType] = useState([]);
  const [rhFactor, setRhFactor] = useState([]);
  const [notes, setNotes] = useState("");
  const [customItems] = useState(["Spina bifida"]);
  const navigate = useNavigate();

  const { data: historyData } = useGetPatientHistory(patientId, "medical");
  const { mutate: saveHistory, isPending: isSaving } = useSavePatientHistory();

  // Seed the selected conditions from previously saved history
  useEffect(() => {
    const names = (historyData?.history || []).map((h) => h.name);
    if (names.length) {
      setExistingNames(names);
      setSelectedConditions((prev) =>
        Array.from(new Set([...prev, ...names]))
      );
    }
  }, [historyData]);

  const handleSave = () => {
    // POST appends, so only create conditions that aren't already saved.
    // NOTE: unchecking does not delete an existing entry yet (needs a DELETE
    // pass keyed on entry id) — TODO when the UI exposes per-row removal.
    const newItems = selectedConditions
      .filter((name) => !existingNames.includes(name))
      .map((name) => ({
        patient: patientId,
        history_type: "medical",
        name,
      }));

    if (!newItems.length) {
      toaster.info?.({
        title: "No changes",
        description: "No new conditions to save",
      });
      navigate(-1);
      return;
    }

    saveHistory(newItems, {
      onSuccess: () => {
        toaster.success({
          title: "Saved",
          description: "Past medical history has been saved",
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

  const handleConditionChange = (condition, checked) => {
    if (checked) {
      setSelectedConditions([...selectedConditions, condition]);
    } else {
      setSelectedConditions(selectedConditions.filter((c) => c !== condition));
    }
  };

  const renderCategory = (category) => (
    <Box key={category.title} mb={6}>
      <Text fontSize="sm" fontWeight="bold" mb={2} color="white">
        {category.title}
      </Text>
      <VStack align="start" gap={1}>
        {category.items.map((item) => (
          <Flex key={item.label} align="center" gap={2}>
            <Checkbox.Root
              checked={selectedConditions.includes(item.label)}
              onCheckedChange={(e) =>
                handleConditionChange(item.label, !!e.checked)
              }
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
                color="white"
                fontSize="xs"
                lineHeight="1.2"
                mr={1}
                letterSpacing={"widest"}
                fontWeight={"light"}
              >
                {item.label}
              </Checkbox.Label>
            </Checkbox.Root>
            {item.hasComment && (
              <Icon as={FaRegCommentDots} color="primary.400" boxSize={3} />
            )}
          </Flex>
        ))}
      </VStack>
    </Box>
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
        Past Medical History (PMHx)
      </Text>

      {/* Blood Type and RH */}
      <Box mb={6}>
        <Text fontSize="sm" fontWeight="bold" mb={2} color="white">
          Blood Type and RH
        </Text>
        <Flex gap={4}>
          <Box w="150px">
            <CustomSelect
              options={bloodTypeOptions}
              value={bloodType}
              onValueChange={setBloodType}
              placeholder="Select"
              borderRadius="md"
            />
          </Box>
          <Box w="150px">
            <CustomSelect
              options={rhOptions}
              value={rhFactor}
              onValueChange={setRhFactor}
              placeholder="Select"
              borderRadius="md"
            />
          </Box>
        </Flex>
      </Box>

      {/* Conditions Grid */}
      <SimpleGrid columns={[1, 2, 4]} gap={6} mb={6} alignItems="start">
        <Box>{column1.map(renderCategory)}</Box>
        <Box>{column2.map(renderCategory)}</Box>
        <Box>{column3.map(renderCategory)}</Box>
        <Box>{column4.map(renderCategory)}</Box>
      </SimpleGrid>

      {/* Custom Items */}
      <Box mb={6}>
        <Text fontSize="sm" fontWeight="bold" mb={2}>
          Custom Items
        </Text>
        <VStack align="start" gap={2} mb={4}>
          {customItems.map((item) => (
            <Checkbox.Root
              key={item}
              checked={selectedConditions.includes(item)}
              onCheckedChange={(e) => handleConditionChange(item, !!e.checked)}
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
        position="sticky"
        bottom={0}
        zIndex={10}
        bg="droidalBlack.500"
        h="60px"
        borderTop="1px solid #2f4d78"
        alignItems="center"
        px={4}
        // py={4}
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

export default PastMedicalHistory;

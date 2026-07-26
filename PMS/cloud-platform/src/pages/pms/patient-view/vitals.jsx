import React, { useState, useContext } from "react";
import { Box, Text, HStack } from "@chakra-ui/react";
import GenericTable from "../../../components/table/table";
import CustomButton from "../../../components/button/button";
import VitalModal from "@/features/pms/encounter-notes/add-edit-vitals";
import { useGetVitals } from "@/hooks/query/pms/vitals/useGetVitals";
import { useParams } from "react-router-dom";
import { format } from "date-fns";
import { EncounterNotesContext } from "../encounter/encounter-notes/encounter-notes-context";

const Vitals = ({ onClose }) => {
  const { patient_id: patientId } = useParams();
  const { data } = useGetVitals(patientId);
  const [selectedIds, setSelectedIds] = useState([]);
  const encounterContext = useContext(EncounterNotesContext);
  const vitalsList = data?.vitals;
  const count = data?.count;

  const formatHeight = (inches) => {
    if (!inches) return "";
    const totalInches = parseFloat(inches);
    const feet = Math.floor(totalInches / 12);
    const remainingInches = Math.round(totalInches % 12);
    return `${feet}' ${remainingInches}"`;
  };

  const formatWeight = (lbs, oz) => {
    if (lbs === undefined && oz === undefined) return "";
    return `${lbs || 0} lbs ${oz || 0}\noz`;
  };

  const handleInclude = () => {
    if (encounterContext) {
      const newIds = selectedIds;
      const vitalsMap = new Map((vitalsList || []).map((v) => [v.id, v]));

      const formatVital = (vital) => {
        const parts = [];
        if (vital.recorded_at)
          parts.push(
            `Recorded: ${format(
              new Date(vital.recorded_at),
              "dd MMM yyyy hh:mm a",
            )}`,
          );
        if (vital.systolic_bp && vital.diastolic_bp)
          parts.push(`BP: ${vital.systolic_bp}/${vital.diastolic_bp}`);
        if (vital.heart_rate) parts.push(`HR: ${vital.heart_rate}`);
        if (vital.respiratory_rate) parts.push(`RR: ${vital.respiratory_rate}`);
        if (vital.temperature_f) parts.push(`Temp: ${vital.temperature_f}°F`);
        if (vital.height_in)
          parts.push(`Height: ${formatHeight(vital.height_in)}`);
        if (vital.weight_lbs || vital.weight_oz)
          parts.push(
            `Weight: ${formatWeight(vital.weight_lbs, vital.weight_oz).replace(
              "\n",
              " ",
            )}`,
          );
        if (vital.bmi) parts.push(`BMI: ${vital.bmi}`);
        if (vital.head_circumference_in)
          parts.push(`Head Circ: ${vital.head_circumference_in}`);
        if (vital.spo2) parts.push(`SpO2: ${vital.spo2}%`);
        if (vital.inhaled_o2) parts.push(`Inhaled O2: ${vital.inhaled_o2}`);

        return parts.join(", ");
      };

      const selectedItems = newIds
        .map((id) => vitalsMap.get(id))
        .filter(Boolean);

      const generatedNote = selectedItems.map(formatVital).join("\n");

      encounterContext.updateSectionData("Vitals", {
        generated_note: generatedNote,
        selected_ids: newIds,
      });

      if (onClose) {
        onClose();
      }
    }
  };

  const mappedVitals = (vitalsList || []).map((vital) => ({
    id: vital.id,
    recorded: vital.recorded_at
      ? format(new Date(vital.recorded_at), "dd MMM yyyy\nhh:mm a")
      : "",
    bp:
      vital.systolic_bp && vital.diastolic_bp
        ? `${vital.systolic_bp} /\n${vital.diastolic_bp}`
        : "",
    hr: vital.heart_rate,
    rr: vital.respiratory_rate,
    temp: vital.temperature_f ? `${vital.temperature_f}\n°F` : "",
    height: formatHeight(vital.height_in),
    weight: formatWeight(vital.weight_lbs, vital.weight_oz),
    bmi: vital.bmi,
    head_circ: vital.head_circumference_in,
    spo2: vital.spo2 ? `${vital.spo2}%` : "",
    inhaled_o2: vital.inhaled_o2,
  }));

  const columns = [
    {
      title: "RECORDED",
      accessor_key: "recorded",
      render: (value) => (
        <Text whiteSpace="pre-line" color="white">
          {value}
        </Text>
      ),
    },

    {
      title: "BP",
      accessor_key: "bp",
      render: (value) => (
        <Text whiteSpace="pre-line" color="white">
          {value}
        </Text>
      ),
    },
    {
      title: "HR",
      accessor_key: "hr",
      render: (value) => <Text color="white">{value}</Text>,
    },
    {
      title: "RR",
      accessor_key: "rr",
      render: (value) => <Text color="white">{value}</Text>,
    },
    {
      title: "TEMP",
      accessor_key: "temp",
      render: (value) => (
        <Text whiteSpace="pre-line" color="white">
          {value}
        </Text>
      ),
    },
    {
      title: "HT/LT.",
      accessor_key: "height",
      render: (value) => <Text color="white">{value}</Text>,
    },
    {
      title: "WEIGHT",
      accessor_key: "weight",
      render: (value) => (
        <Text whiteSpace="pre-line" color="white">
          {value}
        </Text>
      ),
    },
    {
      title: "BMI",
      accessor_key: "bmi",
      render: (value) => <Text color="white">{value}</Text>,
    },
    {
      title: "HEAD CIRC",
      accessor_key: "head_circ",
      render: (value) => <Text color="white">{value}</Text>,
    },
    {
      title: "SpO2",
      accessor_key: "spo2",
      render: (value) => <Text color="white">{value}</Text>,
    },
    {
      title: "INHALED O2",
      accessor_key: "inhaled_o2",
      render: (value) => <Text color="white">{value}</Text>,
    },
  ];

  return (
    <Box h="full" w="full" p={4} overflow="hidden">
      <GenericTable
        title="Vitals"
        columns={columns}
        data={mappedVitals}
        count={count || 0}
        minWidth="1000px"
        selection={{
          selectable: true,
          onSelectChange: setSelectedIds,
          defaultSelected: selectedIds,
        }}
        rightAction={
          <HStack>
            <CustomButton onClick={handleInclude}>Include</CustomButton>
            <VitalModal />
          </HStack>
        }
        showActionBar={false}
      />
    </Box>
  );
};

export default Vitals;

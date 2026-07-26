import { Box, Flex, Text, Input } from "@chakra-ui/react";
import { useState } from "react";

/* ---------- Reusable Row ---------- */
const SummaryRow = ({ label, value, editable, onChange, prefix }) => {
  const [error, setError] = useState("");

  const handleChange = (val) => {
    // allow empty while typing
    if (val === "") {
      setError("");
      onChange(0);
      return;
    }

    // numbers only (integer or decimal)
    if (!/^\d*\.?\d*$/.test(val)) {
      setError("Only numbers are allowed");
      return;
    }

    setError("");
    onChange(Number(val));
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" py={1}>
        <Text fontSize="16px" color="gray.400">
          {label}
        </Text>

        {editable ? (
          <Flex align="center">
            {prefix && (
              <Text fontSize="18px" fontWeight="500" textAlign={"right"}>
                {prefix}
              </Text>
            )}
            <Input
              width={`${Math.max(value?.length - 1 || 1, 1)}ch`}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              type="text"
              variant="unstyled"
              textAlign="right"
              fontSize="18px"
              fontWeight="500"
              color="white"
              p={0}
            />
          </Flex>
        ) : (
          <Text fontSize="18px" color="white" fontWeight="500" pl={"23px"}>
            {value}
          </Text>
        )}
      </Flex>

      {error && (
        <Text fontSize="12px" color="red.400" textAlign="right" mt="-2px">
          {error}
        </Text>
      )}
    </Box>
  );
};

/* ---------- Summary Component ---------- */
export default function ClaimSummary({ summary }) {
  if (!summary) return null;

  summary.adjustments = 0;
  summary.total_payments = 0;
  summary.patient_balance = 0;

  const [units, setUnits] = useState(summary.units);
  const [unitCharge, setUnitCharge] = useState(summary.unit_charge);

  const totalCharges = units * unitCharge;
  const insuranceBalance =
    totalCharges - summary.adjustments - summary.total_payments;
  const totalBalance = insuranceBalance + summary.patient_balance;

  return (
    <Box
      bg="#1f1f1f"
      border="1px solid #2a2a2a"
      borderRadius="lg"
      p={5}
      w="320px"
      minH={"40vh"}
      color="white"
    >
      <Text fontSize="18px" fontWeight="600" mb={4}>
        Summary
      </Text>

      <SummaryRow label="Units" value={units} editable onChange={setUnits} />

      <SummaryRow
        label="Unit Charge"
        value={unitCharge.toFixed(2)}
        editable
        prefix="$"
        onChange={setUnitCharge}
      />

      <SummaryRow label="Total Charges" value={`$${totalCharges.toFixed(2)}`} />

      <SummaryRow
        label="Adjustments"
        value={`$${summary.adjustments?.toFixed(2)}`}
      />

      <SummaryRow
        label="Total Payments"
        value={`$${summary.total_payments?.toFixed(2)}`}
      />

      <SummaryRow
        label="Patient Balance"
        value={`$${summary.patient_balance?.toFixed(2)}`}
      />

      <SummaryRow
        label="Insurance Balance"
        value={`$${insuranceBalance?.toFixed(2)}`}
      />

      <SummaryRow
        label="Total Balance"
        value={`$${totalBalance?.toFixed(2)}`}
      />
    </Box>
  );
}
